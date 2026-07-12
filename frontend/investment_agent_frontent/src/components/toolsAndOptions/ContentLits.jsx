import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosConfig.js";
import { useDispatch, useSelector } from "react-redux";
import { addNewWorkspace, setWorkspaces, removeWorkspace } from "../../store/workspaces.js";
import { useNavigate } from "react-router-dom";

// Smooth, Clean Cartoon Folder SVG with Light Glare Accents
const CartoonFolderIcon = ({ size = "100%", isAddButton = false }) => {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 200 170" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:scale-105 active:scale-95 transition-transform duration-150 select-none"
        >
            {/* Back Folder panel */}
            <path d="M10 35C10 23.9543 18.9543 15 30 15H75L90 30H160C171.046 30 180 38.9543 180 50V145C180 156.046 171.046 165 160 165H30C18.9543 165 10 156.046 10 145V35Z" fill="#ff9f1c" stroke="#000000" strokeWidth="4" strokeLinejoin="round"/>
            
            {/* Internal papers */}
            <rect x="25" y="28" width="135" height="110" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="3"/>
            <rect x="35" y="40" width="115" height="98" rx="4" fill="#f4f4f5" stroke="#000000" strokeWidth="3"/>
            
            {/* Main Front Panel */}
            <path d="M10 55C10 49.4772 14.4772 45 20 45H170C175.523 45 180 49.4772 180 55V140C180 148.284 173.284 155 165 155H25C16.7157 155 10 148.284 10 140V55Z" fill="#ffcc4d" stroke="#000000" strokeWidth="4" strokeLinejoin="round"/>
            
            {/* Smooth Vector Glare Accents */}
            <path d="M22 53C22 50 25 48 30 48H160" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
            <path d="M18 65V125" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.3"/>
            <circle cx="20" cy="54" r="2.5" fill="#000000"/>
            
            {/* Clean cartoon document label slot line */}
            <line x1="32" y1="65" x2="65" y2="65" stroke="#000000" strokeWidth="4" strokeLinecap="round"/>

            {/* Blue Plus Badge overlay if it acts as the creation catalyst */}
            {isAddButton && (
                <g transform="translate(120, 95)">
                    {/* Circle badge */}
                    <circle cx="35" cy="35" r="32" fill="#2589ef" stroke="#000000" strokeWidth="4"/>
                    {/* Highlight glare crescent */}
                    <path d="M13 22C18 13 29 10 38 12" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
                    {/* Plus horizontal and vertical bars */}
                    <rect x="29" y="16" width="12" height="38" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="4"/>
                    <rect x="16" y="29" width="38" height="12" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="4"/>
                    {/* Clean structural inner layer reinforcement */}
                    <rect x="32" y="19" width="6" height="32" rx="1" fill="#ffffff"/>
                    <rect x="19" y="32" width="32" height="6" rx="1" fill="#ffffff"/>
                </g>
            )}
        </svg>
    );
};

const ContentList = () => {
    const dispatch = useDispatch();
    const workspaces = useSelector((state) => state.workspaces.workspaces);
    const [showAddWorkspacePopup, setShowAddWorkspacePopup] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await axiosInstance.get("/api/v1/workspace/list");
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

    const handleWorkspaceClick = (workspaceId) => {
        navigate(`/workspace/${workspaceId}`);
    };

    const handleDeleteWorkspace = async (e, id) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this workspace? All company dashboards inside it will be permanently lost.")) return;
        try {
            const response = await axiosInstance.delete("/api/v1/workspace/delete", {
                data: { workspaceId: id }
            });
            if (response.data) {
                dispatch(removeWorkspace(id));
            }
        } catch (error) {
            console.error("Error deleting workspace:", error);
            alert("Failed to delete workspace");
        }
    };

    return (
        <div className="p-6 min-h-screen bg-[#fffcf5] text-slate-950 font-sans">
            {showAddWorkspacePopup && (
                <AddWorkspacePopupInput onClose={() => setShowAddWorkspacePopup(false)} />
            )}

            {/* Header: Create Section wrapper */}
            <div className="mb-8 max-w-sm bg-white border-[3px] border-black p-5 rounded-2xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-sm font-black uppercase tracking-wider mb-4 text-slate-900 flex items-center gap-2">
                    Create New Workspace
                </h2>
                <div 
                    onClick={() => setShowAddWorkspacePopup(true)}
                    className="w-28 h-24 cursor-pointer relative group"
                >
                    <CartoonFolderIcon isAddButton={true} />
                </div>
            </div>

            {/* Clean Thick Segment Separation Line */}
            <div className="my-8 border-t-[3px] border-black border-dashed w-full max-w-5xl" />

            {/* Display Workspace Explorer Section */}
            <div>
                <h2 className="text-lg font-black uppercase tracking-wider mb-6 text-slate-900 flex items-center gap-2">
                    📁 Existing Workspaces
                </h2>
                
                {workspaces.length === 0 ? (
                    <div className="bg-white border-[3px] border-black border-dashed p-8 rounded-2xl max-w-xl text-center">
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-wide">No active modules found. Click above to append one!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-6xl">
                        {workspaces.map((ws, index) => (
                            <div
                                onClick={() => handleWorkspaceClick(ws.id || index)}
                                key={ws.id || index}
                                className="relative flex flex-col items-center justify-center p-4 bg-white border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
                            >
                                {/* Hover Close Trigger Button */}
                                <button
                                    onClick={(e) => handleDeleteWorkspace(e, ws.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center bg-[#EF4444] hover:bg-[#DC2626] border-2 border-black text-black font-black text-[10px] rounded-lg shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                                    title="Delete Workspace"
                                >
                                    ✕
                                </button>

                                <div className="w-24 h-20 mb-3">
                                    <CartoonFolderIcon isAddButton={false} />
                                </div>
                                <span className="text-xs font-black uppercase text-center tracking-wide text-slate-900 truncate w-full px-1">
                                    {ws.name || ws}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            {/* Main Popover window bounding container box */}
            <div className="bg-[#fffdf9] border-[4px] border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md relative overflow-hidden transform transition-all">
                {/* Yellow light reflection stripe asset accent */}
                <div className="absolute top-0 inset-x-0 h-3 bg-[#ffcc4d] border-b-[3px] border-black" />
                
                {/* Close trigger button */}
                <button 
                    className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-[#ff6b6b] hover:bg-[#ff4f4f] border-[3px] border-black text-black font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all z-10" 
                    onClick={onClose}
                >
                    ✕
                </button>

                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mt-4 mb-4 flex items-center gap-1.5">
                    📂 Create New Workspace
                </h2>
                
                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        placeholder="Enter workspace name..."
                        className="bg-white border-[3px] border-black p-3 text-xs font-bold text-black placeholder-zinc-400 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-[#edf5ff] w-full"
                    />
                    
                    <button 
                        onClick={handleAddContent}
                        className="w-full py-3 bg-[#2589ef] hover:bg-[#1d7cd1] text-white font-black uppercase tracking-wider text-xs border-[3px] border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-tr after:from-transparent after:via-white/10 after:to-transparent"
                    >
                        Add Workspace
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContentList;