// BFS: returns the [row, col] of the first step toward target, or null if unreachable
function bfsNextStep(mapData, startRow, startCol, targetRow, targetCol) {
  if (startRow === targetRow && startCol === targetCol) return null;

  const rows = MAP_ROWS;
  const cols = MAP_COLS;
  const visited = new Uint8Array(rows * cols);
  visited[startRow * cols + startCol] = 1;

  // Queue entries: [row, col, firstStepRow, firstStepCol]
  const queue = [];
  const neighbors = [[-1,0],[1,0],[0,-1],[0,1]];

  for (const [dr, dc] of neighbors) {
    const nr = startRow + dr;
    const nc = startCol + dc;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
    const cell = mapData[nr][nc];
    if (cell === TILE.STEEL || cell === TILE.WATER) continue;
    if (visited[nr * cols + nc]) continue;
    visited[nr * cols + nc] = 1;
    if (nr === targetRow && nc === targetCol) return [nr, nc];
    queue.push([nr, nc, nr, nc]);
  }

  let head = 0;
  while (head < queue.length) {
    const [row, col, fr, fc] = queue[head++];
    for (const [dr, dc] of neighbors) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const cell = mapData[nr][nc];
      if (cell === TILE.STEEL || cell === TILE.WATER) continue;
      if (visited[nr * cols + nc]) continue;
      visited[nr * cols + nc] = 1;
      if (nr === targetRow && nc === targetCol) return [fr, fc];
      queue.push([nr, nc, fr, fc]);
    }
  }
  return null;
}
