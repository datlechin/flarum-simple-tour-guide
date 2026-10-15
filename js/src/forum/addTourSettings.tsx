import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import FieldSet from 'flarum/common/components/FieldSet';
import type SettingsPage from 'flarum/forum/components/SettingsPage';
import type ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';

import TourSettings from './components/TourSettings';

export default function addTourSettings(): void {
  // By path: SettingsPage is an async chunk, so importing it here is undefined at boot.
  extend('flarum/forum/components/SettingsPage', 'settingsItems', function (this: SettingsPage, items: ItemList<Mithril.Children>) {
    if (!app.forum.attribute<boolean>('datlechin-simple-tour-guide.showInSettings')) return;

    items.add(
      'tourGuide',
      <FieldSet className="Settings-tourGuide FieldSet--min" label={app.translator.trans('datlechin-simple-tour-guide.forum.settings.heading')}>
        <TourSettings />
      </FieldSet>,
      -10
    );
  });
}
