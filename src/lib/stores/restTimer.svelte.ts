// Cross-component rest-timer state.
// Survives page navigations and refreshes via sessionStorage.

const STORAGE_KEY = 'training2026.restTimer';

interface Persisted {
  endTime: number | null;
  totalSec: number | null;
  label: string | null;
}

function loadFromStorage(): Persisted {
  if (typeof sessionStorage === 'undefined') return { endTime: null, totalSec: null, label: null };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { endTime: null, totalSec: null, label: null };
    const parsed = JSON.parse(raw) as Persisted;
    // Drop stale state
    if (!parsed.endTime || parsed.endTime <= Date.now() - 60_000) {
      return { endTime: null, totalSec: null, label: null };
    }
    return parsed;
  } catch {
    return { endTime: null, totalSec: null, label: null };
  }
}

function persist(state: Persisted): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (state.endTime) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

class RestTimerState {
  endTime = $state<number | null>(null);
  totalSec = $state<number | null>(null);
  label = $state<string | null>(null);
  private hydrated = false;

  hydrate(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    const s = loadFromStorage();
    this.endTime = s.endTime;
    this.totalSec = s.totalSec;
    this.label = s.label;
  }

  start(seconds: number, label: string | null = null): void {
    if (!seconds || seconds <= 0) return;
    this.endTime = Date.now() + seconds * 1000;
    this.totalSec = seconds;
    this.label = label;
    persist({ endTime: this.endTime, totalSec: this.totalSec, label: this.label });
  }

  stop(): void {
    this.endTime = null;
    this.totalSec = null;
    this.label = null;
    persist({ endTime: null, totalSec: null, label: null });
  }

  /** Add seconds to the active timer. */
  extend(seconds: number): void {
    if (!this.endTime) return;
    this.endTime += seconds * 1000;
    this.totalSec = (this.totalSec ?? 0) + seconds;
    persist({ endTime: this.endTime, totalSec: this.totalSec, label: this.label });
  }
}

export const restTimer = new RestTimerState();
