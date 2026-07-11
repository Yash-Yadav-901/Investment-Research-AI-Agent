import React, { useState, useEffect } from "react";
import axiosInstance from "../../axiosInstance";
import { useDispatch, useSelector } from "react-redux";
import { addNewContent, setWorkspaces } from "../../store/contentSlice";

const ContentList = () => {
    const dispatch = useDispatch();
    const workspaces = useSelector((state) => state.workspaces.workspaces);
    const [showAddWorkspacePopup, setShowAddWorkspacePopup] = useState(false);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await axiosInstance.get("/content");
                if (response.data && Array.isArray(response.data)) {
                    dispatch(setWorkspaces(response.data));
                } else {
                    console.error("Invalid response data:", response.data);
                }
            } catch (error) {
                console.error("Error fetching content:", error);
            }
        };

        fetchContent();
    }, [dispatch]);

    return (
        <div className="content-list">
            {showAddWorkspacePopup && (
                <AddWorkspacePopupInput onClose={() => setShowAddWorkspacePopup(false)} />
            )}

            <div>
                <h2>Create New Workspace</h2>
                <div onClick={() => setShowAddWorkspacePopup(true)}>
                    <img src="./images (1).png" alt="Add Workspace" />
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4">Existing Workspaces</h2>
                <ul>
                    {workspaces.map((ws, index) => (
                        <li key={index} className="mb-2">
                            {ws.name || ws}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const AddWorkspacePopupInput = ({ onClose }) => {
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const dispatch = useDispatch();

    const handleAddContent = async () => {
        try {
            const response = await axiosInstance.post("/content", { name: newWorkspaceName });
            if (response.data) {
                dispatch(addNewContent(response.data));
                setNewWorkspaceName("");
                onClose(); // close popup after adding
            } else {
                console.error("Invalid response data:", response.data);
            }
        } catch (error) {
            console.error("Error adding content:", error);
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
