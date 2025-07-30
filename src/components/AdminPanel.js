// --- File: src/components/AdminPanel.js ---
import React, { useState } from 'react';
import { collection, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { TRASH_TYPES } from '../constants';
import Modal from './Modal';

/**
 * 管理者介面組件，用於新增、編輯和刪除垃圾題目
 */
const AdminPanel = ({ items, onGoToGame, db, appId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState({ id: null, emoji: '', name: '', type: TRASH_TYPES ? TRASH_TYPES.PAPER : '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const itemsCollectionRef = collection(db, `artifacts/${appId}/public/data/recyclingGameItems`);

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
    setCurrentItem({ id: null, emoji: '',name: '', type: TRASH_TYPES.PAPER });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentItem.emoji.trim() || !currentItem.name.trim()) {
      setModalMessage('Emoji 圖示與物品名稱不能為空！');
      setShowAlertDialog(true);
      return;
    }

    try {
      if (isEditing) {
        await setDoc(doc(db, itemsCollectionRef.path, currentItem.id), {
          emoji: currentItem.emoji,
          name: currentItem.name,
          type: currentItem.type,
        }, { merge: true });
      } else {
        await addDoc(itemsCollectionRef, {
          emoji: currentItem.emoji,
          name: currentItem.name,
          type: currentItem.type,
        });
      }
    } catch (error) {
      console.error("儲存題目失敗:", error);
      setModalMessage(`儲存題目失敗: ${error.message}`);
      setShowAlertDialog(true);
    }
    handleCancelEdit();
  };

  return (
    <div className="p-4 sm:p-8 text-white w-full h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold drop-shadow-lg">管理題目</h1>
          <button onClick={onGoToGame} className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors shadow-md">返回遊戲</button>
        </div>

        <div className="bg-white/20 p-6 rounded-lg mb-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">{isEditing ? '編輯題目' : '新增題目'}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-auto">
              <label htmlFor="emoji" className="block mb-1 font-semibold">Emoji 圖示</label>
              <input type="text" id="emoji" name="emoji" value={currentItem.emoji} onChange={handleFormChange} className="w-full p-2 rounded bg-gray-800 text-white text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="例如：🥤" maxLength="2" />
            </div>
            <div className="w-full sm:w-auto">
              <label htmlFor="name" className="block mb-1 font-semibold">物品名稱</label>
              <input type="text" id="name" name="name" value={currentItem.name} onChange={handleFormChange} className="w-full p-2 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="例如：食物包裝紙" />
            </div>
            <div className="w-full sm:w-auto flex-grow">
              <label htmlFor="type" className="block mb-1 font-semibold">分類</label>
              <select id="type" name="type" value={currentItem.type} onChange={handleFormChange} className="w-full p-2 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.values(TRASH_TYPES).map(type => (<option key={type} value={type}>{type}</option>))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-6 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors shadow-md">{isEditing ? '更新' : '新增'}</button>
              {isEditing && <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-500 rounded hover:bg-gray-600 transition-colors shadow-md">取消</button>}
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 drop-shadow-lg">現有題目列表</h2>
          <div className="space-y-2">
            {items.length > 0 ? (
              items.map(item => (
                <div key={item.id} className="bg-white/10 p-3 rounded-lg flex justify-between items-center shadow-sm hover:bg-white/15 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{item.emoji}</span>
                    <span className="font-semibold text-lg">{item.name || '未命名'}</span>
                    <span className="font-semibold text-lg">{item.type}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(item)} className="px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600 transition-colors">編輯</button>
                    <button onClick={() => handleDeleteClick(item.id)} className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 transition-colors">刪除</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 text-lg p-8 bg-white/10 rounded-lg">
                目前沒有自訂題目，請新增。
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="確認操作" message={modalMessage} onConfirm={confirmAction} confirmText="確定" cancelText="取消" />
      <Modal isOpen={showAlertDialog} onClose={() => setShowAlertDialog(false)} title="提示" message={modalMessage} cancelText="了解" />
    </div>
  );
};

export default AdminPanel;
