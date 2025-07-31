import React, { useState, useEffect } from 'react';
import { collection, getDocs, getCountFromServer, query,setDoc,doc } from 'firebase/firestore';
import CenteredModal from './NameModel';
const EventPanel = ({ db, onBackToStart }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [error, setError] = useState(null);

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');

  const generateEventUrl = (eventName) => {
    const baseUrl = window.location.origin;
    const pathname = window.location.pathname.split('/')[1]; // 獲取 'recycle'
    return `${baseUrl}/${pathname}/${encodeURIComponent(eventName)}`;
  };

  const handleCopyUrl = async (eventName) => {
    const eventUrl = generateEventUrl(eventName);
    
    try {
      await navigator.clipboard.writeText(eventUrl);
      alert(`活動網址已複製到剪貼簿！\n${eventUrl}`);
    } catch (error) {
      console.error('複製失敗:', error);
      // 備用方案：顯示網址讓使用者手動複製
      prompt('請手動複製以下網址:', eventUrl);
    }
  };

  const handleGenerateQRCode = (eventName) => {
    const eventUrl = generateEventUrl(eventName);
    console.log('準備生成 QR Code:', eventUrl);
    alert(`QR Code 功能開發中\n活動：${eventName}\n網址：${eventUrl}`);
    // TODO: 後續實作 QR Code 生成功能
  };
  
  const handleAddEvent = async () => {
    if (!newEventName.trim()) {
      alert('請輸入活動名稱');
      return;
    }

    if (events.includes(newEventName.trim())) {
      alert('活動名稱已存在，請使用其他名稱');
      return;
    }

    try {
      // 在 Firestore 中建立新活動
      const eventsCollectionRef = collection(db, 'events');
      await setDoc(doc(eventsCollectionRef, newEventName.trim()), {
        createdAt: new Date(),
        description: `${newEventName.trim()} 垃圾分類測驗活動`
      });

      // 重新載入活動列表
      const eventsSnapshot = await getDocs(eventsCollectionRef);
      const eventList = eventsSnapshot.docs.map(doc => doc.id);
      setEvents(eventList);

      // 清理狀態
      setNewEventName('');
      setShowAddEventModal(false);
      
      console.log(`新增活動成功: ${newEventName.trim()}`);
      alert(`活動「${newEventName.trim()}」建立成功！`);
    } catch (error) {
      console.error('新增活動失敗:', error);
      alert('新增活動失敗，請稍後再試');
    }
  };

  // 獲取所有活動列表
  useEffect(() => {
    const fetchEvents = async () => {
      if (!db) return;
      
      setLoadingEvents(true);
      setError(null);
      
      try {
        // 獲取 events 集合中的所有文檔（活動名稱）
        const eventsCollection = collection(db, 'events');
        const eventsSnapshot = await getDocs(eventsCollection);
        
        const eventList = eventsSnapshot.docs.map(doc => doc.id);
        setEvents(eventList);
        
        console.log('獲取到的活動列表:', eventList);
      } catch (error) {
        console.error('獲取活動列表失敗:', error);
        setError('無法載入活動列表，請稍後再試');
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [db]);

  // 獲取選中活動的參與者詳情
  useEffect(() => {
    if (!selectedEvent || !db) {
      setParticipants([]);
      setParticipantCount(0);
      return;
    }

    const fetchParticipants = async () => {
      setLoadingParticipants(true);
      setError(null);
      
      try {
        // 獲取活動的分數記錄
        const scoresCollection = collection(db, `events/${selectedEvent}/scores`);
        const scoresSnapshot = await getDocs(scoresCollection);
        
        // 獲取參與者計數[11]
        const countQuery = query(scoresCollection);
        const countSnapshot = await getCountFromServer(countQuery);
        setParticipantCount(countSnapshot.data().count);
        
        // 獲取參與者詳細資料
        const participantsData = scoresSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // 按分數排序（高到低）
        participantsData.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        setParticipants(participantsData);
        
        console.log(`活動 ${selectedEvent} 參與者:`, participantsData);
      } catch (error) {
        console.error('獲取參與者資料失敗:', error);
        setError('無法載入參與者資料，請稍後再試');
      } finally {
        setLoadingParticipants(false);
      }
    };

    fetchParticipants();
  }, [db, selectedEvent]);

  const handleEventSelect = (eventName) => {
    setSelectedEvent(eventName);
    setError(null);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    
    // 處理 Firestore Timestamp 物件
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString('zh-TW');
    }
    
    // 處理一般 Date 物件
    return new Date(timestamp).toLocaleString('zh-TW');
  };

  

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 標題列 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">活動管理</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddEventModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <span>➕</span>
                新增活動
              </button>
              <button
                onClick={onBackToStart}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                返回首頁
              </button>
            </div>
          </div>
        </div>

        <CenteredModal
          isOpen={showAddEventModal}
          onClose={() => {
            setShowAddEventModal(false);
            setNewEventName('');
          }}
          title="請輸入新活動名稱"
          onSubmit={handleAddEvent}
          inputValue={newEventName}
          setInputValue={setNewEventName}
            showCancelButton={true}
        />

        {/* 錯誤提示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：活動列表 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              📋 所有活動 
              <span className="ml-2 text-sm text-gray-500">({events.length})</span>
            </h2>
            
            {loadingEvents ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">載入活動中...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>目前沒有任何活動</p>
                <p className="text-sm mt-2">建立新活動後會顯示在這裡</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map(eventName => (
                  <div
                    key={eventName}
                    onClick={() => handleEventSelect(eventName)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border-2 flex flex row justify-between ${
                      selectedEvent === eventName
                        ? 'bg-blue-100 border-blue-300 shadow-md'
                        : 'bg-gray-50 border-transparent hover:bg-blue-50 hover:border-blue-200'
                    }`}
                  >
                    <div>
                        <div className="font-medium text-gray-800">{eventName}</div>
                        <div className="text-sm text-gray-500 mt-1">點擊查看詳情</div>
                    </div>
                    <div className='flex flex-row gap-2'>
                        <button
                        onClick={() => handleCopyUrl(eventName)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                        title="複製活動網址"
                      >
                        <span>🔗</span>
                        <span>網址</span>
                      </button>
                      
                      <button
                        onClick={() => handleGenerateQRCode(eventName)}
                        className="flex-1 px-3 py-2 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600 transition-colors flex items-center justify-center gap-1"
                        title="生成 QR Code"
                      >
                        <span>📱</span>
                        <span>QR Code</span>
                      </button>
                    </div>
                  </div>
                  
                ))}
              </div>
            )}
          </div>

          {/* 右側：活動詳情 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedEvent ? `📊 ${selectedEvent} - 參與者詳情` : '請選擇活動'}
              </h2>
              {selectedEvent && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  總參與人數: {participantCount}
                </div>
              )}
            </div>

            {!selectedEvent ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🎯</div>
                <p className="text-lg">請從左側列表選擇一個活動</p>
                <p className="text-sm mt-2">選擇後可查看該活動的參與者資料與答題狀況</p>
              </div>
            ) : loadingParticipants ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">載入參與者資料中...</p>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-lg">此活動尚無參與者</p>
                <p className="text-sm mt-2">有人開始答題後會顯示在這裡</p>
              </div>
            ) : (
              <div>
                {/* 統計資訊 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{participantCount}</div>
                    <div className="text-sm text-gray-600">總參與人數</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(participants.reduce((sum, p) => sum + (p.score || 0), 0) / participants.length) || 0}
                    </div>
                    <div className="text-sm text-gray-600">平均分數</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.max(...participants.map(p => p.score || 0))}
                    </div>
                    <div className="text-sm text-gray-600">最高分數</div>
                  </div>
                </div>

                {/* 參與者列表 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-3 font-medium text-gray-700">排名</th>
                        <th className="border border-gray-200 p-3 font-medium text-gray-700">姓名</th>
                        <th className="border border-gray-200 p-3 font-medium text-gray-700">分數</th>
                        <th className="border border-gray-200 p-3 font-medium text-gray-700">完成時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant, index) => {
                        
                        return (
                          <tr key={participant.id} className="hover:bg-gray-50">
                            <td className="border border-gray-200 p-3">
                              <div className="flex items-center">
                                {index === 0 && <span className="text-yellow-500 mr-1">🥇</span>}
                                {index === 1 && <span className="text-gray-400 mr-1">🥈</span>}
                                {index === 2 && <span className="text-orange-600 mr-1">🥉</span>}
                                #{index + 1}
                              </div>
                            </td>
                            <td className="border border-gray-200 p-3 font-medium">
                              {participant.playerName || participant.id}
                            </td>
                            <td className="border border-gray-200 p-3">
                              <span className="text-lg font-semibold text-blue-600">
                                {participant.score || 0}
                              </span> 分
                            </td>
                            
                            <td className="border border-gray-200 p-3 text-sm text-gray-600">
                              {formatTimestamp(participant.timestamp)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPanel;
