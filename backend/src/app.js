import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,https://investment-research-ai-agent-iota.vercel.app')
  .split(',')
  .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, mobile apps)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.includes(origin) || 
                          /^https?:\/\/localhost:\d+$/.test(origin) || 
                          origin.endsWith('.vercel.app');
                          
        if (isAllowed) {
            return callback(null, true);
        }
        
        return callback(null, false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(clerkMiddleware());

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static('public'));

import userRouter from "./routes/user.route.js";
import workspaceRouter from "./routes/workspace.route.js";
import companyInfoRouter from "./routes/company.route.js";
import reportRouter from "./routes/report.route.js";
import healthRouter from "./routes/healthCheck.route.js";

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/workspace", workspaceRouter);
app.use("/api/v1/company", companyInfoRouter);
app.use("/api/v1/report", reportRouter);
app.use("/api/health", healthRouter);


import { errorHandler } from "./middlewares/error.middleware.js";
app.use(errorHandler);

export { app };
