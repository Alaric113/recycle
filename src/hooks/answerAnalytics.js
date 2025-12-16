// --- File: src/hooks/answerAnalytics.js ---
import { collection, doc, setDoc, getDocs, addDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';

/**
 * 儲存詳細答題記錄
 */
export const saveDetailedAnswer = async (db, eventName, userId, answerData) => {
  try {
    // 🔧 修正路徑：events/{eventName}/users/{userId}/detailed_answers
    const answerRef = collection(db, `events/${eventName}/users/${userId}/detailed_answers`);
    await addDoc(answerRef, {
      userId,
      playerName: answerData.playerName,
      gender: answerData.gender,
      age: answerData.age,
      questionId: answerData.questionId,
      question: answerData.question,
      questionType: answerData.questionType,
      userAnswer: answerData.userAnswer,
      correctAnswer: answerData.correctAnswer,
      isCorrect: answerData.isCorrect,
      responseTime: answerData.responseTime,
      timestamp: new Date(),
      sessionId: answerData.sessionId
    });
    console.log('答題記錄儲存成功');
  } catch (error) {
    console.error("儲存詳細答題記錄失敗:", error);
    throw error;
  }
};

/**
 * 即時監聽答題分析數據
 */
export const subscribeToAnalytics = (db, eventName, callback) => {
  
  
  const getAnswersFromAllUsers = async () => {
    try {
      // 先獲取所有參與者的 userId
      const scoresCollection = collection(db, `events/${eventName}/users`);
      
      const scoresSnapshot = await getDocs(scoresCollection);
      const userIds = scoresSnapshot.docs.map(doc => doc.id);
      
      // 收集所有用戶的答題記錄
      const allAnswers = [];
      for (const userId of userIds) {
        // 🔧 修正路徑：加入 users 層級
        const userAnswersCollection = collection(db, `events/${eventName}/users/${userId}/detailed_answers`);
        const userAnswersSnapshot = await getDocs(userAnswersCollection);
        const userAnswers = userAnswersSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        allAnswers.push(...userAnswers);
      }
      
      // 按時間排序
      allAnswers.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || a.timestamp?.getTime?.() || 0;
        const timeB = b.timestamp?.toMillis?.() || b.timestamp?.getTime?.() || 0;
        return timeB - timeA;
      });
      callback({ type: 'answers', data: allAnswers });
      
    } catch (error) {
      console.error('獲取答題記錄失敗:', error);
      callback({ type: 'answers', data: [] });
    }
  };

  // 監聽分數變化
  const scoresQuery = query(
    collection(db, `events/${eventName}/scores`),
    orderBy('timestamp', 'desc')
  );

  const unsubscribeScores = onSnapshot(scoresQuery, (snapshot) => {
    const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback({ type: 'scores', data: scores });
    
    
    // 當分數更新時，重新獲取所有答題記錄
    getAnswersFromAllUsers();
  });

  // 初始載入
  getAnswersFromAllUsers();

  return () => {
    
    unsubscribeScores();
  };
};
