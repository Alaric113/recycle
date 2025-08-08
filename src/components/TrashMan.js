import React, { useState, useEffect, useCallback, useRef } from 'react';

// TrashMan 的各種狀態和情緒
const TRASHMAN_STATES = {
  IDLE: 'idle',
  HAPPY: 'happy',
  EXCITED: 'excited',
  THINKING: 'thinking',
  SAD: 'sad',
  ANGRY: 'angry',
  LOADING: 'loading',
  CELEBRATING: 'celebrating',
  SLEEPING: 'sleeping'
};

// 語音台詞庫
const SPEECH_LIBRARY = {
  greeting: [
    "嗨！我是環保小助手！",
    "歡迎來到回收世界！",
    "讓我們一起保護地球吧！"
  ],
  correct: [
    "太棒了！回答正確！",
    "你真是環保達人！",
    "完美的分類！",
    "地球因你而更美好！"
  ],
  incorrect: [
    "別擔心，下次會更好的！",
    "學習是個過程呢！",
    "讓我來告訴你正確答案！",
    "沒關係，繼續加油！"
  ],
  encouragement: [
    "你做得很好！",
    "繼續保持這個節奏！",
    "我相信你可以的！",
    "每一個正確分類都很重要！"
  ],
  gameEnd: [
    "遊戲結束！你表現得真棒！",
    "感謝你為地球環保出一份力！",
    "希望你學到了很多環保知識！"
  ]
};

// SVG TrashMan 組件（基於您提供的圖片設計）
const SVGTrashMan = ({ state, size = 120, className = '' }) => {
  const getEyeStyle = () => {
    switch (state) {
      case TRASHMAN_STATES.HAPPY:
      case TRASHMAN_STATES.EXCITED:
        return { transform: 'scaleY(1)', cy: '45' }; // 笑眼
      case TRASHMAN_STATES.SAD:
        return { transform: 'scaleY(0.8)', cy: '50' }; // 難過眼
      case TRASHMAN_STATES.SLEEPING:
        return { transform: 'scaleX(1) scaleY(0.3)', cy: '48' }; // 閉眼
      default:
        return { cy: '48' }; // 正常眼睛
    }
  };

  const getMouthStyle = () => {
    switch (state) {
      case TRASHMAN_STATES.HAPPY:
      case TRASHMAN_STATES.CELEBRATING:
        return { d: 'M35 60 Q50 70 65 60', stroke: '#2d5016' }; // 微笑
      case TRASHMAN_STATES.EXCITED:
        return { d: 'M40 58 Q50 68 60 58', stroke: '#2d5016' }; // 開心
      case TRASHMAN_STATES.SAD:
        return { d: 'M35 65 Q50 55 65 65', stroke: '#2d5016' }; // 難過
      case TRASHMAN_STATES.THINKING:
        return { d: 'M40 62 L60 62', stroke: '#2d5016' }; // 一條線
      default:
        return { d: 'M40 62 Q50 65 60 62', stroke: '#2d5016' }; // 正常嘴巴
    }
  };

  const getArmAnimation = () => {
    if (state === TRASHMAN_STATES.CELEBRATING || state === TRASHMAN_STATES.EXCITED) {
      return 'wave 1s ease-in-out infinite';
    }
    return 'none';
  };

  return (
    <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 120" className="w-full h-full">
        <style>
          {`
            @keyframes wave {
              0%, 100% { transform: rotate(-10deg); }
              50% { transform: rotate(10deg); }
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
            .trashman-body {
              animation: ${state === TRASHMAN_STATES.EXCITED ? 'bounce 0.8s ease-in-out infinite' : 'none'};
            }
          `}
        </style>
        
        {/* 主體容器 */}
        <g className="trashman-body">
          {/* 腳 */}
          <ellipse cx="35" cy="110" rx="8" ry="5" fill="#22c55e" />
          <ellipse cx="65" cy="110" rx="8" ry="5" fill="#22c55e" />
          
          {/* 腿 */}
          <rect x="32" y="100" width="6" height="12" rx="3" fill="#16a34a" />
          <rect x="62" y="100" width="6" height="12" rx="3" fill="#16a34a" />
          
          {/* 主身體 */}
          <rect x="25" y="35" width="50" height="65" rx="8" fill="#22c55e" stroke="#16a34a" strokeWidth="2" />
          
          {/* 蓋子 */}
          <ellipse cx="50" cy="25" rx="28" ry="8" fill="#16a34a" />
          <rect x="22" y="20" width="56" height="10" rx="5" fill="#22c55e" stroke="#16a34a" strokeWidth="1.5" />
          
          {/* 把手 */}
          <rect x="47" y="15" width="6" height="8" rx="3" fill="#15803d" />
          
          {/* 眼睛 */}
          <ellipse cx="40" cy={getEyeStyle().cy} rx="4" ry="6" fill="#1f2937" style={getEyeStyle()} />
          <ellipse cx="60" cy={getEyeStyle().cy} rx="4" ry="6" fill="#1f2937" style={getEyeStyle()} />
          
          {/* 嘴巴 */}
          <path 
            d={getMouthStyle().d} 
            stroke={getMouthStyle().stroke} 
            strokeWidth="2.5" 
            fill="none" 
            strokeLinecap="round"
          />
          
          {/* 回收符號 */}
          <g transform="translate(50,80) scale(0.8)">
            <path d="M93.4704 122.2834l16.0392 9.1376-8.422-49.1385-46.5644 17.8125 17.3969 9.911-19.6419 35.9145c-3.2794 5.9957-4.8911 12.7154-4.661 19.4323.2169 6.3247 2.0531 12.5721 5.3106 18.0669 3.2575 5.4949 7.8576 10.1041 13.3029 13.3295 5.7828 3.4253 12.4518 5.2357 19.2857 5.2357h13.2044v-24.7984H85.5166c-6.7286 0-10.1139-4.4849-11.2571-6.4133-1.143-1.928-3.453-7.0497-.2242-12.9531l19.4351-35.5368z" 
                  stroke="#dcfce7" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <circle cx="0" cy="0" r="12" stroke="#dcfce7" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* 手臂 */}
          <g style={{ animation: getArmAnimation(), transformOrigin: '20px 60px' }}>
            <rect x="15" y="55" width="12" height="6" rx="3" fill="#16a34a" />
          </g>
          <g style={{ animation: getArmAnimation(), transformOrigin: '80px 60px' }}>
            <rect x="73" y="55" width="12" height="6" rx="3" fill="#16a34a" />
          </g>
        </g>
      </svg>
    </div>
  );
};

// 語音氣泡組件
const SpeechBubble = ({ text, isVisible, position = 'top' }) => {
  if (!isVisible) return null;

  return (
    <div className={`absolute z-10 px-4 py-2 bg-white rounded-lg shadow-lg border-2 border-green-300 max-w-sm
      ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} 
      left-1/2 transform -translate-x-1/2 animate-fadeIn`}>
      <div className="text-sm font-medium text-gray-800 text-center">{text}</div>
      <div className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent
        ${position === 'top' ? 'top-full border-t-4 border-t-white' : 'bottom-full border-b-4 border-b-white'}`}></div>
    </div>
  );
};

// 主要的互動 TrashMan 組件
export const InteractiveTrashMan = ({
  size = 120,
  initialState = TRASHMAN_STATES.IDLE,
  enableSpeech = true,
  enableClick = true,
  autoGreeting = false,
  onInteraction = null,
  className = ''
}) => {
  const [currentState, setCurrentState] = useState(initialState);
  const [speechText, setSpeechText] = useState('');
  const [showSpeech, setShowSpeech] = useState(false);
  const [isIdle, setIsIdle] = useState(true);
  const idleTimer = useRef(null);
  const speechTimer = useRef(null);

  // 自動打招呼
  useEffect(() => {
    if (autoGreeting) {
      setTimeout(() => {
        speak(getRandomSpeech('greeting'));
        setCurrentState(TRASHMAN_STATES.HAPPY);
      }, 1000);
    }
  }, [autoGreeting]);

  // 閒置檢測
  useEffect(() => {
    const resetIdleTimer = () => {
      clearTimeout(idleTimer.current);
      setIsIdle(false);
      idleTimer.current = setTimeout(() => {
        setIsIdle(true);
        if (Math.random() < 0.3) { // 30% 機率進入睡眠
          setCurrentState(TRASHMAN_STATES.SLEEPING);
        } else {
          setCurrentState(TRASHMAN_STATES.IDLE);
        }
      }, 10000); // 10秒後進入閒置
    };

    resetIdleTimer();
    return () => clearTimeout(idleTimer.current);
  }, [currentState]);

  // 獲取隨機語音
  const getRandomSpeech = (category) => {
    const speeches = SPEECH_LIBRARY[category] || SPEECH_LIBRARY.greeting;
    return speeches[Math.floor(Math.random() * speeches.length)];
  };

  // 語音功能
  const speak = useCallback((text, duration = 3000) => {
    if (!enableSpeech) return;
    
    setSpeechText(text);
    setShowSpeech(true);
    
    clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => {
      setShowSpeech(false);
    }, duration);
  }, [enableSpeech]);

  // 點擊互動
  const handleClick = useCallback(() => {
    if (!enableClick) return;

    // 如果正在睡覺，喚醒它
    if (currentState === TRASHMAN_STATES.SLEEPING) {
      setCurrentState(TRASHMAN_STATES.EXCITED);
      speak("你把我叫醒了！準備好玩遊戲了嗎？");
      return;
    }

    // 隨機互動
    const interactions = [
      () => {
        setCurrentState(TRASHMAN_STATES.HAPPY);
        speak(getRandomSpeech('encouragement'));
      },
      () => {
        setCurrentState(TRASHMAN_STATES.EXCITED);
        speak("點我做什麼？哈哈！");
      },
      () => {
        setCurrentState(TRASHMAN_STATES.THINKING);
        speak("嗯...讓我想想環保小知識...");
      }
    ];

    const randomInteraction = interactions[Math.floor(Math.random() * interactions.length)];
    randomInteraction();

    // 3秒後回到正常狀態
    setTimeout(() => {
      setCurrentState(TRASHMAN_STATES.IDLE);
    }, 3000);

    // 觸發回調
    if (onInteraction) {
      onInteraction(currentState);
    }
  }, [currentState, enableClick, onInteraction, speak, getRandomSpeech]);

  // 清理定時器
  useEffect(() => {
    return () => {
      clearTimeout(idleTimer.current);
      clearTimeout(speechTimer.current);
    };
  }, []);

  // 公開方法：外部控制狀態
  const setEmotion = useCallback((emotion, speech = null) => {
    setCurrentState(emotion);
    if (speech) {
      speak(speech);
    }
  }, [speak]);

  // 公開方法：慶祝動作
  const celebrate = useCallback((message = null) => {
    setCurrentState(TRASHMAN_STATES.CELEBRATING);
    speak(message || getRandomSpeech('correct'));
    
    setTimeout(() => {
      setCurrentState(TRASHMAN_STATES.IDLE);
    }, 3000);
  }, [speak, getRandomSpeech]);

  // 公開方法：表達難過
  const showSadness = useCallback((message = null) => {
    setCurrentState(TRASHMAN_STATES.SAD);
    speak(message || getRandomSpeech('incorrect'));
    
    setTimeout(() => {
      setCurrentState(TRASHMAN_STATES.IDLE);
    }, 3000);
  }, [speak, getRandomSpeech]);

  // 暴露方法供外部使用
  React.useImperativeHandle(React.createRef(), () => ({
    setEmotion,
    celebrate,
    showSadness,
    speak
  }));

  return (
    <div className={`relative inline-block ${className}`}>
      {/* 語音氣泡 */}
      <SpeechBubble 
        text={speechText} 
        isVisible={showSpeech} 
        position="top" 
      />
      
      {/* TrashMan 角色 */}
      <div 
        onClick={handleClick}
        className={`transform transition-all duration-300 ${
          enableClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        } ${isIdle ? 'animate-pulse' : ''}`}
        style={{
          filter: currentState === TRASHMAN_STATES.SLEEPING ? 'brightness(0.8)' : 'none'
        }}
      >
        <SVGTrashMan 
          state={currentState} 
          size={size} 
        />
      </div>
      
      {/* 狀態指示器（可選） */}
      {currentState === TRASHMAN_STATES.SLEEPING && (
        <div className="absolute top-0 right-0 text-xl animate-bounce">💤</div>
      )}
    </div>
  );
};

// 預設導出
export default InteractiveTrashMan;

// 工具函數和常數導出
export { TRASHMAN_STATES, SPEECH_LIBRARY };