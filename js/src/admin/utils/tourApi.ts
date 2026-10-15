import app from 'flarum/admin/app';
import type { ApiPayloadSingle } from 'flarum/common/Store';

import type Tour from '../../common/models/Tour';
import type TourStep from '../../common/models/TourStep';

export interface Stats {
  finished: number;
  dismissed: number;
  total: number;
  steps: Array<{ id: number; title: string; abandoned: number }>;
}

function url(path: string): string {
  return `${app.forum.attribute('apiUrl')}/${path}`;
}

export function orderTours(ids: string[]): Promise<unknown> {
  return app.request({ method: 'POST', url: url('tour-guide-tours/order'), body: { order: ids } });
}

export function orderSteps(tour: Tour, ids: string[]): Promise<unknown> {
  return app.request({ method: 'POST', url: url(`tour-guide-tours/${tour.id()}/steps/order`), body: { order: ids } });
}

export function duplicateTour(tour: Tour): Promise<Tour> {
  return app
    .request<ApiPayloadSingle>({ method: 'POST', url: url(`tour-guide-tours/${tour.id()}/duplicate`), params: { include: 'steps,groups' } })
    .then((payload) => app.store.pushPayload<Tour>(payload));
}

export function duplicateStep(step: TourStep): Promise<TourStep> {
  return app
    .request<ApiPayloadSingle>({ method: 'POST', url: url(`tour-guide-steps/${step.id()}/duplicate`) })
    .then((payload) => app.store.pushPayload<TourStep>(payload));
}

export function fetchStats(tour: Tour): Promise<Stats> {
  return app.request<{ meta: Stats }>({ method: 'GET', url: url(`tour-guide-tours/${tour.id()}/stats`) }).then((document) => document.meta);
}

export function exportTour(tour: Tour): Promise<void> {
  return app.request<{ meta: unknown }>({ method: 'GET', url: url(`tour-guide-tours/${tour.id()}/export`) }).then((document) => {
    const link = window.document.createElement('a');

    link.href = URL.createObjectURL(new Blob([JSON.stringify(document.meta, null, 2)], { type: 'application/json' }));
    link.download = `tour-${tour.key()}.json`;
    link.click();

    URL.revokeObjectURL(link.href);
  });
}

export function importTour(): Promise<Tour | null> {
  return new Promise((resolve) => {
    const input = window.document.createElement('input');

    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) return resolve(null);

      let body: unknown;

      try {
        body = JSON.parse(await file.text());
      } catch {
        app.alerts.show({ type: 'error' }, app.translator.trans('datlechin-simple-tour-guide.admin.tours.import_invalid'));

        return resolve(null);
      }

      app.request<ApiPayloadSingle>({ method: 'POST', url: url('tour-guide-tours/import'), body, params: { include: 'steps,groups' } }).then(
        (payload) => {
          app.alerts.show({ type: 'success' }, app.translator.trans('datlechin-simple-tour-guide.admin.tours.import_done'));

          resolve(app.store.pushPayload<Tour>(payload));
        },
        () => resolve(null)
      );
    };

    input.click();
  });
}
