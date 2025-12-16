// --- File: src/hooks/useFirestoreItems.js ---
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, getDocs } from 'firebase/firestore';
import { DEFAULT_QUIZ_ITEMS } from '../constants';

/**
 * 從 Firestore 獲取並監聽測驗題目
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
      // 改為使用測驗題目的集合路徑
      const itemsCollectionRef = collection(db, `artifacts/${appId}/public/data/quizItems`);
      
      const unsubscribe = onSnapshot(itemsCollectionRef, async (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (itemsData.length === 0) {
          console.log("Firestore 中沒有測驗題目，初始化預設題目...");
          
          // 檢查是否真的為空
          const existingDocsCheck = await getDocs(itemsCollectionRef);
          if (existingDocsCheck.empty) {
            // 新增預設測驗題目
            for (const item of DEFAULT_QUIZ_ITEMS) {
              
              await setDoc(doc(db, itemsCollectionRef.path, item.id), {
                type: item.type,
                question: item.question,
                correctAnswer: item.correctAnswer,
                ...(item.item && { item: item.item }),
                ...(item.options && { options: item.options })
              });
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
        console.error("監聽 Firestore 測驗題目失敗:", error);
        setItems(DEFAULT_QUIZ_ITEMS); // 使用預設題目作為後備
        setIsLoading(false);
      });

      return () => unsubscribe(); // 清理 Firestore 監聽器
    } else if (!db && isAuthReady) {
      // 如果認證完成但沒有 db，使用預設題目
      setItems(DEFAULT_QUIZ_ITEMS);
      setIsLoading(false);
    }
  }, [db, isAuthReady, appId]);

  return { items, isLoading };
};
