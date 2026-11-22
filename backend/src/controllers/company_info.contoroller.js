import { asyncHandler } from "../utils/async_handler.js";
import { ApiResponse } from "../utils/api_response.js";
import { ApiError } from "../utils/api_error.js";
import { PrismaClient } from "@prisma/client";
import { getAuth } from '@clerk/express';
import { researchAndAnalysis } from "../services/analysysAndResearch.js";
import { researchAndAnalysisV2 } from "../services/analysisV2.js";
import { resolveCompany } from "../services/resolveCompany.js";
import { redisClient } from "../../redis/index.js";

const prisma = new PrismaClient();

const analyze = process.env.USE_V2 === "false" ? researchAndAnalysis : researchAndAnalysisV2;

const getCompanyCacheKey = (companyName) =>
    `companyInfo:${companyName.trim().toLowerCase().replace(/\s+/g, " ")}`;

const resolveCompanyHandler = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { company_name } = req.body;

    console.log(`🔍 [Company] resolveCompany request received:`, { company_name, userId });

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    if (
        !company_name ||
        typeof company_name !== "string" ||
        company_name.trim().length < 2 ||
        company_name.trim().length > 100
    ) {
        throw new ApiError(400, "Company name must be between 2 and 100 characters");
    }

    const result = await resolveCompany(company_name);
    console.log(`🎯 [Company] resolveCompany result for "${company_name}":`, {
        status: result.status,
        candidate: result.candidate?.ticker || `${result.candidates?.length || 0} candidates`
    });

    return res.status(200).json(new ApiResponse(200, result, "Company resolved successfully"));
});

const createCompanyInfo = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { company_name, companyNodeData, workspaceId, ticker } = req.body;  // workspaceId from body, not getAuth

    console.log("[Company] createCompanyInfo request received:", { company_name, ticker, workspaceId, userId });

    if (!userId) {
        console.warn("[Company] createCompanyInfo failed: Unauthorized");
        throw new ApiError(401, "Unauthorized");
    }
    if (
        !company_name ||
        typeof company_name !== "string" ||
        company_name.trim().length === 0 ||
        company_name.trim().length > 100
    ) {
        throw new ApiError(400, "Company name must be a string between 1 and 100 characters");
    }
    if (ticker !== undefined && ticker !== null) {
        if (typeof ticker !== "string" || !/^[A-Za-z0-9.&\-^=]{1,20}$/.test(ticker)) {
            throw new ApiError(400, "Invalid ticker format");
        }
    }
    if (!workspaceId) {
        throw new ApiError(400, "Workspace ID is required");
    }
    
    const workspaceExists = await prisma.workspace.findUnique({
        where: { id: parseInt(workspaceId) }
    });

    if (!workspaceExists) {
        console.warn(`[Company] Workspace ${workspaceId} not found`);
        throw new ApiError(404, "Workspace not found");
    }

    if (workspaceExists.ownerId !== userId) {
        console.warn(`[Company] Unauthorized access to workspace ${workspaceId} by user ${userId}`);
        throw new ApiError(403, "You do not have permission to add to this workspace");
    }

    const key = ticker ? `companyInfo:${ticker.toLowerCase()}` : getCompanyCacheKey(company_name);

    const redisData = await redisClient.get(key);
    if (redisData) {
        console.log(`[Company] Cache HIT for key: ${key}`);
        return res.status(200).json(
            new ApiResponse(200, JSON.parse(redisData), "Company info fetched successfully from cache")
        );
    }

    console.log(`[Company] Cache MISS for ${key} -> Initiating AI analysis workflow for "${company_name}" (ticker: ${ticker || "none"}, USE_V2: ${process.env.USE_V2 !== "false"})...`);

    try {
        const analysisResult = await analyze(
            ticker ? { companyName: company_name, ticker } : { companyName: company_name }
        );
        console.log(`[Company] AI analysis successfully completed for "${company_name}"`);

        let parsedResult = analysisResult;
        if (typeof analysisResult === 'string') {
            try {
                parsedResult = JSON.parse(analysisResult);
            } catch (e) {
                console.warn("[Company] Failed to parse analysisResult JSON string:", e);
            }
        }

        const companyInfo = await prisma.company.create({
            data: {
                name: company_name,
                workspaceId: parseInt(workspaceId),
                rawData: parsedResult,
                companyNodeData: companyNodeData || null
            }
        });
        console.log(`[Company] Created company in DB with ID: ${companyInfo.id}`);

        await redisClient.set(key, JSON.stringify(companyInfo), {EX: 60*10});
        console.log(`[Company] Cached company info at ${key} (TTL: 10m)`);

        // Invalidate workspace cache
        try {
            await redisClient.del(`workspace:${parseInt(workspaceId)}`);
            console.log(`[Company] Invalidated cache for workspace:${parseInt(workspaceId)}`);
        } catch (err) {
            console.error("Redis deletion error:", err);
        }

        return res.status(201).json(
            new ApiResponse(201, companyInfo, "Company info created successfully")
        );
    } catch (error) {
        console.error("Error in createCompanyInfo:", error);
        if (error.statusCode === 429 || error.name === "RateLimitError") {
            throw new ApiError(429, "AI service is temporarily rate-limited. Please wait a moment and try again.");
        }
        throw new ApiError(500, error.message || "Something went wrong in createCompanyInfo");
    }
});


const updateCompanyInfo = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { companyId } = req.params;

    console.log("[Company] updateCompanyInfo request received:", { companyId, userId });

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const companyExists = await prisma.company.findUnique({
        where: { id: parseInt(companyId) },
        include: { workspace: true }
    });

    if (!companyExists) {
        console.warn(`[Company] Company ${companyId} not found`);
        throw new ApiError(404, "Company not found");
    }

    if (companyExists.workspace.ownerId !== userId) {
        console.warn(`[Company] Unauthorized update for company ${companyId} by user ${userId}`);
        throw new ApiError(403, "You do not have permission to update this company");
    }

    const key = getCompanyCacheKey(companyExists.name);
    let storedTicker = companyExists.rawData?.report?.metadata?.ticker;
    if (!storedTicker && typeof companyExists.rawData === "string") {
        try {
            storedTicker = JSON.parse(companyExists.rawData)?.report?.metadata?.ticker;
        } catch (e) {}
    }

    try {
        console.log(`[Company] Re-running AI research for company "${companyExists.name}" (ID: ${companyId}) (USE_V2: ${process.env.USE_V2 !== "false"})...`);
        const analysisResult = await analyze(
            storedTicker && storedTicker !== "PRIVATE"
                ? { companyName: companyExists.name, ticker: storedTicker }
                : { companyName: companyExists.name }
        );
        const updatedCompanyInfo = await prisma.company.update({
            where: { id: parseInt(companyId) },
            data: { rawData: analysisResult }
        });
        console.log(`[Company] Updated company ${companyId} rawData in DB`);

        // Invalidate company cache and workspace cache
        try {
            await redisClient.del(key);
            if (storedTicker) {
                await redisClient.del(`companyInfo:${storedTicker.toLowerCase()}`);
            }
            await redisClient.del(`workspace:${companyExists.workspaceId}`);
            console.log(`[Company] Invalidated cache for ${key}, ticker ${storedTicker || "none"}, and workspace:${companyExists.workspaceId}`);
        } catch (err) {
            console.error("Redis deletion error:", err);
        }

        return res.status(200).json(
            new ApiResponse(200, updatedCompanyInfo, "Company info updated successfully")
        );
    } catch (error) {
        console.error("Error in updateCompanyInfo:", error);
        if (error.statusCode === 429 || error.name === "RateLimitError") {
            throw new ApiError(429, "AI service is temporarily rate-limited. Please wait a moment and try again.");
        }
        throw new ApiError(500, "Something went wrong in updateCompanyInfo");
    }
});


const removeCompanyInfo = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { companyId } = req.params;

    console.log("[Company] removeCompanyInfo request received:", { companyId, userId });

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const companyExists = await prisma.company.findUnique({
        where: { id: parseInt(companyId) },
        include: { workspace: true }
    });

    if (!companyExists) {
        console.warn(`[Company] Company ${companyId} not found`);
        throw new ApiError(404, "Company not found");
    }

    if (companyExists.workspace.ownerId !== userId) {
        console.warn(`[Company] Unauthorized removal for company ${companyId} by user ${userId}`);
        throw new ApiError(403, "You do not have permission to delete this company");
    }

    const key = getCompanyCacheKey(companyExists.name);
    let storedTicker = companyExists.rawData?.report?.metadata?.ticker;
    if (!storedTicker && typeof companyExists.rawData === "string") {
        try {
            storedTicker = JSON.parse(companyExists.rawData)?.report?.metadata?.ticker;
        } catch (e) {}
    }

    try {
        await prisma.company.delete({
            where: { id: parseInt(companyId) }
        });
        console.log(`[Company] Removed company ${companyId} from DB`);

        // Invalidate company cache and workspace cache
        try {
            await redisClient.del(key);
            if (storedTicker) {
                await redisClient.del(`companyInfo:${storedTicker.toLowerCase()}`);
            }
            await redisClient.del(`workspace:${companyExists.workspaceId}`);
            console.log(`[Company] Invalidated cache for ${key}, ticker ${storedTicker || "none"}, and workspace:${companyExists.workspaceId}`);
        } catch (err) {
            console.error("Redis deletion error:", err);
        }

        return res.status(200).json(
            new ApiResponse(200, null, "Company info removed successfully")
        );
    } catch (error) {
        console.error("Error in removeCompanyInfo:", error);
        throw new ApiError(500, "Something went wrong in removeCompanyInfo");
    }
});

export { createCompanyInfo, updateCompanyInfo, removeCompanyInfo, resolveCompanyHandler };