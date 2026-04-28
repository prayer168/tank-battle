class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    const W = GAME_WIDTH;

    // HUD background
    this.add.rectangle(W/2, HUD_HEIGHT/2, W, HUD_HEIGHT, 0x000000);
    this.add.line(0, HUD_HEIGHT, 0, HUD_HEIGHT, W, HUD_HEIGHT, 0x444444).setOrigin(0);

    // Labels
    this.scoreLabel = this.add.text(16, 10, '分數', { fontSize:'13px', fontFamily:'Arial', color:'#aaaaaa' });
    this.scoreText  = this.add.text(16, 26, '0',    { fontSize:'20px', fontFamily:'Arial Black', color:'#ffdd00' });

    this.levelLabel = this.add.text(W/2, 10, '關卡', { fontSize:'13px', fontFamily:'Arial', color:'#aaaaaa' }).setOrigin(0.5, 0);
    this.levelText  = this.add.text(W/2, 26, '1',   { fontSize:'20px', fontFamily:'Arial Black', color:'#ffffff' }).setOrigin(0.5, 0);

    this.livesLabel  = this.add.text(W/2 + 80, 10, '生命', { fontSize:'13px', fontFamily:'Arial', color:'#aaaaaa' });
    this.livesText   = this.add.text(W/2 + 80, 26, '♥ ♥ ♥', { fontSize:'17px', fontFamily:'Arial', color:'#ff4444' });

    this.enemiesLabel = this.add.text(W/2 + 200, 10, '敵人', { fontSize:'13px', fontFamily:'Arial', color:'#aaaaaa' });
    this.enemiesText  = this.add.text(W/2 + 200, 26, '0',   { fontSize:'20px', fontFamily:'Arial Black', color:'#ff8844' });

    // In-game sound toggles
    this._sfxOn   = true;
    this._musicOn = true;

    this.sfxBtn = this.add.text(W - 8, 12, '🔊', {
      fontSize: '18px', fontFamily: 'Arial',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setAlpha(0.7);
    this.sfxBtn.on('pointerdown', () => {
      Sound.resume();
      this._sfxOn = Sound.toggleSFX();
      this.sfxBtn.setText(this._sfxOn ? '🔊' : '🔕');
    });

    this.musicBtn = this.add.text(W - 36, 12, '🎵', {
      fontSize: '18px', fontFamily: 'Arial',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setAlpha(0.7);
    this.musicBtn.on('pointerdown', () => {
      Sound.resume();
      this._musicOn = Sound.toggleMusic();
      this.musicBtn.setText(this._musicOn ? '🎵' : '🔇');
    });

    // Listen to game scene events
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('hud-update', this._onHudUpdate, this);
  }

  _onHudUpdate({ score, lives, level, enemies }) {
    this.scoreText.setText(score.toString());
    this.levelText.setText(level.toString());
    this.enemiesText.setText(Math.max(0, enemies).toString());
    const hearts = lives > 0 ? Array(lives).fill('♥').join(' ') : '☠';
    this.livesText.setText(hearts);
    this.livesText.setColor(lives > 0 ? '#ff4444' : '#888888');
  }
}
