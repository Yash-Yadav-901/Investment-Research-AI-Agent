import React from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/react';

const pageTitles = {
    '/home': { title: 'Home', subtitle: 'Welcome back to your dashboard' },
    '/workspaces': { title: 'Workspaces', subtitle: 'Manage and browse your workspaces' },
};

const TopNavBar = () => {
    const location = useLocation();
    const { user } = useUser();

    const isWorkspacePage = location.pathname.startsWith('/workspace/');

    const pageInfo = isWorkspacePage
        ? { title: 'Workspace', subtitle: 'Analysing investments with AI' }
        : pageTitles[location.pathname] || { title: 'Dashboard', subtitle: '' };

    return (
        <header className="h-14 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-6 shrink-0">
            {/* Left: Page title */}
            <div className="flex items-center gap-3">
                <div>
                    <h1 className="text-sm font-semibold text-white leading-none">{pageInfo.title}</h1>
                    {pageInfo.subtitle && (
                        <p className="text-xs text-gray-400 mt-0.5">{pageInfo.subtitle}</p>
                    )}
                </div>
            </div>

            {/* Right: search + user avatar */}
            <div className="flex items-center gap-4">
                {/* Search bar */}
                <div className="relative hidden sm:flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-gray-400 absolute left-3"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-gray-800 text-sm text-gray-300 placeholder-gray-500 pl-9 pr-4 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 w-44 transition-all duration-200 focus:w-56"
                    />
                </div>

              
                {/* User avatar */}
                {user && (
                    <div className="flex items-center gap-2">
                        <img
                            src={user.imageUrl}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500"
                        />
                        <span className="text-xs font-medium text-gray-300 hidden md:block">
                            {user.firstName}
                        </span>
                    </div>
                )}
            </div>
        </header>
    );
};

export default TopNavBar;
