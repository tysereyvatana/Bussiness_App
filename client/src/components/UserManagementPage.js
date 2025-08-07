import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-500">Confirm Delete</button>
                </div>
            </div>
        </div>
    );
};

const WarningModal = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-lg">
                <h2 className="text-xl font-bold text-yellow-400 mb-4">{title}</h2>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500">OK</button>
                </div>
            </div>
        </div>
    );
};

const UserModal = ({ isOpen, onClose, onSave, user, userRoles, userStatuses }) => {
    const [formData, setFormData] = useState({ username: '', password: '', role: 'Staff', status: 'Active' });
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                password: '',
                role: user.role || 'Staff',
                status: user.status || 'Active'
            });
        } else {
            setFormData({
                username: '',
                password: '',
                role: userRoles[0] || 'Staff',
                status: userStatuses[0] || 'Active'
            });
        }
        setError('');
    }, [user, isOpen, userRoles, userStatuses]);

    if (!isOpen) return null;

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await onSave(formData);
        } catch (err) {
            setError(err.message || 'An unknown error occurred.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">{user ? 'Edit User' : 'Add New User'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="w-full p-3 bg-gray-700 rounded-md" required />
                        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={user ? "New Password (optional)" : "Password"} className="w-full p-3 bg-gray-700 rounded-md" required={!user} />
                        
                        <div>
                            <label className="text-sm text-gray-400">Role</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md">
                                {userRoles.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="text-sm text-gray-400">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md">
                                {userStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                    </div>
                    {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end space-x-4 mt-8">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const UserManagementPage = ({ socket, currentUser }) => {
    const [users, setUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [warningModal, setWarningModal] = useState({ isOpen: false, title: '', message: '' });
    const [userRoles, setUserRoles] = useState([]);
    const [userStatuses, setUserStatuses] = useState([]);

    const isAdmin = currentUser.role === 'Admin';

    const fetchAllUsers = useCallback(async (searchQuery) => {
        try {
            setIsLoading(true);
            const data = await api.getUsers(searchQuery);
            setUsers(data.users);
            setTotalUsers(data.total);
            setError(null);
        } catch (err) {
            setError('Failed to fetch users.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => fetchAllUsers(searchTerm), 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, fetchAllUsers]);

    useEffect(() => {
        if (socket) {
            const handleUpdate = () => fetchAllUsers(searchTerm);
            socket.on('users_updated', handleUpdate);
            return () => socket.off('users_updated', handleUpdate);
        }
    }, [socket, searchTerm, fetchAllUsers]);

    useEffect(() => {
        if (isAdmin) {
            const fetchDropdownData = async () => {
                try {
                    const [roles, statuses] = await Promise.all([
                        api.getUserRoles(),
                        api.getUserStatuses()
                    ]);
                    setUserRoles(roles);
                    setUserStatuses(statuses);
                } catch (error) {
                    console.error("Failed to fetch user roles/statuses:", error);
                }
            };
            fetchDropdownData();
        }
    }, [isAdmin]);

    const handleOpenModal = (user = null) => {
        if (user && user.id === currentUser.id) {
            setWarningModal({ isOpen: true, title: 'Action Not Allowed', message: 'You cannot edit your own account from this management page.' });
            return;
        }
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (userData) => {
        if (editingUser) {
            await api.updateUser(editingUser.id, userData);
        } else {
            await api.register(userData);
        }
        handleCloseModal();
    };

    const handleDeleteUser = (user) => {
        if (user.id === currentUser.id) {
            setWarningModal({ isOpen: true, title: 'Action Not Allowed', message: 'You cannot delete your own account.' });
            return;
        }
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            try {
                await api.deleteUser(userToDelete.id);
            } catch (err) {
                console.error("Failed to delete user:", err);
            } finally {
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
            }
        }
    };

    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-bold text-cyan-400">User Management</h1>
                        {isAdmin && (
                            <button onClick={() => handleOpenModal()} className="px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500">
                                + Add User
                            </button>
                        )}
                    </div>
                    <div className="max-w-lg">
                        <input
                            type="text"
                            placeholder="Search by username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 bg-gray-700 rounded-md"
                        />
                    </div>
                </div>

                {isLoading && <p className="text-center">Loading users...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                
                {!isLoading && !error && (
                    <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Username</th>
                                        <th className="px-6 py-3 text-left">Role</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                        <th className="px-6 py-3 text-left">Date Joined</th>
                                        {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {users.length > 0 ? users.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4">{user.username}</td>
                                            <td className="px-6 py-4">{user.role}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    user.status === 'Active' ? 'bg-green-200 text-green-800' :
                                                    user.status === 'Pending' ? 'bg-yellow-200 text-yellow-800' :
                                                    'bg-red-200 text-red-800'
                                                }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => handleOpenModal(user)} className="text-cyan-400 hover:text-cyan-300">Edit</button>
                                                    <button onClick={() => handleDeleteUser(user)} className="text-red-500 hover:text-red-400">Delete</button>
                                                </td>
                                            )}
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={isAdmin ? 5 : 4} className="text-center py-10">No users found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-gray-700 px-6 py-3 text-right text-sm font-medium text-gray-300">
                            Total Users: {totalUsers}
                        </div>
                    </div>
                )}
            </div>
            {isAdmin && (
                <>
                    <UserModal 
                        isOpen={isModalOpen} 
                        onClose={handleCloseModal} 
                        onSave={handleSaveUser} 
                        user={editingUser}
                        userRoles={userRoles}
                        userStatuses={userStatuses}
                    />
                    <ConfirmationModal 
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onConfirm={confirmDelete}
                        title="Confirm Deletion"
                        message={`Are you sure you want to delete the user "${userToDelete?.username}"? This action cannot be undone.`}
                    />
                    <WarningModal
                        isOpen={warningModal.isOpen}
                        onClose={() => setWarningModal({ isOpen: false, title: '', message: '' })}
                        title={warningModal.title}
                        message={warningModal.message}
                    />
                </>
            )}
        </div>
    );
};

export default UserManagementPage;
