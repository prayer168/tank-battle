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

  update(cursors, spaceKey, time, bullets) {
    // Always respond to the most-recently-pressed direction key that is still held.
    // This avoids JustDown edge-cases and ensures any key press is acted on.
    let bestDir = null;
    let bestTime = -1;
    if (cursors.up.isDown    && cursors.up.timeDown    > bestTime) { bestTime = cursors.up.timeDown;    bestDir = DIR.UP;    }
    if (cursors.down.isDown  && cursors.down.timeDown  > bestTime) { bestTime = cursors.down.timeDown;  bestDir = DIR.DOWN;  }
    if (cursors.left.isDown  && cursors.left.timeDown  > bestTime) { bestTime = cursors.left.timeDown;  bestDir = DIR.LEFT;  }
    if (cursors.right.isDown && cursors.right.timeDown > bestTime) { bestTime = cursors.right.timeDown; bestDir = DIR.RIGHT; }

    if (bestDir !== null) {
      if (bestDir !== this.direction) {
        this._snapToGrid(bestDir);
        this.direction = bestDir;
      }
      this.setAngle(DIR_ANGLE[this.direction]);
      this.setVelocity(
        DIR_VX[this.direction] * this.speed,
        DIR_VY[this.direction] * this.speed
      );
    } else {
      this.setAngle(DIR_ANGLE[this.direction]);
      this.setVelocity(0, 0);
    }

    if (spaceKey.isDown) {
      this.tryShoot(time, bullets);
    }

    if (this.shieldSprite) {
      this.shieldSprite.setPosition(this.x, this.y);
    }
  }

  _snapToGrid(newDir) {
    // Use Math.floor so the snap always lands inside the tile the tank is currently
    // occupying, never jumping forward into an adjacent wall tile.
    if (newDir === DIR.UP || newDir === DIR.DOWN) {
      const col = Phaser.Math.Clamp(
        Math.floor(this.x / TILE_SIZE),
        1, MAP_COLS - 2
      );
      this.x = col * TILE_SIZE + TILE_SIZE / 2;
    } else {
      const row = Phaser.Math.Clamp(
        Math.floor((this.y - HUD_HEIGHT) / TILE_SIZE),
        1, MAP_ROWS - 2
      );
      this.y = row * TILE_SIZE + TILE_SIZE / 2 + HUD_HEIGHT;
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
