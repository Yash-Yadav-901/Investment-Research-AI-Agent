import React from 'react'
import {NavLink} from 'react-router-dom'
const labels = [
    { id: 1, name: 'Home', path: '/' },
    { id: 2, name: 'Workspaces', path: '/workspaces' },
    { id: 3, name: 'Settings', path: '/settings' },
    { id: 4, name: 'Logout', path: '/logout' },
]

const SideBar = () =>{



    return(
        <div className='w-1/5 h-screen bg-gray-800 text-white p-4'>
            <h2 className='text-xl font-bold mb-4'>Sidebar</h2>
            <ul>
                {labels.map((label) => (
                    <li key={label.id} className='mb-2'>
                        <NavLink to={label.path} className='hover:text-gray-400'>
                            {label.name}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    )
}


export default SideBar