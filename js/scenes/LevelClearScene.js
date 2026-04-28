class LevelClearScene extends Phaser.Scene {
  constructor() { super('LevelClearScene'); }

  init(data) {
    this.level       = data.level;
    this.score       = data.score;
    this.lives       = data.lives;
    this.bonus       = data.bonus;
    this.hasNextLevel = data.hasNextLevel;
  }

  create() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;

    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.8);

    this.add.text(W/2, H/2 - 130, `第 ${this.level} 關　過關！`, {
      fontSize: '42px', fontFamily: 'Arial Black',
      color: '#ffdd00', stroke: '#885500', strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(W/2, H/2 - 60, `通關獎勵：+${this.bonus} 分`, {
      fontSize: '24px', fontFamily: 'Arial', color: '#aaffaa',
    }).setOrigin(0.5);

    this.add.text(W/2, H/2 - 20, `總分：${this.score}`, {
      fontSize: '28px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    if (this.hasNextLevel) {
      const nextBtn = this.add.text(W/2, H/2 + 60, '▶  進入下一關', {
        fontSize: '28px', fontFamily: 'Arial',
        color: '#ffffff', backgroundColor: '#226622',
        padding: { x: 24, y: 12 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      nextBtn.on('pointerover', () => nextBtn.setStyle({ backgroundColor: '#338833' }));
      nextBtn.on('pointerout',  () => nextBtn.setStyle({ backgroundColor: '#226622' }));
      nextBtn.on('pointerdown', () => {
        this.scene.start('GameScene', {
          level: this.level + 1,
          score: this.score,
          lives: this.lives,
        });
      });

      this.input.keyboard.once('keydown-ENTER', () => {
        this.scene.start('GameScene', { level: this.level + 1, score: this.score, lives: this.lives });
      });
    } else {
      this.add.text(W/2, H/2 + 40, '🎉 恭喜通關所有關卡！', {
        fontSize: '30px', fontFamily: 'Arial Black', color: '#ffdd00',
      }).setOrigin(0.5);

      ScoreManager.saveScore(this.score, this.level);

      const menuBtn = this.add.text(W/2, H/2 + 100, '回主選單', {
        fontSize: '24px', fontFamily: 'Arial',
        color: '#ffffff', backgroundColor: '#333333',
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
  }
}
