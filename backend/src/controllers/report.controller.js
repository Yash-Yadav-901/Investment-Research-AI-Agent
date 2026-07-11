import { asyncHandler } from "../utils/async_handler";
import { ApiResponse } from "../utils/api_response";
import { ApiError } from "../utils/api_error";
import { PrismaClient } from "@prisma/client";
import { getAuth } from "@clerk/express";
import { renderReportHTML } from "../utils/reportContent";
import puppeteer from "puppeteer";

const prisma = new PrismaClient();

const generateReport = asyncHandler(async (req, res) => {
    const company = await prisma.company.findUnique({
        where: { id: req.params.companyId }
    });

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    const html = renderReportHTML(company.rawData);


    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${company.name}-report.pdf"`
    );
    res.send(pdfBuffer);
});
