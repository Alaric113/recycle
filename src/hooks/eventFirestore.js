import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

/**
 * 儲存使用者分數到 Firestore
 * @param {object} db - Firestore 實例
 * @param {string} eventName - 活動名稱
 * @param {string} playerName - 使用者名稱
 * @param {number} score - 分數
 */
export const saveScore = async (db, eventName, playerName, score) => {
    try {
      console.log('開始儲存分數:', { eventName, playerName, score });
      
      const eventRef = collection(db, `events/${eventName}/scores`);
      await setDoc(doc(eventRef, playerName), { 
        score,
        timestamp: new Date(),
        playerName // 也儲存玩家姓名作為備份
      });
      
      console.log('分數儲存成功');
    } catch (error) {
      console.error("儲存分數失敗:", error);
      throw error; // 重新拋出錯誤，讓呼叫方能處理
    }
  };
  

/**
 * 獲取所有活動名稱
 * @param {object} db - Firestore 實例
 * @returns {Promise<Array<string>>} - 活動名稱列表
 */
export const getEventNames = async (db) => {
  try {
    const eventsCollectionRef = collection(db, 'events');
    const snapshot = await getDocs(eventsCollectionRef);
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error("獲取活動名稱失敗:", error);
    return [];
  }
};
