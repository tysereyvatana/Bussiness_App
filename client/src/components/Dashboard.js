import React from 'react';

const Dashboard = ({ currentUser }) => {
    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">Welcome back, {currentUser.username}!</h1>
            <p className="text-lg text-gray-400">This is your main dashboard. Select an option from the menu to get started.</p>
            
            {/* You can add summary cards or charts here in the future */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-white">Customers</h3>
                    <p className="text-gray-400 mt-2">View and manage your customer list.</p>
                </div>
                 <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-white">Live Chat</h3>
                    <p className="text-gray-400 mt-2">Access the real-time chat application.</p>
                </div>
                 <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-white">Analytics</h3>
                    <p className="text-gray-400 mt-2">Future home of your business analytics.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
