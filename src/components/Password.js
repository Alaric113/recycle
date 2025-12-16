import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Password = ({ onAuthenticated, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;

  // 修正：將檢查邏輯移到 useEffect 中
  useEffect(() => {
    if (localStorage.getItem('adminAuthenticated')) {
      onAuthenticated();
      setIsLoading(false);
    }
  }, [onAuthenticated]); // 依賴項中包含 onAuthenticated

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('adminAuthenticated', 'true');
      localStorage.setItem('adminAuthTime', Date.now().toString());
      
      if (onAuthenticated) {
        onAuthenticated();
      }
      
      setIsLoading(false);
    } else {
      setError('密碼錯誤，請重新輸入');
      setPassword('');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">管理員登入</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handlePasswordSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              請輸入管理員密碼：
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入密碼"
              required
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="mb-4 text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? '驗證中...' : '登入'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Password;
