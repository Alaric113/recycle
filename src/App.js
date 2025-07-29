import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, addDoc, deleteDoc, getDocs } from 'firebase/firestore';

// 引入自定義 CSS，其中包含拖曳時的固定定位和陰影等樣式
import './index.css';

// --- 預設遊戲設定 ---
const TRASH_TYPES = {
  PAPER: '紙類',
  PAPER_CONTAINER: '紙容器',
  PLASTIC: '塑膠',
  GLASS: '玻璃',
  METAL_CAN: '鐵鋁罐',
  ORGANIC: '廚餘',
  GENERAL: '一般垃圾',
  BATTERY: '廢電池',
};

// 預設的題目，只在 Firestore 為空時使用
const DEFAULT_TRASH_ITEMS = [
  { type: TRASH_TYPES.PAPER, emoji: '🗞️', id: 'p1' },
  { type: TRASH_TYPES.PAPER, emoji: '📦', id: 'p2' },
  { type: TRASH_TYPES.PAPER_CONTAINER, emoji: '🧃', id: 'pc1' },
  { type: TRASH_TYPES.PLASTIC, emoji: '🥤', id: 'pl1' },
  { type: TRASH_TYPES.PLASTIC, emoji: '🛍️', id: 'pl2' },
  { type: TRASH_TYPES.GLASS, emoji: '🍾', id: 'g1' },
  { type: TRASH_TYPES.GLASS, emoji: '💡', id: 'g2' },
  { type: TRASH_TYPES.METAL_CAN, emoji: '🥫', id: 'm1' },
  { type: TRASH_TYPES.ORGANIC, emoji: '🍌', id: 'o1' },
  { type: TRASH_TYPES.GENERAL, emoji: '🗑️', id: 'ge1' },
  { type: TRASH_TYPES.BATTERY, emoji: '🔋', id: 'b1' },
];

// Define default emojis for bins based on TRASH_TYPES for cleaner bin rendering
const BIN_EMOJIS = {
  [TRASH_TYPES.PAPER]: '🧻', // Changed from '' to a more fitting emoji
  [TRASH_TYPES.PAPER_CONTAINER]: '📦',
  [TRASH_TYPES.PLASTIC]: '🧴',
  [TRASH_TYPES.GLASS]: '🍾',
  [TRASH_TYPES.METAL_CAN]: '🥫',
  [TRASH_TYPES.ORGANIC]: '🍎',
  [TRASH_TYPES.GENERAL]: '🗑️',
  [TRASH_TYPES.BATTERY]: '🔋',
};

const ITEMS_PER_ROUND = 10;

// --- 輔助函式 ---
/**
 * 隨機打亂陣列的順序
 * @param {Array} array - 要打亂的陣列
 * @returns {Array} 打亂後的陣列
 */
const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

/**
 * 通用模態框組件，用於取代 alert 和 confirm
 * @param {object} props - 組件屬性
 * @param {boolean} props.isOpen - 模態框是否開啟
 * @param {function} props.onClose - 關閉模態框的回調函數 (用於取消或確認後關閉)
 * @param {string} props.title - 模態框標題
 * @param {string} props.message - 模態框內容訊息
 * @param {function} [props.onConfirm] - 確認按鈕的回調函數 (如果提供，則顯示確認按鈕)
 * @param {string} [props.confirmText='確認'] - 確認按鈕的文字
 * @param {string} [props.cancelText='取消'] - 取消按鈕的文字
 */
const Modal = ({ isOpen, onClose, title, message, onConfirm, confirmText = '確認', cancelText = '取消' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-white text-center">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <p className="mb-6 text-lg">{message}</p>
        <div className="flex justify-center gap-4">
          {onConfirm && (
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className="px-6 py-2 bg-green-600 rounded-full hover:bg-green-700 transition-colors shadow-md"
            >
              {confirmText}
            </button>
          )}
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-full transition-colors shadow-md ${onConfirm ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 分數顯示板組件
 * @param {object} props - 組件屬性
 * @param {number} props.score - 當前分數
 * @param {number} props.itemsLeft - 剩餘物品數量
 */
const Scoreboard = ({ score, itemsLeft }) => (
  <div className="absolute top-4 left-4 right-4 flex justify-between text-white text-2xl font-bold z-20 p-2 bg-black bg-opacity-30 rounded-lg">
    <div>分數: {score}</div>
    <div>剩餘物品: {itemsLeft}</div>
  </div>
);

/**
 * 開始畫面組件
 * @param {object} props - 組件屬性
 * @param {function} props.onStart - 點擊開始遊戲的回調函數
 * @param {function} props.onGoToAdmin - 點擊管理題目回調函數
 * @param {string} props.userId - 當前使用者的 ID
 */
const StartScreen = ({ onStart, onGoToAdmin, userId }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-4">
    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">資源回收小遊戲</h1>
    <p className="text-xl md:text-2xl text-white mb-8 drop-shadow">將平台上的垃圾拖到正確的回收桶進行分類！</p>
    <button
      onClick={onStart}
      className="px-8 py-4 bg-green-500 text-white font-bold rounded-full text-3xl shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 mb-6 border-b-4 border-green-700 hover:border-green-600"
    >
      開始遊戲
    </button>
    <button
      onClick={onGoToAdmin}
      className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-full text-lg shadow-md hover:bg-gray-700 active:bg-gray-800 transition-all duration-200 border-b-2 border-gray-800 hover:border-gray-700"
    >
      管理題目
    </button>
    {userId && (
      <p className="text-sm text-gray-300 mt-4">
        您的使用者 ID: <span className="font-mono text-yellow-300 break-all">{userId}</span>
      </p>
    )}
  </div>
);

/**
 * 回合結束畫面組件
 * @param {object} props - 組件屬性
 * @param {number} props.score - 本回合得分
 * @param {function} props.onRestart - 點擊再玩一回合的回調函數
 */
const RoundCompleteScreen = ({ score, onRestart }) => (
  <div className="flex flex-col items-center justify-center h-full bg-black bg-opacity-50 text-center p-4">
    <h2 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">分類完成！</h2>
    <p className="text-3xl text-white mb-8 drop-shadow">本回合得分: {score}</p>
    <button
      onClick={onRestart}
      className="px-8 py-4 bg-blue-500 text-white font-bold rounded-full text-3xl shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 border-b-4 border-blue-700 hover:border-blue-600"
    >
      再玩一回合
    </button>
  </div>
);

/**
 * 平台上的垃圾項目組件 (可拖曳)
 * @param {object} props - 組件屬性
 * @param {object} props.item - 垃圾項目物件 { type, emoji, id }
 * @param {function} props.onDragStart - 拖曳開始時的回調函數 (桌面)
 * @param {function} props.onTouchStart - 觸摸開始時的回調函數 (行動裝置)
 * @param {function} props.onTouchMove - 觸摸移動時的回調函數 (行動裝置)
 * @param {function} props.onTouchEnd - 觸摸結束時的回調函數 (行動裝置)
 */
const TrashItem = ({ item, onDragStart, onTouchStart, onTouchMove, onTouchEnd }) => (
  <div
    draggable // 允許桌面拖曳
    onDragStart={(e) => onDragStart(e, item)}
    onTouchStart={(e) => onTouchStart(e, item)} // 行動裝置觸摸開始
    onTouchMove={onTouchMove} // 行動裝置觸摸移動
    onTouchEnd={onTouchEnd} // 行動裝置觸摸結束
    // Tailwind class 和自定義 class (用於拖曳視覺回饋)
    className="text-6xl cursor-grab p-2 sm:p-4 bg-white/20 rounded-lg shadow-md hover:bg-white/40 transition-colors flex items-center justify-center aspect-square trash-item"
    style={{ touchAction: 'none' }} // 防止瀏覽器預設的觸摸行為干擾拖曳
    id={`trash-item-${item.id}`} // 為觸摸事件提供唯一的 ID 參考
  >
    {item.emoji}
  </div>
);

/**
 * 回收桶組件 (可放置拖曳項目)
 * @param {object} props - 組件屬性
 * @param {object} props.bin - 回收桶物件 { type, emoji }
 * @param {function} props.onDrop - 放置項目時的回調函數 (桌面)
 * @param {function} props.onDragOver - 拖曳項目經過時的回調函數 (桌面)
 * @param {function} props.onTouchEnd - 觸摸結束時的回調函數 (行動裝置，用於判斷放置)
 */
const Bin = ({ bin, onDrop, onDragOver, onTouchEnd }) => (
  <div
    onDrop={(e) => onDrop(e, bin.type)} // 桌面放置
    onDragOver={onDragOver} // 桌面拖曳經過
    onTouchEnd={(e) => onTouchEnd(e, bin.type)} // 行動裝置觸摸結束時判斷是否放置
    // Tailwind class 和自定義 class (用於 hover 視覺回饋)
    className="flex flex-col items-center justify-center flex-1 min-w-[100px] max-w-[150px] h-28 sm:h-32 bg-white bg-opacity-20 rounded-lg border-2 border-dashed border-white p-1 transform transition-transform hover:scale-105 active:scale-95 duration-150 text-black bin"
    id={`bin-${bin.type}`} // 為觸摸事件提供唯一的 ID 參考
  >
    <div className="text-4xl sm:text-5xl">{bin.emoji}</div>
    <div className="text-black font-semibold mt-1 text-center text-xs sm:text-base leading-tight">{bin.type}</div>
  </div>
);

/**
 * 主要遊戲組件
 * @param {object} props - 組件屬性
 * @param {function} props.onGameEnd - 遊戲結束時的回調函數
 * @param {Array<object>} props.allTrashItems - 所有可用的垃圾題目列表
 */
const Game = ({ onGameEnd, allTrashItems }) => {
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, message: '', color: '' });
  const [isInitialized, setIsInitialized] = useState(false);
  const draggedItemRef = useRef(null); // Ref to store the currently dragged DOM element for touch
  const currentDraggedItem = useRef(null); // Ref to store the data of the currently dragged item for touch

  // 根據 TRASH_TYPES 和 BIN_EMOJIS 定義回收桶
  const BINS = Object.values(TRASH_TYPES).map(type => ({
    type,
    emoji: BIN_EMOJIS[type] || '🗑️' // Fallback emoji if not defined
  }));

  // 清理拖曳項目位置，在組件卸載或拖曳結束時
  useEffect(() => {
    return () => {
      if (draggedItemRef.current) {
        draggedItemRef.current.style.position = '';
        draggedItemRef.current.style.left = '';
        draggedItemRef.current.style.top = '';
        draggedItemRef.current.style.width = '';
        draggedItemRef.current.style.height = '';
        draggedItemRef.current.classList.remove('dragging');
      }
    };
  }, []);

  // 初始化遊戲：從所有題目中隨機選取 ITEMS_PER_ROUND 個作為本回合題目
  useEffect(() => {
    if (allTrashItems.length === 0) {
      // 如果沒有自訂題目，使用預設題目
      const roundItems = shuffleArray([...DEFAULT_TRASH_ITEMS]).slice(0, ITEMS_PER_ROUND);
      setItems(roundItems);
    } else {
      const roundItems = shuffleArray([...allTrashItems]).slice(0, ITEMS_PER_ROUND);
      setItems(roundItems);
    }
    setScore(0); // 重置分數
    setIsInitialized(true);
  }, [allTrashItems]); // 依賴 allTrashItems 確保題目更新時重新初始化

  // 檢查遊戲是否結束
  useEffect(() => {
    // 確保遊戲已經初始化並且所有物品都已分類完畢
    if (isInitialized && items.length === 0) {
      const timer = setTimeout(() => {
        onGameEnd(score);
      }, feedback.show ? 1500 : 0); // 如果有反饋，等待反饋消失
      return () => clearTimeout(timer);
    }
  }, [items, score, onGameEnd, isInitialized, feedback.show]);

  /**
   * 顯示遊戲反饋訊息 (正確/錯誤)
   * @param {string} message - 要顯示的訊息
   * @param {boolean} isCorrect - 是否為正確操作
   */
  const showFeedback = useCallback((message, isCorrect) => {
    setFeedback({ show: true, message, color: isCorrect ? 'bg-green-500' : 'bg-red-500' });
    setTimeout(() => {
      setFeedback({ show: false, message: '', color: '' });
    }, 1500); // 訊息顯示 1.5 秒
  }, []);

  /**
   * 處理拖曳開始事件 (桌面滑鼠拖曳)
   * @param {DragEvent} e - 拖曳事件物件
   * @param {object} item - 被拖曳的垃圾項目
   */
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('trashInfo', JSON.stringify(item));
    currentDraggedItem.current = item; // 儲存項目資料
    // 為桌面拖曳添加視覺回饋 class (在 index.css 中定義)
    e.currentTarget.classList.add('dragging');
    draggedItemRef.current = e.currentTarget; // 儲存 DOM 元素參考
  };

  /**
   * 處理拖曳經過事件 (阻止預設行為以允許放置)
   * @param {DragEvent} e - 拖曳事件物件
   */
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  /**
   * 處理放置事件 (桌面滑鼠拖曳和行動裝置觸摸拖曳共用)
   * @param {DragEvent|TouchEvent} e - 放置事件物件
   * @param {string} binType - 目標回收桶的類型
   */
  const handleDrop = useCallback((e, binType) => {
    e.preventDefault();

    let trashInfo;
    if (e.type === 'drop') { // 桌面拖曳結束
      trashInfo = JSON.parse(e.dataTransfer.getData('trashInfo'));
      // 移除桌面拖曳的視覺回饋 class
      if (draggedItemRef.current) {
        draggedItemRef.current.classList.remove('dragging');
        draggedItemRef.current = null;
        currentDraggedItem.current = null;
      }
    } else if (e.type === 'touchend') { // 行動裝置觸摸拖曳結束
      trashInfo = currentDraggedItem.current; // 從 ref 獲取項目資料
      // 重置行動裝置拖曳的定位和移除視覺回饋 class
      if (draggedItemRef.current) {
        draggedItemRef.current.style.position = '';
        draggedItemRef.current.style.left = '';
        draggedItemRef.current.style.top = '';
        draggedItemRef.current.style.width = '';
        draggedItemRef.current.style.height = '';
        draggedItemRef.current.classList.remove('dragging');
        draggedItemRef.current = null;
        currentDraggedItem.current = null;
      }
      if (!trashInfo) return; // 如果沒有拖曳中的項目，則直接返回
    }

    if (trashInfo.type === binType) {
      setScore(prev => prev + 10);
      showFeedback('分類正確！+10分', true);
    } else {
      setScore(prev => prev - 5);
      const correctBinMessage = `分錯囉！${trashInfo.emoji} 應該是「${trashInfo.type}」`;
      showFeedback(correctBinMessage, false);
    }

    setItems(prev => prev.filter(item => item.id !== trashInfo.id));
  }, [showFeedback]);

  // --- 行動裝置拖曳處理函式 ---

  /**
   * 處理觸摸開始事件 (行動裝置拖曳開始)
   * @param {TouchEvent} e - 觸摸事件物件
   * @param {object} item - 被拖曳的垃圾項目
   */
  const handleTouchStart = useCallback((e, item) => {
    e.preventDefault(); // 防止預設行為，如頁面滾動

    currentDraggedItem.current = item; // 儲存當前拖曳的項目資料
    draggedItemRef.current = e.currentTarget; // 儲存當前拖曳的 DOM 元素參考

    // 獲取元素初始位置和尺寸
    const rect = draggedItemRef.current.getBoundingClientRect();
    // 將元素設為固定定位，使其脫離文檔流並跟隨觸摸
    draggedItemRef.current.style.position = 'fixed';
    draggedItemRef.current.style.left = `${rect.left}px`;
    draggedItemRef.current.style.top = `${rect.top}px`;
    draggedItemRef.current.style.width = `${rect.width}px`;
    draggedItemRef.current.style.height = `${rect.height}px`;
    // 添加拖曳視覺回饋 class (在 index.css 中定義)
    draggedItemRef.current.classList.add('dragging');
  }, []);

  /**
   * 處理觸摸移動事件 (行動裝置拖曳中)
   * @param {TouchEvent} e - 觸摸事件物件
   */
  const handleTouchMove = useCallback((e) => {
    if (!draggedItemRef.current || !currentDraggedItem.current) return;

    e.preventDefault(); // 防止頁面滾動

    const touch = e.touches[0]; // 獲取第一個觸摸點
    // 更新拖曳項目位置，使其跟隨觸摸點
    draggedItemRef.current.style.left = `${touch.clientX - draggedItemRef.current.offsetWidth / 2}px`;
    draggedItemRef.current.style.top = `${touch.clientY - draggedItemRef.current.offsetHeight / 2}px`;

    // 檢查是否在回收桶上方並添加視覺回饋
    BINS.forEach(bin => {
      const binElement = document.getElementById(`bin-${bin.type}`);
      if (binElement) {
        const binRect = binElement.getBoundingClientRect();
        if (
          touch.clientX > binRect.left &&
          touch.clientX < binRect.right &&
          touch.clientY > binRect.top &&
          touch.clientY < binRect.bottom
        ) {
          binElement.classList.add('hovered-bin'); // 添加 hover 效果 class
        } else {
          binElement.classList.remove('hovered-bin');
        }
      }
    });
  }, [BINS]);

  /**
   * 處理觸摸結束事件 (行動裝置拖曳結束)
   * @param {TouchEvent} e - 觸摸事件物件
   * @param {string} [binType] - 如果是從 Bin 組件觸發，則為回收桶類型
   */
  const handleTouchEnd = useCallback((e) => {
    if (!draggedItemRef.current || !currentDraggedItem.current) return;

    const touch = e.changedTouches[0]; // 獲取觸摸結束的點
    let droppedInBinType = null;

    // 判斷拖曳項目是否放置在任何回收桶上方
    for (const bin of BINS) {
      const binElement = document.getElementById(`bin-${bin.type}`);
      if (binElement) {
        binElement.classList.remove('hovered-bin'); // 移除所有回收桶的 hover 效果
        const binRect = binElement.getBoundingClientRect();
        if (
          touch.clientX > binRect.left &&
          touch.clientX < binRect.right &&
          touch.clientY > binRect.top &&
          touch.clientY < binRect.bottom
        ) {
          droppedInBinType = bin.type; // 找到放置的回收桶類型
          break;
        }
      }
    }

    if (droppedInBinType) {
      // 如果放置在回收桶上，調用 handleDrop 處理邏輯
      handleDrop(e, droppedInBinType);
    } else {
      // 如果沒有放置在任何回收桶上，則扣分並移除項目
      setScore(prev => prev - 5);
      showFeedback(`沒有分到回收桶裡，扣5分！`, false);
      setItems(prev => prev.filter(item => item.id !== currentDraggedItem.current.id));
    }

    // 清理拖曳狀態
    if (draggedItemRef.current) {
      draggedItemRef.current.style.position = '';
      draggedItemRef.current.style.left = '';
      draggedItemRef.current.style.top = '';
      draggedItemRef.current.style.width = '';
      draggedItemRef.current.style.height = '';
      draggedItemRef.current.classList.remove('dragging');
    }
    draggedItemRef.current = null;
    currentDraggedItem.current = null;
  }, [BINS, handleDrop, showFeedback]);


  return (
    <div className="relative w-full h-full flex flex-col justify-between p-2 sm:p-4">
      <Scoreboard score={score} itemsLeft={items.length} />
      {feedback.show && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 rounded-lg text-white font-bold text-lg sm:text-2xl z-30 text-center transition-opacity duration-300 ${feedback.color} ${feedback.show ? 'opacity-100' : 'opacity-0'}`}>
          {feedback.message}
        </div>
      )}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 p-4 bg-black/20 rounded-xl max-w-full overflow-auto">
          {items.length > 0 ? (
            items.map(item => (
              <TrashItem
                key={item.id}
                item={item}
                onDragStart={handleDragStart}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd} // 修正：傳遞 handleTouchEnd
              />
            ))
          ) : (
            <div className="col-span-3 sm:col-span-5 text-center text-white text-xl p-8">
              {isInitialized ? '所有物品已分類！' : '加載物品中...'}
            </div>
          )}
        </div>
      </div>
      {/* 調整回收桶容器的樣式，使用 flex-wrap 和 justify-center */}
      <div className="flex flex-wrap justify-center items-center p-2 bg-black/30 rounded-xl gap-2 sm:gap-4">
        {BINS.map(bin => (
          <Bin
            key={bin.type}
            bin={bin}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onTouchEnd={handleTouchEnd} // 修正：傳遞 handleTouchEnd
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 管理者介面組件，用於新增、編輯和刪除垃圾題目
 * @param {object} props - 組件屬性
 * @param {Array<object>} props.items - 當前所有垃圾題目列表
 * @param {function} props.setItems - 更新垃圾題目列表的回調函數 (現在會觸發 Firestore 更新)
 * @param {function} props.onGoToGame - 返回遊戲畫面的回調函數
 * @param {object} props.db - Firestore 實例
 * @param {string} props.appId - 應用程式 ID
 */
const AdminPanel = ({ items, setItems, onGoToGame, db, appId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState({ id: null, emoji: '', type: TRASH_TYPES.PAPER });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  // 獲取 Firestore 集合的引用
  const itemsCollectionRef = collection(db, `artifacts/${appId}/public/data/recyclingGameItems`);

  /**
   * 處理編輯按鈕點擊
   * @param {object} item - 要編輯的垃圾項目
   */
  const handleEditClick = (item) => {
    setIsEditing(true);
    setCurrentItem(item);
  };

  /**
   * 處理刪除按鈕點擊，彈出確認模態框
   * @param {string} id - 要刪除的項目 ID
   */
  const handleDeleteClick = (id) => {
    setModalMessage('確定要刪除這個題目嗎？');
    setConfirmAction(() => async () => {
      try {
        await deleteDoc(doc(db, itemsCollectionRef.path, id));
        // onSnapshot 會自動更新 items 狀態，這裡不需要手動 setItems
      } catch (error) {
        console.error("刪除題目失敗:", error);
        setModalMessage(`刪除題目失敗: ${error.message}`);
        setShowAlertDialog(true);
      }
    });
    setShowConfirmModal(true);
  };

  /**
   * 處理表單輸入變化
   * @param {Event} e - 事件物件
   */
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  /**
   * 處理表單提交 (新增或更新題目)
   * @param {Event} e - 事件物件
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentItem.emoji.trim()) {
      setModalMessage('Emoji 欄位不能為空！');
      setShowAlertDialog(true);
      return;
    }

    try {
      if (isEditing) {
        // 更新現有文件
        await setDoc(doc(db, itemsCollectionRef.path, currentItem.id), {
          emoji: currentItem.emoji,
          name: currentItem.name,
          type: currentItem.type,
        }, { merge: true }); // 使用 merge: true 以免覆蓋其他欄位
      } else {
        // 新增文件，Firestore 會自動生成 ID
        await addDoc(itemsCollectionRef, {
          emoji: currentItem.emoji,
          name: currentItem.name,
          type: currentItem.type,
        });
      }
      // onSnapshot 會自動更新 items 狀態，這裡不需要手動 setItems
    } catch (error) {
      console.error("儲存題目失敗:", error);
      setModalMessage(`儲存題目失敗: ${error.message}`);
      setShowAlertDialog(true);
    }

    // 重設表單
    setIsEditing(false);
    setCurrentItem({ id: null, emoji: '', type: TRASH_TYPES.PAPER });
  };

  /**
   * 取消編輯狀態並重設表單
   */
  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentItem({ id: null, emoji: '', type: TRASH_TYPES.PAPER });
  };

  return (
    <div className="p-4 sm:p-8 text-white w-full h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold drop-shadow-lg">管理題目</h1>
          <button onClick={onGoToGame} className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors shadow-md">返回遊戲</button>
        </div>

        {/* 新增/編輯表單 */}
        <div className="bg-white/20 p-6 rounded-lg mb-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">{isEditing ? '編輯題目' : '新增題目'}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-auto">
              <label htmlFor="emoji" className="block mb-1 font-semibold">Emoji 圖示</label>
              <input
                type="text"
                id="emoji"
                name="emoji"
                value={currentItem.emoji}
                onChange={handleFormChange}
                className="w-full p-2 rounded bg-gray-800 text-white text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：🥤"
                maxLength="2"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label htmlFor="name" className="block mb-1 font-semibold">物品名稱</label>
              <input
                type="text"
                id="emoji"
                name="emoji"
                value={currentItem.emoji}
                onChange={handleFormChange}
                className="w-full p-2 rounded bg-gray-800 text-white text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：食物包裝紙"
                maxLength="2"
              />
            </div>
            <div className="w-full sm:w-auto flex-grow">
              <label htmlFor="type" className="block mb-1 font-semibold">分類</label>
              <select
                id="type"
                name="type"
                value={currentItem.type}
                onChange={handleFormChange}
                className="w-full p-2 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(TRASH_TYPES).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-6 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors shadow-md">{isEditing ? '更新' : '新增'}</button>
              {isEditing && <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-500 rounded hover:bg-gray-600 transition-colors shadow-md">取消</button>}
            </div>
          </form>
        </div>

        {/* 題目列表 */}
        <div>
          <h2 className="text-2xl font-bold mb-4 drop-shadow-lg">現有題目列表</h2>
          <div className="space-y-2">
            {items.length > 0 ? (
              items.map(item => (
                <div key={item.id} className="bg-white/10 p-3 rounded-lg flex justify-between items-center shadow-sm hover:bg-white/15 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{item.emoji}</span>
                    <span className="font-semibold text-lg">{item.type}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(item)} className="px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600 transition-colors">編輯</button>
                    <button onClick={() => handleDeleteClick(item.id)} className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 transition-colors">刪除</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 text-lg p-8 bg-white/10 rounded-lg">
                目前沒有自訂題目，請新增。
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 確認模態框 */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="確認操作"
        message={modalMessage}
        onConfirm={confirmAction}
        confirmText="確定"
        cancelText="取消"
      />

      {/* 提示模態框 */}
      <Modal
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        title="提示"
        message={modalMessage}
        cancelText="了解"
      />
    </div>
  );
};


/**
 * 主應用程式組件，管理遊戲的不同視圖
 */
export default function App() {
  const [view, setView] = useState('start');
  const [finalScore, setFinalScore] = useState(0);
  const [allTrashItems, setAllTrashItems] = useState([]);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false); // 標記 Firebase 認證是否就緒
  const [appId, setAppId] = useState(null);

  // Firebase 初始化和認證
  useEffect(() => {
    try {
      const firebaseConfig = {
        apiKey: "AIzaSyDUkrkOvDABCV0Ug1suZGmf43NuMDFeuI0", // <-- 請替換為您的實際 API Key
        authDomain: "recycle-76cf4.firebaseapp.com", // <-- 請替換為您的實際 Auth Domain
        projectId: "recycle-76cf4",   // <-- 請替換為您的實際 Project ID
        storageBucket: "recycle-76cf4.firebasestorage.app", // <-- 請替換為您的實際 Storage Bucket
        messagingSenderId: "1037683276646", // <-- 請替換為您的實際 Messaging Sender ID
        appId: "1:1037683276646:web:4e6449de76ee8bf29b26a7", // <-- 請替換為您的實際 App ID
        measurementId: "G-ZD9ZJNTQYP" // <-- 如果您啟用了 Analytics，請替換為實際 Measurement ID
      };

      // 使用 projectId 作為 appId，因為它在 Firebase Console 中是唯一的
      const currentAppId = firebaseConfig.projectId;

      setAppId(currentAppId);

      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authInstance = getAuth(app);

      setDb(firestore);
      setAuth(authInstance);

      // 監聽認證狀態變化
      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (!user) {
          // 如果沒有用戶，嘗試匿名登入
          await signInAnonymously(authInstance);
        }
        // 設定 userId，確保即使匿名登入也有 ID
        setUserId(authInstance.currentUser?.uid || crypto.randomUUID());
        setIsAuthReady(true); // 認證就緒
      });

      return () => unsubscribe(); // 清理認證監聽器
    } catch (error) {
      console.error("Firebase 初始化失敗:", error);
    }
  }, []); // 空依賴陣列確保只執行一次

  // 從 Firestore 獲取題目並監聽即時更新
  useEffect(() => {
    if (db && isAuthReady && appId) {
      const itemsCollectionRef = collection(db, `artifacts/${appId}/public/data/recyclingGameItems`);

      const unsubscribe = onSnapshot(itemsCollectionRef, async (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (itemsData.length === 0) {
          // 如果 Firestore 中沒有題目，則初始化預設題目
          console.log("Firestore 中沒有題目，初始化預設題目...");
          // 再次檢查集合是否真的為空，避免重複添加
          const existingDocsCheck = await getDocs(itemsCollectionRef);
          if (existingDocsCheck.empty) {
            for (const item of DEFAULT_TRASH_ITEMS) {
              // 使用 setDoc 並指定 ID，確保冪等性
              await setDoc(doc(db, itemsCollectionRef.path, item.id), item);
            }
            // 重新獲取一次，確保預設題目被加載
            const updatedSnapshot = await getDocs(itemsCollectionRef);
            setAllTrashItems(updatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        } else {
          setAllTrashItems(itemsData);
        }
      }, (error) => {
        console.error("監聽 Firestore 題目失敗:", error);
      });

      return () => unsubscribe(); // 清理 Firestore 監聽器
    }
  }, [db, isAuthReady, appId]); // 依賴 db 和 isAuthReady

  /**
   * 遊戲結束時的回調函數
   * @param {number} score - 遊戲結束時的最終分數
   */
  const handleGameEnd = useCallback((score) => {
    setFinalScore(score);
    setView('end');
  }, []);

  /**
   * 根據當前視圖狀態渲染不同的組件
   */
  const renderView = () => {
    // 只有當 Firebase 認證就緒且 db 實例可用時才渲染內容
    if (!isAuthReady || !db || !appId) {
      return (
        <div className="flex items-center justify-center h-full text-white text-3xl">
          載入中... 請稍候
        </div>
      );
    }

    switch (view) {
      case 'playing':
        return <Game onGameEnd={handleGameEnd} allTrashItems={allTrashItems} />;
      case 'end':
        return <RoundCompleteScreen score={finalScore} onRestart={() => setView('playing')} />;
      case 'admin':
        return <AdminPanel items={allTrashItems} setItems={setAllTrashItems} db={db} appId={appId} onGoToGame={() => setView('start')} />;
      case 'start':
      default:
        return <StartScreen onStart={() => setView('playing')} onGoToAdmin={() => setView('admin')} userId={userId} />;
    }
  };

  return (
    <main className="h-screen w-screen bg-gradient-to-b from-teal-500 to-cyan-800 font-sans overflow-hidden">
      {renderView()}
    </main>
  );
}