import { asyncHandler } from "../utils/async_handler.js";
import { ApiResponse } from "../utils/api_response.js";
import { ApiError } from "../utils/api_error.js";
import { PrismaClient } from "@prisma/client";
import { getAuth } from '@clerk/express';
import { researchAndAnalysis } from "../services/analysysAndResearch.js";

const prisma = new PrismaClient();

const createCompanyInfo = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { company_name, companyNodeData, workspaceId } = req.body;  // workspaceId from body, not getAuth

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    if (!company_name) {
        throw new ApiError(400, "Company name is required");
    }
    if (!workspaceId) {
        throw new ApiError(400, "Workspace ID is required");
    }

    const workspaceExists = await prisma.workspace.findUnique({
        where: { id: parseInt(workspaceId) }
    });

    if (!workspaceExists) {
        throw new ApiError(404, "Workspace not found");
    }

    if (workspaceExists.ownerId !== userId) {
        throw new ApiError(403, "You do not have permission to add to this workspace");
    }

    try {
        const analysisResult = await researchAndAnalysis({ companyName: company_name });
        console.log("analysisResult", analysisResult);

        let parsedResult = analysisResult;
        if (typeof analysisResult === 'string') {
            try {
                parsedResult = JSON.parse(analysisResult);
            } catch (e) {
                console.warn("Failed to parse analysisResult JSON:", e);
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

        return res.status(201).json(
            new ApiResponse(201, companyInfo, "Company info created successfully")
        );
    } catch (error) {
        console.error("Error in createCompanyInfo:", error);
        throw new ApiError(500, "Something went wrong in createCompanyInfo");
    }
});


const updateCompanyInfo = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { companyId } = req.params;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const companyExists = await prisma.company.findUnique({
        where: { id: parseInt(companyId) },
        include: { workspace: true }
    });

    if (!companyExists) {
        throw new ApiError(404, "Company not found");
    }

    if (companyExists.workspace.ownerId !== userId) {
        throw new ApiError(403, "You do not have permission to update this company");
    }

    try {
        const analysisResult = await researchAndAnalysis({ companyName: companyExists.name });
        const updatedCompanyInfo = await prisma.company.update({
            where: { id: parseInt(companyId) },
            data: { rawData: analysisResult }
        });

        return res.status(200).json(
            new ApiResponse(200, updatedCompanyInfo, "Company info updated successfully")
        );
    } catch (error) {
        console.error("Error in updateCompanyInfo:", error);
        throw new ApiError(500, "Something went wrong in updateCompanyInfo");
    }
});


const removeCompanyInfo = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { companyId } = req.params;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const companyExists = await prisma.company.findUnique({
        where: { id: parseInt(companyId) },
        include: { workspace: true }
    });

    if (!companyExists) {
        throw new ApiError(404, "Company not found");
    }

    if (companyExists.workspace.ownerId !== userId) {
        throw new ApiError(403, "You do not have permission to delete this company");
    }

    try {
        await prisma.company.delete({
            where: { id: parseInt(companyId) }
        });

        return res.status(200).json(
            new ApiResponse(200, null, "Company info removed successfully")
        );
    } catch (error) {
        console.error("Error in removeCompanyInfo:", error);
        throw new ApiError(500, "Something went wrong in removeCompanyInfo");
    }
});

export { createCompanyInfo, updateCompanyInfo, removeCompanyInfo };