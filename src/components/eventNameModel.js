// 🔼 檔案：eventNameModel.js
const CenteredModal = ({
  isOpen, onClose, title, onSubmit,
  inputValue, setInputValue,
  inputQValue, setInputQValue,
  inputDesc, setInputDesc,             // ➜ 新增：描述
  showCancelButton = false,
  cancelText = '取消',
  submitText = '確認'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed  inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={e => { e.preventDefault(); onSubmit(); }}
            className="bg-white m-4 rounded-lg p-6 w-full max-w-sm space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>

        {/* 活動名稱 */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          活動名稱 
        </label>
        <input className="w-full border rounded px-2 py-1"
               placeholder="活動名稱"
               value={inputValue}
               onChange={e => setInputValue(e.target.value)} />

        {/* 題目數量 */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          題目數量  
        </label>
        {setInputQValue && (
          <input type="number" min={1}
                 className="w-full border rounded px-2 py-1"
                 placeholder="題目數量"
                 value={inputQValue}
                 onChange={e => setInputQValue(e.target.value)} />
        )}

        {/* 描述欄位（選用） */}
        

        <div className="flex justify-end gap-2 pt-2">
          {showCancelButton && (
            <button type="button"
                    onClick={onClose}
                    className="px-3 py-1 bg-gray-500 text-white rounded">
              {cancelText}
            </button>
          )}
          <button type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded">
            {submitText}
          </button>
        </div>
      </form>
    </div>
  );
};


export default CenteredModal;
