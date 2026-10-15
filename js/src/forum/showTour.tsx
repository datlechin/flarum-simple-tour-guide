import type Tour from '../common/models/Tour';
import TourGuide from './components/TourGuide';
import { recordCompletion } from './loadTours';
import TourState from './states/TourState';

let current: TourState | null = null;
let root: HTMLElement | null = null;
let started = 0;

// A root after the app, because the tour covers it.
export default function showTour(tour: Tour, preview = false): TourState | null {
  if (current) return null;

  const state = new TourState(tour, preview);

  if (!state.start()) return null;

  started++;

  state.onend = (outcome, lastStep) => {
    current = null;

    if (!preview) recordCompletion(tour, outcome, lastStep);

    m.redraw();
  };

  current = state;

  if (root) {
    m.redraw();
  } else {
    root = document.createElement('div');
    root.className = 'TourGuideContainer';
    document.body.append(root);

    m.mount(root, { view: () => current && <TourGuide key={started} state={current} /> });
  }

  return state;
}

export function runningTour(): TourState | null {
  return current;
}
