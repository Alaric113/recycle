import React, { useState, useEffect, useCallback } from 'react';
import { Scoreboard } from './GameUI';
import { shuffleArray } from '../utils';
import CenteredModal from './NameModel';
import { saveDetailedAnswer } from '../hooks/answerAnalytics';
import { QUIZ_TYPES, ITEMS_PER_ROUND, DEFAULT_QUIZ_ITEMS, TRASH_TYPES, BIN_EMOJIS } from '../constants';
import { useGetEventQNUM } from '../hooks/useEventValidator';
import {ProgressLine} from './progessLine';

const BUTTONS_PER_ROW = 4;
const binTypes = Object.values(TRASH_TYPES);

function chunk(array, size) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

const Game = ({ onGameEnd, onGameCancel, allQuizItems,userId, eventName, playerName: initialPlayerName,db,questionNum}) => {
  const [items, setItems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, message: '', color: '' });
  
  const [showNameModal, setShowNameModal] = useState(true);
  const [playerName, setPlayerName] = useState(initialPlayerName || '');
  const [inputName, setInputName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [answerRecords, setAnswerRecords] = useState([]); // 儲存詳細答題記錄
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [sessionId] = useState(userId + '_' + Date.now());
  const [answers, setAnswers] = useState([]);
  const [progressStat , setProgressStat] = useState([]);
 
  
  
  useEffect(() => {
    if (gameStarted && items.length > 0 && currentIdx < items.length) {
      setQuestionStartTime(Date.now());
    }
  }, [currentIdx, gameStarted]);


  useEffect(() => {
    const source = (allQuizItems && allQuizItems.length > 0) ? allQuizItems : DEFAULT_QUIZ_ITEMS;
    
    if(questionNum >0){
      
      setItems(shuffleArray([...source]).slice(0, questionNum));
    }
    
    
    setCurrentIdx(0);
    setScore(0);
  }, [allQuizItems,questionNum]);

  

 // 修正遊戲結束的 useEffect
useEffect(() => {
  // 加入 gameStarted 檢查，確保遊戲真的開始了才結束
  if (gameStarted && items.length > 0 && currentIdx >= items.length) {
    const timeout = setTimeout(() => {
      onGameEnd(score, playerName,userId,[gender,age],answers); // 確保傳遞玩家姓名
      console.log(playerName, '遊戲結束，分數:', score);
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
  async (selectedAnswer) => { // 加入 async
    if (currentIdx >= items.length) return;

    const curItem = items[currentIdx];
    const correct = selectedAnswer === curItem.correctAnswer;
    const responseTime = Date.now() - questionStartTime; // 新增
    console.log(curItem)
    setProgressStat(prev => {
      const newStat = [...prev]; 
      newStat[currentIdx] = correct; // 更新當前題目的狀態
      return newStat;
    });

    // 🆕 新增：創建答題記錄
    const answerRecord = {
      questionId: curItem.id || `q_${currentIdx}`,
      question: curItem.question,
      questionType: curItem.type,
      item: curItem.item || null, // 如果有物品，則包含
      userAnswer: selectedAnswer,
      correctAnswer: curItem.correctAnswer,
      isCorrect: correct,
      responseTime: responseTime,
      playerName: playerName,
      gender: gender,
      age: age,
      sessionId: sessionId
    };

    // 🆕 新增：儲存到 Firestore
    if (eventName && userId) {
      try {
        await saveDetailedAnswer(db, eventName, userId, answerRecord);
        
        setAnswers(prevAnswers => [...prevAnswers, answerRecord]);
        
        //console.log('答題記錄儲存成功');
      } catch (error) {
        console.error('儲存失敗:', error);
      }
    }



    // 原有的邏輯保持不變
    setFeedback({
      show: true,
      message: correct ? '回答正確！' : `答錯了！正確答案是：${curItem.correctAnswer}`,
      color: correct ? 'bg-green-500' : 'bg-red-500',
    });

    if (correct) setScore(prev => prev + 10);

    setTimeout(() => {
      setFeedback({ show: false, message: '', color: '' });
      setCurrentIdx(idx => idx + 1);
      
    }, 800);
  },
  [currentIdx, items, questionStartTime, db, eventName, userId, playerName, gender, age, sessionId] // 更新依賴項
);

  // 如果還沒開始遊戲，顯示歡迎畫面
  if (!gameStarted) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8  from-blue-400 to-green-400">
        
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
          gender={gender}
          setGender={setGender}
          age={age}
          setAge={setAge}
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
        <ProgressLine
            current={currentIdx + 1}
            total={items.length}
            progressStat={progressStat}
          />
       
        
        {/* 問題文字 */}
        <div className="text-2xl sm:text-4xl mb-6 text-center font-bold text-gray-800">
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
      <div className=" rounded-lg p-1 w-full max-w-2xl ">
        
        {currentItem.type === QUIZ_TYPES.BIN_CLASSIFICATION ? (
          // 垃圾分類答案區 - 8個分類按鈕
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 p-1">
            {binTypes.map(type => (
              <button
                key={type}
                className="bg-white/30 hover:bg-blue-100 border-2 border-blue-300 rounded-lg p-1 text-xl transition flex flex-col items-center justify-center disabled:opacity-50 shadow-sm min-h-[80px] sm:min-h-[100px] md:min-h-[120px]"
                disabled={feedback.show}
                onClick={() => handleAnswer(type)}
              >
                <span className="text-3xl sm:text-4xl md:text-5xl mb-1">{BIN_EMOJIS?.[type]}</span>
                <span className="text-base  font-bold text-center leading-tight">{type}</span>
              </button>
            ))}
          </div>

        ) : (
          // 選擇題答案區 - 選項按鈕
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 h-full p-2">
            {currentItem.options?.map((option, index) => (
              <button
                key={index}
                className="bg-white hover:bg-blue-100 border-2 border-blue-300 rounded-lg px-3 py-3 sm:py-4 md:py-5 text-base sm:text-lg md:text-xl transition disabled:opacity-50 shadow-sm font-medium hover:shadow-md transform hover:scale-105 min-h-[60px] sm:min-h-[70px] flex items-center justify-center text-center"
                disabled={feedback.show}
                onClick={() => handleAnswer(option)}
              >
                <span className="leading-tight">{option}</span>
              </button>
            ))}
          </div>

        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-2 sm:p-4">
      
      <div className="flex-shrink-0 mb-6" >
        <Scoreboard score={score} itemsLeft={items.length - currentIdx} eventName={eventName} />

      </div>
      
      {/* 題目區域 */}
      <div className="flex-shrink-0 flex  items-center justify-center p-4 mt-9">
          
          {renderQuestionArea()}
        
      </div>
      
      
      {/* 答案區域 */}
      <div className="flex flex-wrap  justify-center items-center p-2 bg-black/30 rounded-xl gap-2 sm:gap-2 mb-10 md:mb-1">
        {renderAnswerArea()}
      </div>
      

      {/* 回饋訊息 */}
      {feedback.show && (
        <div className={`fixed inset-0 flex items-center justify-center`}>
        <div className={`  p-4 rounded-lg text-white text-xl ${feedback.color} shadow-lg `}>
          {feedback.message}
        </div>
        </div>
      )}
    </div>
    
  );
};

export default Game;
