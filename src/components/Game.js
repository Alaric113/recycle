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

const Game = ({ onGameEnd, onGameCancel, allQuizItems,userId, eventName, playerName: initialPlayerName,db,questionNum,mode, isAnonymous}) => {
  const [items, setItems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, message: '', color: '' });
  
  // 如果是匿名模式，預設不顯示 Modal，且名字設為預設值
  const [showNameModal, setShowNameModal] = useState(!isAnonymous);
  const [playerName, setPlayerName] = useState(initialPlayerName || (isAnonymous ? '匿名挑戰者' : ''));
  const [inputName, setInputName] = useState('');
  const [gender, setGender] = useState(isAnonymous ? '保密' : '');
  const [age, setAge] = useState(isAnonymous ? '保密' : '');
  
  // 如果是匿名模式，遊戲直接開始
  const [gameStarted, setGameStarted] = useState(!!isAnonymous);
  
  const [answerRecords, setAnswerRecords] = useState([]); 
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
          mode = {mode}
        />
      </div>
    );
  }

  
  if (!items.length || currentIdx >= items.length) {
    
    return <div className="flex flex-col items-center mt-24 text-white text-xl font-bold animate-pulse">準備題目中...</div>;
  }

  const currentItem = items[currentIdx];
  

  // 渲染題目區域
  const renderQuestionArea = () => {
    //console.log(currentItem)
    return (
      <div className="flex flex-col w-full max-w-3xl mx-auto relative z-10">
        {/* 進度條容器 - 優化樣式 */}
        <div className="mb-4 bg-white/10 backdrop-blur-md rounded-full p-2 shadow-lg border border-white/20">
             <ProgressLine
                current={currentIdx + 1}
                total={items.length}
                progressStat={progressStat}
            />
        </div>

        {/* 題目卡片 */}
        <div className="bg-white/90 dark:bg-slate-800/90 rounded-3xl p-6 w-full backdrop-blur-xl border border-white/40 shadow-2xl flex flex-col items-center min-h-[250px] justify-center transition-all duration-300">
          
          {/* 問題文字 */}
          <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white text-center leading-tight mb-6 drop-shadow-sm">
            {currentItem.question}
          </div>
          
          {/* 如果是垃圾分類題，顯示物品 */}
          {currentItem.type === QUIZ_TYPES.BIN_CLASSIFICATION && currentItem.item && (
            <div className="text-center transform hover:scale-105 transition-transform duration-300">
              {currentItem.item.type === 'pic' ? (
                <div className="relative">
                    <div className="absolute -inset-4 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
                    <img
                        src={currentItem.item.emoji}
                        alt={currentItem.item.name}
                        className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto object-contain drop-shadow-xl"
                    />
                </div>
              ) : (
                <span className="text-7xl sm:text-8xl md:text-9xl mb-2 block filter drop-shadow-lg animate-bounce-slow">{currentItem.item.emoji}</span>
              )}
              <span className="block mt-4 text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-700 px-6 py-2 rounded-full shadow-inner">
                {currentItem.item.name}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染答案區域
  const renderAnswerArea = () => {
    return (
      <div className="w-full max-w-3xl mx-auto relative z-10 pb-safe">
        
        {currentItem.type === QUIZ_TYPES.BIN_CLASSIFICATION ? (
          // 垃圾分類答案區 - 8個分類按鈕
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-1 py-2">
            {binTypes.map(type => (
              <button
                key={type}
                className="group relative overflow-hidden bg-white/80 hover:bg-white backdrop-blur-md border-2 border-white/40 hover:border-blue-400 rounded-2xl p-2 transition-all duration-200 active:scale-95 hover:shadow-xl hover:-translate-y-1 flex flex-col items-center justify-center min-h-[90px] sm:min-h-[120px]"
                disabled={feedback.show}
                onClick={() => handleAnswer(type)}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity"/>
                <span className="text-3xl sm:text-4xl md:text-5xl mb-1 transform group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm">{BIN_EMOJIS?.[type]}</span>
                <span className="text-base sm:text-lg font-bold text-slate-700 group-hover:text-blue-600 leading-tight text-center">{type}</span>
              </button>
            ))}
          </div>

        ) : (
          // 選擇題答案區 - 選項按鈕
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-2 py-2">
            {currentItem.options?.map((option, index) => (
              <button
                key={index}
                className="group relative bg-white/90 hover:bg-blue-50 border-2 border-blue-200/60 hover:border-blue-400 rounded-2xl px-4 py-3 text-base sm:text-lg font-bold text-slate-700 hover:text-blue-700 transition-all duration-200 active:scale-98 shadow-sm hover:shadow-lg flex items-center justify-center text-center min-h-[70px] sm:min-h-[80px]"
                disabled={feedback.show}
                onClick={() => handleAnswer(option)}
              >
                <span className="relative z-10">{option}</span>
                {/* 裝飾用的小圓點 */}
                <div className="absolute right-3 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"/>
              </button>
            ))}
          </div>

        )}
      </div>
    );
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col overflow-hidden relative bg-transparent">
      {/* 頂部記分板區 */}
      <div className="flex-none pt-safe-top px-4 pt-4 z-20">
        <Scoreboard score={score} itemsLeft={items.length - currentIdx} eventName={eventName} />
      </div>
      
      {/* 中間：題目區 (彈性伸縮，置中) */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-y-auto scrollbar-hide">
          {renderQuestionArea()}
      </div>
      
      {/* 底部：答案區 (固定在底部，確保不被切掉) */}
      <div className="flex-none w-full bg-gradient-to-t from-black/20 to-transparent p-2 pb-safe-bottom">
        {renderAnswerArea()}
      </div>
      
      {/* 回饋訊息 - 改進版 */}
      {feedback.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className={`relative px-8 py-6 rounded-3xl shadow-2xl transform scale-100 animate-bounce-short flex flex-col items-center ${
            feedback.color.includes('green') ? 'bg-green-500' : 'bg-red-500'
          }`}>
            <div className="text-6xl mb-2">
                {feedback.color.includes('green') ? '🎉' : '😅'}
            </div>
            <div className="text-white text-2xl font-black tracking-wide text-center">
              {feedback.message}
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .pb-safe {
            padding-bottom: env(safe-area-inset-bottom);
        }
        .pt-safe-top {
            padding-top: env(safe-area-inset-top);
        }
        .pb-safe-bottom {
             padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
        @keyframes bounce-short {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        .animate-bounce-short {
            animation: bounce-short 0.3s ease-in-out;
        }
        .animate-bounce-slow {
            animation: bounce 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default Game;