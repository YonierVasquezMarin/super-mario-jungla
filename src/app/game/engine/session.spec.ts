import levelFile from '../../../../public/levels/jungla-1.json';
import { InputState } from './input';
import { GameSession } from './session';

function controls(options: { left?: boolean; right?: boolean; up?: boolean; jump?: boolean; jumpHeld?: boolean } = {}): InputState {
  let jump = options.jump ?? false;
  return {
    left: options.left ?? false,
    right: options.right ?? false,
    up: options.up ?? false,
    jumpHeld: options.jumpHeld ?? false,
    consumeJump: () => {
      const queued = jump;
      jump = false;
      return queued;
    },
  };
}

const ground = {
  id: 'suelo',
  name: 'Suelo',
  tileSize: 16,
  rows: ['........', '...@....', 'SSSSSSSS', 'SSSSSSSS', 'SSSSSSSG'],
};

describe('GameSession', () => {
  it('mantiene al jugador de pie sobre el suelo', () => {
    const session = new GameSession(ground, () => undefined);
    const startY = session.player.y;
    const input = controls();

    for (let frame = 0; frame < 120; frame += 1) {
      session.update(1 / 60, input);
    }

    expect(session.grounded).toBe(true);
    expect(session.player.y).toBeCloseTo(startY, 0);
    expect(session.status).toBe('playing');
  });

  it('vacía un bloque ? al golpearlo con la cabeza y suma la moneda', () => {
    const session = new GameSession(
      {
        id: 'bloque',
        name: 'Bloque',
        tileSize: 16,
        rows: ['........', '...?....', '........', '........', '...@....', 'SSSSSSSS', 'SSSSSSSG'],
      },
      () => undefined,
    );
    const input = controls({ jump: true, jumpHeld: true });

    for (let frame = 0; frame < 90; frame += 1) {
      session.update(1 / 60, input);
    }

    expect(session.tiles).toContain('used');
    expect(session.coins).toBeGreaterThanOrEqual(1);
  });

  it('completa el nivel al llegar al castillo', () => {
    let completed = '';
    const session = new GameSession(
      {
        id: 'meta',
        name: 'Meta',
        tileSize: 16,
        rows: ['........', '@.....G.', 'SSSSSSSS', 'SSSSSSSS'],
      },
      () => {
        completed = 'meta';
      },
    );

    for (let frame = 0; frame < 90; frame += 1) {
      session.update(1 / 60, controls({ right: true }));
    }

    expect(session.status).toBe('victory');
    expect(completed).toBe('meta');
  });

  it('carga el nivel publicado en public/levels', () => {
    const session = new GameSession(levelFile, () => undefined);
    expect(session.levelId).toBe('jungla-1');
    expect(session.levelName).toBe('La senda del templo');
    expect(session.beetles.length).toBeGreaterThan(0);
    expect(session.coinList.length).toBeGreaterThan(0);
  });
});
