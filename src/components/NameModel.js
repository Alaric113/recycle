import React from "react";
import InteractiveTrashMan from "./TrashMan";


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
  submitText = "確認",
  mode
}) => {
  if (!isOpen) return null;
  console.log(mode)
  const handleSubmit = (e) => {
    e.preventDefault();
    // 驗證必填欄位
    if (!inputValue.trim()) {
      alert("請輸入姓名");
      return;
    }
    if (!gender) {
      alert("請選擇性別");
      return;
    }
    if (!age || age < 1 || age > 120) {
      alert("請輸入有效的年齡（1-120歲）");
      return;
    }
    onSubmit();
  };

  const ageRanges = [
    { value: 13, label: "18歲以下" },
    { value: 22, label: "19-25歲" },
    { value: 30, label: "26-35歲" },
    { value: 40, label: "36-45歲" },
    { value: 50, label: "46-55歲" },
    { value: 60, label: "56-64歲" },
    { value: 70, label: "65歲以上" },
  ];

  const genderOptions = [
    { value: "男性", label: "男性" },
    { value: "女性", label: "女性" },
    { value: "其他", label: "其他" },
  ];

  const handleCancel = () => {
    setInputValue("");
    setGender("");
    setAge("");
    onClose();
  };

  const name=['湯家郁','史泊仲','錢祺任','董友伽','許胤典','魏維廉','陶渝昇','郭益萱','管翔勻','袁彥挺','尹奕利','蘇議涵','巫得晉','潘羽岑','吳苙芳','鄧秭綺','高新媛','駱伯易','謝欣悅','施映晨','馬愛佳']

  const handleRandomName = () => {
    const randomName = name[Math.floor(Math.random() * name.length)];
    setInputValue(randomName);
  };

  

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      
      <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-3xl p-6 w-80 sm:w-128 max-w-lg mx-4">
        <h2 className="text-xl text-white font-bold mb-4 text-center">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4 ">
          {/* 姓名輸入 */}
          <div className="flex flex-col md:flex-row gap-2 flex-1 justify-between ">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-white mb-2"
                style={
                  {fontSize:'16px'}
                }
              >
                姓名 *
              </label>
              <input
                id="name"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full text-sm px-3 py-2 border bg-white border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="請輸入您的姓名"
                required
              />
              {mode === 'admin' &&(
                <button
                  type="button"
                  onClick={handleRandomName} 
                >🔁</button>
              )}
            </div>
            <div className="flex-shrink-0 mr-2 ">
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-white mb-2"
              >
                性別 *
              </label>
              <div className="bg-white p-1 rounded-2xl flex justify-between">
              {genderOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGender(option.value)}
                  className={`py-2 px-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    gender === option.value
                      ? "bg-white border text-blue-600 shadow-sm"
                      : "bg-white/30 text-gray-600 hover:text-gray-800" 
                  }`}
                >
                  {option.label}
                </button>
              ))}
              </div>
            </div>
            
          </div>
          <div className="flex flex-col w-full gap-2">
            {/* 性別選擇 */}
            

            {/* 年齡輸入 */}

            <label className="block text-sm font-medium text-white mb-2">
              年齡範圍
            </label>
            <div className="bg-gray-100 p-1 rounded-2xl">
              <div className="grid grid-cols-3 gap-1 md:flex">
                {ageRanges.map((range) => (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => setAge(range.value)}
                    className={`py-2 px-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      age === range.value
                        ? "bg-white border text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
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
              className={`${
                showCancelButton ? "flex-1" : "w-full"
              } bg-blue-600 text-white border border-white/20 py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium`}
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
