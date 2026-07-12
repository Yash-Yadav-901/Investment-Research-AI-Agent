import React from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/react';

const pageTitles = {
    '/home': { title: 'Home', subtitle: 'Welcome back to your dashboard' },
    '/workspaces': { title: 'Workspaces', subtitle: 'Manage and browse your workspaces' },
};

const TopNavBar = ({ onMenuClick }) => {
    const location = useLocation();
    const { user } = useUser();

    const isWorkspacePage = location.pathname.startsWith('/workspace/');

    const pageInfo = isWorkspacePage
        ? { title: 'Workspace', subtitle: 'Analysing investments with AI' }
        : pageTitles[location.pathname] || { title: 'Dashboard', subtitle: '' };

    return (
        <header className="h-16 bg-[#fff6e6] border-b-[3px] border-black flex items-center justify-between px-6 shrink-0 z-30">
            {/* Left Side: Dynamic Tab Structure */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-1.5 text-black md:hidden border-[3px] border-black bg-[#6bb5ff] hover:bg-[#4fa3f7] rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all mr-1 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-tr after:from-transparent after:via-white/20 after:to-transparent"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                
                {/* Simulated Rounded Folder-Tab Header Element */}
                <div className="bg-[#ffa51f] border-[3px] border-black px-4 py-1.5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center relative overflow-hidden max-w-xs sm:max-w-md">
                    {/* Visual Vector Light Reflection Accent Overlay */}
                    <div className="absolute top-0.5 left-2 right-2 h-[3px] bg-white/30 rounded-full" />
                    <h1 className="text-xs font-bold text-black uppercase tracking-wider leading-none select-none">
                        {pageInfo.title}
                    </h1>
                    {pageInfo.subtitle && (
                        <p className="text-[10px] text-black/80 font-medium truncate mt-0.5 max-w-[160px] sm:max-w-none">
                            {pageInfo.subtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* Right Side: Heavy Outline Search Box + User Badge */}
            <div className="flex items-center gap-4">
                {/* Search Field Container */}
                <div className="relative hidden sm:flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-black absolute left-3.5 z-10"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search workspace..."
                        className="bg-white text-xs font-bold text-black placeholder-zinc-500 pl-10 pr-4 py-2 rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-[#edf5ff] w-48 transition-all duration-200 focus:w-60"
                    />
                </div>

                {/* User Info Capsule Badge */}
                {user && (
                    <div className="flex items-center gap-2 bg-white border-[3px] border-black py-1 px-2.5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-transform">
                        <img
                            src={user.imageUrl}
                            alt="user avatar"
                            className="w-7 h-7 rounded-xl object-cover border-2 border-black bg-zinc-100"
                        />
                        <span className="text-xs font-black text-black hidden md:block tracking-wide select-none">
                            {user.firstName ? user.firstName.toUpperCase() : 'USER'}
                        </span>
                    </div>
                )}
            </div>
        </header>
    );
};

export default TopNavBar;