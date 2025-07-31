import React, { useState } from 'react';
import { collection, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { TRASH_TYPES, QUIZ_TYPES } from '../constants'; // 加入 QUIZ_TYPES 匯入
import Modal from './Modal';

/**
 * 管理者介面組件，用於新增、編輯和刪除測驗題目
 */
const AdminPanel = ({ items, onGoToGame, db, appId }) => {
  // 加入缺少的狀態變數
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    id: null,
    type: QUIZ_TYPES.BIN_CLASSIFICATION,
    question: '',
    item: { emoji: '', name: '' }, // for bin classification
    options: ['', ''], // for multiple choice
    correctAnswer: ''
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const itemsCollectionRef = collection(db, `artifacts/${appId}/public/data/quizItems`);

  // 加入缺少的處理函數
  const handleEditClick = (item) => {
    setIsEditing(true);
    setCurrentItem(item);
  };

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

  const handleCancelEdit = () => {
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 驗證表單
    if (!currentItem.question.trim()) {
      setModalMessage('問題不能為空！');
      setShowAlertDialog(true);
      return;
    }

    if (currentItem.type === QUIZ_TYPES.BIN_CLASSIFICATION) {
      if (!currentItem.item.emoji.trim() || !currentItem.item.name.trim()) {
        setModalMessage('物品emoji和名稱不能為空！');
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
        correctAnswer: currentItem.correctAnswer,
      };

      if (currentItem.type === QUIZ_TYPES.BIN_CLASSIFICATION) {
        itemData.item = currentItem.item;
      } else if (currentItem.type === QUIZ_TYPES.MULTIPLE_CHOICE) {
        itemData.options = currentItem.options.filter(opt => opt.trim());
      }

      if (isEditing) {
        await setDoc(doc(db, itemsCollectionRef.path, currentItem.id), itemData, { merge: true });
      } else {
        await addDoc(itemsCollectionRef, itemData);
      }
    } catch (error) {
      console.error("儲存題目失敗:", error);
      setModalMessage(`儲存題目失敗: ${error.message}`);
      setShowAlertDialog(true);
    }

    handleCancelEdit();
  };

  // 根據題型渲染不同的表單
  const renderQuestionForm = () => {
    switch (currentItem.type) {
      case QUIZ_TYPES.BIN_CLASSIFICATION:
        return (
          <>
            <input
              type="text"
              name="question"
              value={currentItem.question}
              onChange={handleFormChange}
              placeholder="問題 (例：這個物品該怎麼回收？)"
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="text"
              value={currentItem.item.emoji}
              onChange={(e) => setCurrentItem(prev => ({
                ...prev,
                item: { ...prev.item, emoji: e.target.value }
              }))}
              placeholder="物品emoji"
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="text"
              value={currentItem.item.name}
              onChange={(e) => setCurrentItem(prev => ({
                ...prev,
                item: { ...prev.item, name: e.target.value }
              }))}
              placeholder="物品名稱"
              className="w-full p-2 border rounded mb-2"
            />
            <select
              value={currentItem.correctAnswer}
              onChange={(e) => setCurrentItem(prev => ({
                ...prev,
                correctAnswer: e.target.value
              }))}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="">選擇正確分類</option>
              {Object.values(TRASH_TYPES).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </>
        );

      case QUIZ_TYPES.MULTIPLE_CHOICE:
        return (
          <>
            <input
              type="text"
              name="question"
              value={currentItem.question}
              onChange={handleFormChange}
              placeholder="問題"
              className="w-full p-2 border rounded mb-2"
            />
            {currentItem.options.map((option, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...currentItem.options];
                    newOptions[index] = e.target.value;
                    setCurrentItem(prev => ({ ...prev, options: newOptions }));
                  }}
                  placeholder={`選項 ${index + 1}`}
                  className="flex-1 p-2 border rounded mr-2"
                />
                {currentItem.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newOptions = currentItem.options.filter((_, i) => i !== index);
                      setCurrentItem(prev => ({ ...prev, options: newOptions }));
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded"
                  >
                    刪除
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCurrentItem(prev => ({
                ...prev,
                options: [...prev.options, '']
              }))}
              className="mb-2 px-4 py-2 bg-green-500 text-white rounded"
            >
              新增選項
            </button>
            <input
              type="text"
              value={currentItem.correctAnswer}
              onChange={(e) => setCurrentItem(prev => ({
                ...prev,
                correctAnswer: e.target.value
              }))}
              placeholder="正確答案"
              className="w-full p-2 border rounded mb-2"
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-6">測驗題目管理</h1>
        {/* 操作按鈕 */}
        
          <button
            onClick={onGoToGame}
            className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold"
          >
            返回
          </button>
        
      </div>

      {/* 新增/編輯表單 */}
      <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? '編輯題目' : '新增題目'}
        </h2>
        
        <select
          value={currentItem.type}
          onChange={(e) => setCurrentItem(prev => ({
            ...prev,
            type: e.target.value,
            question: '',
            item: { emoji: '', name: '' },
            options: ['', ''],
            correctAnswer: ''
          }))}
          className="w-full p-2 border rounded mb-2"
        >
          <option value={QUIZ_TYPES.BIN_CLASSIFICATION}>垃圾分類題</option>
          <option value={QUIZ_TYPES.MULTIPLE_CHOICE}>選擇題</option>
        </select>

        {renderQuestionForm()}

        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
            {isEditing ? '更新題目' : '新增題目'}
          </button>
          {isEditing && (
            <button 
              type="button" 
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              取消
            </button>
          )}
        </div>
      </form>

      {/* 題目列表 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">現有題目 ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-gray-500">目前沒有題目</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="p-4 bg-white/10 rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-medium">{item.question}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    [{item.type === QUIZ_TYPES.BIN_CLASSIFICATION ? '垃圾分類' : '選擇題'}]
                  </span>
                  {item.item && (
                    <span className="ml-2">
                      {item.item.emoji} {item.item.name}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="px-3 py-1 bg-yellow-500/70 text-white rounded text-sm"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDeleteClick(item.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      
      {/* Modal */}
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

      <Modal
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        title="提示"
        message={modalMessage}
        onConfirm={() => setShowAlertDialog(false)}
        cancelText=""
      />
    </div>
  );
};

export default AdminPanel;
