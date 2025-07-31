// --- File: src/hooks/useEventValidator.js ---
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * 檢查活動是否在 Firestore 中存在
 * @param {object} db - Firestore 實例
 * @param {string} eventName - 活動名稱
 * @param {boolean} shouldCheck - 是否執行檢查
 * @returns {{eventExists: boolean, isChecking: boolean}} - 活動存在狀態和檢查狀態
 */
export const useEventValidator = (db, eventName, shouldCheck = false) => {
  const [eventExists, setEventExists] = useState(false);
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
        // 方法 1: 檢查分數集合是否存在
        const scoresRef = collection(db, `events/${eventName}/scores`);
        const scoresQuery = query(scoresRef, limit(1));
        const scoresSnapshot = await getDocs(scoresQuery);
        
        // 方法 2: 檢查活動設定文件是否存在
        const eventConfigRef = collection(db, 'eventConfigs');
        const configQuery = query(eventConfigRef, where('name', '==', eventName), limit(1));
        const configSnapshot = await getDocs(configQuery);
        
        const hasScores = !scoresSnapshot.empty;
        const hasConfig = !configSnapshot.empty;
        
        // 只要有分數或設定就認為活動存在
        const exists = hasScores || hasConfig;
        
        console.log(`🔍 活動檢查結果: ${eventName}`);
        console.log(`  - 有分數記錄: ${hasScores}`);
        console.log(`  - 有活動設定: ${hasConfig}`);
        console.log(`  - 活動存在: ${exists}`);
        
        setEventExists(exists);
      } catch (error) {
        console.error('檢查活動存在時發生錯誤:', error);
        setEventExists(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkEventExists();
  }, [db, eventName, shouldCheck]);

  return { eventExists, isChecking };
};
