import {
  collection,
  doc,
  setDoc,
  getDocs,
  addDoc,
  updateDoc,
} from "firebase/firestore";

/**
 * 儲存使用者分數到 Firestore
 * @param {object} db - Firestore 實例
 * @param {string} eventName - 活動名稱
 *  @param {string} oldName        原活動名稱
 * @param {string} newName        新活動名稱
 * @param {object} extraPayload   需要覆寫的欄位（如 description、questionNum）
 * @param {string} playerName - 使用者名稱
 * @param {number} score - 分數
 * @param {string} userId - 使用者 ID
 */
export const saveScore = async (
  db,
  eventName,
  playerName,
  score,
  userId,
  gender,
  age
) => {
  try {
    console.log("開始儲存分數:", { eventName, playerName, score, gender, age });

    const eventRef = collection(db, `events/${eventName}/users`);
    await setDoc(doc(eventRef, userId), {
      score,
      timestamp: new Date(),
      playerName, // 也儲存玩家姓名作為備份
      userId, // 儲存 userId
      gender, // 儲存性別
      age, // 儲存年齡
    });

    console.log("分數儲存成功");
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
    const eventsCollectionRef = collection(db, "events");
    const snapshot = await getDocs(eventsCollectionRef);
    return snapshot.docs.map((doc) => doc.id);
  } catch (error) {
    console.error("獲取活動名稱失敗:", error);
    return [];
  }
};

export const updateEvent = async (db, eventName, payload) => {
  try {
    await updateDoc(doc(db, "events", eventName), payload);
    console.log("活動更新成功:", eventName);
  } catch (err) {
    console.error("更新活動失敗", err);
    throw err;
  }
};


