// --- File: src/components/Game.js ---
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scoreboard } from './GameUI';
import { TrashItem, Bin } from './DraggableItems';
import { shuffleArray } from '../utils';
import { TRASH_TYPES, BIN_EMOJIS, ITEMS_PER_ROUND, DEFAULT_TRASH_ITEMS } from '../constants';

/**
 * 主要遊戲組件
 */
const Game = ({ onGameEnd, allTrashItems }) => {
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, message: '', color: '' });
  const [isInitialized, setIsInitialized] = useState(false);
  const draggedItemRef = useRef(null);
  const currentDraggedItem = useRef(null);

  const BINS = (TRASH_TYPES && BIN_EMOJIS) ? Object.values(TRASH_TYPES).map(type => ({
    type,
    emoji: BIN_EMOJIS[type] || '🗑️'
  })) : [];

  // 初始化遊戲
  useEffect(() => {
    const sourceItems = allTrashItems.length > 0 ? allTrashItems : DEFAULT_TRASH_ITEMS;
    const roundItems = shuffleArray([...sourceItems]).slice(0, ITEMS_PER_ROUND);
    setItems(roundItems);
    setScore(0);
    setIsInitialized(true);
  }, [allTrashItems]);

  // 檢查遊戲是否結束
  useEffect(() => {
    if (isInitialized && items.length === 0) {
      const timer = setTimeout(() => {
        onGameEnd(score);
      }, feedback.show ? 1500 : 0);
      return () => clearTimeout(timer);
    }
  }, [items, score, onGameEnd, isInitialized, feedback.show]);
  


  // 清理拖曳樣式
  useEffect(() => {
    return () => {
      if (draggedItemRef.current) {
        draggedItemRef.current.classList.remove('dragging');
        draggedItemRef.current.style.position = '';
        draggedItemRef.current.style.left = '';
        draggedItemRef.current.style.top = '';
        draggedItemRef.current.style.width = '';
        draggedItemRef.current.style.height = '';
      }
    };
  }, []);

  const showFeedback = useCallback((message, isCorrect) => {
    setFeedback({ show: true, message, color: isCorrect ? 'bg-green-500' : 'bg-red-500' });
    setTimeout(() => setFeedback({ show: false, message: '', color: '' }), 1500);
  }, []);

  const handleDropLogic = useCallback((itemData, binType) => {
    if (itemData.type === binType) {
      setScore(prev => prev + 10);
      showFeedback('分類正確！+10分', true);
    } else {
      showFeedback(`分錯囉！${itemData.emoji} ${itemData.name} 應該是「${itemData.type}」`, false);
    }
    setItems(prev => prev.filter(item => item.id !== itemData.id));
  }, [showFeedback]);
  
  // --- 滑鼠拖曳事件 ---
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('trashInfo', JSON.stringify(item));
    e.currentTarget.classList.add('dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, binType) => {
    e.preventDefault();
    const trashInfo = JSON.parse(e.dataTransfer.getData('trashInfo'));
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    handleDropLogic(trashInfo, binType);
  };

  // --- 觸控拖曳事件 ---
  const handleTouchStart = useCallback((e, item) => {
    currentDraggedItem.current = item;
    const target = e.currentTarget;
    draggedItemRef.current = target;
    const rect = target.getBoundingClientRect();
    
    target.classList.add('dragging');
    target.style.position = 'fixed';
    target.style.width = `${rect.width}px`;
    target.style.height = `${rect.height}px`;
    target.style.left = `${e.touches[0].clientX - rect.width / 2}px`;
    target.style.top = `${e.touches[0].clientY - rect.height / 2}px`;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!draggedItemRef.current) return;
    const touch = e.touches[0];
    draggedItemRef.current.style.left = `${touch.clientX - draggedItemRef.current.offsetWidth / 2}px`;
    draggedItemRef.current.style.top = `${touch.clientY - draggedItemRef.current.offsetHeight / 2}px`;

    document.querySelectorAll('.bin').forEach(binEl => {
        const binRect = binEl.getBoundingClientRect();
        if (touch.clientX > binRect.left && touch.clientX < binRect.right && touch.clientY > binRect.top && touch.clientY < binRect.bottom) {
            binEl.classList.add('hovered-bin');
        } else {
            binEl.classList.remove('hovered-bin');
        }
    });
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!draggedItemRef.current || !currentDraggedItem.current) return;
    
    const touch = e.changedTouches[0];
    let droppedInBinType = null;

    document.querySelectorAll('.bin').forEach(binEl => {
        const binRect = binEl.getBoundingClientRect();
        if (touch.clientX > binRect.left && touch.clientX < binRect.right && touch.clientY > binRect.top && touch.clientY < binRect.bottom) {
            droppedInBinType = binEl.id.replace('bin-', '');
        }
        binEl.classList.remove('hovered-bin');
    });

    if (droppedInBinType) {
        handleDropLogic(currentDraggedItem.current, droppedInBinType);
    } else {
        // 如果沒有放到回收桶，可以選擇不處理或返回原位
        // 這裡我們選擇直接移除並提示
        showFeedback(`沒有分到回收桶裡！`, false);
        setItems(prev => prev.filter(item => item.id !== currentDraggedItem.current.id));
    }
    
    draggedItemRef.current.classList.remove('dragging');
    draggedItemRef.current.style.position = '';
    draggedItemRef.current = null;
    currentDraggedItem.current = null;

  }, [handleDropLogic, showFeedback]);

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
                onTouchEnd={handleTouchEnd}
              />
            ))
          ) : (
            <div className="col-span-3 sm:col-span-5 text-center text-white text-xl p-8">
              {isInitialized ? '所有物品已分類！' : '加載物品中...'}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap justify-center items-center p-2 bg-black/30 rounded-xl gap-2 sm:gap-4">
        {BINS.map(bin => (
          <Bin
            key={bin.type}
            bin={bin}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          />
        ))}
      </div>
    </div>
  );
};

export default Game;