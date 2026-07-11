import { generateReport } from "../controllers/report.controller.js";
import { Router } from "express";

const reportRouter = Router();

reportRouter.route("/:companyId").get(generateReport);

export default reportRouter;
