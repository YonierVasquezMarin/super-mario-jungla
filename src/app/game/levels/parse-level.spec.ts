import { LevelFormatError, validateLevel } from './level.model';
import { parseLevel } from './parse-level';

const example = {
  id: 'demo',
  name: 'Demo',
  tileSize: 16,
  rows: ['..c.E.', '@..?G.', 'SSSSSS'],
};

describe('validateLevel', () => {
  it('acepta un nivel con filas del mismo ancho', () => {
    expect(validateLevel(example)).toEqual(example);
  });

  it('rechaza filas de distinto ancho', () => {
    expect(() => validateLevel({ ...example, rows: ['..', '.'] })).toThrow(LevelFormatError);
  });

  it('rechaza un carácter desconocido', () => {
    expect(() => validateLevel({ ...example, rows: ['..X.', '@..G', 'SSSS'] })).toThrow(/desconocido/);
  });
});

describe('parseLevel', () => {
  it('convierte filas en tiles, monedas, enemigos y el inicio', () => {
    const level = parseLevel(example);

    expect(level.cols).toBe(6);
    expect(level.rowCount).toBe(3);
    expect(level.spawn).toEqual({ x: 2, y: 16 });
    expect(level.coins).toHaveLength(1);
    expect(level.beetles).toHaveLength(1);
    expect(level.tiles.filter((tile) => tile === 'question')).toHaveLength(1);
    expect(level.tiles.filter((tile) => tile === 'goal')).toHaveLength(1);
    expect(level.tiles.filter((tile) => tile === 'solid')).toHaveLength(6);
  });
});
