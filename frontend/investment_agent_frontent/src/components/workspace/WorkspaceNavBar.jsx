import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';

const WorkspaceNavBar = () => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();

    const [workspaceName, setWorkspaceName] = useState('');
    const [editName, setEditName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!workspaceId) return;
        const fetchWorkspace = async () => {
            try {
                const res = await axiosInstance.get(`/api/v1/workspace/${workspaceId}`);
                const name = res.data?.data?.name || 'Workspace';
                setWorkspaceName(name);
                setEditName(name);
            } catch (err) {
                console.error('Failed to fetch workspace name:', err);
                setWorkspaceName('Workspace');
                setEditName('Workspace');
            }
        };
        fetchWorkspace();
    }, [workspaceId]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleStartEdit = () => {
        setEditName(workspaceName);
        setIsEditing(true);
    };

    const handleSave = async () => {
        const trimmed = editName.trim();
        if (!trimmed || trimmed === workspaceName) {
            setIsEditing(false);
            return;
        }
        setIsSaving(true);
        try {
            await axiosInstance.put('/api/v1/workspace/update-name', {
                workspaceId: parseInt(workspaceId),
                newName: trimmed,
            });
            setWorkspaceName(trimmed);
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update workspace name:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditName(workspaceName);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    return (
        <header className="h-16 bg-[#FFFBEB] border-b-4 border-[#0F172A] flex items-center justify-between px-6 shrink-0 z-50 select-none">
            <button
                id="workspace-home-btn"
                onClick={() => navigate('/home')}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#0F172A] rounded-xl font-black text-xs uppercase tracking-wider text-[#0F172A] shadow-[2.5px_2.5px_0px_0px_#0F172A] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all duration-100"
                title="Go to Home"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 stroke-[2.5]"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                </svg>
                <span className="hidden sm:block">Home</span>
            </button>

            <div className="flex items-center gap-2">
                {!isEditing ? (
                    <button
                        id="workspace-name-btn"
                        onClick={handleStartEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FCD34D] border-2 border-[#0F172A] rounded-xl shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all duration-100 group"
                        title="Click to rename workspace"
                    >
                        <div className="relative w-6 h-5 bg-[#FBBF24] border border-[#0F172A] rounded-md shadow-[1px_1px_0px_0px_#0F172A] flex items-center justify-center overflow-visible flex-shrink-0">
                            <div className="absolute -top-[3px] left-0.5 w-2.5 h-1 bg-[#D97706] border-b border-[#0F172A] rounded-t-sm"></div>
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-[#0F172A] max-w-[180px] truncate">
                            {workspaceName || '…'}
                        </span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3.5 h-3.5 text-[#0F172A] stroke-[2.5] opacity-60 group-hover:opacity-100 transition-opacity"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-[#3B82F6] rounded-xl shadow-[3px_3px_0px_0px_#0F172A]">
                        <input
                            id="workspace-name-input"
                            ref={inputRef}
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isSaving}
                            className="bg-transparent text-xs font-black uppercase tracking-wider text-[#0F172A] outline-none w-40 placeholder-slate-400"
                            placeholder="Workspace name..."
                        />

                        <button
                            id="workspace-name-save-btn"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="p-1 rounded-lg text-[#16A34A] hover:bg-[#DCFCE7] transition-all disabled:opacity-50 flex items-center justify-center border border-transparent hover:border-[#0F172A]"
                            title="Save (Enter)"
                        >
                            {isSaving ? (
                                <svg className="w-3.5 h-3.5 animate-spin text-[#16A34A]" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>

                        <button
                            id="workspace-name-cancel-btn"
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="p-1 rounded-lg text-[#DC2626] hover:bg-[#FEE2E2] transition-all disabled:opacity-50 flex items-center justify-center border border-transparent hover:border-[#0F172A]"
                            title="Cancel (Esc)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default WorkspaceNavBar;