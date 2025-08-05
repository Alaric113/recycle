// hooks/useEventValidator.js
import { useEffect, useState } from 'react';
import {
  doc, onSnapshot, getDoc, collection, getDocs
} from 'firebase/firestore';

export const useEventValidator = (db, eventName, shouldCheck, uid) => {
  const [eventExists, setEventExists] = useState(false);
  const [done, setDone] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [questionNum, setQuestionNum] = useState(0);

  useEffect(() => {
    if (!db || !eventName || !shouldCheck || !uid) return;

    setIsChecking(true);

    // 1️⃣ 先確認活動本身是否存在
    const eventDocRef = doc(db, 'events', eventName);
    getDoc(eventDocRef).then(snap => {
      setEventExists(snap.exists());
      if (snap.exists()) {
        setQuestionNum(snap.data().questionNum)
      }
      
    });

    // 2️⃣ 即時監聽「這個使用者」的成績文件
    const userDocRef = doc(db, 'events', eventName, 'users', uid);
    const unsub = onSnapshot(userDocRef, snap => {
      setDone(snap.exists());   // 一出現就視為已完成
      setIsChecking(false);
    });

    return () => unsub();
  }, [db, eventName, shouldCheck, uid]);
  console.log()

  return { eventExists, isChecking, done ,questionNum };
};
