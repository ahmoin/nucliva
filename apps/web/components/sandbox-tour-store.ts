import { useSyncExternalStore } from "react";

export interface TourState {
  changes: number;
  example: boolean;
  exampleReady: boolean;
  ripple: number;
  rippled: number;
  logOpens: number;
  runs: number;
  samples: number;
}

let state: TourState = {
  changes: 0,
  example: false,
  exampleReady: false,
  logOpens: 0,
  ripple: 0,
  rippled: 0,
  runs: 0,
  samples: 0,
};
const listeners = new Set<() => void>();

export const tour = {
  addExample: null as (() => void) | null,
  exampleBox: null as (() => DOMRect | null) | null,
  get: () => state,
  refresh: null as (() => void) | null,
  set(patch: Partial<TourState>) {
    const next = { ...state, ...patch };
    const keys = Object.keys(next) as (keyof TourState)[];

    if (keys.every((key) => next[key] === state[key])) {
      return;
    }

    state = next;

    for (const listener of listeners) {
      listener();
    }
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    queueMicrotask(() => tour.refresh?.());

    return () => {
      listeners.delete(listener);
    };
  },
  watched: () => listeners.size > 0,
};

export const useTourState = () =>
  useSyncExternalStore(tour.subscribe, tour.get, tour.get);
