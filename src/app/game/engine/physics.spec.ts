import { hitsBlockFromBelow } from './physics';

describe('hitsBlockFromBelow', () => {
  const block = { x: 32, y: 64, w: 16, h: 16 };

  it('detecta la cabeza al cruzar el borde inferior subiendo', () => {
    const actor = { x: 34, y: 76, w: 12, h: 16 };
    expect(hitsBlockFromBelow(actor, 80, -200, block)).toBe(true);
  });

  it('ignora el golpe si el actor baja', () => {
    const actor = { x: 34, y: 76, w: 12, h: 16 };
    expect(hitsBlockFromBelow(actor, 80, 120, block)).toBe(false);
  });

  it('ignora un bloque que no está en la misma columna', () => {
    const actor = { x: 80, y: 76, w: 12, h: 16 };
    expect(hitsBlockFromBelow(actor, 80, -200, block)).toBe(false);
  });
});
