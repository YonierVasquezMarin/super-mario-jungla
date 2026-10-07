export interface Sprites {
  playerIdle: HTMLCanvasElement;
  playerRunA: HTMLCanvasElement;
  playerRunB: HTMLCanvasElement;
  playerJump: HTMLCanvasElement;
  playerClimb: HTMLCanvasElement;
  beetle: HTMLCanvasElement;
  beetleFlat: HTMLCanvasElement;
  coinA: HTMLCanvasElement;
  coinB: HTMLCanvasElement;
  grass: HTMLCanvasElement;
  dirt: HTMLCanvasElement;
  pipeCapLeft: HTMLCanvasElement;
  pipeCapSingle: HTMLCanvasElement;
  pipeBodyLeft: HTMLCanvasElement;
  pipeBodySingle: HTMLCanvasElement;
  pipeCapRight: HTMLCanvasElement;
  pipeBodyRight: HTMLCanvasElement;
  crate: HTMLCanvasElement;
  questionA: HTMLCanvasElement;
  questionB: HTMLCanvasElement;
  used: HTMLCanvasElement;
  thorn: HTMLCanvasElement;
  battlement: HTMLCanvasElement;
  castleWall: HTMLCanvasElement;
  castleDoor: HTMLCanvasElement;
  castleBase: HTMLCanvasElement;
}

const PLAYER = {
  '.': '',
  h: '#178a45',
  d: '#0e5c30',
  g: '#f0d060',
  s: '#f6c99a',
  e: '#1a120c',
  k: '#e6b85c',
  a: '#c44932',
  p: '#6b4428',
  b: '#3a2618',
};

export function createSprites(): Sprites {
  const pipeCapLeft = paint(PLAYER_SIZE, {
    '.': '',
    m: '#3f8f50',
    p: '#67c376',
    d: '#245536',
    s: '#e4d2a8',
    k: '#6f8f62',
  }, [
    'mmmmmmmmmmmmmmmm',
    'pppppppppppppppp',
    'pmmmmmmmmmmmmmmm',
    'dddddddddddddddd',
    '.kssssssssssssss',
    '.kssssssssssssss',
    '.kmmmmmmmmmmmmmm',
    '.kdddddddddddddd',
    '.kssssssssssssss',
    '.kssssssssssssss',
    '.kmmmmmmmmmmmmmm',
    '.kdddddddddddddd',
    '.kssssssssssssss',
    '.kssssssssssssss',
    '.kmmmmmmmmmmmmmm',
    '.kdddddddddddddd',
  ]);
  const pipeBodyLeft = paint(PLAYER_SIZE, {
    '.': '',
    k: '#6f8f62',
    s: '#e4d2a8',
    m: '#3f8f50',
    d: '#245536',
  }, [
    '.kssssssssssssss',
    '.kssssssssssssss',
    '.kmmmmmmmmmmmmmm',
    '.kdddddddddddddd',
    '.kssssssssssssss',
    '.kssssssssssssss',
    '.kmmmmmmmmmmmmmm',
    '.kdddddddddddddd',
    '.kssssssssssssss',
    '.kssssssssssssss',
    '.kmmmmmmmmmmmmmm',
    '.kdddddddddddddd',
    '.kssssssssssssss',
    '.kssssssssssssss',
    '.kmmmmmmmmmmmmmm',
    '.kdddddddddddddd',
  ]);
  const pipeCapSingle = paint(PLAYER_SIZE, {
    '.': '',
    m: '#3f8f50',
    p: '#67c376',
    d: '#245536',
    s: '#e4d2a8',
    k: '#6f8f62',
  }, [
    'mmmmmmmmmmmmmmmm',
    'pppppppppppppppp',
    'pmmmmmmmmmmmmmmd',
    'dddddddddddddddd',
    '.kssssssssssssk.',
    '.kssssssssssssk.',
    '.kmmmmmmmmmmmmk.',
    '.kddddddddddddk.',
    '.kssssssssssssk.',
    '.kssssssssssssk.',
    '.kmmmmmmmmmmmmk.',
    '.kddddddddddddk.',
    '.kssssssssssssk.',
    '.kssssssssssssk.',
    '.kmmmmmmmmmmmmk.',
    '.kddddddddddddk.',
  ]);

  return {
    playerIdle: paint(PLAYER_SIZE, PLAYER, PLAYER_IDLE),
    playerRunA: paint(PLAYER_SIZE, PLAYER, PLAYER_RUN_A),
    playerRunB: paint(PLAYER_SIZE, PLAYER, PLAYER_RUN_B),
    playerJump: paint(PLAYER_SIZE, PLAYER, PLAYER_JUMP),
    playerClimb: paint(PLAYER_SIZE, PLAYER, PLAYER_CLIMB),
    beetle: paint(PLAYER_SIZE, BEETLE, BEETLE_ART),
    beetleFlat: paint(PLAYER_SIZE, BEETLE, BEETLE_FLAT),
    coinA: paint(PLAYER_SIZE, COIN, COIN_A),
    coinB: paint(PLAYER_SIZE, COIN, COIN_B),
    grass: paint(PLAYER_SIZE, GROUND, GRASS),
    dirt: paint(PLAYER_SIZE, GROUND, DIRT),
    pipeCapLeft,
    pipeCapSingle,
    pipeBodyLeft,
    pipeBodySingle: paint(PLAYER_SIZE, {
      '.': '',
      k: '#6f8f62',
      s: '#e4d2a8',
      m: '#3f8f50',
      d: '#245536',
    }, PIPE_BODY_SINGLE),
    pipeCapRight: flip(pipeCapLeft),
    pipeBodyRight: flip(pipeBodyLeft),
    crate: paint(PLAYER_SIZE, CRATE, CRATE_ART),
    questionA: paint(PLAYER_SIZE, QUESTION, QUESTION_A),
    questionB: paint(PLAYER_SIZE, QUESTION, QUESTION_B),
    used: paint(PLAYER_SIZE, QUESTION, USED),
    thorn: paint(PLAYER_SIZE, THORN, THORN_ART),
    battlement: paint(PLAYER_SIZE, CASTLE, BATTLEMENT),
    castleWall: paint(PLAYER_SIZE, CASTLE, CASTLE_WALL),
    castleDoor: paint(PLAYER_SIZE, CASTLE, CASTLE_DOOR),
    castleBase: paint(PLAYER_SIZE, CASTLE, CASTLE_BASE),
  };
}

const PLAYER_SIZE = 16;

const PLAYER_IDLE = [
  '................',
  '....hhhhhhhh....',
  '...hdhhhhhhhd...',
  '...hhgggggghh...',
  '...hhsesseshh...',
  '...hhsssssshh...',
  '....hssssssh....',
  '...aakkkkkkk....',
  '...aakkkkkkk....',
  '...aakkkkppk....',
  '....kkpppppk....',
  '....pppppppp....',
  '....pp....pp....',
  '...bbb....bbb...',
  '...bbb....bbb...',
  '..bbbb....bbbb..',
];

const PLAYER_RUN_A = [
  '................',
  '....hhhhhhhh....',
  '...hdhhhhhhhd...',
  '...hhgggggghh...',
  '...hhsesseshh...',
  '...hhsssssshh...',
  '....hssssssh....',
  '...aakkkkkkk....',
  '...aakkkkkkk....',
  '...aakkkkppk....',
  '....kkpppppk....',
  '....pppppppp....',
  '...pp......pp...',
  '..bbb......bb...',
  '..bbb......bbb..',
  '.bbbb......bbb..',
];

const PLAYER_RUN_B = [
  '................',
  '....hhhhhhhh....',
  '...hdhhhhhhhd...',
  '...hhgggggghh...',
  '...hhsesseshh...',
  '...hhsssssshh...',
  '....hssssssh....',
  '...aakkkkkkk....',
  '...aakkkkkkk....',
  '...aakkkkppk....',
  '....kkpppppk....',
  '....pppppppp....',
  '....pp....pp....',
  '...bb....bbbb...',
  '..bbb....bbbb...',
  '..bbb....bbbbb..',
];

const PLAYER_JUMP = [
  '................',
  '....hhhhhhhh....',
  '...hdhhhhhhhd...',
  '...hhgggggghh...',
  '...hhsesseshh...',
  '...hhsssssshh...',
  '..h.hssssssh.h..',
  '.aa.kkkkkkkk.b..',
  '..a.kkkkkkkk....',
  '....kkkpppkk....',
  '....kkpppppk....',
  '....pp....pp....',
  '...pp......pp...',
  '..bbb......bbb..',
  '..bbb......bbb..',
  '.bbbb......bbbb.',
];

const PLAYER_CLIMB = [
  '....hhh..hhh....',
  '...hhhh..hhhh...',
  '...hdhh..hhhd...',
  '...hhgggggghh...',
  '...hhsesseshh...',
  '...hhsssssshh...',
  '....hssssssh....',
  '...aakkkkkkk....',
  '...aakkkkkkk....',
  '....kkppppkk....',
  '....kkppppkk....',
  '....pppppppp....',
  '....pp....pp....',
  '...bbb....bbb...',
  '..bbbb....bbbb..',
  '..bbbb....bbbb..',
];

const BEETLE = {
  '.': '',
  o: '#173322',
  s: '#8fd18a',
  b: '#246b3a',
  d: '#143d24',
  e: '#102216',
  l: '#d8efe0',
};

const BEETLE_ART = [
  '................',
  '................',
  '.....bbbbbb.....',
  '...bbssssssbb...',
  '..bsbddddddbsb..',
  '..bslddddddlsb..',
  '..ooddddddddoo..',
  '...oddddddddo...',
  '....bbbbbbbb....',
  '....ee....ee....',
  '...eee....eee...',
  '...eee....eee...',
  '..eeee....eeee..',
  '................',
  '................',
  '................',
];

const BEETLE_FLAT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..bbbbbbbbbbbb..',
  '.bbssssssssssbb.',
  '.bsddddddddddsb.',
  '..oooooooooooo..',
  '..eee......eee..',
  '.eeee......eeee.',
  '................',
  '................',
  '................',
];

const COIN = {
  '.': '',
  o: '#a56b12',
  g: '#f6d34a',
  l: '#fff1a8',
  d: '#c98a16',
};

const COIN_A = [
  '................',
  '................',
  '................',
  '.....oooooo.....',
  '....ogglllgo....',
  '....oglggglo....',
  '....oglggglo....',
  '....oglggglo....',
  '....ogglllgo....',
  '.....oooooo.....',
  '....dddddddd....',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const COIN_B = [
  '................',
  '................',
  '................',
  '.......oo.......',
  '......oggo......',
  '......olld......',
  '......olld......',
  '......olld......',
  '......oggo......',
  '.......oo.......',
  '......dddd......',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const GROUND = {
  '.': '',
  g: '#3caf55',
  l: '#8be07a',
  d: '#1f7a38',
  e: '#6b4428',
  b: '#8a5a32',
  s: '#c4a15a',
};

const GRASS = [
  'lllllggggglllllg',
  'ggggglllllgggggl',
  'dddgggggdddddggd',
  'gddddddddddddddg',
  'ebbbbebbebbeeebb',
  'beebbbeebbeebbbe',
  'ebbbeebbsbeebbeb',
  'beebbbeebbeebbbe',
  'ebbbbebbebbeeebb',
  'beeeebbeebbeebbb',
  'ebbbeebbeebbeebb',
  'beebbbeebbeebbbe',
  'ebbbbebsebbeeebb',
  'beebbbeebbeebbbe',
  'ebbbeebbeebbeebb',
  'beeeebbeebbeebbb',
];

const DIRT = [
  'ebbbbebbebbeeebb',
  'beebbbeebbeebbbe',
  'ebbbeebbsbeebbeb',
  'beebbbeebbeebbbe',
  'ebbbbebbebbeeebb',
  'beeeebbeebbeebbb',
  'ebbbeebbeebbeebb',
  'beebbbeebbeebbbe',
  'ebbbbebsebbeeebb',
  'beebbbeebbeebbbe',
  'ebbbeebbeebbeebb',
  'beeeebbeebbeebbb',
  'ebbbbebbebbeeebb',
  'beebbbeebbeebbbe',
  'ebbbeebbsbeebbeb',
  'beebbbeebbeebbbe',
];

const CRATE = {
  '.': '',
  o: '#6a3e1b',
  w: '#c4843c',
  l: '#e2b56a',
  d: '#8a5524',
};

const CRATE_ART = [
  'oooooooooooooooo',
  'ollllllllllllllo',
  'olwwwwwwwwwwwwlo',
  'olwddwwwwwwddwlo',
  'olwwdwwwwwwdwwlo',
  'olwwwdwwwwdwwwlo',
  'olwwwdwwwwdwwwlo',
  'olwwwwddddwwwwlo',
  'olwwwwddddwwwwlo',
  'olwwwdwwwwdwwwlo',
  'olwwwdwwwwdwwwlo',
  'olwwdwwwwwwdwwlo',
  'olwddwwwwwwddwlo',
  'olwwwwwwwwwwwwlo',
  'ollllllllllllllo',
  'oooooooooooooooo',
];

const QUESTION = {
  '.': '',
  o: '#245536',
  s: '#6f8f62',
  g: '#f0d060',
  l: '#fff1a8',
  d: '#8a6a14',
  k: '#d9c7a2',
};

const QUESTION_A = [
  'oooooooooooooooo',
  'osssssssssssssso',
  'osggggggggggggso',
  'osglggggggglggso',
  'osgllggggggllgso',
  'osggglggggglggso',
  'osggglggggglggso',
  'osggggllggggggso',
  'osggggllggggggso',
  'osggggggggggggso',
  'osggggllggggggso',
  'osggggllggggggso',
  'osggggggggggggso',
  'osssssssssssssso',
  'okkkkkkkkkkkkkko',
  'oooooooooooooooo',
];

const QUESTION_B = [
  'oooooooooooooooo',
  'osssssssssssssso',
  'osllllllllllllso',
  'oslglgggggglglso',
  'oslgllggggllglso',
  'oslgglggggglglso',
  'oslgglggggglglso',
  'oslgggllggggglso',
  'oslgggllggggglso',
  'oslgggggggggglso',
  'oslgggllggggglso',
  'oslgggllggggglso',
  'osllllllllllllso',
  'osssssssssssssso',
  'okkkkkkkkkkkkkko',
  'oooooooooooooooo',
];

const USED = [
  'oooooooooooooooo',
  'osssssssssssssso',
  'oskkkkkkkkkkkkso',
  'oskddddddddddkso',
  'oskdkkkkkkkkdkso',
  'oskdkkkkkkkkdkso',
  'oskdkkkkkkkkdkso',
  'oskdkkkkkkkkdkso',
  'oskdkkkkkkkkdkso',
  'oskdkkkkkkkkdkso',
  'oskdkkkkkkkkdkso',
  'oskddddddddddkso',
  'oskkkkkkkkkkkkso',
  'osssssssssssssso',
  'okkkkkkkkkkkkkko',
  'oooooooooooooooo',
];

const THORN = {
  '.': '',
  d: '#1c4a28',
  g: '#3fa85a',
  l: '#b6f3c0',
};

const THORN_ART = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '.......l........',
  '......lgl.......',
  '.....lgdgl......',
  '..l...lgl...l...',
  '.lgl.lgdgl.lgl..',
  'lgdglgdgdglgdgl.',
  'gdgdgdgdgdgdgdgg',
  'dddddddddddddddd',
  'dddddddddddddddd',
  'dddddddddddddddd',
  'dddddddddddddddd',
];

const CASTLE = {
  '.': '',
  o: '#6b4e2e',
  s: '#e7d3a4',
  d: '#b08958',
  k: '#8c6239',
  v: '#2f8f4e',
  l: '#7dcea0',
  n: '#24160e',
  g: '#f0d060',
};

const BATTLEMENT = [
  'ss..ss..ss..ss..',
  'ss..ss..ss..ss..',
  'sskksskksskksskk',
  'ssssssssssssssss',
  'sdddddddddddddds',
  'sdssssssssssssds',
  'sdssvssssssvssds',
  'sdslvsssssslvsds',
  'sdsvvssssssvvsds',
  'sdssssssssssssds',
  'sdddddddddddddds',
  'ssssssssssssssss',
  'skkkkkkkkkkkkkks',
  'ssssssssssssssss',
  'sdddddddddddddds',
  'oooooooooooooooo',
];

const CASTLE_WALL = [
  'ossoossoossoosso',
  'ssddssddssddssdd',
  'ossoossoossoosso',
  'ddssddssddssddss',
  'ossoossovvssosso',
  'ssddsslvllssddss',
  'ossoosvvvvssoooo',
  'ddssddssddssddss',
  'ossoossoossoosso',
  'ssddssddssddssdd',
  'ossoossoossoosso',
  'ddssddssddssddss',
  'ossoossoossoosso',
  'ssddssddssddssdd',
  'ksksksksksksksks',
  'oooooooooooooooo',
];

const CASTLE_DOOR = [
  'ossoossoossoosso',
  'ssddssddssddssdd',
  'osssoooooooossso',
  'ddssnnnnnnnnssdd',
  'ossnnnnnnnnnnnso',
  'ssnnnnnnnnnnnnss',
  'osnnnnnggnnnnnso',
  'ddnnnnnggnnnnndd',
  'osnnnnnnnnnnnnso',
  'ssnnnnnnnnnnnnss',
  'osnnnnnnnnnnnnso',
  'ddnnnnnnnnnnnndd',
  'osnnnnnnnnnnnnso',
  'ssnnnnnnnnnnnnss',
  'ksksksksksksksks',
  'oooooooooooooooo',
];

const CASTLE_BASE = [
  'ossoossoossoosso',
  'ssddssddssddssdd',
  'ossoossoossoosso',
  'ddssddssddssddss',
  'ossoossoossoosso',
  'ssddssddssddssdd',
  'ossoossovvssosso',
  'ddsslvllssddssdd',
  'ossovvvvssoossso',
  'ssddssddssddssdd',
  'ossoossoossoosso',
  'ddssddssddssddss',
  'ksksksksksksksks',
  'ssssssssssssssss',
  'dddddddddddddddd',
  'oooooooooooooooo',
];

const PIPE_BODY_SINGLE = [
  '.kssssssssssssk.',
  '.kssssssssssssk.',
  '.kmmmmmmmmmmmmk.',
  '.kddddddddddddk.',
  '.kssssssssssssk.',
  '.kssssssssssssk.',
  '.kmmmmmmmmmmmmk.',
  '.kddddddddddddk.',
  '.kssssssssssssk.',
  '.kssssssssssssk.',
  '.kmmmmmmmmmmmmk.',
  '.kddddddddddddk.',
  '.kssssssssssssk.',
  '.kssssssssssssk.',
  '.kmmmmmmmmmmmmk.',
  '.kddddddddddddk.',
];

function paint(size: number, palette: Record<string, string>, rows: readonly string[]): HTMLCanvasElement {
  if (rows.length !== size || rows.some((row) => row.length !== size)) {
    throw new Error('Un sprite no mide 16x16.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No se pudo crear el lienzo de sprites.');
  }

  rows.forEach((row, y) => {
    [...row].forEach((character, x) => {
      const color = palette[character];
      if (!color) {
        return;
      }
      context.fillStyle = color;
      context.fillRect(x, y, 1, 1);
    });
  });

  return canvas;
}

function flip(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No se pudo crear el lienzo de sprites.');
  }
  context.translate(source.width, 0);
  context.scale(-1, 1);
  context.drawImage(source, 0, 0);
  return canvas;
}
