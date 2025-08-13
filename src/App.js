// --- File: src/App.js ---
import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { saveScore } from "./hooks/eventFirestore";
import { useEventValidator, useGetEventQNUM } from "./hooks/useEventValidator";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import backgroundImg from "./img/unnamed.png";

// Styles
import "./index.css";

// Hooks
import { useFirestoreItems } from "./hooks/useFirestoreItems";

// Components
import { StartScreen, RoundCompleteScreen } from "./components/GameUI";
import Game from "./components/Game";
import AdminPanel from "./components/AdminPanel";
import EventPanel from "./components/EventPanel";
import Password from "./components/Password";
import { TrashCanLoader, RecycleLoader } from "./components/LoadingComponents";

// 新增：滑動方向常數
const SLIDE_DIRECTIONS = {
  LEFT: 'left',
  RIGHT: 'right',
  UP: 'up',
  DOWN: 'down',
  NONE: 'none'
};

// 新增：過渡效果類型
const TRANSITION_TYPES = {
  SLIDE: 'slide',
  FADE: 'fade',
  SCALE: 'scale',
  FLIP: 'flip'
};

// 新增：優化的滑動切換容器組件
const SlideTransitionContainer = ({ 
  children, 
  isTransitioning, 
  slideDirection = SLIDE_DIRECTIONS.RIGHT,
  transitionType = TRANSITION_TYPES.SLIDE,
  duration = 500,
  className = "",
  backgroundGradient = "from-purple-600 via-blue-600 to-emerald-500"
}) => {
  
  // 獲取過渡樣式
  const getTransitionStyle = () => {
    const baseClasses = "absolute inset-0 w-full h-full transition-all ease-in-out";
    const durationClass = `duration-${duration}`;
    
    if (!isTransitioning) {
      return `${baseClasses} ${durationClass} transform translate-x-0 translate-y-0 opacity-100 scale-100`;
    }

    switch (transitionType) {
      case TRANSITION_TYPES.SLIDE:
        const slideTransform = {
          [SLIDE_DIRECTIONS.LEFT]: 'translate-x-full opacity-90',
          [SLIDE_DIRECTIONS.RIGHT]: '-translate-x-full opacity-90',
          [SLIDE_DIRECTIONS.UP]: 'translate-y-full opacity-90',
          [SLIDE_DIRECTIONS.DOWN]: '-translate-y-full opacity-90'
        };
        return `${baseClasses} ${durationClass} transform ${slideTransform[slideDirection]}`;
      
      case TRANSITION_TYPES.FADE:
        return `${baseClasses} ${durationClass} opacity-0 scale-95`;
      
      case TRANSITION_TYPES.SCALE:
        return `${baseClasses} ${durationClass} opacity-0 scale-75`;
      
      case TRANSITION_TYPES.FLIP:
        return `${baseClasses} ${durationClass} opacity-0 transform scale-x-0`;
      
      default:
        return `${baseClasses} ${durationClass} transform translate-x-0 translate-y-0 opacity-100`;
    }
  };

  return (
    <div className={`relative h-screen w-screen bg-gradient-to-br ${backgroundGradient} font-sans overflow-hidden ${className}`}>
      {/* 背景效果層 */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/5" />
      
      {/* 動態背景粒子效果 - 可選，如果覺得太花俏可以移除 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float" />
        <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
      </div>
      
      {/* 頁面內容容器 */}
      <div className={getTransitionStyle()}>
        {children}
      </div>
      
      {/* 添加自定義 CSS 動畫 */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

/**
 * 主應用程式組件，管理遊戲的不同視圖
 */
function GameApp() {
  const { eventName: urlEventName } = useParams();
  const { cycle: urlCycle } = useParams();
  const [reloadQNumTrigger, setReloadQNumTrigger] = useState(0);
  const [view, setView] = useState("start");
  const [finalScore, setFinalScore] = useState(0);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [appId, setAppId] = useState(null);
  const [firebaseError, setFirebaseError] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [eventName, setEventName] = useState("默認測驗");
  const [nextPage, setNextPage] = useState(null);
  
  // 優化：使用新的狀態管理
  const [slideDirection, setSlideDirection] = useState(SLIDE_DIRECTIONS.RIGHT);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState(TRANSITION_TYPES.SLIDE);
  const [currentPage, setCurrentPage] = useState('start');
  
  const { items: quizItems, isLoading } = useFirestoreItems(
    db,
    appId,
    isAuthReady
  );
  const [detectedEventName, setDetectedEventName] = useState(null);
  const [mode, setMode] = useState("");
  const { questionNum, desc } = useGetEventQNUM(
    db,
    eventName,
    reloadQNumTrigger
  );
  const [shouldCheckEvent, setShouldCheckEvent] = useState(false);
  const { eventExists, isChecking, done } = useEventValidator(
    db,
    detectedEventName,
    shouldCheckEvent,
    userId
  );
  const [doCycle, setDoCycle] = useState(false);
  const [answers, setAnswers] = useState([]); // 儲存答題記錄

  // ... 保持原有的 useEffect 邏輯不變 ...
  const getEventFromPath = () => {
    if (urlEventName) {
      const decodedEventName = decodeURIComponent(urlEventName);
      console.log("從 URL 參數檢測到活動:", decodedEventName);
      return decodedEventName;
    }
    console.log("未檢測到活動，使用一般模式");
    setMode("none");
    return null;
  };

  useEffect(() => {
    const eventFromPath = getEventFromPath();

    if (urlCycle === "cycle") {
      console.log(`檢測到循環參數: ${urlCycle}`);
      setDoCycle(true);
    }

    if (eventFromPath) {
      setDetectedEventName(eventFromPath);
      setEventName(eventFromPath);
      setShouldCheckEvent(true);
      console.log(`🔍 檢測到活動，準備驗證: ${eventFromPath}`);
    } else {
      setDetectedEventName(null);
      setMode("none");
      setShouldCheckEvent(false);
      console.log("📋 一般管理模式");
    }
  }, [urlEventName]);

  useEffect(() => {
    if (!isChecking && shouldCheckEvent && detectedEventName) {
      if (eventExists) {
        setMode("event");
        console.log(`🎯 活動模式啟動: ${detectedEventName} (已驗證存在)`);
      } else {
        if (detectedEventName === "Admin") {
          setMode("admin");
        } else {
          setMode("none");
          console.log(`❌ 活動不存在: ${detectedEventName}`);
        }
      }
    }
  }, [eventExists, isChecking, shouldCheckEvent, detectedEventName]);

  // Firebase 初始化和認證
  useEffect(() => {
    try {
      const firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
      };

      if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
        throw new Error("Firebase 設定不完整，請檢查環境變數。");
      }

      const currentAppId = process.env.REACT_APP_APP_ID || "recycle-76cf4";
      setAppId(currentAppId);

      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authInstance = getAuth(app);

      setDb(firestore);
      setAuth(authInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
        } else {
          try {
            const token = process.env.REACT_APP_INITIAL_AUTH_TOKEN;

            if (token) {
              await signInWithCustomToken(authInstance, token);
            } else {
              await signInAnonymously(authInstance);
            }

            const currentUser = authInstance.currentUser;
            if (currentUser) {
              setUserId(currentUser.uid);
            }
            setIsAuthReady(true);
          } catch (authError) {
            console.error("Firebase 登入失敗:", authError);
            setFirebaseError("無法登入，請檢查您的網路連線或稍後再試。");
            setIsAuthReady(true);
          }
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase 初始化失敗:", error);
      setFirebaseError("應用程式初始化失敗，請檢查您的 Firebase 設定。");
      setIsAuthReady(true);
    }
  }, []);

  const { items: allTrashItems, isLoading: isLoadingItems } = useFirestoreItems(
    db,
    appId,
    isAuthReady
  );

  const handleGameEnd = useCallback(
    (score, playerName, userId, [gender, age], answers) => {
      setFinalScore(score);
      if (db && eventName && playerName && userId && [gender, age]) {
        saveScore(db, eventName, playerName, score, userId, gender, age);
        setPlayerName(playerName);
        setAnswers(answers);
      }
      changePage('end', SLIDE_DIRECTIONS.LEFT); // 更新：使用新的切換函數
      setView("end");
    },
    [db, eventName]
  );

  const handleRestart = useCallback(() => {
    changePage('playing', SLIDE_DIRECTIONS.LEFT);
    setView("playing");
  }, []);

  const handleGoToAdmin = useCallback(() => {
    changePage('admin', SLIDE_DIRECTIONS.RIGHT);
    setView("admin");
  }, []);

  const handleGoToAdminE = useCallback(() => {
    changePage('admine', SLIDE_DIRECTIONS.RIGHT);
    setView("admine");
  }, []);

  const handleGoToAdminPage = useCallback(() => {
    changePage('password', SLIDE_DIRECTIONS.RIGHT);
    setView("password");
  }, []);

  const handleGoToStart = useCallback(async () => {
    try {
      const shouldRefreshUID =
        urlCycle === "cycle" ||
        mode === "admin" ||
        detectedEventName === "Admin";

      if (shouldRefreshUID && auth) {
        console.log(
          `🔄 檢測到 ${urlCycle === "cycle" ? "cycle" : "admin"} 模式，刷新 UID`
        );

        if (auth.currentUser) {
          await auth.signOut();
          console.log("已登出用戶:", auth.currentUser?.uid);
        }

        const userCredential = await signInAnonymously(auth);
        const newUID = userCredential.user.uid;
        setUserId(newUID);

        console.log("🆕 遊戲結束後生成新 UID:", newUID);

        setFinalScore(0);
        setPlayerName("");
        setReloadQNumTrigger((prev) => prev + 1);
      }
      changePage('start', SLIDE_DIRECTIONS.RIGHT);
      setView("start");
    } catch (error) {
      console.error("返回主畫面時刷新 UID 失敗:", error);
      changePage('start', SLIDE_DIRECTIONS.RIGHT);
      setView("start");
    }
  }, [urlCycle, mode, detectedEventName, auth]);

  const handleGameCancel = () => {
    setView("start");
    changePage('start', SLIDE_DIRECTIONS.LEFT);
    console.log("使用者取消了遊戲");
  };

  const handleAuthenticated = () => {
    setMode("admin");
    changePage('start', SLIDE_DIRECTIONS.RIGHT);
    setView("start");
  };

  // 優化：新的頁面切換函數
  const changePage = useCallback((newPage, direction = SLIDE_DIRECTIONS.RIGHT, transition = TRANSITION_TYPES.SLIDE) => {
    if(isTransitioning) return
    
    setIsTransitioning(true);
    setSlideDirection(direction);
    setTransitionType(transition);
    setNextPage(newPage);
    
    setTimeout(() => {
      setCurrentPage(newPage);
      setView(newPage); // 同步更新 view 狀態
      setIsTransitioning(false);
    }, 500);
  }, []);

  // 渲染當前頁面內容
  const renderCurrentPage = () => {
    if (!isAuthReady || isLoadingItems) {
      return (
        <div className="flex items-center justify-center h-full">
          <RecycleLoader size="xl" text="正在連接伺服器..." />
        </div>
      );
    }

    if (firebaseError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white text-center p-4">
          <h2 className="text-4xl font-bold text-red-400 mb-4">發生錯誤</h2>
          <p className="text-xl">{firebaseError}</p>
        </div>
      );
    }

    switch (currentPage) {
      case "playing":
        return (
          <Game
            onGameEnd={handleGameEnd}
            onGameCancel={handleGameCancel}
            allQuizItems={quizItems}
            userId={userId}
            eventName={eventName}
            setPlayerName={setPlayerName}
            playerName={playerName}
            doCycle={doCycle}
            db={db}
            questionNum={questionNum}
          />
        );
      case "end":
        return (
          <RoundCompleteScreen
            score={finalScore}
            onRestart={handleGoToStart}
            questionNum={questionNum}
            playerName={playerName}
            answers={answers}
          />
        );
      case "admin":
        return (
          <AdminPanel
            items={allTrashItems}
            db={db}
            appId={appId}
            onBackToStart={handleGoToStart}
          />
        );
      case "admine":
        return <EventPanel db={db} onBackToStart={handleGoToStart} />;
      case "password":
        return (
          <Password
            onClose={handleGoToStart}
            onAuthenticated={handleAuthenticated}
          />
        );
      case "start":
      default:
        return (
          <StartScreen
            onStart={handleRestart}
            onGoToAdmin={handleGoToAdmin}
            onGoToAdminE={handleGoToAdminE}
            userId={userId}
            db={db}
            setEventName={setEventName}
            isEventMode={mode}
            detectedEventName={detectedEventName}
            eventExists={eventExists}
            done={done}
            doCycle={doCycle}
            onGoToAdminPage={handleGoToAdminPage}
            questionNum={questionNum}
            desc={desc}
          />
        );
    }
  };

  // 主渲染：使用新的滑動切換容器
  return (
    <SlideTransitionContainer
      isTransitioning={isTransitioning}
      slideDirection={slideDirection}
      transitionType={transitionType}
      backgroundGradient="from-purple-600 via-blue-600 to-emerald-500"
    >
      {renderCurrentPage()}
    </SlideTransitionContainer>
  );
}

// 主 App 組件（包含路由）
export default function App() {
  return (
    <BrowserRouter basename="/recycle">
      <Routes>
        <Route path="/" element={<GameApp />} />
        <Route path="/:eventName" element={<GameApp />} />
        <Route path="/:eventName/:cycle" element={<GameApp />} />
      </Routes>
    </BrowserRouter>
  );
}