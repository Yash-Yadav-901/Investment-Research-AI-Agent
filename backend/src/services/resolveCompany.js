import YahooFinance from "yahoo-finance2";
import { redisClient } from "../../redis/index.js";
import { ApiError } from "../utils/api_error.js";
import { decide } from "./resolveLogic.js";

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
    fetchOptions: {
        headers: BROWSER_HEADERS,
    },
});

const STOP_WORDS = new Set([
    "limited", "ltd", "inc", "incorporated", "corp", "corporation",
    "company", "co", "plc", "the", "and", "of"
]);

function normalizeQuery(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 0 && !STOP_WORDS.has(t))
        .join(" ");
}

async function searchYahoo(q) {
    try {
        const res = await yahooFinance.search(q, { quotesCount: 10, newsCount: 0 });
        return Array.isArray(res?.quotes) ? res.quotes : [];
    } catch (err) {
        console.warn(`[resolveCompany] yahooFinance.search failed for "${q}", attempting direct search fallback:`, err?.message);
        try {
            const fallbackRes = await fetch(
                `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`,
                { headers: BROWSER_HEADERS }
            );
            const fallbackJson = await fallbackRes.json();
            return Array.isArray(fallbackJson?.quotes) ? fallbackJson.quotes : [];
        } catch (fallbackErr) {
            console.error(`[resolveCompany] Direct search fallback also failed for "${q}":`, fallbackErr);
            return [];
        }
    }
}

async function resolveCompany(input) {
    if (!input || typeof input !== "string") {
        throw new ApiError(400, "Company name must be between 2 and 100 characters");
    }

    const q = input.trim();
    if (q.length < 2 || q.length > 100) {
        throw new ApiError(400, "Company name must be between 2 and 100 characters");
    }

    const normInput = normalizeQuery(q) || q.toLowerCase();
    const cacheKey = `resolve:v4:${normInput}`;

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log(`[resolveCompany] Cache HIT for key: ${cacheKey}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.error("[resolveCompany] Redis read error:", err);
    }

    console.log(`[resolveCompany] Cache MISS for ${cacheKey} -> Searching Yahoo Finance for "${q}"...`);

    const queries = [q];
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
        queries.push(words.join(""));
    }
    if (!q.includes(".") && !/\s/.test(q) && q.length <= 15) {
        queries.push(`${q}.NS`);
    }

    const results = await Promise.all(queries.map(searchYahoo));
    const allQuotes = results.flat();

    const bySymbol = new Map();
    for (const item of allQuotes) {
        if (item?.symbol && !bySymbol.has(item.symbol)) {
            bySymbol.set(item.symbol, item);
        }
    }
    const mergedQuotes = [...bySymbol.values()];

    const response = decide(q, mergedQuotes);

    // Cache when Yahoo returned quotes (do not cache when Yahoo returned nothing)
    if (mergedQuotes.length > 0) {
        try {
            await redisClient.set(cacheKey, JSON.stringify(response), { EX: 3600 });
            console.log(`[resolveCompany] Cached resolution for ${cacheKey} (TTL: 3600s)`);
        } catch (err) {
            console.error("[resolveCompany] Redis write error:", err);
        }
    } else {
        console.log(`[resolveCompany] Not caching ${cacheKey} because Yahoo returned no quotes`);
    }

    return response;
}

export { resolveCompany };
