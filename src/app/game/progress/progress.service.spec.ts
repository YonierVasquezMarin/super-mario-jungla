import { TestBed } from '@angular/core/testing';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('guarda los niveles completados sin duplicarlos', () => {
    const progress = TestBed.inject(ProgressService);
    expect(progress.isCompleted('jungla-1')).toBe(false);

    progress.complete('jungla-1');
    progress.complete('jungla-1');

    expect(progress.isCompleted('jungla-1')).toBe(true);
    expect(JSON.parse(localStorage.getItem('smj-progress') ?? '{}')).toEqual({
      completedLevelIds: ['jungla-1'],
    });
  });

  it('ignora un guardado corrupto', () => {
    localStorage.setItem('smj-progress', '{');
    const progress = TestBed.inject(ProgressService);
    expect(progress.isCompleted('jungla-1')).toBe(false);
    progress.complete('jungla-1');
    expect(progress.isCompleted('jungla-1')).toBe(true);
  });
});
