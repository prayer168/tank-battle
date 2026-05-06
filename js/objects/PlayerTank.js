class PlayerTank extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'tank_player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(1);
    this.body.setSize(26, 26);
    // body.moves stays TRUE so preUpdate syncs body from sprite normally.
    // We control position only via body.reset(), which zeroes velocity each call.

    this.direction = DIR.UP;
    this.setAngle(DIR_ANGLE[DIR.UP]);
    this.speed = PLAYER_SPEED;
    this.lastFired = 0;
    this.shieldActive = false; this.shieldTimer = null;
    this.speedActive = false;  this.speedTimer = null;
    this.shieldSprite = null;

    // Tile-step animation state
    this.isMoving = false;
    this._fromX = x; this._fromY = y;
    this._toX   = x; this._toY   = y;
    this._elapsed  = 0;
    this._duration = 1;

    this._createShieldSprite(scene);
  }

  _createShieldSprite(scene) {
    this.shieldSprite = scene.add.image(this.x, this.y, 'shield_fx');
    this.shieldSprite.setDepth(3).setVisible(false).setAlpha(0.7);
  }

  activateShield(duration) {
    this.shieldActive = true;
    if (this.shieldSprite) this.shieldSprite.setVisible(true);
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
    let desiredDir = null, bestTime = -1;
    if (cursors.up.isDown    && cursors.up.timeDown    > bestTime) { bestTime = cursors.up.timeDown;    desiredDir = DIR.UP;    }
    if (cursors.down.isDown  && cursors.down.timeDown  > bestTime) { bestTime = cursors.down.timeDown;  desiredDir = DIR.DOWN;  }
    if (cursors.left.isDown  && cursors.left.timeDown  > bestTime) { bestTime = cursors.left.timeDown;  desiredDir = DIR.LEFT;  }
    if (cursors.right.isDown && cursors.right.timeDown > bestTime) { bestTime = cursors.right.timeDown; desiredDir = DIR.RIGHT; }

    if (desiredDir !== null) {
      this.direction = desiredDir;
      this.setAngle(DIR_ANGLE[this.direction]);
    }

    if (this.isMoving) {
      this._advanceMovement(delta);
    } else if (desiredDir !== null) {
      this._tryMove(desiredDir, mapData);
    }
    // idle: body already at rest from last body.reset() call

    if (spaceKey.isDown) this.tryShoot(time, bullets);
    if (this.shieldSprite) this.shieldSprite.setPosition(this.x, this.y);
  }

  _tryMove(dir, mapData) {
    const col = Math.floor(this.x / TILE_SIZE);
    const row = Math.floor((this.y - HUD_HEIGHT) / TILE_SIZE);
    const nc = col + DIR_VX[dir];
    const nr = row + DIR_VY[dir];

    if (nr < 1 || nr >= MAP_ROWS - 1 || nc < 1 || nc >= MAP_COLS - 1) return;
    if (mapData) {
      const cell = mapData[nr][nc];
      if (cell === TILE.STEEL || cell === TILE.WATER || cell === TILE.BRICK) return;
    }

    // Snap to current tile centre, then animate toward next tile
    const snapX = col * TILE_SIZE + TILE_SIZE / 2;
    const snapY = row * TILE_SIZE + TILE_SIZE / 2 + HUD_HEIGHT;
    this.body.reset(snapX, snapY);   // positions body + sprite, zeroes velocity

    const tgt = MapGenerator.tileToWorld(nc, nr);
    this._fromX = snapX; this._fromY = snapY;
    this._toX   = tgt.x; this._toY   = tgt.y;
    this._elapsed  = 0;
    this._duration = (TILE_SIZE / this.speed) * 1000;
    this.isMoving  = true;
  }

  _advanceMovement(delta) {
    this._elapsed = Math.min(this._elapsed + delta, this._duration);
    const t  = this._elapsed / this._duration;
    const nx = this._fromX + (this._toX - this._fromX) * t;
    const ny = this._fromY + (this._toY - this._fromY) * t;
    this.body.reset(nx, ny);   // moves body + sprite, zeroes velocity each frame

    if (t >= 1) {
      this.body.reset(this._toX, this._toY);
      this.isMoving = false;
    }
  }

  takeDamage() {
    if (this.shieldActive) return false;
    return true;
  }

  destroy(fromScene) {
    if (this.shieldSprite) this.shieldSprite.destroy();
    super.destroy(fromScene);
  }
}
