## Evaluation results

- Date: 2026-11-27
- Model: openai/gpt-oss-120b
- Resolver cases: 32 scored
- Pipeline runs: not run (use --full)

### Company resolver (code only, no LLM)

| Metric | Result |
|---|---|
| Cases passed | 30 / 32 (93.8%) |
| Ticker accuracy (single-company cases) | 100% (19 checks) |
| Ambiguity / collision detection | 100% (5 cases) |
| Unneeded popups (clear name, popup shown) | 4.8% |
| Missed collisions (should have asked, did not) | 0 |

| Category | Passed | Total |
|---|---|---|
| india-single | 8 | 10 |
| global-single | 7 | 7 |
| brand-name | 1 | 1 |
| ambiguous-name | 4 | 4 |
| ticker-collision | 2 | 2 |
| explicit-ticker | 4 | 4 |
| private | 3 | 3 |
| fake | 1 | 1 |

### Failures to review

- Resolver: "TCS" expected SINGLE, got MULTIPLE [TCS.NS, TCS.TO, TCS.HA] (failed: status)
- Resolver: "Titan Company" expected SINGLE, got NO_MATCH (failed: status)

_A failure can be a system bug or a wrong expectation in eval/dataset.js. Check each one by hand._