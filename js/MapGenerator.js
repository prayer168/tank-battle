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

    // Bottom two interior rows: always fully clear (player can never be
    // pinched between interior tiles and the border steel wall).
    for (let c = 1; c < MAP_COLS - 1; c++) {
      map[MAP_ROWS - 2][c] = TILE.EMPTY;
      map[MAP_ROWS - 3][c] = TILE.EMPTY;
    }

    // Player spawn zone: cols 1-8, rows MAP_ROWS-7 to MAP_ROWS-2
    // (wider & taller than before so the player always has room to manoeuvre)
    this._clearZone(map, 1, MAP_ROWS - 7, 8, 5);

    // Left-side corridor: col 1-2 cleared from spawn zone up to row 3
    // so the player always has a safe path to the top of the map.
    this._clearZone(map, 1, 3, 2, MAP_ROWS - 10);

    // Enemy spawn zones: three 3x2 areas at the top
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

  static tileToWorld(col, row) {
    return {
      x: col * TILE_SIZE + TILE_SIZE / 2,
      y: HUD_HEIGHT + row * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  static worldToTile(x, y) {
    return {
      col: Math.floor(x / TILE_SIZE),
      row: Math.floor((y - HUD_HEIGHT) / TILE_SIZE),
    };
  }
}
