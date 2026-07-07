import { asyncHandler } from "../utils/async_handler";
import { ApiResponse } from "../utils/api_response";
import { ApiError } from "../utils/api_error";
import {PrismaClient} from   "@prisma/client";
import {getAuth} from '@clerk/express'


const prisma = new PrismaClient();


const signup= asyncHandler(async(req, res) => { 
     try {                                           
        const auth = getAuth(req);
        
        if(!auth) {
            throw new ApiError(401, "Unauthorized")
        }
        
        const user = await prisma.user.create({
            data: {
                email: auth.emailAddress,
                clerkId: auth.userId
            }
        })

        return res.status(201).json(
            new ApiResponse(200, user, "User created successfully")
        );


     } catch (error) {
        console.log("error in login", error);
        throw new ApiError(401, "Something went wrong in login");
     }
});


const get_profile= asyncHandler(async(req, res)=>{
    try {
        const auth = getAuth(req);

        if(!auth){
            throw new ApiError(401, "Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: {
                clerkId: auth.userId
            }
        });
        
        if(!user){
            throw new ApiError(404, "User not found");
        }

        return res.status(200).json(
            new ApiResponse(200, user, "User profile fetched successfully")
        );

        
    } catch (error) {
        console.log("error in login", error);
        throw new ApiError(401, "Something went wrong in login");
    }
})




export {signup, get_profile};



