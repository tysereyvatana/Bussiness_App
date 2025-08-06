import React from 'react';

// --- SVG Icons for Navigation ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const CustomersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

// --- Reusable Navigation Item Component ---
const NavItem = ({ icon, label, view, activeView, onNavigate }) => {
    const isActive = view === activeView;
    return (
        <button
            onClick={() => onNavigate(view)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
};

// --- Main Layout Component ---
const MainLayout = ({ currentUser, activeView, onNavigate, onLogout, children }) => {
    return (
        <div className="flex h-screen bg-gray-900 text-white">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-gray-800 p-4 flex flex-col justify-between">
                <div>
                    {/* User Profile Section */}
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-xl font-bold">
                            {currentUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-white">{currentUser.username}</p>
                            <p className="text-sm text-gray-400">Business Plan</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2">
                        <NavItem icon={<DashboardIcon />} label="Dashboard" view="dashboard" activeView={activeView} onNavigate={onNavigate} />
                        <NavItem icon={<CustomersIcon />} label="Customers" view="customers" activeView={activeView} onNavigate={onNavigate} />
                        <NavItem icon={<ChatIcon />} label="Chat" view="chat" activeView={activeView} onNavigate={onNavigate} />
                    </nav>
                </div>

                {/* Logout Button */}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
                >
                    <LogoutIcon />
                    <span className="font-medium">Logout</span>
                </button>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gray-900">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
