import app from 'flarum/admin/app';

export interface PickedElement {
  selector: string;
  matches: number;
}

/**
 * Open the forum in a second window and let the admin point at the element
 * their step is about.
 *
 * Resolves with `null` when they close the window without picking, which is
 * also what happens if the browser blocks the popup.
 */
export default function pickElement(mode: 'pick' | 'test', selector?: string | null): Promise<PickedElement | null> {
  const url = new URL(app.forum.attribute<string>('baseUrl'));

  url.searchParams.set('tour-picker', mode);

  if (selector) url.searchParams.set('tour-selector', selector);

  const picker = window.open(url.toString(), 'datlechin-tour-picker', 'width=1280,height=860');

  if (!picker) return Promise.resolve(null);

  picker.focus();

  return new Promise((resolve) => {
    const finish = (result: PickedElement | null) => {
      window.removeEventListener('message', onmessage);
      window.clearInterval(watchdog);
      resolve(result);
    };

    const onmessage = (event: MessageEvent) => {
      // Same forum only. The picker window is same-origin, and a message from
      // anywhere else has no business filling in a form here.
      if (event.origin !== window.location.origin) return;
      if (event.data?.source !== 'datlechin-simple-tour-guide') return;

      finish({ selector: String(event.data.selector), matches: Number(event.data.matches) || 0 });
    };

    // A closed window sends nothing, so the promise has to notice for itself.
    const watchdog = window.setInterval(() => {
      if (picker.closed) finish(null);
    }, 400);

    window.addEventListener('message', onmessage);
  });
}
