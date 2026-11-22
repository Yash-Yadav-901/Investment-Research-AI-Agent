import { useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import axiosInstance from "../../../utils/axiosConfig.js";
import { addCompany } from "../../../store/InsideWorkSpaces.js";
import { v4 as uuidv4 } from 'uuid';
import { Handle, Position } from '@xyflow/react';
import { toast } from 'react-hot-toast';

const CompanyInputBox = ({ data }) => {
    const [companyName, setCompanyName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const dispatch = useDispatch();
    const { workspaceId } = data;

    const handleError = (error) => {
        console.error("Error in company analysis flow:", error);
        const status = error.response?.status;
        let message = "Failed to add company.";
        if (status === 429) {
            message = "Rate limit reached. Please wait a moment.";
        } else if (error.response?.data?.message) {
            message = error.response.data.message;
        } else if (error.message) {
            message = error.message;
        }
        toast.error(message);
    };

    const executeCreateCompany = async (targetName, targetTicker = null) => {
        setIsLoading(true);
        setShowModal(false);
        try {
            const companyNodeData = {
                id: uuidv4(),
                position: {
                    x: Math.floor(Math.random() * 600), 
                    y: Math.floor(Math.random() * 400), 
                },
            };
            const payload = {
                company_name: targetName,
                companyNodeData,
                workspaceId,
            };
            if (targetTicker) {
                payload.ticker = targetTicker;
            }

            const response = await axiosInstance.post("/api/v1/company/create", payload);
            if (response.data?.data) {
                dispatch(addCompany(response.data.data));
                setCompanyName(""); 
                setCandidates([]);
                toast.success(`Successfully analyzed ${targetName}!`);
            } else {
                console.error("Invalid response data:", response.data);
                toast.error("Invalid response from server.");
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCompany = async () => {
        if (!companyName.trim()) {
            toast.error("Please enter a company name.");
            return;
        }

        setIsLoading(true);
        try {
            const resolveRes = await axiosInstance.post("/api/v1/company/resolve", {
                company_name: companyName.trim(),
            });
            const resolveData = resolveRes.data?.data;

            if (resolveData?.status === "SINGLE" && resolveData?.candidate) {
                await executeCreateCompany(resolveData.candidate.name, resolveData.candidate.ticker);
            } else if (resolveData?.status === "MULTIPLE" && resolveData?.candidates?.length > 0) {
                setCandidates(resolveData.candidates);
                setShowModal(true);
                setIsLoading(false);
            } else {
                // NO_MATCH or unrecognized status -> create with typed name only
                await executeCreateCompany(companyName.trim(), null);
            }
        } catch (error) {
            handleError(error);
            setIsLoading(false);
        }
    };

    return (
        <div className="border-4 border-[#0F172A] rounded-2xl p-5 relative flex flex-col gap-3 bg-white text-[#0F172A] shadow-[4px_4px_0px_0px_#0F172A] w-64">
            <div className="flex items-center gap-2 mb-1">
                <div className="relative w-8 h-7 bg-[#FBBF24] border-2 border-[#0F172A] rounded-md shadow-[1.5px_1.5px_0px_0px_#0F172A] flex items-center justify-center overflow-visible flex-shrink-0">
                    <div className="absolute -top-[4px] left-1 w-3.5 h-1.5 bg-[#D97706] border-b-2 border-[#0F172A] rounded-t-sm"></div>
                    <div className="absolute top-1.5 -right-0.5 w-3.5 h-3.5 bg-[#3B82F6] border border-[#0F172A] rounded-full flex items-center justify-center shadow-[0.5px_0.5px_0px_0px_#0F172A]">
                        <span className="text-white font-black text-[8px] -mt-[1px]">+</span>
                    </div>
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">New Agent</span>
            </div>

            <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name..."
                disabled={isLoading}
                className="px-3 py-2 bg-white border-2 border-[#0F172A] rounded-xl text-xs font-bold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:bg-[#FFFBEB] transition-colors disabled:opacity-50"
            />
            
            <button 
                onClick={handleAddCompany}
                disabled={isLoading}
                className="px-4 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white border-2 border-[#0F172A] font-black rounded-xl shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider text-xs cursor-pointer"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                    </>
                ) : (
                    "Analyze"
                )}
            </button>
            
            <Handle 
                type="source" 
                position={Position.Right} 
                id="a" 
                className="!bg-[#3B82F6] !border-2 !border-[#0F172A] !w-3 !h-3"
            />

            {showModal && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 nodrag nowheel">
                    <div className="bg-white border-4 border-[#0F172A] rounded-2xl shadow-[6px_6px_0px_0px_#0F172A] max-w-md w-full p-5 text-[#0F172A] flex flex-col gap-4 nodrag nowheel">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-tight text-[#0F172A]">
                                More than one company matches &ldquo;{companyName}&rdquo;
                            </h3>
                            <p className="text-xs font-bold text-slate-500 mt-1">
                                Select the one you want to research
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                            {candidates.map((cand) => (
                                <button
                                    key={cand.ticker}
                                    type="button"
                                    onClick={() => executeCreateCompany(cand.name, cand.ticker)}
                                    className="flex items-center justify-between p-3 border-2 border-[#0F172A] rounded-xl hover:bg-[#FEF08A] hover:-translate-y-[2px] active:translate-y-0 transition-all text-left shadow-[2px_2px_0px_0px_#0F172A] bg-white cursor-pointer"
                                >
                                    <div className="flex flex-col pr-2">
                                        <span className="text-xs font-black text-[#0F172A]">{cand.name}</span>
                                        <span className="text-[10px] font-bold text-slate-500">{cand.exchange}</span>
                                        {cand.otherListings && cand.otherListings.length > 0 && (
                                            <span className="text-[10px] font-semibold text-slate-500 mt-0.5">
                                                Also listed: {cand.otherListings.map((o) => `${o.ticker} (${o.exchange})`).join(", ")}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs font-mono font-bold bg-[#E0E7FF] text-[#1E1B4B] px-2 py-0.5 border border-[#0F172A] rounded-md shrink-0">
                                        {cand.ticker}
                                    </span>
                                </button>
                            ))}
                            
                            <button
                                type="button"
                                onClick={() => executeCreateCompany(companyName.trim(), null)}
                                className="flex items-center justify-between p-3 border-2 border-dashed border-[#0F172A] rounded-xl hover:bg-slate-100 transition-colors text-left bg-white cursor-pointer"
                            >
                                <span className="text-xs font-black text-slate-700">None of these / private company</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Search &ldquo;{companyName}&rdquo;</span>
                            </button>
                        </div>

                        <div className="flex justify-end pt-2 border-t-2 border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false);
                                    setCandidates([]);
                                }}
                                className="px-4 py-2 border-2 border-[#0F172A] rounded-xl font-black text-xs uppercase hover:bg-slate-100 active:translate-y-0 shadow-[2px_2px_0px_0px_#0F172A] transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CompanyInputBox;