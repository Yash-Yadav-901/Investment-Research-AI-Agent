import { asyncHandler } from "../utils/async_handler";
import { ApiResponse } from "../utils/api_response";
import { ApiError } from "../utils/api_error";
import {PrismaClient} from   "@prisma/client";
import {getAuth} from '@clerk/express'

const prisma = new PrismaClient();

