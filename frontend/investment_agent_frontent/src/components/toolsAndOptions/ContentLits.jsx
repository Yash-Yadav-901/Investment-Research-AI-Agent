import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosConfig.js";
import { useDispatch, useSelector } from "react-redux";
import { addNewWorkspace, setWorkspaces } from "../../store/workspaces.js";
import { useNavigate } from "react-router-dom";

const ContentList = () => {
    const dispatch = useDispatch();
    const workspaces = useSelector((state) => state.workspaces.workspaces);
    const [showAddWorkspacePopup, setShowAddWorkspacePopup] = useState(false);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await axiosInstance.get("/api/v1/workspace/list");
                // Backend wraps data in ApiResponse: { statusCode, data: [...], message }
                const data = response.data?.data ?? response.data;
                if (data && Array.isArray(data)) {
                    dispatch(setWorkspaces(data));
                } else {
                    console.error("Unexpected response shape:", response.data);
                }
            } catch (error) {
                console.error("Error fetching workspaces:", error);
            }
        };

        fetchContent();
    }, [dispatch]);

    const navigate = useNavigate();

    const handleWorkspaceClick = (workspaceId) => {
        navigate(`/workspace/${workspaceId}`);
    };

    return (
        <div className="">
            {showAddWorkspacePopup && (
                <AddWorkspacePopupInput onClose={() => setShowAddWorkspacePopup(false)} />
            )}

            <div className=" w-full">
                <h2>Create New Workspace</h2>
                <div>
                    <img
                        src="./images (1).png"
                        alt="Add Workspace"
                        onClick={() => setShowAddWorkspacePopup(true)}
                        style={{ cursor: 'pointer' , width: "10%",height:"10%"}}
                    />
                </div>
            </div>

            <hr style={{ border: 'none', borderTop: '2px solid gray', margin: '10px 0', width: "75vw" }} />

            <div>
                <h2 className="text-xl font-bold mb-4">Existing Workspaces</h2>
                <div className="grid grid-cols-5 gap-4 p-4">
                    {workspaces.map((ws, index) => (
                        <div
                            onClick={() => handleWorkspaceClick(ws.id || index)}
                            key={ws.id || index}
                            className="mb-2"
                            style={{ cursor: 'pointer' }}
                        >
                            <img src="./images (1).png" alt="Workspace" />
                            <span>{ws.name || ws}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AddWorkspacePopupInput = ({ onClose }) => {
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const dispatch = useDispatch();

    const handleAddContent = async () => {
        if (!newWorkspaceName.trim()) return;
        try {
            const response = await axiosInstance.post("/api/v1/workspace/create", { name: newWorkspaceName });
            // Backend wraps result in ApiResponse: { statusCode, data: workspace, message }
            const newWorkspace = response.data?.data ?? response.data;
            if (newWorkspace) {
                dispatch(addNewWorkspace(newWorkspace));
                setNewWorkspaceName("");
                onClose();
            } else {
                console.error("Invalid response data:", response.data);
            }
        } catch (error) {
            console.error("Error adding workspace:", error);
        }
    };

    return (
        <div className="popup-overlay">
            <div className="popup-box">
                <button className="close-button" onClick={onClose}>
                    X
                </button>
                <h2>Create New Workspace</h2>
                <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Enter workspace name"
                />
                <button onClick={handleAddContent}>Add Workspace</button>
            </div>
        </div>
    );
};

export default ContentList;
