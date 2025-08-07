import React, { useState } from "react";
import { collection, doc, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import { TRASH_TYPES, QUIZ_TYPES } from "../constants";
import Modal from "./Modal";
import QuizModal from "./quizModal";
import { type } from "@testing-library/user-event/dist/type";

const AdminPanel = ({ items, onBackToStart, db, appId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); // null 表示不打開表單 Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [picType, setPicType] = useState("emoji");
  const [uploadProgress, setUploadProgress] = useState(0);
  const itemsCollectionRef = collection(
    db,
    `artifacts/${appId}/public/data/quizItems`
  );

  // 點擊新增按鈕，開啟空白表單 Modal
  const handleAddClick = () => {
    setIsEditing(false);
    setCurrentItem({
      id: null,
      type: QUIZ_TYPES.BIN_CLASSIFICATION,
      question: "",
      item: { emoji: "", name: "", type: "" },
      options: ["", ""],
      correctAnswer: "",
    });
  };

  // 點擊編輯時，顯示該題目資料到 Modal
  const handleEditClick = (item) => {
    setIsEditing(true);
    setCurrentItem(item);
  };

  // 點擊刪除按鈕，彈出確認 Modal
  const handleDeleteClick = (id) => {
    setModalMessage("確定要刪除這個題目嗎？");
    setConfirmAction(() => async () => {
      try {
        await deleteDoc(doc(db, itemsCollectionRef.path, id));
      } catch (error) {
        console.error("刪除題目失敗:", error);
        setModalMessage(`刪除題目失敗: ${error.message}`);
        setShowAlertDialog(true);
      }
    });
    setShowConfirmModal(true);
  };

  // 用來取消編輯或新增，關閉 Modal 並重置 currentItem
  const handleCancelEdit = () => {
    setCurrentItem(null);
    setIsEditing(false);
  };

  // 表單中欄位變更處理
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (field, value) => {
    setCurrentItem((prev) => ({
      ...prev,
      item: { ...prev.item, [field]: value },
    }));
    console.log(currentItem);
  };

  const handlePicType = (type) => {
    setPicType(type);
    setCurrentItem((prev) => ({
      ...prev,
      item: {
        ...prev.item,
        type: type,
      },
    }));
    console.log(currentItem);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentItem.options];
    newOptions[index] = value;
    setCurrentItem((prev) => ({ ...prev, options: newOptions }));
  };

  const handleAddOption = () => {
    setCurrentItem((prev) => ({ ...prev, options: [...prev.options, ""] }));
  };

  const handleRemoveOption = (index) => {
    const newOptions = [...currentItem.options];
    newOptions.splice(index, 1);
    setCurrentItem((prev) => ({ ...prev, options: newOptions }));
  };

  // 表單送出（新增或編輯）
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(currentItem);

    if (!currentItem.question.trim()) {
      setModalMessage("問題不能為空！");
      setShowAlertDialog(true);
      return;
    }

    if (currentItem.type === QUIZ_TYPES.BIN_CLASSIFICATION) {
      if (!currentItem.item.emoji.trim() || !currentItem.item.name.trim()) {
        setModalMessage("物品 emoji 和名稱不能為空！");
        setShowAlertDialog(true);
        return;
      }
    } else if (currentItem.type === QUIZ_TYPES.MULTIPLE_CHOICE) {
      if (currentItem.options.filter((opt) => opt.trim()).length < 2) {
        setModalMessage("至少需要兩個選項！");
        setShowAlertDialog(true);
        return;
      }
    }

    if (!currentItem.correctAnswer.trim()) {
      setModalMessage("正確答案不能為空！");
      setShowAlertDialog(true);
      return;
    }

    try {
      const itemData = {
        type: currentItem.type,
        question: currentItem.question,
        correctAnswer: currentItem.correctAnswer,
      };

      if (currentItem.type === QUIZ_TYPES.BIN_CLASSIFICATION) {
        itemData.item = currentItem.item;
      } else if (currentItem.type === QUIZ_TYPES.MULTIPLE_CHOICE) {
        itemData.options = currentItem.options.filter((opt) => opt.trim());
      }

      if (isEditing && currentItem.id) {
        await setDoc(
          doc(db, itemsCollectionRef.path, currentItem.id),
          itemData,
          { merge: true }
        );
      } else {
        await addDoc(itemsCollectionRef, itemData);
      }

      handleCancelEdit(); // 關閉 Modal，重置狀態
    } catch (error) {
      console.error("儲存題目失敗:", error);
      setModalMessage(`儲存題目失敗: ${error.message}`);
      setShowAlertDialog(true);
    }
  };

  // 新增圖片壓縮函數
  const compressImage = (file, maxWidth = 300, maxHeight = 300, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 計算新尺寸
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // **重要：設定透明背景**
        ctx.clearRect(0, 0, width, height);
        
        // 繪製圖片
        ctx.drawImage(img, 0, 0, width, height);
        
        // **使用 PNG 格式保持透明度**
        const compressedDataUrl = canvas.toDataURL('image/png');
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };
  

  const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 檢查檔案類型
  if (!file.type.startsWith('image/')) {
    setModalMessage("請選擇圖片檔案！");
    setShowAlertDialog(true);
    return;
  }

  // 檢查原始檔案大小 (限制 5MB)
  if (file.size > 5 * 1024 * 1024) {
    setModalMessage("圖片檔案大小不能超過 5MB！");
    setShowAlertDialog(true);
    return;
  }

  setUploadProgress(10);
  
  try {
    // 壓縮圖片
    const compressedDataUrl = await compressImage(file, 200, 200, 0.6);
    
    // 檢查壓縮後的大小 (限制 100KB)
    const compressedSize = compressedDataUrl.length * 0.75; // base64 轉回位元組的概估
    if (compressedSize > 100 * 1024) {
      setModalMessage("圖片壓縮後仍然太大，請選擇更小的圖片！");
      setShowAlertDialog(true);
      setUploadProgress(0);
      return;
    }
    
    setUploadProgress(90);
    
    // 將壓縮後的 data URL 存到 emoji 欄位
    setCurrentItem(prev => ({
      ...prev,
      item: {
        ...prev.item,
        emoji: compressedDataUrl
      }
    }));
    
    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 500);
    
  } catch (error) {
    console.error('圖片壓縮失敗:', error);
    setModalMessage("圖片處理失敗，請重試！");
    setShowAlertDialog(true);
    setUploadProgress(0);
  }
};

  // 新增：清除圖片
  const clearUploadedImage = () => {
    setCurrentItem((prev) => ({
      ...prev,
      item: {
        ...prev.item,
        emoji: "",
      },
    }));
  };

  // 傳給 Modal 的表單內容
  const renderQuestionForm = () => {
    if (!currentItem) return null;

    console.log(picType);

    const typeOptions = [
      { value: "pic", label: "圖片" },
      { value: "emoji", label: "emoji" },
    ];

    switch (currentItem.type) {
      case QUIZ_TYPES.BIN_CLASSIFICATION:
        return (
          <>
            <label className="block font-semibold mb-1 text-left">問題</label>
            <input
              type="text"
              name="question"
              value={currentItem.question}
              onChange={handleFormChange}
              className="w-full p-2 border rounded mb-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="問題 (例：這個物品該怎麼回收？)"
              required
            />

            {/* 修改類型選擇器，讓它不要填滿整個寬度 */}
            <label className="block font-semibold mb-1 text-left">
              物品 Emoji
            </label>
            <div className="mb-1 flex flex-row gap-2 items-center">
              <div className="inline-flex bg-gray-100 p-1 rounded-2xl  flex-shrink-0">
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handlePicType(option.value)}
                    className={`py-2 px-4 text-sm font-medium rounded-xl transition-all duration-200 ${
                      picType === option.value
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {picType === "emoji" ? (
                <>
                  <input
                    type="text"
                    value={currentItem.item.emoji}
                    onChange={(e) => handleItemChange("emoji", e.target.value)}
                    className="w-full p-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="物品 Emoji (例：🍎)"
                    required
                  />
                </>
              ) : (
                <>
                  {/* 圖片上傳區域 */}
                  <div className="mb-1">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />

                      {/* 上傳進度條 */}
                      {uploadProgress > 0 && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    {/* 圖片預覽 */}
                  </div>
                </>
              )}
            </div>
            {currentItem.item.emoji &&
              currentItem.item.emoji.startsWith("data:image") && (
                <div className="mt-3 p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      圖片預覽：
                    </span>
                    <button
                      type="button"
                      onClick={clearUploadedImage}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      清除圖片
                    </button>
                  </div>
                  <img
                    src={currentItem.item.emoji}
                    alt="預覽圖片"
                    className="max-w-32 max-h-32 object-contain rounded border"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    檔案大小：
                    {Math.round((currentItem.item.emoji.length * 0.75) / 1024)}{" "}
                    KB
                  </p>
                </div>
              )}

            {/* 根據選擇的類型顯示不同的輸入欄位 */}

            <label className="block font-semibold mb-1 text-left">
              物品名稱
            </label>
            <input
              type="text"
              value={currentItem.item.name}
              onChange={(e) => handleItemChange("name", e.target.value)}
              className="w-full p-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="物品名稱"
              required
            />

            <label className="block font-semibold mb-1 text-left">
              正確分類
            </label>
            <select
              value={currentItem.correctAnswer}
              onChange={(e) =>
                setCurrentItem((prev) => ({
                  ...prev,
                  correctAnswer: e.target.value,
                }))
              }
              className="w-full p-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">請選擇</option>
              {Object.values(TRASH_TYPES).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </>
        );

      case QUIZ_TYPES.MULTIPLE_CHOICE:
        return (
          <>
            <label className="block font-semibold mb-1 text-left">問題</label>
            <input
              type="text"
              name="question"
              value={currentItem.question}
              onChange={handleFormChange}
              className="w-full p-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="問題"
              required
            />

            <label className="block font-semibold mb-1 text-left">選項</label>
            {currentItem.options.map((option, index) => (
              <div key={index} className="flex mb-3 items-center">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 p-2 border rounded mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`選項 ${index + 1}`}
                  required
                />
                {currentItem.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-all"
                    aria-label="刪除選項"
                  >
                    刪除
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddOption}
              className="mb-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all"
            >
              新增選項
            </button>

            <label className="block font-semibold mb-1 text-left">
              正確答案
            </label>
            <input
              type="text"
              value={currentItem.correctAnswer}
              onChange={(e) =>
                setCurrentItem((prev) => ({
                  ...prev,
                  correctAnswer: e.target.value,
                }))
              }
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="正確答案"
              required
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full min-h-screen bg-gray-50 p-4 sm:p-6 flex flex-col">
      <div className="h-full overflow-hidden flex-1 flex max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-3 sm:p-6">
        {/* 題目列表 */}
        <div flex-0>
          <div className="flex w-full justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold mb-4 text-gray-700">
              現有題目 ({items?.length || 0})
            </h2>

            {/* 新增題目按鈕 */}
            <div className="flex flex-col sm:flex-row">
              <button
                onClick={handleAddClick}
                className="mb-1 sm:mb-0 sm:mr-2 px-3 py-1 sm:px-6 sm:py-3 text-sm sm:text-lg bg-green-600 text-white rounded hover:bg-green-700 transition"
                aria-label="新增題目"
              >
                新增題目
              </button>
              <button
                onClick={onBackToStart}
                className=" px-3 py-1 sm:px-6 sm:py-3 text-sm sm:text-lg bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                aria-label="返回主畫面"
              >
                返回主畫面
              </button>
            </div>
          </div>
          {!items || items.length === 0 ? (
            <p className="text-gray-500">目前沒有題目</p>
          ) : (
            <div className="flex-1 h-full overflow-y-auto pb-20">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 mb-4 w-full rounded-lg border border-gray-300 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer bg-white"
                >
                  <div className="flex flex-col w-3/4">
                    <span className="font-medium text-gray-900">
                      {item.question}
                    </span>
                    <div>
                      {item.item && (
                        <span className="ml-2 text-gray-700 flex flex-row gap-1">
                          {item.item.type=== "pic" ? (
                            <img
                              src={item.item.emoji}
                              alt={item.item.name}
                              className="w-6 h-6 inline-block"
                            />
                          ) : (
                            <p>{item.item.emoji}</p>
                          )}
                          <p>{item.item.name}</p>
                        </span>
                      )}
                      <span className="ml-2 text-sm text-gray-500 italic">
                        [
                        {item.type === QUIZ_TYPES.BIN_CLASSIFICATION
                          ? "垃圾分類題"
                          : "選擇題"}
                        ]
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-1">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500 transition-colors text-sm font-semibold"
                      aria-label={`編輯問題：${item.question}`}
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="px-3 py-1 bg-red-500 rounded hover:bg-red-600 transition-colors text-sm font-semibold text-white"
                      aria-label={`刪除問題：${item.question}`}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 編輯/新增彈窗 */}
        <QuizModal
          isOpen={!!currentItem}
          title={isEditing ? "編輯題目" : "新增題目"}
          handleSubmit={handleSubmit}
          currentItem={currentItem}
          setCurrentItem={setCurrentItem}
          isEditing={isEditing}
          renderQuestionForm={renderQuestionForm}
          handleCancelEdit={handleCancelEdit}
        />

        {/* 確認刪除 Modal */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="確認操作"
          message={modalMessage}
          onConfirm={() => {
            confirmAction && confirmAction();
            setShowConfirmModal(false);
          }}
        />

        {/* 提示 Modal */}
        <Modal
          isOpen={showAlertDialog}
          onClose={() => setShowAlertDialog(false)}
          title="提示"
          message={modalMessage}
          onConfirm={() => setShowAlertDialog(false)}
          cancelText=""
        />
      </div>
    </div>
  );
};

export default AdminPanel;
