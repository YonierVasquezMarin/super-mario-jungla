import { afterNextRender, Component, DestroyRef, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../../game/engine/constants';
import { GameInput } from '../../game/engine/input';
import { renderGame } from '../../game/engine/render';
import { GameSession } from '../../game/engine/session';
import { Sprites, createSprites } from '../../game/engine/sprites';
import { LevelFormatError } from '../../game/levels/level.model';
import { loadLevel, loadManifest } from '../../game/levels/level-loader';
import { ProgressService } from '../../game/progress/progress.service';

type TouchControl = 'left' | 'right' | 'up' | 'jump';

@Component({
  selector: 'app-play',
  imports: [RouterLink],
  templateUrl: './play.html',
})
export class Play {
  private readonly router = inject(Router);
  private readonly progress = inject(ProgressService);
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly victoryButton = viewChild<ElementRef<HTMLElement>>('victoryButton');
  private readonly retryButton = viewChild<ElementRef<HTMLButtonElement>>('retryButton');

  protected readonly viewWidth = VIEW_WIDTH;
  protected readonly viewHeight = VIEW_HEIGHT;
  protected readonly status = signal<'loading' | 'playing' | 'paused' | 'victory' | 'gameover' | 'error'>('loading');
  protected readonly levelName = signal('');
  protected readonly lives = signal(3);
  protected readonly coins = signal(0);
  protected readonly errorMessage = signal('');

  private readonly input = new GameInput();
  private session: GameSession | null = null;
  private sprites: Sprites | null = null;
  private frameId = 0;
  private lastTime = 0;
  private leaving = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const rootOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    afterNextRender(() => {
      void this.boot();
    });

    effect(() => {
      const state = this.status();
      if (state !== 'victory' && state !== 'gameover') {
        return;
      }
      setTimeout(() => {
        if (this.status() === 'victory') {
          this.victoryButton()?.nativeElement.focus();
        }
        if (this.status() === 'gameover') {
          this.retryButton()?.nativeElement.focus();
        }
      });
    });

    destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.frameId);
      this.input.detach();
      document.documentElement.style.overflow = rootOverflow;
      document.body.style.overflow = bodyOverflow;
    });
  }

  protected hold(control: TouchControl, pressed: boolean, event: PointerEvent): void {
    event.preventDefault();
    if (pressed && event.currentTarget instanceof HTMLElement) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    this.input.setTouch(control, pressed);
  }

  protected pause(): void {
    this.session?.togglePause();
    this.syncHud();
  }

  protected retry(): void {
    this.session?.reset();
    this.syncHud();
  }

  private async boot(): Promise<void> {
    try {
      const ids = await loadManifest();
      const id = ids[0];
      if (!id) {
        throw new LevelFormatError('No hay niveles en el manifiesto.');
      }

      const level = await loadLevel(id);
      this.levelName.set(level.name);
      this.sprites = createSprites();
      this.session = new GameSession(level, () => this.progress.complete(level.id));
      this.input.attach();
      this.syncHud();
      this.status.set('playing');
      this.lastTime = performance.now();
      this.frameId = requestAnimationFrame(this.frame);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo empezar la partida.';
      this.errorMessage.set(message);
      this.status.set('error');
    }
  }

  private readonly frame = (now: number): void => {
    const elapsed = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.input.consumeMenu() && !this.leaving) {
      this.leaving = true;
      void this.router.navigateByUrl('/');
      return;
    }

    let remaining = elapsed;
    while (remaining > 0) {
      const step = Math.min(1 / 60, remaining);
      this.session?.update(step, this.input);
      remaining -= step;
    }
    this.syncHud();
    this.draw();
    this.frameId = requestAnimationFrame(this.frame);
  };

  private syncHud(): void {
    const session = this.session;
    if (!session) {
      return;
    }
    if (this.lives() !== session.lives) {
      this.lives.set(session.lives);
    }
    if (this.coins() !== session.coins) {
      this.coins.set(session.coins);
    }
    if (this.status() !== session.status) {
      this.status.set(session.status);
    }
  }

  private draw(): void {
    const canvas = this.canvasRef()?.nativeElement;
    const session = this.session;
    const sprites = this.sprites;
    if (!canvas || !session || !sprites) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    renderGame(context, session, sprites);
  }
}
