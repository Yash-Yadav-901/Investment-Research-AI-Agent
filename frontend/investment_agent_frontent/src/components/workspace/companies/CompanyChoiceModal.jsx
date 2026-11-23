import { useState } from "react";
import { createPortal } from "react-dom";

/**
 * CompanyChoiceModal
 *
 * Props:
 *   query      {string}    – original search text shown in the heading
 *   candidates {object[]}  – resolve MULTIPLE candidates
 *   notice     {string}    – optional banner text (shown when re-resolving loops back to MULTIPLE)
 *   busy       {boolean}   – disable interactions while re-resolving
 *   onProceed  {function}  – called with { type: "candidate", candidate } or { type: "typed", text }
 *   onCancel   {function}  – close without starting any analysis
 */
const CompanyChoiceModal = ({ query, candidates, notice, busy, onProceed, onCancel }) => {
    const [typedText, setTypedText] = useState("");

    const handleTypedSubmit = () => {
        const text = typedText.trim();
        if (!text) return;
        onProceed({ type: "typed", text });
    };

    const content = (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 nodrag nowheel">
            <div className="bg-white border-4 border-[#0F172A] rounded-2xl shadow-[6px_6px_0px_0px_#0F172A] max-w-md w-full p-5 text-[#0F172A] flex flex-col gap-4 nodrag nowheel">

                {/* Heading */}
                <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-[#0F172A]">
                        More than one company matches &ldquo;{query}&rdquo;
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                        Select the one you want to research
                    </p>
                </div>

                {/* Notice banner (shown on re-resolve loops) */}
                {notice && (
                    <div className="bg-[#FEF9C3] border-2 border-[#D97706] rounded-xl px-3 py-2 text-xs font-bold text-[#92400E]">
                        {notice}
                    </div>
                )}

                {/* Candidate list */}
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                    {candidates.map((cand) => (
                        <button
                            key={cand.ticker}
                            type="button"
                            disabled={busy}
                            onClick={() => onProceed({ type: "candidate", candidate: cand })}
                            className="flex items-center justify-between p-3 border-2 border-[#0F172A] rounded-xl hover:bg-[#FEF08A] hover:-translate-y-[2px] active:translate-y-0 transition-all text-left shadow-[2px_2px_0px_0px_#0F172A] bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex flex-col pr-2">
                                <span className="text-xs font-black text-[#0F172A]">{cand.name}</span>
                                <span className="text-[10px] font-bold text-slate-500">
                                    {cand.ticker} · {cand.exchange}
                                </span>
                                {cand.otherListings && cand.otherListings.length > 0 && (
                                    <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                        Also listed:{" "}
                                        {cand.otherListings
                                            .map((o) => `${o.ticker} (${o.exchange})`)
                                            .join(", ")}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-mono font-bold bg-[#E0E7FF] text-[#1E1B4B] px-2 py-0.5 border border-[#0F172A] rounded-md shrink-0">
                                {cand.ticker}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Type a fuller name */}
                <div className="flex flex-col gap-2 border-t-2 border-slate-100 pt-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Or type a fuller name / ticker
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={typedText}
                            disabled={busy}
                            onChange={(e) => setTypedText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleTypedSubmit()}
                            placeholder="e.g. Infosys Ltd or INFY.NS"
                            className="flex-1 px-3 py-2 bg-white border-2 border-[#0F172A] rounded-xl text-xs font-bold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:bg-[#FFFBEB] transition-colors disabled:opacity-50"
                        />
                        <button
                            type="button"
                            disabled={busy || !typedText.trim()}
                            onClick={handleTypedSubmit}
                            className="px-3 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white border-2 border-[#0F172A] font-black rounded-xl shadow-[2px_2px_0px_0px_#0F172A] hover:-translate-y-[1px] active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1"
                        >
                            {busy ? (
                                <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                "Go"
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-2 border-t-2 border-slate-100">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onCancel}
                        className="px-4 py-2 border-2 border-[#0F172A] rounded-xl font-black text-xs uppercase hover:bg-slate-100 shadow-[2px_2px_0px_0px_#0F172A] transition-all cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    return typeof document !== "undefined" ? createPortal(content, document.body) : null;
};

export default CompanyChoiceModal;
