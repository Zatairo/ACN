const DIRECTIONS = [
  [0, 1], [1, 0], [1, 1], [1, -1],
  [0, -1], [-1, 0], [-1, 1], [-1, -1],
];

function canPlaceWord(grid, word, row, col, dir, size) {
  const [dr, dc] = dir;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    if (grid[r][c] !== null && grid[r][c] !== word[i]) return false;
  }
  return true;
}

function placeWord(grid, word, row, col, dir) {
  const [dr, dc] = dir;
  const cells = [];
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    grid[r][c] = word[i];
    cells.push({ row: r, col: c });
  }
  return cells;
}

export function generateWordSearch(words, gridSize = 14) {
  const cleanWords = words
    .map(w => w.toUpperCase().replace(/[^A-Z]/g, ''))
    .filter(w => w.length >= 3 && w.length <= gridSize);

  const size = Math.max(gridSize, ...cleanWords.map(w => w.length), 8);
  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  const placedWords = [];

  const sorted = [...cleanWords].sort((a, b) => b.length - a.length);

  for (const word of sorted) {
    let placed = false;
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      if (canPlaceWord(grid, word, row, col, dir, size)) {
        const cells = placeWord(grid, word, row, col, dir);
        placedWords.push({ word, cells });
        placed = true;
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
  }

  return { grid, words: placedWords, size };
}