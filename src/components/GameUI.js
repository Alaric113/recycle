// --- File: src/components/GameUI.js ---
import React, { useState, useEffect } from "react";
import { getEventNames } from "../hooks/eventFirestore";
import { ITEMS_PER_ROUND } from "../constants";
import trashMan from "../img/trashman/splash/trashman-splash-0.png";
import { InteractiveTrashMan } from "./TrashMan";

/**
 * 分數顯示板組件
 */
export const Scoreboard = ({ score, eventName }) => (
  <div className="flex justify-between text-white text-2xl font-bold z-20 p-2 bg-black/50 bg-opacity-30 rounded-lg">
    <div>{eventName}</div>
    <div>分數: {score}</div>
  </div>
);

/**
 * 開始畫面組件
 */
export const StartScreen = ({
  onStart,
  onGoToAdmin,
  userId,
  db,
  setEventName,
  onGoToAdminE,
  isEventMode,
  detectedEventName,
  eventExists,
  done,
  doCycle,
  onGoToAdminPage,
}) => {
  const [eventNames, setEventNames] = useState([]);
  const [touchCount, setTouchCount] = useState(0);
  const [showAdminBtn, setShowAdminBtn] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [eventName, setEventNameState] = useState(""); // 新增 eventName 狀態

  useEffect(() => {
    const fetchEventNames = async () => {
      const names = await getEventNames(db);
      setEventNames(names);
    };
    fetchEventNames();
  }, [db]);

  useEffect(() => {
    if (isEventMode && eventExists && detectedEventName) {
      setEventNameState(detectedEventName);
    }
  });

  const handleStart = () => {
    if (!eventNames.includes(eventName) || !eventName.trim()) {
      setErrorMessage("請選擇或新增活動名稱！");
      setTimeout(() => {
        setErrorMessage("");
      }, 2000);
      return;
    }
    if (done && isEventMode !== "admin" && !doCycle) {
      setErrorMessage("您已經完成此活動！");
      setTimeout(() => {
        setErrorMessage("");
      }, 2000);
      return;
    }
    setErrorMessage("");
    console.log("開始遊戲，選擇的活動名稱:", eventName);
    setEventName(eventName);
    onStart();
  };

  const handleBadgeClick = () => {
    setTouchCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setShowAdminBtn(true); // 連點到 5，顯示按鈕
      }
      return next;
    });
  };
  useEffect(() => {
    if (touchCount === 0 || showAdminBtn) return;

    const timer = setTimeout(() => setTouchCount(0), 3_000); // 3 s 內沒繼續點就重置
    return () => clearTimeout(timer);
  }, [touchCount, showAdminBtn]);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 select-none">
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
        資源回收小遊戲
      </h1>
      <p className="text-xl md:text-2xl text-white mb-8 drop-shadow">
        回答資源回收相關問題！
      </p>

      <img src={trashMan} className="w-32 h-32 md:w-48 md:h-48 mb-6 " />

      {isEventMode == "admin" && (
        <div className="flex items-center gap-2 mb-4">
          <select
            className="p-2 rounded border-gray-300"
            value={eventName} // 綁定 eventName 狀態
            onChange={(e) => setEventNameState(e.target.value)} // 更新 eventName 狀態
          >
            <option value="">選擇活動名稱</option>
            {eventNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}
      {isEventMode == "event" && eventExists && detectedEventName && (
        <div
          className="mb-6 p-4 bg-green-600/70 rounded-lg border-2 border-green-300"
          onClick={handleBadgeClick}
        >
          <p className="text-xl font-bold select-none">{detectedEventName}</p>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-20">
          <p className="text-red-400 mb-4 bg-black/70 p-3 rounded-xl z-100">
            {errorMessage}
          </p>
        </div>
      )}
      {isEventMode == "none" && (
        <div
          className="mb-6 p-4 bg-red-600/70 rounded-lg border-2 border-red-300 "
          onClick={handleBadgeClick}
        >
          <p className="text-xl font-bold select-none">沒有此活動</p>
          <p className="text-xl font-bold select-text">{detectedEventName}</p>
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={isEventMode === "none"}
        className={` px-8 py-4 text-white font-bold rounded-full text-3xl shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 mb-6 border-b-4
    ${
      isEventMode === "none"
        ? "bg-gray-500 border-gray-700 hover:border-gray-600"
        : "bg-green-500 border-green-700 hover:border-green-600"
    }
  `}
      >
        開始遊戲
      </button>
      {isEventMode === "admin" && (
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

      {isEventMode !== "admin" && showAdminBtn && (
        <button
          onClick={onGoToAdminPage}
          className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-full text-lg shadow-md hover:bg-gray-700 active:bg-gray-800 transition-all duration-200 border-b-2 border-gray-800 hover:border-gray-700"
        >
          進入管理
        </button>
      )}

      {userId && (
        <p className="text-sm text-gray-300 mt-4">
          您的使用者 ID:{" "}
          <span className="font-mono text-yellow-300 break-all">{userId}</span>
        </p>
      )}
    </div>
  );
};

/**
 * 回合結束畫面組件
 */
export const RoundCompleteScreen = ({
  score,
  onRestart,
  questionNum,
  playerName,
  answers,
}) => {
  const [selectIdx, setSelectIdx] = useState(0);

  const handleSelectChange = (e) => {
    setSelectIdx(e);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-opacity-50 text-center p-4">
      <h2 className="text-5xl  font-bold text-white mb-4 drop-shadow-lg">
        恭喜 {playerName}！
      </h2>
      <h2 className="text-5xl  font-bold text-white mb-4 drop-shadow-lg">
        回答完成！
      </h2>
      <p className="text-3xl text-white mb-8 drop-shadow">
        答對 {score / 10} / {questionNum} 題
      </p>
      <div className="flex flex-row items-center mb-4 ">
        {answers.map((answer, index) => (
          <div
            key={index}
            onClick={() => handleSelectChange(index)}
            className={`rounded-lg w-16 h-16  hover:bg-white/50 transition-colors flex flex-col items-center justify-center cursor-pointer shadow-sm m-1 ${
              answer.isCorrect
                ? "bg-green-700/10  border-1"
                : "bg-red-400/80"
            } ${index === selectIdx ? 'border-blue-500':'border-white/80'}`}
          >
            <p className="text-xl">{index + 1}</p>
            <p>{answer.isCorrect ? "✓" : "✗"}</p>
          </div>
        ))}
      </div>
      {answers[selectIdx] && (
        <div className="rounded-lg bg-white/20 p-4 mb-4 shadow-lg flex flex-col border-white/80 border-1">
          <p className="text-xl mb-2">{answers[selectIdx].question}</p>
          <div className="text-center">
            {/* 物品顯示區域 - 支援圖片和 emoji */}
            <div className="flex flex-col items-center mb-4">
              {answers[selectIdx].item && (
                <>
                  {/* 圖片或 emoji 顯示 */}
                  <div className="">
                    {answers[selectIdx].item.emoji &&
                    answers[selectIdx].item.emoji.startsWith("data:image") ? (
                      // 顯示上傳的圖片
                      <img
                        src={answers[selectIdx].item.emoji}
                        alt={answers[selectIdx].item.name}
                        className="w-24 h-24 md:w-32 md:h-32 object-contain"
                      />
                    ) : (
                      // 顯示 emoji
                      <span className="text-6xl md:text-8xl">
                        {answers[selectIdx].item.emoji}
                      </span>
                    )}
                  </div>

                  {/* 物品資訊文字 */}
                  <p className="text-xl">
                    {` ${
                      answers[selectIdx].item.name || ""
                    }`}
                  </p>
                </>
              )}
            </div>
          </div>
          <span
            className={`rounded-lg border-white/80 border-1 ${
              answers[selectIdx].isCorrect ? "bg-green-400/80" : "bg-red-400/80"
            } p-2 mb-2`}
          >
            {answers[selectIdx].userAnswer}
          </span>
          <span
            className={`bg-green-400/40 p-2 mb-2 rounded-lg border-white/80 border-1 ${
              answers[selectIdx].isCorrect ? "hidden" : "block"
            }`}
          >
            {answers[selectIdx].correctAnswer}
          </span>
          <p>
            <span
              className={`font-bold ${
                answers[selectIdx].isCorrect ? "text-green-700" : "text-red-800"
              }`}
            >
              {answers[selectIdx].isCorrect ? " ✓ 正確" : " ✗ 錯誤"}
            </span>
          </p>
        </div>
      )}

      <div className="flex flex-row items-center gap-4 mb-8">
        <button
          onClick={onRestart}
          className="px-8 py-4 bg-blue-500 text-white font-bold rounded-full text-3xl shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 border-b-4 border-blue-700 hover:border-blue-600"
        >
          回主畫面
        </button>
      </div>
    </div>
  );
};
