// eval/run.js
// Run from the backend folder:
//   node eval/run.js                       resolver evaluation only (no LLM, no Groq tokens)
//   node eval/run.js --full                also run the full analysis on the pipeline cases
//   node eval/run.js --full --repeat 3     repeat each pipeline case 3 times (measures verdict stability)
//   node eval/run.js --full --delay 60     seconds to wait between analysis runs (default 45, Groq limit)
//   node eval/run.js --only tata           run only cases whose id or input contains "tata"
//   node eval/run.js --dry-run [--full]    fake data, only proves the script and the report format work

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CASES } from "./dataset.js";
import { scoreResolve, scorePipeline, summarize, toMarkdown } from "./evalCore.js";
import { decide } from "../src/services/resolveLogic.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const val = (n, d) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d;
};

const DRY = flag("dry-run");
const FULL = flag("full");
const REPEAT = Math.max(1, Number(val("repeat", 1)));
const DELAY_SEC = DRY ? 0 : Number(val("delay", 45));
const ONLY = String(val("only", "")).toLowerCase();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const line = (c = "-") => console.log(c.repeat(78));

/* ------------------------------- live drivers ------------------------------- */

async function liveDrivers() {
    const { default: YahooFinance } = await import("yahoo-finance2");
    const yahoo = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

    // same search logic as src/services/resolveCompany.js, but without Redis (so results are fresh)
    async function searchQuotes(q) {
        const first = await searchOnce(q);
        if (!first.failed) return first;
        await sleep(2000); // Yahoo sometimes fails on the first call (cookie setup); retry once
        return searchOnce(q);
    }

    async function searchOnce(q) {
        const queries = [q];
        const words = q.split(/\s+/).filter(Boolean);
        if (words.length >= 2) {
            queries.push(words.join(""));
        }
        if (!q.includes(".") && !/\s/.test(q) && q.length <= 15) queries.push(`${q}.NS`);
        let failures = 0;
        const lists = await Promise.all(
            queries.map(async (x) => {
                try {
                    const r = await yahoo.search(x, { quotesCount: 10, newsCount: 0 });
                    return Array.isArray(r?.quotes) ? r.quotes : [];
                } catch {
                    failures++;
                    return [];
                }
            })
        );
        const bySymbol = new Map();
        for (const quote of lists.flat()) if (quote?.symbol && !bySymbol.has(quote.symbol)) bySymbol.set(quote.symbol, quote);
        return { quotes: [...bySymbol.values()], failed: failures === queries.length };
    }

    await yahoo.search("AAPL", { quotesCount: 1, newsCount: 0 }).catch(() => {}); // warm-up: sets Yahoo cookie

    let pipelineModules = null;
    async function runPipeline(args) {
        if (!pipelineModules) {
            const v2 = await import("../src/services/analysisV2.js");
            const v1 = await import("../src/services/analysysAndResearch.js");
            pipelineModules = { analyze: v2.researchAndAnalysisV2, schema: v1.InvestmentReportSchema };
        }
        const t0 = Date.now();
        try {
            const res = await pipelineModules.analyze(args);
            const parsed = pipelineModules.schema.safeParse(res.report);
            return { ok: true, report: res.report, schemaValid: parsed.success, ms: Date.now() - t0 };
        } catch (e) {
            return { ok: false, error: String(e?.message ?? e).slice(0, 160), ms: Date.now() - t0 };
        }
    }
    return { searchQuotes, runPipeline };
}

/* ------------------------------- dry-run drivers ------------------------------ */
// Fake data built from the expectations, with a few deliberate mistakes so you can see failures reported.

function dryDrivers() {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const words = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
    const fakeQuote = (symbol, name) => ({
        symbol, quoteType: "EQUITY", longname: name,
        exchDisp: /\.NS$/i.test(symbol) ? "NSE" : "NYSE",
    });

    async function searchQuotes(q) {
        const c = CASES.find((x) => x.input === q);
        if (!c || c.expect.status === "NO_MATCH") return { quotes: [], failed: false };
        if (c.id === "in-wipro") return { quotes: [], failed: false }; // deliberate mistake
        const e = c.expect;
        if (e.statusAnyOf) return { quotes: [], failed: false };
        if (e.status === "SINGLE") {
            const t = e.ticker ?? e.tickerAnyOf?.[0] ?? "ZZZ";
            return { quotes: [fakeQuote(t, `${q} Limited`)], failed: false };
        }
        return { quotes: (e.mustInclude ?? []).map((t, i) => fakeQuote(t, `${q} ${words[i]}`)), failed: false };
    }

    async function runPipeline(args) {
        const c = CASES.find((x) => x.pipeline && (x.input === args.companyName || (args.ticker && x.pipeline.ticker === args.ticker)));
        const p = c?.pipeline ?? {};
        const isPrivate = !!p.private;
        const ticker = isPrivate ? "PRIVATE" : args.ticker ?? p.ticker ?? p.tickerAnyOf?.[0] ?? "ZZZ";
        const filled = isPrivate ? 0 : 5 + Math.floor(rand() * 4);
        const keys = ["price", "peRatio", "debtToEquity", "marketCap", "profitMargins", "returnOnEquity", "revenueGrowth", "earningsGrowth"];
        const metrics = Object.fromEntries(keys.map((k, i) => [k, i < filled ? Math.round(rand() * 1000) / 10 : null]));
        metrics.currency = isPrivate ? null : "INR";
        const decision = isPrivate || p.expectPass ? "PASS" : rand() > 0.35 ? "INVEST" : "PASS";
        const confidence = isPrivate ? (c.id === "pr-koch" ? 40 : 12) : Math.round(55 + rand() * 30); // pr-koch: deliberate mistake
        await sleep(5);
        return {
            ok: !(c?.id === "gl-msft" && rand() > 0.5),
            error: "fake connection error",
            report: {
                metadata: { ticker, marketType: isPrivate ? "PRIVATE" : p.marketType ?? "GLOBAL", companyName: args.companyName },
                verdict: { decision, confidenceScore: confidence },
                financialMetrics: metrics,
            },
            schemaValid: true,
            ms: 8000 + Math.round(rand() * 9000),
        };
    }
    return { searchQuotes, runPipeline };
}

/* ----------------------------------- main ----------------------------------- */

async function main() {
    const drivers = DRY ? dryDrivers() : await liveDrivers();
    const cases = CASES.filter(
        (c) => !ONLY || c.id.toLowerCase().includes(ONLY) || c.input.toLowerCase().includes(ONLY)
    );

    console.log(`\nEvaluation ${DRY ? "(DRY RUN, fake data) " : ""}: ${cases.length} cases${FULL ? ", full pipeline ON" : ""}`);
    line("=");
    console.log("STAGE 1: company resolver (no LLM, no tokens)");
    line("=");

    const resolveRows = [];
    const resolveResults = new Map();
    for (const c of cases) {
        const { quotes, failed } = await drivers.searchQuotes(c.input);
        const result = failed ? { status: "ERROR" } : decide(c.input, quotes);
        resolveResults.set(c.id, result);
        const row = scoreResolve(c, result);
        resolveRows.push(row);

        const detail =
            row.got === "SINGLE" ? row.tickerGot
            : row.got === "MULTIPLE" ? `[${row.candidatesGot.join(", ")}]`
            : "";
        const mark = row.got === "ERROR" ? "ERR " : !row.scored ? "INFO" : row.pass ? "PASS" : "FAIL";
        console.log(`${mark}  ${c.input.padEnd(20)} expected ${row.expected.padEnd(9)} got ${row.got.padEnd(8)} ${detail}`);
        if (!DRY) await sleep(400); // be gentle with Yahoo
    }

    let pipelineRows = [];
    if (FULL) {
        console.log();
        line("=");
        console.log(`STAGE 2: full analysis (uses Groq tokens; waiting ${DELAY_SEC}s between runs)`);
        line("=");

        const jobs = [];
        for (const c of cases.filter((x) => x.pipeline)) {
            const r = resolveResults.get(c.id);
            let args;
            if (r?.status === "SINGLE") args = { companyName: r.candidate.name, ticker: r.candidate.ticker };
            else if (r?.status === "NO_MATCH") args = { companyName: c.input };
            else { console.log(`SKIP  ${c.input} (resolver gave ${r?.status}, the app would show a popup)`); continue; }
            for (let k = 1; k <= REPEAT; k++) jobs.push({ c, args, k });
        }

        for (let i = 0; i < jobs.length; i++) {
            const { c, args, k } = jobs[i];
            const outcome = await drivers.runPipeline(args);
            const row = scorePipeline(c, outcome, k);
            pipelineRows.push(row);
            const mark = row.pass ? "PASS" : "FAIL";
            console.log(
                `${mark}  ${c.input.padEnd(20)} run ${k}  ${row.ok ? `${row.decision} ${row.confidence}%  metrics ${row.metricsFilled}/8  ${(row.ms / 1000).toFixed(1)}s` : `ERROR: ${row.error}`}${row.pass ? "" : `  failed: ${row.failed.join(", ")}`}`
            );
            if (i < jobs.length - 1 && DELAY_SEC > 0) await sleep(DELAY_SEC * 1000);
        }
    }

    const summary = summarize(resolveRows, pipelineRows);
    const meta = { date: new Date().toISOString().slice(0, 10), model: process.env.GROQ_MODEL, dryRun: DRY };
    const md = toMarkdown(summary, meta, resolveRows, pipelineRows);

    console.log();
    line("=");
    console.log(md);
    line("=");

    const outDir = path.join(here, "results");
    await fs.mkdir(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const base = DRY ? "dry-run" : "latest";
    await fs.writeFile(path.join(outDir, `${base}.md`), md);
    await fs.writeFile(path.join(outDir, `${base}.json`), JSON.stringify({ meta, summary, resolveRows, pipelineRows }, null, 2));
    if (!DRY) await fs.writeFile(path.join(outDir, `run-${stamp}.json`), JSON.stringify({ meta, summary, resolveRows, pipelineRows }, null, 2));
    console.log(`\nSaved: eval/results/${base}.md and ${base}.json`);
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error("Evaluation crashed:", e);
        process.exit(1);
    });