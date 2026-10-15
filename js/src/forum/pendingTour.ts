import app from 'flarum/forum/app';
import type Mithril from 'mithril';

import type Tour from '../common/models/Tour';
import showTour from './showTour';
import { goToRoute } from './utils/route';

export interface TourRequest {
  key: string;
  preview: boolean;
}

let pending: TourRequest | null = null;

export function requestTour(key: string, preview = false): void {
  pending = { key, preview };
}

export function pendingTour(): TourRequest | null {
  return pending;
}

export function clearPendingTour(): void {
  pending = null;
}

// A route that needs a discussion or a profile is the reader's to open.
export function leadTo(route: string | null, waiting: Mithril.Children): boolean {
  const access = goToRoute(route);

  if (access === 'param') {
    app.alerts.show({ type: 'info' }, waiting);
  } else if (access === 'unknown') {
    app.alerts.show({ type: 'warning' }, app.translator.trans('datlechin-simple-tour-guide.forum.unknown_page', { route }));
  }

  return access === 'here';
}

export function startRequested(tour: Tour, preview = false): void {
  clearPendingTour();

  if (!showTour(tour, preview)) {
    app.alerts.show({ type: 'warning' }, app.translator.trans('datlechin-simple-tour-guide.forum.nothing_here', { title: tour.title() }));
  }
}
