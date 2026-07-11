import { createWorkspace,
    getWorkspaces,
    updateWorkspaceName,
    deleteWorkspace } from "../controllers/workspace.controller.js";
import { Router } from "express";

const workspaceRouter = Router();

workspaceRouter.route("/create").post(createWorkspace);
workspaceRouter.route("/list").get(getWorkspaces);
workspaceRouter.route("/update-name").put(updateWorkspaceName);
workspaceRouter.route("/delete").delete(deleteWorkspace);

export default workspaceRouter;