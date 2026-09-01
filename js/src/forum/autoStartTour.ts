import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import type Page from 'flarum/common/components/Page';

import loadTours, { loadPreview } from './loadTours';
import { clearPendingTour, pendingTourKey } from './pendingTour';
import showTour, { onTourEnded, tourIsRunning } from './showTour';
import type { TourData } from './types';
import { matchesDevice } from './utils/device';
import nextFrames from './utils/nextFrames';
import domChanged from './utils/settle';

/** The query parameter an admin's Preview button puts on the forum URL. */
const PREVIEW_PARAM = 'tour-preview';

/** How long to keep waiting for a page to be ready for its tour. */
const READY_TIMEOUT = 8000;

/** How long to wait for the page to change before looking again anyway. */
const READY_POLL = 400;

let lastRoute: string | null | undefined;

/**
 * Offer the right tour for wherever the member has just arrived.
 */
export default function autoStartTour(): void {
  // Every page sets `app.current` from here, so this is the one hook that
  // fires on the first load and on every navigation after it. A tour that
  // belongs on the index no longer has to be lucky enough to be the page the
  // member happened to land on.
  extend('flarum/common/components/Page', 'oninit', function (this: Page) {
    const route = app.current.get('routeName') as string | undefined;

    // Sub-pages of the same route mount their own Page, and arriving at the
    // page you are already on is not arriving.
    if (route === lastRoute) return;

    lastRoute = route;

    void consider(route);
  });

  // A tour is skipped while another is open, and route changes are the only
  // other thing that would reconsider. Without this, navigating mid-tour costs
  // the member every tour that page had to offer.
  onTourEnded(() => {
    void consider(lastRoute);
  });
}

async function consider(route: string | undefined | null): Promise<void> {
  if (!app.session.user || tourIsRunning()) return;

  const params = new URLSearchParams(window.location.search);

  // The picker puts an overlay of its own over the forum, and a tour on top of
  // that covers the very elements the admin came here to point at.
  if (params.has('tour-picker')) return;

  const preview = params.get(PREVIEW_PARAM);

  // One frame for Mithril to draw the page, one for the page to settle.
  await nextFrames(2);

  // The route can change again while those frames pass, or while the request
  // below is in flight.
  if (route !== lastRoute || tourIsRunning()) return;

  const tours = preview ? await loadPreview(preview) : await loadTours();

  if (route !== lastRoute || tourIsRunning()) return;

  const tour = pick(tours, route, preview);

  if (tour) await startWhenReady(tour, route);
}

/**
 * Keep trying to open the tour until its page is actually ready for it.
 *
 * A page announces its route before it has loaded anything, and a discussion
 * page renders nothing but a spinner until its posts arrive, so the elements a
 * tour points at are usually not there yet. Rather than looking once and
 * silently giving up, this waits for the page to change and looks again.
 */
async function startWhenReady(tour: TourData, route: string | undefined | null): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT;

  do {
    if (route !== lastRoute || tourIsRunning()) return;

    // A tour drawn over an open composer or dialog would cover the thing the
    // member is in the middle of, and take focus away from it. Checked on each
    // attempt rather than once, so closing the composer lets the tour through
    // instead of costing them the tour entirely.
    if (!isBusy() && showTour(tour)) return;

    await domChanged(READY_POLL);
  } while (Date.now() < deadline);
}

function isBusy(): boolean {
  // A minimised composer is a bar at the bottom of the screen and gets in
  // nobody's way. One that is open, or a dialog, does.
  const composer = app.composer.position;

  return composer === 'normal' || composer === 'fullScreen' || !!app.modal.modal;
}

function pick(tours: TourData[], route: string | undefined | null, preview: string | null): TourData | undefined {
  // Previewing shows the admin their own work wherever it belongs, so it
  // ignores whether they have taken it and whether it starts on its own. It
  // still waits for the right page: a discussion tour has nothing to say on
  // the index, and showing nothing without explanation looks broken.
  if (preview) {
    return tours.filter((tour) => tour.key === preview).find((tour) => belongsHere(tour, route));
  }

  // Somebody asked for this one by name and we have arrived where it lives.
  const requested = pendingTourKey();

  if (requested) {
    const tour = tours.filter((candidate) => candidate.key === requested).find((candidate) => belongsHere(candidate, route));

    if (tour) {
      clearPendingTour();

      return tour;
    }
  }

  return tours.find((tour) => isDue(tour, route));
}

/**
 * Whether this tour is meant for the page the member is on, and the thing they
 * are holding.
 */
function belongsHere(tour: TourData, route: string | undefined | null): boolean {
  if (!matchesDevice(tour.devices)) return false;

  return routeMatches(tour.route, route);
}

/**
 * Whether the page the member is on is the one the tour named.
 *
 * Sub-routes count. Flarum links to `discussion.near` from the discussion list
 * whenever there is an unread post to jump to, and to plain `discussion` from
 * a bare URL, so an admin who writes `discussion` means both and would never
 * guess otherwise. The same goes for `user`, which covers `user.posts` and
 * `user.discussions`.
 */
function routeMatches(wanted: string | null, actual: string | undefined | null): boolean {
  // A tour with no route of its own is anchored to something that follows the
  // member around, like the header, so it runs wherever they are.
  if (wanted === null) return true;

  return actual === wanted || !!actual?.startsWith(`${wanted}.`);
}

function isDue(tour: TourData, route: string | undefined | null): boolean {
  if (tour.completed || tour.startMode !== 'auto') return false;

  return belongsHere(tour, route);
}
