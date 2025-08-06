// client/src/components/AlertModal.js
import React from 'react';

const AlertModal = ({ isOpen, message, onClose }) => {
    if (!isOpen) {
        return null;
    }

    return (
        // Modal Overlay
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            {/* Modal Content */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
                <h2 className="text-xl font-bold text-cyan-400 mb-4">Session Terminated</h2>
                <p className="text-gray-300 mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default AlertModal;