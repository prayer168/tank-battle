class MapGenerator {
  generate(levelConfig) {
    const { brickDensity, steelDensity } = levelConfig;
    const map = [];

    for (let r = 0; r < MAP_ROWS; r++) {
      map.push([]);
      for (let c = 0; c < MAP_COLS; c++) {
        if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
          map[r].push(TILE.STEEL);
        } else {
          const rnd = Math.random();
          if      (rnd < brickDensity)                              map[r].push(TILE.BRICK);
          else if (rnd < brickDensity + steelDensity)               map[r].push(TILE.STEEL);
          else if (rnd < brickDensity + steelDensity + 0.05)        map[r].push(TILE.WATER);
          else if (rnd < brickDensity + steelDensity + 0.05 + 0.07) map[r].push(TILE.GRASS);
          else                                                       map[r].push(TILE.EMPTY);
        }
      }
    }

    // ── 玩家出生區：左下方 5×4 格，確保有足夠活動空間
    this._clearZone(map, 1, MAP_ROWS - 5, 5, 4);

    // ── 強制清空最後一條內部橫道（row = MAP_ROWS-2），確保底部可左右移動
    //    只移除磚牆/水域/草叢，保留鋼牆（鋼牆視覺效果保留，但阻擋依然存在）
    for (let c = 1; c < MAP_COLS - 1; c++) {
      if (map[MAP_ROWS - 2][c] !== TILE.STEEL) {
        map[MAP_ROWS - 2][c] = TILE.EMPTY;
      }
    }

    // ── 強制清空最後第二條內部橫道（row = MAP_ROWS-3），避免玩家從下方被完全封死
    for (let c = 1; c < MAP_COLS - 1; c++) {
      if (map[MAP_ROWS - 3][c] !== TILE.STEEL) {
        map[MAP_ROWS - 3][c] = TILE.EMPTY;
      }
    }

    // ── 敵人出生區：頂部三處各 3×2
    this._clearZone(map, 1, 1, 3, 2);
    this._clearZone(map, Math.floor(MAP_COLS / 2) - 1, 1, 3, 2);
    this._clearZone(map, MAP_COLS - 4, 1, 3, 2);

    return map;
  }

  _clearZone(map, startCol, startRow, w, h) {
    for (let r = startRow; r < Math.min(startRow + h, MAP_ROWS - 1); r++) {
      for (let c = startCol; c < Math.min(startCol + w, MAP_COLS - 1); c++) {
        map[r][c] = TILE.EMPTY;
      }
    }
  }

  // Returns world-space center of a tile
  static tileToWorld(col, row) {
    return {
      x: col * TILE_SIZE + TILE_SIZE / 2,
      y: HUD_HEIGHT + row * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  // Returns tile coords from world position
  static worldToTile(x, y) {
    return {
      col: Math.floor(x / TILE_SIZE),
      row: Math.floor((y - HUD_HEIGHT) / TILE_SIZE),
    };
  }
}
