class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    this._makeTiles();
    this._makeTanks();
    this._makeBullets();
    this._makePowerUps();
    this._makeShieldFx();
    this._makeExplosion();
    this._makePixel();
    this.scene.start('MenuScene');
  }

  _g() { return this.make.graphics({ x: 0, y: 0, add: false }); }

  _makeTiles() {
    const S = TILE_SIZE;

    // Empty floor
    const floor = this._g();
    floor.fillStyle(0x2a2a2a); floor.fillRect(0, 0, S, S);
    floor.lineStyle(1, 0x333333); floor.strokeRect(0, 0, S, S);
    floor.generateTexture('tile_empty', S, S); floor.destroy();

    // Brick
    const brick = this._g();
    brick.fillStyle(0x994422); brick.fillRect(0, 0, S, S);
    brick.fillStyle(0xcc5533);
    // Brick pattern rows
    [[0,0,14,7],[16,0,16,7],[0,8,8,7],[10,8,22,7],[0,16,14,7],[16,16,16,7],[0,24,8,7],[10,24,22,7]].forEach(([x,y,w,h]) => {
      brick.fillRect(x+1, y+1, w-1, h-1);
    });
    brick.generateTexture('tile_brick', S, S); brick.destroy();

    // Steel
    const steel = this._g();
    steel.fillStyle(0x666677); steel.fillRect(0, 0, S, S);
    steel.fillStyle(0x8888aa);
    steel.fillRect(2, 2, S-4, S/2-3);
    steel.fillRect(2, S/2+1, S-4, S/2-3);
    steel.lineStyle(1, 0x444455);
    steel.strokeRect(0, 0, S, S);
    steel.generateTexture('tile_steel', S, S); steel.destroy();

    // Water (animated-ish via alpha trick — static here)
    const water = this._g();
    water.fillStyle(0x1144aa); water.fillRect(0, 0, S, S);
    water.fillStyle(0x2255cc, 0.6);
    water.fillRect(2, 4, 10, 4); water.fillRect(16, 10, 12, 4);
    water.fillRect(4, 18, 8, 4);  water.fillRect(18, 22, 10, 4);
    water.generateTexture('tile_water', S, S); water.destroy();

    // Grass
    const grass = this._g();
    grass.fillStyle(0x1a7a1a, 0.85); grass.fillRect(0, 0, S, S);
    grass.fillStyle(0x22aa22, 0.7);
    grass.fillRect(3,  3,  8,  12);
    grass.fillRect(14, 2,  6,  14);
    grass.fillRect(5,  18, 10, 10);
    grass.fillRect(20, 16, 8,  12);
    grass.generateTexture('tile_grass', S, S); grass.destroy();
  }

  _drawTank(g, S, bodyHex, trackHex, barrelHex) {
    const trackW = 5, barrelW = 4, barrelH = 11;
    // Tracks
    g.fillStyle(trackHex);
    g.fillRect(0, 0, trackW, S);
    g.fillRect(S - trackW, 0, trackW, S);
    // Track details
    g.fillStyle(trackHex - 0x111111);
    for (let i = 0; i < S; i += 6) {
      g.fillRect(0, i, trackW, 3);
      g.fillRect(S - trackW, i, trackW, 3);
    }
    // Body
    g.fillStyle(bodyHex);
    g.fillRect(trackW, 3, S - trackW * 2, S - 6);
    // Barrel (pointing UP = toward y=0)
    g.fillStyle(barrelHex);
    g.fillRect(S / 2 - barrelW / 2, 0, barrelW, barrelH);
    // Turret
    g.fillStyle(bodyHex - 0x0a0a00);
    g.fillCircle(S / 2, S / 2 + 2, 7);
    // Highlight
    g.fillStyle(0xffffff, 0.2);
    g.fillRect(trackW + 2, 4, 6, 5);
  }

  _makeTanks() {
    const S = 28;
    const p = this._g();
    this._drawTank(p, S, 0x44bb44, 0x227722, 0x336633);
    p.generateTexture('tank_player', S, S); p.destroy();

    const e = this._g();
    this._drawTank(e, S, 0xcc4444, 0x881111, 0x772222);
    e.generateTexture('tank_enemy', S, S); e.destroy();
  }

  _makeBullets() {
    const player = this._g();
    player.fillStyle(0xffee00); player.fillCircle(4, 4, 4);
    player.generateTexture('bullet', 8, 8); player.destroy();

    const enemy = this._g();
    enemy.fillStyle(0xff6600); enemy.fillCircle(4, 4, 4);
    enemy.generateTexture('bullet_enemy', 8, 8); enemy.destroy();
  }

  _makePowerUps() {
    const S = 26;

    // Speed — yellow lightning
    const sp = this._g();
    sp.fillStyle(0xffdd00); sp.fillRect(0, 0, S, S);
    sp.fillStyle(0xffffff);
    sp.fillTriangle(13,3, 6,14, 12,14, 7,23, 20,11, 14,11);
    sp.generateTexture('powerup_speed', S, S); sp.destroy();

    // Shield — blue circle with star
    const sh = this._g();
    sh.fillStyle(0x2266ff); sh.fillRect(0, 0, S, S);
    sh.fillStyle(0xaaccff); sh.fillCircle(S/2, S/2, S/2-3);
    sh.fillStyle(0x2266ff); sh.fillCircle(S/2, S/2, S/2-7);
    sh.generateTexture('powerup_shield', S, S); sh.destroy();

    // Bomb — red with fuse
    const bo = this._g();
    bo.fillStyle(0xdd2222); bo.fillRect(0, 0, S, S);
    bo.fillStyle(0xffaaaa); bo.fillCircle(S/2, S/2+2, S/2-4);
    bo.fillStyle(0x553311); bo.fillRect(S/2-1, 2, 3, 6);
    bo.fillStyle(0xffcc00); bo.fillCircle(S/2+1, 4, 3);
    bo.generateTexture('powerup_bomb', S, S); bo.destroy();
  }

  _makeShieldFx() {
    const S = 36;
    const g = this._g();
    g.lineStyle(3, 0x44aaff, 0.9);
    g.strokeCircle(S/2, S/2, S/2 - 2);
    g.lineStyle(1, 0x88ccff, 0.5);
    g.strokeCircle(S/2, S/2, S/2 - 6);
    g.generateTexture('shield_fx', S, S); g.destroy();
  }

  _makeExplosion() {
    // Main fireball
    const S = 48;
    const g = this._g();
    g.fillStyle(0xff8800, 0.9); g.fillCircle(S/2, S/2, S/2);
    g.fillStyle(0xffcc00, 0.85); g.fillCircle(S/2, S/2, S/2 - 5);
    g.fillStyle(0xffffff, 0.7); g.fillCircle(S/2, S/2, S/2 - 14);
    g.generateTexture('explosion', S, S); g.destroy();

    // Dark smoke ring
    const sg = this._g();
    sg.lineStyle(6, 0x552200, 0.7); sg.strokeCircle(24, 24, 20);
    sg.lineStyle(3, 0x331100, 0.4); sg.strokeCircle(24, 24, 16);
    sg.generateTexture('explosion_smoke', 48, 48); sg.destroy();

    // Small spark (bright dot)
    const spk = this._g();
    spk.fillStyle(0xffff88, 1.0); spk.fillCircle(5, 5, 5);
    spk.fillStyle(0xffffff, 0.8); spk.fillCircle(5, 5, 2);
    spk.generateTexture('spark', 10, 10); spk.destroy();

    // Shockwave ring
    const sw = this._g();
    sw.lineStyle(3, 0xffaa44, 0.9); sw.strokeCircle(32, 32, 28);
    sw.generateTexture('shockwave', 64, 64); sw.destroy();
  }

  _makePixel() {
    const g = this._g();
    g.fillStyle(0xffffff); g.fillRect(0, 0, 1, 1);
    g.generateTexture('pixel', 1, 1); g.destroy();
  }
}
