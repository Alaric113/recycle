// --- File: src/App.js ---
import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { saveScore } from './hooks/eventFirestore';
import { useEventValidator } from './hooks/useEventValidator';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
/* global __app_id, __firebase_config, __initial_auth_token */

// Styles
import './index.css';

// Hooks
import { useFirestoreItems } from './hooks/useFirestoreItems';

// Components
import { StartScreen, RoundCompleteScreen } from './components/GameUI';
import Game from './components/Game';
import AdminPanel from './components/AdminPanel';
import EventPanel from './components/EventPanel';
import Password from './components/Password';

/**
 * 主應用程式組件，管理遊戲的不同視圖
 */
function GameApp() {
  const { eventName: urlEventName } = useParams();
  const { cycle: urlCycle } = useParams();

  const [view, setView] = useState('start');
  const [finalScore, setFinalScore] = useState(0);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [appId, setAppId] = useState(null);
  const [firebaseError, setFirebaseError] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [eventName, setEventName] = useState('默認測驗');
  const { items: quizItems, isLoading } = useFirestoreItems(db, appId, isAuthReady);
  const [detectedEventName, setDetectedEventName] = useState(null);
  const [mode, setMode] = useState('');
  const [shouldCheckEvent, setShouldCheckEvent] = useState(false);
  const { eventExists, isChecking,done } = useEventValidator(db, detectedEventName, shouldCheckEvent,userId);
  const [ doCycle, setDoCycle] = useState(false);

  const getEventFromPath = () => {
    if (urlEventName) {
      
      const decodedEventName = decodeURIComponent(urlEventName);
      console.log('從 URL 參數檢測到活動:', decodedEventName);
      return decodedEventName;
    }
    console.log('未檢測到活動，使用一般模式');
    setMode('none');
    return null;
  };
  useEffect(() => {
    const eventFromPath = getEventFromPath();

    if (urlCycle === 'cycle') {
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
      setMode('none');
      setShouldCheckEvent(false);
      console.log('📋 一般管理模式');
    }
  }, [urlEventName]);

  useEffect(() => {
    if (!isChecking && shouldCheckEvent && detectedEventName) {
      if (eventExists) {
        setMode('event');
        console.log(`🎯 活動模式啟動: ${detectedEventName} (已驗證存在)`);
      }else {
        if(detectedEventName === 'Admin'){
          setMode('admin');
        }else{
        setMode('none');
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
        appId: process.env.REACT_APP_FIREBASE_APP_ID
      };
  
      // 驗證必要的設定項目
      if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
        throw new Error("Firebase 設定不完整，請檢查環境變數。");
      }
      
      const currentAppId = process.env.REACT_APP_APP_ID || 'recycle-76cf4';
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

  const { items: allTrashItems, isLoading: isLoadingItems } = useFirestoreItems(db, appId, isAuthReady);

  const handleGameEnd = useCallback((score, playerName,userId) => {
    setFinalScore(score);
    if (db && eventName && playerName && userId) {
      saveScore(db, eventName, playerName, score, userId);
    }
    setView('end');
  }, [db, eventName]);

  const handleRestart = useCallback(() => {
      setView('playing');
  }, []);
  
  const handleGoToAdmin = useCallback(() => {
      setView('admin');
  }, []);

  const handleGoToAdminE = useCallback(() => {
      setView('admine');
  },[]);

  const handleGoToAdminPage = useCallback(() => {
    setView('password');
},[]);
  
  const handleGoToStart = useCallback(() => {
      setView('start');
  }, []);

  const handleGameCancel = () => {
    setView('start'); // 回到開始畫面
    console.log('使用者取消了遊戲');
  };

  const handleAuthenticated=() => {
    setMode('admin');
    setView('start');
  }

  const renderView = () => {
    if (!isAuthReady || isLoadingItems) {
      return (
        <div className="flex items-center justify-center h-full text-white text-3xl">
          載入中... 請稍候
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
      case 'playing':
        return <Game onGameEnd={handleGameEnd} onGameCancel={handleGameCancel} allQuizItems={quizItems} userId={userId} eventName={eventName} setPlayerName={setPlayerName} playerName={playerName} doCycle={doCycle} />;
      case 'end':
        return <RoundCompleteScreen score={finalScore} onRestart={handleGoToStart} />;
      case 'admin':
        return <AdminPanel items={allTrashItems} db={db} appId={appId} onBackToStart={handleGoToStart} />;
      case 'admine':
        return <EventPanel db={db} onBackToStart={handleGoToStart}/>
      case 'password':
        return <Password onClose={handleGoToStart} onAuthenticated={handleAuthenticated}/>
      case 'start':
      default:
        return <StartScreen onStart={handleRestart} onGoToAdmin={handleGoToAdmin} onGoToAdminE={handleGoToAdminE} userId={userId} db={db} setEventName={setEventName} isEventMode={mode} detectedEventName={detectedEventName} eventExists={eventExists} done={done} doCycle={doCycle} onGoToAdminPage={handleGoToAdminPage}/>;
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-teal-500 to-cyan-800 font-sans overflow-hidden">
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
        <Route path="/" element={<GameApp/>} />
        {/* 預設路由 - 管理模式 */}
       
        {/* 活動路由 - 活動模式 */}
        <Route path="/:eventName" element={<GameApp/>} />
        <Route path="/:eventName/:cycle" element={<GameApp/>} />
      </Routes>
    </BrowserRouter>
  );
}