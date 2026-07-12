import { Router } from "express";

import { healthCheck } from "../controllers/healthCheck.controller.js";

const healthRouter = Router();

healthRouter.route("/check").get(healthCheck);

export default healthRouter;