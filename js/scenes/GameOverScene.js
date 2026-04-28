class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.score = data.score || 0;
    this.level = data.level || 1;
  }

  create() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;

    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.88);

    this.add.text(W/2, H/2 - 140, 'GAME OVER', {
      fontSize: '54px', fontFamily: 'Arial Black',
      color: '#ff2222', stroke: '#880000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(W/2, H/2 - 60, `到達第 ${this.level} 關`, {
      fontSize: '24px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(W/2, H/2 - 20, `最終得分：${this.score}`, {
      fontSize: '30px', fontFamily: 'Arial Black', color: '#ffdd00',
    }).setOrigin(0.5);

    // Scoreboard
    this._drawScoreboard(W, H);

    // Retry
    const retryBtn = this.add.text(W/2 - 100, H/2 + 160, '重新開始', {
      fontSize: '22px', fontFamily: 'Arial',
      color: '#ffffff', backgroundColor: '#882222',
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retryBtn.on('pointerover', () => retryBtn.setStyle({ backgroundColor: '#aa3333' }));
    retryBtn.on('pointerout',  () => retryBtn.setStyle({ backgroundColor: '#882222' }));
    retryBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { level: 1, score: 0, lives: PLAYER_LIVES });
    });

    // Menu
    const menuBtn = this.add.text(W/2 + 100, H/2 + 160, '主選單', {
      fontSize: '22px', fontFamily: 'Arial',
      color: '#ffffff', backgroundColor: '#333333',
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerover', () => menuBtn.setStyle({ backgroundColor: '#555555' }));
    menuBtn.on('pointerout',  () => menuBtn.setStyle({ backgroundColor: '#333333' }));
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  _drawScoreboard(W, H) {
    const scores = ScoreManager.getScores();
    if (!scores.length) return;

    this.add.text(W/2, H/2 + 30, '─── 排行榜 ───', {
      fontSize: '16px', fontFamily: 'Arial', color: '#666666',
    }).setOrigin(0.5);

    scores.slice(0, 5).forEach((s, i) => {
      const color = (s.score === this.score && s.level === this.level) ? '#ffdd00' : '#aaaaaa';
      this.add.text(W/2, H/2 + 54 + i * 22,
        `${i+1}.  ${s.date}  關卡${s.level}  ${s.score}分`,
        { fontSize: '15px', fontFamily: 'Arial', color }
      ).setOrigin(0.5);
    });
  }
}
