// --- File: src/hooks/useFirestoreItems.js ---
/*
  這是一個自定義 React Hook，專門用來處理從 Firestore 讀取和監聽題目資料的邏輯。
  將這段邏輯抽出來可以讓主 App 組件更簡潔。
*/
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, getDocs } from 'firebase/firestore';
import { DEFAULT_TRASH_ITEMS } from '../constants';

/**
 * 從 Firestore 獲取並監聽遊戲題目
 * @param {object} db - Firestore 實例
 * @param {string} appId - 應用程式 ID
 * @param {boolean} isAuthReady - Firebase 認證是否準備就緒
 * @returns {{items: Array, isLoading: boolean}} - 回傳題目列表和加載狀態
 */
export const useFirestoreItems = (db, appId, isAuthReady) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (db && isAuthReady && appId) {
      const itemsCollectionRef = collection(db, `artifacts/${appId}/public/data/recyclingGameItems`);

      const unsubscribe = onSnapshot(itemsCollectionRef, async (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (itemsData.length === 0) {
          console.log("Firestore 中沒有題目，初始化預設題目...");
          const existingDocsCheck = await getDocs(itemsCollectionRef);
          if (existingDocsCheck.empty) {
            for (const item of DEFAULT_TRASH_ITEMS) {
              await setDoc(doc(db, itemsCollectionRef.path, item.id), item);
            }
            // 重新獲取一次，確保預設題目被加載
            const updatedSnapshot = await getDocs(itemsCollectionRef);
            setItems(updatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        } else {
          setItems(itemsData);
        }
        setIsLoading(false);
      }, (error) => {
        console.error("監聽 Firestore 題目失敗:", error);
        setIsLoading(false);
      });

      return () => unsubscribe(); // 清理 Firestore 監聽器
    } else if (!db && isAuthReady) {
        // 如果認證完成但沒有 db，也停止加載
        setIsLoading(false);
    }
  }, [db, isAuthReady, appId]);

  return { items, isLoading };
};