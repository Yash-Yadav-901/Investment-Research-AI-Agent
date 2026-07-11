import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, mobile apps)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(clerkMiddleware());

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static('public'));

import userRouter from "./routes/user.route.js";
import workspaceRouter from "./routes/workspace.route.js";
import companyInfoRouter from "./routes/company.route.js";

app.use("/api/v1/user", userRouter);
app.use("/api/v1/workspace", workspaceRouter);
app.use("/api/v1/company", companyInfoRouter);


import { errorHandler } from "./middlewares/error.middleware.js";
app.use(errorHandler);

export { app };
