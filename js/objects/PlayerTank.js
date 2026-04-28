class PlayerTank extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'tank_player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(1);
    this.body.setSize(26, 26);
    this.setCollideWorldBounds(true);

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
    // JustDown tracks the LAST key pressed so turning always works,
    // even when another direction key is still held down.
    const JD = Phaser.Input.Keyboard.JustDown;
    if (JD(cursors.up))    { this._changeDir(DIR.UP);    }
    if (JD(cursors.down))  { this._changeDir(DIR.DOWN);  }
    if (JD(cursors.left))  { this._changeDir(DIR.LEFT);  }
    if (JD(cursors.right)) { this._changeDir(DIR.RIGHT); }

    const moving = cursors.up.isDown || cursors.down.isDown ||
                   cursors.left.isDown || cursors.right.isDown;

    this.setAngle(DIR_ANGLE[this.direction]);

    if (moving) {
      this.setVelocity(
        DIR_VX[this.direction] * this.speed,
        DIR_VY[this.direction] * this.speed
      );
    } else {
      this.setVelocity(0, 0);
    }

    if (spaceKey.isDown) {
      this.tryShoot(time, bullets);
    }

    // Update shield sprite position
    if (this.shieldSprite) {
      this.shieldSprite.setPosition(this.x, this.y);
    }
  }

  _changeDir(newDir) {
    if (this.direction !== newDir) { this._snapToGrid(newDir); }
    this.direction = newDir;
  }

  _snapToGrid(newDir) {
    // Align perpendicular axis to grid when changing direction
    if (newDir === DIR.UP || newDir === DIR.DOWN) {
      const col = Math.round((this.x - TILE_SIZE / 2) / TILE_SIZE);
      this.x = col * TILE_SIZE + TILE_SIZE / 2;
    } else {
      const row = Math.round((this.y - HUD_HEIGHT - TILE_SIZE / 2) / TILE_SIZE);
      this.y = row * TILE_SIZE + TILE_SIZE / 2 + HUD_HEIGHT;
    }
  }

  takeDamage() {
    if (this.shieldActive) return false; // blocked
    return true; // player is hit
  }

  destroy(fromScene) {
    if (this.shieldSprite) this.shieldSprite.destroy();
    super.destroy(fromScene);
  }
}
