import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../../../axiosInstance";
import { addCompany } from "../../../store/InsideWorkSpaces";
import { v4 as uuidv4 } from 'uuid';


const CompanyInputBox = () => {
    const [companyName, setCompanyName] = useState("");
    const dispatch = useDispatch();

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
            const response = await axiosInstance.post("/companies", { name: companyName, companyNodeData });
            if (response.data) {
                dispatch(addCompany(response.data));
                setCompanyName(""); // Clear the input field after adding
            } else {
                console.error("Invalid response data:", response.data);
            }
        } catch (error) {
            console.error("Error adding company:", error);
        }
    };

    return (
        <div className="company-input-box">
            <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
            />
            <button onClick={handleAddCompany}>
                Analyze
            </button>
        </div>
    );
};


export default CompanyInputBox;