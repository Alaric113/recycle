// --- File: src/constants.js ---
/*
  這個檔案存放應用程式中所有不會改變的常數值。
  這樣做可以讓我們在一個地方管理這些設定，方便未來修改。
*/

// 定義所有垃圾的分類
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
  
  // 定義每個回收桶對應的表情符號
  export const BIN_EMOJIS = {
    [TRASH_TYPES.PAPER]: '🧻',
    [TRASH_TYPES.PAPER_CONTAINER]: '📦',
    [TRASH_TYPES.PLASTIC]: '🧴',
    [TRASH_TYPES.GLASS]: '🍾',
    [TRASH_TYPES.METAL_CAN]: '🥫',
    [TRASH_TYPES.ORGANIC]: '🍎',
    [TRASH_TYPES.GENERAL]: '🗑️',
    [TRASH_TYPES.BATTERY]: '🔋',
  };
  
  // 預設的題目，只在 Firestore 為空時使用
  export const DEFAULT_TRASH_ITEMS = [
    { type: TRASH_TYPES.PAPER, name: '報紙', emoji: '🗞️', id: 'p1' },
    { type: TRASH_TYPES.PAPER, name: '紙箱', emoji: '📦', id: 'p2' },
    { type: TRASH_TYPES.PAPER_CONTAINER, name: '鋁箔包', emoji: '🧃', id: 'pc1' },
    { type: TRASH_TYPES.PLASTIC, name: '塑膠杯', emoji: '🥤', id: 'pl1' },
    { type: TRASH_TYPES.PLASTIC, name: '購物袋', emoji: '🛍️', id: 'pl2' },
    { type: TRASH_TYPES.GLASS, name: '酒瓶', emoji: '🍾', id: 'g1' },
    { type: TRASH_TYPES.GLASS, name: '燈泡', emoji: '💡', id: 'g2' },
    { type: TRASH_TYPES.METAL_CAN, name: '罐頭', emoji: '🥫', id: 'm1' },
    { type: TRASH_TYPES.ORGANIC, name: '香蕉皮', emoji: '🍌', id: 'o1' },
    { type: TRASH_TYPES.GENERAL, name: '垃圾', emoji: '🗑️', id: 'ge1' },
    { type: TRASH_TYPES.BATTERY, name: '電池', emoji: '🔋', id: 'b1' },
  ];
  
  // 每回合的題目數量
  export const ITEMS_PER_ROUND = 10;
export {TRASH_TYPES}