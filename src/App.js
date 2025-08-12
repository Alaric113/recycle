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
/* global __app_id, __firebase_config, __initial_auth_token */

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
import { TrashCanLoader,RecycleLoader } from "./components/LoadingComponents";

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
  const { items: quizItems, isLoading } = useFirestoreItems(
    db,
    appId,
    isAuthReady
  );
  const [detectedEventName, setDetectedEventName] = useState(null);
  const [mode, setMode] = useState("");
  const { questionNum,desc } = useGetEventQNUM(db, eventName, reloadQNumTrigger);
  const [shouldCheckEvent, setShouldCheckEvent] = useState(false);
  const { eventExists, isChecking, done } = useEventValidator(
    db,
    detectedEventName,
    shouldCheckEvent,
    userId
  );
  const [doCycle, setDoCycle] = useState(false);
  const [answers, setAnswers] = useState([]); // 儲存答題記錄
  
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
      setShouldCheckEvent(true); // 觸發活動驗證
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
      // 安全地讀取環境變數，並提供後備值

      // 提供一個後備的 Firebase 設定物件，以避免在本地開發時出錯
      const firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
      };

      // 驗證必要的設定項目
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

      // 監聽認證狀態
      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
        } else {
          try {
            // 讀取認證 token
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
        setAnswers(answers); // 儲存答題記錄
      }
      setView("end");
    },
    [db, eventName]
  );

  const handleRestart = useCallback(() => {
    setView("playing");
  }, []);

  const handleGoToAdmin = useCallback(() => {
    setView("admin");
  }, []);

  const handleGoToAdminE = useCallback(() => {
    setView("admine");
  }, []);

  const handleGoToAdminPage = useCallback(() => {
    setView("password");
  }, []);

  const handleGoToStart = useCallback(async () => {
    try {
      // 檢查是否為特殊模式需要刷新 UID
      const shouldRefreshUID =
        urlCycle === "cycle" ||
        mode === "admin" ||
        detectedEventName === "Admin";

      if (shouldRefreshUID && auth) {
        console.log(
          `🔄 檢測到 ${urlCycle === "cycle" ? "cycle" : "admin"} 模式，刷新 UID`
        );

        // 登出現有用戶
        if (auth.currentUser) {
          await auth.signOut();
          console.log("已登出用戶:", auth.currentUser?.uid);
        }

        // 強制創建新的匿名用戶
        const userCredential = await signInAnonymously(auth);
        const newUID = userCredential.user.uid;
        setUserId(newUID);

        console.log("🆕 遊戲結束後生成新 UID:", newUID);

        // 重置遊戲狀態
        setFinalScore(0);
        setPlayerName("");
        setReloadQNumTrigger((prev) => prev + 1);
      }

      setView("start");
    } catch (error) {
      console.error("返回主畫面時刷新 UID 失敗:", error);
      // 即使刷新失敗也要回到主畫面
      setView("start");
    }
  }, [urlCycle, mode, detectedEventName, auth]);

  const handleGameCancel = () => {
    setView("start"); // 回到開始畫面
    console.log("使用者取消了遊戲");
  };

  const handleAuthenticated = () => {
    setMode("admin");
    setView("start");
  };

  const renderView = () => {
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

    switch (view) {
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
            desc ={desc}
          />
        );
    }
  };

  return (
    <div
      className="h-screen w-screen bg-cover bg-center bg-gradient-to-br from-purple-600 via-blue-600 to-emerald-500 font-sans overflow-hidden backdrop-blur"
      //style={{
        //backgroundImage: `url(${backgroundImg})`
        
      //}}
    >
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-float" />
        <div className="absolute top-32 right-16 w-16 h-16 bg-white/5 rounded-full animate-float-delayed" />
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full animate-float" />
        <div className="absolute bottom-32 right-32 w-12 h-12 bg-white/5 rounded-full animate-float-delayed" />
      </div>
      {/* 開發時的除錯資訊 */}

      {renderView()}
    </div>
  );
}

// 主 App 組件（包含路由）
export default function App() {
  return (
    <BrowserRouter basename="/recycle">
      <Routes>
        <Route path="/" element={<GameApp />} />
        {/* 預設路由 - 管理模式 */}

        {/* 活動路由 - 活動模式 */}
        <Route path="/:eventName" element={<GameApp />} />
        <Route path="/:eventName/:cycle" element={<GameApp />} />
      </Routes>
    </BrowserRouter>
  );
}
