import { asyncHandler } from "../utils/async_handler.js";
import { ApiResponse } from "../utils/api_response.js";
import { ApiError } from "../utils/api_error.js";
import { PrismaClient } from "@prisma/client";
import { getAuth } from '@clerk/express';


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

const deleteWorkspace = asyncHandler(async (req, res) => {
    const { workspaceId } = req.body;
    const auth = getAuth(req);
    const userId = auth.userId;

    if (!workspaceId) {
        throw new ApiError(400, "Workspace ID is required");
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
            throw new ApiError(403, "You do not have permission to delete this workspace");
        }

        await prisma.workspace.delete({
            where: { id: workspaceId },
        });

        return res.status(200).json(new ApiResponse(200, null, "Workspace deleted successfully"));
    } catch (error) {
        throw new ApiError(500, "Error while deleting workspace");
    }
});

const getWorkspaceAndCompaniesByWorkspaceId = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const auth = getAuth(req);
    const userId = auth.userId; 

    if (!workspaceId) {
        throw new ApiError(400, "Workspace ID is required");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const userExists = await prisma.user.findUnique({
        where: {
            clerkId: userId
        }
    });

    if (!userExists) {
        throw new ApiError(404, "User not found");
    }

    const workspaceExits = await prisma.workspace.findUnique({
        where: {
            id: parseInt(workspaceId)
        }
    });

    if (!workspaceExits) {
        throw new ApiError(404, "Workspace not found");
    }

    try{
       const workspaceWithCompanies = await prisma.workspace.findUnique({
            where: {
                id: parseInt(workspaceId)
            },
            include: {
                companies: true
            }
        });

        return res.status(200).json(
            new ApiResponse(200, workspaceWithCompanies, "Workspace and companies fetched successfully")
        );
    }
    catch (error) {
        throw new ApiError(500, "Error while fetching workspace and companies");
    }

});




export {
    createWorkspace,
    getWorkspaces,
    updateWorkspaceName,
    deleteWorkspace,
    getWorkspaceAndCompaniesByWorkspaceId
};

