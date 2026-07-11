import { ChatGroq } from "@langchain/groq";
import {
    MessagesAnnotation,
    StateGraph,
    MemorySaver,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import readline from "node:readline/promises";
import YahooFinance from "yahoo-finance2";
import { tavily } from "@tavily/core";
import { z } from "zod";
import "dotenv/config";

// ENVIRONMENT VALIDATION


if (!process.env.GROQ_API_KEY) {
    throw new Error(
        "Missing GROQ_API_KEY in .env file."
    );
}

if (!process.env.GROQ_MODEL) {
    throw new Error(
        "Missing GROQ_MODEL in .env file."
    );
}

if (!process.env.TAVILY_API_KEY) {
    console.warn(
        "⚠️ TAVILY_API_KEY is missing. News search will be unavailable."
    );
}

// 1. GLOBAL CLIENTS


const checkpointer = new MemorySaver();
const yahooFinance = new YahooFinance();

const baseModel = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL,
    temperature: 0,
    maxRetries: 2,
});


// HELPER FUNCTIONS

function normalizeTicker(ticker) {
    return String(ticker ?? "")
        .trim()
        .toUpperCase();
}

function isNseTicker(symbol = "") {
    return symbol.toUpperCase().endsWith(".NS");
}

function isBseTicker(symbol = "") {
    return symbol.toUpperCase().endsWith(".BO");
}

function safeNumber(value) {
    return typeof value === "number" &&
        Number.isFinite(value)
        ? value
        : null;
}

function safeString(value) {
    return typeof value === "string" &&
        value.trim()
        ? value.trim()
        : null;
}

function stringifyError(error) {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
}

function explainModelError(error) {
    const message = stringifyError(error);

    if (
        /429|quota|rate limit|too many requests/i.test(
            message
        )
    ) {
        return [
            "Groq API rate limit or quota was reached.",
            "Wait and retry, or check your Groq account limits.",
            `Original error: ${message}`,
        ].join(" ");
    }

    if (
        /404|model.*not found|does not exist|decommissioned/i.test(
            message
        )
    ) {
        return [
            "The selected Groq model is unavailable.",
            "Check GROQ_MODEL in your .env file.",
            "Use a model currently available to your Groq account.",
            `Original error: ${message}`,
        ].join(" ");
    }

    if (
        /401|403|unauthorized|forbidden|api key/i.test(
            message
        )
    ) {
        return [
            "The Groq API key is invalid or unauthorized.",
            "Check GROQ_API_KEY in your .env file.",
            `Original error: ${message}`,
        ].join(" ");
    }

    return message;
}


//  TICKER RESOLUTION


async function resolveTicker(ticker, market) {
    const rawTicker = normalizeTicker(ticker);

    if (!rawTicker) {
        throw new Error(
            "Ticker/company name cannot be empty."
        );
    }

    // Already explicit Indian Yahoo ticker
    if (
        market === "INDIAN" &&
        (
            isNseTicker(rawTicker) ||
            isBseTicker(rawTicker)
        )
    ) {
        return rawTicker;
    }

    const searchQueries =
        market === "INDIAN"
            ? [
                rawTicker,
                `${rawTicker}.NS`,
                `${rawTicker}.BO`,
            ]
            : [rawTicker];

    for (const query of searchQueries) {
        try {
            const result = await yahooFinance.search(
                query,
                {
                    quotesCount: 10,
                    newsCount: 0,
                }
            );

            const quotes = Array.isArray(result?.quotes)
                ? result.quotes
                : [];

            if (quotes.length === 0) {
                continue;
            }

           
            // INDIAN MARKET
          

            if (market === "INDIAN") {
                // 1. Exact NSE symbol
                const exactNse = quotes.find((quote) => {
                    const symbol =
                        quote?.symbol?.toUpperCase();

                    return symbol === `${rawTicker}.NS`;
                });

                if (exactNse?.symbol) {
                    return exactNse.symbol;
                }

                // 2. Prefer NSE equity
                const nseEquity = quotes.find(
                    (quote) => {
                        const symbol =
                            quote?.symbol || "";

                        return (
                            symbol.endsWith(".NS") &&
                            quote?.quoteType === "EQUITY"
                        );
                    }
                );

                if (nseEquity?.symbol) {
                    return nseEquity.symbol;
                }

                // 3. Any NSE result
                const anyNse = quotes.find(
                    (quote) =>
                        quote?.symbol?.endsWith(".NS")
                );

                if (anyNse?.symbol) {
                    return anyNse.symbol;
                }

                // 4. Prefer BSE equity
                const bseEquity = quotes.find(
                    (quote) => {
                        const symbol =
                            quote?.symbol || "";

                        return (
                            symbol.endsWith(".BO") &&
                            quote?.quoteType === "EQUITY"
                        );
                    }
                );

                if (bseEquity?.symbol) {
                    return bseEquity.symbol;
                }

                // 5. Any BSE result
                const anyBse = quotes.find(
                    (quote) =>
                        quote?.symbol?.endsWith(".BO")
                );

                if (anyBse?.symbol) {
                    return anyBse.symbol;
                }
            }

           
            // GLOBAL MARKET
          

            if (market === "GLOBAL") {
                const equityResult = quotes.find(
                    (quote) =>
                        quote?.quoteType === "EQUITY"
                );

                if (equityResult?.symbol) {
                    return equityResult.symbol;
                }

                const firstValid = quotes.find(
                    (quote) =>
                        typeof quote?.symbol === "string" &&
                        quote.symbol.trim()
                );

                if (firstValid?.symbol) {
                    return firstValid.symbol;
                }
            }
        } catch (error) {
            console.warn(
                `⚠️ Ticker search failed for "${query}":`,
                stringifyError(error)
            );
        }
    }

    // Final fallback for simple Indian ticker
    if (
        market === "INDIAN" &&
        /^[A-Z0-9&-]+$/.test(rawTicker)
    ) {
        return `${rawTicker}.NS`;
    }

    return rawTicker;
}


//TOOL: LIVE MARKET PRICE


const getLivePriceTool = tool(
    async ({ ticker, market }) => {
        try {
            const resolvedTicker =
                await resolveTicker(
                    ticker,
                    market
                );

            console.log(
                `\n📈 [Price Tool] Fetching: ${resolvedTicker}`
            );

            const data = await yahooFinance.quote(
                resolvedTicker
            );

            const price = safeNumber(
                data?.regularMarketPrice
            );

            if (price === null) {
                return JSON.stringify({
                    status: "DATA_UNAVAILABLE",
                    requestedTicker: ticker,
                    resolvedTicker,
                    market,
                    price: null,
                    currency: safeString(
                        data?.currency
                    ),
                    companyName:
                        safeString(data?.longName) ??
                        safeString(data?.shortName),
                    reason:
                        "Yahoo Finance returned no regular market price.",
                    source: "Yahoo Finance",
                });
            }

            return JSON.stringify({
                status: "SUCCESS",
                requestedTicker: ticker,
                resolvedTicker,
                market,

                companyName:
                    safeString(data?.longName) ??
                    safeString(data?.shortName),

                price,

                currency: safeString(
                    data?.currency
                ),

                exchange:
                    safeString(
                        data?.fullExchangeName
                    ) ??
                    safeString(data?.exchange),

                marketState: safeString(
                    data?.marketState
                ),

                previousClose: safeNumber(
                    data?.regularMarketPreviousClose
                ),

                dayHigh: safeNumber(
                    data?.regularMarketDayHigh
                ),

                dayLow: safeNumber(
                    data?.regularMarketDayLow
                ),

                marketTime:
                    data?.regularMarketTime ?? null,

                source: "Yahoo Finance",
            });
        } catch (error) {
            return JSON.stringify({
                status: "ERROR",
                requestedTicker: ticker,
                market,
                price: null,
                currency: null,
                reason: stringifyError(error),
                source: "Yahoo Finance",
            });
        }
    },
    {
        name: "get_live_market_price",

        description:
            "Fetch current market price and quote metadata for an Indian or global stock. Accepts a ticker symbol or company name.",

        schema: z.object({
            ticker: z
                .string()
                .min(1)
                .describe(
                    "Ticker symbol or company name, for example TCS, Infosys, AAPL, Apple"
                ),

            market: z
                .enum(["INDIAN", "GLOBAL"])
                .describe(
                    "Use INDIAN for NSE/BSE companies and GLOBAL for non-Indian companies"
                ),
        }),
    }
);


// TOOL: FINANCIAL FUNDAMENTALS


const getFundamentalsTool = tool(
    async ({ ticker, market }) => {
        try {
            const resolvedTicker =
                await resolveTicker(
                    ticker,
                    market
                );

            console.log(
                `\n📊 [Fundamentals Tool] Fetching: ${resolvedTicker}`
            );

            const summary =
                await yahooFinance.quoteSummary(
                    resolvedTicker,
                    {
                        modules: [
                            "price",
                            "summaryDetail",
                            "defaultKeyStatistics",
                            "financialData",
                            "assetProfile",
                        ],
                    }
                );

            const priceData =
                summary?.price ?? {};

            const summaryDetail =
                summary?.summaryDetail ?? {};

            const keyStats =
                summary?.defaultKeyStatistics ?? {};

            const financialData =
                summary?.financialData ?? {};

            const assetProfile =
                summary?.assetProfile ?? {};

           
            // FINANCIAL METRICS
          

            const peRatio =
                safeNumber(
                    summaryDetail?.trailingPE
                ) ??
                safeNumber(
                    keyStats?.trailingPE
                );

            const forwardPE =
                safeNumber(
                    summaryDetail?.forwardPE
                ) ??
                safeNumber(
                    keyStats?.forwardPE
                );

            const debtToEquity =
                safeNumber(
                    financialData?.debtToEquity
                );

            const marketCap =
                safeNumber(
                    priceData?.marketCap
                ) ??
                safeNumber(
                    summaryDetail?.marketCap
                );

            const profitMargins =
                safeNumber(
                    keyStats?.profitMargins
                ) ??
                safeNumber(
                    financialData?.profitMargins
                );

            const returnOnEquity =
                safeNumber(
                    financialData?.returnOnEquity
                );

            const revenueGrowth =
                safeNumber(
                    financialData?.revenueGrowth
                );

            const earningsGrowth =
                safeNumber(
                    financialData?.earningsGrowth
                );

            const currentRatio =
                safeNumber(
                    financialData?.currentRatio
                );

            const totalDebt =
                safeNumber(
                    financialData?.totalDebt
                );

            const totalCash =
                safeNumber(
                    financialData?.totalCash
                );

            const freeCashflow =
                safeNumber(
                    financialData?.freeCashflow
                );

            const hasAnyFundamental =
                peRatio !== null ||
                forwardPE !== null ||
                debtToEquity !== null ||
                marketCap !== null ||
                profitMargins !== null ||
                returnOnEquity !== null ||
                revenueGrowth !== null ||
                earningsGrowth !== null;

            return JSON.stringify({
                status: hasAnyFundamental
                    ? "SUCCESS"
                    : "PARTIAL_DATA",

                requestedTicker: ticker,
                resolvedTicker,
                market,

                companyName:
                    safeString(
                        priceData?.longName
                    ) ??
                    safeString(
                        priceData?.shortName
                    ),

                currency: safeString(
                    priceData?.currency
                ),

                metrics: {
                    peRatio,
                    forwardPE,
                    debtToEquity,
                    marketCap,
                    profitMargins,
                    returnOnEquity,
                    revenueGrowth,
                    earningsGrowth,
                    currentRatio,
                    totalDebt,
                    totalCash,
                    freeCashflow,
                },

                companyProfile: {
                    sector: safeString(
                        assetProfile?.sector
                    ),

                    industry: safeString(
                        assetProfile?.industry
                    ),

                    country: safeString(
                        assetProfile?.country
                    ),

                    website: safeString(
                        assetProfile?.website
                    ),

                    employeeCount: safeNumber(
                        assetProfile?.fullTimeEmployees
                    ),

                    businessSummary: safeString(
                        assetProfile?.longBusinessSummary
                    ),
                },

                source: "Yahoo Finance",

                note:
                    "Null values mean the source did not provide that metric. No values were fabricated.",
            });
        } catch (error) {
            return JSON.stringify({
                status: "ERROR",
                requestedTicker: ticker,
                market,

                metrics: {
                    peRatio: null,
                    forwardPE: null,
                    debtToEquity: null,
                    marketCap: null,
                    profitMargins: null,
                    returnOnEquity: null,
                    revenueGrowth: null,
                    earningsGrowth: null,
                    currentRatio: null,
                    totalDebt: null,
                    totalCash: null,
                    freeCashflow: null,
                },

                reason: stringifyError(error),
                source: "Yahoo Finance",
            });
        }
    },
    {
        name: "get_financial_fundamentals",

        description:
            "Fetch verified company fundamentals including P/E ratio, debt-to-equity, growth, profitability, cash flow, sector, industry, and business profile. Never fabricates missing metrics.",

        schema: z.object({
            ticker: z
                .string()
                .min(1)
                .describe(
                    "Ticker symbol or company name"
                ),

            market: z.enum([
                "INDIAN",
                "GLOBAL",
            ]),
        }),
    }
);


//TOOL: MARKET NEWS


const getWebNewsTool = tool(
    async ({ query }) => {
        if (!process.env.TAVILY_API_KEY) {
            return JSON.stringify({
                status: "ERROR",
                query,
                results: [],
                reason:
                    "TAVILY_API_KEY is not configured.",
                source: "Tavily",
            });
        }

        try {
            console.log(
                `\n📰 [News Tool] Searching: ${query}`
            );

            const tvly = tavily({
                apiKey:
                    process.env.TAVILY_API_KEY,
            });

            const news = await tvly.search(
                query,
                {
                    topic: "news",
                    maxResults: 5,
                    searchDepth: "advanced",
                }
            );

            const results = Array.isArray(
                news?.results
            )
                ? news.results
                    .map((item) => ({
                        title: safeString(
                            item?.title
                        ),

                        url: safeString(
                            item?.url
                        ),

                        content: safeString(
                            item?.content
                        ),

                        publishedDate:
                            safeString(
                                item?.publishedDate
                            ) ??
                            safeString(
                                item?.published_date
                            ),

                        score: safeNumber(
                            item?.score
                        ),
                    }))
                    .filter(
                        (item) =>
                            item.title ||
                            item.url ||
                            item.content
                    )
                : [];

            if (results.length === 0) {
                return JSON.stringify({
                    status: "NO_RESULTS",
                    query,
                    results: [],
                    source: "Tavily",
                });
            }

            return JSON.stringify({
                status: "SUCCESS",
                query,
                resultCount: results.length,
                results,
                source: "Tavily",
            });
        } catch (error) {
            return JSON.stringify({
                status: "ERROR",
                query,
                results: [],
                reason: stringifyError(error),
                source: "Tavily",
            });
        }
    },
    {
        name: "search_market_news",

        description:
            "Search current web news for company earnings, corporate events, regulatory developments, business catalysts, and investment risks.",

        schema: z.object({
            query: z
                .string()
                .min(1)
                .describe(
                    "Detailed current market-news search query"
                ),
        }),
    }
);


//TOOL REGISTRY


const tools = [
    getLivePriceTool,
    getFundamentalsTool,
    getWebNewsTool,
];

const toolNode = new ToolNode(tools);


// STRUCTURED INVESTMENT REPORT SCHEMA


const InvestmentReportSchema = z.object({
    metadata: z.object({
        ticker: z.string(),

        companyName: z.string(),

        marketType: z.enum([
            "INDIAN",
            "GLOBAL",
        ]),

        companySummary: z.string(),
    }),

    verdict: z.object({
        decision: z.enum([
            "INVEST",
            "PASS",
        ]),

        confidenceScore: z
            .number()
            .min(0)
            .max(100),
    }),

    financialMetrics: z.object({
        price: z
            .number()
            .nullable(),

        currency: z
            .string()
            .nullable(),

        peRatio: z
            .number()
            .nullable(),

        debtToEquity: z
            .number()
            .nullable(),

        marketCap: z
            .number()
            .nullable(),

        profitMargins: z
            .number()
            .nullable(),

        returnOnEquity: z
            .number()
            .nullable(),

        revenueGrowth: z
            .number()
            .nullable(),

        earningsGrowth: z
            .number()
            .nullable(),
    }),

    keyCatalysts: z.array(
        z.string()
    ),

    investmentRisks: z.array(
        z.string()
    ),

    recentNews: z.array(
        z.object({
            headline: z.string(),

            summary: z.string(),

            url: z
                .string()
                .nullable(),
        })
    ),

    dataQuality: z.object({
        priceAvailable: z.boolean(),

        fundamentalsAvailable:
            z.boolean(),

        newsAvailable: z.boolean(),

        limitations: z.array(
            z.string()
        ),
    }),

    // DETAILED EVIDENCE-BASED DECISION EXPLANATION
   

    decisionAnalysis: z.object({
        valuationAssessment: z.string(),

        financialHealthAssessment:
            z.string(),

        growthAssessment: z.string(),

        newsSentimentAssessment:
            z.string(),

        riskAssessment: z.string(),

        finalDecisionReason: z.string(),

        evidenceUsed: z.array(
            z.object({
                claim: z.string(),

                evidence: z.string(),

                source: z.enum([
                    "Yahoo Finance",
                    "Tavily",
                ]),
            })
        ),
    }),

    rationale: z.string(),

    disclaimer: z.string(),
});

//AGENT NODE


async function callModel(state) {
    const systemPrompt = {
        role: "system",

        content: `
You are a senior investment research analyst operating a tool-driven research workflow.

Your job is to research the company requested by the user before producing conclusions.

MANDATORY RESEARCH PROCESS:

1. Determine whether the company is INDIAN or GLOBAL.
2. Correct obvious company-name or ticker spelling mistakes.
3. Call get_live_market_price for current pricing.
4. Call get_financial_fundamentals for company fundamentals.
5. Call search_market_news for recent company-specific news, earnings, catalysts, and risks.
6. After tool results are available, inspect them carefully.
7. If a tool failed, do not invent missing data.
8. Never fabricate:
   - stock prices
   - P/E ratios
   - debt-to-equity values
   - financial metrics
   - news
   - URLs
9. Treat null values as unavailable.
10. For Indian companies always use market="INDIAN".
11. For non-Indian companies use market="GLOBAL".
12. Base the final assessment only on retrieved evidence.
13. If data quality is weak, lower confidence.
14. When evaluating evidence, distinguish:
   - valuation
   - financial health
   - growth
   - recent news
   - material risks
15. Keep conclusions traceable to retrieved tool outputs.
16. Do not create unsupported claims.

IMPORTANT:

You have not completed research until you have attempted all three categories:
- live price
- fundamentals
- recent news

After all necessary tool calls and results are available, stop calling tools.
`,
    };

    const llmWithTools =
        baseModel.bindTools(tools);

    const response =
        await llmWithTools.invoke([
            systemPrompt,
            ...state.messages,
        ]);

    return {
        messages: [response],
    };
}

//  STRUCTURED REPORT NODE


async function structureReportNode(state) {
    const structuredLLM =
        baseModel.withStructuredOutput(
            InvestmentReportSchema
        );

    const formattingInstruction = {
        role: "system",

        content: `
Create the final investment research report from the conversation and tool results.

STRICT DATA RULES:

1. Use only values explicitly returned by tools.

2. Never invent a missing number.

3. If price is unavailable:
   - set price to null.

4. If P/E is unavailable:
   - set peRatio to null.

5. If debt-to-equity is unavailable:
   - set debtToEquity to null.

6. Apply the same null rule to every unavailable financial metric.

7. Never invent:
   - news headlines
   - news summaries
   - URLs
   - financial metrics
   - company facts

8. If news is unavailable:
   - use an empty recentNews array.

9. Include:
   - tool failures
   - unavailable metrics
   - missing evidence
   inside dataQuality.limitations.

10. confidenceScore must be between 0 and 100.

11. Lower confidence when important data is unavailable.

12. INVEST means the retrieved evidence supports a favorable investment view.

13. PASS means:
   - evidence is insufficient, OR
   - material risks dominate, OR
   - valuation appears unattractive based on retrieved data, OR
   - data quality is too weak.

14. Do not claim certainty about future returns.

15. The disclaimer must clearly state that this is informational research and not personalized financial advice.

DECISION ANALYSIS RULES:

16. Fill decisionAnalysis with concise evidence-linked explanations.

17. valuationAssessment:
   - explain what retrieved valuation metrics imply
   - use P/E or other retrieved valuation evidence
   - if valuation data is missing, explicitly state that valuation cannot be fully assessed

18. financialHealthAssessment:
   - explain retrieved leverage evidence
   - explain profitability evidence
   - explain liquidity evidence when available
   - explain cash-flow evidence when available
   - do not infer unavailable values

19. growthAssessment:
   - explain retrieved revenue growth
   - explain retrieved earnings growth
   - if either is unavailable, state that limitation

20. newsSentimentAssessment:
   - summarize the direction of retrieved recent news
   - explain whether retrieved developments appear positive, negative, mixed, or inconclusive
   - do not invent events
   - do not invent sentiment unsupported by the retrieved article content

21. riskAssessment:
   - explain the most material risks supported by:
     - retrieved metrics
     - retrieved company information
     - retrieved recent news

22. finalDecisionReason:
   - explicitly explain why the final decision is INVEST or PASS
   - connect the strongest positive evidence
   - connect the strongest negative evidence
   - explain why one side outweighs the other
   - explain how missing data affected confidence

23. evidenceUsed:
   - include only claims traceable to tool outputs
   - each item must contain:
     - claim
     - exact supporting evidence
     - source

24. For evidenceUsed.source:
   - use "Yahoo Finance" for price, fundamentals, and company profile evidence
   - use "Tavily" for retrieved news evidence

25. Never put unsupported claims inside evidenceUsed.

26. Do not reveal hidden chain-of-thought or private step-by-step reasoning.

27. Provide concise decision justification based on evidence instead.

28. If evidence is missing:
   - state the limitation
   - do not fill gaps with assumptions

IMPORTANT:

Preserve exact numerical values from tool outputs.

Do not estimate missing financial metrics.

Do not infer missing financial metrics.

The final decision explanation must be auditable from the retrieved tool evidence.

The rationale should provide a concise overall summary of:
- why the verdict was selected
- strongest positive factors
- strongest negative factors
- major data limitations
`,
    };

    const output =
        await structuredLLM.invoke([
            formattingInstruction,
            ...state.messages,
        ]);

    return {
        messages: [
            {
                role: "assistant",

                content: JSON.stringify(
                    output,
                    null,
                    2
                ),
            },
        ],
    };
}

// CONDITIONAL ROUTING


function shouldContinue(state) {
    const lastMessage =
        state.messages[
        state.messages.length - 1
        ];

    const toolCalls =
        lastMessage?.tool_calls;

    if (
        Array.isArray(toolCalls) &&
        toolCalls.length > 0
    ) {
        return "tools";
    }

    return "structureReport";
}


// LANGGRAPH WORKFLOW


const workflow =
    new StateGraph(MessagesAnnotation)
        .addNode(
            "agent",
            callModel
        )

        .addNode(
            "tools",
            toolNode
        )

        .addNode(
            "structureReport",
            structureReportNode
        )

        .addEdge(
            "__start__",
            "agent"
        )

        .addEdge(
            "tools",
            "agent"
        )

        .addEdge(
            "structureReport",
            "__end__"
        )

        .addConditionalEdges(
            "agent",
            shouldContinue,
            {
                tools: "tools",

                structureReport:
                    "structureReport",
            }
        );


// COMPILE GRAPH


const app = workflow.compile({
    checkpointer,
});


//TERMINAL RUNTIME




export async function researchAndAnalysis({companyName }) {
    
    if (
        !companyName ||
        typeof companyName !== "string" ||
        companyName.trim().length === 0
    ) {
        throw new Error(
            "companyName is required."
        );
    }

    try {
        const finalState = await app.invoke(
            {
                messages: [
                    {
                        role: "user",
                        content: `
Research this company as an investment candidate.

Company:
${companyName}

Determine the correct ticker.

Collect:
- Live market price
- Company fundamentals
- Recent market news

Generate a complete investment report.

Never fabricate unavailable information.
`,
                    },
                ],
            },
            {
                recursionLimit: 25,
            }
        );

        const lastMessage =
            finalState.messages[
            finalState.messages.length - 1
            ];

        if (!lastMessage?.content) {
            throw new Error(
                "Agent returned an empty response."
            );
        }

        const report = JSON.parse(
            lastMessage.content
        );

        return {
            success: true,
            generatedAt:
                new Date().toISOString(),
            report,
        };
    } catch (error) {
        throw new Error(
            explainModelError(error)
        );
    }
}

export { researchAndAnalysis };