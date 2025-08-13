import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

// --- Helper Components ---

const FormField = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const SearchableCombobox = ({ options, value, onChange, placeholder = "Select..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);
    const selectedOption = options.find(option => option.id === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredOptions = options.filter(option => option.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const handleSelect = (optionId) => {
        onChange(optionId);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm cursor-pointer">
                {selectedOption ? selectedOption.name : <span className="text-gray-400">{placeholder}</span>}
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-slate-700 rounded-md shadow-lg border border-slate-600">
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 bg-gray-600 focus:outline-none rounded-t-md" />
                    <ul className="max-h-60 overflow-y-auto">{filteredOptions.map(option => (<li key={option.id} onClick={() => handleSelect(option.id)} className="px-3 py-2 hover:bg-cyan-600 cursor-pointer">{option.name}</li>))}</ul>
                </div>
            )}
        </div>
    );
};


const AddRepairJobPage = ({ onNavigate, currentUser }) => {
    // --- State Management ---
    const [customers, setCustomers] = useState([]);
    const [services, setServices] = useState([]);
    const [users, setUsers] = useState([]);
    const [newOrder, setNewOrder] = useState({
        customer_id: '',
        dateIn: new Date().toISOString().split('T')[0],
        date_due: '',
        date_completed: '',
        assigned_to: '',
        payment_status: 'Unpaid',
        status: 'Received', // Added status
        items: [],
    });
    const [currentItem, setCurrentItem] = useState({
        itemName: '', // Changed from shoeBrand
        itemBrand: '', // Added itemBrand
        service_id: '',
        price: '',
        photoFile: null,
    });
    const [error, setError] = useState(null);

    const formatCurrency = (amount) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return '0 ៛';
        return `${num.toLocaleString()} ៛`;
    };

    // --- API Integration ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersResponse, servicesResponse, usersResponse] = await Promise.all([
                    api.getCustomers(),
                    api.getServices(),
                    api.getUsers()
                ]);
                setCustomers(customersResponse.customers);
                setServices(servicesResponse.services);
                setUsers(usersResponse.users);
                
                if (customersResponse.customers.length > 0) {
                    setNewOrder(prev => ({ ...prev, customer_id: customersResponse.customers[0].id }));
                }
                if (currentUser) {
                    setNewOrder(prev => ({ ...prev, assigned_to: currentUser.username }));
                } else if (usersResponse.users.length > 0) {
                    setNewOrder(prev => ({ ...prev, assigned_to: usersResponse.users[0].username }));
                }
                if (servicesResponse.services.length > 0) {
                    const firstService = servicesResponse.services[0];
                    setCurrentItem(prev => ({ ...prev, service_id: firstService.id, price: firstService.price || '0' }));
                }
            } catch (err) {
                setError('Failed to load necessary data.');
                console.error(err);
            }
        };
        fetchData();
    }, [currentUser]);

    // --- UI Event Handlers ---
    const handleNewOrderChange = (e) => setNewOrder({ ...newOrder, [e.target.name]: e.target.value });
    const handleCustomerChange = (customerId) => setNewOrder({ ...newOrder, customer_id: customerId });

    const handleCurrentItemChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'service_id') {
            const selectedService = services.find(s => s.id === parseInt(value));
            setCurrentItem({ ...currentItem, service_id: value, price: selectedService ? selectedService.price : '0' });
        } else if (name === 'photoFile') {
            setCurrentItem({ ...currentItem, photoFile: files[0] });
        } else {
            setCurrentItem({ ...currentItem, [name]: value });
        }
    };

    const handleAddItem = () => {
        if (!currentItem.itemName || !currentItem.price || !currentItem.service_id) {
            alert("Please provide an item name, price, and select a repair type.");
            return;
        }
        setNewOrder({ ...newOrder, items: [...newOrder.items, { ...currentItem, id: Date.now() }] });
        const firstService = services.length > 0 ? services[0] : null;
        setCurrentItem({ itemName: '', itemBrand: '', service_id: firstService ? firstService.id : '', price: firstService ? firstService.price : '', photoFile: null });
    };

    const handleRemoveItem = (itemId) => {
        setNewOrder({ ...newOrder, items: newOrder.items.filter(item => item.id !== itemId) });
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        if (!newOrder.customer_id || newOrder.items.length === 0) {
            alert("Please select a customer and add at least one item.");
            return;
        }
        
        try {
            const orderToSave = {
                ...newOrder,
                items: newOrder.items.map(item => {
                    const serviceInfo = services.find(s => s.id === parseInt(item.service_id));
                    return {
                        item_name: item.itemName,
                        item_brand: item.itemBrand,
                        item_notes: serviceInfo ? serviceInfo.name : 'N/A',
                        services: [{ service_id: item.service_id, price: item.price }]
                    };
                }),
            };
            
            await api.addRepairJob(orderToSave);
            onNavigate('repair_jobs');
        } catch (err) {
            setError('Failed to create order.');
            console.error("Failed to submit order:", err);
        }
    };

    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-cyan-400">Add New Repair Job</h1>
                    <button onClick={() => onNavigate('repair_jobs')} className="px-4 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500">
                        &larr; Back to List
                    </button>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
                    <form onSubmit={handleSubmitOrder} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField label="Customer"><SearchableCombobox options={customers} value={newOrder.customer_id} onChange={handleCustomerChange} placeholder="Select a customer"/></FormField>
                            <FormField label="Assigned To"><select name="assigned_to" value={newOrder.assigned_to} onChange={handleNewOrderChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md">{users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}</select></FormField>
                            <FormField label="Job Status"><select name="status" value={newOrder.status} onChange={handleNewOrderChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"><option>Received</option><option>In Progress</option><option>Completed</option><option>Closed</option></select></FormField>
                            <FormField label="Date In"><input type="date" name="dateIn" value={newOrder.dateIn} onChange={handleNewOrderChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" /></FormField>
                            <FormField label="Date Due"><input type="date" name="date_due" value={newOrder.date_due} onChange={handleNewOrderChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" /></FormField>
                            <FormField label="Payment Status"><select name="payment_status" value={newOrder.payment_status} onChange={handleNewOrderChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"><option>Unpaid</option><option>Paid</option></select></FormField>
                        </div>
                        
                        <fieldset className="border-t pt-4 mt-4 border-gray-700">
                            <legend className="text-lg font-semibold text-gray-200 mb-2">Repair Items</legend>
                            <div className="space-y-4 p-3 bg-slate-700/50 rounded-lg">
                                <FormField label="Item Name"><input type="text" name="itemName" placeholder="e.g., Nike Vapor 12" value={currentItem.itemName} onChange={handleCurrentItemChange} className="block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm" /></FormField>
                                <FormField label="Item Brand"><input type="text" name="itemBrand" placeholder="e.g., Nike" value={currentItem.itemBrand} onChange={handleCurrentItemChange} className="block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm" /></FormField>
                                <FormField label="Repair Type"><select name="service_id" value={currentItem.service_id} onChange={handleCurrentItemChange} className="block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm">{services.map(service => (<option key={service.id} value={service.id}>{service.name}</option>))}</select></FormField>
                                <FormField label="Price"><input type="number" name="price" placeholder="0 ៛" value={currentItem.price} onChange={handleCurrentItemChange} step="100" min="0" className="block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm" /></FormField>
                                <FormField label="Photo"><input type="file" name="photoFile" onChange={handleCurrentItemChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"/></FormField>
                                {currentItem.photoFile && (<img src={URL.createObjectURL(currentItem.photoFile)} alt="Preview" className="w-24 h-24 object-cover rounded-md mx-auto"/>)}
                                <button type="button" onClick={handleAddItem} className="w-full bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-500">Add Item to Order</button>
                            </div>
                        </fieldset>

                        {newOrder.items.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2 text-gray-200">Current Order Items:</h3>
                                <div className="space-y-2 border-t border-b border-gray-700 py-3">
                                    {newOrder.items.map(item => {
                                        const serviceInfo = services.find(s => s.id === parseInt(item.service_id));
                                        return (
                                            <div key={item.id} className="p-2 bg-slate-700 rounded-md flex justify-between items-center text-sm">
                                                <span>{item.itemName} ({item.itemBrand}) - {serviceInfo ? serviceInfo.name : 'N/A'}</span>
                                                <div className="flex items-center">
                                                    <span className="font-semibold mr-3">{formatCurrency(item.price)}</span>
                                                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-300">&times;</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-right font-bold text-xl text-white mt-2">
                                    Order Total: {formatCurrency(newOrder.items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0))}
                                </div>
                            </div>
                        )}

                        <button type="submit" className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 disabled:bg-gray-500">
                            Create Order
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddRepairJobPage;
