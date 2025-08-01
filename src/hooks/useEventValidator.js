// --- File: src/hooks/useEventValidator.js ---
import { useState, useEffect, use } from 'react';
import { collection, query, where, getDocs, limit,doc,getDoc } from 'firebase/firestore';

/**
 * 檢查活動是否在 Firestore 中存在
 * @param {object} db - Firestore 實例
 * @param {string} eventName - 活動名稱
 * @param {boolean} shouldCheck - 是否執行檢查
 * @returns {{eventExists: boolean, isChecking: boolean}} - 活動存在狀態和檢查狀態
 */
export const useEventValidator = (db, eventName, shouldCheck = false,userIdd) => {

  const [eventExists, setEventExists] = useState(false);
  const [done, setDone] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    
    if (!db || !eventName || !shouldCheck) {
      setEventExists(false);
      setIsChecking(false);
      return;
    }

    const checkEventExists = async () => {
      setIsChecking(true);
      
      try {
        
        const eventDocRef = doc(db, 'events/', eventName);
        const eventDocSnap = await getDoc(eventDocRef);
        setEventExists(eventDocSnap.exists());
        const scoresCollectionRef = collection(db, 'events', eventName, 'scores'); // collection, doc, collection
        
        const partSnap = await getDocs(scoresCollectionRef);
        const ids = partSnap.docs.map(doc => doc.data().userId)
        console.log(ids)
        
        if (ids.includes(userIdd)) {
          setDone(true);
          console.log(ids.includes(userIdd))
        } else {
          setDone(false);
        }

      } catch (error) {
        console.error('檢查活動存在時發生錯誤:', error);
        setEventExists(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkEventExists();
  }, [db, eventName, shouldCheck,userIdd,done]);

  return { eventExists, isChecking ,done};
};
