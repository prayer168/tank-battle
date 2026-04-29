class EnemyTank extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, col, row, config) {
    const pos = MapGenerator.tileToWorld(col, row);
    super(scene, pos.x, pos.y, 'tank_enemy');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(1);
    this.body.setSize(26, 26);
    // 不使用 worldBounds，邊界鋼墻已阻擋，避免卡角

    this.speed       = config.speed;
    this.bulletSpeed = config.bulletSpeed;
    this.fireRate    = config.fireRate;
    this.aggression  = config.aggression;

    this.direction    = DIR.DOWN;
    this.setAngle(DIR_ANGLE[DIR.DOWN]);

    this.targetX      = pos.x;
    this.targetY      = pos.y;
    this.hasTarget    = false;
    this.lastFired    = 0;
    this.pathTimer    = 0;
    this.stuckTimer   = 0;
    this.lastX        = pos.x;
    this.lastY        = pos.y;
  }

  update(time, delta, mapData, player, bullets) {
    if (!this.active) return;

    // 卡住偵測：每 400ms 檢查一次位移，幾乎沒動則強制重選目標
    this.stuckTimer += delta;
    if (this.stuckTimer > 400) {
      const dx = this.x - this.lastX;
      const dy = this.y - this.lastY;
      if (Math.abs(dx) < 1.5 && Math.abs(dy) < 1.5) {
        this.hasTarget = false;
        this.setVelocity(0, 0);
      }
      this.lastX = this.x;
      this.lastY = this.y;
      this.stuckTimer = 0;
    }

    // Movement logic
    if (!this.hasTarget) {
      this._pickNextTile(mapData, player);
    } else {
      this._moveToTarget();
    }

    // Shooting
    if (time - this.lastFired > this.fireRate) {
      this._tryShoot(time, bullets, player);
    }
  }

  _pickNextTile(mapData, player) {
    const me = MapGenerator.worldToTile(this.x, this.y);

    // Snap to nearest tile center first
    const snap = MapGenerator.tileToWorld(me.col, me.row);
    this.x = snap.x;
    this.y = snap.y;

    let nextTile = null;

    if (player && player.active && Math.random() < this.aggression) {
      const pt = MapGenerator.worldToTile(player.x, player.y);
      nextTile = bfsNextStep(mapData, me.row, me.col, pt.row, pt.col);
    }

    if (!nextTile) {
      nextTile = this._randomAdjacentTile(mapData, me.row, me.col);
    }

    if (nextTile) {
      const world = MapGenerator.tileToWorld(nextTile[1], nextTile[0]);
      this.targetX = world.x;
      this.targetY = world.y;
      this.hasTarget = true;

      // Set direction
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      if (Math.abs(dx) >= Math.abs(dy)) {
        this.direction = dx > 0 ? DIR.RIGHT : DIR.LEFT;
      } else {
        this.direction = dy > 0 ? DIR.DOWN : DIR.UP;
      }
      this.setAngle(DIR_ANGLE[this.direction]);
    } else {
      this.setVelocity(0, 0);
    }
  }

  _moveToTarget() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 3) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.setVelocity(0, 0);
      this.hasTarget = false;
    } else {
      this.setVelocity(
        (dx / dist) * this.speed,
        (dy / dist) * this.speed
      );
    }
  }

  _randomAdjacentTile(mapData, row, col) {
    const dirs = [0, 1, 2, 3];
    // Shuffle
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const d of dirs) {
      const nr = row + DIR_VY[d];
      const nc = col + DIR_VX[d];
      if (nr < 0 || nr >= MAP_ROWS || nc < 0 || nc >= MAP_COLS) continue;
      const cell = mapData[nr][nc];
      if (cell === TILE.STEEL || cell === TILE.WATER) continue;
      return [nr, nc];
    }
    // 四方都被封住（孤立區域）→ 在地圖上掃描最近的可通行格子
    return this._findNearestOpenTile(mapData, row, col);
  }

  _findNearestOpenTile(mapData, row, col) {
    // BFS 找最近開放格（忽略牆壁限制，允許穿越磚牆）
    const visited = new Set([`${row},${col}`]);
    const queue = [[row, col]];
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    while (queue.length) {
      const [r, c] = queue.shift();
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 1 || nr >= MAP_ROWS-1 || nc < 1 || nc >= MAP_COLS-1) continue;
        const key = `${nr},${nc}`;
        if (visited.has(key)) continue;
        visited.add(key);
        if (mapData[nr][nc] !== TILE.STEEL && mapData[nr][nc] !== TILE.WATER) {
          return [nr, nc];
        }
        queue.push([nr, nc]);
      }
    }
    return null;
  }

  _tryShoot(time, bullets, player) {
    if (!player || !player.active) return;

    // Only shoot if roughly aligned with player (same row or col), or randomly
    const me = MapGenerator.worldToTile(this.x, this.y);
    const pt = MapGenerator.worldToTile(player.x, player.y);
    const aligned = (me.row === pt.row || me.col === pt.col);

    if (!aligned && Math.random() > 0.3) return;

    this.lastFired = time;
    const offset = TILE_SIZE / 2;
    const bx = this.x + DIR_VX[this.direction] * offset;
    const by = this.y + DIR_VY[this.direction] * offset;
    const bullet = bullets.create(bx, by, 'bullet_enemy');
    if (!bullet) return;
    bullet.setDepth(1);
    bullet.body.setSize(8, 8);
    bullet.setVelocity(
      DIR_VX[this.direction] * this.bulletSpeed,
      DIR_VY[this.direction] * this.bulletSpeed
    );
    bullet.isPlayerBullet = false;
    bullet.direction = this.direction;
    Sound.playShoot(false);
  }
}
