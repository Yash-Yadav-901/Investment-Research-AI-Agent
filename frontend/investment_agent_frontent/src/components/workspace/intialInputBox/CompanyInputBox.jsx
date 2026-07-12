import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../../../utils/axiosConfig.js";
import { addCompany } from "../../../store/InsideWorkSpaces.js";
import { v4 as uuidv4 } from 'uuid';


import { Handle, Position } from '@xyflow/react';

const CompanyInputBox = ({data}) => {
    const [companyName, setCompanyName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const {workspaceId}=data;
    console.log("company input box ",data);

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
                setCompanyName(""); // Clear the input field after adding
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
        <div className="border-2 border-gray-200 rounded-lg p-4 relative flex flex-col gap-2 bg-zinc-900 border-zinc-800 text-zinc-300">
            <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                disabled={isLoading}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 text-zinc-100"
            />
            <button 
                onClick={handleAddCompany}
                disabled={isLoading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                    </>
                ) : (
                    "Analyze"
                )}
            </button>
            <Handle type="source" position={Position.Right} id="a" />
        </div>
    );
};


export default CompanyInputBox;