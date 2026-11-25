import { asyncHandler } from "../utils/async_handler.js";
import { ApiResponse } from "../utils/api_response.js";
import { ApiError } from "../utils/api_error.js";
import { PrismaClient } from "@prisma/client";
import { getAuth } from '@clerk/express';
import { redisClient } from "../../redis/index.js";


const prisma = new PrismaClient();

const createWorkspace = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const auth = getAuth(req);
    const userId = auth.userId;

    console.log("[Workspace] createWorkspace request:", { name, userId });

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
        console.log(`[Workspace] Created workspace id ${workspace.id} for user ${userId}`);

        // Invalidate workspaces cache for this user
        try {
            await redisClient.del(`workspaces:${userId}`);
            console.log(`[Workspace] Cache invalidated for workspaces:${userId}`);
        } catch (err) {
            console.error("Redis deletion error:", err);
        }

        return res.status(201).json(new ApiResponse(201, workspace, "Workspace created successfully"));
    }
    catch (error) { 
        console.log("Error while creating workspace:", error);
        throw new ApiError(500, "Error while creating workspace");
    }
});

const getWorkspaces = asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const userId = auth.userId; 

    console.log("[Workspace] getWorkspaces request for user:", userId);

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const cacheKey = `workspaces:${userId}`;
    try {
        const cachedWorkspaces = await redisClient.get(cacheKey);
        if (cachedWorkspaces) {
            console.log(`[Workspace] Cache HIT for ${cacheKey}`);
            return res.status(200).json(new ApiResponse(200, JSON.parse(cachedWorkspaces), "Workspaces fetched successfully from cache"));
        }
        console.log(`[Workspace] Cache MISS for ${cacheKey}`);
    } catch (err) {
        console.error("Redis read error:", err);
    }

    try {
        const workspaces = await prisma.workspace.findMany({
            where: {
                ownerId: userId,
            },
        });
        console.log(`[Workspace] Retrieved ${workspaces.length} workspaces from DB for user ${userId}`);

        try {
            await redisClient.set(cacheKey, JSON.stringify(workspaces), { EX: 3600 });
            console.log(`[Workspace] Cached workspaces at ${cacheKey} (TTL 3600s)`);
        } catch (err) {
            console.error("Redis write error:", err);
        }

        return res.status(200).json(new ApiResponse(200, workspaces, "Workspaces fetched successfully"));
    } catch (error) {
        console.log("Error while fetching workspaces:", error);
        throw new ApiError(500, "Error while fetching workspaces");
    }
});

const updateWorkspaceName = asyncHandler(async (req, res) => { 
    const { workspaceId, newName } = req.body;
    const auth = getAuth(req);
    const userId = auth.userId;
    const parsedId = parseInt(workspaceId);

    console.log("[Workspace] updateWorkspaceName request:", { workspaceId, newName, userId });

    if (!workspaceId || !newName) {
        throw new ApiError(400, "Workspace ID and new name are required");
    }
    if (isNaN(parsedId)) {
        throw new ApiError(400, "Workspace ID must be a number");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    try {
        const workspace = await prisma.workspace.findUnique({
            where: { id: parsedId },
        });

        if (!workspace || workspace.ownerId !== userId) {
            console.warn(`[Workspace] Workspace not found or unauthorized for id ${parsedId} by user ${userId}`);
            throw new ApiError(404, "Workspace not found");
        }

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: parsedId },
            data: { name: newName },
        });
        console.log(`[Workspace] Updated workspace ${parsedId} name to "${newName}"`);

        // Invalidate workspaces list and workspace detail caches
        try {
            await redisClient.del(`workspaces:${userId}`);
            await redisClient.del(`workspace:${parsedId}`);
            console.log(`[Workspace] Cache invalidated for workspaces:${userId} and workspace:${parsedId}`);
        } catch (err) {
            console.error("Redis deletion error:", err);
        }

        return res.status(200).json(new ApiResponse(200, updatedWorkspace, "Workspace name updated successfully"));
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, "Error while updating workspace name");
    }
});

const deleteWorkspace = asyncHandler(async (req, res) => {
    const { workspaceId } = req.body;
    const auth = getAuth(req);
    const userId = auth.userId;

    console.log("[Workspace] deleteWorkspace request:", { workspaceId, userId });

    if (!workspaceId) {
        throw new ApiError(400, "Workspace ID is required");
    }

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const parsedWorkspaceId = parseInt(workspaceId);
    if (isNaN(parsedWorkspaceId)) {
        throw new ApiError(400, "Workspace ID must be a number");
    }

    try {
        const workspace = await prisma.workspace.findUnique({
            where: { id: parsedWorkspaceId },
        });
        
        if (!workspace || workspace.ownerId !== userId) {
            console.warn(`[Workspace] Workspace not found or unauthorized for delete id ${parsedWorkspaceId} by user ${userId}`);
            throw new ApiError(404, "Workspace not found");
        }

        await prisma.workspace.delete({
            where: { id: parsedWorkspaceId },
        });
        console.log(`[Workspace] Deleted workspace id ${parsedWorkspaceId}`);

        // Invalidate workspaces list and workspace detail caches
        try {
            await redisClient.del(`workspaces:${userId}`);
            await redisClient.del(`workspace:${parsedWorkspaceId}`);
            console.log(`[Workspace] Cache invalidated for workspaces:${userId} and workspace:${parsedWorkspaceId}`);
        } catch (err) {
            console.error("Redis deletion error:", err);
        }

        return res.status(200).json(new ApiResponse(200, null, "Workspace deleted successfully"));
    } catch (error) {
        throw new ApiError(500, "Error while deleting workspace");
    }
});

const getWorkspaceAndCompaniesByWorkspaceId = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const auth = getAuth(req);
    const userId = auth.userId; 

    console.log("[Workspace] getWorkspaceAndCompaniesByWorkspaceId request:", { workspaceId, userId });

    if (!workspaceId) {
        throw new ApiError(400, "Workspace ID is required");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const parsedWorkspaceId = parseInt(workspaceId);
    if (isNaN(parsedWorkspaceId)) {
        throw new ApiError(400, "Workspace ID must be a number");
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: parsedWorkspaceId },
        select: { ownerId: true }
    });

    if (!workspace || workspace.ownerId !== userId) {
        console.warn(`[Workspace] Workspace not found or unauthorized for id ${parsedWorkspaceId} by user ${userId}`);
        throw new ApiError(404, "Workspace not found");
    }

    const cacheKey = `workspace:${parsedWorkspaceId}`;
    try {
        const cachedWorkspace = await redisClient.get(cacheKey);
        if (cachedWorkspace) {
            console.log(`[Workspace] Cache HIT for ${cacheKey}`);
            return res.status(200).json(
                new ApiResponse(200, JSON.parse(cachedWorkspace), "Workspace and companies fetched successfully from cache")
            );
        }
        console.log(`[Workspace] Cache MISS for ${cacheKey}`);
    } catch (err) {
        console.error("Redis read error:", err);
    }

    try{
       const workspaceWithCompanies = await prisma.workspace.findUnique({
            where: {
                id: parsedWorkspaceId
            },
            include: {
                companies: true
            }
        });
        console.log(`[Workspace] Retrieved workspace ${parsedWorkspaceId} with ${workspaceWithCompanies?.companies?.length || 0} companies from DB`);

        try {
            await redisClient.set(cacheKey, JSON.stringify(workspaceWithCompanies), { EX: 3600 });
            console.log(`[Workspace] Cached workspace details at ${cacheKey} (TTL 3600s)`);
        } catch (err) {
            console.error("Redis write error:", err);
        }

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

