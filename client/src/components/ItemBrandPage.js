import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

// --- Reusable Modal Component ---
const BrandModal = ({ isOpen, onClose, onSave, brand }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (brand) {
            setName(brand.name);
        } else {
            setName('');
        }
    }, [brand, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ name });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">{brand ? 'Edit Item Brand' : 'Add New Item Brand'}</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Brand Name"
                        className="w-full p-3 bg-gray-700 rounded-md"
                        required
                    />
                    <div className="flex justify-end space-x-4 mt-8">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ItemBrandPage = ({ socket }) => {
    const [brands, setBrands] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // State for the search term

    // Updated fetchBrands to accept a search query
    const fetchBrands = useCallback(async (searchQuery = '') => {
        try {
            setIsLoading(true);
            const response = await api.getItemBrands(searchQuery); // Pass search query to API
            setBrands(response.brands);
            setError(null);
        } catch (err) {
            setError('Failed to fetch item brands.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Effect for initial data load
    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);
    
    // Effect for handling real-time updates via socket
    useEffect(() => {
        if (socket) {
            const handleUpdate = () => fetchBrands(searchTerm);
            socket.on('brands_updated', handleUpdate);
            return () => socket.off('brands_updated', handleUpdate);
        }
    }, [socket, searchTerm, fetchBrands]);

    // Effect for debouncing the search input
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchBrands(searchTerm);
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, fetchBrands]);


    const handleOpenModal = (brand = null) => {
        setEditingBrand(brand);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBrand(null);
    };

    const handleSaveBrand = async (brandData) => {
        try {
            if (editingBrand) {
                await api.updateItemBrand(editingBrand.id, brandData);
            } else {
                await api.addItemBrand(brandData);
            }
            handleCloseModal();
        } catch (err) {
            console.error("Failed to save brand:", err);
        }
    };

    const handleDeleteBrand = async (brandId) => {
        if (window.confirm('Are you sure you want to delete this brand?')) {
            try {
                await api.deleteItemBrand(brandId);
            } catch (err) {
                console.error("Failed to delete brand:", err);
            }
        }
    };

    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-cyan-400">Item Brand Management</h1>
                    <button onClick={() => handleOpenModal()} className="px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500">
                        + Add Brand
                    </button>
                </div>

                {/* Added Search Input */}
                <div className="mb-8 max-w-lg">
                    <input
                        type="text"
                        placeholder="Search by brand name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 bg-slate-700 rounded-md text-white"
                    />
                </div>

                {isLoading && <p className="text-center">Loading brands...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}

                {!isLoading && !error && (
                    <div className="bg-slate-800 shadow-lg rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Brand Name</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {brands.map(brand => (
                                        <tr key={brand.id}>
                                            <td className="px-6 py-4">{brand.name}</td>
                                            <td className="px-6 py-4 text-right space-x-4">
                                                <button onClick={() => handleOpenModal(brand)} className="text-cyan-400 hover:text-cyan-300">Edit</button>
                                                <button onClick={() => handleDeleteBrand(brand.id)} className="text-red-500 hover:text-red-400">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            <BrandModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveBrand}
                brand={editingBrand}
            />
        </div>
    );
};

export default ItemBrandPage;
