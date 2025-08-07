import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

// A simple modal to display warning or info messages.
const WarningModal = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-lg">
                <h2 className="text-xl font-bold text-yellow-400 mb-4">{title}</h2>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};


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

const CustomerModal = ({ isOpen, onClose, onSave, customer }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', status: 'Active' });
    useEffect(() => {
        if (customer) setFormData({ name: customer.name || '', email: customer.email || '', phone: customer.phone || '', address: customer.address || '', status: customer.status || 'Active' });
        else setFormData({ name: '', email: '', phone: '', address: '', status: 'Active' });
    }, [customer, isOpen]);
    if (!isOpen) return null;
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full p-3 bg-gray-700 rounded-md" required />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="w-full p-3 bg-gray-700 rounded-md" />
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="w-full p-3 bg-gray-700 rounded-md" />
                        <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Address" className="w-full p-3 bg-gray-700 rounded-md" rows="3"></textarea>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md">
                            <option>Active</option>
                            <option>Inactive</option>
                            <option>Lead</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4 mt-8">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const CustomerPage = ({ socket, currentUser }) => {
    const [customers, setCustomers] = useState([]);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [warningModal, setWarningModal] = useState({ isOpen: false, title: '', message: '' });


    const fetchAllCustomers = useCallback(async (searchQuery) => {
        try {
            setIsLoading(true);
            const data = await api.getCustomers(searchQuery);
            setCustomers(data.customers);
            setTotalCustomers(data.total);
            setError(null);
        } catch (err) {
            setError('Failed to fetch customers. Please check the server connection.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchAllCustomers(searchTerm);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, fetchAllCustomers]);

    useEffect(() => {
        if (socket) {
            const handleUpdate = () => fetchAllCustomers(searchTerm);
            socket.on('customers_updated', handleUpdate);
            return () => socket.off('customers_updated', handleUpdate);
        }
    }, [socket, searchTerm, fetchAllCustomers]);


    const handleOpenModal = (customer = null) => {
        if (customer && customer.user_id !== currentUser.id) {
            setWarningModal({
                isOpen: true,
                title: 'Permission Denied',
                message: 'You can only edit customers that you have created.'
            });
            return;
        }
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleSaveCustomer = async (customerData) => {
        try {
            if (editingCustomer) {
                await api.updateCustomer(editingCustomer.id, customerData);
            } else {
                await api.addCustomer(customerData);
            }
            handleCloseModal();
        } catch (err) {
            console.error("Failed to save customer:", err);
        }
    };

    const handleDeleteCustomer = (customer) => {
        if (customer.user_id !== currentUser.id) {
            setWarningModal({
                isOpen: true,
                title: 'Permission Denied',
                message: 'You can only delete customers that you have created.'
            });
            return;
        }
        setCustomerToDelete(customer);
        setIsDeleteModalOpen(true);
    };
    
    const confirmDelete = async () => {
        if (customerToDelete) {
            try {
                await api.deleteCustomer(customerToDelete.id);
            } catch (err) {
                console.error("Failed to delete customer:", err);
            } finally {
                setIsDeleteModalOpen(false);
                setCustomerToDelete(null);
            }
        }
    };


    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-bold text-cyan-400">Customer Management</h1>
                        <button onClick={() => handleOpenModal()} className="px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 flex-shrink-0">
                            + Add Customer
                        </button>
                    </div>
                    <div className="max-w-lg">
                         <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                </div>

                {isLoading && <p className="text-center">Loading customers...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                
                {!isLoading && !error && (
                    <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created By</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {customers.length > 0 ? customers.map(customer => (
                                        <tr key={customer.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-white">{customer.name}</div>
                                                <div className="text-sm text-gray-400">{customer.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{customer.phone}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    customer.status === 'Active' ? 'bg-green-200 text-green-800' : 
                                                    customer.status === 'Inactive' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                                                }`}>
                                                    {customer.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{customer.creator_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={() => handleOpenModal(customer)} className="text-cyan-400 hover:text-cyan-300">Edit</button>
                                                <button onClick={() => handleDeleteCustomer(customer)} className="text-red-500 hover:text-red-400">Delete</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" className="text-center py-10">No customers found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                         </div>
                         <div className="bg-gray-700 px-6 py-3 text-right text-sm font-medium text-gray-300">
                                Total Customers: {totalCustomers}
                         </div>
                    </div>
                )}
            </div>
            <CustomerModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveCustomer} customer={editingCustomer} />
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the customer "${customerToDelete?.name}"? This action cannot be undone.`}
            />
            <WarningModal
                isOpen={warningModal.isOpen}
                onClose={() => setWarningModal({ isOpen: false, title: '', message: '' })}
                title={warningModal.title}
                message={warningModal.message}
            />
        </div>
    );
};

export default CustomerPage;
