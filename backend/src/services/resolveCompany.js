import YahooFinance from "yahoo-finance2";
import { redisClient } from "../../redis/index.js";
import { ApiError } from "../utils/api_error.js";

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
    "limited", "ltd", "inc", "incorporated", "corp",
    "corporation", "company", "co", "plc", "the", "and", "of"
]);

const FUND_REGEX = /\b(ETF|ETN|Fund|BeES)\b/i;

function normalizeName(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 0 && !STOP_WORDS.has(t))
        .join(" ");
}

function getTokens(str) {
    if (!str) return [];
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

function isUsExchange(item) {
    const ex = (item?.exchDisp || item?.exchange || item?.fullExchangeName || "").toUpperCase();
    const sym = String(item?.symbol || "");
    if (/(NYSE|NASDAQ|NYQ|NMS|NGS|NCM|NAS)/.test(ex)) return true;
    if (!sym.includes(".") && /(NYS|NAS|ASE|BATS)/.test(ex)) return true;
    return false;
}

function isNsListing(item) {
    return String(item?.symbol || "").toUpperCase().endsWith(".NS");
}

async function resolveCompany(input) {
    if (!input || typeof input !== "string") {
        throw new ApiError(400, "Company name must be between 2 and 100 characters");
    }

    const q = input.trim();
    if (q.length < 2 || q.length > 100) {
        throw new ApiError(400, "Company name must be between 2 and 100 characters");
    }

    const normInput = normalizeName(q) || q.toLowerCase();
    const cacheKey = `resolve:v3:${normInput}`;

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

    let searchResult;
    try {
        searchResult = await yahooFinance.search(q, { quotesCount: 10, newsCount: 0 });
    } catch (err) {
        console.warn("[resolveCompany] yahooFinance.search failed, attempting direct search fallback:", err?.message);
        try {
            const fallbackRes = await fetch(
                `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`,
                { headers: BROWSER_HEADERS }
            );
            searchResult = await fallbackRes.json();
        } catch (fallbackErr) {
            console.error("[resolveCompany] Direct search fallback also failed:", fallbackErr);
            return { status: "NO_MATCH" };
        }
    }

    const quotes = Array.isArray(searchResult?.quotes) ? searchResult.quotes : [];
    
    // Filter out non-equities and funds/ETFs
    const equities = quotes.filter((item) => {
        if (item?.quoteType !== "EQUITY" || typeof item?.symbol !== "string" || !item.symbol.trim()) {
            return false;
        }
        const name = item.longname || item.shortname || item.longName || item.shortName || item.name || item.symbol;
        if (FUND_REGEX.test(name) || FUND_REGEX.test(item.symbol)) {
            return false;
        }
        return true;
    });

    console.log(`📊 [resolveCompany] Found ${quotes.length} total quotes (${equities.length} equities after filtering funds)`);

    // 1. Exact ticker wins: before grouping, if trimmed input exactly equals the symbol of an equity result
    const qUpper = q.toUpperCase();
    const exactSymbolMatch = equities.find((item) => String(item.symbol || "").toUpperCase() === qUpper);

    if (exactSymbolMatch) {
        const matchName = exactSymbolMatch.longname || exactSymbolMatch.shortname || exactSymbolMatch.longName || exactSymbolMatch.shortName || exactSymbolMatch.name || exactSymbolMatch.symbol;
        const norm = normalizeName(matchName) || matchName.toLowerCase();

        const otherListings = equities
            .filter((item) => String(item.symbol || "").toUpperCase() !== qUpper)
            .filter((item) => {
                const itemName = item.longname || item.shortname || item.longName || item.shortName || item.name || item.symbol;
                return (normalizeName(itemName) || itemName.toLowerCase()) === norm;
            })
            .map((item) => ({
                ticker: item.symbol,
                exchange: item.exchDisp || item.exchange || item.fullExchangeName || "UNKNOWN",
            }));

        const response = {
            status: "SINGLE",
            candidate: {
                name: matchName,
                ticker: exactSymbolMatch.symbol,
                exchange: exactSymbolMatch.exchDisp || exactSymbolMatch.exchange || exactSymbolMatch.fullExchangeName || "UNKNOWN",
                otherListings,
            },
        };

        console.log(`🎯 [resolveCompany] Exact ticker win for "${q}": ${response.candidate.ticker} (${response.candidate.exchange})`);

        try {
            await redisClient.set(cacheKey, JSON.stringify(response), { EX: 3600 });
            console.log(`[resolveCompany] Cached exact ticker resolution for ${cacheKey} (TTL: 3600s)`);
        } catch (err) {
            console.error("[resolveCompany] Redis write error:", err);
        }

        return response;
    }

    const inputTokens = getTokens(q);
    const inputLower = q.toLowerCase();

    const relevantEquities = equities.filter((item) => {
        const symbol = String(item.symbol || "");
        const symBase = symbol.split(".")[0].toLowerCase();
        if (symBase === inputLower) return true;

        const name = item.longname || item.shortname || item.longName || item.shortName || item.name || symbol;
        const nameTokens = getTokens(name);
        return nameTokens.some((t) => inputTokens.includes(t));
    });

    console.log(`🎯 [resolveCompany] Filtered to ${relevantEquities.length} relevant equity match(es)`);

    // 2. Group duplicate listings of the same company (same normalized name)
    const groups = new Map();
    for (const item of relevantEquities) {
        const name = item.longname || item.shortname || item.longName || item.shortName || item.name || item.symbol;
        const norm = normalizeName(name) || name.toLowerCase();
        const listing = {
            name,
            ticker: item.symbol,
            exchange: item.exchDisp || item.exchange || item.fullExchangeName || "UNKNOWN",
            raw: item,
        };

        if (!groups.has(norm)) {
            groups.set(norm, [listing]);
        } else {
            const existing = groups.get(norm);
            if (!existing.some((l) => l.ticker === listing.ticker)) {
                existing.push(listing);
            }
        }
    }

    // Choose default ticker in order: .NS listing -> US exchange listing -> first one
    const candidates = [];
    for (const [norm, listings] of groups.entries()) {
        let chosen = listings.find((l) => isNsListing(l.raw));
        if (!chosen) {
            chosen = listings.find((l) => isUsExchange(l.raw));
        }
        if (!chosen) {
            chosen = listings[0];
        }

        const otherListings = listings
            .filter((l) => l.ticker !== chosen.ticker)
            .map((l) => ({ ticker: l.ticker, exchange: l.exchange }));

        candidates.push({
            name: chosen.name,
            ticker: chosen.ticker,
            exchange: chosen.exchange,
            otherListings,
            normName: norm,
        });
    }

    console.log(`🔀 [resolveCompany] Deduplicated to ${candidates.length} unique company candidate(s)`);
    let response;

    if (candidates.length === 0) {
        response = { status: "NO_MATCH" };
    } else if (candidates.length === 1) {
        response = {
            status: "SINGLE",
            candidate: {
                name: candidates[0].name,
                ticker: candidates[0].ticker,
                exchange: candidates[0].exchange,
                otherListings: candidates[0].otherListings,
            },
        };
    } else {
        const exactMatches = candidates.filter((c) => c.normName === normInput);
        if (exactMatches.length === 1) {
            response = {
                status: "SINGLE",
                candidate: {
                    name: exactMatches[0].name,
                    ticker: exactMatches[0].ticker,
                    exchange: exactMatches[0].exchange,
                    otherListings: exactMatches[0].otherListings,
                },
            };
        } else {
            response = {
                status: "MULTIPLE",
                candidates: candidates.slice(0, 5).map((c) => ({
                    name: c.name,
                    ticker: c.ticker,
                    exchange: c.exchange,
                    otherListings: c.otherListings,
                })),
            };
        }
    }

    console.log(`✅ [resolveCompany] Result for "${q}": ${response.status}`, 
        response.candidate 
            ? `-> ${response.candidate.name} (${response.candidate.ticker})` 
            : response.candidates 
            ? `-> ${response.candidates.map(c => `${c.name} (${c.ticker})`).join("; ")}` 
            : ""
    );

    try {
        await redisClient.set(cacheKey, JSON.stringify(response), { EX: 3600 });
        console.log(`[resolveCompany] Cached resolution for ${cacheKey} (TTL: 3600s)`);
    } catch (err) {
        console.error("[resolveCompany] Redis write error:", err);
    }

    return response;
}

export { resolveCompany };
