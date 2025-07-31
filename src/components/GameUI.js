// --- File: src/components/GameUI.js ---
import React, { useState, useEffect } from 'react';
import { getEventNames } from '../hooks/eventFirestore';
import CenteredModal from './NameModel';
import { collection, doc, setDoc } from 'firebase/firestore';

/**
 * 分數顯示板組件
 */
export const Scoreboard = ({ score, eventName }) => (
  <div className="absolute top-4 left-4 right-4 flex justify-between text-white text-2xl font-bold z-20 p-2 bg-black/50 bg-opacity-30 rounded-lg">
    <div>{eventName}</div>
    <div>分數: {score}</div>
    
    
  </div>
);

/**
 * 開始畫面組件
 */
export const StartScreen = ({ onStart, onGoToAdmin, userId, db, setEventName,onGoToAdminE,isEventMode,detectedEventName }) => {
  const [eventNames, setEventNames] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [eventName, setEventNameState] = useState(''); // 新增 eventName 狀態

  useEffect(() => {
    const fetchEventNames = async () => {
      const names = await getEventNames(db);
      setEventNames(names);
    };
    fetchEventNames();
  }, [db]);

  const handleAddEvent = async () => {
    if (newEventName.trim() && !eventNames.includes(newEventName)) {
      try {
        const eventsCollectionRef = collection(db, 'events');
        await setDoc(doc(eventsCollectionRef, newEventName), {});
        setEventNames(prev => [...prev, newEventName]);
        setEventNameState(newEventName); // 更新 eventName 狀態
        setNewEventName('');
      } catch (error) {
        console.error('新增活動名稱失敗:', error);
      }
    }
    setIsModalOpen(false);
  };

  const handleStart = () => {
    if (!eventNames.includes(eventName) || !eventName.trim()) {
      setErrorMessage('請選擇或新增活動名稱！');
      return;
    }
    setErrorMessage('');
    console.log('開始遊戲，選擇的活動名稱:', eventName);
    setEventName(eventName);
    onStart();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">資源回收小遊戲</h1>
      <p className="text-xl md:text-2xl text-white mb-8 drop-shadow">回答資源回收相關問題！</p>
      
      <div className="flex items-center gap-2 mb-4">
        <select
          className="p-2 rounded border-gray-300"
          value={eventName} // 綁定 eventName 狀態
          onChange={(e) => setEventNameState(e.target.value)} // 更新 eventName 狀態
        >
          <option value="">選擇活動名稱</option>
          {eventNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {!isEventMode && (
          <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          新增
        </button>
        )}
        
      </div>

      {errorMessage && (
        <p className="text-red-400 mb-4 bg-black/30 p-3 rounded-xl">{errorMessage}</p>
      )}

      <CenteredModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新增活動名稱"
        onSubmit={handleAddEvent}
        inputValue={newEventName}
        setInputValue={setNewEventName}
      />

      <button
        onClick={handleStart}
        className="px-8 py-4 bg-green-500 text-white font-bold rounded-full text-3xl shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 mb-6 border-b-4 border-green-700 hover:border-green-600"
      >
        開始遊戲
      </button>
      {!isEventMode && (
        <div className="flex gap-4">
        <button
          onClick={onGoToAdmin}
          className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-full text-lg shadow-md hover:bg-gray-700 active:bg-gray-800 transition-all duration-200 border-b-2 border-gray-800 hover:border-gray-700"
        >
          管理題目
        </button>
        <button
          onClick={onGoToAdminE}
          className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-full text-lg shadow-md hover:bg-gray-700 active:bg-gray-800 transition-all duration-200 border-b-2 border-gray-800 hover:border-gray-700"
        >
          管理活動
        </button>
        </div>
      )}
      
      {userId && (
        <p className="text-sm text-gray-300 mt-4">
          您的使用者 ID: <span className="font-mono text-yellow-300 break-all">{userId}</span>
        </p>
      )}
    </div>
  );
};

/**
 * 回合結束畫面組件
 */
export const RoundCompleteScreen = ({ score, onRestart }) => (
  <div className="flex flex-col items-center justify-center h-full bg-black bg-opacity-50 text-center p-4">
    <h2 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">回答完成！</h2>
    <p className="text-3xl text-white mb-8 drop-shadow">答對 {score/10} /10題！</p>
    <button
      onClick={onRestart}
      className="px-8 py-4 bg-blue-500 text-white font-bold rounded-full text-3xl shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 border-b-4 border-blue-700 hover:border-blue-600"
    >
      回主畫面
    </button>
  </div>
);