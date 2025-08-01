// --- File: src/hooks/answerAnalytics.js ---
import { collection, doc, setDoc, getDocs, addDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';

/**
 * 儲存詳細答題記錄
 */
export const saveDetailedAnswer = async (db, eventName, userId, answerData) => {
  try {
    const answerRef = collection(db, `events/${eventName}/detailed_answers`);
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
      sessionId: answerData.sessionId // 用於追蹤同一次答題
    });
  } catch (error) {
    console.error("儲存詳細答題記錄失敗:", error);
    throw error;
  }
};

/**
 * 即時監聽答題分析數據
 */
export const subscribeToAnalytics = (db, eventName, callback) => {
    console.log('訂閱答題分析數據:', eventName,callback);
  const answersQuery = query(
    collection(db, `events/${eventName}/detailed_answers`),
    orderBy('timestamp', 'desc')
  );
  
  const scoresQuery = query(
    collection(db, `events/${eventName}/scores`),
    orderBy('timestamp', 'desc')
  );

  const unsubscribeAnswers = onSnapshot(answersQuery, (snapshot) => {
    const answers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback({ type: 'answers', data: answers });
  });

  const unsubscribeScores = onSnapshot(scoresQuery, (snapshot) => {
    const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback({ type: 'scores', data: scores });
  });

  return () => {
    unsubscribeAnswers();
    unsubscribeScores();
  };
};
