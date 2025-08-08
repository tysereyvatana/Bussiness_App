import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

// --- (Modal components: ConfirmationModal, WarningModal, SearchableCombobox) ---
// These sub-components are unchanged and correct.
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

const SearchableCombobox = ({ options, selectedIds, onSelectionChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const toggleSelection = (optionId) => {
        const newSelectedIds = selectedIds.includes(optionId)
            ? selectedIds.filter(id => id !== optionId)
            : [...selectedIds, optionId];
        onSelectionChange(newSelectedIds);
    };

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOptions = options.filter(option => selectedIds.includes(option.id));

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="w-full p-2 bg-gray-700 rounded-md flex flex-wrap gap-2 items-center cursor-text" onClick={() => setIsOpen(true)}>
                {selectedOptions.map(option => (
                    <span key={option.id} className="bg-cyan-600 text-white px-2 py-1 rounded-full text-sm flex items-center gap-2">
                        {option.name}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleSelection(option.id);
                            }}
                            className="text-cyan-200 hover:text-white"
                        >
                            &times;
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    placeholder={selectedIds.length === 0 ? "Select services..." : ""}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    className="bg-transparent flex-grow focus:outline-none p-1"
                />
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.map(option => (
                        <div
                            key={option.id}
                            onClick={() => toggleSelection(option.id)}
                            className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                        >
                            <span>{option.name}</span>
                            {selectedIds.includes(option.id) && (
                                <span className="text-cyan-400">&#10003;</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- THIS COMPONENT HAS BEEN CORRECTED ---
const RepairJobModal = ({ isOpen, onClose, onSave, job, customers, users, services }) => {
    const getInitialFormData = () => ({
        customer_id: '',
        status: 'Received',
        assigned_to: '',
        item_name: '',
        item_brand: '',
        item_notes: '',
        work_description: '',
        estimated_cost: '0.00',
        final_cost: '0.00',
        payment_status: 'Unpaid',
        date_due: '',
        date_completed: '',
        service_ids: [],
    });

    const [formData, setFormData] = useState(getInitialFormData());

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    useEffect(() => {
        if (isOpen) {
            if (job) {
                setFormData({
                    customer_id: job.customer_id || '',
                    status: job.status || 'Received',
                    assigned_to: job.assigned_to || '',
                    item_name: job.item_name || '',
                    item_brand: job.item_brand || '',
                    item_notes: job.item_notes || '',
                    work_description: job.work_description || '',
                    estimated_cost: job.estimated_cost || '0.00',
                    final_cost: job.final_cost || '0.00',
                    payment_status: job.payment_status || 'Unpaid',
                    date_due: formatDateForInput(job.date_due),
                    date_completed: formatDateForInput(job.date_completed),
                    service_ids: job.service_ids || [],
                });
            } else {
                setFormData({
                    ...getInitialFormData(),
                    customer_id: customers[0]?.id || '',
                    assigned_to: users[0]?.username || '',
                });
            }
        }
    }, [job, isOpen, customers, users]);

    if (!isOpen) return null;

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleServiceChange = (newServiceIds) => {
        setFormData(prev => ({ ...prev, service_ids: newServiceIds }));
    };

    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    const FormField = ({ label, children }) => (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            {children}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="w-full max-w-6xl rounded-xl bg-slate-800 p-8 shadow-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">{job ? 'Edit Repair Job' : 'Add New Repair Job'}</h2>
                <form onSubmit={handleSubmit}>
                    {/* CORRECTED: Changed to a 3-column layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                        {/* Left Column: Item Details */}
                        <div className="space-y-4">
                            <FormField label="Customer">
                                <select name="customer_id" value={formData.customer_id} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md" required>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Item Name">
                                <input type="text" name="item_name" value={formData.item_name} onChange={handleChange} placeholder="e.g., Soccer Cleats" className="w-full p-3 bg-gray-700 rounded-md" required />
                            </FormField>
                            <FormField label="Item Brand">
                                <input type="text" name="item_brand" value={formData.item_brand} onChange={handleChange} placeholder="e.g., Nike" className="w-full p-3 bg-gray-700 rounded-md" />
                            </FormField>
                             <FormField label="Item Notes">
                                <textarea name="item_notes" value={formData.item_notes} onChange={handleChange} placeholder="Specific details about the item (e.g., size, color, condition)" className="w-full p-3 bg-gray-700 rounded-md" rows="8"></textarea>
                            </FormField>
                        </div>
                        
                        {/* Center Column: Work Details */}
                        <div className="space-y-4">
                            <FormField label="Work Description">
                                <textarea name="work_description" value={formData.work_description} onChange={handleChange} placeholder="Detailed notes on the repair work needed" className="w-full p-3 bg-gray-700 rounded-md" rows="10" required></textarea>
                            </FormField>
                             <FormField label="Services">
                                <SearchableCombobox
                                    options={services}
                                    selectedIds={formData.service_ids}
                                    onSelectionChange={handleServiceChange}
                                />
                            </FormField>
                        </div>

                        {/* Right Column: Status and Costs */}
                        <div className="space-y-4">
                            <FormField label="Job Status">
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md">
                                    <option>Received</option><option>In Progress</option><option>Awaiting Parts</option>
                                    <option>Completed</option><option>Ready for Pickup</option><option>Closed</option>
                                </select>
                            </FormField>
                            <FormField label="Assigned To">
                                <select name="assigned_to" value={formData.assigned_to} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md">
                                    {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Estimated Cost ($)">
                                <input type="number" name="estimated_cost" value={formData.estimated_cost} onChange={handleChange} placeholder="0.00" step="0.01" className="w-full p-3 bg-gray-700 rounded-md" />
                            </FormField>
                            <FormField label="Final Cost ($)">
                                <input type="number" name="final_cost" value={formData.final_cost} onChange={handleChange} placeholder="0.00" step="0.01" className="w-full p-3 bg-gray-700 rounded-md" />
                            </FormField>
                            <FormField label="Date Due">
                                <input type="date" name="date_due" value={formData.date_due} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md" />
                            </FormField>
                            <FormField label="Date Completed">
                                <input type="date" name="date_completed" value={formData.date_completed} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md" />
                            </FormField>
                             <FormField label="Payment Status">
                                <select name="payment_status" value={formData.payment_status} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md">
                                    <option>Unpaid</option>
                                    <option>Paid</option>
                                </select>
                            </FormField>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="px-6 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-6 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500">Save Job</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const RepairJobPage = ({ socket, currentUser }) => {
    const [jobs, setJobs] = useState([]);
    const [totalJobs, setTotalJobs] = useState(0);
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [warningModal, setWarningModal] = useState({ isOpen: false, title: '', message: '' });

    const fetchData = useCallback(async (searchQuery) => {
        try {
            const [jobData, customerData, userData, serviceData] = await Promise.all([
                api.getRepairJobs(searchQuery),
                api.getCustomers(),
                api.getUsers(),
                api.getServices()
            ]);
            setJobs(jobData.jobs);
            setTotalJobs(jobData.total);
            setCustomers(customerData.customers);
            setUsers(userData.users);
            setServices(serviceData.services);
            setError(null);
        } catch (err) {
            setError('Failed to fetch repair job data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetchData('');
    }, [fetchData]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchData(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm, fetchData]);

    useEffect(() => {
        if (socket) {
            const handleUpdate = () => fetchData(searchTerm);
            socket.on('repair_jobs_updated', handleUpdate);
            socket.on('customers_updated', handleUpdate);
            socket.on('users_updated', handleUpdate);
            socket.on('services_updated', handleUpdate);
            return () => {
                socket.off('repair_jobs_updated', handleUpdate);
                socket.off('customers_updated', handleUpdate);
                socket.off('users_updated', handleUpdate);
                socket.off('services_updated', handleUpdate);
            };
        }
    }, [socket, searchTerm, fetchData]);

    const handleOpenModal = (job = null) => {
        if (job && job.user_id !== currentUser.id) {
            setWarningModal({
                isOpen: true,
                title: 'Permission Denied',
                message: 'You can only edit repair jobs that you have created.'
            });
            return;
        }
        setEditingJob(job);
        setIsModalOpen(true);
    };

    const handleSaveJob = async (jobData) => {
        try {
            if (editingJob) {
                await api.updateRepairJob(editingJob.job_id, jobData);
            } else {
                await api.addRepairJob(jobData);
            }
            setIsModalOpen(false);
            setEditingJob(null);
        } catch (err) {
            console.error("Failed to save repair job:", err);
        }
    };

    const handleDeleteJob = (job) => {
        if (job && job.user_id !== currentUser.id) {
            setWarningModal({
                isOpen: true,
                title: 'Permission Denied',
                message: 'You can only delete repair jobs that you have created.'
            });
            return;
        }
        setJobToDelete(job);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (jobToDelete) {
            try {
                await api.deleteRepairJob(jobToDelete.job_id);
            } catch (err) {
                console.error("Failed to delete repair job:", err);
            } finally {
                setIsDeleteModalOpen(false);
                setJobToDelete(null);
            }
        }
    };

    // Helper to format dates for display
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };
    
    // Helper to format currency
    const formatCurrency = (amount) => {
        const num = parseFloat(amount);
        return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
    };

    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-bold text-cyan-400">Repair Job Management</h1>
                        <button onClick={() => handleOpenModal()} className="px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500">
                            + Add Repair Job
                        </button>
                    </div>
                    <div className="max-w-lg">
                        <input
                            type="text"
                            placeholder="Search by item, customer, or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 bg-gray-700 rounded-md"
                        />
                    </div>
                </div>

                {isLoading && <p className="text-center">Loading jobs...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                
                {!isLoading && !error && (
                    <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Customer</th>
                                        <th className="px-4 py-3 text-left">Item</th>
                                        <th className="px-4 py-3 text-left">Services</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Date Due</th>
                                        <th className="px-4 py-3 text-left">Date Completed</th>
                                        <th className="px-4 py-3 text-right">Est. Cost</th>
                                        <th className="px-4 py-3 text-right">Final Cost</th>
                                        <th className="px-4 py-3 text-left">Payment</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {jobs.map(job => (
                                        <tr key={job.job_id}>
                                            <td className="px-4 py-4">{job.customer_name}</td>
                                            <td className="px-4 py-4">{job.item_name} ({job.item_brand})</td>
                                            <td className="px-4 py-4 text-gray-400">{job.services_list || 'N/A'}</td>
                                            <td className="px-4 py-4">{job.status}</td>
                                            <td className="px-4 py-4">{formatDateForDisplay(job.date_due)}</td>
                                            <td className="px-4 py-4">{formatDateForDisplay(job.date_completed)}</td>
                                            <td className="px-4 py-4 text-right">{formatCurrency(job.estimated_cost)}</td>
                                            <td className="px-4 py-4 text-right">{formatCurrency(job.final_cost)}</td>
                                            <td className="px-4 py-4">{job.payment_status}</td>
                                            <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                                                <button onClick={() => handleOpenModal(job)} className="text-cyan-400">Edit</button>
                                                <button onClick={() => handleDeleteJob(job)} className="text-red-500">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-gray-700 px-6 py-3 text-right text-sm font-medium text-gray-300">
                            Total Jobs: {totalJobs}
                        </div>
                    </div>
                )}
            </div>
            <RepairJobModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveJob} 
                job={editingJob}
                customers={customers}
                users={users}
                services={services}
            />
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the repair job for "${jobToDelete?.item_name}"? This action cannot be undone.`}
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

export default RepairJobPage;
