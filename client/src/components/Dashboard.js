import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

// --- Reusable SVG Icons for the cards ---
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-1.78-4.125a4 4 0 00-6.44 0A6 6 0 003 20v1h12z" /></svg>;
const CustomersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ServicesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

// --- Reusable Stat Card Component ---
const StatCard = ({ icon, title, value, isLoading }) => (
    <div className="bg-gray-800 p-6 rounded-lg flex items-center space-x-4">
        <div className="bg-gray-700 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            {isLoading ? (
                <div className="h-8 w-16 bg-gray-700 rounded-md animate-pulse"></div>
            ) : (
                <p className="text-3xl font-bold text-white">{value}</p>
            )}
        </div>
    </div>
);

// --- Activity Feed Item Component ---
const ActivityItem = ({ activity }) => {
    const time = new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
        <div className="flex items-center space-x-3 py-2">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">
                {activity.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
                <p className="text-sm text-white">
                    <span className="font-semibold">{activity.username}</span> {activity.details}
                </p>
                <p className="text-xs text-gray-400">{time}</p>
            </div>
        </div>
    );
};


const Dashboard = ({ currentUser, socket }) => {
    const [stats, setStats] = useState({ totalUsers: 0, totalCustomers: 0, totalServices: 0 });
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [error, setError] = useState('');
    const [activities, setActivities] = useState([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            if (stats.totalUsers === 0) setIsLoadingStats(true);
            const data = await api.getDashboardStats();
            setStats(data);
        } catch (err) {
            setError('Could not load dashboard data.');
            console.error(err);
        } finally {
            setIsLoadingStats(false);
        }
    }, [stats.totalUsers]);
    
    const fetchActivities = useCallback(async () => {
        try {
            setIsLoadingActivities(true);
            const data = await api.getActivities();
            setActivities(data);
        } catch (err) {
            setError('Could not load activity feed.');
            console.error(err);
        } finally {
            setIsLoadingActivities(false);
        }
    }, []);

    // Effect for the initial data fetch
    useEffect(() => {
        fetchStats();
        fetchActivities();
    }, [fetchStats, fetchActivities]);

    // Effect for real-time updates
    useEffect(() => {
        if (socket) {
            const handleStatsUpdate = () => fetchStats();
            const handleActivityUpdate = () => fetchActivities();

            socket.on('users_updated', handleStatsUpdate);
            socket.on('customers_updated', handleStatsUpdate);
            socket.on('services_updated', handleStatsUpdate);
            socket.on('activity_updated', handleActivityUpdate);

            return () => {
                socket.off('users_updated', handleStatsUpdate);
                socket.off('customers_updated', handleStatsUpdate);
                socket.off('services_updated', handleStatsUpdate);
                socket.off('activity_updated', handleActivityUpdate);
            };
        }
    }, [socket, fetchStats, fetchActivities]);

    return (
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2">
                <h1 className="text-4xl font-bold text-cyan-400 mb-2">Welcome back, {currentUser.username}!</h1>
                <p className="text-lg text-gray-400">Here's a real-time summary of your business activity.</p>
                
                {error && <p className="mt-4 text-red-500">{error}</p>}

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard icon={<UsersIcon />} title="Total Users" value={stats.totalUsers} isLoading={isLoadingStats} />
                    <StatCard icon={<CustomersIcon />} title="Total Customers" value={stats.totalCustomers} isLoading={isLoadingStats} />
                    <StatCard icon={<ServicesIcon />} title="Total Services" value={stats.totalServices} isLoading={isLoadingStats} />
                </div>
            </div>

            {/* Activity Feed Column */}
            <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
                <div className="space-y-2">
                    {isLoadingActivities ? (
                        <p className="text-gray-400">Loading activities...</p>
                    ) : (
                        activities.length > 0 ? (
                            activities.map(activity => <ActivityItem key={activity.id} activity={activity} />)
                        ) : (
                            <p className="text-gray-400">No recent activity found.</p>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
