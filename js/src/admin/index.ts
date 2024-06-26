import app from 'flarum/admin/app';
import SettingsPage from './components/SettingsPage';
export { default as extend } from '../common';

app.initializers.add('datlechin/flarum-simple-tour-guide', () => {
  app.extensionData
    .for('datlechin-simple-tour-guide')
    .registerPage(SettingsPage)
    .registerPermission(
      {
        icon: 'fas fa-sync',
        label: app.translator.trans('datlechin-simple-tour-guide.admin.permissions.reset_tour_guide'),
        permission: 'resetTourGuide',
      },
      'moderate'
    );
});
