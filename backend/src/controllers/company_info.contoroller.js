import { asyncHandler } from "../utils/async_handler";
import { ApiResponse } from "../utils/api_response";
import { ApiError } from "../utils/api_error";
import {PrismaClient} from   "@prisma/client";
import {getAuth} from '@clerk/express'

const prisma = new PrismaClient();

const createCompanyInfo = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { company_name} = req.body;

    if (!company_name) {
        throw new ApiError(400, "Company name is required");
    }
    
});