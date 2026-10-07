import { BEETLE_H, BEETLE_W, COIN_SIZE, PLAYER_H, PLAYER_W } from '../engine/constants';
import { TileType, validateLevel } from './level.model';

export interface SpawnPoint {
  x: number;
  y: number;
}

export interface ParsedLevel {
  id: string;
  name: string;
  tileSize: number;
  cols: number;
  rowCount: number;
  tiles: TileType[];
  spawn: SpawnPoint;
  coins: SpawnPoint[];
  beetles: SpawnPoint[];
}

const CHARACTER_TILE: Record<string, TileType> = {
  '.': 'empty',
  '@': 'empty',
  c: 'empty',
  E: 'empty',
  S: 'solid',
  P: 'pipe',
  B: 'block',
  '?': 'question',
  '^': 'thorn',
  G: 'goal',
};

export function parseLevel(data: unknown): ParsedLevel {
  const definition = validateLevel(data);
  const tileSize = definition.tileSize;
  const cols = definition.rows[0]?.length ?? 0;
  const rowCount = definition.rows.length;
  const tiles: TileType[] = [];
  const coins: SpawnPoint[] = [];
  const beetles: SpawnPoint[] = [];
  let spawn: SpawnPoint = { x: 0, y: 0 };

  definition.rows.forEach((row, rowIndex) => {
    [...row].forEach((character, col) => {
      tiles.push(CHARACTER_TILE[character] ?? 'empty');
      const originX = col * tileSize;
      const originY = rowIndex * tileSize;

      if (character === '@') {
        spawn = {
          x: originX + (tileSize - PLAYER_W) / 2,
          y: originY + (tileSize - PLAYER_H),
        };
      }

      if (character === 'c') {
        coins.push({
          x: originX + (tileSize - COIN_SIZE) / 2,
          y: originY + (tileSize - COIN_SIZE) / 2,
        });
      }

      if (character === 'E') {
        beetles.push({
          x: originX + (tileSize - BEETLE_W) / 2,
          y: originY + (tileSize - BEETLE_H),
        });
      }
    });
  });

  return {
    id: definition.id,
    name: definition.name,
    tileSize,
    cols,
    rowCount,
    tiles,
    spawn,
    coins,
    beetles,
  };
}
