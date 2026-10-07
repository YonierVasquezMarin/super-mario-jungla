export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  jumpHeld: boolean;
  consumeJump(): boolean;
}

type TouchControl = 'left' | 'right' | 'up' | 'jump';

export class GameInput implements InputState {
  left = false;
  right = false;
  up = false;
  jumpHeld = false;

  private jumpQueued = false;
  private menuQueued = false;
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (this.isGameKey(key)) {
      event.preventDefault();
    }

    if (event.repeat) {
      return;
    }

    if (key === 'arrowleft' || key === 'a') {
      this.left = true;
    }
    if (key === 'arrowright' || key === 'd') {
      this.right = true;
    }
    if (key === 'arrowup' || key === 'w') {
      this.up = true;
    }
    if (key === ' ' || key === 'z') {
      this.jumpHeld = true;
      this.jumpQueued = true;
    }
    if (key === 'escape') {
      this.menuQueued = true;
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') {
      this.left = false;
    }
    if (key === 'arrowright' || key === 'd') {
      this.right = false;
    }
    if (key === 'arrowup' || key === 'w') {
      this.up = false;
    }
    if (key === ' ' || key === 'z') {
      this.jumpHeld = false;
    }
  };

  attach(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  detach(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  consumeJump(): boolean {
    const queued = this.jumpQueued;
    this.jumpQueued = false;
    return queued;
  }

  consumeMenu(): boolean {
    const queued = this.menuQueued;
    this.menuQueued = false;
    return queued;
  }

  setTouch(control: TouchControl, pressed: boolean): void {
    if (control === 'jump') {
      if (pressed && !this.jumpHeld) {
        this.jumpQueued = true;
      }
      this.jumpHeld = pressed;
      return;
    }

    if (control === 'left') {
      this.left = pressed;
    }
    if (control === 'right') {
      this.right = pressed;
    }
    if (control === 'up') {
      this.up = pressed;
    }
  }

  private isGameKey(key: string): boolean {
    return key === 'arrowleft' || key === 'arrowright' || key === 'arrowup' || key === 'arrowdown' || key === ' ' || key === 'z';
  }
}
