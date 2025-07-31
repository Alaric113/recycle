import React, { useState } from 'react';
import { collection, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { TRASH_TYPES, QUIZ_TYPES } from '../constants';
import Modal from './Modal';
import QuizModal from './quizModal';

const AdminPanel = ({ items, onBackToStart, db, appId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); // null 表示不打開表單 Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const itemsCollectionRef = collection(db, `artifacts/${appId}/public/data/quizItems`);

  // 點擊新增按鈕，開啟空白表單 Modal
  const handleAddClick = () => {
    setIsEditing(false);
    setCurrentItem({
      id: null,
      type: QUIZ_TYPES.BIN_CLASSIFICATION,
      question: '',
      item: { emoji: '', name: '' },
      options: ['', ''],
      correctAnswer: ''
    });
  };

  // 點擊編輯時，顯示該題目資料到 Modal
  const handleEditClick = (item) => {
    setIsEditing(true);
    setCurrentItem(item);
  };

  // 點擊刪除按鈕，彈出確認 Modal
  const handleDeleteClick = (id) => {
    setModalMessage('確定要刪除這個題目嗎？');
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
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (field, value) => {
    setCurrentItem(prev => ({
      ...prev,
      item: { ...prev.item, [field]: value }
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentItem.options];
    newOptions[index] = value;
    setCurrentItem(prev => ({ ...prev, options: newOptions }));
  };

  const handleAddOption = () => {
    setCurrentItem(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const handleRemoveOption = (index) => {
    const newOptions = [...currentItem.options];
    newOptions.splice(index, 1);
    setCurrentItem(prev => ({ ...prev, options: newOptions }));
  };

  // 表單送出（新增或編輯）
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentItem.question.trim()) {
      setModalMessage('問題不能為空！');
      setShowAlertDialog(true);
      return;
    }

    if (currentItem.type === QUIZ_TYPES.BIN_CLASSIFICATION) {
      if (!currentItem.item.emoji.trim() || !currentItem.item.name.trim()) {
        setModalMessage('物品 emoji 和名稱不能為空！');
        setShowAlertDialog(true);
        return;
      }
    } else if (currentItem.type === QUIZ_TYPES.MULTIPLE_CHOICE) {
      if (currentItem.options.filter(opt => opt.trim()).length < 2) {
        setModalMessage('至少需要兩個選項！');
        setShowAlertDialog(true);
        return;
      }
    }

    if (!currentItem.correctAnswer.trim()) {
      setModalMessage('正確答案不能為空！');
      setShowAlertDialog(true);
      return;
    }

    try {
      const itemData = {
        type: currentItem.type,
        question: currentItem.question,
        correctAnswer: currentItem.correctAnswer
      };

      if (currentItem.type === QUIZ_TYPES.BIN_CLASSIFICATION) {
        itemData.item = currentItem.item;
      } else if (currentItem.type === QUIZ_TYPES.MULTIPLE_CHOICE) {
        itemData.options = currentItem.options.filter(opt => opt.trim());
      }

      if (isEditing && currentItem.id) {
        await setDoc(doc(db, itemsCollectionRef.path, currentItem.id), itemData, { merge: true });
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

  // 傳給 Modal 的表單內容
  const renderQuestionForm = () => {
    if (!currentItem) return null;

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
              className="w-full p-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="問題 (例：這個物品該怎麼回收？)"
              required
            />

            <label className="block font-semibold mb-1 text-left">物品 Emoji</label>
            <input
              type="text"
              value={currentItem.item.emoji}
              onChange={e => handleItemChange('emoji', e.target.value)}
              className="w-full p-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="物品 Emoji"
              required
            />

            <label className="block font-semibold mb-1 text-left">物品名稱</label>
            <input
              type="text"
              value={currentItem.item.name}
              onChange={e => handleItemChange('name', e.target.value)}
              className="w-full p-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="物品名稱"
              required
            />

            <label className="block font-semibold mb-1 text-left">正確分類</label>
            <select
              value={currentItem.correctAnswer}
              onChange={e => setCurrentItem(prev => ({ ...prev, correctAnswer: e.target.value }))}
              className="w-full p-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">請選擇</option>
              {Object.values(TRASH_TYPES).map(type => (
                <option key={type} value={type}>{type}</option>
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
                  onChange={e => handleOptionChange(index, e.target.value)}
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

            <label className="block font-semibold mb-1 text-left">正確答案</label>
            <input
              type="text"
              value={currentItem.correctAnswer}
              onChange={e => setCurrentItem(prev => ({ ...prev, correctAnswer: e.target.value }))}
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">測驗題目管理</h1>

        {/* 新增題目按鈕 */}
        <div className="mb-6">
          
          <button
            onClick={handleAddClick}
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition"
            aria-label="新增題目"
          >
            新增題目
          </button>
          <button
            onClick={onBackToStart}
            className="ml-3 px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            aria-label="返回主畫面"
          >
            返回主畫面
          </button>
        </div>
    </div>
        {/* 題目列表 */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">現有題目 ({items?.length || 0})</h2>
          { (!items || items.length === 0) ? (
            <p className="text-gray-500">目前沒有題目</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {items.map(item => (
                <div
                  key={item.id}
                  className="p-4 mb-4 rounded-lg border border-gray-300 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer bg-white"
                >
                  <div>
                    <span className="font-medium text-gray-900">{item.question}</span>
                    <span className="ml-2 text-sm text-gray-500 italic">
                      [{item.type === QUIZ_TYPES.BIN_CLASSIFICATION ? '垃圾分類題' : '選擇題'}]
                    </span>
                    {item.item && (
                      <span className="ml-2 text-gray-700">
                        {item.item.emoji} {item.item.name}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
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
          title={isEditing ? '編輯題目' : '新增題目'}
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
