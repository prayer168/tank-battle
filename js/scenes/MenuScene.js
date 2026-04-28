class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;

    // Background
    this.add.rectangle(W/2, H/2, W, H, 0x111111);

    // Title
    this.add.text(W/2, 100, '坦克大戰', {
      fontSize: '56px', fontFamily: 'Arial Black, Arial',
      color: '#ffdd00', stroke: '#884400', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(W/2, 165, 'TANK BATTLE', {
      fontSize: '22px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Draw decorative tanks
    this._drawTitleTanks();

    // Start button
    const startBtn = this.add.text(W/2, 300, '▶  開始遊戲', {
      fontSize: '30px', fontFamily: 'Arial',
      color: '#ffffff', backgroundColor: '#226622',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover',  () => startBtn.setStyle({ backgroundColor: '#338833' }));
    startBtn.on('pointerout',   () => startBtn.setStyle({ backgroundColor: '#226622' }));
    startBtn.on('pointerdown',  () => {
      Sound.resume();
      this.scene.start('GameScene', { level: 1, score: 0, lives: PLAYER_LIVES });
    });

    // Scoreboard button
    const scoreBtn = this.add.text(W/2, 378, '🏆  排行榜', {
      fontSize: '24px', fontFamily: 'Arial',
      color: '#ffdd00', backgroundColor: '#444400',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    scoreBtn.on('pointerover',  () => scoreBtn.setStyle({ backgroundColor: '#666600' }));
    scoreBtn.on('pointerout',   () => scoreBtn.setStyle({ backgroundColor: '#444400' }));
    scoreBtn.on('pointerdown',  () => this._showScoreboard());

    // Controls hint
    this.add.text(W/2, H - 60, '方向鍵 移動　空白鍵 射擊', {
      fontSize: '18px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(0.5);

    this.add.text(W/2, H - 32, '消滅所有敵人即可過關', {
      fontSize: '16px', fontFamily: 'Arial', color: '#666666',
    }).setOrigin(0.5);

    // Keyboard shortcut
    this.input.keyboard.once('keydown-ENTER', () => {
      Sound.resume();
      this.scene.start('GameScene', { level: 1, score: 0, lives: PLAYER_LIVES });
    });

    // Music toggle
    const musicBtn = this.add.text(W - 16, H - 56, '🎵 音樂：開', {
      fontSize: '15px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    musicBtn.on('pointerdown', () => {
      Sound.resume();
      const on = Sound.toggleMusic();
      musicBtn.setText(on ? '🎵 音樂：開' : '🔇 音樂：關');
    });

    // SFX toggle
    const sfxBtn = this.add.text(W - 16, H - 32, '🔊 音效：開', {
      fontSize: '15px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    sfxBtn.on('pointerdown', () => {
      Sound.resume();
      const on = Sound.toggleSFX();
      sfxBtn.setText(on ? '🔊 音效：開' : '🔕 音效：關');
    });

    this.scoreboardGroup = null;
  }

  _drawTitleTanks() {
    // Left green tank
    const lt = this.add.image(120, 230, 'tank_player').setScale(2.5).setAngle(90);
    // Right red tank
    const rt = this.add.image(GAME_WIDTH - 120, 230, 'tank_enemy').setScale(2.5).setAngle(-90);
    this.tweens.add({ targets: [lt, rt], y: 220, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  _showScoreboard() {
    if (this.scoreboardGroup) {
      this.scoreboardGroup.destroy(true);
      this.scoreboardGroup = null;
      return;
    }
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    this.scoreboardGroup = this.add.group();

    const bg = this.add.rectangle(W/2, H/2, 400, 360, 0x000000, 0.92)
      .setStrokeStyle(2, 0xffdd00);
    this.scoreboardGroup.add(bg);

    const title = this.add.text(W/2, H/2 - 155, '🏆 排行榜 TOP 10', {
      fontSize: '22px', fontFamily: 'Arial', color: '#ffdd00',
    }).setOrigin(0.5);
    this.scoreboardGroup.add(title);

    const scores = ScoreManager.getScores();
    if (scores.length === 0) {
      const none = this.add.text(W/2, H/2, '尚無紀錄', {
        fontSize: '18px', fontFamily: 'Arial', color: '#888888',
      }).setOrigin(0.5);
      this.scoreboardGroup.add(none);
    } else {
      scores.slice(0, 10).forEach((s, i) => {
        const t = this.add.text(W/2, H/2 - 110 + i * 26,
          `${i+1}.  ${s.date}   關卡 ${s.level}   ${s.score} 分`,
          { fontSize: '16px', fontFamily: 'Arial', color: i === 0 ? '#ffdd00' : '#cccccc' }
        ).setOrigin(0.5);
        this.scoreboardGroup.add(t);
      });
    }

    const close = this.add.text(W/2, H/2 + 160, '[ 點擊關閉 ]', {
      fontSize: '15px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => {
      this.scoreboardGroup.destroy(true);
      this.scoreboardGroup = null;
    });
    this.scoreboardGroup.add(close);
  }
}
