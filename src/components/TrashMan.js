import React, { useState, useEffect } from 'react';
import trashmanFrame0 from '../img/trashman/splash/trashman-splash-0.png';
import trashmanFrame1 from '../img/trashman/splash/trashman-splash-1.png';


export const InteractiveTrashMan = () => {
  const [currentFrame, setCurrentFrame] = useState(0);
  
  // 正確的圖片路徑設置
  const trashManRef = '../img/trashman/';
  const splashframe = [
    trashmanFrame0,
    trashmanFrame1,
  ];

  useEffect(() => {
    splashframe.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % splashframe.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [splashframe.length]); // 添加依賴項

  return (
    <div className=" flex flex-col items-center justify-center  bg-green-50">
      {/* 角色動畫容器 */}
      <div className="relative w-40 h-40">
        {splashframe.map((frame, index) => (
          <img
            key={index}
            src={frame}
            alt={`Trashman frame ${index}`}
            className={`
              absolute inset-0 w-full h-full object-contain object-center
              transition duration-100 ease-in-out 
              ${index === currentFrame 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-95'  // 輕微縮放增加動感
              }
            `}
            onError={(e) => {
              console.error(`Failed to load image: ${frame}`);
              e.target.style.display = 'none';
            }}
          />
        ))}
      </div>
      
      {/* 載入文字 */}
      <div className="mt-6 text-center">
        <p className="text-lg font-semibold text-green-700 mb-2">

          正在努力工作中...
        </p>
        
        
        {/* 載入點動畫 */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
};
