// 🔼 檔案：eventNameModel.js
const CenteredModal = ({
  isOpen, onClose, title, onSubmit,
  inputValue, setInputValue,
  inputQValue, setInputQValue,
  desc, setDesc,
  isAnonymous, setIsAnonymous, // 新增：匿名模式 props
  showCancelButton = false,
  cancelText = '取消',
  submitText = '確認'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form onSubmit={e => { e.preventDefault(); onSubmit(); }}
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm space-y-4 transform transition-all">
        <h3 className="text-xl font-bold text-gray-800 text-center mb-4">{title}</h3>

        {/* 活動名稱 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            活動名稱 
          </label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                 placeholder="輸入活動名稱..."
                 value={inputValue}
                 onChange={e => setInputValue(e.target.value)} />
        </div>

        {/* 題目數量 */}
        {setInputQValue && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            題目數量  
          </label>
          <input type="number" min={1}
                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                 placeholder="題目數量"
                 value={inputQValue}
                 onChange={e => setInputQValue(e.target.value)} />
        </div>
        )}

        {/* 描述欄位 */}
        {setDesc && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            祝賀詞 / 描述  
          </label>
          <input type="text"
                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                 placeholder="ex: 父親節快樂"
                 value={desc}
                 onChange={e => setDesc(e.target.value)} />
        </div>
        )}

        {/* 匿名模式開關 */}
        {setIsAnonymous && (
          <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" name="toggle" id="toggle" 
                     className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-4 checked:border-green-400"
                     style={{ top: '2px', left: '2px', borderColor: isAnonymous ? '#4ade80' : '#d1d5db' }}
                     checked={isAnonymous}
                     onChange={e => setIsAnonymous(e.target.checked)}/>
              <label htmlFor="toggle" 
                     className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${isAnonymous ? 'bg-green-400' : 'bg-gray-300'}`}></label>
            </div>
            <label htmlFor="toggle" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
              啟用匿名模式 (免填個資)
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          {showCancelButton && (
            <button type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              {cancelText}
            </button>
          )}
          <button type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium">
            {submitText}
          </button>
        </div>
      </form>
    </div>
  );
};


export default CenteredModal;
