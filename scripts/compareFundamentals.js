import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRequire = createRequire(path.resolve(__dirname, "../backend/package.json"));

const dotenv = backendRequire("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });

const YahooFinanceModule = backendRequire("yahoo-finance2");
const YahooFinance = YahooFinanceModule.default || YahooFinanceModule;

import { fetchGoogleFinanceFundamentals } from "../backend/src/services/analysysAndResearch.js";

const BROWSER_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://finance.yahoo.com/",
};

const yahooFinance = new YahooFinance({
    suppressNotices: ["yahooSurvey"],
    fetchOptions: { headers: BROWSER_HEADERS },
});

const TICKERS = [
    { ticker: "TCS.NS", market: "INDIAN" },
    { ticker: "HDFCBANK.NS", market: "INDIAN" },
    { ticker: "LTM.NS", alt: "LTM", market: "GLOBAL" },
    { ticker: "INFY.NS", market: "INDIAN" },
    { ticker: "RELIANCE.NS", market: "INDIAN" },
];

function formatVal(val, type = "num") {
    if (val === null || val === undefined || Number.isNaN(val)) return "N/A";
    if (type === "percent") {
        return (val * 100).toFixed(2) + "%";
    }
    if (type === "ratio") {
        return val.toFixed(2) + "x";
    }
    if (type === "mcap") {
        if (val >= 1e12) return "₹" + (val / 1e12).toFixed(2) + "T";
        if (val >= 1e9) return "₹" + (val / 1e9).toFixed(2) + "B";
        if (val >= 1e7) return "₹" + (val / 1e7).toFixed(2) + "Cr";
        return val.toLocaleString();
    }
    return typeof val === "number" ? val.toFixed(2) : String(val);
}

function evaluateMatch(key, yVal, fbVal) {
    if (
        yVal === null ||
        yVal === undefined ||
        fbVal === null ||
        fbVal === undefined ||
        Number.isNaN(yVal) ||
        Number.isNaN(fbVal)
    ) {
        return "ONE_MISSING";
    }

    if (key === "peRatio" || key === "marketCap") {
        const maxVal = Math.max(Math.abs(yVal), Math.abs(fbVal));
        if (maxVal === 0) return "MATCH";
        const relDiff = Math.abs(yVal - fbVal) / maxVal;
        return relDiff <= 0.03 ? "MATCH" : "DIFFERS";
    }

    if (key === "profitMargins" || key === "returnOnEquity") {
        const diff = Math.abs(yVal - fbVal);
        return diff <= 0.03 ? "MATCH" : "DIFFERS";
    }

    if (key === "debtToEquity" || key === "revenueGrowth" || key === "earningsGrowth") {
        const signDiffers = (yVal > 0 && fbVal < 0) || (yVal < 0 && fbVal > 0);
        if (signDiffers) return "DIFFERS";
        const maxVal = Math.max(Math.abs(yVal), Math.abs(fbVal));
        if (maxVal === 0) return "MATCH";
        const relDiff = Math.abs(yVal - fbVal) / maxVal;
        return relDiff > 0.25 ? "DIFFERS" : "MATCH";
    }

    return "MATCH";
}

async function fetchYahoo(ticker, altTicker) {
    const candidates = [ticker, altTicker].filter(Boolean);
    for (const cand of candidates) {
        try {
            const summary = await yahooFinance.quoteSummary(cand, {
                modules: ["price", "summaryDetail", "defaultKeyStatistics", "financialData"],
            });
            if (summary) {
                const s = summary.summaryDetail || {};
                const k = summary.defaultKeyStatistics || {};
                const f = summary.financialData || {};
                const p = summary.price || {};

                return {
                    peRatio: s.trailingPE ?? k.trailingPE ?? null,
                    marketCap: p.marketCap ?? s.marketCap ?? null,
                    profitMargins: k.profitMargins ?? f.profitMargins ?? null,
                    returnOnEquity: f.returnOnEquity ?? null,
                    debtToEquity: f.debtToEquity ?? null,
                    revenueGrowth: f.revenueGrowth ?? null,
                    earningsGrowth: f.earningsGrowth ?? null,
                };
            }
        } catch (e) {
            // candidate failed, try next
        }
    }
    return null;
}

const summaryResults = [];

async function compareOne(item) {
    const { ticker, alt, market } = item;
    console.log(`\n================================================================================`);
    console.log(` 📊 Comparing Fundamentals for: ${ticker}${alt ? ` (alt: ${alt})` : ""} [${market}]`);
    console.log(`================================================================================`);

    const [yahooData, fallbackData] = await Promise.all([
        fetchYahoo(ticker, alt),
        fetchGoogleFinanceFundamentals(ticker, market),
    ]);

    const metricsToCompare = [
        { key: "peRatio", label: "P/E Ratio", format: "ratio" },
        { key: "marketCap", label: "Market Cap", format: "mcap" },
        { key: "profitMargins", label: "Profit Margins", format: "percent" },
        { key: "returnOnEquity", label: "Return on Equity (ROE)", format: "percent" },
        { key: "debtToEquity", label: "Debt-to-Equity (raw %)", format: "num" },
        { key: "revenueGrowth", label: "Revenue Growth (YoY)", format: "percent" },
        { key: "earningsGrowth", label: "Earnings Growth (YoY)", format: "percent" },
    ];

    let matchCount = 0;
    let differCount = 0;
    let oneMissingCount = 0;

    const rows = metricsToCompare.map(({ key, label, format }) => {
        const yVal = yahooData ? yahooData[key] : null;
        const fbVal = fallbackData ? fallbackData[key] : null;
        const matchResult = evaluateMatch(key, yVal, fbVal);

        if (matchResult === "MATCH") matchCount++;
        else if (matchResult === "DIFFERS") differCount++;
        else if (matchResult === "ONE_MISSING") oneMissingCount++;

        return {
            Metric: label,
            "Yahoo Finance": formatVal(yVal, format),
            "Fallback (GF / Screener)": formatVal(fbVal, format),
            Match: matchResult,
        };
    });

    console.table(rows);

    summaryResults.push({
        Ticker: ticker,
        MATCH: matchCount,
        DIFFERS: differCount,
        ONE_MISSING: oneMissingCount,
    });
}

async function run() {
    console.log("Starting Fundamentals Comparison across 5 tickers...");
    for (const item of TICKERS) {
        await compareOne(item);
    }

    console.log("\n================================================================================");
    console.log(" 📋 Summary: Metrics Comparison per Ticker");
    console.log("================================================================================");
    console.table(summaryResults);

    console.log("\n✅ Comparison completed.");
    process.exit(0);
}

run().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
