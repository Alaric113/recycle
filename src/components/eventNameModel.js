import React from 'react';

const CenteredModal = ({ 
  isOpen, 
  onClose, 
  title, 
  onSubmit, 
  inputValue, 
  setInputValue,
  inputQValue,
  setInputQValue,
  showCancelButton = false, // 新增：是否顯示取消按鈕
  cancelText = "取消",
  submitText = "確認"
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const handleCancel = () => {
    setInputValue(''); // 清空輸入值
    setInputQValue(''); // 清空題目數量輸入值
    onClose(); // 關閉 modal
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 ">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mx-4">
        <h3 className="text-xl font-semibold mb-6 text-center text-gray-800 sm:text-lg">
          {title}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6 text-center" >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="請輸入..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg sm:text-md"
              autoFocus
            />
            <label className="text-sm text-gray-600 mt-2 =">
              請輸入題目數量
            </label>
          
            <input
              type="number"
              value={inputQValue}
              onChange={(e) => setInputQValue(parseInt(e.target.value))}
              placeholder="請輸入..."
              className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg sm:text-md"
              
            />
          </div>

          <div className={`flex gap-3 ${showCancelButton ? 'justify-between' : 'justify-center'}`}>
            {/* 取消按鈕 - 只有在 showCancelButton 為 true 時顯示 */}
            {showCancelButton && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium "
              >
                {cancelText}
              </button>
            )}
            
            {/* 確認按鈕 */}
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className={`${showCancelButton ? 'flex-1' : 'px-8'} py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium`}
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CenteredModal;
