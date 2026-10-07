import { Injectable } from '@angular/core';

const STORAGE_KEY = 'smj-progress';

interface ProgressData {
  completedLevelIds: string[];
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  isCompleted(levelId: string): boolean {
    return this.read().completedLevelIds.includes(levelId);
  }

  complete(levelId: string): void {
    const current = this.read();
    if (current.completedLevelIds.includes(levelId)) {
      return;
    }

    const next: ProgressData = {
      completedLevelIds: [...current.completedLevelIds, levelId],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private read(): ProgressData {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { completedLevelIds: [] };
    }

    try {
      const data: unknown = JSON.parse(raw);
      if (typeof data !== 'object' || data === null) {
        return { completedLevelIds: [] };
      }

      const ids = (data as Record<string, unknown>)['completedLevelIds'];
      if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
        return { completedLevelIds: [] };
      }

      return { completedLevelIds: ids };
    } catch {
      return { completedLevelIds: [] };
    }
  }
}
