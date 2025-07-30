// --- File: src/components/GameUI.js ---
import React from 'react';

/**
 * 分數顯示板組件
 */
export const Scoreboard = ({ score, itemsLeft }) => (
  <div className="absolute top-4 left-4 right-4 flex justify-between text-white text-2xl font-bold z-20 p-2 bg-black bg-opacity-30 rounded-lg">
    <div>分數: {score}</div>
    <div>剩餘物品: {itemsLeft}</div>
  </div>
);

/**
 * 開始畫面組件
 */
export const StartScreen = ({ onStart, onGoToAdmin, userId }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-4">
    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">資源回收小遊戲</h1>
    <p className="text-xl md:text-2xl text-white mb-8 drop-shadow">將平台上的垃圾拖到正確的回收桶進行分類！</p>
    <button
      onClick={onStart}
      className="px-8 py-4 bg-green-500 text-white font-bold rounded-full text-3xl shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 mb-6 border-b-4 border-green-700 hover:border-green-600"
    >
      開始遊戲
    </button>
    <button
      onClick={onGoToAdmin}
      className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-full text-lg shadow-md hover:bg-gray-700 active:bg-gray-800 transition-all duration-200 border-b-2 border-gray-800 hover:border-gray-700"
    >
      管理題目
    </button>
    {userId && (
      <p className="text-sm text-gray-300 mt-4">
        您的使用者 ID: <span className="font-mono text-yellow-300 break-all">{userId}</span>
      </p>
    )}
  </div>
);

/**
 * 回合結束畫面組件
 */
export const RoundCompleteScreen = ({ score, onRestart }) => (
  <div className="flex flex-col items-center justify-center h-full bg-black bg-opacity-50 text-center p-4">
    <h2 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">分類完成！</h2>
    <p className="text-3xl text-white mb-8 drop-shadow">總得分: {score}</p>
    <button
      onClick={onRestart}
      className="px-8 py-4 bg-blue-500 text-white font-bold rounded-full text-3xl shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 border-b-4 border-blue-700 hover:border-blue-600"
    >
      再玩一回合
    </button>
  </div>
);