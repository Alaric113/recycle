// --- File: src/components/DraggableItems.js ---
import React from 'react';

/**
 * 平台上的垃圾項目組件 (可拖曳)
 */
export const TrashItem = ({ item, onDragStart, onTouchStart, onTouchMove, onTouchEnd }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, item)}
    onTouchStart={(e) => onTouchStart(e, item)}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
    className="text-6xl cursor-grab p-2 sm:p-4 bg-white/20 rounded-lg shadow-md hover:bg-white/40 transition-colors flex flex-col items-center justify-center aspect-square trash-item"
    style={{ touchAction: 'none' }}
    id={`trash-item-${item.id}`}
  >
    {item.emoji}
    <span className='text-black text-2xl font-bold'>
      {item.name}
    </span>
  </div>
);

/**
 * 回收桶組件 (可放置拖曳項目)
 */
export const Bin = ({ bin, onDrop, onDragOver }) => (
  <div
    onDrop={(e) => onDrop(e, bin.type)}
    onDragOver={onDragOver}
    className="flex flex-col items-center justify-center flex-1 min-w-[100px] max-w-[150px] h-28 sm:h-32 bg-white bg-opacity-20 rounded-lg border-2 border-dashed border-white p-1 transform transition-transform hover:scale-105 active:scale-95 duration-150 text-black bin"
    id={`bin-${bin.type}`}
  >
    <div className="text-4xl sm:text-5xl">{bin.emoji}</div>
    <div className="text-black font-semibold mt-1 text-center text-xs sm:text-base leading-tight">{bin.type}</div>
  </div>
);