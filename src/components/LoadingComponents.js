// LoadingComponents.js - 載入組件庫
import React from 'react';

// 垃圾桶載入動畫組件
export const TrashCanLoader = ({ size = 'md', text = '載入中...' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* 垃圾桶動畫 */}
      <div className="relative">
        <div className={`${sizeClasses[size]} relative`}>
          {/* 垃圾桶主體 */}
          <div className="w-full h-4/5 bg-gradient-to-b from-green-500 to-green-600 rounded-b-lg border-2 border-green-700 animate-bounce">
            {/* 垃圾桶蓋子 */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4/5 h-3 bg-gradient-to-b from-green-400 to-green-500 rounded-full border border-green-600"></div>
            {/* 垃圾桶把手 */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-300 rounded-full"></div>
            {/* 垃圾桶上的回收符號 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold">
              ♻️
            </div>
          </div>
        </div>
        
        {/* 飄落的垃圾動畫 */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-pulse opacity-70 text-sm">🗑️</div>
        </div>
      </div>
      
      {/* 載入文字 */}
      <div className="text-center">
        <p className="text-white text-lg font-medium mb-2">{text}</p>
        <div className="flex space-x-1 justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );
};

// 回收符號載入動畫
export const RecycleLoader = ({ text = '正在處理...' }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* 旋轉的回收符號 */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-green-200 rounded-full animate-spin">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl animate-pulse">♻️</span>
          </div>
        </div>
        {/* 外圈光環 */}
        <div className="absolute inset-0 w-20 h-20 border-2 border-green-300 rounded-full animate-ping opacity-20"></div>
      </div>
      
      <div className="text-center">
        <p className="text-white text-xl font-semibold">{text}</p>
        <p className="text-green-200 text-sm mt-2">請稍候片刻</p>
      </div>
    </div>
  );
};

// 垃圾分類載入動畫
export const SortingLoader = ({ text = '準備題目中...' }) => {
  const trashItems = ['🍎', '📰', '🥤', '🔋'];
  
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* 垃圾分類動畫 */}
      <div className="relative w-32 h-20">
        {/* 垃圾桶們 */}
        <div className="flex justify-between absolute bottom-0 w-full">
          <div className="w-6 h-8 bg-blue-500 rounded-b-md border border-blue-600"></div>
          <div className="w-6 h-8 bg-green-500 rounded-b-md border border-green-600"></div>
          <div className="w-6 h-8 bg-yellow-500 rounded-b-md border border-yellow-600"></div>
          <div className="w-6 h-8 bg-red-500 rounded-b-md border border-red-600"></div>
        </div>
        
        {/* 飄落的垃圾 */}
        {trashItems.map((item, index) => (
          <div
            key={index}
            className="absolute text-sm animate-bounce"
            style={{
              left: `${index * 25 + 8}%`,
              top: '0px',
              animationDelay: `${index * 200}ms`,
              animationDuration: '1s'
            }}
          >
            {item}
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-white text-xl font-semibold">{text}</p>
        <div className="mt-3 w-48 bg-green-200 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
        </div>
      </div>
    </div>
  );
};

// 骨架屏載入 - 用於題目列表
export const SkeletonLoader = ({ rows = 4 }) => {
  return (
    <div className="space-y-4 p-6">
      <div className="animate-pulse">
        {/* 標題骨架 */}
        <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
        
        {/* 題目項目骨架 */}
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 w-16 bg-gray-300 rounded"></div>
                <div className="h-8 w-16 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 圓形進度載入器
export const CircularProgress = ({ progress = 0, text = '載入中...', size = 80 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* 背景圓圈 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="4"
            fill="transparent"
          />
          {/* 進度圓圈 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgb(34, 197, 94)"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        {/* 中心文字 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-sm">{Math.round(progress)}%</span>
        </div>
      </div>
      <p className="text-white text-lg font-medium">{text}</p>
    </div>
  );
};

// 脈衝載入動畫
export const PulseLoader = ({ text = '載入中...', color = 'green' }) => {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full ${colorClasses[color]} animate-pulse`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          ></div>
        ))}
      </div>
      <p className="text-white text-lg font-medium">{text}</p>
    </div>
  );
};

// 全屏載入覆蓋層
export const LoadingOverlay = ({ isVisible, children, className = '' }) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
        {children}
      </div>
    </div>
  );
};