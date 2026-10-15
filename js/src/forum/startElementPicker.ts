import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';

import ElementPicker from './components/ElementPicker';
import type { ElementPickerAttrs } from './components/ElementPicker';

// Read once: the query string is gone after the first navigation, and the picker stays for the whole visit.
let launch: ElementPickerAttrs | null = null;
let mounted = false;

export function pickerActive(): boolean {
  return launch !== null;
}

export default function startElementPicker(): void {
  app.beforeMount(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('tour-picker');

    if ((mode === 'pick' || mode === 'test') && app.session.user?.isAdmin()) {
      launch = { mode, selector: params.get('tour-selector'), route: params.get('tour-route') };
    }
  });

  extend('flarum/common/components/Page', 'oncreate', () => {
    if (!launch || mounted) return;

    mounted = true;

    const container = document.createElement('div');
    container.className = 'TourPickerContainer';
    document.body.append(container);

    m.mount(container, { view: () => m(ElementPicker, launch!) });
  });
}
