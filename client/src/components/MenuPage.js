import React from 'react';

// ✨ Destructure the new onNavigateToCustomers prop
const MenuPage = ({ currentUser, onNavigateToChat, onNavigateToCustomers, onLogout }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <div className="w-full max-w-md text-center">
                <h1 className="text-4xl font-bold text-cyan-400">Welcome</h1>
                <p className="mt-2 text-2xl text-gray-300">{currentUser.username}</p>
                
                <div className="mt-10 space-y-4">
                    {/* ✨ Add the new button here */}
                    <button
                        onClick={onNavigateToCustomers}
                        className="w-full px-6 py-3 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        Manage Customers
                    </button>
                    <button
                        onClick={onNavigateToChat}
                        className="w-full px-6 py-3 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Go to Chat
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full px-6 py-3 font-bold text-white bg-red-600 rounded-md hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuPage;
