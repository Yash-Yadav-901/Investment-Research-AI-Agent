import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js";
import { PrismaClient } from "@prisma/client";
import { getAuth } from "@clerk/express";
import { renderReportHTML } from "../utils/reportContent.js";
import puppeteer from "puppeteer";

const prisma = new PrismaClient();

const generateReport = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
        throw new ApiError(400, "Invalid company ID");
    }

    const company = await prisma.company.findUnique({
        where: { id: companyId }
    });

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    const html = renderReportHTML(company.rawData);

    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${company.name}-report.pdf"`);
    res.send(pdfBuffer);
});

export { generateReport };
