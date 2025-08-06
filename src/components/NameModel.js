import React from "react";
import { SegmentGroup } from "@chakra-ui/react";

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
}) => {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black/30  bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 sm:w-128 max-w-lg mx-4">
        <h2 className="text-xl font-bold mb-4 text-center">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4 ">
          {/* 姓名輸入 */}
          <div className="flex flex-col md:flex-row gap-2 flex-1 justify-between ">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                姓名 *
              </label>
              <input
                id="name"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="請輸入您的姓名"
                required
              />
            </div>
            <div className="flex-shrink-0 mr-2 ">
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                性別 *
              </label>
              <div className="bg-gray-100 p-1 rounded-2xl flex justify-between">
              {genderOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGender(option.value)}
                  className={`py-2 px-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    gender === option.value
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800" 
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

            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        ? "bg-white text-blue-600 shadow-sm"
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
              } bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium`}
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
