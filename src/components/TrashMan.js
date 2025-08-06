import React, { useState, useEffect, useRef, useCallback } from 'react';
import trashManImg from '../img/trashman.png';

const InteractiveTrashMan = ({
  initialPosition = { x: 85, y: 20 },
  draggable = true,
  size = { width: 80, height: 80 },
  isStartScreen = false,
  gameProgress = {},
  onClick,
  onPositionChange,
  onAnimationComplete,
  customDialogues = {}
}) => {
  // === 狀態管理 ===
  const [position, setPosition] = useState(initialPosition);
  const [mood, setMood] = useState('idle');
  const [animation, setAnimation] = useState('stand');
  const [dialogState, setDialogState] = useState({
    visible: false,
    text: '',
    type: 'normal'
  });
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showClickEffect, setShowClickEffect] = useState(false);

  const trashManRef = useRef(null);
  const animationTimeoutRef = useRef(null);

  // === 對話內容庫 ===
  const dialogues = {
    startScreen: [
      '你好！我是回收小幫手！',
      '準備開始環保之旅了嗎？',
      '讓我們一起保護地球！',
      '點擊我開始遊戲吧！'
    ],
    correct: [
      '太棒了！答對了！',
      '你真是回收達人！',
      '繼續保持！',
      '環保小英雄就是你！'
    ],
    incorrect: [
      '別氣餒，再想想看！',
      '提示：仔細觀察物品材質',
      '每個垃圾都有它的家',
      '讓我來幫助你！'
    ],
    thinking: [
      '仔細想想哦...',
      '這個物品該放哪裡呢？',
      '回收分類很重要！'
    ],
    ...customDialogues
  };

  // === 眼神追蹤 ===
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!trashManRef.current || isDragging) return;
      
      const rect = trashManRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const maxOffset = 8;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > 0) {
        const normalizedX = deltaX / distance;
        const normalizedY = deltaY / distance;
        
        setEyeOffset({
          x: normalizedX * Math.min(maxOffset, distance / 20),
          y: normalizedY * Math.min(maxOffset, distance / 20)
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDragging]);

  // === 拖拽功能 ===
  const handleDragStart = useCallback((e) => {
    if (!draggable) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  }, [draggable]);

  const handleDragEnd = useCallback((e) => {
    setIsDragging(false);
    
    const newPosition = {
      x: Math.min(Math.max((e.clientX / window.innerWidth) * 100, 5), 95),
      y: Math.min(Math.max((e.clientY / window.innerHeight) * 100, 5), 95)
    };
    
    setPosition(newPosition);
    
    if (onPositionChange) {
      onPositionChange(newPosition);
    }
  }, [onPositionChange]);

  // === 點擊互動 ===
  const handleClick = useCallback(() => {
    if (!isStartScreen) return;
    
    const randomDialogue = dialogues.startScreen[
      Math.floor(Math.random() * dialogues.startScreen.length)
    ];
    
    setAnimation('wave');
    setShowClickEffect(true);
    showDialog(randomDialogue, 'normal', 3000);
    
    // 重置點擊效果
    setTimeout(() => {
      setShowClickEffect(false);
      setAnimation('stand');
    }, 500);
    
    if (onClick) {
      onClick({ type: 'click', mood, animation });
    }
  }, [isStartScreen, onClick, mood, animation]);

  // === 動畫控制系統 ===
  const playAnimation = useCallback((newAnimation, duration = 2000) => {
    setAnimation(newAnimation);
    
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    animationTimeoutRef.current = setTimeout(() => {
      setAnimation('stand');
      if (onAnimationComplete) {
        onAnimationComplete(newAnimation);
      }
    }, duration);
  }, [onAnimationComplete]);

  // === 對話框控制 ===
  const showDialog = useCallback((text, type = 'normal', duration = 3000) => {
    setDialogState({ visible: true, text, type });
    
    setTimeout(() => {
      setDialogState(prev => ({ ...prev, visible: false }));
    }, duration);
  }, []);

  // === 遊戲進度響應 ===
  useEffect(() => {
    if (!gameProgress) return;

    const { lastAnswerCorrect, showHint } = gameProgress;

    if (lastAnswerCorrect === true) {
      setMood('happy');
      playAnimation('celebrate', 1500);
      
      const randomCorrectMsg = dialogues.correct[
        Math.floor(Math.random() * dialogues.correct.length)
      ];
      showDialog(randomCorrectMsg, 'celebration', 2000);
      
    } else if (lastAnswerCorrect === false) {
      setMood('confused');
      playAnimation('think', 2000);
      
      if (showHint) {
        const randomHintMsg = dialogues.incorrect[
          Math.floor(Math.random() * dialogues.incorrect.length)
        ];
        showDialog(randomHintMsg, 'hint', 4000);
      }
      
    } else if (showHint) {
      setMood('thinking');
      playAnimation('think', 1500);
      
      const randomThinkMsg = dialogues.thinking[
        Math.floor(Math.random() * dialogues.thinking.length)
      ];
      showDialog(randomThinkMsg, 'normal', 3000);
    }
  }, [gameProgress, playAnimation, showDialog]);

  // === 清理函數 ===
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // === 動畫類別組合 ===
  const getAnimationClasses = () => {
    let classes = 'transition-all duration-300 ease-out';
    
    switch (animation) {
      case 'wave':
        classes += ' animate-pulse transform hover:rotate-3';
        break;
      case 'jump':
        classes += ' animate-bounce';
        break;
      case 'celebrate':
        classes += ' animate-spin';
        break;
      case 'think':
        classes += ' animate-pulse';
        break;
      case 'walk':
        classes += ' animate-bounce';
        break;
      default:
        classes += ' hover:scale-105';
    }

    if (showClickEffect) {
      classes += ' scale-110 animate-bounce';
    }

    if (isDragging) {
      classes += ' scale-110 rotate-2';
    }

    return classes;
  };

  const getMoodFilter = () => {
    switch (mood) {
      case 'happy':
        return 'brightness-110 saturate-125';
      case 'confused':
        return 'hue-rotate-30 saturate-75';
      case 'thinking':
        return 'brightness-90 contrast-110';
      case 'surprised':
        return 'brightness-125 saturate-150';
      default:
        return '';
    }
  };

  const getMoodEmoji = () => {
    switch (mood) {
      case 'happy': return '😊';
      case 'confused': return '🤔';
      case 'surprised': return '😮';
      case 'thinking': return '💭';
      default: return '';
    }
  };

  return (
    <div
      ref={trashManRef}
      className={`fixed pointer-events-auto select-none z-50 ${
        isDragging ? '' : 'transition-all duration-300 ease-out'
      }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : (isStartScreen ? 'pointer' : 'default')
      }}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      {/* TrashMan 主體 */}
      <div className={`relative ${getAnimationClasses()}`}>
        <img
          src={trashManImg}
          alt="Interactive TrashMan"
          className={`object-contain pointer-events-none drop-shadow-lg ${getMoodFilter()}`}
          style={{
            width: `${size.width}px`,
            height: `${size.height}px`
          }}
          draggable={false}
        />
        
        {/* 常駐眼球 */}
        <div className="absolute flex gap-2" style={{
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          {[0, 1].map((index) => (
            <div
              key={index}
              className="w-3 h-3 bg-white rounded-full border border-gray-300 relative overflow-hidden"
            >
              <div
                className="w-1.5 h-1.5 bg-black rounded-full absolute top-1/2 left-1/2 transition-transform duration-100 ease-out"
                style={{
                  transform: `translate(calc(-50% + ${eyeOffset.x}px), calc(-50% + ${eyeOffset.y}px))`
                }}
              />
            </div>
          ))}
        </div>

        {/* 心情表情符號 */}
        {mood !== 'idle' && (
          <div className={`absolute -top-2 -right-2 text-base transition-opacity duration-300 ${
            mood === 'idle' ? 'opacity-0' : 'opacity-100 animate-pulse'
          }`}>
            {getMoodEmoji()}
          </div>
        )}

        {/* 點擊光環效果 */}
        {(showClickEffect || isDragging) && (
          <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping opacity-75" />
        )}
      </div>

      {/* 對話框 */}
      {dialogState.visible && (
        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 animate-fade-in-up ${
          dialogState.type === 'hint' 
            ? 'bg-gradient-to-br from-yellow-100 to-yellow-300 border-yellow-400 text-yellow-900'
            : dialogState.type === 'celebration'
            ? 'bg-gradient-to-br from-green-100 to-green-300 border-green-400 text-green-900'
            : 'bg-white border-gray-300 text-gray-700'
        } px-3 py-2 rounded-xl shadow-lg border-2 max-w-xs text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis`}>
          {dialogState.text}
          
          {/* 對話框箭頭 */}
          <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 ${
            dialogState.type === 'hint'
              ? 'border-l-4 border-r-4 border-t-4 border-transparent border-t-yellow-400'
              : dialogState.type === 'celebration'
              ? 'border-l-4 border-r-4 border-t-4 border-transparent border-t-green-400'
              : 'border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-300'
          }`} />
        </div>
      )}

      {/* 陰影 */}
      <div 
        className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black rounded-full transition-opacity duration-300 ${
          isDragging ? 'opacity-80' : 'opacity-40'
        }`}
        style={{
          width: `${size.width * 0.8}px`,
          height: '8px',
          filter: 'blur(3px)',
          transform: 'translateX(-50%) translateY(5px)'
        }}
      />
    </div>
  );
};

export default InteractiveTrashMan;
