// NameModal.js
import React from 'react';

export default function CenteredModal({ isOpen, onClose, title, onSubmit, inputValue, setInputValue }) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/35 bg-opacity-50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault(); // Prevent default form submission
            onSubmit(e); // Pass the event object to the onSubmit handler
          }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-semibold mb-4">{title}</h2>
          <div className="mb-4">
            <input
              type="text"
              className="w-full p-2 rounded border-gray-300 border"
              placeholder="請輸入內容"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400 transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              確定
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
