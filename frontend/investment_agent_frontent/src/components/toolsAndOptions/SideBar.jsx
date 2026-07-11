import React from 'react';
import { NavLink } from 'react-router-dom';
import { useClerk } from '@clerk/react';

const SideBar = () => {
    const { signOut } = useClerk();

    const navLinks = [
        { id: 1, name: 'Home', path: '/home' },
        { id: 2, name: 'Workspace', path: '/workspaces' }
    ];

    return (
        <div className='w-1/5 h-screen bg-gray-800 text-white p-4'>
            <h2 className='text-xl font-bold mb-4'>Sidebar</h2>
            <ul>
                {navLinks.map((label) => (
                    <li key={label.id} className='mb-2'>
                        <NavLink to={label.path} className='hover:text-gray-400'>
                            {label.name}
                        </NavLink>
                    </li>
                ))}
                <li className='mb-2'>
                    <button
                        onClick={() => signOut({ redirectUrl: '/sign-in' })}
                        className='hover:text-gray-400 text-left w-full'
                    >
                        Logout
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default SideBar;