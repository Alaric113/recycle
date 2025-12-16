// --- File: src/components/Modal.js ---
import React from 'react';

/**
 * 通用模態框組件，用於取代 alert 和 confirm
 */
const Modal = ({ isOpen, onClose, title, message, onConfirm, confirmText = '確認', cancelText = '取消' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-white text-center">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <p className="mb-6 text-lg">{message}</p>
        <div className="flex justify-center gap-4">
          {onConfirm && (
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className="px-6 py-2 bg-green-600 rounded-full hover:bg-green-700 transition-colors shadow-md"
            >
              {confirmText}
            </button>
          )}
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-full transition-colors shadow-md ${onConfirm ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;