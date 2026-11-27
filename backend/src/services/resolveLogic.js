// resolveLogic.js
// Pure decision logic for company resolution. No network, no Redis, so it can be unit-tested.
//
// decide(input, quotes) -> { status: "SINGLE", candidate }
//                        | { status: "MULTIPLE", candidates }
//                        | { status: "NO_MATCH" }
// candidate = { name, ticker, exchange, otherListings: [{ ticker, exchange }] }

const STOP_WORDS = new Set([
    "limited", "ltd", "inc", "incorporated", "corp", "corporation",
    "company", "co", "plc", "the", "and", "of",
]);

const FUND_PATTERN = /\b(ETF|ETN|Fund|BeES)\b/i;
const US_EXCHANGE_PATTERN = /NYSE|NASDAQ|NYQ|NMS|NGM|NCM/i;

function nameTokens(text) {
    return String(text ?? "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, " ")
        .split(" ")
        .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function symbolBase(symbol) {
    return String(symbol ?? "").split(".")[0].toLowerCase();
}

function toEntry(quote) {
    const name = quote?.longname || quote?.shortname || quote?.symbol;
    const tokens = nameTokens(name);
    return {
        symbol: quote.symbol,
        name,
        exchange: quote?.exchDisp || quote?.exchange || null,
        tokens,
        normName: tokens.join(" "),
    };
}

function isUs(entry) {
    return US_EXCHANGE_PATTERN.test(entry.exchange ?? "");
}

// Group listings of the SAME company (same normalized name). Different companies stay separate.
function groupByCompany(entries) {
    const groups = new Map();
    for (const entry of entries) {
        const key = entry.normName || entry.symbol.toLowerCase();
        if (!groups.has(key)) groups.set(key, { normName: key, listings: [] });
        groups.get(key).listings.push(entry);
    }
    return [...groups.values()];
}

// Default listing: exact typed symbol, else .NS, else US exchange, else .BO, else first.
function pickListing(listings, qLower) {
    return (
        listings.find((l) => l.symbol.toLowerCase() === qLower) ||
        listings.find((l) => /\.NS$/i.test(l.symbol)) ||
        listings.find(isUs) ||
        listings.find((l) => /\.BO$/i.test(l.symbol)) ||
        listings[0]
    );
}

function buildCandidate(group, qLower) {
    const chosen = pickListing(group.listings, qLower);
    return {
        name: chosen.name,
        ticker: chosen.symbol,
        exchange: chosen.exchange,
        otherListings: group.listings
            .filter((l) => l.symbol !== chosen.symbol)
            .map((l) => ({ ticker: l.symbol, exchange: l.exchange })),
    };
}

const single = (group, qLower) => ({ status: "SINGLE", candidate: buildCandidate(group, qLower) });
const multiple = (groups, qLower) => ({
    status: "MULTIPLE",
    candidates: groups.slice(0, 5).map((g) => buildCandidate(g, qLower)),
});

export function decide(input, quotes) {
    const q = String(input ?? "").trim();
    const qLower = q.toLowerCase();

    // 1. keep equities only, drop funds, dedupe by symbol
    const seen = new Set();
    const equities = [];
    for (const quote of Array.isArray(quotes) ? quotes : []) {
        if (quote?.quoteType !== "EQUITY" || !quote?.symbol) continue;
        if (seen.has(quote.symbol)) continue;
        const entry = toEntry(quote);
        if (FUND_PATTERN.test(entry.name ?? "")) continue;
        seen.add(quote.symbol);
        equities.push(entry);
    }
    if (equities.length === 0) return { status: "NO_MATCH" };

    const allGroups = groupByCompany(equities);

    // 2. full symbol typed (e.g. "LTM.NS", "INFY.NS"): that exact listing wins
    if (q.includes(".")) {
        const hit = equities.find((e) => e.symbol.toLowerCase() === qLower);
        if (hit) {
            const group = allGroups.find((g) => g.listings.includes(hit));
            return single(group, qLower);
        }
    }

    // 2b. exact ticker match (e.g. "LTM.NS", "INFY.BO", "RELIANCE.NS")
    if (/^[A-Za-z0-9&-]{1,15}\.(NS|BO)$/i.test(q)) {
        const hit = equities.find((e) => e.symbol.toUpperCase() === q.toUpperCase());
        if (hit) {
            const group = allGroups.find((g) => g.listings.includes(hit));
            return single(group, qLower);
        }
    }

    // 3. bare ticker-like input (e.g. "LTM", "HAL", "TCS"):
    //    find every company that uses this symbol on any exchange.
    //    Same company on several exchanges -> pick one. Different companies -> ask the user.
    if (!q.includes(".") && !/\s/.test(q)) {
        const hits = equities.filter((e) => symbolBase(e.symbol) === qLower);
        if (hits.length > 0) {
            const groups = allGroups.filter((g) => g.listings.some((l) => hits.includes(l)));
            return groups.length === 1 ? single(groups[0], qLower) : multiple(groups, qLower);
        }
    }

    // 4. name search (e.g. "Tata", "Apple", "HDFC Bank")
    const qTokens = nameTokens(q);
    const qWords = q.split(/\s+/).filter(Boolean);
    if (qWords.length >= 2) {
        qTokens.push(qWords.join("").toLowerCase());
    }
    const relevant = equities.filter(
        (e) => e.tokens.some((t) => qTokens.includes(t)) || symbolBase(e.symbol) === qLower
    );
    if (relevant.length === 0) return { status: "NO_MATCH" };

    const groups = groupByCompany(relevant);
    if (groups.length === 1) return single(groups[0], qLower);

    const exactName = groups.filter((g) => g.normName === qTokens.join(" "));
    if (exactName.length === 1) return single(exactName[0], qLower);

    return multiple(groups, qLower);
}