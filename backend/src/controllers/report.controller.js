import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js";
import { PrismaClient } from "@prisma/client";
import { getAuth } from "@clerk/express";
import { renderReportHTML } from "../utils/reportContent.js";
import puppeteer from "puppeteer";

const prisma = new PrismaClient();

const generateReport = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    console.log("[Report] generateReport request received:", { userId, params: req.params });

    if (!userId) {
        console.warn("[Report] generateReport failed: Unauthorized");
        throw new ApiError(401, "Unauthorized");
    }

    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
        throw new ApiError(400, "Invalid company ID");
    }

    const company = await prisma.company.findFirst({
        where: { id: companyId, workspace: { ownerId: userId } }
    });

    if (!company) {
        console.warn(`[Report] Company ${companyId} not found in DB or not owned by user ${userId}`);
        throw new ApiError(404, "Company not found");
    }

    console.log(`[Report] Rendering HTML report for "${company.name}" (ID: ${companyId})...`);
    const html = renderReportHTML(company.rawData);

    console.log(`[Report] Launching Puppeteer to generate PDF...`);
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    console.log(`[Report] PDF successfully generated for "${company.name}" (${pdfBuffer.length} bytes). Sending response...`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${company.name}-report.pdf"`);
    res.send(pdfBuffer);
});

export { generateReport };
