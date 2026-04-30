class PlayerTank extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'tank_player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(1);
    this.body.setSize(26, 26);

    this.direction = DIR.UP;
    this.setAngle(DIR_ANGLE[DIR.UP]);

    this.speed = PLAYER_SPEED;
    this.lastFired = 0;
    this.shieldActive = false;
    this.shieldTimer = null;
    this.speedActive = false;
    this.speedTimer = null;
    this.shieldSprite = null;

    // Tile-by-tile movement state
    this.targetX = x;
    this.targetY = y;
    this.hasTarget = false;

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
      this.shieldSprite.setVisible(false);
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

  update(cursors, spaceKey, time, bullets, mapData) {
    // Determine the most-recently-pressed direction key that is still held
    let desiredDir = null;
    let bestTime = -1;
    if (cursors.up.isDown    && cursors.up.timeDown    > bestTime) { bestTime = cursors.up.timeDown;    desiredDir = DIR.UP;    }
    if (cursors.down.isDown  && cursors.down.timeDown  > bestTime) { bestTime = cursors.down.timeDown;  desiredDir = DIR.DOWN;  }
    if (cursors.left.isDown  && cursors.left.timeDown  > bestTime) { bestTime = cursors.left.timeDown;  desiredDir = DIR.LEFT;  }
    if (cursors.right.isDown && cursors.right.timeDown > bestTime) { bestTime = cursors.right.timeDown; desiredDir = DIR.RIGHT; }

    // Update facing direction immediately on key press
    if (desiredDir !== null) {
      this.direction = desiredDir;
      this.setAngle(DIR_ANGLE[this.direction]);
    }

    if (this.hasTarget) {
      // Continue moving toward current tile target
      this._moveToTarget(desiredDir, mapData);
    } else if (desiredDir !== null) {
      // Attempt to enter the next tile
      this._tryPickTarget(mapData, desiredDir);
    } else {
      this.setVelocity(0, 0);
    }

    if (spaceKey.isDown) {
      this.tryShoot(time, bullets);
    }

    if (this.shieldSprite) {
      this.shieldSprite.setPosition(this.x, this.y);
    }
  }

  _tryPickTarget(mapData, dir) {
    // Current tile from world position (tank is at a tile center when hasTarget=false)
    const col = Math.round((this.x - TILE_SIZE / 2) / TILE_SIZE);
    const row = Math.round((this.y - HUD_HEIGHT - TILE_SIZE / 2) / TILE_SIZE);

    const nc = col + DIR_VX[dir];
    const nr = row + DIR_VY[dir];

    // Stay inside interior (border steel walls are handled here too)
    if (nr < 1 || nr >= MAP_ROWS - 1 || nc < 1 || nc >= MAP_COLS - 1) {
      this.setVelocity(0, 0);
      return;
    }

    // Only enter passable tiles; walls are handled without applying any velocity
    if (mapData) {
      const cell = mapData[nr][nc];
      if (cell === TILE.STEEL || cell === TILE.WATER || cell === TILE.BRICK) {
        this.setVelocity(0, 0);
        return;
      }
    }

    // Snap exactly to current tile center before departing
    this.x = col * TILE_SIZE + TILE_SIZE / 2;
    this.y = row * TILE_SIZE + TILE_SIZE / 2 + HUD_HEIGHT;

    const world = MapGenerator.tileToWorld(nc, nr);
    this.targetX = world.x;
    this.targetY = world.y;
    this.hasTarget = true;
  }

  _moveToTarget(desiredDir, mapData) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) {
      // Arrived at tile center — snap exactly and chain to next tile
      this.x = this.targetX;
      this.y = this.targetY;
      this.setVelocity(0, 0);
      this.hasTarget = false;
      if (desiredDir !== null) {
        this._tryPickTarget(mapData, desiredDir);
      }
    } else {
      this.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
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
