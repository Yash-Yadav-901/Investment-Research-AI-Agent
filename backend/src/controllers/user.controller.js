import { asyncHandler } from "../utils/async_handler.js";
import { ApiResponse } from "../utils/api_response.js";
import { ApiError } from "../utils/api_error.js";
import { PrismaClient } from "@prisma/client";
import { getAuth, clerkClient } from '@clerk/express';

const prisma = new PrismaClient();

const signup = asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    console.log(`[User] signup initiated with userId:`, auth?.userId);

    if (!auth?.userId) {
        console.warn(`[User] signup failed: Unauthorized (no userId in request)`);
        throw new ApiError(401, "Unauthorized");
    }

    try {
        // Fetch email from Clerk since getAuth() doesn't include it
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        console.log(`[User] Fetched Clerk email:`, email, `for userId:`, auth.userId);

        // Upsert: if user already exists (e.g. logged in before) return them, else create
        const user = await prisma.user.upsert({
            where: { id: auth.userId },
            update: {},
            create: {
                id: auth.userId,
                email: email,
            }
        });

        console.log(`[User] User upserted successfully in database:`, user.id);
        return res.status(201).json(
            new ApiResponse(201, user, "User created successfully")
        );
    } catch (error) {
        console.error("Error in signup:", error);
        throw new ApiError(500, "Something went wrong during signup");
    }
});


const get_profile = asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    console.log(`[User] get_profile initiated with userId:`, auth?.userId);

    if (!auth?.userId) {
        console.warn(`[User] get_profile failed: Unauthorized`);
        throw new ApiError(401, "Unauthorized");
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: auth.userId   // schema uses id (Clerk userId) as primary key
            }
        });

        if (!user) {
            console.warn(`[User] User not found in DB for id:`, auth.userId);
            throw new ApiError(404, "User not found");
        }

        console.log(`[User] User profile fetched successfully:`, user.id);
        return res.status(200).json(
            new ApiResponse(200, user, "User profile fetched successfully")
        );
    } catch (error) {
        console.error("Error in get_profile:", error);
        throw new ApiError(500, "Something went wrong fetching profile");
    }
});

export { signup, get_profile };
