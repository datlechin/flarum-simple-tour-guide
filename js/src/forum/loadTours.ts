import app from 'flarum/forum/app';

import type { TourData, TourOutcome } from './types';

let cached: Promise<TourData[]> | null = null;

/**
 * The tours this member could be shown.
 *
 * Cached for the life of the page: the answer only changes when they finish
 * one, and that goes through `recordCompletion` here, which refreshes it.
 */
export default function loadTours(): Promise<TourData[]> {
  return (cached ??= fetchTours());
}

/**
 * Load one tour for an admin to look at, whether or not it is enabled and
 * whether or not they have already been through it. Never cached, and never
 * recorded.
 */
export function loadPreview(key: string): Promise<TourData[]> {
  return fetchTours(key);
}

export function forgetTours(): void {
  cached = null;
}

function fetchTours(preview?: string): Promise<TourData[]> {
  return app
    .request<{ tours: TourData[] }>({
      method: 'GET',
      url: `${app.forum.attribute('apiUrl')}/tour-guide/available`,
      params: preview ? { preview } : {},
    })
    .then((response) => response.tours ?? [])
    .catch(() => []);
}

export function recordCompletion(tour: TourData, outcome: TourOutcome, lastStepId: number | null): void {
  // Previewing is an admin reading their own draft. Recording it would mark
  // the tour taken for them and quietly stop it running again.
  if (tour.preview) return;

  // Marked here and now, because the member may navigate before the request
  // lands and the answer to "have they taken this?" has to be yes immediately.
  tour.completed = true;

  app
    .request({
      method: 'POST',
      url: `${app.forum.attribute('apiUrl')}/tour-guide/completions`,
      body: { tourKey: tour.key, outcome, lastStepId },
      // There is nothing the reader can do about this failing, and nothing
      // they lose by it: the tour simply offers itself again next visit.
      errorHandler: () => {},
    })
    .then(forgetTours, () => {});
}

export function resetTours(userId: string, tourKey?: string): Promise<unknown> {
  forgetTours();

  return app.request({
    method: 'POST',
    url: `${app.forum.attribute('apiUrl')}/tour-guide/completions/reset`,
    body: tourKey ? { userId, tourKey } : { userId },
  });
}
