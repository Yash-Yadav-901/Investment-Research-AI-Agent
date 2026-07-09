import React from 'react'

const labels = [
    { id: 1, name: 'Home', href: '#' },
    { id: 2, name: 'Workspaces', href: '#' },
    { id: 3, name: 'Settings', href: '#' },
    { id: 4, name: 'Logout', href: '#' },
]

const SideBar = () =>{



    return(
        <div className='w-1/5 h-screen bg-gray-800 text-white p-4'>
            <h2 className='text-xl font-bold mb-4'>Sidebar</h2>
            <ul>
                {labels.map((label) => (
                    <li key={label.id} className='mb-2'>
                        <a href={label.href} className='hover:text-gray-400'>
                            {label.name}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}


export default SideBar