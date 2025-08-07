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

// Modal for adding/editing services
const ServiceModal = ({ isOpen, onClose, onSave, service }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '0.00',
        status: 'Active',
    });

    useEffect(() => {
        if (service) {
            setFormData({
                name: service.name || '',
                description: service.description || '',
                price: service.price || '0.00',
                status: service.status || 'Active',
            });
        } else {
            setFormData({ name: '', description: '', price: '0.00', status: 'Active' });
        }
    }, [service, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">{service ? 'Edit Service' : 'Add New Service'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Service Name" className="w-full p-3 bg-gray-700 rounded-md" required />
                        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="w-full p-3 bg-gray-700 rounded-md" rows="3"></textarea>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price" step="0.01" className="w-full p-3 bg-gray-700 rounded-md" required />
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md">
                            <option>Active</option>
                            <option>Inactive</option>
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

// Main page component for managing services
const ServicePage = ({ socket, currentUser }) => {
    const [services, setServices] = useState([]);
    const [totalServices, setTotalServices] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [warningModal, setWarningModal] = useState({ isOpen: false, title: '', message: '' });

    const fetchAllServices = useCallback(async (searchQuery) => {
        try {
            setIsLoading(true);
            const data = await api.getServices(searchQuery);
            setServices(data.services);
            setTotalServices(data.total);
            setError(null);
        } catch (err) {
            setError('Failed to fetch services.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchAllServices(searchTerm);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, fetchAllServices]);

    useEffect(() => {
        if (socket) {
            const handleUpdate = () => fetchAllServices(searchTerm);
            socket.on('services_updated', handleUpdate);
            return () => socket.off('services_updated', handleUpdate);
        }
    }, [socket, searchTerm, fetchAllServices]);

    const handleOpenModal = (service = null) => {
        if (service && service.user_id !== currentUser.id) {
            setWarningModal({
                isOpen: true,
                title: 'Permission Denied',
                message: 'You can only edit services that you have created.'
            });
            return;
        }
        setEditingService(service);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
    };

    const handleSaveService = async (serviceData) => {
        try {
            if (editingService) {
                await api.updateService(editingService.id, serviceData);
            } else {
                await api.addService(serviceData);
            }
            handleCloseModal();
        } catch (err) {
            console.error("Failed to save service:", err);
        }
    };

    const handleDeleteService = (service) => {
        if (service.user_id !== currentUser.id) {
            setWarningModal({
                isOpen: true,
                title: 'Permission Denied',
                message: 'You can only delete services that you have created.'
            });
            return;
        }
        setServiceToDelete(service);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (serviceToDelete) {
            try {
                await api.deleteService(serviceToDelete.id);
            } catch (err) {
                console.error("Failed to delete service:", err);
            } finally {
                setIsDeleteModalOpen(false);
                setServiceToDelete(null);
            }
        }
    };

    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-bold text-cyan-400">Services Management</h1>
                        <button onClick={() => handleOpenModal()} className="px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500">
                            + Add Service
                        </button>
                    </div>
                    <div className="max-w-lg">
                        <input
                            type="text"
                            placeholder="Search by name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 bg-gray-700 rounded-md"
                        />
                    </div>
                </div>

                {isLoading && <p className="text-center">Loading services...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                
                {!isLoading && !error && (
                    <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Name</th>
                                        <th className="px-6 py-3 text-left">Description</th>
                                        <th className="px-6 py-3 text-left">Price</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                        <th className="px-6 py-3 text-left">Created By</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {services.length > 0 ? services.map(service => (
                                        <tr key={service.id}>
                                            <td className="px-6 py-4">{service.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{service.description}</td>
                                            <td className="px-6 py-4">${parseFloat(service.price).toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${service.status === 'Active' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                                    {service.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{service.creator_name}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={() => handleOpenModal(service)} className="text-cyan-400 hover:text-cyan-300">Edit</button>
                                                <button onClick={() => handleDeleteService(service)} className="text-red-500 hover:text-red-400">Delete</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" className="text-center py-10">No services found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-gray-700 px-6 py-3 text-right text-sm font-medium text-gray-300">
                            Total Services: {totalServices}
                        </div>
                    </div>
                )}
            </div>
            <ServiceModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveService} service={editingService} />
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the service "${serviceToDelete?.name}"? This action cannot be undone.`}
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

export default ServicePage;
