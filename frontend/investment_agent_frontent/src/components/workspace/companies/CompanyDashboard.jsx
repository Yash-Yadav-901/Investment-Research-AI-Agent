import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useDispatch } from 'react-redux';
import axiosInstance from '../../../utils/axiosConfig';
import { removeCompany } from '../../../store/InsideWorkSpaces';
import { toast } from 'react-hot-toast';

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
    const [activeTab, setActiveTab] = useState("overview"); 
    const chatEndRef = useRef(null);
    const dispatch = useDispatch();

    let payload = data?.rawData || data;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            console.error("Failed to parse company data payload:", e);
        }
    }

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
            toast.success(`Deleted ${payload.metadata?.companyName || 'company'} successfully!`);
        } catch (error) {
            console.error("Failed to delete company:", error);
            toast.error("Failed to delete company from database.");
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
            toast.error("Failed to download PDF report.");
        } finally {
            setIsDownloading(false);
        }
    };

    const [chatMessages, setChatMessages] = useState([
        {
            sender: 'assistant',
            text: `Hello! I am your AI Financial Assistant. I have fully indexed this company's latest deep analytical report. Ask me anything about financial metrics, catalysts, risks, or the analyst verdict!`
        }
    ]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isTyping]);

    if (!payload || !payload.metadata) {
        return (
            <div className="flex items-center justify-center p-8 bg-[#FFFBEB] border-4 border-[#0F172A] rounded-2xl text-[#0F172A] text-sm font-black w-full h-[300px] shadow-[4px_4px_0px_0px_#0F172A]">
                Loading company data dashboard...
            </div>
        );
    }

    const callGroq = async (userPrompt, currentHistory) => {
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;
        const modelName = import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile";
        const companyName = payload.metadata?.companyName || "the company";

        const systemPrompt = `You are a professional financial analyst AI assistant. You have access to this real-time Deep Report Dashboard payload for ${companyName}:
${JSON.stringify(payload, null, 2)}

Provide analytical, helpful, and concise answers based strictly on the provided payload. Avoid speculative claims not represented in the data. If the user asks general questions outside this context, anchor the answer back to the current company data. and if the user`;

        const formattedHistory = currentHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));

        const payloadBody = {
            model: modelName,
            messages: [
                { role: "system", content: systemPrompt },
                ...formattedHistory,
                { role: "user", content: userPrompt }
            ],
            temperature: 0.2
        };

        let attempts = 0;
        const maxRetries = 3;

        const executeCall = async () => {
            const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify(payloadBody)
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || "Groq request failed");
            }
            return response.json();
        };

        while (attempts < maxRetries) {
            try {
                const result = await executeCall();
                return result.choices?.[0]?.message?.content || "No response details generated.";
            } catch (err) {
                attempts++;
                if (attempts >= maxRetries) {
                    throw err;
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
            const answer = await callGroq(userMessage.text, chatMessages);
            setChatMessages(prev => [...prev, { sender: "assistant", text: answer }]);
        } catch (err) {
            console.error("Chat message error:", err);
            let message = "Failed to get response from assistant.";
            if (err.message?.includes("rate_limit_exceeded") || err.message?.includes("429")) {
                message = "Rate limit reached. Please wait a moment.";
            } else if (err.message) {
                message = err.message;
            }
            toast.error(message);
            setChatMessages(prev => [...prev, { sender: "assistant", text: `Error: ${message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (isMinimized) {
        return (
            <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-4">
                <div className="bg-white border-4 border-[#0F172A] rounded-2xl p-8 max-w-md w-full text-center shadow-[6px_6px_0px_0px_#0F172A]">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FEF3C7] border-2 border-[#0F172A] text-[#EF4444] mb-4 shadow-[3px_3px_0px_0px_#0F172A]">
                        <svg className="w-8 h-8 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-black text-[#0F172A] mb-2 uppercase tracking-wide">Terminal Closed</h2>
                    <p className="text-slate-600 text-sm font-medium mb-6">You have closed the Deep Report Dashboard workspace. You can restore it immediately.</p>
                    <button
                        onClick={() => setIsMinimized(false)}
                        className="w-full py-3 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black rounded-xl border-2 border-[#0F172A] transition-all shadow-[4px_4px_0px_0px_#0F172A] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                    >
                        <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-6 6m0 0l-6-6m6 6V9a9 9 0 0118 0v12" />
                        </svg>
                        Restore Workspace
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFBEB] text-[#0F172A] font-sans flex flex-col items-center justify-start p-4 md:p-8 relative selection:bg-[#FDE047]">
            <Handle type="target" position={Position.Left} id="b" className="!bg-[#3B82F6] !border-2 !border-[#0F172A] !w-3 !h-3" />

            <div className="relative w-full max-w-7xl bg-white border-4 border-[#0F172A] rounded-2xl shadow-[8px_8px_0px_0px_#0F172A] flex flex-col overflow-hidden">
                
                <header className="px-6 py-5 border-b-4 border-[#0F172A] bg-[#FCD34D] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-10 bg-[#FBBF24] border-2 border-[#0F172A] rounded-xl shadow-[2.5px_2.5px_0px_0px_#0F172A] flex items-center justify-center overflow-visible flex-shrink-0">
                            <div className="absolute -top-[5px] left-1.5 w-5 h-2 bg-[#D97706] border-b-2 border-[#0F172A] rounded-t-sm"></div>
                            <svg className="w-5 h-5 stroke-[2.5] text-[#0F172A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#0F172A]">{payload.metadata?.companyName}</h1>
                                <span className="text-xs font-black tracking-wider px-2 py-0.5 bg-white text-[#0F172A] rounded-lg border-2 border-[#0F172A] shadow-[2px_2px_0px_0px_#0F172A]">{payload.metadata?.ticker}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 mt-1 max-w-xl line-clamp-1">{payload.metadata?.companySummary}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black bg-[#4ADE80] text-[#0F172A] border-2 border-[#0F172A] shadow-[2px_2px_0px_0px_#0F172A] uppercase tracking-wider">
                            {payload.metadata?.marketType} Market
                        </span>
                        
                        <button
                            onClick={handleDownloadReport}
                            disabled={isDownloading}
                            title="Download PDF Report"
                            className="p-2 text-[#0F172A] bg-[#3B82F6] disabled:opacity-50 border-2 border-[#0F172A] rounded-xl shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all duration-100 flex items-center justify-center"
                        >
                            {isDownloading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                            )}
                        </button>
                        
                        <button
                            onClick={handleDeleteCompany}
                            title="Delete Company"
                            className="p-2 text-white bg-[#EF4444] border-2 border-[#0F172A] rounded-xl shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all duration-100 flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 border-b-4 border-[#0F172A]">
                    
                    <main className="lg:col-span-2 flex flex-col bg-white overflow-y-auto max-h-[800px] lg:border-r-4 lg:border-[#0F172A]">
                        
                        <section className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#FEF3C7] border-b-4 border-[#0F172A]">
                            <div className="md:col-span-5 bg-white border-4 border-[#0F172A] rounded-2xl p-5 flex flex-col justify-between items-center text-center shadow-[4px_4px_0px_0px_#0F172A] relative overflow-hidden">
                                <div className="absolute top-0 inset-x-0 h-2 bg-[#4ADE80]"></div>
                                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">ANALYST VERDICT</span>
                                <div className="my-4">
                                    <span className="text-4xl md:text-5xl font-black tracking-tight text-[#1E40AF] uppercase bg-[#E0E7FF] px-4 py-2 rounded-xl border-2 border-[#0F172A] inline-block shadow-[2px_2px_0px_0px_#0F172A]">{payload.verdict?.decision}</span>
                                </div>
                                <div className="w-full">
                                    <div className="flex justify-between items-center text-xs font-black text-[#0F172A] mb-1.5">
                                        <span>CONFIDENCE SCORE</span>
                                        <span className="bg-[#4ADE80] px-1.5 py-0.5 rounded border border-[#0F172A]">{payload.verdict?.confidenceScore}%</span>
                                    </div>
                                    <div className="w-full bg-[#F1F5F9] rounded-xl h-4 overflow-hidden border-2 border-[#0F172A]">
                                        <div
                                            className="bg-[#4ADE80] h-full rounded-r-sm transition-all duration-1000 border-r-2 border-[#0F172A]"
                                            style={{ width: `${payload.verdict?.confidenceScore || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-7 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider mb-2 bg-[#FDE047] inline-block px-2 py-0.5 border-2 border-[#0F172A] rounded-lg">Investment Thesis Rationale</h3>
                                    <p className="text-[#0F172A] font-bold text-sm leading-relaxed">{payload.rationale}</p>
                                </div>

                                <div className="mt-4 pt-4 border-t-2 border-[#0F172A]/20 grid grid-cols-3 gap-2">
                                    <div className="bg-white p-2.5 rounded-xl border-2 border-[#0F172A] text-center shadow-[2px_2px_0px_0px_#0F172A]">
                                        <span className="block text-[10px] text-slate-500 font-black uppercase">Price Data</span>
                                        <span className={`text-xs font-black ${payload.dataQuality?.priceAvailable ? 'text-[#16A34A]' : 'text-slate-400'}`}>
                                            {payload.dataQuality?.priceAvailable ? 'ONLINE' : 'OFFLINE'}
                                        </span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border-2 border-[#0F172A] text-center shadow-[2px_2px_0px_0px_#0F172A]">
                                        <span className="block text-[10px] text-slate-500 font-black uppercase">Fundamentals</span>
                                        <span className={`text-xs font-black ${payload.dataQuality?.fundamentalsAvailable ? 'text-[#16A34A]' : 'text-slate-400'}`}>
                                            {payload.dataQuality?.fundamentalsAvailable ? 'ONLINE' : 'OFFLINE'}
                                        </span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border-2 border-[#0F172A] text-center shadow-[2px_2px_0px_0px_#0F172A]">
                                        <span className="block text-[10px] text-slate-500 font-black uppercase">News Feed</span>
                                        <span className={`text-xs font-black ${payload.dataQuality?.newsAvailable ? 'text-[#16A34A]' : 'text-slate-400'}`}>
                                            {payload.dataQuality?.newsAvailable ? 'ONLINE' : 'OFFLINE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="p-6 border-b-4 border-[#0F172A]">
                            <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="p-1 bg-[#3B82F6] text-white border-2 border-[#0F172A] rounded-md">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
                                Core Financial Metrics
                            </h3>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-white border-2 border-[#0F172A] rounded-xl p-4 shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] transition-all">
                                    <span className="block text-[10px] text-slate-500 font-black">SHARE PRICE</span>
                                    <div className="mt-1 flex items-baseline gap-0.5 flex-wrap">
                                        <span className="text-xl font-black text-[#0F172A]">{formatCurrency(payload.financialMetrics?.price)}</span>
                                        <span className="text-[10px] font-bold text-slate-400 ml-0.5">{payload.financialMetrics?.currency}</span>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-[#0F172A] rounded-xl p-4 shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] transition-all">
                                    <span className="block text-[10px] text-slate-500 font-black">P/E RATIO</span>
                                    <div className="mt-1 flex items-baseline">
                                        <span className="text-xl font-black text-[#0F172A]">{formatNumber(payload.financialMetrics?.peRatio)}</span>
                                        <span className="text-xs font-black text-slate-400 ml-0.5">x</span>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-[#0F172A] rounded-xl p-4 shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] transition-all">
                                    <span className="block text-[10px] text-slate-500 font-black">DEBT-TO-EQUITY</span>
                                    <div className="mt-1">
                                        <span className="text-xl font-black text-[#0F172A]">{formatNumber(payload.financialMetrics?.debtToEquity)}</span>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-[#0F172A] rounded-xl p-4 shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] transition-all">
                                    <span className="block text-[10px] text-slate-500 font-black">MARKET CAP</span>
                                    <div className="mt-1">
                                        <span className="text-xl font-black text-[#0F172A]">{formatMarketCap(payload.financialMetrics?.marketCap)}</span>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-[#0F172A] rounded-xl p-4 shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] transition-all">
                                    <span className="block text-[10px] text-slate-500 font-black">PROFIT MARGINS</span>
                                    <div className="mt-1">
                                        <span className="text-xl font-black text-[#16A34A]">{formatPercent(payload.financialMetrics?.profitMargins)}</span>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-[#0F172A] rounded-xl p-4 shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] transition-all">
                                    <span className="block text-[10px] text-slate-500 font-black">RETURN ON EQUITY</span>
                                    <div className="mt-1">
                                        <span className="text-xl font-black text-[#16A34A]">{formatPercent(payload.financialMetrics?.returnOnEquity)}</span>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-[#0F172A] rounded-xl p-4 shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] transition-all">
                                    <span className="block text-[10px] text-slate-500 font-black">REVENUE GROWTH</span>
                                    <div className="mt-1">
                                        <span className="text-xl font-black text-[#16A34A]">{formatPercent(payload.financialMetrics?.revenueGrowth)}</span>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-[#0F172A] rounded-xl p-4 shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] transition-all">
                                    <span className="block text-[10px] text-slate-500 font-black">EARNINGS GROWTH</span>
                                    <div className="mt-1">
                                        <span className="text-xl font-black text-[#16A34A]">{formatPercent(payload.financialMetrics?.earningsGrowth)}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#F8FAFC] border-b-4 border-[#0F172A]">
                            <div className="bg-white border-2 border-[#0F172A] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#0F172A]">
                                <div className="flex items-center gap-2 mb-4">
                                    <h4 className="font-black uppercase text-xs tracking-wider bg-[#4ADE80] px-2 py-0.5 border-2 border-[#0F172A] rounded-md">Key Catalysts</h4>
                                </div>
                                <ul className="space-y-3">
                                    {payload.keyCatalysts?.map((catalyst, index) => (
                                        <li key={index} className="flex items-start gap-2.5 text-sm font-bold text-[#0F172A]">
                                            <span className="text-[#16A34A] bg-[#DCFCE7] border border-[#0F172A] px-1 rounded text-xs">✔</span>
                                            <span>{catalyst}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-white border-2 border-[#0F172A] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#0F172A]">
                                <div className="flex items-center gap-2 mb-4">
                                    <h4 className="font-black uppercase text-xs tracking-wider bg-[#EF4444] text-white px-2 py-0.5 border-2 border-[#0F172A] rounded-md">Investment Risks</h4>
                                </div>
                                <ul className="space-y-3">
                                    {payload.investmentRisks?.map((risk, index) => (
                                        <li key={index} className="flex items-start gap-2.5 text-sm font-bold text-[#0F172A]">
                                            <span className="text-[#DC2626] bg-[#FEE2E2] border border-[#0F172A] px-1 rounded text-xs">⚠</span>
                                            <span>{risk}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section className="p-6 bg-white">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
                                <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                                    Systematic Deep Report Analysis
                                </h3>
                                <div className="flex border-2 border-[#0F172A] rounded-xl overflow-hidden bg-white p-1 self-start shadow-[2px_2px_0px_0px_#0F172A]">
                                    <button
                                        onClick={() => setActiveTab("overview")}
                                        className={`px-3 py-1 text-xs font-black rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-[#3B82F6] text-white' : 'text-slate-500 hover:text-[#0F172A]'}`}
                                    >
                                        Assessments
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("evidence")}
                                        className={`px-3 py-1 text-xs font-black rounded-lg transition-colors ${activeTab === 'evidence' ? 'bg-[#3B82F6] text-white' : 'text-slate-500 hover:text-[#0F172A]'}`}
                                    >
                                        Evidence Ledger
                                    </button>
                                </div>
                            </div>

                            {activeTab === "overview" ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white border-2 border-[#0F172A] p-4 rounded-2xl shadow-[3px_3px_0px_0px_#0F172A]">
                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Valuation Assessment</span>
                                            <p className="text-[#0F172A] font-bold text-xs leading-relaxed">{payload.decisionAnalysis?.valuationAssessment}</p>
                                        </div>
                                        <div className="bg-white border-2 border-[#0F172A] p-4 rounded-2xl shadow-[3px_3px_0px_0px_#0F172A]">
                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Financial Health</span>
                                            <p className="text-[#0F172A] font-bold text-xs leading-relaxed">{payload.decisionAnalysis?.financialHealthAssessment}</p>
                                        </div>
                                        <div className="bg-white border-2 border-[#0F172A] p-4 rounded-2xl shadow-[3px_3px_0px_0px_#0F172A]">
                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Growth Vectors</span>
                                            <p className="text-[#0F172A] font-bold text-xs leading-relaxed">{payload.decisionAnalysis?.growthAssessment}</p>
                                        </div>
                                        <div className="bg-white border-2 border-[#0F172A] p-4 rounded-2xl shadow-[3px_3px_0px_0px_#0F172A]">
                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Sentiment &amp; News Impact</span>
                                            <p className="text-[#0F172A] font-bold text-xs leading-relaxed">{payload.decisionAnalysis?.newsSentimentAssessment}</p>
                                        </div>
                                    </div>
                                    <div className="bg-[#EFF6FF] border-2 border-[#0F172A] p-5 rounded-2xl mt-4 shadow-[4px_4px_0px_0px_#0F172A]">
                                        <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Consensus Decision logic</span>
                                        <p className="text-[#0F172A] font-bold text-xs leading-relaxed">{payload.decisionAnalysis?.finalDecisionReason}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-[#0F172A] rounded-2xl overflow-hidden bg-white overflow-x-auto shadow-[4px_4px_0px_0px_#0F172A]">
                                    <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                                        <thead>
                                            <tr className="bg-[#F8FAFC] border-b-2 border-[#0F172A] text-[#0F172A] font-black uppercase tracking-wider">
                                                <th className="p-4">Key Claim Assessed</th>
                                                <th className="p-4">Documented Evidence</th>
                                                <th className="p-4">Source Authority</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y-2 divide-[#0F172A]/10 font-bold text-[#0F172A]">
                                            {payload.decisionAnalysis?.evidenceUsed?.map((item, index) => (
                                                <tr key={index} className="hover:bg-[#FEF3C7]/40 transition-colors">
                                                    <td className="p-4 font-black">{item.claim}</td>
                                                    <td className="p-4 max-w-xs truncate font-medium" title={item.evidence}>
                                                        {item.evidence?.startsWith('http') ? (
                                                            <a href={item.evidence} target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] hover:underline inline-flex items-center gap-1 font-bold">
                                                                Web Reference
                                                            </a>
                                                        ) : item.evidence}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="px-2 py-0.5 bg-[#F1F5F9] border border-[#0F172A] rounded font-black text-xs">
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

                    <aside className="lg:col-span-1 flex flex-col bg-[#FFFBEB] divide-y-4 divide-[#0F172A]">
                        <div className="p-6 flex flex-col h-[380px]">
                            <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider mb-4">
                                Documented Market News
                            </h3>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                                {payload.recentNews?.map((news, idx) => (
                                    <article key={idx} className="bg-white border-2 border-[#0F172A] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] transition-all">
                                        <a
                                            href={news.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-[#0F172A] text-sm font-black leading-snug hover:text-[#3B82F6] transition-colors uppercase tracking-tight"
                                        >
                                            {news.headline}
                                        </a>
                                        <p className="text-xs font-semibold text-slate-600 mt-2 line-clamp-2 leading-relaxed">{news.summary}</p>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 flex flex-col h-[470px] bg-white">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                                    Interactive AI Assistant
                                </h3>
                            </div>

                            <div className="flex-1 bg-[#F8FAFC] border-2 border-[#0F172A] rounded-2xl p-4 overflow-y-auto space-y-4 mb-3 flex flex-col shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
                                {chatMessages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`max-w-[85%] rounded-2xl p-3 text-xs font-bold border-2 border-[#0F172A] leading-relaxed shadow-[2px_2px_0px_0px_#0F172A] ${msg.sender === 'user'
                                            ? 'bg-[#FDE047] text-[#0F172A] self-end rounded-br-none'
                                            : 'bg-white text-[#0F172A] self-start rounded-bl-none'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="bg-white text-[#0F172A] self-start rounded-2xl rounded-bl-none border-2 border-[#0F172A] p-3 shadow-[2px_2px_0px_0px_#0F172A] text-xs flex items-center gap-1.5 max-w-[80%]">
                                        <span className="w-2 h-2 bg-[#0F172A] rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-[#0F172A] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-2 h-2 bg-[#0F172A] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask about PE, catalysts..."
                                    className="flex-1 bg-white border-2 border-[#0F172A] rounded-xl px-3 py-2 text-xs font-bold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:bg-[#FFFBEB] transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim() || isTyping}
                                    className="bg-[#3B82F6] text-white border-2 border-[#0F172A] disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#0F172A] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all"
                                >
                                    Ask
                                </button>
                            </form>
                        </div>
                    </aside>
                </div>

                <footer className="px-6 py-4 bg-[#F8FAFC] text-center text-[10px] font-bold text-slate-500 leading-normal">
                    <p className="max-w-4xl mx-auto">{payload.disclaimer}</p>
                </footer>
            </div>
        </div>
    );
}