import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LevelFormatError } from '../../game/levels/level.model';
import { loadLevel, loadManifest } from '../../game/levels/level-loader';
import { ProgressService } from '../../game/progress/progress.service';

interface LogoPixel {
  x: number;
  y: number;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <main class="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      <div class="flex flex-col items-center gap-4">
        <svg viewBox="0 0 64 64" class="h-24 w-24" role="img" aria-label="Emblema del templo de la jungla">
          <rect width="64" height="64" rx="14" fill="#145233" />
          <path d="M32 8c8 8 14 10 18 10-6 4-8 12-8 18H22c0-6-2-14-8-18 4 0 10-2 18-10z" fill="#3dbe6e" />
          <path d="M10 38 L32 22 L54 38 V44 H10 Z" fill="#f0d060" />
          <rect x="14" y="44" width="36" height="12" fill="#e7d3a4" />
          <rect x="28" y="46" width="8" height="10" fill="#24160e" />
          <rect x="18" y="48" width="4" height="6" fill="#8c6239" />
          <rect x="42" y="48" width="4" height="6" fill="#8c6239" />
        </svg>
        <svg
          [attr.viewBox]="'0 0 ' + logoWidth + ' ' + logoHeight"
          class="w-full max-w-xl"
          role="img"
          aria-label="Super Mario Jungla"
        >
          @for (pixel of logoPixels; track $index) {
            <rect [attr.x]="pixel.x" [attr.y]="pixel.y" width="1" height="1" fill="#f0d060" />
          }
        </svg>
        <p class="text-lg text-[#d7efe0]">Aventura por la selva, alcanza el templo.</p>
      </div>

      @if (errorMessage(); as message) {
        <p class="max-w-md rounded-xl bg-[#3a1d1d] px-4 py-3 text-[#ffd7d7]" role="alert">{{ message }}</p>
      } @else {
        <p class="text-sm tracking-wide text-[#b7e0c8] uppercase">
          {{ levelName() }}
          @if (completed()) {
            <span class="ml-2 rounded-full bg-[#f0d060] px-2 py-1 text-xs font-semibold text-[#24180c]">Completado</span>
          }
        </p>
      }

      <div class="flex flex-wrap items-center justify-center gap-4">
        <a
          routerLink="/play"
          class="inline-flex min-h-12 min-w-40 items-center justify-center rounded-full bg-[#f0d060] px-8 text-lg font-bold text-[#24180c] no-underline"
        >
          Play
        </a>
        <a
          routerLink="/credits"
          class="inline-flex min-h-12 min-w-40 items-center justify-center rounded-full border-2 border-[#f0d060] px-8 text-lg font-semibold text-[#f0d060] no-underline"
        >
          Créditos
        </a>
      </div>

      <ul class="max-w-md space-y-1 text-center text-sm text-[#d7efe0]">
        <li>Flechas o WASD para moverte.</li>
        <li>Espacio o Z para saltar.</li>
        <li>Arriba, pegado a una tubería, para trepar. En la cima, muévete hacia ella.</li>
        <li>Escape vuelve al menú.</li>
      </ul>
    </main>
  `,
})
export class Home {
  private readonly progress = inject(ProgressService);

  protected readonly levelName = signal('La senda del templo');
  protected readonly completed = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly logoPixels: LogoPixel[];
  protected readonly logoWidth: number;
  protected readonly logoHeight: number;

  constructor() {
    const logo = pixelLogo(['SUPER MARIO', 'JUNGLA']);
    this.logoPixels = logo.pixels;
    this.logoWidth = logo.width;
    this.logoHeight = logo.height;
    void this.prepare();
  }

  private async prepare(): Promise<void> {
    try {
      const ids = await loadManifest();
      const id = ids[0];
      if (!id) {
        throw new LevelFormatError('No hay niveles en el manifiesto.');
      }
      const level = await loadLevel(id);
      this.levelName.set(level.name);
      this.completed.set(this.progress.isCompleted(level.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo leer el nivel.';
      this.errorMessage.set(message);
    }
  }
}

const GLYPHS: Record<string, readonly string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01110'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10001', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
};

function pixelLogo(lines: readonly string[]): { pixels: LogoPixel[]; width: number; height: number } {
  const pixels: LogoPixel[] = [];
  let width = 0;

  lines.forEach((line, lineIndex) => {
    let cursor = 0;
    for (const character of line) {
      if (character === ' ') {
        cursor += 4;
        continue;
      }
      const glyph = GLYPHS[character];
      if (!glyph) {
        continue;
      }
      glyph.forEach((bits, y) => {
        [...bits].forEach((bit, x) => {
          if (bit === '1') {
            pixels.push({ x: cursor + x, y: lineIndex * 9 + y });
          }
        });
      });
      cursor += 6;
    }
    width = Math.max(width, cursor - 1);
  });

  return { pixels, width: width + 1, height: lines.length * 9 - 2 };
}
