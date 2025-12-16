import React, { useState, useEffect, useCallback, useRef, forwardRef,useImperativeHandle } from "react";

// TrashMan 的各種狀態和情緒
const TRASHMAN_STATES = {
  IDLE: "idle",
  HAPPY: "happy",
  EXCITED: "excited",
  THINKING: "thinking",
  SAD: "sad",
  ANGRY: "angry",
  LOADING: "loading",
  CELEBRATING: "celebrating",
  SLEEPING: "sleeping",
};

// 語音台詞庫
const SPEECH_LIBRARY = {
  greeting: [
    "嗨！我是環保小助手！",
    "歡迎來到回收世界！",
    "讓我們一起保護地球吧！",
  ],
  correct: [
    "太棒了！回答正確！",
    "你真是環保達人！",
    "完美的分類！",
    "地球因你而更美好！",
  ],
  incorrect: [
    "別擔心，下次會更好的！",
    "學習是個過程呢！",
    "讓我來告訴你正確答案！",
    "沒關係，繼續加油！",
  ],
  encouragement: [
    "你做得很好！",
    "繼續保持這個節奏！",
    "我相信你可以的！",
    "每一個正確分類都很重要！",
  ],
  gameEnd: [
    "遊戲結束！你表現得真棒！",
    "感謝你為地球環保出一份力！",
    "希望你學到了很多環保知識！",
  ],
};

// SVG TrashMan 組件（基於您提供的圖片設計）
const SVGTrashMan = ({ state, size = 120, className = "" }) => {
  const getEyeStyle = () => {
    switch (state) {
      case TRASHMAN_STATES.HAPPY:
      case TRASHMAN_STATES.EXCITED:
        return { transform: "scaleY(1)", cy: "48" }; // 笑眼
      case TRASHMAN_STATES.SAD:
        return { transform: "scaleY(0.8)", cy: "60" }; // 難過眼
      case TRASHMAN_STATES.SLEEPING:
        return { transform: "scaleX(1) scaleY(0.2) ", cy: "250" }; // 閉眼
      default:
        return { cy: "48" }; // 正常眼睛
    }
  };

  const getMouthStyle = () => {
    switch (state) {
      case TRASHMAN_STATES.HAPPY:
      case TRASHMAN_STATES.CELEBRATING:
        return { d: "M35 60 Q50 70 65 60", stroke: "#2d5016" }; // 微笑
      case TRASHMAN_STATES.EXCITED:
        return { d: "M40 58 Q50 68 60 58", stroke: "#2d5016" }; // 開心
      case TRASHMAN_STATES.SAD:
        return { d: "M35 65 Q50 55 65 65", stroke: "#2d5016" }; // 難過
      case TRASHMAN_STATES.THINKING:
        return { d: "M40 62 L60 62", stroke: "#2d5016" }; // 一條線
      default:
        return { d: "M40 62 Q50 65 60 62", stroke: "#2d5016" }; // 正常嘴巴
    }
  };

  const getArmAnimation = () => {
    if (
      state === TRASHMAN_STATES.CELEBRATING ||
      state === TRASHMAN_STATES.EXCITED
    ) {
      return "wave 1s ease-in-out infinite";
    }
    return "none";
  };

  return (
    <div
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    >
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
              animation: ${
                state === TRASHMAN_STATES.EXCITED
                  ? "bounce 0.8s ease-in-out infinite"
                  : "none"
              };
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
          <rect
            x="25"
            y="35"
            width="50"
            height="65"
            rx="8"
            fill="#22c55e"
            stroke="#16a34a"
            strokeWidth="2"
          />

          {/* 蓋子 */}
          <ellipse cx="50" cy="25" rx="28" ry="8" fill="#16a34a" />
          <rect
            x="22"
            y="20"
            width="56"
            height="10"
            rx="5"
            fill="#22c55e"
            stroke="#16a34a"
            strokeWidth="1.5"
          />

          {/* 把手 */}
          <rect x="47" y="15" width="6" height="8" rx="3" fill="#15803d" />

          {/* 眼睛 */}
          <ellipse
            cx="40"
            cy={getEyeStyle().cy}
            rx="4"
            ry="6"
            fill="#1f2937"
            style={getEyeStyle()}
          />
          <ellipse
            cx="60"
            cy={getEyeStyle().cy}
            rx="4"
            ry="6"
            fill="#1f2937"
            style={getEyeStyle()}
          />

          {/* 嘴巴 */}
          <path
            d={getMouthStyle().d}
            stroke={getMouthStyle().stroke}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* 回收符號 */}
          <g transform="translate(50 80) scale(0.8 0.8)">
            <path
              strokeWidth="2.5"
              fill="#73E79E"
              strokeLinecap="round"
              d="M-6.9742 2.5697l2.5407 1.4473L-5.7678-3.7664l-7.3758 2.8215 2.7557 1.5699-3.1113 5.6889c-.5194.9496-.7747 2.0142-.7383 3.078.0343 1.0019.3252 1.9914.8412 2.8619.516.8703 1.2447 1.6005 2.1072 2.1114.9161.5426 1.9725.8292 3.0548.8292h2.0916v-3.9282H-8.2341c-1.0657 0-1.602-.7104-1.7831-1.016-.181-.3054-.5471-1.1168-.0354-2.0518L-6.9742 2.5697z"
            />
            <path
              strokeWidth="2.5"
              fill="#73E79E"
              strokeLinecap="round"
              d="M13.4991 6.314l-1.1474-2.0979-3.4463 1.8847 1.1474 2.0981c.5113.9349.1455 1.7461-.0354 2.0517-.181.3054-.7173 1.016-1.7831 1.016h-6.2322v-3.0249l-6.1028 5.0121 6.1028 5.0121v-3.0711h6.2322c1.0825 0 2.139-.2868 3.0549-.8295.8625-.5109 1.5912-1.2409 2.1072-2.1114.516-.8703.807-1.86.8412-2.8619C14.2738 8.3278 14.0186 7.2634 13.4991 6.314z"
            />
            <path
              strokeWidth="2.5"
              fill="#73E79E"
              strokeLinecap="round"
              d="M-1.8187-6.857c.5323-.9733 1.4494-1.0784 1.8189-1.0784 0 0 0 0 0 0 .3695 0 1.2865.1051 1.8187 1.0784l3.1945 5.841-2.7958 1.5926 7.3759 2.8215 1.334-7.7836-2.5006 1.4247-3.1617-5.7811c-.5395-.9864-1.3315-1.7957-2.2907-2.3404-.8998-.511-1.9283-.7812-2.9741-.7812 0 0-.0002 0-.0002 0-1.046 0-2.0743.2702-2.9743.7812-.9592.5447-1.7514 1.354-2.2909 2.3404l-1.2305 2.25 3.4463 1.8848L-1.8187-6.857z"
            />
          </g>

          {/* 手臂 */}
          <g
            style={{
              animation: getArmAnimation(),
              transformOrigin: "20px 60px",
            }}
          >
            <rect x="15" y="55" width="12" height="6" rx="3" fill="#16a34a" />
          </g>
          <g
            style={{
              animation: getArmAnimation(),
              transformOrigin: "80px 60px",
            }}
          >
            <rect x="73" y="55" width="12" height="6" rx="3" fill="#16a34a" />
          </g>
        </g>
      </svg>
    </div>
  );
};

// 語音氣泡組件
const SpeechBubble = ({ text, isVisible, position = "top" }) => {
  if (!isVisible) return null;

  return (
    <div
      className={`absolute z-10 px-4 py-2 bg-white rounded-lg shadow-lg border-2 border-green-300 max-h-xs
       flex w-full
      ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} 
      left-1/2 transform -translate-x-1/2 animate-fadeIn`}
    >
      <div className="text-sm font-medium text-gray-800 text-center w-full">
        {text}
      </div>
      <div
        className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent
        ${
          position === "top"
            ? "top-full border-t-4 border-t-white"
            : "bottom-full border-b-4 border-b-white"
        }`}
      ></div>
    </div>
  );
};

// 主要的互動 TrashMan 組件
export const InteractiveTrashMan = React.forwardRef(({
  size = 120,
  initialState = TRASHMAN_STATES.IDLE,
  enableSpeech = true,
  enableClick = true,
  autoGreeting = false,
  onInteraction = null,
  className = "",
},ref) => {
  const [currentState, setCurrentState] = useState(initialState);
  const [speechText, setSpeechText] = useState("");
  const [showSpeech, setShowSpeech] = useState(false);
  const [isIdle, setIsIdle] = useState(true);
  const idleTimer = useRef(null);
  const speechTimer = useRef(null);

  // 自動打招呼
  useEffect(() => {
    if (autoGreeting) {
      setTimeout(() => {
        speak(getRandomSpeech("greeting"));
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
        if (Math.random() < 0.4) {
          // 30% 機率進入睡眠
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
  const speak = useCallback(
    (text, duration = 3000) => {
      if (!enableSpeech) return;

      setSpeechText(text);
      setShowSpeech(true);

      clearTimeout(speechTimer.current);
      speechTimer.current = setTimeout(() => {
        setShowSpeech(false);
      }, duration);
    },
    [enableSpeech]
  );

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
        speak(getRandomSpeech("encouragement"));
      },
      () => {
        setCurrentState(TRASHMAN_STATES.EXCITED);
        speak("點我做什麼？哈哈！");
      },
      () => {
        setCurrentState(TRASHMAN_STATES.THINKING);
        speak("嗯...讓我想想環保小知識...");
      },
    ];

    const randomInteraction =
      interactions[Math.floor(Math.random() * interactions.length)];
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
  const setEmotion = useCallback(
    (emotion, speech = null) => {
      setCurrentState(emotion);
      if (speech) {
        speak(speech);
      }
    },
    [speak]
  );

  const sleeping = useCallback(() => {
    setCurrentState(TRASHMAN_STATES.SLEEPING);
  });

  // 公開方法：慶祝動作
  const celebrate = useCallback(
    (message) => {
      
      setCurrentState(TRASHMAN_STATES.CELEBRATING);
      speak(message || getRandomSpeech("correct"));

      setTimeout(() => {
        setCurrentState(TRASHMAN_STATES.IDLE);
      }, 3000);
    },
    [speak, getRandomSpeech]
  );

  // 公開方法：表達難過
  const showSadness = useCallback(
    (message = null) => {
      setCurrentState(TRASHMAN_STATES.SAD);
      speak(message || getRandomSpeech("incorrect"));

      setTimeout(() => {
        setCurrentState(TRASHMAN_STATES.IDLE);
      }, 3000);
    },
    [speak, getRandomSpeech]
  );

  // 暴露方法供外部使用
  
  useImperativeHandle(ref, () => ({
    setEmotion,
    celebrate,
    showSadness,
    speak,
    sleeping,
  }));

  return (
    <div className={`relative inline-block ${className}`}>
      {/* 語音氣泡 */}
      <SpeechBubble text={speechText} isVisible={showSpeech} position="top" />

      {/* TrashMan 角色 */}
      <div
        onClick={handleClick}
        className={`transform transition-all duration-300 ${
          enableClick ? "cursor-pointer hover:scale-105 active:scale-95" : ""
        } ${isIdle ? "animate-pulse" : ""}`}
        style={{
          filter:
            currentState === TRASHMAN_STATES.SLEEPING
              ? "brightness(0.8)"
              : "none",
        }}
      >
        <SVGTrashMan state={currentState} size={size} />
      </div>

      {/* 狀態指示器（可選） */}
      {currentState === TRASHMAN_STATES.SLEEPING && (
        <div className="absolute top-0 right-0 text-xl animate-bounce">💤</div>
      )}
    </div>
  );
});

// 預設導出
export default InteractiveTrashMan;

// 工具函數和常數導出
export { TRASHMAN_STATES, SPEECH_LIBRARY };
