class PlayerTank extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'tank_player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(1);
    this.body.setSize(26, 26);
    this.body.allowGravity = false;
    // Disable physics engine movement — we drive position via tweens
    this.body.moves = false;

    this.direction = DIR.UP;
    this.setAngle(DIR_ANGLE[DIR.UP]);
    this.speed = PLAYER_SPEED;
    this.lastFired = 0;
    this.shieldActive = false;
    this.shieldTimer = null;
    this.speedActive = false;
    this.speedTimer = null;
    this.shieldSprite = null;
    this.isMoving = false;
    this._createShieldSprite(scene);
  }

  _createShieldSprite(scene) {
    this.shieldSprite = scene.add.image(this.x, this.y, 'shield_fx');
    this.shieldSprite.setDepth(3);
    this.shieldSprite.setVisible(false);
    this.shieldSprite.setAlpha(0.7);
  }

  activateShield(duration) {
    this.shieldActive = true;
    this.shieldSprite.setVisible(true);
    if (this.shieldTimer) this.shieldTimer.remove();
    this.shieldTimer = this.scene.time.delayedCall(duration, () => {
      this.shieldActive = false;
      if (this.shieldSprite) this.shieldSprite.setVisible(false);
    });
  }

  activateSpeed(duration) {
    this.speedActive = true;
    this.speed = PLAYER_SPEED * 1.7;
    if (this.speedTimer) this.speedTimer.remove();
    this.speedTimer = this.scene.time.delayedCall(duration, () => {
      this.speedActive = false;
      this.speed = PLAYER_SPEED;
    });
  }

  tryShoot(time, bullets) {
    if (time - this.lastFired < PLAYER_FIRE_COOLDOWN) return;
    this.lastFired = time;
    const offset = TILE_SIZE / 2;
    const bx = this.x + DIR_VX[this.direction] * offset;
    const by = this.y + DIR_VY[this.direction] * offset;
    const bullet = bullets.create(bx, by, 'bullet');
    if (!bullet) return;
    bullet.setDepth(1);
    bullet.body.setSize(8, 8);
    bullet.setVelocity(
      DIR_VX[this.direction] * PLAYER_BULLET_SPEED,
      DIR_VY[this.direction] * PLAYER_BULLET_SPEED
    );
    bullet.isPlayerBullet = true;
    bullet.direction = this.direction;
    Sound.playShoot(true);
  }

  update(cursors, spaceKey, time, delta, bullets, mapData) {
    // Pick the most-recently-pressed held key
    let desiredDir = null;
    let bestTime = -1;
    if (cursors.up.isDown    && cursors.up.timeDown    > bestTime) { bestTime = cursors.up.timeDown;    desiredDir = DIR.UP;    }
    if (cursors.down.isDown  && cursors.down.timeDown  > bestTime) { bestTime = cursors.down.timeDown;  desiredDir = DIR.DOWN;  }
    if (cursors.left.isDown  && cursors.left.timeDown  > bestTime) { bestTime = cursors.left.timeDown;  desiredDir = DIR.LEFT;  }
    if (cursors.right.isDown && cursors.right.timeDown > bestTime) { bestTime = cursors.right.timeDown; desiredDir = DIR.RIGHT; }

    if (desiredDir !== null) {
      this.direction = desiredDir;
      this.setAngle(DIR_ANGLE[this.direction]);
    }

    // Only start a new move when the previous tween has finished
    if (!this.isMoving && desiredDir !== null) {
      this._tryMove(desiredDir, mapData);
    }

    // Keep the physics body centred on the sprite every frame
    // (needed so overlap detection works while the tween is running)
    if (this.body) {
      this.body.position.set(
        this.x - this.body.halfWidth,
        this.y - this.body.halfHeight
      );
    }

    if (spaceKey.isDown) this.tryShoot(time, bullets);
    if (this.shieldSprite) this.shieldSprite.setPosition(this.x, this.y);
  }

  _tryMove(dir, mapData) {
    // Compute which tile we are currently on
    const col = Math.floor(this.x / TILE_SIZE);
    const row = Math.floor((this.y - HUD_HEIGHT) / TILE_SIZE);
    const nc = col + DIR_VX[dir];
    const nr = row + DIR_VY[dir];

    // Block border tiles and map edges
    if (nr < 1 || nr >= MAP_ROWS - 1 || nc < 1 || nc >= MAP_COLS - 1) return;

    // Block solid tiles
    if (mapData) {
      const cell = mapData[nr][nc];
      if (cell === TILE.STEEL || cell === TILE.WATER || cell === TILE.BRICK) return;
    }

    // Snap sprite to current tile centre before starting the tween
    // (removes any sub-pixel drift from previous tweens)
    const snapX = col * TILE_SIZE + TILE_SIZE / 2;
    const snapY = row * TILE_SIZE + TILE_SIZE / 2 + HUD_HEIGHT;
    this.x = snapX;
    this.y = snapY;

    const target = MapGenerator.tileToWorld(nc, nr);
    const duration = TILE_SIZE / this.speed * 1000; // ms to cross one tile

    this.isMoving = true;
    this.scene.tweens.add({
      targets: this,
      x: target.x,
      y: target.y,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        // Hard-snap to exact tile centre on arrival
        this.x = target.x;
        this.y = target.y;
        if (this.body) {
          this.body.position.set(
            this.x - this.body.halfWidth,
            this.y - this.body.halfHeight
          );
        }
        this.isMoving = false;
      }
    });
  }

  takeDamage() {
    if (this.shieldActive) return false;
    return true;
  }

  destroy(fromScene) {
    // Stop any in-progress movement tween
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.killTweensOf(this);
    }
    if (this.shieldSprite) this.shieldSprite.destroy();
    super.destroy(fromScene);
  }
}
