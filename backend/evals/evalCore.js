// eval/evalCore.js
// Scoring and reporting logic. Pure functions: no network, no LLM, so it can be tested.

export const METRIC_KEYS = [
    "price", "peRatio", "debtToEquity", "marketCap",
    "profitMargins", "returnOnEquity", "revenueGrowth", "earningsGrowth",
];

const up = (s) => String(s ?? "").toUpperCase();
const pct = (n, d) => (d ? Math.round((1000 * n) / d) / 10 : null);
const failedChecks = (checks) => Object.entries(checks).filter(([, v]) => v === false).map(([k]) => k);

/* ------------------------------ resolver scoring ------------------------------ */

export function scoreResolve(testCase, result) {
    const exp = testCase.expect;
    const got = result?.status ?? "ERROR";
    const row = {
        id: testCase.id,
        input: testCase.input,
        category: testCase.category,
        scored: testCase.scored !== false,
        expected: exp.statusAnyOf ? exp.statusAnyOf.join("|") : exp.status,
        got,
        tickerGot: got === "SINGLE" ? result.candidate?.ticker ?? null : null,
        candidatesGot: got === "MULTIPLE" ? result.candidates.map((c) => c.ticker) : null,
        checks: {},
    };

    const okStatuses = exp.statusAnyOf ?? [exp.status];
    row.checks.status = okStatuses.includes(got);

    const allowed = exp.tickerAnyOf ?? (exp.ticker ? [exp.ticker] : null);
    if (allowed && got === "SINGLE") {
        row.checks.ticker = allowed.map(up).includes(up(row.tickerGot));
    }

    if (exp.mustInclude) {
        const present = new Set(
            (result?.candidates ?? [])
                .flatMap((c) => [c.ticker, ...(c.otherListings ?? []).map((o) => o.ticker)])
                .map(up)
        );
        row.checks.includes = got === "MULTIPLE" && exp.mustInclude.every((t) => present.has(up(t)));
    }

    row.pass = Object.values(row.checks).every(Boolean);
    row.falsePopup = exp.status === "SINGLE" && got === "MULTIPLE";
    row.missedCollision = exp.status === "MULTIPLE" && got === "SINGLE";
    row.failed = failedChecks(row.checks);
    return row;
}

/* ------------------------------ pipeline scoring ------------------------------ */

// outcome = { ok, error, report, schemaValid, ms }
export function scorePipeline(testCase, outcome, runIndex = 1) {
    const exp = testCase.pipeline ?? {};
    const group = exp.private ? "private" : exp.expectPass ? "fake" : "public";
    const row = {
        id: testCase.id, input: testCase.input, category: testCase.category,
        group, run: runIndex, ms: outcome.ms ?? null, ok: !!outcome.ok,
        error: outcome.error ?? null, decision: null, confidence: null, metricsFilled: null, checks: {},
    };

    row.checks.ran = !!outcome.ok;
    if (!outcome.ok) {
        row.pass = false;
        row.failed = failedChecks(row.checks);
        return row;
    }

    const r = outcome.report ?? {};
    const m = r.financialMetrics ?? {};
    row.decision = r.verdict?.decision ?? null;
    row.confidence = r.verdict?.confidenceScore ?? null;
    row.metricsFilled = METRIC_KEYS.filter((k) => typeof m[k] === "number").length;
    row.checks.schema = outcome.schemaValid !== false;

    if (exp.private) {
        row.checks.marketPrivate = r.metadata?.marketType === "PRIVATE";
        row.checks.tickerPrivate = r.metadata?.ticker === "PRIVATE";
        row.checks.decisionPass = row.decision === "PASS";
        row.checks.confidence5to20 = row.confidence >= 5 && row.confidence <= 20;
        row.checks.metricsNull = row.metricsFilled === 0 && (m.currency ?? null) === null;
    } else if (exp.expectPass) {
        row.checks.decisionPass = row.decision === "PASS";
    } else {
        row.checks.enoughData = row.metricsFilled >= 4; // a public company with fewer than 4 of 8 metrics is a weak report
        if (exp.marketType) row.checks.marketType = r.metadata?.marketType === exp.marketType;
        const allowed = exp.tickerAnyOf ?? (exp.ticker ? [exp.ticker] : null);
        if (allowed) row.checks.ticker = allowed.map(up).includes(up(r.metadata?.ticker));
    }

    row.pass = Object.values(row.checks).every(Boolean);
    row.failed = failedChecks(row.checks);
    return row;
}

/* ---------------------------------- summary ---------------------------------- */

function percentile(sorted, p) {
    if (sorted.length === 0) return null;
    return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
}

export function summarize(resolveRows, pipelineRows = []) {
    const scoredRows = resolveRows.filter((r) => r.scored && r.got !== "ERROR");
    const errors = resolveRows.filter((r) => r.got === "ERROR").length;

    const byCategory = {};
    for (const r of scoredRows) {
        byCategory[r.category] ??= { total: 0, passed: 0 };
        byCategory[r.category].total++;
        if (r.pass) byCategory[r.category].passed++;
    }

    const tickerRows = scoredRows.filter((r) => "ticker" in r.checks);
    const collisionRows = scoredRows.filter((r) => "includes" in r.checks || r.missedCollision);
    const singleExpected = scoredRows.filter((r) => r.expected === "SINGLE");

    const resolve = {
        scoredCases: scoredRows.length,
        errors,
        passed: scoredRows.filter((r) => r.pass).length,
        accuracy: pct(scoredRows.filter((r) => r.pass).length, scoredRows.length),
        statusAccuracy: pct(scoredRows.filter((r) => r.checks.status).length, scoredRows.length),
        tickerAccuracy: pct(tickerRows.filter((r) => r.checks.ticker).length, tickerRows.length),
        tickerChecks: tickerRows.length,
        collisionDetection: pct(collisionRows.filter((r) => r.pass).length, collisionRows.length),
        collisionChecks: collisionRows.length,
        falsePopupRate: pct(singleExpected.filter((r) => r.falsePopup).length, singleExpected.length),
        missedCollisions: scoredRows.filter((r) => r.missedCollision).length,
        byCategory,
    };

    let pipeline = null;
    if (pipelineRows.length > 0) {
        const ok = pipelineRows.filter((r) => r.ok);
        const lat = ok.map((r) => r.ms).filter((x) => typeof x === "number").sort((a, b) => a - b);
        const pub = ok.filter((r) => r.group === "public");
        const priv = pipelineRows.filter((r) => r.group === "private");

        const byId = {};
        for (const r of ok) (byId[r.id] ??= []).push(r.decision);
        const multi = Object.values(byId).filter((d) => d.length >= 2);

        pipeline = {
            runs: pipelineRows.length,
            successRate: pct(ok.length, pipelineRows.length),
            schemaValidRate: pct(ok.filter((r) => r.checks.schema).length, ok.length),
            passRate: pct(pipelineRows.filter((r) => r.pass).length, pipelineRows.length),
            privateGuardrails: { runs: priv.length, passed: priv.filter((r) => r.pass).length },
            avgMetricsFilled: pub.length
                ? Math.round((10 * pub.reduce((s, r) => s + r.metricsFilled, 0)) / pub.length) / 10
                : null,
            publicRuns: pub.length,
            latencySec: lat.length
                ? {
                    mean: Math.round(lat.reduce((s, x) => s + x, 0) / lat.length / 100) / 10,
                    median: Math.round(percentile(lat, 0.5) / 100) / 10,
                    p95: Math.round(percentile(lat, 0.95) / 100) / 10,
                }
                : null,
            stability: multi.length
                ? { cases: multi.length, stable: multi.filter((d) => new Set(d).size === 1).length }
                : null,
        };
    }
    return { resolve, pipeline };
}

/* ---------------------------------- markdown ---------------------------------- */

const fmt = (v, suffix = "") => (v === null || v === undefined ? "n/a" : `${v}${suffix}`);

export function toMarkdown(summary, meta, resolveRows, pipelineRows = []) {
    const { resolve: r, pipeline: p } = summary;
    const lines = [];
    lines.push(`## Evaluation results${meta.dryRun ? " (DRY RUN: fake data, not real results)" : ""}`);
    lines.push("");
    lines.push(`- Date: ${meta.date}`);
    lines.push(`- Model: ${meta.model ?? "n/a"}`);
    lines.push(`- Resolver cases: ${r.scoredCases} scored${r.errors ? `, ${r.errors} errored (excluded)` : ""}`);
    lines.push(`- Pipeline runs: ${p ? p.runs : "not run (use --full)"}`);
    lines.push("");
    lines.push("### Company resolver (code only, no LLM)");
    lines.push("");
    lines.push("| Metric | Result |");
    lines.push("|---|---|");
    lines.push(`| Cases passed | ${r.passed} / ${r.scoredCases} (${fmt(r.accuracy, "%")}) |`);
    lines.push(`| Ticker accuracy (single-company cases) | ${fmt(r.tickerAccuracy, "%")} (${r.tickerChecks} checks) |`);
    lines.push(`| Ambiguity / collision detection | ${fmt(r.collisionDetection, "%")} (${r.collisionChecks} cases) |`);
    lines.push(`| Unneeded popups (clear name, popup shown) | ${fmt(r.falsePopupRate, "%")} |`);
    lines.push(`| Missed collisions (should have asked, did not) | ${r.missedCollisions} |`);
    lines.push("");
    lines.push("| Category | Passed | Total |");
    lines.push("|---|---|---|");
    for (const [cat, v] of Object.entries(r.byCategory)) lines.push(`| ${cat} | ${v.passed} | ${v.total} |`);

    if (p) {
        lines.push("");
        lines.push("### Full analysis pipeline");
        lines.push("");
        lines.push("| Metric | Result |");
        lines.push("|---|---|");
        lines.push(`| Runs completed without error | ${fmt(p.successRate, "%")} of ${p.runs} |`);
        lines.push(`| Report schema valid | ${fmt(p.schemaValidRate, "%")} |`);
        lines.push(`| Runs meeting all expectations | ${fmt(p.passRate, "%")} |`);
        lines.push(`| Private-company guardrails (PASS, 5-20% confidence, null metrics) | ${p.privateGuardrails.passed} / ${p.privateGuardrails.runs} |`);
        lines.push(`| Average metrics filled per public report | ${fmt(p.avgMetricsFilled)} / ${METRIC_KEYS.length} |`);
        lines.push(`| Latency, seconds (mean / median / p95) | ${p.latencySec ? `${p.latencySec.mean} / ${p.latencySec.median} / ${p.latencySec.p95}` : "n/a"} |`);
        lines.push(`| Verdict stability across repeats | ${p.stability ? `${p.stability.stable} of ${p.stability.cases} companies gave the same verdict every time` : "not measured (use --repeat 3)"} |`);
    }

    const failures = [
        ...resolveRows.filter((x) => x.scored && x.got !== "ERROR" && !x.pass).map((x) => `- Resolver: "${x.input}" expected ${x.expected}, got ${x.got}${x.tickerGot ? ` (${x.tickerGot})` : x.candidatesGot ? ` [${x.candidatesGot.join(", ")}]` : ""} (failed: ${x.failed.join(", ")})`),
        ...pipelineRows.filter((x) => !x.pass).map((x) => `- Pipeline: "${x.input}" run ${x.run} failed: ${x.failed.join(", ")}${x.error ? ` (${x.error})` : ""}`),
    ];
    lines.push("");
    lines.push("### Failures to review");
    lines.push("");
    lines.push(failures.length ? failures.join("\n") : "None.");
    lines.push("");
    lines.push("_A failure can be a system bug or a wrong expectation in eval/dataset.js. Check each one by hand._");
    return lines.join("\n");
}