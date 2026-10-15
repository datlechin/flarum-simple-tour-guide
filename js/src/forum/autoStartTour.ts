import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import type PageState from 'flarum/common/states/PageState';
import type PageStructure from 'flarum/forum/components/PageStructure';

import type Tour from '../common/models/Tour';
import loadTours, { endedThisVisit, loadPreview } from './loadTours';
import { clearPendingTour, leadTo, pendingTour, requestTour, startRequested } from './pendingTour';
import showTour, { runningTour } from './showTour';
import { pickerActive } from './startElementPicker';
import { onRoute } from './utils/route';

let arrived = false;

// Core's own signal for when a page has its content.
let structure: PageStructure | null = null;

// Led to on the first page, once there is a page to route from.
let previewRoute: string | null | undefined;

export default function autoStartTour(): void {
  app.beforeMount(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('tour-preview');

    if (key && app.session.user?.isAdmin()) {
      requestTour(key, true);
      previewRoute = params.get('tour-route');
    }
  });

  // Leaving the page ends its tour, as core closes the modal and the drawer here.
  extend('flarum/common/components/Page', 'oninit', () => {
    runningTour()?.end('dismissed');

    arrived = true;
    structure = null;
  });

  extend('flarum/forum/components/PageStructure', 'oninit', function (this: PageStructure) {
    structure = this;
  });

  extend('flarum/common/components/Page', 'oncreate', () => {
    if (previewRoute !== undefined) {
      leadTo(previewRoute, app.translator.trans('datlechin-simple-tour-guide.forum.preview_go_to', { route: previewRoute }));
      previewRoute = undefined;
    }

    offer();
  });

  extend('flarum/forum/components/PageStructure', 'onupdate', offer);
}

function offer(): void {
  if (!arrived || structure?.attrs.loading || isBusy() || runningTour() || pickerActive() || !app.session.user) return;

  arrived = false;

  void begin(app.current);
}

async function begin(page: PageState): Promise<void> {
  const request = pendingTour();
  const tours = request?.preview ? await loadPreview() : await loadTours();

  if (app.current !== page || runningTour()) return;

  if (!request) {
    tours.some((tour) => isDue(tour) && showTour(tour));

    return;
  }

  const tour = tours.find((candidate) => candidate.key() === request.key);

  if (!tour) {
    clearPendingTour();
  } else if (onRoute(tour.route())) {
    startRequested(tour, request.preview);
  }
}

function isDue(tour: Tour): boolean {
  return tour.startMode() === 'auto' && !tour.completion() && !endedThisVisit(tour) && onRoute(tour.route());
}

function isBusy(): boolean {
  const composer = app.composer.position;

  return composer === 'normal' || composer === 'fullScreen' || !!app.modal.modal;
}
