import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../../../utils/axiosConfig.js";
import { addCompany } from "../../../store/InsideWorkSpaces.js";
import { v4 as uuidv4 } from 'uuid';


import { Handle, Position } from '@xyflow/react';

const CompanyInputBox = ({data}) => {
    const [companyName, setCompanyName] = useState("");
    const dispatch = useDispatch();
    const {workspaceId}=data;
    console.log("company input box ",data);

    const handleAddCompany = async () => {
        if (!companyName.trim()) {
            alert("Please enter a company name.");
            return;
        }

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
        }
    };

    return (
        <div className="border-2 border-gray-200 rounded-lg p-4 relative">
            <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
            />
            <button onClick={handleAddCompany}>
                Analyze
            </button>
            <Handle type="source" position={Position.Right} id="a" />
        </div>
    );
};


export default CompanyInputBox;