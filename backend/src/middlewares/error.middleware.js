import { ApiError } from "../utils/api_error.js";

const errorHandler = (err, req, res, next) => {
    let error= err;

    if(!(error instanceof ApiError)){
        const statusCode = error.statusCode || 500;
        const message = error.message || "Internal Server Error";
        error = new ApiError(
            statusCode,
            message,
            error?.errors || [],
            error.stack || ""
        )
    }

    const response = {
        ...error,
        message : error.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" ? 
            { stack : error.stack} : {}
        )

    }

    return res.status(error.statusCode ).json(response);
}


export { errorHandler };