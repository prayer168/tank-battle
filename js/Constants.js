const TILE_SIZE = 32;
const MAP_COLS = 25;
const MAP_ROWS = 18;
const HUD_HEIGHT = 64;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 640; // HUD_HEIGHT + MAP_ROWS * TILE_SIZE = 64 + 576

const TILE = { EMPTY: 0, BRICK: 1, STEEL: 2, WATER: 3, GRASS: 4 };

const DIR = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };
const DIR_ANGLE = [0, 90, 180, -90];
const DIR_VX    = [0, 1, 0, -1];
const DIR_VY    = [-1, 0, 1, 0];

const POWERUP_TYPE = { SPEED: 0, SHIELD: 1, BOMB: 2 };

// 8 levels of increasing difficulty
const LEVEL_CONFIGS = [
  { level:1, enemies:5,  speed:80,  bulletSpeed:220, fireRate:2800, aggression:0.25, brickDensity:0.18, steelDensity:0.05, clearBonus:500  },
  { level:2, enemies:7,  speed:90,  bulletSpeed:240, fireRate:2500, aggression:0.35, brickDensity:0.20, steelDensity:0.06, clearBonus:800  },
  { level:3, enemies:9,  speed:100, bulletSpeed:260, fireRate:2200, aggression:0.45, brickDensity:0.22, steelDensity:0.08, clearBonus:1100 },
  { level:4, enemies:11, speed:110, bulletSpeed:280, fireRate:2000, aggression:0.55, brickDensity:0.23, steelDensity:0.10, clearBonus:1500 },
  { level:5, enemies:13, speed:118, bulletSpeed:295, fireRate:1800, aggression:0.65, brickDensity:0.24, steelDensity:0.11, clearBonus:2000 },
  { level:6, enemies:15, speed:126, bulletSpeed:310, fireRate:1600, aggression:0.72, brickDensity:0.23, steelDensity:0.12, clearBonus:2600 },
  { level:7, enemies:18, speed:134, bulletSpeed:325, fireRate:1400, aggression:0.80, brickDensity:0.22, steelDensity:0.13, clearBonus:3300 },
  { level:8, enemies:20, speed:142, bulletSpeed:340, fireRate:1200, aggression:0.88, brickDensity:0.20, steelDensity:0.14, clearBonus:4200 },
];

const ENEMY_SCORE = 100; // base score per kill, multiplied by level
const MAX_ACTIVE_ENEMIES = 4;
const PLAYER_SPEED = 130;
const PLAYER_BULLET_SPEED = 350;
const PLAYER_FIRE_COOLDOWN = 500;
const PLAYER_LIVES = 3;
const SHIELD_DURATION = 8000;
const SPEED_DURATION = 6000;
const POWERUP_SPAWN_INTERVAL = 12000;
