import { useSyncExternalStore } from 'react';
import { get, set } from 'idb-keyval';
import type { Lang } from '../types';

export type SpeechSpeed = 'normal' | 'slow' | 'slower';

export interface AppState {
  profile: { name: string; avatar: string } | null;
  /** Narration language, set from the subject being played. */
  lang: Lang;
  speed: SpeechSpeed;
  bridge: boolean;
  muted: boolean;
  lessonsDone: Record<string, boolean>;
  tests: Record<string, { stars: number; attempts: number }>;
  /** Activities missed in a test, keyed by activity, waiting to come back in the next lesson. */
  review: string[];
  /** How many times each activity has been missed, with its label, for the parent area. */
  missed: Record<string, { label: string; count: number }>;
}

const STORAGE_KEY = 'khelo-seekho-v1';

const initial: AppState = {
  profile: null,
  lang: 'en',
  speed: 'slow',
  bridge: true,
  muted: false,
  lessonsDone: {},
  tests: {},
  review: [],
  missed: {},
};

let state = initial;
const listeners = new Set<() => void>();

export async function loadState(): Promise<void> {
  try {
    const saved = await get<Partial<AppState>>(STORAGE_KEY);
    if (saved) state = { ...initial, ...saved };
  } catch {
    // Private windows can block IndexedDB; the app still works for this visit.
  }
}

export function update(change: (current: AppState) => Partial<AppState>): void {
  state = { ...state, ...change(state) };
  listeners.forEach((listener) => listener());
  set(STORAGE_KEY, state).catch(() => undefined);
}

export const getState = (): AppState => state;

export function useApp(): AppState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}
