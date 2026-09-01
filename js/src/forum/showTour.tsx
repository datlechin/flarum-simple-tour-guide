import TourGuide from './components/TourGuide';
import { recordCompletion } from './loadTours';
import TourState from './states/TourState';
import type { TourData } from './types';

let running: TourState | null = null;

const endListeners: Array<() => void> = [];

/**
 * Be told whenever a tour finishes or is closed, however it ended.
 */
export function onTourEnded(listener: () => void): void {
  endListeners.push(listener);
}

/**
 * Run a tour over the page as it stands.
 *
 * Returns the state driving it, or `null` when none of its steps has anything
 * to point at here, in which case nothing is shown and nothing is recorded.
 *
 * The tour lives in its own root at the end of the body rather than inside the
 * app, because it covers the app.
 */
export default function showTour(tour: TourData): TourState | null {
  // One at a time. A second tour opening over the first would trap focus in
  // whichever won the race.
  if (running) return null;

  const state = new TourState(tour);

  if (!state.start()) return null;

  const container = document.createElement('div');
  container.className = 'TourGuideContainer';
  document.body.append(container);

  running = state;

  state.onend = (outcome, lastStepId) => {
    running = null;

    // Next frame: this runs from a handler on the very DOM it tears down.
    requestAnimationFrame(() => {
      m.mount(container, null);
      container.remove();
    });

    recordCompletion(tour, outcome, lastStepId);

    endListeners.forEach((listener) => listener());
  };

  m.mount(container, { view: () => <TourGuide state={state} /> });

  return state;
}

export function tourIsRunning(): boolean {
  return running !== null;
}
