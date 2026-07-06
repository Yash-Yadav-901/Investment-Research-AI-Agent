import { asyncHandler } from "../utils/async_handler";
import { ApiResponse } from "../utils/api_response";
import { ApiError } from "../utils/api_error";
import { PrismaClient } from "@prisma/client";
import { getAuth } from '@clerk/express'


const prisma = new PrismaClient();

const createWorkspace = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const auth = getAuth(req);
    const userId = auth.userId;

    if (!name) {
        throw new ApiError(400, "Workspace name is required");
    }

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    try {
        const workspace = await prisma.workspace.create({
            data: {
                name,
                ownerId: userId,
            },
        });

        return res.status(201).json(new ApiResponse(201, workspace, "Workspace created successfully"));
    }
    catch (error) { 
    throw new ApiError(500, "Error while creating workspace");
}
});

const getWorkspaces = asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const userId = auth.userId; 

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    try {
        const workspaces = await prisma.workspace.findMany({
            where: {
                ownerId: userId,
            },
        });

        return res.status(200).json(new ApiResponse(200, workspaces, "Workspaces fetched successfully"));
    } catch (error) {
        throw new ApiError(500, "Error while fetching workspaces");
    }
});

const updateWorkspaceName = asyncHandler(async (req, res) => { 
    const { workspaceId, newName } = req.body;
    const auth = getAuth(req);
    const userId = auth.userId;

    if (!workspaceId || !newName) {
        throw new ApiError(400, "Workspace ID and new name are required");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    try {
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if (!workspace) {
            throw new ApiError(404, "Workspace not found");
        }
        if (workspace.ownerId !== userId) {
            throw new ApiError(403, "You do not have permission to update this workspace");
        }

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: workspaceId },
            data: { name: newName },
        });

        return res.status(200).json(new ApiResponse(200, updatedWorkspace, "Workspace name updated successfully"));
    } catch (error) {
        throw new ApiError(500, "Error while updating workspace name");
    }
});

