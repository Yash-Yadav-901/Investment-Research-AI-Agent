import { createCompanyInfo, updateCompanyInfo, removeCompanyInfo } from "../controllers/company_info.contoroller.js";
import { Router } from "express";

const companyInfoRouter = Router();

companyInfoRouter.route("/create").post(createCompanyInfo);
companyInfoRouter.route("/update/:companyId").put(updateCompanyInfo);
companyInfoRouter.route("/remove/:companyId").delete(removeCompanyInfo);

export default companyInfoRouter;