// --- File: src/App.js ---
import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
/* global __app_id, __firebase_config, __initial_auth_token */

// Styles
import './index.css';

// Hooks
import { useFirestoreItems } from './hooks/useFirestoreItems';

// Components
import { StartScreen, RoundCompleteScreen } from './components/GameUI';
import Game from './components/Game';
import AdminPanel from './components/AdminPanel';

/**
 * 主應用程式組件，管理遊戲的不同視圖
 */
export default function App() {
  const [view, setView] = useState('start');
  const [finalScore, setFinalScore] = useState(0);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [appId, setAppId] = useState(null);
  const [firebaseError, setFirebaseError] = useState(null);

  // Firebase 初始化和認證
  useEffect(() => {
    try {
      // 安全地讀取環境變數，並提供後備值
      const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'recycle-76cf4';
      
      // 提供一個後備的 Firebase 設定物件，以避免在本地開發時出錯
      const defaultConfig = {
        apiKey: "AIzaSyDUkrkOvDABCV0Ug1suZGmf43NuMDFeuI0", 
        authDomain: "recycle-76cf4.firebaseapp.com",
        projectId: "recycle-76cf4", // 至少需要 projectId
        storageBucket: "recycle-76cf4.firebasestorage.app",
        messagingSenderId: "1037683276646",
        appId: "1:1037683276646:web:4e6449de76ee8bf29b26a7"
      };
      
      const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : JSON.stringify(defaultConfig);
      const firebaseConfig = JSON.parse(firebaseConfigStr);
      
      if (!firebaseConfig.projectId) {
        throw new Error("Firebase 設定中缺少 projectId。");
      }

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
                // 安全地讀取 token，若不存在則為 null
                const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                if (token) {
                    await signInWithCustomToken(authInstance, token);
                } else {
                    await signInAnonymously(authInstance);
                }
                // 更新用戶狀態
                const currentUser = authInstance.currentUser;
                if(currentUser){
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

  const handleGameEnd = useCallback((score) => {
    setFinalScore(score);
    setView('end');
  }, []);
  
  const handleRestart = useCallback(() => {
      setView('playing');
  }, []);
  
  const handleGoToAdmin = useCallback(() => {
      setView('admin');
  }, []);
  
  const handleGoToStart = useCallback(() => {
      setView('start');
  }, []);

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
        return <Game onGameEnd={handleGameEnd} allTrashItems={allTrashItems} />;
      case 'end':
        return <RoundCompleteScreen score={finalScore} onRestart={handleRestart} />;
      case 'admin':
        return <AdminPanel items={allTrashItems} db={db} appId={appId} onGoToGame={handleGoToStart} />;
      case 'start':
      default:
        return <StartScreen onStart={handleRestart} onGoToAdmin={handleGoToAdmin} userId={userId} />;
    }
  };

  return (
    <main className="h-screen w-screen bg-gradient-to-b from-teal-500 to-cyan-800 font-sans overflow-hidden">
      {renderView()}
    </main>
  );
}