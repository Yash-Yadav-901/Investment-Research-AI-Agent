# 🧠 Investment Research AI Agent

> A full-stack, LLM-powered financial intelligence platform that autonomously researches companies and produces structured investment reports using a multi-step agentic workflow.

---

## 📋 Table of Contents

1. [Overview — What it does](#-overview--what-it-does)
2. [Features](#-features)
3. [Steps to Use](#-steps-to-use)
4. [Architecture — How it works](#-architecture--how-it-works)
5. [Key Decisions & Trade-offs](#-key-decisions--trade-offs)
6. [How to Run — Setup Guide](#-how-to-run--setup-guide)
7. [Environment Variables](#-environment-variables)
8. [API Reference](#-api-reference)
9. [Example Runs](#-example-runs)
10. [What I Would Improve with More Time](#-what-i-would-improve-with-more-time)

---

## 📌 Overview — What it does

The **Investment Research AI Agent** is a full-stack web application that lets users research any publicly listed company (Indian or Global) or any private company using an autonomous AI agent pipeline.

### Core Capabilities

| Capability | Description |
|---|---|
| **Autonomous Research** | An AI agent uses a LangGraph ReAct workflow to fetch live market prices, company fundamentals, and recent news — in the right sequence — before generating a report |
| **Structured Reports** | Reports are structured via Zod schema validation and returned as typed JSON: verdict (INVEST / PASS), financials, catalysts, risks, news, decision reasoning |
| **Workspace Management** | Users organize research into project folders called Workspaces. Each workspace holds multiple companies |
| **Interactive Chat** | Each company dashboard includes a stateless Groq-powered chatbot pre-loaded with the company's research report as context |
| **Redis Caching** | API responses are cached in Redis with TTL to reduce duplicate LLM calls and Yahoo Finance hits |
| **Auth & Multi-tenancy** | Clerk provides OAuth + JWT authentication. Every resource is user-scoped |
| **PDF Report Export** | Users can download a generated PDF investment report per company |
| **Multi-market Support** | Handles Indian (NSE/BSE) and Global (US, EU, etc.) equities, and private companies intelligently |

---

## ✨ Features

### 🤖 1. Autonomous AI Research Agent
The core of the system is a **LangGraph ReAct agent** that reasons step-by-step before producing conclusions. It autonomously decides:
- Whether a company is Indian, Global, or Private
- Which Yahoo Finance ticker to resolve (handles fuzzy names like "Infosys", "HDFC", "Apple")
- Whether to call financial tools (skips them for private companies)
- When it has gathered enough data to stop and write the report

No hardcoded pipeline — the agent adapts its research path per company.

---

### 📊 2. Structured Investment Reports
Every analyzed company produces a **Zod-validated, typed JSON report** containing:

| Field | Description |
|---|---|
| `verdict.decision` | `INVEST` or `PASS` |
| `verdict.confidenceScore` | 0–100 confidence percentage |
| `financialMetrics` | Price, P/E ratio, Market Cap, Debt/Equity, Revenue Growth, ROE, Profit Margins |
| `keyCatalysts` | Bullish factors identified from data |
| `investmentRisks` | Key downside risks |
| `recentNews` | Last 5 news articles with URLs |
| `decisionAnalysis` | Valuation, financial health, growth, news sentiment, risk breakdown |
| `rationale` | Final concise reasoning paragraph |
| `dataQuality` | Flags for missing data and limitations |

---

### 🗂 3. Workspace Organization
Users can create multiple **Workspaces** to organize research:
- Each workspace is an isolated project (e.g., "Indian IT Sector", "US Tech Watchlist")
- Workspaces hold multiple company research cards
- Each workspace is private to the authenticated user
- Workspaces and their companies persist across sessions via PostgreSQL

---

### 🖱 4. Interactive React Flow Canvas
Inside each workspace, companies are rendered as **draggable nodes** on an infinite canvas using React Flow:
- The **Input Node** lets users type a company name and click Analyze
- The **Company Dashboard Node** shows the full report with tabs for financials, news, risks, and chat
- Nodes can be repositioned freely; positions are saved per company

---

### 💬 5. Context-Aware Chat Assistant
Each company dashboard includes a **Groq-powered chatbot** that:
- Is pre-loaded with the full company research report as system context
- Answers questions like "What is the P/E ratio?", "Summarize the risks", "Should I invest?"
- Maintains conversation history within the session (stateless — resets on page reload)
- Uses Llama-3.3-70b-versatile for fast, accurate financial Q&A

---

### ⚡ 6. Redis API Caching
All expensive operations are cached:
- `companyInfo:{company_name}` — cached for 10 minutes (AI analysis results)
- `workspaces:{userId}` — cached for 1 hour (workspace list)
- `workspace:{id}` — cached for 1 hour (workspace detail with companies)
- Cache is automatically invalidated on create/update/delete operations

---

### 🔐 7. Clerk Authentication & Multi-tenancy
- Google OAuth + Email/Password sign-in via Clerk
- JWT verified on every backend request via `clerkMiddleware()`
- Every workspace and company is scoped to the authenticated user's Clerk ID
- Unauthorized access returns 401/403 before any database query

---

### 📄 8. PDF Report Export
- Users can download a PDF version of the investment report per company
- PDF is generated server-side using Puppeteer
- Download triggers via the Report button on the company dashboard

---

### 🌍 9. Multi-Market Support
| Market Type | Handling |
|---|---|
| Indian (NSE) | Resolves to `.NS` suffix (e.g., `TCS.NS`, `HDFCBANK.NS`) |
| Indian (BSE) | Falls back to `.BO` suffix |
| Global (US/EU) | Uses standard Yahoo Finance ticker (e.g., `AAPL`, `TSLA`) |
| Private Company | Detects privately held status; skips financial tools; reports limitations |

---

### 🔔 10. Toast Notification System
- Real-time feedback for all operations (success, error, rate-limit warnings)
- User-friendly messages — no raw status codes shown
- Rate-limit errors display: *"Rate limit reached. Please wait a moment."*
- Built with `react-hot-toast` with custom Neo-brutalist styling

---

## 📖 Steps to Use

### Step 1 — Sign In
1. Open the app at `http://localhost:5173` (or your deployed URL)
2. Click **Sign In** on the landing page
3. Choose Google OAuth or Email/Password
4. You are redirected to the Home dashboard after authentication

---

### Step 2 — Create a Workspace
1. Click **Workspaces** in the sidebar navigation
2. Click the **folder icon** with the `+` badge
3. Enter a workspace name (e.g., `Indian IT Sector`, `My Portfolio`)
4. Click **Add Workspace**
5. Your new workspace appears in the grid — click it to open

---

### Step 3 — Analyze a Company
1. Inside the workspace, you see an **infinite canvas** with a small input card
2. Type a company name or ticker in the text field:
   - Indian examples: `TCS`, `Infosys`, `HDFC Bank`, `Reliance`
   - Global examples: `Apple`, `AAPL`, `Tesla`, `NVIDIA`
   - Private examples: `OpenAI`, `SpaceX` (agent handles gracefully)
3. Click **Analyze**
4. Wait ~10–20 seconds while the AI agent:
   - Resolves the ticker
   - Fetches live price + fundamentals from Yahoo Finance
   - Fetches recent news from Tavily
   - Generates and validates the structured report
5. The **Company Dashboard card** appears on the canvas with the full report

---

### Step 4 — Explore the Report
The Company Dashboard has multiple sections:

| Tab / Section | What you see |
|---|---|
| **Header** | Company name, ticker, market type, live price, verdict badge |
| **Verdict** | INVEST or PASS with confidence score |
| **Financial Metrics** | P/E, Market Cap, Debt/Equity, Revenue Growth, ROE, Profit Margins |
| **Key Catalysts** | Bullish investment factors from the research |
| **Investment Risks** | Key risks and downside factors |
| **Recent News** | Last 5 relevant news articles with links |
| **Decision Analysis** | Detailed valuation, financial health, growth, and sentiment breakdown |
| **Rationale** | Final investment reasoning paragraph |

---

### Step 5 — Chat with the AI about the Company
1. The right panel on each Company Dashboard is the **Chat Assistant**
2. Type any question about the company:
   - *"What is the current P/E ratio and is it overvalued?"*
   - *"Summarize the top 3 risks in simple terms"*
   - *"Compare the revenue growth to the sector average"*
   - *"Write a 3-sentence investment thesis for this company"*
3. The assistant responds using only the report data — it does not hallucinate

---

### Step 6 — Download PDF Report
1. Click the **Download Report** button on the Company Dashboard header
2. A PDF is generated server-side and downloaded to your device
3. The PDF contains the full structured research report

---

### Step 7 — Manage Your Research
- **Delete a company** — hover over a company card in the workspace grid → click the red `✕` button
- **Delete a workspace** — hover over the workspace folder in the grid → click the red `✕` button
- **Re-analyze a company** — click the refresh/update button on the Company Dashboard to re-run the AI agent with fresh data
- **Multiple workspaces** — you can have unlimited workspaces with unlimited companies

---

## 🏗 Architecture — How it works

### System Architecture Diagram

```
Browser (React 19)
       │
       │  HTTPS + Clerk JWT
       ▼
Express.js Backend (Node.js)
       │
   ┌───┴────────────────┐
   │  Clerk Middleware   │  ← Verifies JWT on every request
   └───┬────────────────┘
       │
   ┌───┴────────────────┐
   │  Redis Cache Layer  │  ← Check cache first; skip LLM if hit
   └───┬────────────────┘
       │ (cache miss)
   ┌───┴───────────────────────────────────┐
   │  LangGraph ReAct Agent (LangChain.js) │
   │                                       │
   │  ┌──────┐   tool_calls   ┌─────────┐  │
   │  │Agent │───────────────▶│ToolNode │  │
   │  │(LLM) │◀──────────────│(3 tools)│  │
   │  └──────┘    results     └─────────┘  │
   │      │                                │
   │      │ no more tool_calls             │
   │      ▼                                │
   │  StructureReportNode                  │
   │  (withStructuredOutput + Zod schema)  │
   └───────────────────────┬───────────────┘
                           │
                     Prisma ORM
                           │
                  Neon PostgreSQL (cloud)
```

### Frontend Architecture

```
React 19 + Vite
  │
  ├── Clerk Provider (auth)
  ├── Redux + redux-persist (state)
  ├── react-router-dom v7 (routing)
  └── React Flow (@xyflow/react)  ← Drag-and-drop node canvas for company cards
        │
        ├── CompanyInputBox (node)   ← User enters company name
        └── CompanyDashboard (node)  ← Renders report + stateless Groq chat
```

### Agent Workflow (LangGraph)

The core intelligence is a **ReAct (Reason + Act) agentic loop** built with LangGraph:

```
START
  │
  ▼
[agent node] ── has tool_calls? ──YES──▶ [tools node] ──▶ back to [agent node]
  │
  NO (done researching)
  │
  ▼
[structureReport node]  ← formats raw findings into typed Zod-validated JSON
  │
  ▼
END  →  Structured JSON report returned to controller
```

**The agent decides on its own:**
- Whether the company is Indian, Global, or Private
- What Yahoo Finance ticker to use (auto-resolution with NSE/BSE fallback)
- Whether financial tools are even applicable (private companies skip them)
- When it has enough data to stop and generate the report

### Tools Available to the Agent

| Tool | Data Source | What it fetches |
|---|---|---|
| `get_live_market_price` | Yahoo Finance | Current price, day high/low, market state |
| `get_financial_fundamentals` | Yahoo Finance (quoteSummary) | P/E, market cap, debt/equity, revenue growth, ROE, profit margins |
| `search_market_news` | Tavily Web Search | Recent news, earnings events, risks, catalysts |

### Database Schema

```
User (Clerk ID)
  └── Workspace (folders)
        └── Company (research record)
              ├── rawData: JSON    ← full structured report
              ├── companyNodeData: JSON  ← canvas position/id
              └── Report (PDF file path)
              └── Chat (Q&A pairs)
```

---

## 🔑 Key Decisions & Trade-offs

### 1. LangGraph for the agentic loop instead of a simple chain

**Why:** A fixed chain (`fetch price → fetch fundamentals → fetch news → summarize`) cannot handle:
- Private companies (skip financial tools entirely)
- Ticker mismatches (detect and discard bad data)
- Tool failures (continue without inventing data)

LangGraph's conditional routing lets the agent make these decisions at runtime.

**Trade-off:** More complex to reason about and debug; adds latency overhead per graph invocation.

---

### 2. Groq (Llama-3.3-70b) as the LLM backbone

**Why:** Groq provides the fastest inference speeds for Llama 3.3 70B via their dedicated hardware (LPUs). For an interactive investment dashboard where users expect sub-10-second responses, inference latency matters enormously.

**Trade-off:** Groq's free tier has aggressive rate limits (TPM/RPM caps). The agent includes automatic 15-second retry logic with up to 2 retries on rate-limit errors. Production deployment would require a paid tier.

---

### 3. Yahoo Finance as the financial data source

**Why:** Free, no API key required, covers both Indian (NSE/BSE) and Global markets. The `yahoo-finance2` library provides typed responses.

**Trade-off:** Yahoo Finance is not an official data provider — it has no SLA. Data can lag, be incorrect, or become temporarily unavailable. For production, a Bloomberg/Refinitiv feed would be appropriate.

---

### 4. Zod schema + `withStructuredOutput` for the final report

**Why:** Without structured output enforcement, LLMs produce inconsistently formatted JSON that is hard to render reliably on the frontend. Zod validates the schema and the LLM is constrained to match it exactly.

**Trade-off:** The schema is rigid. If the LLM cannot produce a value for a required field, the entire call fails. Nullable fields and `.default("")` are used to make the schema flexible enough.

---

### 5. Stateless frontend chat (Groq API called from the browser)

**Why:** Routing every chat message through the backend would require session storage, message persistence, and would add a full round-trip. The frontend Groq call keeps the chatbot snappy and backend-independent.

**Trade-off:** The Groq API key is in the frontend `.env` (VITE_ prefix), which means it is visible in the built bundle. For production, all LLM calls should be proxied through the backend.

---

### 6. Redis caching with TTL

**Why:** Every company analysis call invokes 3 Yahoo Finance API calls + 1 Tavily search + 2 Groq LLM calls. Caching the result for 10 minutes means repeated requests for the same company are served from Redis instantly.

**Trade-off:** Stale data. Financial prices change by the minute, so cached reports older than 10 minutes might show outdated prices. A shorter TTL or real-time invalidation would be needed for live trading use cases.

---

### What was left out

| Feature | Reason |
|---|---|
| Real-time price streaming | Would require WebSockets + a financial data subscription |
| Portfolio-level analysis | Out of scope; would need cross-company aggregation logic |
| Historical chart overlays | Yahoo Finance has historical data but rendering it would require additional chart libraries |
| Backend chat persistence | Each conversation is stateless; persistence would require a Chat table write on every message |
| Email/notification alerts | Not part of the core research loop |

---

## 🚀 How to Run — Setup Guide

### Prerequisites

- Node.js 18+
- npm 9+
- A Redis instance (local or cloud — e.g., Upstash, Redis Cloud)
- A PostgreSQL database (local or cloud — e.g., Neon)

---

### Step 1: Clone the Repository

```bash
git clone <your-repo-link>
cd ai_investment_agent
```

---

### Step 2: Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:

```env
# Server
PORT=8000
NODE_ENV=development

# Database (Neon PostgreSQL or any PostgreSQL)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Services
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
TAVILY_API_KEY=tvly-...

# Redis
REDIS_URL=redis://localhost:6379

# CORS (Frontend URL)
CORS_ORIGIN=http://localhost:5173
```

Run Prisma migrations:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Start the backend:

```bash
npm run dev
# Server runs on http://localhost:8000
```

---

### Step 3: Frontend Setup

```bash
cd ../frontend/investment_agent_frontent
npm install
```

Create a `.env` file in `/frontend/investment_agent_frontent`:

```env
# Backend
VITE_API_BASE_URL=http://localhost:8000

# Clerk Authentication (frontend)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Groq (for stateless chat in the browser)
VITE_GROQ_API_KEY=gsk_...
VITE_GROQ_MODEL=llama-3.3-70b-versatile
```

Start the frontend:

```bash
npm run dev
# App runs on http://localhost:5173
```

---

### Step 4: Open the App

1. Go to `http://localhost:5173`
2. Sign up / Sign in using Clerk
3. Create a Workspace (e.g., "Tech Stocks")
4. In the canvas, enter a company name (e.g., `TCS`, `Apple`, `HDFC Bank`)
5. Click **Analyze** and wait ~10–20 seconds for the report
6. Use the chat panel to ask questions about the company
7. Download the PDF report if needed

---

## 🌐 Environment Variables

### Backend (`/backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Backend server port (default: 8000) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk frontend key |
| `CLERK_SECRET_KEY` | Yes | Clerk backend secret key |
| `GROQ_API_KEY` | Yes | Groq API key for LLM calls |
| `GROQ_MODEL` | Yes | Groq model name (e.g., `llama-3.3-70b-versatile`) |
| `TAVILY_API_KEY` | Yes | Tavily web search API key |
| `REDIS_URL` | Yes | Redis connection URL |
| `CORS_ORIGIN` | Yes | Allowed frontend origin(s), comma-separated |

### Frontend (`/frontend/investment_agent_frontent/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend base URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk frontend key (same as backend) |
| `VITE_GROQ_API_KEY` | Yes | Groq key for browser-side chat |
| `VITE_GROQ_MODEL` | Yes | Groq model for browser-side chat |

---

## 📡 API Reference

### Authentication
All endpoints require a valid Clerk JWT in the `Authorization` header.

### User
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/user/signup` | Sync Clerk user to Postgres |

### Workspaces
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/workspace/create` | Create a new workspace |
| GET | `/api/v1/workspace/list` | List all user workspaces |
| GET | `/api/v1/workspace/:id` | Get workspace with companies |
| DELETE | `/api/v1/workspace/delete` | Delete a workspace |

### Companies
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/company/create` | Trigger AI analysis for a company |
| PUT | `/api/v1/company/update/:companyId` | Re-run analysis for existing company |
| DELETE | `/api/v1/company/remove/:companyId` | Delete a company |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/report/:companyId` | Download PDF report for a company |

### Health Check
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health/check` | Server health status |

---

## 🧪 Example Runs

### Example 1: TCS (Tata Consultancy Services) — Indian Equity

**Input:** `TCS` (Indian IT sector)

**Agent steps:**
1. Detected Indian market → set `market="INDIAN"`
2. Resolved ticker: `TCS.NS` (NSE)
3. Called `get_live_market_price` → Price: ₹3,847, Currency: INR
4. Called `get_financial_fundamentals` → P/E: 28.4, Market Cap: $136B, Profit Margin: 18.7%, ROE: 45.2%
5. Called `search_market_news` → 5 recent news articles on Q4 results, AI contract wins, Europe headwinds

**Report excerpt:**
```json
{
  "verdict": { "decision": "INVEST", "confidenceScore": 76 },
  "financialMetrics": {
    "price": 3847,
    "currency": "INR",
    "peRatio": 28.4,
    "marketCap": 136000000000,
    "profitMargins": 0.187,
    "returnOnEquity": 0.452
  },
  "keyCatalysts": [
    "Strong AI and cloud deal pipeline from Fortune 500 clients",
    "Consistent dividend payouts reflecting high free cash flow generation",
    "Geographic diversification across North America, Europe, and India"
  ],
  "investmentRisks": [
    "Currency risk — significant revenue in USD/EUR vs INR cost base",
    "Pricing pressure from low-cost competitors in commoditized services",
    "European demand slowdown reducing deal volumes"
  ]
}
```

---

### Example 2: Apple Inc. — Global Equity

**Input:** `Apple` (US tech)

**Agent steps:**
1. Detected Global market → `market="GLOBAL"`
2. Resolved ticker: `AAPL`
3. Called `get_live_market_price` → Price: $213.50, Currency: USD
4. Called `get_financial_fundamentals` → P/E: 33.1, Market Cap: $3.2T, Revenue Growth: 5.1%
5. Called `search_market_news` → Apple Intelligence launch, India manufacturing expansion, iPhone 16 reviews

**Report excerpt:**
```json
{
  "verdict": { "decision": "INVEST", "confidenceScore": 82 },
  "financialMetrics": {
    "price": 213.50,
    "currency": "USD",
    "peRatio": 33.1,
    "marketCap": 3200000000000,
    "revenueGrowth": 0.051,
    "profitMargins": 0.254
  },
  "keyCatalysts": [
    "Apple Intelligence AI feature rollout across iPhone, iPad, and Mac",
    "Growing services revenue (App Store, iCloud, Apple TV+) at higher margins",
    "India manufacturing scale-up reducing geopolitical supply chain risk"
  ]
}
```

---

### Example 3: OpenAI — Private Company

**Input:** `OpenAI`

**Agent steps:**
1. Agent determined OpenAI is a privately held company
2. Skipped `get_live_market_price` and `get_financial_fundamentals`
3. Called `search_market_news` → GPT-5 speculation, Microsoft partnership news, funding round coverage

**Report excerpt:**
```json
{
  "verdict": { "decision": "PASS", "confidenceScore": 8 },
  "financialMetrics": {
    "price": null, "currency": null, "peRatio": null,
    "marketCap": null, "profitMargins": null
  },
  "dataQuality": {
    "priceAvailable": false,
    "fundamentalsAvailable": false,
    "limitations": ["Company is privately held — no public financial data is available."]
  }
}
```

---

### Example 4: HDFC Bank — Indian Equity

**Input:** `HDFC Bank`

**Agent steps:**
1. Detected Indian market, resolved to `HDFCBANK.NS`
2. Fetched live price: ₹1,712
3. Fetched fundamentals: P/E 18.2, Market Cap: ₹13.1T, Debt/Equity: 0.12
4. Searched news: RBI rate decision impact, merger integration update

**Report excerpt:**
```json
{
  "verdict": { "decision": "INVEST", "confidenceScore": 71 },
  "keyCatalysts": [
    "Post-merger synergies from HDFC-HDFC Bank consolidation improving cost ratios",
    "India's retail credit growth benefiting leading private sector banks",
    "Strong CASA ratio maintaining low funding costs"
  ],
  "investmentRisks": [
    "Integration risk from merger — asset quality monitoring critical",
    "RBI regulatory tightening limiting loan book growth velocity",
    "Rising NPAs in unsecured lending segment"
  ]
}
```

---

## 🔮 What I Would Improve with More Time

### 1. Real-time Price Streaming
Replace the cached snapshot price with WebSocket-based live price feeds (e.g., Alpaca, Polygon.io, or NSE/BSE WebSocket streams).

### 2. Portfolio-Level View
Allow users to add multiple companies to a "watchlist" and see aggregate portfolio metrics (weighted average P/E, sector distribution, risk score).

### 3. Historical Charts
Integrate Yahoo Finance's historical data endpoints with a chart library (e.g., Recharts, D3.js) to show 1Y/3Y price trends alongside the report.

### 4. Secure LLM Calls
Move the Groq chatbot from browser-side to a dedicated backend streaming endpoint (`/api/v1/chat/stream`) using Server-Sent Events, keeping the API key server-side only.

### 5. Persistent Chat History
Store chat Q&A pairs in the `Chat` table (already in the Prisma schema) and render conversation history when users revisit a company dashboard.

### 6. Better Rate Limit Handling
Implement a request queue with Redis Bull/BullMQ for LLM calls so high traffic doesn't result in 429 errors for users but instead queues their requests gracefully.

### 7. Analyst Comparison
Scrape analyst consensus ratings (buy/sell/hold) from sources like Refinitiv or SeekingAlpha and include them as a "market consensus" column next to the AI verdict.

### 8. PDF Report Quality
The current PDF generation is minimal. A proper PDF template using Puppeteer + a proper HTML template would produce publication-quality reports.

---

## 🛠 Tech Stack Summary

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + Vite |
| **UI Styling** | Tailwind CSS v4 (Neo-brutalist design system) |
| **State Management** | Redux Toolkit + redux-persist |
| **Routing** | react-router-dom v7 |
| **Canvas/Flow** | @xyflow/react (React Flow) |
| **Auth (Client)** | @clerk/react |
| **Toast Notifications** | react-hot-toast |
| **Icons** | react-icons |
| **HTTP Client** | Axios |
| **Backend Framework** | Express.js v5 |
| **Auth (Server)** | @clerk/express |
| **ORM** | Prisma + Neon PostgreSQL |
| **Cache** | Redis (node-redis) |
| **AI Agent Framework** | LangChain.js + LangGraph |
| **LLM** | Groq (Llama-3.3-70b-versatile) |
| **Financial Data** | Yahoo Finance 2 (yahoo-finance2) |
| **Web Search** | Tavily AI Search API |
| **PDF Generation** | Puppeteer |
| **Schema Validation** | Zod |

---

## 📬 Developer

**Yash Yadav**
AI Engineer & Full-Stack Developer

- GitHub: [github.com/Yash-Yadav-901](https://github.com/Yash-Yadav-901)
- LinkedIn: [linkedin.com/in/yashyadav901](https://www.linkedin.com/in/yashyadav901/)
- Email: yashyadav65378@gmail.com

---

> **Disclaimer:** This tool is for educational and research purposes only. It does not constitute financial advice. Always consult a qualified financial advisor before making investment decisions.
