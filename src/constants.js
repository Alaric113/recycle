// --- File: src/constants.js ---

// 垃圾分類類型
export const TRASH_TYPES = {
  PAPER: '紙類',
  PAPER_CONTAINER: '紙容器',
  PLASTIC: '塑膠',
  GLASS: '玻璃',
  METAL_CAN: '鐵鋁罐',
  ORGANIC: '廚餘',
  GENERAL: '一般垃圾',
  BATTERY: '廢電池',
};

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

// 題型類型
export const QUIZ_TYPES = {
  BIN_CLASSIFICATION: 'bin_classification',
  MULTIPLE_CHOICE: 'multiple_choice',
};

// 遊戲設定
export const ITEMS_PER_ROUND = 3;

// 預設測驗題目
export const DEFAULT_QUIZ_ITEMS = [
  {
    id: 'q1',
    type: QUIZ_TYPES.BIN_CLASSIFICATION,
    question: '這個物品該怎麼回收？',
    item: { emoji: '🗞️', name: '報紙' },
    correctAnswer: TRASH_TYPES.PAPER,
  },
  {
    id: 'q2', 
    type: QUIZ_TYPES.MULTIPLE_CHOICE,
    question: '廚餘分為養豬與堆肥廚餘',
    options: ['是', '否'],
    correctAnswer: '是',
  },
  {
    id: 'q3',
    type: QUIZ_TYPES.BIN_CLASSIFICATION,
    question: '這個物品該怎麼回收？',
    item: { emoji: '🥤', name: '塑膠杯' },
    correctAnswer: TRASH_TYPES.PLASTIC,
  }
];


