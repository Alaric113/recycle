import React from 'react';

const CenteredModal = ({ 
  isOpen, 
  onClose, 
  title, 
  onSubmit, 
  inputValue, 
  setInputValue,
  gender,
  setGender,
  age,
  setAge,
  showCancelButton = false,
  cancelText = "取消", 
  submitText = "確認" 
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // 驗證必填欄位
    if (!inputValue.trim()) {
      alert('請輸入姓名');
      return;
    }
    if (!gender) {
      alert('請選擇性別');
      return;
    }
    if (!age || age < 1 || age > 120) {
      alert('請輸入有效的年齡（1-120歲）');
      return;
    }
    onSubmit();
  };

  const handleCancel = () => {
    setInputValue('');
    setGender('');
    setAge('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30  bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 sm:w-96 max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-center">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 姓名輸入 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              姓名 *
            </label>
            <input
              id="name"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="請輸入您的姓名"
              required
            />
          </div>
          <div className="flex flex-row w-full">
            {/* 性別選擇 */}
            <div className='flex-1 mr-2'> 
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                性別 *
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              >
                <option value="">請選擇性別</option>
                <option value="男性">男性</option>
                <option value="女性">女性</option>
                <option value="其他">其他</option>
                
              </select>
            </div>

            {/* 年齡輸入 */}
            <div className='flex-1'>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                年齡 *
              </label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="請輸入您的年齡"
                min="1"
                max="120"
                required
              />
            </div>
          </div>
          {/* 按鈕區域 */}
          <div className="flex gap-3 pt-4">
            {showCancelButton && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              type="submit"
              className={`${showCancelButton ? 'flex-1' : 'w-full'} bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium`}
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
