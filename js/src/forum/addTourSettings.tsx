import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import FieldSet from 'flarum/common/components/FieldSet';
import type SettingsPage from 'flarum/forum/components/SettingsPage';
import type ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';

import TourSettings from './components/TourSettings';

/**
 * A section on the member's settings page listing the tours open to them.
 */
export default function addTourSettings(): void {
  // Addressed by path rather than by import: core only registers this
  // component for async chunks, so importing it here is undefined at boot.
  // Given a path, extend waits for the chunk and patches it when it lands.
  extend('flarum/forum/components/SettingsPage', 'settingsItems', function (this: SettingsPage, items: ItemList<Mithril.Children>) {
    if (!app.forum.attribute<boolean>('datlechin-simple-tour-guide.showInSettings')) return;

    items.add(
      'tourGuide',
      <FieldSet className="Settings-tourGuide FieldSet--min" label={app.translator.trans('datlechin-simple-tour-guide.forum.settings.heading')}>
        <TourSettings />
      </FieldSet>,
      // Below the sections core ships, which start at 100 and count down.
      -10
    );
  });
}
