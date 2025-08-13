import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

// --- Helper Components ---

// CORRECTED: Added the missing FormField component
const FormField = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const StatCard = ({ title, value, icon }) => (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="bg-slate-700 p-3 rounded-full">
            {icon}
        </div>
    </div>
);

const OrderDetails = ({ order, formatCurrency }) => (
    <div className="bg-slate-700/50 px-4 py-3 border-t border-slate-700">
        <h4 className="font-semibold text-gray-300 mb-2">Order Details:</h4>
        <ul className="space-y-3">
            {order.items?.map((item, index) => (
                <li key={item.item_id || index} className="p-2 bg-slate-600/50 rounded-md">
                    <p className="font-semibold text-white">{item.item_name} ({item.item_brand})</p>
                    <p className="text-xs text-gray-400 mt-1">{item.item_notes}</p>
                    <ul className="mt-2 pl-4 text-sm border-t border-slate-600 pt-2">
                        {item.services?.map((service, sIndex) => (
                            <li key={sIndex} className="flex justify-between text-gray-400">
                                <span>- {service.service_name}</span>
                                <span>{formatCurrency(service.price)}</span>
                            </li>
                        ))}
                    </ul>
                </li>
            ))}
        </ul>
    </div>
);

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

const AlertModal = ({ isOpen, onClose, title, message }) => {
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

const EditRepairModal = ({ isOpen, onClose, onSave, order, customers, services, users }) => {
    const [formData, setFormData] = useState(null);

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    useEffect(() => {
        if (order) {
            setFormData({
                ...order,
                date_due: formatDateForInput(order.date_due),
                date_completed: formatDateForInput(order.date_completed),
                items: order.items ? JSON.parse(JSON.stringify(order.items)) : []
            });
        }
    }, [order]);

    if (!isOpen || !formData) return null;

    const handleJobChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleItemChange = (itemIndex, e) => {
        const newItems = formData.items.map((item, index) => {
            if (index === itemIndex) {
                return { ...item, [e.target.name]: e.target.value };
            }
            return item;
        });
        setFormData({ ...formData, items: newItems });
    };

    const handleServiceChange = (itemIndex, serviceIndex, e) => {
        const newItems = formData.items.map((item, i) => {
            if (i === itemIndex) {
                const newServices = item.services.map((service, j) => {
                    if (j === serviceIndex) {
                        return { ...service, [e.target.name]: e.target.value };
                    }
                    return service;
                });
                return { ...item, services: newServices };
            }
            return item;
        });
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        const newItems = [...formData.items, { item_name: '', item_brand: '', item_notes: '', services: [] }];
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (itemIndex) => {
        const newItems = formData.items.filter((_, index) => index !== itemIndex);
        setFormData({ ...formData, items: newItems });
    };
    
    const addServiceToItem = (itemIndex) => {
        const newItems = [...formData.items];
        if (!newItems[itemIndex].services) {
            newItems[itemIndex].services = [];
        }
        newItems[itemIndex].services.push({ service_id: services[0]?.id || '', price: '0' });
        setFormData({ ...formData, items: newItems });
    };

    const removeServiceFromItem = (itemIndex, serviceIndex) => {
        const newItems = [...formData.items];
        newItems[itemIndex].services.splice(serviceIndex, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="w-full max-w-6xl rounded-xl bg-slate-800 p-8 shadow-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">Edit Repair Job #{formData.job_id}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-700">
                        <FormField label="Customer"><select name="customer_id" value={formData.customer_id} onChange={handleJobChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md">{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FormField>
                        <FormField label="Job Status"><select name="status" value={formData.status} onChange={handleJobChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"><option>Received</option><option>In Progress</option><option>Completed</option><option>Closed</option></select></FormField>
                        <FormField label="Assigned To"><select name="assigned_to" value={formData.assigned_to} onChange={handleJobChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md">{users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}</select></FormField>
                        <FormField label="Date Due"><input type="date" name="date_due" value={formData.date_due} onChange={handleJobChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" /></FormField>
                        <FormField label="Date Completed"><input type="date" name="date_completed" value={formData.date_completed} onChange={handleJobChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" /></FormField>
                        <FormField label="Payment Status"><select name="payment_status" value={formData.payment_status} onChange={handleJobChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"><option>Unpaid</option><option>Paid</option></select></FormField>
                    </div>
                    
                    <div className="space-y-6">
                        {formData.items.map((item, itemIndex) => (
                             <div key={item.item_id || itemIndex} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-cyan-300">Item #{itemIndex + 1}</h3>
                                    <button type="button" onClick={() => removeItem(itemIndex)} className="text-red-500 hover:text-red-400 font-bold">Remove Item</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField label="Item Name"><input type="text" name="item_name" value={item.item_name} onChange={(e) => handleItemChange(itemIndex, e)} className="w-full p-2 bg-gray-700 rounded-md" required /></FormField>
                                    <FormField label="Item Brand"><input type="text" name="item_brand" value={item.item_brand} onChange={(e) => handleItemChange(itemIndex, e)} className="w-full p-2 bg-gray-700 rounded-md" /></FormField>
                                    <FormField label="Item Notes"><textarea name="item_notes" value={item.item_notes} onChange={(e) => handleItemChange(itemIndex, e)} className="w-full p-2 bg-gray-700 rounded-md" rows="2"></textarea></FormField>
                                </div>
                                <div className="mt-4">
                                    <h4 className="font-semibold text-gray-300 mb-2">Services for this Item</h4>
                                    <div className="space-y-2">
                                        {item.services?.map((service, serviceIndex) => (
                                            <div key={service.service_id || serviceIndex} className="grid grid-cols-12 gap-2 items-center">
                                                <div className="col-span-6"><select name="service_id" value={service.service_id} onChange={(e) => handleServiceChange(itemIndex, serviceIndex, e)} className="w-full p-2 bg-gray-600 rounded-md"><option value="">Select a service</option>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                                                <div className="col-span-4"><input type="number" name="price" value={service.price} onChange={(e) => handleServiceChange(itemIndex, serviceIndex, e)} placeholder="Price" step="100" className="w-full p-2 bg-gray-600 rounded-md" /></div>
                                                <div className="col-span-2"><button type="button" onClick={() => removeServiceFromItem(itemIndex, serviceIndex)} className="text-red-500 w-full">Remove</button></div>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={() => addServiceToItem(itemIndex)} className="mt-2 text-cyan-400 font-semibold">+ Add Service</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addItem} className="mt-6 font-bold text-white bg-cyan-700 rounded-md hover:bg-cyan-600 px-4 py-2">+ Add Another Item</button>

                    <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="px-6 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-6 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// The main component for the repair job list page
const RepairJobPage = ({ socket, currentUser, onNavigate }) => {
    // --- State Management ---
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [services, setServices] = useState([]);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);

    const formatCurrency = (amount) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return '0 ៛';
        return `${num.toLocaleString()} ៛`;
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    // --- API Integration ---
    const fetchData = useCallback(async () => {
        try {
            const [jobsResponse, customersResponse, servicesResponse, usersResponse] = await Promise.all([
                api.getRepairJobs(),
                api.getCustomers(),
                api.getServices(),
                api.getUsers()
            ]);
            setOrders(jobsResponse.jobs);
            setCustomers(customersResponse.customers);
            setServices(servicesResponse.services);
            setUsers(usersResponse.users);
            setError(null);
        } catch (err) {
            if (err.response && err.response.status === 401) {
                window.location.href = '/login';
            } else {
                setError('Failed to fetch data.');
            }
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (socket) {
            const handleUpdate = () => fetchData();
            socket.on('repair_jobs_updated', handleUpdate);
            return () => socket.off('repair_jobs_updated', handleUpdate);
        }
    }, [socket, fetchData]);

    // --- UI Event Handlers ---
    const handleEditClick = (order) => {
        if (currentUser && order.user_id !== currentUser.id) {
            setAlertModal({ isOpen: true, title: 'Permission Denied', message: 'You can only edit orders that you have created.' });
            return;
        }
        setEditingOrder(order);
        setIsEditModalOpen(true);
    };

    const handleUpdateOrder = async (orderData) => {
        try {
            await api.updateRepairJob(orderData.job_id, orderData);
            setIsEditModalOpen(false);
            setEditingOrder(null);
        } catch (err) {
            console.error("Failed to update order:", err);
            setError("Failed to update order.");
        }
    };

    const handleDeleteClick = (order) => {
        if (currentUser && order.user_id !== currentUser.id) {
            setAlertModal({ isOpen: true, title: 'Permission Denied', message: 'You can only delete orders that you have created.' });
            return;
        }
        setOrderToDelete(order);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (orderToDelete) {
            try {
                await api.deleteRepairJob(orderToDelete.job_id);
            } catch (err) {
                console.error("Failed to delete order:", err);
                setError("Failed to delete order.");
            } finally {
                setIsDeleteModalOpen(false);
                setOrderToDelete(null);
            }
        }
    };

    // --- Calculated Values ---
    const calculateOrderTotal = (items) => {
        return items?.reduce((sum, item) => sum + (item.services?.reduce((serviceSum, service) => serviceSum + parseFloat(service.price || 0), 0) || 0), 0) || 0;
    };

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + calculateOrderTotal(order.items), 0);
    const totalItems = orders.reduce((sum, order) => sum + (order.items?.length || 0), 0);
    
    const toggleOrderDetails = (orderId) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-cyan-400">Repair Order Tracker</h1>
                    <p className="text-gray-400 mt-2">Log and manage multi-item customer orders.</p>
                </header>
                
                {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <StatCard title="Total Orders" value={totalOrders} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
                    <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
                    <StatCard title="Total Items Repaired" value={totalItems} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9.5 12.5l-2-2.5-3 4.5h11l-2-3-2 2.5z" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 12.5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
                </div>
                
                <div className="flex justify-end mb-4">
                    <button onClick={() => onNavigate('add_repair_job')} className="px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500">
                        + Add New Job
                    </button>
                </div>

                <div className="bg-slate-800 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold p-6 text-white">Current Orders</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">Job ID</th>
                                    <th className="px-4 py-3 text-left font-semibold">Customer</th>
                                    <th className="px-4 py-3 text-left font-semibold">Items</th>
                                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold">Assigned To</th>
                                    <th className="px-4 py-3 text-left font-semibold">Date Due</th>
                                    <th className="px-4 py-3 text-right font-semibold">Total Cost</th>
                                    <th className="px-4 py-3 text-left font-semibold">Payment</th>
                                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {orders.map(order => (
                                    <tr key={order.job_id}>
                                        <td className="px-4 py-4 align-top whitespace-nowrap">{order.job_id}</td>
                                        <td className="px-4 py-4 align-top whitespace-nowrap">{order.customer_name}</td>
                                        <td className="px-4 py-4 align-top">
                                            {order.items?.map((item, index) => (
                                                <div key={item.item_id || index} className={index > 0 ? 'mt-2 pt-2 border-t border-slate-700' : ''}>
                                                    <p className="font-semibold text-white">{item.item_name} ({item.item_brand})</p>
                                                    <p className="text-xs text-gray-400">{item.item_notes}</p>
                                                </div>
                                            ))}
                                        </td>
                                        <td className="px-4 py-4 align-top whitespace-nowrap">{order.status}</td>
                                        <td className="px-4 py-4 align-top whitespace-nowrap">{order.assigned_to}</td>
                                        <td className="px-4 py-4 align-top whitespace-nowrap">{formatDateForDisplay(order.date_due)}</td>
                                        <td className="px-4 py-4 align-top text-right whitespace-nowrap">{formatCurrency(calculateOrderTotal(order.items))}</td>
                                        <td className="px-4 py-4 align-top whitespace-nowrap">{order.payment_status}</td>
                                        <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => handleEditClick(order)} className="text-cyan-400 hover:text-cyan-300 p-2 rounded-full hover:bg-slate-700">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => handleDeleteClick(order)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-slate-700">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <ConfirmationModal 
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete this order for "${orderToDelete?.customer_name}"? This action cannot be undone.`}
                />
                <AlertModal 
                    isOpen={alertModal.isOpen}
                    onClose={() => setAlertModal({ isOpen: false, title: '', message: '' })}
                    title={alertModal.title}
                    message={alertModal.message}
                />
                <EditRepairModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleUpdateOrder}
                    order={editingOrder}
                    customers={customers}
                    services={services}
                    users={users}
                />
            </div>
        </div>
    );
};

export default RepairJobPage;
