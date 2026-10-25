import { useSyncExternalStore } from "react";

// What the tour needs to know about the page, and what it can ask the editor
// to do. The tour lives on every page, but the editor is only there on some of
// them, so the editor hands this over while it is open.
export interface TourState {
  // How many suggestions are waiting in the document, and how many of those
  // came from the ripple.
  changes: number;
  // Whether the example for the ripple has been put in the document, and
  // whether its lines have been read for their facts, which the ripple needs
  // before it can follow a change.
  example: boolean;
  exampleReady: boolean;
  ripple: number;
  // How many ripples the document's log has, and how many times the log has
  // been opened.
  rippled: number;
  logOpens: number;
  // How many agent runs and writing samples the account has, where the page
  // that shows them is open.
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
  // Put the example in the document. Set by the editor while it is open.
  addExample: null as (() => void) | null,
  // Where the example is on the screen, if it is.
  exampleBox: null as (() => DOMRect | null) | null,
  get: () => state,
  // Tells the store what the editor has now. Set by the editor while it is
  // open, and called when the tour starts watching.
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
  // Whether a tour is open to see it. Work only it needs can wait until one is.
  watched: () => listeners.size > 0,
};

export const useTourState = () =>
  useSyncExternalStore(tour.subscribe, tour.get, tour.get);
