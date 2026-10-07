import { followCamera } from './camera';
import {
  BEETLE_H,
  BEETLE_W,
  CLIMB_SPEED,
  COIN_SIZE,
  GRAVITY,
  JUMP_CUT,
  JUMP_SPEED,
  MAX_FALL,
  MOVE_SPEED,
  PLAYER_H,
  PLAYER_W,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './constants';
import { InputState } from './input';
import { parseLevel } from '../levels/parse-level';
import { LevelDefinition, TileType, isSolid, validateLevel } from '../levels/level.model';
import { Aabb, hitsBlockFromBelow, overlaps } from './physics';

interface Actor extends Aabb {
  vx: number;
  vy: number;
}

interface Beetle extends Actor {
  dir: 1 | -1;
  squash: number;
}

interface Popup {
  x: number;
  y: number;
  life: number;
}

interface Coin extends Aabb {}

interface SolidHit {
  col: number;
  row: number;
  type: TileType;
}

const COYOTE_TIME = 0.1;
const JUMP_BUFFER = 0.1;
const BUMP_TIME = 0.16;

export class GameSession {
  tiles: TileType[] = [];
  player: Actor = { x: 0, y: 0, w: PLAYER_W, h: PLAYER_H, vx: 0, vy: 0 };
  beetles: Beetle[] = [];
  coinList: Coin[] = [];
  popups: Popup[] = [];
  coins = 0;
  lives = 3;
  status: 'playing' | 'paused' | 'victory' | 'gameover' = 'playing';
  cameraX = 0;
  cameraY = 0;
  facing: 1 | -1 = 1;
  grounded = false;
  climbing = false;
  iframes = 0;
  time = 0;
  runTime = 0;

  readonly tileSize: number;
  readonly cols: number;
  readonly rowCount: number;
  readonly levelId: string;
  readonly levelName: string;

  private spawn = { x: 0, y: 0 };
  private coyote = 0;
  private jumpBuffer = 0;
  private readonly bumps = new Map<number, number>();
  private readonly definition: LevelDefinition;

  constructor(
    definition: unknown,
    private readonly onComplete: () => void,
  ) {
    this.definition = validateLevel(definition);
    this.tileSize = this.definition.tileSize;
    this.cols = this.definition.rows[0]?.length ?? 0;
    this.rowCount = this.definition.rows.length;
    this.levelId = this.definition.id;
    this.levelName = this.definition.name;
    this.applyParsed();
  }

  togglePause(): void {
    if (this.status === 'playing') {
      this.status = 'paused';
      this.player.vx = 0;
      return;
    }
    if (this.status === 'paused') {
      this.status = 'playing';
    }
  }

  reset(): void {
    this.coins = 0;
    this.lives = 3;
    this.status = 'playing';
    this.iframes = 0;
    this.cameraX = 0;
    this.cameraY = 0;
    this.time = 0;
    this.runTime = 0;
    this.applyParsed();
  }

  bumpOffset(col: number, row: number): number {
    const remaining = this.bumps.get(row * this.cols + col) ?? 0;
    if (remaining <= 0) {
      return 0;
    }
    return -Math.sin((1 - remaining / BUMP_TIME) * Math.PI) * 5;
  }

  update(dt: number, input: InputState): void {
    const jumpPressed = input.consumeJump();
    if (this.status !== 'playing') {
      return;
    }

    this.time += dt;
    this.iframes = Math.max(0, this.iframes - dt);
    this.tickBumps(dt);

    const previousBottom = this.player.y + this.player.h;
    this.updatePlayer(dt, input, jumpPressed);
    this.updateBeetles(dt);
    this.collectCoins();
    this.checkBeetles(previousBottom);
    this.checkThorns();
    this.checkPit();
    this.checkGoal();
    this.updatePopups(dt);
    this.updateCamera(dt);
  }

  private applyParsed(): void {
    const parsed = parseLevel(this.definition);
    this.tiles = parsed.tiles;
    this.spawn = parsed.spawn;
    this.player = { x: parsed.spawn.x, y: parsed.spawn.y, w: PLAYER_W, h: PLAYER_H, vx: 0, vy: 0 };
    this.facing = 1;
    this.climbing = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.bumps.clear();
    this.popups = [];
    this.coinList = parsed.coins.map((coin) => ({ x: coin.x, y: coin.y, w: COIN_SIZE, h: COIN_SIZE }));
    this.beetles = parsed.beetles.map((beetle) => ({
      x: beetle.x,
      y: beetle.y,
      w: BEETLE_W,
      h: BEETLE_H,
      vx: 0,
      vy: 0,
      dir: -1,
      squash: 0,
    }));
    this.grounded = this.hasFooting();
  }

  private updatePlayer(dt: number, input: InputState, jumpPressed: boolean): void {
    const player = this.player;
    const canClimb = input.up && this.touchesPipe();

    if (canClimb) {
      this.climbing = true;
      player.vy = -CLIMB_SPEED;
      const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      player.vx = direction * 52;
      if (direction !== 0) {
        this.facing = direction > 0 ? 1 : -1;
        this.tryMountPipe(direction);
      }
      if (jumpPressed) {
        this.climbing = false;
        player.vy = JUMP_SPEED;
        this.grounded = false;
      }
    } else {
      this.climbing = false;
      const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      player.vx = direction * MOVE_SPEED;
      if (direction !== 0) {
        this.facing = direction > 0 ? 1 : -1;
      }

      if (this.grounded) {
        this.coyote = COYOTE_TIME;
      } else {
        this.coyote = Math.max(0, this.coyote - dt);
      }

      if (jumpPressed) {
        this.jumpBuffer = JUMP_BUFFER;
      } else {
        this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
      }

      if (this.jumpBuffer > 0 && (this.grounded || this.coyote > 0)) {
        player.vy = JUMP_SPEED;
        this.grounded = false;
        this.coyote = 0;
        this.jumpBuffer = 0;
      } else if (this.grounded && player.vy >= 0) {
        player.vy = 0;
      } else {
        player.vy = Math.min(MAX_FALL, player.vy + GRAVITY * dt);
      }

      if (!input.jumpHeld && player.vy < JUMP_CUT) {
        player.vy = JUMP_CUT;
      }
    }

    this.grounded = this.moveActor(player, dt, (col, row) => this.bumpBlock(col, row)) || this.hasFooting();
    if (Math.abs(player.vx) > 1 && this.grounded && !this.climbing) {
      this.runTime += dt;
    } else if (!this.grounded) {
      this.runTime = 0;
    }
  }

  private tryMountPipe(direction: number): void {
    const tileSize = this.tileSize;
    const targetX = direction > 0 ? this.player.x + this.player.w + 1 : this.player.x - 1;
    const col = Math.floor(targetX / tileSize);
    const feetRow = Math.floor((this.player.y + this.player.h - 1) / tileSize);
    if (this.tile(col, feetRow) !== 'empty' || this.tile(col, feetRow + 1) !== 'pipe') {
      return;
    }

    this.player.x = col * tileSize + (tileSize - this.player.w) / 2;
    this.player.y = (feetRow + 1) * tileSize - this.player.h;
    this.player.vx = 0;
    this.player.vy = 0;
    this.grounded = true;
    this.climbing = false;
  }

  private moveActor(body: Actor, dt: number, onCeiling: (col: number, row: number) => void): boolean {
    const startX = body.x;
    body.x += body.vx * dt;
    this.solveX(body, startX);

    const startY = body.y;
    body.y += body.vy * dt;
    const velocityY = body.vy;
    let grounded = false;
    let hitCeiling = false;

    for (const tile of this.overlappingSolids(body)) {
      const rect = this.tileRect(tile.col, tile.row);
      const previous = { x: body.x, y: startY, w: body.w, h: body.h };
      if (overlaps(previous, rect)) {
        continue;
      }

      if (velocityY > 0 && startY + body.h <= rect.y + 1) {
        body.y = Math.min(body.y, rect.y - body.h);
        grounded = true;
      } else if (velocityY < 0 && startY >= rect.y + rect.h - 1) {
        const penetrating = { x: body.x, y: body.y, w: body.w, h: body.h };
        if (hitsBlockFromBelow(penetrating, startY, velocityY, rect)) {
          onCeiling(tile.col, tile.row);
        }
        body.y = Math.max(body.y, rect.y + rect.h);
        hitCeiling = true;
      }
    }

    if (grounded || hitCeiling) {
      body.vy = 0;
    }
    return grounded;
  }

  private solveX(body: Actor, startX: number): void {
    const velocityX = body.vx;
    let hitWall = false;

    for (const tile of this.overlappingSolids(body)) {
      const rect = this.tileRect(tile.col, tile.row);
      const previous = { x: startX, y: body.y, w: body.w, h: body.h };
      if (overlaps(previous, rect)) {
        continue;
      }

      if (velocityX > 0 && startX + body.w <= rect.x + 1) {
        body.x = Math.min(body.x, rect.x - body.w);
        hitWall = true;
      } else if (velocityX < 0 && startX >= rect.x + rect.w - 1) {
        body.x = Math.max(body.x, rect.x + rect.w);
        hitWall = true;
      }
    }

    if (hitWall) {
      body.vx = 0;
    }
  }

  private bumpBlock(col: number, row: number): void {
    const index = row * this.cols + col;
    const type = this.tiles[index];
    if (type !== 'question' && type !== 'block') {
      return;
    }
    if (this.bumps.has(index)) {
      return;
    }

    this.bumps.set(index, BUMP_TIME);
    if (type === 'question') {
      this.tiles[index] = 'used';
      this.coins += 1;
      this.popups.push({
        x: col * this.tileSize + (this.tileSize - COIN_SIZE) / 2,
        y: row * this.tileSize,
        life: 0.45,
      });
    }
  }

  private tickBumps(dt: number): void {
    for (const [index, remaining] of this.bumps) {
      const next = remaining - dt;
      if (next <= 0) {
        this.bumps.delete(index);
      } else {
        this.bumps.set(index, next);
      }
    }
  }

  private updateBeetles(dt: number): void {
    for (const beetle of this.beetles) {
      if (beetle.squash > 0) {
        beetle.squash += dt;
        continue;
      }

      const aheadX = beetle.dir > 0 ? beetle.x + beetle.w + 1 : beetle.x - 1;
      const col = Math.floor(aheadX / this.tileSize);
      const bodyRow = Math.floor((beetle.y + beetle.h / 2) / this.tileSize);
      const feetRow = Math.floor((beetle.y + beetle.h + 1) / this.tileSize);
      const ahead = this.tile(col, bodyRow);
      const ground = this.tile(col, feetRow);
      if (isSolid(ahead) || ahead === 'thorn' || !isSolid(ground)) {
        beetle.dir = beetle.dir === 1 ? -1 : 1;
      }

      const previousX = beetle.x;
      beetle.x += beetle.dir * 34 * dt;
      if (this.overlappingSolids(beetle).length > 0) {
        beetle.x = previousX;
        beetle.dir = beetle.dir === 1 ? -1 : 1;
      }
    }

    this.beetles = this.beetles.filter((beetle) => beetle.squash === 0 || beetle.squash < 0.28);
  }

  private collectCoins(): void {
    const kept: Coin[] = [];
    for (const coin of this.coinList) {
      if (overlaps(this.player, coin)) {
        this.coins += 1;
      } else {
        kept.push(coin);
      }
    }
    this.coinList = kept;
  }

  private checkBeetles(previousBottom: number): void {
    const falling = this.player.vy > 0;
    for (const beetle of this.beetles) {
      if (beetle.squash > 0 || !overlaps(this.player, beetle)) {
        continue;
      }

      if (falling && previousBottom <= beetle.y + 6) {
        beetle.squash = 0.001;
        this.player.vy = -280;
        this.grounded = false;
      } else {
        this.damage(false);
      }
    }
  }

  private checkThorns(): void {
    if (this.iframes > 0) {
      return;
    }
    if (this.tilesTouching(this.player).includes('thorn')) {
      this.damage(false);
    }
  }

  private checkPit(): void {
    if (this.player.y <= this.rowCount * this.tileSize) {
      return;
    }
    this.iframes = 0;
    this.damage(true);
  }

  private checkGoal(): void {
    if (this.status !== 'playing') {
      return;
    }
    if (this.tilesTouching(this.player).includes('goal')) {
      this.status = 'victory';
      this.player.vx = 0;
      this.player.vy = 0;
      this.onComplete();
    }
  }

  private damage(pit: boolean): void {
    if (this.status !== 'playing') {
      return;
    }
    if (!pit && this.iframes > 0) {
      return;
    }

    this.lives -= 1;
    if (this.lives <= 0) {
      this.lives = 0;
      this.status = 'gameover';
      this.player.vx = 0;
      this.player.vy = 0;
      return;
    }

    this.iframes = 1.15;
    this.player.vx = 0;
    this.player.vy = 0;
    this.climbing = false;
    this.grounded = false;

    if (pit) {
      this.player.x = this.spawn.x;
      this.player.y = this.spawn.y;
      this.cameraX = Math.max(0, this.spawn.x - VIEW_WIDTH * 0.3);
      return;
    }

    this.player.vy = -240;
    this.player.vx = -this.facing * 100;
  }

  private updatePopups(dt: number): void {
    for (const popup of this.popups) {
      popup.y -= 36 * dt;
      popup.life -= dt;
    }
    this.popups = this.popups.filter((popup) => popup.life > 0);
  }

  private updateCamera(dt: number): void {
    const worldWidth = this.cols * this.tileSize;
    const worldHeight = this.rowCount * this.tileSize;
    this.cameraX = followCamera(this.cameraX, this.player.x + this.player.w / 2 - VIEW_WIDTH * 0.4, worldWidth, VIEW_WIDTH, dt);
    this.cameraY = followCamera(this.cameraY, this.player.y + this.player.h / 2 - VIEW_HEIGHT * 0.55, worldHeight, VIEW_HEIGHT, dt);
  }

  private hasFooting(): boolean {
    const feet = {
      x: this.player.x + 1,
      y: this.player.y + this.player.h,
      w: Math.max(1, this.player.w - 2),
      h: 2,
    };
    return this.overlappingSolids(feet).length > 0;
  }

  private touchesPipe(): boolean {
    const probe = {
      x: this.player.x - 3,
      y: this.player.y + 4,
      w: this.player.w + 6,
      h: Math.max(4, this.player.h - 8),
    };
    return this.tilesTouching(probe).includes('pipe');
  }

  private tilesTouching(rect: Aabb): TileType[] {
    const tileSize = this.tileSize;
    const c0 = Math.floor(rect.x / tileSize);
    const c1 = Math.floor((rect.x + rect.w - 0.001) / tileSize);
    const r0 = Math.floor(rect.y / tileSize);
    const r1 = Math.floor((rect.y + rect.h - 0.001) / tileSize);
    const types: TileType[] = [];

    for (let row = r0; row <= r1; row += 1) {
      for (let col = c0; col <= c1; col += 1) {
        types.push(this.tile(col, row));
      }
    }
    return types;
  }

  private overlappingSolids(rect: Aabb): SolidHit[] {
    const tileSize = this.tileSize;
    const c0 = Math.floor(rect.x / tileSize);
    const c1 = Math.floor((rect.x + rect.w - 0.001) / tileSize);
    const r0 = Math.floor(rect.y / tileSize);
    const r1 = Math.floor((rect.y + rect.h - 0.001) / tileSize);
    const hits: SolidHit[] = [];

    for (let row = r0; row <= r1; row += 1) {
      for (let col = c0; col <= c1; col += 1) {
        const type = this.tile(col, row);
        if (isSolid(type)) {
          hits.push({ col, row, type });
        }
      }
    }
    return hits;
  }

  private tile(col: number, row: number): TileType {
    if (row < 0 || row >= this.rowCount) {
      return 'empty';
    }
    if (col < 0 || col >= this.cols) {
      return 'solid';
    }
    return this.tiles[row * this.cols + col] ?? 'empty';
  }

  private tileRect(col: number, row: number): Aabb {
    return { x: col * this.tileSize, y: row * this.tileSize, w: this.tileSize, h: this.tileSize };
  }
}
