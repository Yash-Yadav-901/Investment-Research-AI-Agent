import { useState } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../../../utils/axiosConfig.js";
import { addCompany } from "../../../store/InsideWorkSpaces.js";
import { v4 as uuidv4 } from 'uuid';
import { Handle, Position } from '@xyflow/react';

const CompanyInputBox = ({ data }) => {
    const [companyName, setCompanyName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const { workspaceId } = data;

    const handleAddCompany = async () => {
        if (!companyName.trim()) {
            alert("Please enter a company name.");
            return;
        }

        setIsLoading(true);
        try {
            const companyNodeData = {
                id: uuidv4(),
                position: {
                    x: Math.floor(Math.random() * 600), 
                    y: Math.floor(Math.random() * 400), 
                },
            };
            const response = await axiosInstance.post("/api/v1/company/create", { company_name: companyName, companyNodeData, workspaceId });
            if (response.data?.data) {
                dispatch(addCompany(response.data.data));
                setCompanyName(""); 
            } else {
                console.error("Invalid response data:", response.data);
            }
        } catch (error) {
            console.error("Error adding company:", error);
        } finally {
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
                className="px-4 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white border-2 border-[#0F172A] font-black rounded-xl shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
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
        </div>
    );
};

export default CompanyInputBox;