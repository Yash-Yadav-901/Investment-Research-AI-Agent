/**
 * Generates a clean, print-optimized HTML string suitable for PDF conversion engines (like Puppeteer).
 * Handles flat DB models or nested JSON structures gracefully.
 * * @param {Object} company - The company data object retrieved from Prisma
 * @returns {String} Full HTML document string
 */
function renderReportHTML(company) {
  // 1. Safe parsing of nested / flat database schemas
  const name = company.companyName || company.name || "Unknown Corporation";
  const ticker = company.ticker || "N/A";
  const marketType = company.marketType || "GLOBAL";
  const summary = company.companySummary || company.summary || "No description available.";
  
  // Extracting Verdict
  const decision = company.verdict?.decision || company.decision || "PASS";
  const confidenceScore = company.verdict?.confidenceScore || company.confidenceScore || 0;
  const rationale = company.rationale || "No analyst rationale provided.";
  const disclaimer = company.disclaimer || "This is an informational research report and not personalized financial advice.";

  // Extracting Financial Metrics (supports nested payload or flat DB properties)
  const metrics = company.financialMetrics || company;
  const price = metrics.price || 0;
  const currency = metrics.currency || "USD";
  const peRatio = metrics.peRatio || null;
  const debtToEquity = metrics.debtToEquity || null;
  const marketCap = metrics.marketCap || 0;
  const profitMargins = metrics.profitMargins || null;
  const returnOnEquity = metrics.returnOnEquity || null;
  const revenueGrowth = metrics.revenueGrowth || null;
  const earningsGrowth = metrics.earningsGrowth || null;

  // Extracting Lists with fallbacks
  const keyCatalysts = Array.isArray(company.keyCatalysts) 
    ? company.keyCatalysts 
    : (company.keyCatalysts ? JSON.parse(company.keyCatalysts) : []);
    
  const investmentRisks = Array.isArray(company.investmentRisks) 
    ? company.investmentRisks 
    : (company.investmentRisks ? JSON.parse(company.investmentRisks) : []);

  const recentNews = Array.isArray(company.recentNews) 
    ? company.recentNews 
    : (company.recentNews ? JSON.parse(company.recentNews) : []);

  // Extracting Decision Analysis block
  const analysis = company.decisionAnalysis || {};
  const valuationAssessment = analysis.valuationAssessment || "No assessment available.";
  const financialHealthAssessment = analysis.financialHealthAssessment || "No assessment available.";
  const growthAssessment = analysis.growthAssessment || "No assessment available.";
  const newsSentimentAssessment = analysis.newsSentimentAssessment || "No assessment available.";
  const finalDecisionReason = analysis.finalDecisionReason || "No decision logic specified.";
  const evidenceUsed = Array.isArray(analysis.evidenceUsed) ? analysis.evidenceUsed : [];

  // Helper formatting functions for HTML insertion
  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === 0) return "N/A";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatMarketCap = (val) => {
    if (!val) return "N/A";
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    return `$${(val / 1e6).toFixed(2)}M`;
  };

  const formatPercent = (val) => {
    if (val === undefined || val === null) return "N/A";
    return `${(val * 100).toFixed(2)}%`;
  };

  const formatNumber = (val, dec = 2) => {
    if (val === undefined || val === null) return "N/A";
    return Number(val).toFixed(dec);
  };

  // Build HTML string
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${name} (${ticker}) Investment Report</title>
      
      <!-- Tailwind CSS CDN -->
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      
      <!-- Custom CSS Styles to enforce print quality and correct breaks -->
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        body {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #ffffff;
          color: #111827;
        }

        /* Essential instructions for PDF engines */
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background-color: #ffffff !important;
          }
          
          /* Force physical paper sizes */
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
        }

        /* Prevents cards or table rows from being awkwardly cut in half across pages */
        .break-avoid {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Explicit page breaks */
        .page-break {
          page-break-after: always;
          break-after: page;
        }
      </style>
    </head>
    <body class="p-4 md:p-8 max-w-4xl mx-auto">

      <!-- ==================== PAGE 1: COVER & EXECUTIVE SUMMARY ==================== -->
      <div class="flex flex-col justify-between min-h-[257mm] page-break">
        <div>
          <!-- Upper Formal Strip -->
          <div class="flex justify-between items-center border-b-2 border-gray-900 pb-4 mb-16">
            <div class="text-xs font-semibold tracking-widest text-gray-500 uppercase">INVESTMENT STRATEGY GROUP</div>
            <div class="text-xs font-semibold text-gray-500 uppercase">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>

          <!-- Document Title -->
          <div class="mb-12">
            <span class="text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300 px-3 py-1 rounded tracking-wide uppercase">Equity Research Briefing</span>
            <h1 class="text-5xl font-extrabold tracking-tight text-gray-900 mt-6 leading-none">
              ${name}
            </h1>
            <div class="flex items-center gap-3 mt-4">
              <span class="text-xl font-semibold tracking-wider text-gray-600 font-mono">${ticker}</span>
              <span class="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
              <span class="text-sm text-gray-500 uppercase">${marketType} Market Listing</span>
            </div>
          </div>

          <!-- Company Core Summary -->
          <div class="mb-10">
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200 pb-2 mb-3">Corporate Scope</h3>
            <p class="text-gray-700 leading-relaxed text-base">
              ${summary}
            </p>
          </div>

          <!-- Decision Callout Box -->
          <div class="mb-10 bg-gray-50 border border-gray-200 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <span class="text-[10px] text-gray-400 block uppercase tracking-widest font-semibold">Analyst Consensus Verdict</span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="text-4xl font-black text-gray-900">${decision}</span>
                <span class="text-sm text-gray-500 font-mono">(Confidence Score: ${confidenceScore}%)</span>
              </div>
            </div>
            <div class="border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
              <span class="text-[10px] text-gray-400 block uppercase tracking-widest font-semibold">Closing Valuation Metric</span>
              <span class="text-2xl font-bold text-gray-900 font-mono mt-1 block">
                ${formatCurrency(price)} ${currency}
              </span>
            </div>
          </div>

          <!-- Rationale Statement -->
          <div class="mb-12">
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200 pb-2 mb-3">Investment Thesis Rationale</h3>
            <p class="text-gray-700 text-sm leading-relaxed italic">
              "${rationale}"
            </p>
          </div>
        </div>

        <!-- Sheet Footer -->
        <div class="border-t border-gray-200 pt-4 flex justify-between items-center text-xs text-gray-400 font-mono">
          <span>SECURED REPORT - SYSTEM GENERATED</span>
          <span>PAGE 1</span>
        </div>
      </div>


      <!-- ==================== PAGE 2: FINANCIAL ASSESSMENT & VALUATION ==================== -->
      <div class="flex flex-col justify-between min-h-[257mm] page-break">
        <div>
          <!-- Inner Page Header -->
          <div class="flex justify-between items-center border-b-2 border-gray-900 pb-4 mb-10">
            <div class="text-xs font-bold text-gray-900 uppercase">${name} (${ticker})</div>
            <div class="text-xs font-semibold text-gray-400 uppercase">Valuation Multiple &amp; Capital Structure</div>
          </div>

          <!-- Financial Grid Metrics -->
          <div class="mb-10">
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200 pb-2 mb-4">Core Valuation Ledger</h3>
            <div class="grid grid-cols-2 gap-x-8 gap-y-6">
              <div class="border-b border-gray-100 pb-2">
                <span class="block text-xs text-gray-400 uppercase font-medium">Price Earnings Ratio (P/E)</span>
                <span class="text-xl font-bold text-gray-900 font-mono">${formatNumber(peRatio)}x</span>
              </div>
              <div class="border-b border-gray-100 pb-2">
                <span class="block text-xs text-gray-400 uppercase font-medium">Gearing Ratio (Debt-to-Equity)</span>
                <span class="text-xl font-bold text-gray-900 font-mono">${formatNumber(debtToEquity)}</span>
              </div>
              <div class="border-b border-gray-100 pb-2">
                <span class="block text-xs text-gray-400 uppercase font-medium">Market Capitalization</span>
                <span class="text-xl font-bold text-gray-900 font-mono">${formatMarketCap(marketCap)}</span>
              </div>
              <div class="border-b border-gray-100 pb-2">
                <span class="block text-xs text-gray-400 uppercase font-medium">Operating Profit Margin</span>
                <span class="text-xl font-bold text-gray-900 font-mono">${formatPercent(profitMargins)}</span>
              </div>
              <div class="border-b border-gray-100 pb-2">
                <span class="block text-xs text-gray-400 uppercase font-medium">Return On Capital (ROE)</span>
                <span class="text-xl font-bold text-gray-900 font-mono">${formatPercent(returnOnEquity)}</span>
              </div>
              <div class="border-b border-gray-100 pb-2">
                <span class="block text-xs text-gray-400 uppercase font-medium">Revenue Growth Rate</span>
                <span class="text-xl font-bold text-gray-900 font-mono">${formatPercent(revenueGrowth)}</span>
              </div>
              <div class="border-b border-gray-100 pb-2 col-span-2">
                <span class="block text-xs text-gray-400 uppercase font-medium">YoY Earnings Expansion Rate</span>
                <span class="text-xl font-bold text-emerald-600 font-mono">${formatPercent(earningsGrowth)}</span>
              </div>
            </div>
          </div>

          <!-- Qualitative Insights -->
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200 pb-2 mb-4">Deep Qualitative Assessments</h3>
            <div class="space-y-4">
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200/60 break-avoid">
                <h4 class="text-xs font-bold uppercase text-gray-500 mb-1">Valuation Landscape</h4>
                <p class="text-xs text-gray-700 leading-relaxed">${valuationAssessment}</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200/60 break-avoid">
                <h4 class="text-xs font-bold uppercase text-gray-500 mb-1">Capital Health &amp; Liquidity</h4>
                <p class="text-xs text-gray-700 leading-relaxed">${financialHealthAssessment}</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200/60 break-avoid">
                <h4 class="text-xs font-bold uppercase text-gray-500 mb-1">Earnings &amp; Growth Vectors</h4>
                <p class="text-xs text-gray-700 leading-relaxed">${growthAssessment}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sheet Footer -->
        <div class="border-t border-gray-200 pt-4 flex justify-between items-center text-xs text-gray-400 font-mono">
          <span>INVESTMENT STRATEGY GROUP • CONFIDENTIAL</span>
          <span>PAGE 2</span>
        </div>
      </div>


      <!-- ==================== PAGE 3: CATALYSTS, RISKS & FACT CHECK LEDGER ==================== -->
      <div class="flex flex-col justify-between min-h-[257mm]">
        <div>
          <!-- Inner Page Header -->
          <div class="flex justify-between items-center border-b-2 border-gray-900 pb-4 mb-10">
            <div class="text-xs font-bold text-gray-900 uppercase">${name} (${ticker})</div>
            <div class="text-xs font-semibold text-gray-400 uppercase">Strategic Risk Factors &amp; Claims</div>
          </div>

          <!-- Side-by-Side Catalysts and Risks -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div class="break-avoid">
              <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200 pb-2 mb-3">Key Strategic Catalysts</h3>
              <ul class="space-y-2">
                ${keyCatalysts.map(catalyst => `
                  <li class="text-xs text-gray-700 flex items-start gap-2">
                    <span class="text-emerald-500 font-bold">•</span>
                    <span>${catalyst}</span>
                  </li>
                `).join('')}
                ${keyCatalysts.length === 0 ? '<li class="text-xs text-gray-400">No catalysts reported.</li>' : ''}
              </ul>
            </div>
            
            <div class="break-avoid">
              <h3 class="text-xs font-bold uppercase tracking-wider text-rose-400 border-b border-gray-200 pb-2 mb-3">Core Investment Risks</h3>
              <ul class="space-y-2">
                ${investmentRisks.map(risk => `
                  <li class="text-xs text-gray-700 flex items-start gap-2">
                    <span class="text-rose-500 font-bold">•</span>
                    <span>${risk}</span>
                  </li>
                `).join('')}
                ${investmentRisks.length === 0 ? '<li class="text-xs text-gray-400">No risk factors reported.</li>' : ''}
              </ul>
            </div>
          </div>

          <!-- Comprehensive Decision Reasoning -->
          <div class="bg-gray-50 border border-gray-200 p-5 rounded-xl mb-8 break-avoid">
            <h4 class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Final Consensus Decision Logic</h4>
            <p class="text-xs text-gray-700 leading-relaxed">
              ${finalDecisionReason}
            </p>
          </div>

          <!-- Evidence Verification Ledger -->
          <div class="break-avoid mb-8">
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200 pb-2 mb-3">Fact Verification Ledger</h3>
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                    <th class="p-3">Analytical Claim</th>
                    <th class="p-3">Evidence Point</th>
                    <th class="p-3">Authority Source</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  ${evidenceUsed.map(item => `
                    <tr>
                      <td class="p-3 text-gray-800 font-medium">${item.claim}</td>
                      <td class="p-3 text-gray-600 font-mono text-xs truncate max-w-xs">${item.evidence}</td>
                      <td class="p-3 text-gray-500 font-mono">${item.source}</td>
                    </tr>
                  `).join('')}
                  ${evidenceUsed.length === 0 ? '<tr><td colspan="3" class="p-3 text-center text-gray-400">No verified claims logged.</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Report Footer & Legal Warnings -->
        <div class="break-avoid">
          <div class="border-t border-gray-200 pt-4 flex justify-between items-center text-xs text-gray-400 font-mono mb-4">
            <span>DISCLAIMER BOUNDS • REPORT COMPLETE</span>
            <span>PAGE 3</span>
          </div>
          <p class="text-[9px] text-gray-400 leading-normal text-center bg-gray-50 p-2.5 rounded border border-gray-100">
            ${disclaimer}
          </p>
        </div>
      </div>

    </body>
    </html>
  `;
}

module.exports = { renderReportHTML };