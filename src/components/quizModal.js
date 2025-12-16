import React from 'react';
import { QUIZ_TYPES } from '../constants';
import Modal from './Modal'; // 你自訂的通用 Modal

const QuizModal = ({ 
  isOpen,
  title,
  handleSubmit,
  currentItem,
  setCurrentItem,
  isEditing,
  renderQuestionForm,
  handleCancelEdit
}) => {
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [modalMessage, setModalMessage] = React.useState('');
  const [confirmAction, setConfirmAction] = React.useState(null);

  if (!isOpen) return null;

  const onClickConfirmButton = () => {
    setConfirmAction(() => () => {
      handleSubmit(new Event('submit', { cancelable: true, bubbles: true }));
      setShowConfirmModal(false);
    });
    setModalMessage(isEditing ? '確認更新嗎？' : '確認新增嗎？');
    setShowConfirmModal(true);
  };

  return (
    <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-black text-center">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="mb-8">
          <select
            value={currentItem?.type}
            onChange={e => setCurrentItem(prev => ({
              ...prev,
              type: e.target.value,
              question: '',
              item: { type:'',emoji: '', name: '' },
              options: ['', ''],
              correctAnswer: ''
            }))}
            className="w-full p-2 border rounded mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={QUIZ_TYPES.BIN_CLASSIFICATION}>垃圾分類題</option>
            <option value={QUIZ_TYPES.MULTIPLE_CHOICE}>選擇題</option>
          </select>

          {renderQuestionForm()}

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="my-3 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-semibold"
            >
              取消
            </button>
            <button
              type="button"
              onClick={onClickConfirmButton}
              className="my-3 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold"
            >
              {isEditing ? '更新題目' : '新增題目'}
            </button>
          </div>
        </form>

        {/* 內嵌確認讓用戶二次驗證 */}
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
      </div>
    </div>
  );
};

export default QuizModal;
