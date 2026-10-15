import app from 'flarum/forum/app';

import type Tour from '../common/models/Tour';
import type TourCompletion from '../common/models/TourCompletion';
import type TourStep from '../common/models/TourStep';
import type { TourOutcome } from '../common/types';

let cached: Promise<Tour[]> | null = null;

// Ended during this visit, so a tour is not offered again before its completion is saved.
let ended = new Set<Tour>();

function fetchTours(filter: Record<string, string>): Promise<Tour[]> {
  return app.store
    .find<Tour[]>('tour-guide-tours', { filter, include: 'enabledSteps,completion' }, undefined, { errorHandler: () => {} })
    .then((tours) => [...tours]);
}

export default function loadTours(): Promise<Tour[]> {
  return (cached ??= fetchTours({ available: '1' }).catch(() => {
    cached = null;

    return [];
  }));
}

// Disabled tours and tours meant for others included: an admin previewing their own work.
export function loadPreview(): Promise<Tour[]> {
  return fetchTours({}).catch(() => []);
}

export function forgetTours(): void {
  cached = null;
  ended = new Set();
}

export function endedThisVisit(tour: Tour): boolean {
  return ended.has(tour);
}

export function recordCompletion(tour: Tour, outcome: TourOutcome, lastStep: TourStep | null): void {
  ended.add(tour);

  app.store
    .createRecord<TourCompletion>('tour-guide-completions')
    .save({ outcome, relationships: { tour, lastStep } }, { errorHandler: () => {} })
    .then((completion) => tour.pushData({ relationships: { completion } }))
    .catch(() => {});
}

export function resetTours(userId: string): Promise<unknown> {
  forgetTours();

  return app.request({
    method: 'DELETE',
    url: `${app.forum.attribute('apiUrl')}/users/${userId}/tour-guide-completions`,
  });
}
