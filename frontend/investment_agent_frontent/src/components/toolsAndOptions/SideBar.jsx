import React from 'react';
import { NavLink } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/react';
import { AiOutlineHome } from "react-icons/ai";
const SideBar = () => {
    const { signOut } = useClerk();
    const { user } = useUser();

    const navLinks = [
        {
            id: 1,
            name: 'Home',
            path: '/home',
            icon: (
               <AiOutlineHome size={20}/>

            ),
        },
        {
            id: 2,
            name: 'Workspaces',
            path: '/workspaces',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ),
        },
    ];

    return (
        <div
            style={{ width: '220px', minWidth: '220px' }}
            className="h-screen bg-gray-900 text-white flex flex-col border-r border-gray-700"
        >
            {/* Brand */}
            <div className="px-5 py-5 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-100 leading-tight">Investment<br/>Agent</span>
                </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navLinks.map((link) => (
                    <NavLink
                        key={link.id}
                        to={link.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                                isActive
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        {link.icon}
                        {link.name}
                    </NavLink>
                ))}
            </nav>

            {/* User + Logout pinned at bottom */}
            <div className="px-3 py-4 border-t border-gray-700 space-y-3">
                {user && (
                    <div className="flex items-center gap-3 px-3 py-2">
                        <img
                            src={user.imageUrl}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-100 truncate">{user.fullName}</p>
                            <p className="text-xs text-gray-400 truncate">{user.primaryEmailAddress?.emailAddress}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => signOut({ redirectUrl: '/sign-in' })}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-150"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default SideBar;