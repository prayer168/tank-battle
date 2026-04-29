class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.currentLevel = data.level  || 1;
    this.score        = data.score  || 0;
    this.lives        = data.lives  !== undefined ? data.lives : PLAYER_LIVES;
  }

  create() {
    Sound.resume();
    Sound.stopBGM();
    Sound.startBGM();

    this.levelConfig = LEVEL_CONFIGS[Math.min(this.currentLevel - 1, LEVEL_CONFIGS.length - 1)];

    this.mapGen  = new MapGenerator();
    this.mapData = this.mapGen.generate(this.levelConfig);

    this.physics.world.setBounds(0, HUD_HEIGHT, GAME_WIDTH, GAME_HEIGHT - HUD_HEIGHT);

    this._buildMap();
    this._createGroups();
    this._spawnPlayer();
    this._setupCollisions();
    this._setupInput();
    this._setupPowerUpTimer();

    this.totalEnemies    = this.levelConfig.enemies; // 本關總敵人數
    this.killCount       = 0;                        // 已擊殺數
    this.spawnQueue      = this.levelConfig.enemies; // 待生成數
    this._spawnEnemyWave();

    this.scene.launch('UIScene');
    this.scene.bringToTop('UIScene');

    this._gameOver = false;
    this._levelDone = false;

    this.events.emit('hud-update', {
      score: this.score, lives: this.lives,
      level: this.currentLevel,
      enemies: this.totalEnemies - this.killCount,
    });
  }

  // ─── Map Building ───────────────────────────────────────────────────

  _buildMap() {
    // Floor background
    const floorGfx = this.add.graphics().setDepth(0);
    floorGfx.fillStyle(0x1e1e1e);
    floorGfx.fillRect(0, HUD_HEIGHT, GAME_WIDTH, GAME_HEIGHT - HUD_HEIGHT);

    // Draw empty floor tiles
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        this.add.image(
          c * TILE_SIZE + TILE_SIZE/2,
          HUD_HEIGHT + r * TILE_SIZE + TILE_SIZE/2,
          'tile_empty'
        ).setDepth(0);
      }
    }

    this.brickGroup = this.physics.add.staticGroup();
    this.steelGroup = this.physics.add.staticGroup();
    this.waterGroup = this.physics.add.staticGroup();
    this.grassImages = [];

    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const type = this.mapData[r][c];
        if (type === TILE.EMPTY) continue;
        const wx = c * TILE_SIZE + TILE_SIZE / 2;
        const wy = HUD_HEIGHT + r * TILE_SIZE + TILE_SIZE / 2;

        if (type === TILE.BRICK) {
          const tile = this.brickGroup.create(wx, wy, 'tile_brick');
          tile.setDepth(0);
          tile.refreshBody();
          tile.tileRow = r; tile.tileCol = c;
        } else if (type === TILE.STEEL) {
          const tile = this.steelGroup.create(wx, wy, 'tile_steel');
          tile.setDepth(0);
          tile.refreshBody();
        } else if (type === TILE.WATER) {
          const tile = this.waterGroup.create(wx, wy, 'tile_water');
          tile.setDepth(0);
          tile.refreshBody();
        } else if (type === TILE.GRASS) {
          const tile = this.add.image(wx, wy, 'tile_grass').setDepth(2);
          this.grassImages.push(tile);
        }
      }
    }
  }

  // ─── Groups ──────────────────────────────────────────────────────────

  _createGroups() {
    this.bullets      = this.physics.add.group({ maxSize: 40 });
    this.enemyBullets = this.physics.add.group({ maxSize: 60 });
    this.enemies      = this.physics.add.group();
    this.powerUps     = this.physics.add.group();
  }

  // ─── Player ──────────────────────────────────────────────────────────

  _spawnPlayer() {
    const col = 2, row = MAP_ROWS - 3;
    const pos = MapGenerator.tileToWorld(col, row);
    this.player = new PlayerTank(this, pos.x, pos.y);
    this._flashSpawn(pos.x, pos.y);
  }

  _respawnPlayer() {
    if (this.lives <= 0) {
      this._triggerGameOver();
      return;
    }
    this.time.delayedCall(1200, () => {
      if (this._gameOver) return;
      const col = 2, row = MAP_ROWS - 3;
      const pos = MapGenerator.tileToWorld(col, row);
      this.player = new PlayerTank(this, pos.x, pos.y);
      this.player.activateShield(3000);
      this._flashSpawn(pos.x, pos.y);
      this._setupPlayerCollisions();
      this.events.emit('hud-update', { score: this.score, lives: this.lives, level: this.currentLevel, enemies: this.enemiesRemaining });
    });
  }

  // ─── Enemies ─────────────────────────────────────────────────────────

  _spawnPoints() {
    return [
      { col: 2,                         row: 1 },
      { col: Math.floor(MAP_COLS / 2),  row: 1 },
      { col: MAP_COLS - 3,              row: 1 },
    ];
  }

  _spawnEnemyWave() {
    const points = this._spawnPoints();
    const toSpawn = Math.min(MAX_ACTIVE_ENEMIES, this.spawnQueue);
    for (let i = 0; i < toSpawn; i++) {
      const pt = points[i % points.length];
      this._spawnEnemy(pt.col, pt.row);
      this.spawnQueue--;
    }
  }

  _spawnEnemy(col, row) {
    const enemy = new EnemyTank(this, col, row, this.levelConfig);
    this.enemies.add(enemy);
    this._flashSpawn(enemy.x, enemy.y);
    this._setupEnemyCollisions(enemy);
  }

  _trySpawnMoreEnemies() {
    if (this.spawnQueue <= 0) return;
    const active = this.enemies.getChildren().filter(e => e.active).length;
    if (active >= MAX_ACTIVE_ENEMIES) return;
    const needed = Math.min(MAX_ACTIVE_ENEMIES - active, this.spawnQueue);
    const points = this._spawnPoints();
    for (let i = 0; i < needed; i++) {
      const pt = points[i % points.length];
      this._spawnEnemy(pt.col, pt.row);
      this.spawnQueue--;
    }
  }

  // ─── Collisions ──────────────────────────────────────────────────────

  _setupCollisions() {
    // Tanks vs walls
    this.physics.add.collider(this.enemies, this.brickGroup);
    this.physics.add.collider(this.enemies, this.steelGroup);
    this.physics.add.collider(this.enemies, this.waterGroup);
    this.physics.add.collider(this.enemies, this.enemies);
    this._setupPlayerCollisions();

    // Player bullets vs steel (destroy bullet)
    this.physics.add.collider(this.bullets, this.steelGroup, (b) => {
      this._spawnExplosion(b.x, b.y, false);
      b.destroy();
    });
    this.physics.add.collider(this.bullets, this.waterGroup, (b) => b.destroy());

    // Player bullets vs brick (destroy both)
    this.physics.add.collider(this.bullets, this.brickGroup, (b, brick) => {
      this._destroyBrick(brick);
      this._spawnExplosion(b.x, b.y, false);
      b.destroy();
    });

    // Enemy bullets vs steel
    this.physics.add.collider(this.enemyBullets, this.steelGroup, (b) => {
      this._spawnExplosion(b.x, b.y, false);
      b.destroy();
    });
    this.physics.add.collider(this.enemyBullets, this.waterGroup, (b) => b.destroy());

    // Enemy bullets vs brick
    this.physics.add.collider(this.enemyBullets, this.brickGroup, (b, brick) => {
      this._destroyBrick(brick);
      this._spawnExplosion(b.x, b.y, false);
      b.destroy();
    });

    // Bullets vs bullets (cancel each other)
    this.physics.add.overlap(this.bullets, this.enemyBullets, (pb, eb) => {
      pb.destroy(); eb.destroy();
    });

    // Player bullets vs enemies
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      bullet.destroy();
      this._killEnemy(enemy);
    });

    // Enemy bullets vs player
    this._setupPlayerCollisions();

    // Player vs power-ups
    this.physics.add.overlap(this.player, this.powerUps, (player, pu) => {
      this._collectPowerUp(pu);
    });
  }

  _setupPlayerCollisions() {
    if (!this.player || !this.player.active) return;
    this.physics.add.collider(this.player, this.brickGroup);
    this.physics.add.collider(this.player, this.steelGroup);
    this.physics.add.collider(this.player, this.waterGroup);
    this.physics.add.collider(this.player, this.enemies);

    this.physics.add.overlap(this.enemyBullets, this.player, (bullet, player) => {
      bullet.destroy();
      this._hitPlayer();
    });
    this.physics.add.overlap(this.player, this.powerUps, (player, pu) => {
      this._collectPowerUp(pu);
    });
  }

  _setupEnemyCollisions(enemy) {
    this.physics.add.collider(enemy, this.brickGroup);
    this.physics.add.collider(enemy, this.steelGroup);
    this.physics.add.collider(enemy, this.waterGroup);
  }

  // ─── Input ───────────────────────────────────────────────────────────

  _setupInput() {
    this.cursors   = this.input.keyboard.createCursorKeys();
    this.spaceKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  // ─── Power-ups ───────────────────────────────────────────────────────

  _setupPowerUpTimer() {
    this.time.addEvent({
      delay: POWERUP_SPAWN_INTERVAL,
      callback: this._spawnPowerUp,
      callbackScope: this,
      loop: true,
    });
  }

  _spawnPowerUp() {
    if (!this.player || !this.player.active) return;
    const types = [POWERUP_TYPE.SPEED, POWERUP_TYPE.SHIELD, POWERUP_TYPE.BOMB];
    const type  = types[Math.floor(Math.random() * types.length)];
    const textures = ['powerup_speed', 'powerup_shield', 'powerup_bomb'];

    // Find random empty tile
    let col, row, attempts = 0;
    do {
      col = 1 + Math.floor(Math.random() * (MAP_COLS - 2));
      row = 1 + Math.floor(Math.random() * (MAP_ROWS - 2));
      attempts++;
    } while (this.mapData[row][col] !== TILE.EMPTY && attempts < 40);
    if (attempts >= 40) return;

    const pos = MapGenerator.tileToWorld(col, row);
    const pu = this.powerUps.create(pos.x, pos.y, textures[type]);
    pu.setDepth(1);
    pu.body.setSize(24, 24);
    pu.powerType = type;

    // Blinking animation
    this.tweens.add({ targets: pu, alpha: 0.3, duration: 400, yoyo: true, repeat: 10,
      onComplete: () => { if (pu.active) pu.destroy(); }
    });
  }

  _collectPowerUp(pu) {
    if (!pu.active) return;
    this._spawnExplosion(pu.x, pu.y, false);
    switch (pu.powerType) {
      case POWERUP_TYPE.SPEED:
        this.player.activateSpeed(SPEED_DURATION);
        this._showPowerUpText('⚡ 加速！');
        break;
      case POWERUP_TYPE.SHIELD:
        this.player.activateShield(SHIELD_DURATION);
        this._showPowerUpText('🛡 護盾！');
        break;
      case POWERUP_TYPE.BOMB:
        this._bombClearEnemies();
        this._showPowerUpText('💣 清場！');
        break;
    }
    pu.destroy();
  }

  _bombClearEnemies() {
    const alive = this.enemies.getChildren().filter(e => e.active);
    alive.forEach(e => {
      this._spawnExplosion(e.x, e.y, true);
      this.score += ENEMY_SCORE * this.currentLevel;
      this.killCount++;
      e.destroy();
    });
    // 炸彈清空剩餘生成佇列
    this.killCount  = this.totalEnemies;
    this.spawnQueue = 0;
    this.events.emit('hud-update', {
      score: this.score, lives: this.lives,
      level: this.currentLevel, enemies: 0,
    });
    this._checkWin();
  }

  _showPowerUpText(msg) {
    const txt = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 60, msg, {
      fontSize: '28px', fontFamily: 'Arial Black', color: '#ffdd00',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 1200,
      onComplete: () => txt.destroy() });
  }

  // ─── Game Logic ──────────────────────────────────────────────────────

  _hitPlayer() {
    if (!this.player || !this.player.active) return;
    if (!this.player.takeDamage()) return; // shielded
    this._spawnExplosion(this.player.x, this.player.y, true);
    this.player.destroy();
    this.lives--;
    this.events.emit('hud-update', { score: this.score, lives: this.lives, level: this.currentLevel, enemies: this.enemiesRemaining });
    this._respawnPlayer();
  }

  _killEnemy(enemy) {
    if (!enemy.active) return;
    this._spawnExplosion(enemy.x, enemy.y, true);
    this.score += ENEMY_SCORE * this.currentLevel;
    this.killCount++;
    enemy.destroy();
    this.events.emit('hud-update', {
      score: this.score, lives: this.lives,
      level: this.currentLevel,
      enemies: Math.max(0, this.totalEnemies - this.killCount),
    });
    // 先檢查勝利（避免殺完最後一隻又補生新敵人）
    if (this._checkWin()) return;
    this._trySpawnMoreEnemies();
  }

  _destroyBrick(brick) {
    if (!brick.active) return;
    this.mapData[brick.tileRow][brick.tileCol] = TILE.EMPTY;
    brick.destroy();
  }

  // 回傳 true 表示已過關（供 _killEnemy 提前返回）
  _checkWin() {
    if (this._levelDone || this._gameOver) return false;
    if (this.killCount >= this.totalEnemies) {
      this._levelDone = true;
      this.time.delayedCall(800, () => this._triggerLevelClear());
      return true;
    }
    return false;
  }

  _triggerLevelClear() {
    if (this._gameOver) return;
    Sound.stopBGM();
    Sound.playLevelClear();
    const bonus = this.levelConfig.clearBonus;
    this.score += bonus;
    this.scene.stop('UIScene');
    this.scene.start('LevelClearScene', {
      level: this.currentLevel, score: this.score,
      lives: this.lives, bonus,
      hasNextLevel: this.currentLevel < LEVEL_CONFIGS.length,
    });
  }

  _triggerGameOver() {
    if (this._gameOver) return;
    this._gameOver = true;
    Sound.stopBGM();
    Sound.playGameOver();
    ScoreManager.saveScore(this.score, this.currentLevel);
    this.time.delayedCall(600, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', { score: this.score, level: this.currentLevel });
    });
  }

  // ─── VFX ─────────────────────────────────────────────────────────────

  _spawnExplosion(x, y, big) {
    Sound.playExplosion(big);

    const depth = 5;

    // Central fireball
    const fireball = this.add.image(x, y, 'explosion').setDepth(depth).setScale(big ? 0.6 : 0.35);
    this.tweens.add({
      targets: fireball,
      scale: big ? 2.8 : 1.6,
      alpha: 0,
      duration: big ? 520 : 300,
      ease: 'Power2Out',
      onComplete: () => fireball.destroy(),
    });

    // Shockwave ring
    const sw = this.add.image(x, y, 'shockwave').setDepth(depth).setScale(0.1).setAlpha(0.9);
    this.tweens.add({
      targets: sw,
      scale: big ? 2.5 : 1.4,
      alpha: 0,
      duration: big ? 400 : 240,
      ease: 'Quad.Out',
      onComplete: () => sw.destroy(),
    });

    // Smoke ring (delayed)
    this.time.delayedCall(80, () => {
      const smoke = this.add.image(x, y, 'explosion_smoke').setDepth(depth).setScale(0.4).setAlpha(0.6);
      this.tweens.add({
        targets: smoke,
        scale: big ? 2.0 : 1.1,
        alpha: 0,
        duration: big ? 600 : 380,
        ease: 'Linear',
        onComplete: () => smoke.destroy(),
      });
    });

    // Flying sparks
    const sparkCount = big ? 8 : 4;
    for (let i = 0; i < sparkCount; i++) {
      const angle  = (i / sparkCount) * Math.PI * 2 + Math.random() * 0.5;
      const radius = big ? 18 + Math.random() * 10 : 10 + Math.random() * 6;
      const spk = this.add.image(x, y, 'spark').setDepth(depth + 1).setScale(big ? 1.2 : 0.8);
      this.tweens.add({
        targets: spk,
        x: x + Math.cos(angle) * (big ? 55 : 32),
        y: y + Math.sin(angle) * (big ? 55 : 32),
        scale: 0,
        alpha: 0,
        duration: big ? 480 : 280,
        delay: i * 18,
        ease: 'Power2Out',
        onComplete: () => spk.destroy(),
      });
    }

    // White screen flash for big explosions
    if (big) {
      const flash = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.35).setDepth(9);
      this.tweens.add({ targets: flash, alpha: 0, duration: 180, onComplete: () => flash.destroy() });
    }

    this.cameras.main.shake(big ? 160 : 65, big ? 0.008 : 0.003);
  }

  _flashSpawn(x, y) {
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 120, () => {
        const flash = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0xffffff, 0.5).setDepth(6);
        this.time.delayedCall(80, () => flash.destroy());
      });
    }
  }

  // ─── Update ──────────────────────────────────────────────────────────

  update(time, delta) {
    if (this._gameOver || this._levelDone) return;

    if (this.player && this.player.active) {
      this.player.update(this.cursors, this.spaceKey, time, this.bullets);
    }

    this.enemies.getChildren().forEach(e => {
      if (e.active) e.update(time, delta, this.mapData, this.player, this.enemyBullets);
    });

    // Out-of-bounds bullet cleanup
    [this.bullets, this.enemyBullets].forEach(group => {
      group.getChildren().forEach(b => {
        if (!b.active) return;
        if (b.x < 0 || b.x > GAME_WIDTH || b.y < HUD_HEIGHT || b.y > GAME_HEIGHT) {
          b.destroy();
        }
      });
    });
  }
}
