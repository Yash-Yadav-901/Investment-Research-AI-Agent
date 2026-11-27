// eval/selftest.js  -  checks the scoring logic itself. Run: node eval/selftest.js
import assert from "node:assert/strict";
import { CASES } from "./dataset.js";
import { scoreResolve, scorePipeline, summarize, toMarkdown } from "./evalCore.js";

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("ok  ", name); };

t("dataset: ids unique, statuses valid", () => {
    const ids = new Set(CASES.map((c) => c.id));
    assert.equal(ids.size, CASES.length);
    for (const c of CASES) {
        const s = c.expect.statusAnyOf ?? [c.expect.status];
        for (const x of s) assert.ok(["SINGLE", "MULTIPLE", "NO_MATCH"].includes(x), c.id);
    }
});

const byId = (id) => CASES.find((c) => c.id === id);
const cand = (ticker, name = ticker, other = []) => ({ name, ticker, exchange: "X", otherListings: other.map((o) => ({ ticker: o, exchange: "Y" })) });

t("resolver: correct SINGLE passes", () => {
    const r = scoreResolve(byId("in-tcs"), { status: "SINGLE", candidate: cand("TCS.NS") });
    assert.equal(r.pass, true);
});
t("resolver: wrong ticker fails", () => {
    const r = scoreResolve(byId("in-tcs"), { status: "SINGLE", candidate: cand("TCS.BO") });
    assert.equal(r.pass, false);
    assert.deepEqual(r.failed, ["ticker"]);
});
t("resolver: popup on a clear name counts as false popup", () => {
    const r = scoreResolve(byId("in-tcs"), { status: "MULTIPLE", candidates: [cand("A"), cand("B")] });
    assert.equal(r.falsePopup, true);
    assert.equal(r.pass, false);
});
t("resolver: collision missed is recorded", () => {
    const r = scoreResolve(byId("co-ltm"), { status: "SINGLE", candidate: cand("LTM") });
    assert.equal(r.missedCollision, true);
    assert.equal(r.pass, false);
});
t("resolver: collision found passes (mustInclude also checks other listings)", () => {
    const r = scoreResolve(byId("co-ltm"), { status: "MULTIPLE", candidates: [cand("LTM"), cand("X", "X", ["LTM.NS"])] });
    assert.equal(r.pass, true);
});
t("resolver: statusAnyOf (brand name) accepts NO_MATCH", () => {
    assert.equal(scoreResolve(byId("br-google"), { status: "NO_MATCH" }).pass, true);
    assert.equal(scoreResolve(byId("br-google"), { status: "SINGLE", candidate: cand("GOOGL") }).pass, true);
    assert.equal(scoreResolve(byId("br-google"), { status: "SINGLE", candidate: cand("XYZ") }).pass, false);
});

const goodPrivate = { ok: true, ms: 9000, schemaValid: true, report: { metadata: { ticker: "PRIVATE", marketType: "PRIVATE" }, verdict: { decision: "PASS", confidenceScore: 10 }, financialMetrics: { price: null, currency: null, peRatio: null, debtToEquity: null, marketCap: null, profitMargins: null, returnOnEquity: null, revenueGrowth: null, earningsGrowth: null } } };

t("pipeline: private guardrails pass", () => {
    assert.equal(scorePipeline(byId("pr-cargill"), goodPrivate).pass, true);
});
t("pipeline: private with 40% confidence fails", () => {
    const bad = structuredClone(goodPrivate);
    bad.report.verdict.confidenceScore = 40;
    const r = scorePipeline(byId("pr-cargill"), bad);
    assert.equal(r.pass, false);
    assert.deepEqual(r.failed, ["confidence5to20"]);
});
t("pipeline: private with a non-null metric fails", () => {
    const bad = structuredClone(goodPrivate);
    bad.report.financialMetrics.price = 12;
    assert.ok(scorePipeline(byId("pr-cargill"), bad).failed.includes("metricsNull"));
});
t("pipeline: public checks market, ticker and counts metrics", () => {
    const out = { ok: true, ms: 12000, schemaValid: true, report: { metadata: { ticker: "TCS.NS", marketType: "INDIAN" }, verdict: { decision: "INVEST", confidenceScore: 70 }, financialMetrics: { price: 1, peRatio: 2, debtToEquity: null, marketCap: 4, profitMargins: 5, returnOnEquity: 6, revenueGrowth: null, earningsGrowth: 8, currency: "INR" } } };
    const r = scorePipeline(byId("in-tcs"), out);
    assert.equal(r.pass, true);
    assert.equal(r.metricsFilled, 6);
});
t("pipeline: failed run is recorded", () => {
    const r = scorePipeline(byId("in-tcs"), { ok: false, error: "boom", ms: 100 });
    assert.equal(r.pass, false);
    assert.deepEqual(r.failed, ["ran"]);
});
t("pipeline: fake company must be PASS", () => {
    const out = structuredClone(goodPrivate);
    out.report.verdict.decision = "INVEST";
    assert.equal(scorePipeline(byId("fk-xyz"), out).pass, false);
});

t("summary: numbers add up and markdown renders", () => {
    const rrows = [
        scoreResolve(byId("in-tcs"), { status: "SINGLE", candidate: cand("TCS.NS") }),
        scoreResolve(byId("in-wipro"), { status: "NO_MATCH" }),
        scoreResolve(byId("co-ltm"), { status: "MULTIPLE", candidates: [cand("LTM"), cand("LTM.NS")] }),
        scoreResolve(byId("info-spacex"), { status: "SINGLE", candidate: cand("SPCX") }),
    ];
    const prow = [
        scorePipeline(byId("pr-cargill"), goodPrivate, 1),
        scorePipeline(byId("pr-cargill"), goodPrivate, 2),
    ];
    const s = summarize(rrows, prow);
    assert.equal(s.resolve.scoredCases, 3); // info case excluded
    assert.equal(s.resolve.passed, 2);
    assert.equal(s.resolve.accuracy, 66.7);
    assert.equal(s.pipeline.privateGuardrails.passed, 2);
    assert.equal(s.pipeline.stability.stable, 1);
    assert.equal(s.pipeline.latencySec.median, 9);
    const md = toMarkdown(s, { date: "2026-11-27", model: "m" }, rrows, prow);
    assert.ok(md.includes("Cases passed | 2 / 3 (66.7%)"));
    assert.ok(md.includes('Resolver: "Wipro" expected SINGLE, got NO_MATCH'));
});

console.log(`\n${n} checks passed`);