import React, { useState, useEffect } from "react";
import { collection, getDocs, setDoc, doc, getDoc } from "firebase/firestore";
import CenteredModal from "./eventNameModel";
import QuestionAnalytics from "./QuestionAnalytics";
import QRCode from "qrcode";
import QRCodeModal from "./QRCodeModal";
import { updateEvent } from "../hooks/eventFirestore";
import { RecycleLoader } from "./LoadingComponents";

const EventPanel = ({ db, onBackToStart }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [numQuestions, setNumQuestions] = useState(5); // 新增：題目數量狀態
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);
  const [analyticsEventName, setAnalyticsEventName] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrEventName, setQrEventName] = useState("");
  const [qrEventType, setQrEventType] = useState("one");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEventName, setEditEventName] = useState("");
  const [editNumQuestions, setEditNumQuestions] = useState(5);
  const [editDesc, setEditDesc] = useState("");
  const [desc,setDesc] = useState('')

  const handleShowDetailedAnalytics = (eventName) => {
    setAnalyticsEventName(eventName);
    setShowDetailedAnalytics(true);
  };

  // Corrected placement of useEffect hooks.

  // 獲取所有活動列表
  useEffect(() => {
    const fetchEvents = async () => {
      if (!db) return;

      setLoadingEvents(true);
      setError(null);

      try {
        const eventsCollection = collection(db, "events");
        const eventsSnapshot = await getDocs(eventsCollection);

        const eventList = eventsSnapshot.docs.map((doc) => doc.id);
        setEvents(eventList);

        console.log("獲取到的活動列表:", eventList);
      } catch (error) {
        console.error("獲取活動列表失敗:", error);
        setError("無法載入活動列表，請稍後再試");
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [db]);

  // 獲取選中活動的參與者詳情
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!db || !selectedEvent) {
        setParticipants([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const usersCollection = collection(db, `events/${selectedEvent}/users`);
        const scoresSnapshot = await getDocs(usersCollection);
        const participantsData = scoresSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setParticipants(participantsData);
        setParticipantCount(participantsData.length);

        console.log(`${selectedEvent} 的參與者:`, participantsData);
      } catch (error) {
        console.error("載入參與者失敗:", error);
        setError("載入參與者失敗，請稍後再試");
        setParticipants([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [db, selectedEvent]);

  // Now, the conditional return is after the hooks
  if (showDetailedAnalytics && analyticsEventName) {
    return (
      <QuestionAnalytics
        db={db}
        eventName={analyticsEventName}
        onBack={() => {
          setShowDetailedAnalytics(false);
          setAnalyticsEventName(null);
        }}
      />
    );
  }

  // Rest of your component...
  const generateEventUrl = (eventName, type) => {
    const baseUrl = window.location.origin;
    const pathname = window.location.pathname.split("/")[1];
    if (type === "more") {
      return `${baseUrl}/${pathname}/${encodeURIComponent(eventName)}/cycle`;
    }
    return `${baseUrl}/${pathname}/${encodeURIComponent(eventName)}`;
  };

  const handleCopyUrl = async (eventName, type) => {
    const eventUrl = generateEventUrl(eventName, type);

    try {
      await navigator.clipboard.writeText(eventUrl);
      alert(`活動網址已複製到剪貼簿！\n${eventUrl}`);
    } catch (error) {
      console.error("複製失敗:", error);
      prompt("請手動複製以下網址:", eventUrl);
    }
  };

  const handleGenerateQRCode = (eventName, type = "one") => {
    setQrEventName(eventName);
    setQrEventType(type);
    setShowQRModal(true);
  };

  const handleAddEvent = async () => {
    setIsEditing(false);
    if (!newEventName.trim()) {
      alert("請輸入活動名稱");
      return;
    }

    if (events.includes(newEventName.trim())) {
      alert("活動名稱已存在，請使用其他名稱");
      return;
    }

    try {
      const eventsCollectionRef = collection(db, "events");
      await setDoc(doc(eventsCollectionRef, newEventName.trim()), {
        createdAt: new Date(),
        description: desc || '你好!!',
        questionNUm: numQuestions, // 儲存題目數量
      });

      const eventsSnapshot = await getDocs(eventsCollectionRef);
      const eventList = eventsSnapshot.docs.map((doc) => doc.id);
      setEvents(eventList);

      setNewEventName("");
      setNumQuestions(5); // 重置題目數量
      setShowAddEventModal(false);

      console.log(`新增活動成功: ${newEventName.trim()}`);
      alert(`活動「${newEventName.trim()}」建立成功！`);
    } catch (error) {
      console.error("新增活動失敗:", error);
      alert("新增活動失敗，請稍後再試");
    }
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
  };

  const openEdit = async (name) => {
    try {
      const snap = await getDoc(doc(db, "events", name));
      const data = snap.data() || {};
      setEditEventName(name);
      setEditNumQuestions(data.questionNum || 5);
      setEditDesc(data.description || "");
      setShowEditModal(true);
      console.log(data.description)
    } catch (e) {
      alert("讀取活動資料失敗");
    }
  };

  const handleEditSubmit = async () => {
    try {
      await updateEvent(db, editEventName, {
        questionNum: Number(editNumQuestions),
        description: editDesc,
      });
      alert("活動已更新！");
      setShowEditModal(false);

      /* 即時更新左側列表顯示的數值 */
      const listSnap = await getDocs(collection(db, "events"));
      setEvents(listSnap.docs.map((d) => d.id));
    } catch {
      alert("更新失敗");
    }
  };

  const GenderIcon = ({ gender }) => {
    const iconProps = "w-5 h-5";

    switch (gender) {
      case "男":
        return (
          <svg
            className={`${iconProps} text-blue-600`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9L16.5 9C16.74 10.85 16.03 12.7 14.66 14.1L13.41 15.41C13.21 15.8 12.76 16 12.31 16S11.41 15.8 11.21 15.41L9.96 14.1C8.59 12.7 7.88 10.85 8.12 9L9.5 9V7L3.5 7V9L5 9C4.76 11.15 5.47 13.3 6.84 14.9L8.09 16.2C8.89 17.2 10.39 17.2 11.19 16.2L12.44 14.9C13.81 13.3 14.52 11.15 14.28 9L15.5 9L21 9Z" />
          </svg>
        );
      case "女":
        return (
          <svg
            className={`${iconProps} text-pink-600`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM8.5 7C8.5 7 7.91 8.09 8.07 9.5C8.22 10.91 9 12 9 12L11 14H13L15 12C15 12 15.78 10.91 15.93 9.5C16.09 8.09 15.5 7 15.5 7H8.5ZM12.5 18V22H11.5V18H9V16.5C9 15.67 9.67 15 10.5 15H13.5C14.33 15 15 15.67 15 16.5V18H12.5Z" />
          </svg>
        );
      case "其他":
        return (
          <svg
            className={`${iconProps} text-purple-600`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 4C14.21 4 16 5.79 16 8S14.21 12 12 12 8 10.21 8 8 9.79 4 12 4ZM12 14C16.42 14 20 15.79 20 18V20H4V18C4 15.79 7.58 14 12 14Z" />
          </svg>
        );
      default:
        return (
          <svg
            className={`${iconProps} text-gray-600`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12C14.21 12 16 10.21 16 8S14.21 4 12 4 8 5.79 8 8 9.79 12 12 12ZM12 14C9.79 14 4 15.79 4 18V20H20V18C20 15.79 14.21 14 12 14Z" />
          </svg>
        );
    }
  };

  const handleEventSelect = (eventName) => {
    setSelectedEvent(eventName);
    setError(null);
  };

  const handleAgeRange = (e) => {
    const age = parseInt(e);
    if (age < 19) return "18歲以下";
    if (age < 26) return "19-25歲";
    if (age < 36) return "26-35歲";
    if (age < 46) return "36-45歲";
    if (age < 56) return "46-55歲";
    if (age < 65) return "56-64歲";
    if (age < 100) return "65歲以上";
    return "-";
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "-";
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString("zh-TW");
    }
    return new Date(timestamp).toLocaleString("zh-TW");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col max-h-screen overflow-y-scroll md:overflow-y-hidden min-h-0">
      <div className="mx-auto flex flex-col flex-1 min-h-0 max-w-7xl w-full ">
        {/* 標題區域 - 固定 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-3xl font-bold text-gray-800">
              活動管理
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddEventModal(true)}
                className="text-sm md:text-lg px-2 py-1 sm:px-4 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                新增活動
              </button>
              <button
                onClick={onBackToStart}
                className="text-sm md:text-lg px-2 py-1 sm:px-4 sm:py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                返回首頁
              </button>
            </div>
          </div>
        </div>

        {/* 模態框和錯誤訊息 */}
        <CenteredModal
          isOpen={showAddEventModal}
          onClose={() => {
            setShowAddEventModal(false);
            setNewEventName("");
          }}
          title={isEditing ? "編輯題目" : "新增題目"}
          onSubmit={handleAddEvent}
          inputValue={newEventName}
          setInputValue={setNewEventName}
          inputQValue={numQuestions}
          setInputQValue={setNumQuestions}
          desc={desc}
          setDesc={setDesc}
          showCancelButton={true}
        />

        <CenteredModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="編輯活動"
          onSubmit={handleEditSubmit}
          inputValue={editEventName}
          setInputValue={() => {}} // 名稱鎖定，不能改
          inputQValue={editNumQuestions}
          setInputQValue={setEditNumQuestions}
          desc={editDesc}
          setDesc={setEditDesc}
          showCancelButton
          submitText="儲存"
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex-shrink-0">
            {error}
          </div>
        )}

        {/* 主要內容區域 */}
        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0 ">
          {/* 左側活動列表區域 */}

          {/* 活動列表 - 佔用剩餘空間 */}
          <div className="bg-white  md:w-1/3 rounded-lg shadow-md p-6 ">
            <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center flex-shrink-0">
              📋 所有活動
              <span className="ml-2 text-sm text-gray-500">
                ({events.length})
              </span>
            </h2>

            {/* 滾動內容區域 */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loadingEvents ? (
                <div className="flex-1 flex items-center justify-center">
                  <RecycleLoader text="載入活動資料..." />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>目前沒有任何活動</p>
                  <p className="text-sm mt-2">建立新活動後會顯示在這裡</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map((eventName) => (
                    <div className="flex flex-col">
                      <div
                        key={eventName}
                        onClick={() => handleEventSelect(eventName)}
                        className={`text-sm md:text-base p-3 rounded-lg cursor-pointer transition-all border-2 flex flex-col items-center sm:flex-row justify-between
                    ${
                      selectedEvent === eventName
                        ? "bg-blue-100 border-blue-300 shadow-md"
                        : "bg-black/5 border-transparent hover:bg-blue-50 hover:border-blue-200"
                    }`}
                      >
                        <div className="text-center sm:text-left">
                          <div className="font-medium text-gray-800">
                            {eventName}
                          </div>
                          <div className="text-xs md:text-sm text-gray-500 mt-1">
                            點擊查看詳情
                          </div>
                        </div>
                      </div>
                      {selectedEvent === eventName && (
                        <div className="flex flex-row justify-between mt-1 gap-2">
                          <button
                            onClick={() => openEdit(eventName)}
                            className="flex-1 px-2 py-2 bg-orange-400 text-white text-xs md:text-sm rounded-md hover:bg-orange-600 transition-colors flex items-center justify-center gap-1"
                          >
                            編輯
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateQRCode(selectedEvent, "one");
                            }}
                            className="flex-1 px-2 py-2 bg-blue-500 text-white text-xs md:text-sm rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                            title="生成 QR Code"
                          >
                            <span>網址</span>
                          </button>
                          <button
                            onClick={() =>
                              handleShowDetailedAnalytics(selectedEvent)
                            }
                            className="flex-1 px-2 py-2 bg-purple-500 text-white text-xs md:text-sm rounded-md hover:bg-purple-600 transition-colors flex items-center justify-center gap-1"
                          >
                            詳細資料
                          </button>
                          <QRCodeModal
                            isOpen={showQRModal}
                            onClose={() => setShowQRModal(false)}
                            eventName={qrEventName}
                            eventUrl={generateEventUrl(
                              qrEventName,
                              qrEventType
                            )}
                            eventType={qrEventType}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右側詳細資訊區域 */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-6 flex-col min-h-0 hidden md:flex">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-lg md:text-xl font-semibold">
                {selectedEvent ? `📊 ${selectedEvent}` : "請選擇活動"}
              </h2>
              {selectedEvent && (
                <button
                  onClick={() => handleShowDetailedAnalytics(selectedEvent)}
                  className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                >
                  詳細資料
                </button>
              )}
            </div>

            {/* 右側內容區域 - 可滾動 */}
            <div className="flex-1 min-h-0 flex-col hidden md:flex">
              {!selectedEvent ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🎯</div>
                  <p className="text-lg">請從左側列表選擇一個活動</p>
                  <p className="text-sm mt-2">
                    選擇後可查看該活動的參與者資料與答題狀況
                  </p>
                </div>
              ) : isLoading ? (
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
                <div className="space-y-6 flex flex-col flex-1 min-h-0 ">
                  {/* 統計數據 */}
                  <div className="flex w-full justify-between items-center gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center flex-1">
                      <div className="text-2xl font-bold text-blue-600">
                        {participantCount}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">
                        總人數
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center flex-1">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(
                          participants.reduce(
                            (sum, p) => sum + (p.score || 0),
                            0
                          ) / participants.length
                        ) || 0}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">
                        平均分數
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center flex-1">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.max(...participants.map((p) => p.score || 0))}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">
                        最高分數
                      </div>
                    </div>
                  </div>

                  {/* 參與者表格 */}
                  <div className="bg-white rounded-lg shadow overflow-hidden flex-col flex-1 min-h-0 hidden md:flex">
                    {/* 表頭 */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                      <h3 className="text-lg font-medium text-gray-900">
                        參與者列表 ({participants.length} 人)
                      </h3>
                    </div>
                    <div className="flex-1 overflow-hidden flex">
                      <div className="overflow-x-auto  overflow-y-auto flex-1">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                                參與者
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell sm:px-6">
                                基本資料
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                                成績
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell sm:px-6">
                                完成時間
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {participants.map((participant) => (
                              <tr
                                key={participant.id}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 flex-shrink-0">
                                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <GenderIcon
                                          gender={participant.gender}
                                        />
                                      </div>
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900">
                                        {participant.playerName ||
                                          participant.id}
                                      </div>
                                      <div className="sm:hidden text-xs text-gray-500">
                                        {participant.gender || "未知"} •{" "}
                                        {handleAgeRange(participant.age) ||
                                          "未知"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell sm:px-6">
                                  <div>
                                    <div>{participant.gender}</div>
                                    <div className="text-xs">
                                      {handleAgeRange(participant.age) ||
                                        "未知"}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                                  <div className="flex flex-col sm:flex-row sm:items-center">
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                      {participant.score || 0} 分
                                    </span>
                                    <div className="md:hidden text-xs text-gray-500 mt-1">
                                      {formatTimestamp(participant.timestamp)}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell sm:px-6">
                                  {formatTimestamp(participant.timestamp)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPanel;
