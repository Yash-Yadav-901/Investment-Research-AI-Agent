// eval/dataset.js
// Test cases for the evaluation. Expectations are what I BELIEVE is true; when a case fails,
// look at it manually: it can be a system bug OR a wrong expectation (listings and names change).
//
// expect:   { status | statusAnyOf, ticker | tickerAnyOf (SINGLE only), mustInclude (MULTIPLE only) }
// pipeline: (optional) also run the full analysis on this case with --full
//           { marketType, ticker | tickerAnyOf }  or  { private: true }  or  { expectPass: true }
// scored:   false = printed for information only, not counted in the metrics

export const CASES = [
    // ---- India: one clear company --------------------------------------------------------
    { id: "in-tcs", input: "TCS", category: "india-single", expect: { status: "SINGLE", ticker: "TCS.NS" }, pipeline: { marketType: "INDIAN", ticker: "TCS.NS" } },
    { id: "in-infosys", input: "Infosys", category: "india-single", expect: { status: "SINGLE", ticker: "INFY.NS" }, pipeline: { marketType: "INDIAN", ticker: "INFY.NS" } },
    { id: "in-wipro", input: "Wipro", category: "india-single", expect: { status: "SINGLE", ticker: "WIPRO.NS" } },
    { id: "in-hdfcbank", input: "HDFC Bank", category: "india-single", expect: { status: "SINGLE", ticker: "HDFCBANK.NS" }, pipeline: { marketType: "INDIAN", ticker: "HDFCBANK.NS" } },
    { id: "in-reliance", input: "Reliance Industries", category: "india-single", expect: { status: "SINGLE", ticker: "RELIANCE.NS" }, pipeline: { marketType: "INDIAN", ticker: "RELIANCE.NS" } },
    { id: "in-lt", input: "Larsen & Toubro", category: "india-single", expect: { status: "SINGLE", ticker: "LT.NS" } },
    { id: "in-titan", input: "Titan Company", category: "india-single", expect: { status: "SINGLE", ticker: "TITAN.NS" } },
    { id: "in-asianpaints", input: "Asian Paints", category: "india-single", expect: { status: "SINGLE", ticker: "ASIANPAINT.NS" } },
    { id: "in-pwl", input: "Physics Wallah", category: "india-single", expect: { status: "SINGLE", ticker: "PWL.NS" } },
    { id: "in-maruti", input: "Maruti Suzuki", category: "india-single", expect: { status: "SINGLE", ticker: "MARUTI.NS" } },

    // ---- Global: one clear company -------------------------------------------------------
    { id: "gl-apple", input: "Apple", category: "global-single", expect: { status: "SINGLE", ticker: "AAPL" }, pipeline: { marketType: "GLOBAL", ticker: "AAPL" } },
    { id: "gl-msft", input: "Microsoft", category: "global-single", expect: { status: "SINGLE", ticker: "MSFT" }, pipeline: { marketType: "GLOBAL", ticker: "MSFT" } },
    { id: "gl-tsla", input: "Tesla", category: "global-single", expect: { status: "SINGLE", ticker: "TSLA" } },
    { id: "gl-nvda", input: "NVIDIA", category: "global-single", expect: { status: "SINGLE", ticker: "NVDA" }, pipeline: { marketType: "GLOBAL", ticker: "NVDA" } },
    { id: "gl-amzn", input: "Amazon", category: "global-single", expect: { status: "SINGLE", ticker: "AMZN" } },
    { id: "gl-nflx", input: "Netflix", category: "global-single", expect: { status: "SINGLE", ticker: "NFLX" } },
    { id: "gl-toyota", input: "Toyota Motor", category: "global-single", expect: { status: "SINGLE", tickerAnyOf: ["TM", "7203.T"] } },

    // ---- Brand name differs from legal name (resolver may return NO_MATCH, then the LLM classifies) ----
    {
        id: "br-google", input: "Google", category: "brand-name",
        expect: { statusAnyOf: ["NO_MATCH", "SINGLE"], tickerAnyOf: ["GOOG", "GOOGL"] },
        pipeline: { marketType: "GLOBAL", tickerAnyOf: ["GOOG", "GOOGL"] },
    },

    // ---- Same name, several companies: the popup must appear ------------------------------
    { id: "am-tata", input: "Tata", category: "ambiguous-name", expect: { status: "MULTIPLE", mustInclude: ["TATASTEEL.NS", "TATAPOWER.NS"] } },
    { id: "am-mahindra", input: "Mahindra", category: "ambiguous-name", expect: { status: "MULTIPLE", mustInclude: ["M&M.NS", "TECHM.NS"] } },
    { id: "am-hdfc", input: "HDFC", category: "ambiguous-name", expect: { status: "MULTIPLE", mustInclude: ["HDFCBANK.NS", "HDFCLIFE.NS"] } },

    { id: "am-boat", input: "BOAT", category: "ambiguous-name", expect: { status: "MULTIPLE" } },

    // ---- Same ticker, different companies on different exchanges --------------------------
    { id: "co-ltm", input: "LTM", category: "ticker-collision", expect: { status: "MULTIPLE", mustInclude: ["LTM", "LTM.NS"] } },
    { id: "co-hal", input: "HAL", category: "ticker-collision", expect: { status: "MULTIPLE", mustInclude: ["HAL", "HAL.NS"] } },

    // ---- User types an exact ticker --------------------------------------------------------
    { id: "ex-ltmns", input: "LTM.NS", category: "explicit-ticker", expect: { status: "SINGLE", ticker: "LTM.NS" }, pipeline: { marketType: "INDIAN", ticker: "LTM.NS" } },
    { id: "ex-infyns", input: "INFY.NS", category: "explicit-ticker", expect: { status: "SINGLE", ticker: "INFY.NS" } },
    { id: "ex-infy", input: "INFY", category: "explicit-ticker", expect: { status: "SINGLE", ticker: "INFY" } },
    { id: "ex-aapl", input: "AAPL", category: "explicit-ticker", expect: { status: "SINGLE", ticker: "AAPL" } },

    // ---- Long-time private companies (no public listing) ----------------------------------
    { id: "pr-cargill", input: "Cargill", category: "private", expect: { status: "NO_MATCH" }, pipeline: { private: true } },
    { id: "pr-koch", input: "Koch Industries", category: "private", expect: { status: "NO_MATCH" }, pipeline: { private: true } },
    { id: "pr-byjus", input: "Byju's", category: "private", expect: { status: "NO_MATCH" } },

    // ---- Company that does not exist -------------------------------------------------------
    { id: "fk-xyz", input: "Xyzabc Holdings", category: "fake", expect: { status: "NO_MATCH" }, pipeline: { expectPass: true } },

    // ---- Information only (listing status or names changed recently; not scored) -----------
    // Known limitation: "Rolex" matches Rolex Rings (a real, unrelated Indian company) and is auto-selected.
    { id: "info-rolex", input: "Rolex", category: "info", scored: false, expect: { status: "NO_MATCH" } },
    { id: "info-spacex", input: "SpaceX", category: "info", scored: false, expect: { status: "SINGLE" } },
    { id: "info-openai", input: "OpenAI", category: "info", scored: false, expect: { status: "NO_MATCH" } },
    { id: "info-anthropic", input: "Anthropic", category: "info", scored: false, expect: { status: "NO_MATCH" } },
    { id: "info-stripe", input: "Stripe", category: "info", scored: false, expect: { status: "NO_MATCH" } },
    { id: "info-databricks", input: "Databricks", category: "info", scored: false, expect: { status: "NO_MATCH" } },
    { id: "info-facebook", input: "Facebook", category: "info", scored: false, expect: { status: "SINGLE" } },
    { id: "info-zomato", input: "Zomato", category: "info", scored: false, expect: { status: "SINGLE" } },
    { id: "info-paytm", input: "Paytm", category: "info", scored: false, expect: { status: "SINGLE" } },
];