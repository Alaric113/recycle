// --- File: src/utils.js ---
/*
  這個檔案存放通用的輔助函式。
  這些函式可以在應用程式的任何地方被重複使用。
*/

/**
 * 隨機打亂陣列的順序 (Fisher-Yates Shuffle Algorithm)
 * @param {Array} array - 要打亂的陣列
 * @returns {Array} 打亂後的陣列
 */
export const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };
  