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

    // ?? ?拙振?箇??嚗椰銝 5?4 ?潘?蝣箔??雲憭暑?征??    this._clearZone(map, 1, MAP_ROWS - 5, 5, 4);

    // ?? 撘瑕皜征?敺?璇?冽帖??row = MAP_ROWS-2嚗?蝣箔?摨?臬椰?喟宏??    //    ?芰宏?斤???瘞游?/?嚗?????潛?閬死??靽?嚗??餅?靘摮嚗?    for (let c = 1; c < MAP_COLS - 1; c++) {
      if (map[MAP_ROWS - 2][c] !== TILE.STEEL) {
        map[MAP_ROWS - 2][c] = TILE.EMPTY;
      }
    }

    // ?? 撘瑕皜征?敺洵鈭??折璈恍?嚗ow = MAP_ROWS-3嚗??踹??拙振敺??寡◤摰撠香
    for (let c = 1; c < MAP_COLS - 1; c++) {
      if (map[MAP_ROWS - 3][c] !== TILE.STEEL) {
        map[MAP_ROWS - 3][c] = TILE.EMPTY;
      }
    }

    // ?? ?萎犖?箇??嚗??其??? 3?2
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

