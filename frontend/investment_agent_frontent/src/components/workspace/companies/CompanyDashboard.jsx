import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useDispatch } from 'react-redux';
import axiosInstance from '../../../utils/axiosConfig';
import { removeCompany } from '../../../store/InsideWorkSpaces';

const formatCurrency = (val) => {
    if (val === undefined || val === null) return "N/A";
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

export default function CompanyDashboard({ data }) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [activeTab, setActiveTab] = useState("overview"); // "overview" or "evidence"
    const chatEndRef = useRef(null);

    const dispatch = useDispatch();

    // 1. Correctly unwrap the incoming nested 'report' prop data
    let payload = data?.rawData || data;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            console.error("Failed to parse company data payload:", e);
        }
    }

    // Extract the inner report object if it exists structural wise
    if (payload && payload.report) {
        payload = payload.report;
    }

    const [isDownloading, setIsDownloading] = useState(false);

    const handleDeleteCompany = async () => {
        const companyId = data?.id;
        if (!companyId) {
            console.error("No company ID found to delete");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${payload.metadata?.companyName || 'this company'}?`)) {
            return;
        }

        try {
            await axiosInstance.delete(`/api/v1/company/remove/${companyId}`);
            dispatch(removeCompany(companyId));
        } catch (error) {
            console.error("Failed to delete company:", error);
            alert("Failed to delete company from database.");
        }
    };

    const handleDownloadReport = async () => {
        const companyId = data?.id;
        if (!companyId) {
            console.error("No company ID found to download report");
            return;
        }

        setIsDownloading(true);
        try {
            const response = await axiosInstance.get(`/api/v1/report/${companyId}`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${payload.metadata?.companyName || 'Company'}-report.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download PDF report:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const [chatMessages, setChatMessages] = useState([
        {
            sender: 'assistant',
            text: `Hello! I am your AI Financial Assistant. I have fully indexed this company's latest deep analytical report. Ask me anything about  financial metrics, catalysts, risks, or the analyst verdict!`
        }
    ]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isTyping]);

    // Fallback UI validation
    if (!payload || !payload.metadata) {
        return (
            <div className="flex items-center justify-center p-8 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 text-sm w-full h-[300px]">
                Loading company data dashboard...
            </div>
        );
    }


    const callGemini = async (userPrompt, currentHistory) => {
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
        const systemPrompt = `You are a professional financial analyst AI assistant. You have access to this real-time Deep Report Dashboard payload for NVIDIA Corporation (NVDA):
${JSON.stringify(payload, null, 2)}

Provide analytical, helpful, and concise answers based strictly on the provided payload. Avoid speculative claims not represented in the data. If the user asks general questions outside this context, anchor the answer back to NVDA's current data.`;

        const formattedHistory = currentHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const payloadBody = {
            contents: [
                ...formattedHistory,
                { role: "user", parts: [{ text: userPrompt }] }
            ],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        };

        let attempts = 0;
        const maxRetries = 5;

        const executeCall = async () => {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadBody)
            });
            if (!response.ok) throw new Error("Fetch failed");
            return response.json();
        };

        while (attempts < maxRetries) {
            try {
                const result = await executeCall();
                return result.candidates?.[0]?.content?.parts?.[0]?.text || "No response details generated.";
            } catch (err) {
                attempts++;
                if (attempts >= maxRetries) {
                    throw new Error("Unable to connect to financial brain right now. Please try again.");
                }
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
            }
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMessage = { sender: "user", text: chatInput };
        setChatMessages(prev => [...prev, userMessage]);
        setChatInput("");
        setIsTyping(true);

        try {
            const answer = await callGemini(userMessage.text, chatMessages);
            setChatMessages(prev => [...prev, { sender: "assistant", text: answer }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { sender: "assistant", text: `Error: ${err.message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (isMinimized) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 rounded-xl">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 text-emerald-400 mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-zinc-100 mb-2">NVDA Terminal Closed</h2>
                    <p className="text-zinc-400 text-sm mb-6">You have closed the Deep Report Dashboard workspace. You can restore it immediately.</p>
                    <button
                        onClick={() => setIsMinimized(false)}
                        className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-6 6m0 0l-6-6m6 6V9a9 9 0 0118 0v12" />
                        </svg>
                        Restore Workspace
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans flex flex-col items-center justify-start p-4 md:p-8 relative">
            <Handle type="target" position={Position.Left} id="b" />

            <div className="relative w-full max-w-7xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden group">
                {/* Header Block */}
                <header className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">{payload.metadata?.companyName}</h1>
                                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded border border-zinc-700">{payload.metadata?.ticker}</span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1 max-w-xl line-clamp-1">{payload.metadata?.companySummary}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                            {payload.metadata?.marketType} Market
                        </span>
                        <button
                            onClick={handleDownloadReport}
                            disabled={isDownloading}
                            title="Download PDF Report"
                            className="p-1.5 text-zinc-500 hover:text-emerald-400 disabled:opacity-50 disabled:hover:text-zinc-500 bg-zinc-800/50 hover:bg-zinc-800 rounded-md border border-zinc-800 hover:border-emerald-900/30 transition-all duration-200 flex items-center justify-center"
                        >
                            {isDownloading ? (
                                <svg className="animate-spin h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={handleDeleteCompany}
                            title="Delete Company"
                            className="p-1.5 text-zinc-500 hover:text-rose-400 bg-zinc-800/50 hover:bg-zinc-800 rounded-md border border-zinc-800 hover:border-rose-900/30 transition-all duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Workspace Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">

                    {/* LEFT & MID COLUMNS */}
                    <main className="lg:col-span-2 flex flex-col divide-y divide-zinc-800 bg-zinc-950/20 overflow-y-auto max-h-[800px] scrollbar-thin">

                        <section className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-zinc-900/30">
                            {/* Verdict Indicator */}
                            <div className="md:col-span-4 bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between items-center text-center relative overflow-hidden">
                                <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
                                <span className="text-xs font-mono uppercase text-zinc-400 tracking-widest">ANALYST VERDICT</span>
                                <div className="my-3">
                                    <span className="text-4xl md:text-5xl font-black tracking-tight text-emerald-400">{payload.verdict?.decision}</span>
                                </div>
                                <div className="w-full">
                                    <div className="flex justify-between items-center text-xs text-zinc-400 mb-1.5 font-mono">
                                        <span>CONFIDENCE SCORE</span>
                                        <span className="font-bold text-zinc-200">{payload.verdict?.confidenceScore}%</span>
                                    </div>
                                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/50">
                                        <div
                                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${payload.verdict?.confidenceScore || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Rationale & Quality Metrics */}
                            <div className="md:col-span-8 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Investment Thesis Rationale</h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed">{payload.rationale}</p>
                                </div>

                                <div className="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-3 gap-2">
                                    <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800/40 text-center">
                                        <span className="block text-[10px] text-zinc-500 font-mono uppercase">Price Data</span>
                                        <span className={`text-xs font-bold ${payload.dataQuality?.priceAvailable ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                            {payload.dataQuality?.priceAvailable ? 'ONLINE' : 'UNAVAILABLE'}
                                        </span>
                                    </div>
                                    <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800/40 text-center">
                                        <span className="block text-[10px] text-zinc-500 font-mono uppercase">Fundamentals</span>
                                        <span className={`text-xs font-bold ${payload.dataQuality?.fundamentalsAvailable ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                            {payload.dataQuality?.fundamentalsAvailable ? 'ONLINE' : 'UNAVAILABLE'}
                                        </span>
                                    </div>
                                    <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800/40 text-center">
                                        <span className="block text-[10px] text-zinc-500 font-mono uppercase">News Feed</span>
                                        <span className={`text-xs font-bold ${payload.dataQuality?.newsAvailable ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                            {payload.dataQuality?.newsAvailable ? 'ONLINE' : 'UNAVAILABLE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Financial Metrics Interactive Grid */}
                        <section className="p-6">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 font-mono flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Core Financial Metrics
                            </h3>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 transition-transform hover:border-zinc-700">
                                    <span className="block text-xs text-zinc-500 font-mono">SHARE PRICE</span>
                                    <div className="mt-1 flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-zinc-100 font-mono">{formatCurrency(payload.financialMetrics?.price)}</span>
                                        <span className="text-xs text-zinc-400 font-mono">{payload.financialMetrics?.currency}</span>
                                    </div>
                                </div>

                                <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 transition-transform hover:border-zinc-700">
                                    <span className="block text-xs text-zinc-500 font-mono">P/E RATIO</span>
                                    <div className="mt-1 flex items-baseline">
                                        <span className="text-2xl font-bold text-zinc-100 font-mono">{formatNumber(payload.financialMetrics?.peRatio)}</span>
                                        <span className="text-xs text-zinc-400 ml-1">x</span>
                                    </div>
                                </div>

                                <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 transition-transform hover:border-zinc-700">
                                    <span className="block text-xs text-zinc-500 font-mono">DEBT-TO-EQUITY</span>
                                    <div className="mt-1">
                                        <span className="text-2xl font-bold text-zinc-100 font-mono">{formatNumber(payload.financialMetrics?.debtToEquity)}</span>
                                    </div>
                                </div>

                                <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 transition-transform hover:border-zinc-700">
                                    <span className="block text-xs text-zinc-500 font-mono">MARKET CAP</span>
                                    <div className="mt-1">
                                        <span className="text-2xl font-bold text-zinc-100 font-mono">{formatMarketCap(payload.financialMetrics?.marketCap)}</span>
                                    </div>
                                </div>

                                <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 transition-transform hover:border-zinc-700">
                                    <span className="block text-xs text-zinc-500 font-mono">PROFIT MARGINS</span>
                                    <div className="mt-1">
                                        <span className="text-2xl font-bold text-emerald-400 font-mono">{formatPercent(payload.financialMetrics?.profitMargins)}</span>
                                    </div>
                                </div>

                                <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 transition-transform hover:border-zinc-700">
                                    <span className="block text-xs text-zinc-500 font-mono">RETURN ON EQUITY</span>
                                    <div className="mt-1">
                                        <span className="text-2xl font-bold text-emerald-400 font-mono">{formatPercent(payload.financialMetrics?.returnOnEquity)}</span>
                                    </div>
                                </div>

                                <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 transition-transform hover:border-zinc-700">
                                    <span className="block text-xs text-zinc-500 font-mono">REVENUE GROWTH</span>
                                    <div className="mt-1">
                                        <span className="text-2xl font-bold text-emerald-400 font-mono">{formatPercent(payload.financialMetrics?.revenueGrowth)}</span>
                                    </div>
                                </div>

                                <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 transition-transform hover:border-zinc-700">
                                    <span className="block text-xs text-zinc-500 font-mono">EARNINGS GROWTH</span>
                                    <div className="mt-1">
                                        <span className="text-2xl font-bold text-emerald-400 font-mono">{formatPercent(payload.financialMetrics?.earningsGrowth)}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Strategic Drivers */}
                        <section className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900/10">
                            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-4 text-emerald-400">
                                    <h4 className="font-bold tracking-wide uppercase text-sm font-mono text-zinc-200">Key Catalysts</h4>
                                </div>
                                <ul className="space-y-3">
                                    {payload.keyCatalysts?.map((catalyst, index) => (
                                        <li key={index} className="flex items-start gap-2.5 text-sm text-zinc-300">
                                            <span className="text-emerald-500 mt-0.5">✔</span>
                                            <span>{catalyst}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-4 text-rose-400">
                                    <h4 className="font-bold tracking-wide uppercase text-sm font-mono text-zinc-200">Investment Risks</h4>
                                </div>
                                <ul className="space-y-3">
                                    {payload.investmentRisks?.map((risk, index) => (
                                        <li key={index} className="flex items-start gap-2.5 text-sm text-zinc-300">
                                            <span className="text-rose-500 mt-0.5">⚠</span>
                                            <span>{risk}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* Deep Analysis Perspektive Workspace */}
                        <section className="p-6">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">
                                    Systematic Deep Report Analysis
                                </h3>
                                <div className="flex border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900 p-0.5">
                                    <button
                                        onClick={() => setActiveTab("overview")}
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${activeTab === 'overview' ? 'bg-zinc-800 text-emerald-400 font-semibold' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Assessments
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("evidence")}
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${activeTab === 'evidence' ? 'bg-zinc-800 text-emerald-400 font-semibold' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Evidence Ledger
                                    </button>
                                </div>
                            </div>

                            {activeTab === "overview" ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                                            <span className="block text-xs font-semibold text-zinc-500 uppercase font-mono tracking-wider mb-1">Valuation Assessment</span>
                                            <p className="text-zinc-300 text-sm leading-relaxed">{payload.decisionAnalysis?.valuationAssessment}</p>
                                        </div>
                                        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                                            <span className="block text-xs font-semibold text-zinc-500 uppercase font-mono tracking-wider mb-1">Financial Health</span>
                                            <p className="text-zinc-300 text-sm leading-relaxed">{payload.decisionAnalysis?.financialHealthAssessment}</p>
                                        </div>
                                        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                                            <span className="block text-xs font-semibold text-zinc-500 uppercase font-mono tracking-wider mb-1">Growth Vectors</span>
                                            <p className="text-zinc-300 text-sm leading-relaxed">{payload.decisionAnalysis?.growthAssessment}</p>
                                        </div>
                                        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                                            <span className="block text-xs font-semibold text-zinc-500 uppercase font-mono tracking-wider mb-1">Sentiment &amp; News Impact</span>
                                            <p className="text-zinc-300 text-sm leading-relaxed">{payload.decisionAnalysis?.newsSentimentAssessment}</p>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-xl mt-4">
                                        <span className="block text-xs font-bold text-zinc-500 uppercase font-mono tracking-wider mb-1">Consensus Decision logic</span>
                                        <p className="text-zinc-300 text-sm leading-relaxed">{payload.decisionAnalysis?.finalDecisionReason}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40 overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse min-w-[500px]">
                                        <thead>
                                            <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-xs uppercase font-mono font-semibold tracking-wider">
                                                <th className="p-4">Key Claim Assessed</th>
                                                <th className="p-4">Documented Evidence</th>
                                                <th className="p-4">Source Authority</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/50">
                                            {payload.decisionAnalysis?.evidenceUsed?.map((item, index) => (
                                                <tr key={index} className="hover:bg-zinc-900/30 transition-colors">
                                                    <td className="p-4 font-medium text-zinc-200">{item.claim}</td>
                                                    <td className="p-4 text-zinc-300 font-mono text-xs max-w-xs truncate" title={item.evidence}>
                                                        {item.evidence?.startsWith('http') ? (
                                                            <a href={item.evidence} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-1">
                                                                Web Reference
                                                            </a>
                                                        ) : item.evidence}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-xs px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded font-mono text-zinc-400">
                                                            {item.source}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </main>

                    {/* RIGHT COLUMN */}
                    <aside className="lg:col-span-1 flex flex-col divide-y divide-zinc-800 bg-zinc-900/40">
                        <div className="p-6 flex flex-col h-[350px]">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 font-mono">
                                Documented Market News
                            </h3>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                                {payload.recentNews?.map((news, idx) => (
                                    <article key={idx} className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-3.5 hover:border-zinc-700 transition-all duration-200">
                                        <a
                                            href={news.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-zinc-200 text-sm font-semibold leading-snug hover:text-emerald-400 transition-colors"
                                        >
                                            {news.headline}
                                        </a>
                                        <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">{news.summary}</p>
                                    </article>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Assistant Terminal */}
                        <div className="p-6 flex flex-col h-[450px]">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">
                                    Interactive AI Assistant
                                </h3>
                            </div>

                            <div className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 overflow-y-auto space-y-4 mb-3 scrollbar-thin flex flex-col">
                                {chatMessages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${msg.sender === 'user'
                                            ? 'bg-zinc-800 text-zinc-100 self-end rounded-br-none border border-zinc-700/50'
                                            : 'bg-zinc-900 text-zinc-300 self-start rounded-bl-none border border-zinc-800'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="bg-zinc-900 text-zinc-400 self-start rounded-xl rounded-bl-none border border-zinc-800 p-3 text-xs flex items-center gap-1.5 max-w-[80%]">
                                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask about PE, catalysts, or risks..."
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 font-sans"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim() || isTyping}
                                    className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors"
                                >
                                    Ask
                                </button>
                            </form>
                        </div>
                    </aside>
                </div>

                <footer className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/40 text-center text-[11px] text-zinc-500 leading-normal">
                    <p className="max-w-4xl mx-auto">{payload.disclaimer}</p>
                </footer>
            </div>
        </div>
    );
}