import app from 'flarum/admin/app';

import TourGuidePage from './components/TourGuidePage';

export { default as extend } from '../common';

export { default as TourGuidePage } from './components/TourGuidePage';
export { default as EditTourModal } from './components/EditTourModal';
export { default as EditTourStepModal } from './components/EditTourStepModal';
export { default as TourStepList } from './components/TourStepList';
export { default as TourStats } from './components/TourStats';
export { default as pickElement } from './utils/pickElement';

app.initializers.add('datlechin/flarum-simple-tour-guide', () => {
  app.registry
    .for('datlechin-simple-tour-guide')
    .registerPage(TourGuidePage)
    // Registered as well as rendered by the page, so that admin search can
    // find them by name.
    .registerSetting(
      {
        setting: 'datlechin-simple-tour-guide.show_progress',
        type: 'boolean',
        label: app.translator.trans('datlechin-simple-tour-guide.admin.settings.show_progress_label'),
        help: app.translator.trans('datlechin-simple-tour-guide.admin.settings.show_progress_help'),
      },
      30
    )
    .registerSetting(
      {
        setting: 'datlechin-simple-tour-guide.allow_close',
        type: 'boolean',
        label: app.translator.trans('datlechin-simple-tour-guide.admin.settings.allow_close_label'),
        help: app.translator.trans('datlechin-simple-tour-guide.admin.settings.allow_close_help'),
      },
      20
    )
    .registerSetting(
      {
        setting: 'datlechin-simple-tour-guide.show_in_settings',
        type: 'boolean',
        label: app.translator.trans('datlechin-simple-tour-guide.admin.settings.show_in_settings_label'),
        help: app.translator.trans('datlechin-simple-tour-guide.admin.settings.show_in_settings_help'),
      },
      10
    )
    .registerPermission(
      {
        icon: 'fas fa-rotate',
        label: app.translator.trans('datlechin-simple-tour-guide.admin.permissions.reset_tour_guide'),
        permission: 'resetTourGuide',
      },
      'moderate',
      90
    );
});
