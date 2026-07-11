import { asyncHandler } from "../utils/async_handler";
import { ApiResponse } from "../utils/api_response";
import { ApiError } from "../utils/api_error";
import { PrismaClient } from "@prisma/client";
import { getAuth } from '@clerk/express'
import { researchAndAnalysis } from "../services/analysysAndResearch";

const prisma = new PrismaClient();


const createCompanyInfo = asyncHandler(async (req, res) => {
    const { userId, workspaceId } = getAuth(req);
    const { company_name } = req.body;

    if (!userId || !workspaceId) {
        throw new ApiError(401, "Unauthorized");
    }
    if (!company_name) {
        throw new ApiError(400, "Company name is required");
    }

    const workspaceExists = await prisma.workspace.findUnique({
        where: {
            id: workspaceId
        }
    });

    if (!workspaceExists) {
        throw new ApiError(404, "Workspace not found");
    }

    try {

        const analysisResult = await researchAndAnalysis({ companyName: company_name });
        console.log("analysisResult", analysisResult);
        const companyInfo = await prisma.company.create({
            data: {
                name: company_name,
                workspaceId: workspaceId,
                rawData: analysisResult
            }
        });

        return res.status(201).json(
            new ApiResponse(201, companyInfo, "Company info created successfully")
        );
    }
    catch (error) {
        console.log("error in createCompanyInfo", error);
        throw new ApiError(500, "Something went wrong in createCompanyInfo");
    }

});


const updateCompanyInfo = asyncHandler(async (req, res) => {
    const { userId, workspaceId } = getAuth(req);
    const { companyId } = req.params;

    if (!userId || !workspaceId) {
        throw new ApiError(401, "Unauthorized");
    }

    const companyExists = await prisma.company.findUnique({
        where: {
            id: parseInt(companyId)
        }
    });

    if (!companyExists) {
        throw new ApiError(404, "Company not found");
    }

    try {
        const analysisResult = await researchAndAnalysis({ companyName: companyExists.name });
        console.log("analysisResult", analysisResult);
        const updatedCompanyInfo = await prisma.company.update({
            where: {
                id: parseInt(companyId)
            },
            data: {
                rawData: analysisResult
            }
        });

        return res.status(200).json(
            new ApiResponse(200, updatedCompanyInfo, "Company info updated successfully")
        );
    }
    catch (error) {
        console.log("error in updateCompanyInfo", error);
        throw new ApiError(500, "Something went wrong in updateCompanyInfo");
    }

});


const removeCompanyInfo = asyncHandler(async (req, res) => {
    const { userId, workspaceId } = getAuth(req);
    const { companyId } = req.params;

    if (!userId || !workspaceId) {
        throw new ApiError(401, "Unauthorized");
    }

    const companyExists = await prisma.company.findUnique({
        where: {
            id: parseInt(companyId)
        }
    });

    if (!companyExists) {
        throw new ApiError(404, "Company not found");
    }

    try {
        await prisma.company.delete({
            where: {
                id: parseInt(companyId)
            }
        });

        return res.status(200).json(
            new ApiResponse(200, null, "Company info removed successfully")
        );
    }
    catch (error) {
        console.log("error in removeCompanyInfo", error);
        throw new ApiError(500, "Something went wrong in removeCompanyInfo");
    }

});

export { createCompanyInfo, updateCompanyInfo, removeCompanyInfo };