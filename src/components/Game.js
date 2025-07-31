import React, { useState, useEffect, useCallback } from 'react';
import { Scoreboard } from './GameUI';
import { shuffleArray } from '../utils';
import CenteredModal from './NameModel';
import { QUIZ_TYPES, ITEMS_PER_ROUND, DEFAULT_QUIZ_ITEMS, TRASH_TYPES, BIN_EMOJIS } from '../constants';

const BUTTONS_PER_ROW = 4;
const binTypes = Object.values(TRASH_TYPES);

function chunk(array, size) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

const Game = ({ onGameEnd, onGameCancel, allQuizItems,userId, eventName, playerName: initialPlayerName }) => {
  const [items, setItems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, message: '', color: '' });

  const [showNameModal, setShowNameModal] = useState(true);
  const [playerName, setPlayerName] = useState(initialPlayerName || '');
  const [inputName, setInputName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const source = (allQuizItems && allQuizItems.length > 0) ? allQuizItems : DEFAULT_QUIZ_ITEMS;
    setItems(shuffleArray([...source]).slice(0, ITEMS_PER_ROUND));
    setCurrentIdx(0);
    setScore(0);
  }, [allQuizItems]);

 // 修正遊戲結束的 useEffect
useEffect(() => {
  // 加入 gameStarted 檢查，確保遊戲真的開始了才結束
  if (gameStarted && items.length > 0 && currentIdx >= items.length) {
    const timeout = setTimeout(() => {
      onGameEnd(score, playerName,userId); // 確保傳遞玩家姓名
    }, feedback.show ? 1500 : 0);
    return () => clearTimeout(timeout);
  }
}, [currentIdx, items.length, score, onGameEnd, feedback.show, gameStarted, playerName]); // 加入 gameStarted 和 playerName 依賴


  const handleNameSubmit = () => {
    if (inputName.trim()) {
      setPlayerName(inputName.trim());
      setShowNameModal(false);
      setGameStarted(true);
    }
  };

  const handleNameCancel = () => {
    setShowNameModal(false);
    setInputName('');
    if (typeof onGameCancel === 'function') {
      onGameCancel(); // 使用父組件提供的取消處理
    }
  };

  const handleAnswer = useCallback(
    (selectedAnswer) => {
      if (currentIdx >= items.length) return;
      const curItem = items[currentIdx];
      const correct = selectedAnswer === curItem.correctAnswer;
      
      setFeedback({
        show: true,
        message: correct 
          ? '回答正確！+10分' 
          : `答錯了！正確答案是：${curItem.correctAnswer}`,
        color: correct ? 'bg-green-500' : 'bg-red-500',
      });
      
      if (correct) setScore(prev => prev + 10);
      
      setTimeout(() => {
        setFeedback({ show: false, message: '', color: '' });
        setCurrentIdx(idx => idx + 1);
      }, 1500);
    },
    [currentIdx, items]
  );

  // 如果還沒開始遊戲，顯示歡迎畫面
  if (!gameStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-blue-400 to-green-400">
        <div className="w-full max-w-sm bg-white/90 rounded-2xl shadow-xl p-6 backdrop-blur-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-800">
            準備開始測驗
          </h1>
          <div className="text-base sm:text-lg text-gray-600 mb-8 text-center">
            請輸入您的姓名開始遊戲
          </div>
        </div>
        <CenteredModal
          isOpen={showNameModal}
          onClose={handleNameCancel} // 不允許關閉，必須輸入姓名
          title="請輸入您的姓名"
          onSubmit={handleNameSubmit}
          inputValue={inputName}
          setInputValue={setInputName}
          showCancelButton={true} 
          cancelText='取消'
          submitText='開始遊戲'
        />
      </div>
    );
  }

  if (!items.length || currentIdx >= items.length) {
    return <div className="flex flex-col items-center mt-24">載入中...</div>;
  }

  const currentItem = items[currentIdx];

  // 渲染題目區域
  const renderQuestionArea = () => {
    return (
      <div className="bg-black/10 rounded-lg p-8 mb-8 w-full max-w-2xl">
       
        
        {/* 問題文字 */}
        <div className="text-2xl mb-6 text-center font-medium text-gray-800">
          {currentItem.question}
        </div>
        
        {/* 如果是垃圾分類題，顯示物品 */}
        {currentItem.type === QUIZ_TYPES.BIN_CLASSIFICATION && currentItem.item && (
          <div className="text-center">
            <span className="text-6xl">{currentItem.item.emoji}</span>
            <span className="block mt-4 text-2xl font-semibold text-gray-700">
              {currentItem.item.name}
            </span>
          </div>
        )}
      </div>
    );
  };

  // 渲染答案區域
  const renderAnswerArea = () => {
    return (
      <div className=" rounded-lg p-5 w-full max-w-2xl">
        
        {currentItem.type === QUIZ_TYPES.BIN_CLASSIFICATION ? (
          // 垃圾分類答案區 - 8個分類按鈕
          <div>
            {chunk(binTypes, BUTTONS_PER_ROW).map((row, i) => (
              <div key={i} className="flex justify-center mb-4">
                {row.map(type => (
                  <button
                    key={type}
                    className="flex-1 bg-white/30 hover:bg-blue-100 border-2 border-blue-300 rounded-lg px-4 py-3 mx-2 text-xl transition flex flex-col items-center disabled:opacity-50 shadow-sm"
                    disabled={feedback.show}
                    onClick={() => handleAnswer(type)}
                  >
                    <span className="text-2xl mb-1">{BIN_EMOJIS?.[type]}</span>
                    <span className="text-sm font-medium">{type}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          // 選擇題答案區 - 選項按鈕
          <div className="space-y-4">
            {currentItem.options?.map((option, index) => (
              <button
                key={index}
                className="w-full bg-white hover:bg-blue-100 border-2 border-blue-300 rounded-lg px-6 py-4 text-xl transition disabled:opacity-50 shadow-sm font-medium"
                disabled={feedback.show}
                onClick={() => handleAnswer(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-2 sm:p-4">
      
      <Scoreboard score={score} itemsLeft={items.length - currentIdx} eventName={eventName} />
      
      {/* 題目區域 */}
      <div className="flex-grow flex items-center justify-center p-4">
        
          {renderQuestionArea()}
        
      </div>
      {feedback.show && (
        <div className={`mt-8 p-4 rounded-lg text-white text-xl ${feedback.color} shadow-lg`}>
          {feedback.message}
        </div>
      )}
      
      {/* 答案區域 */}
      <div className="flex flex-wrap justify-center items-center p-2 bg-black/30 rounded-xl gap-2 sm:gap-4">
        {renderAnswerArea()}
      </div>
      

      {/* 回饋訊息 */}
      
    </div>
  );
};

export default Game;
