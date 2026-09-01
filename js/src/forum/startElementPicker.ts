import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import type Page from 'flarum/common/components/Page';

import ElementPicker from './components/ElementPicker';

/** Query parameters the admin area puts on the forum URL it opens. */
const MODE_PARAM = 'tour-picker';
const SELECTOR_PARAM = 'tour-selector';

let mounted = false;

/**
 * Turn the forum into a selector picker when the admin area asks it to.
 */
export default function startElementPicker(): void {
  extend('flarum/common/components/Page', 'oncreate', () => {
    if (mounted) return;

    const params = new URLSearchParams(window.location.search);
    const mode = params.get(MODE_PARAM);

    if (mode !== 'pick' && mode !== 'test') return;

    // Only an admin gets a picker. Anybody can put this in their address bar,
    // and for everybody else it should do nothing at all.
    if (!app.session.user?.isAdmin()) return;

    mounted = true;

    const container = document.createElement('div');
    container.className = 'TourPickerContainer';
    document.body.append(container);

    m.mount(container, {
      view: () => m(ElementPicker, { mode, selector: params.get(SELECTOR_PARAM) }),
    });
  });
}
