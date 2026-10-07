export const TILE_CHARACTERS = ['.', 'S', 'P', 'B', '?', 'c', '^', 'E', 'G', '@'] as const;

export type TileCharacter = (typeof TILE_CHARACTERS)[number];

export type TileType = 'empty' | 'solid' | 'pipe' | 'block' | 'question' | 'used' | 'thorn' | 'goal';

export interface LevelDefinition {
  id: string;
  name: string;
  tileSize: number;
  rows: string[];
}

const LEGEND = new Set<string>(TILE_CHARACTERS);

export class LevelFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LevelFormatError';
  }
}

export function isSolid(type: TileType): boolean {
  return type === 'solid' || type === 'pipe' || type === 'block' || type === 'question' || type === 'used';
}

export function validateLevel(data: unknown): LevelDefinition {
  if (typeof data !== 'object' || data === null) {
    throw new LevelFormatError('El nivel no es un objeto JSON.');
  }

  const record = data as Record<string, unknown>;
  const id = record['id'];
  const name = record['name'];
  const tileSize = record['tileSize'];
  const rows = record['rows'];

  if (typeof id !== 'string' || !/^[a-z0-9-]+$/i.test(id)) {
    throw new LevelFormatError('El nivel necesita un id en minúsculas, números o guiones.');
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new LevelFormatError('El nivel necesita un nombre.');
  }

  if (typeof tileSize !== 'number' || !Number.isInteger(tileSize) || tileSize <= 0) {
    throw new LevelFormatError('tileSize debe ser un entero positivo.');
  }

  if (!Array.isArray(rows) || rows.length === 0 || rows.some((row) => typeof row !== 'string')) {
    throw new LevelFormatError('Las filas del nivel deben ser una lista de textos.');
  }

  const levelRows = rows as string[];
  const width = levelRows[0]?.length ?? 0;
  if (width === 0) {
    throw new LevelFormatError('Las filas del nivel no pueden estar vacías.');
  }

  for (const row of levelRows) {
    if (row.length !== width) {
      throw new LevelFormatError('Todas las filas deben tener el mismo ancho.');
    }

    for (const character of row) {
      if (!LEGEND.has(character)) {
        throw new LevelFormatError(`Carácter de nivel desconocido: ${character}`);
      }
    }
  }

  const flat = levelRows.join('');
  const spawns = flat.split('@').length - 1;
  if (spawns !== 1) {
    throw new LevelFormatError('El nivel debe tener un único inicio @.');
  }

  if (!flat.includes('G')) {
    throw new LevelFormatError('El nivel debe tener una meta G.');
  }

  return { id, name: name.trim(), tileSize, rows: levelRows };
}
