import { useSyncExternalStore } from "react";

// What the sandbox tour needs to know about the editor, and what it can ask the
// editor to do. The tour lives on every page, but the editor is only there on
// some of them, so the editor hands this over while it is open.
export interface TourState {
  // How many suggestions are waiting in the document, and how many of those
  // came from the ripple.
  changes: number;
  // Whether the example for the ripple has been put in the document.
  example: boolean;
  ripple: number;
}

let state: TourState = { changes: 0, example: false, ripple: 0 };
const listeners = new Set<() => void>();

export const tour = {
  // Put the example in the document. Set by the editor while it is open.
  addExample: null as (() => void) | null,
  // Where the example is on the screen, if it is.
  exampleBox: null as (() => DOMRect | null) | null,
  get: () => state,
  set(patch: Partial<TourState>) {
    const next = { ...state, ...patch };

    if (
      next.changes === state.changes &&
      next.example === state.example &&
      next.ripple === state.ripple
    ) {
      return;
    }

    state = next;

    for (const listener of listeners) {
      listener();
    }
  },
  subscribe(listener: () => void) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

export const useTourState = () =>
  useSyncExternalStore(tour.subscribe, tour.get, tour.get);
