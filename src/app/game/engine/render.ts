import { COIN_SIZE, VIEW_HEIGHT, VIEW_WIDTH } from './constants';
import { GameSession } from './session';
import { Sprites } from './sprites';
import { TileType, isSolid } from '../levels/level.model';

export function renderGame(context: CanvasRenderingContext2D, session: GameSession, sprites: Sprites): void {
  const cameraX = Math.floor(session.cameraX);
  const cameraY = Math.floor(session.cameraY);
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  drawSky(context);
  drawCanopy(context, cameraX * 0.2, 78, '#1f6b45', 34);
  drawCanopy(context, cameraX * 0.38, 96, '#145233', 22);
  drawBushes(context, cameraX * 0.55);

  const tileSize = session.tileSize;
  const firstCol = Math.max(0, Math.floor(cameraX / tileSize) - 1);
  const lastCol = Math.min(session.cols - 1, Math.ceil((cameraX + VIEW_WIDTH) / tileSize) + 1);
  const firstRow = Math.max(0, Math.floor(cameraY / tileSize) - 1);
  const lastRow = Math.min(session.rowCount - 1, Math.ceil((cameraY + VIEW_HEIGHT) / tileSize) + 1);

  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let col = firstCol; col <= lastCol; col += 1) {
      drawTile(context, session, sprites, col, row, cameraX, cameraY);
    }
  }

  const coinFrame = Math.floor(session.time * 6) % 2 === 0 ? sprites.coinA : sprites.coinB;
  const coinShift = (sprites.coinA.width - COIN_SIZE) / 2;
  for (const coin of session.coinList) {
    context.drawImage(coinFrame, Math.round(coin.x - cameraX - coinShift), Math.round(coin.y - cameraY - coinShift));
  }

  for (const popup of session.popups) {
    context.drawImage(sprites.coinA, Math.round(popup.x - cameraX - coinShift), Math.round(popup.y - cameraY - coinShift));
  }

  for (const beetle of session.beetles) {
    const sprite = beetle.squash > 0 ? sprites.beetleFlat : sprites.beetle;
    context.drawImage(sprite, Math.round(beetle.x - cameraX), Math.round(beetle.y - cameraY - 2));
  }

  drawPlayer(context, session, sprites, cameraX, cameraY);
}

function drawSky(context: CanvasRenderingContext2D): void {
  const sky = context.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  sky.addColorStop(0, '#79d0ef');
  sky.addColorStop(0.45, '#b7e4ef');
  sky.addColorStop(1, '#c6ecb4');
  context.fillStyle = sky;
  context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

function drawCanopy(context: CanvasRenderingContext2D, offset: number, baseline: number, color: string, height: number): void {
  context.fillStyle = color;
  const spacing = 70;
  const start = Math.floor(offset / spacing) - 1;
  for (let index = start; index < start + 8; index += 1) {
    const x = Math.round(index * spacing - offset);
    const tree = height + (index % 3) * 8;
    context.fillRect(x, baseline - tree, 28, tree);
    context.fillRect(x + 8, baseline - tree - 18, 18, 22);
    context.fillRect(x + 13, baseline - tree - 30, 8, 14);
  }
}

function drawBushes(context: CanvasRenderingContext2D, offset: number): void {
  context.fillStyle = '#2f8a45';
  const spacing = 48;
  const start = Math.floor(offset / spacing) - 1;
  for (let index = start; index < start + 12; index += 1) {
    const x = Math.round(index * spacing - offset);
    const y = VIEW_HEIGHT - 28;
    context.fillRect(x, y, 26, 10);
    context.fillRect(x + 4, y - 8, 16, 10);
  }
}

function drawTile(
  context: CanvasRenderingContext2D,
  session: GameSession,
  sprites: Sprites,
  col: number,
  row: number,
  cameraX: number,
  cameraY: number,
): void {
  const type = tileAt(session, col, row);
  if (type === 'empty') {
    return;
  }

  const x = Math.round(col * session.tileSize - cameraX);
  const y = Math.round(row * session.tileSize - cameraY + session.bumpOffset(col, row));
  const sprite = spriteForTile(session, sprites, type, col, row);
  context.drawImage(sprite, x, y);
}

function spriteForTile(session: GameSession, sprites: Sprites, type: TileType, col: number, row: number): HTMLCanvasElement {
  if (type === 'solid') {
    const above = tileAt(session, col, row - 1);
    return isSolid(above) || above === 'goal' || above === 'thorn' ? sprites.dirt : sprites.grass;
  }

  if (type === 'pipe') {
    return pipeSprite(session, sprites, col, row);
  }

  if (type === 'block') {
    return sprites.crate;
  }

  if (type === 'question') {
    return Math.floor(session.time * 4) % 2 === 0 ? sprites.questionA : sprites.questionB;
  }

  if (type === 'used') {
    return sprites.used;
  }

  if (type === 'thorn') {
    return sprites.thorn;
  }

  return castleSprite(session, sprites, col, row);
}

function pipeSprite(session: GameSession, sprites: Sprites, col: number, row: number): HTMLCanvasElement {
  const cap = tileAt(session, col, row - 1) !== 'pipe';
  const left = tileAt(session, col - 1, row) === 'pipe';
  const right = tileAt(session, col + 1, row) === 'pipe';

  if (!left && !right) {
    return cap ? sprites.pipeCapSingle : sprites.pipeBodySingle;
  }
  if (!left) {
    return cap ? sprites.pipeCapLeft : sprites.pipeBodyLeft;
  }
  return cap ? sprites.pipeCapRight : sprites.pipeBodyRight;
}

function castleSprite(session: GameSession, sprites: Sprites, col: number, row: number): HTMLCanvasElement {
  const above = tileAt(session, col, row - 1) === 'goal';
  const below = tileAt(session, col, row + 1) === 'goal';
  if (!above) {
    return sprites.battlement;
  }
  if (!below && isCastleDoor(session, col, row)) {
    return sprites.castleDoor;
  }
  if (!below) {
    return sprites.castleBase;
  }
  return sprites.castleWall;
}

function isCastleDoor(session: GameSession, col: number, row: number): boolean {
  let left = col;
  while (tileAt(session, left - 1, row) === 'goal') {
    left -= 1;
  }
  let right = col;
  while (tileAt(session, right + 1, row) === 'goal') {
    right += 1;
  }
  return Math.abs(col - (left + right) / 2) < 1;
}

function tileAt(session: GameSession, col: number, row: number): TileType {
  if (col < 0 || row < 0 || col >= session.cols || row >= session.rowCount) {
    return 'empty';
  }
  return session.tiles[row * session.cols + col] ?? 'empty';
}

function drawPlayer(context: CanvasRenderingContext2D, session: GameSession, sprites: Sprites, cameraX: number, cameraY: number): void {
  if (session.iframes > 0 && Math.floor(session.time * 14) % 2 === 0) {
    return;
  }

  const sprite = playerSprite(session, sprites);
  const screenX = Math.round(session.player.x - cameraX - 2);
  const screenY = Math.round(session.player.y - cameraY);

  context.save();
  if (session.facing < 0) {
    context.translate(screenX + sprite.width, screenY);
    context.scale(-1, 1);
    context.drawImage(sprite, 0, 0);
  } else {
    context.drawImage(sprite, screenX, screenY);
  }
  context.restore();
}

function playerSprite(session: GameSession, sprites: Sprites): HTMLCanvasElement {
  if (session.climbing) {
    return sprites.playerClimb;
  }
  if (!session.grounded) {
    return sprites.playerJump;
  }
  if (Math.abs(session.player.vx) > 10) {
    return Math.floor(session.runTime * 10) % 2 === 0 ? sprites.playerRunA : sprites.playerRunB;
  }
  return sprites.playerIdle;
}
