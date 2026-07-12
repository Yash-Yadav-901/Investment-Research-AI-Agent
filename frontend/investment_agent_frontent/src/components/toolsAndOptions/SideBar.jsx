import React from 'react';
import { NavLink } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/react';
import { AiOutlineHome } from "react-icons/ai";

const SideBar = ({ isOpen, onClose }) => {
    const { signOut } = useClerk();
    const { user } = useUser();

    const navLinks = [
        {
            id: 1,
            name: 'Home',
            path: '/home',
            icon: <AiOutlineHome size={22} className="stroke-[2.5]" />,
        },
        {
            id: 2,
            name: 'Workspaces',
            path: '/workspaces',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ),
        },
    ];

    return (
        <>
            {isOpen && (
                <div 
                    onClick={onClose} 
                    className="fixed inset-0 z-40 bg-slate-900/40 md:hidden backdrop-blur-sm transition-opacity duration-300"
                />
            )}

            <div
                className={`fixed md:relative inset-y-0 left-0 z-50 flex flex-col w-64 min-w-[16rem] bg-[#FFFBEB] border-r-4 border-[#0F172A] text-[#0F172A] transition-transform duration-300 md:translate-x-0 md:flex ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="px-6 py-6 border-b-4 border-[#0F172A] flex items-center justify-between bg-[#FCD34D]">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-9 bg-[#FBBF24] border-2 border-[#0F172A] rounded-md shadow-[2px_2px_0px_0px_#0F172A] flex items-center justify-center overflow-visible">
                            <div className="absolute -top-1 left-1 w-4 h-2 bg-[#D97706] border-b-2 border-[#0F172A] rounded-t-sm"></div>
                            <div className="absolute top-2 -right-1 w-5 h-5 bg-[#3B82F6] border-2 border-[#0F172A] rounded-full flex items-center justify-center shadow-[1px_1px_0px_0px_#0F172A]">
                                <span className="text-white font-bold text-xs -mt-[1px]">+</span>
                            </div>
                        </div>
                        <span className="text-base font-black uppercase tracking-wider text-[#0F172A]">
                            Investment<br/><span className="text-[#1E40AF]">Agent</span>
                        </span>
                    </div>
                    
                    <button 
                        onClick={onClose} 
                        className="p-1.5 text-[#0F172A] bg-[#EF4444] border-2 border-[#0F172A] hover:bg-[#DC2626] rounded-lg shadow-[2px_2px_0px_0px_#0F172A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:hidden transition-all"
                    >
                        <svg className="w-5 h-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.id}
                            to={link.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold border-[#0F172A] transition-all duration-100 ${
                                    isActive
                                        ? 'bg-[#3B82F6] text-white shadow-[3px_3px_0px_0px_#0F172A]'
                                        : 'bg-white text-[#0F172A] hover:bg-[#FEF3C7] hover:shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none'
                                }`
                            }
                        >
                            <span className="flex-shrink-0">{link.icon}</span>
                            <span>{link.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="px-4 py-5 border-t-4 border-[#0F172A] bg-[#FEF3C7] space-y-4">
                    {user && (
                        <div className="flex items-center gap-3 px-3 py-2 bg-white border-2 border-[#0F172A] rounded-xl shadow-[3px_3px_0px_0px_#0F172A]">
                            <img
                                src={user.imageUrl}
                                alt="avatar"
                                className="w-10 h-10 rounded-full object-cover border-2 border-[#0F172A]"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-[#0F172A] truncate">{user.fullName}</p>
                                <p className="text-[10px] font-bold text-slate-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
                            </div>
                        </div>
                    )}
                    
                    <button
                        onClick={() => signOut({ redirectUrl: '/sign-in' })}
                        className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-[#EF4444] text-white border-2 border-[#0F172A] rounded-xl text-sm font-bold shadow-[3px_3px_0px_0px_#0F172A] hover:bg-[#DC2626] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all duration-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
};

export default SideBar;