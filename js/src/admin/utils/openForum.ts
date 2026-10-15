import app from 'flarum/admin/app';

import type Tour from '../../common/models/Tour';

export interface PickedElement {
  selector: string;
  route: string | null;
}

const PICKER_WINDOW = 'datlechin-tour-picker';

// The admin app has no table of forum routes, so the forum finds the tour's page itself.
function forumUrl(params: Record<string, string | null>): string {
  const url = new URL(app.forum.attribute<string>('baseUrl'));

  Object.entries(params).forEach(([key, value]) => value && url.searchParams.set(key, value));

  return url.toString();
}

function openPicker(params: Record<string, string | null>): Window | null {
  const picker = window.open(forumUrl(params), PICKER_WINDOW, 'width=1280,height=860');

  picker?.focus();

  return picker;
}

export function previewTour(tour: Tour): void {
  window.open(forumUrl({ 'tour-preview': tour.key(), 'tour-route': tour.route() }), '_blank', 'noopener');
}

export function testTarget(tour: Tour, selector: string): void {
  openPicker({ 'tour-picker': 'test', 'tour-route': tour.route(), 'tour-selector': selector });
}

export function pickElement(tour: Tour): Promise<PickedElement | null> {
  const picker = openPicker({ 'tour-picker': 'pick', 'tour-route': tour.route() });

  if (!picker) return Promise.resolve(null);

  return new Promise((resolve) => {
    const finish = (result: PickedElement | null) => {
      window.removeEventListener('message', onmessage);
      window.clearInterval(watchdog);
      resolve(result);
    };

    const onmessage = (event: MessageEvent) => {
      if (event.source !== picker || event.origin !== window.location.origin) return;

      finish({ selector: String(event.data?.selector), route: event.data?.route ?? null });
    };

    // A closed window sends no event of its own.
    const watchdog = window.setInterval(() => picker.closed && finish(null), 400);

    window.addEventListener('message', onmessage);
  });
}
