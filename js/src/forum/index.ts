import app from 'flarum/forum/app';
import { DriveStep, driver } from 'driver.js';
import extractText from 'flarum/common/utils/extractText';
import TourGuideStep from 'src/common/models/TourGuideStep';
export { default as extend } from '../common';

app.initializers.add('datlechin/flarum-simple-tour-guide', () => {
  document.addEventListener('DOMContentLoaded', async () => {
    const user = app.session.user;

    if (!user || user.attribute('tourGuideDismissedAt')) {
      return;
    }

    let tourGuideSteps: TourGuideStep[] = [];

    await app.store.find<TourGuideStep[]>(`tour-guide-steps`).then((steps) => {
      tourGuideSteps = steps;
    });

    const dismissTour = () => {
      app.request({
        url: `${app.forum.attribute('apiUrl')}/simple-tour-guide/dismiss`,
        method: 'POST',
      });
    };

    const getTranslation = (key: string, parameters: Record<string, string> = {}) => {
      return extractText(app.translator.trans(`datlechin-simple-tour-guide.forum.${key}`, parameters));
    };

    const getSetting = (key: string): boolean => {
      return app.forum.attribute(`datlechin-simple-tour-guide.${key}`);
    };

    const getSteps = (): DriveStep[] => {
      return tourGuideSteps.map((step) => {
        return {
          element: step.target(),
          popover: {
            title: step.title(),
            description: step.description(),
          },
        };
      });
    };

    extractText;
    const driverObj = driver({
      showProgress: getSetting('showProgress'),
      allowClose: getSetting('allowClose'),
      smoothScroll: true,
      overlayColor: 'var(--overlay-bg)',
      progressText: getTranslation('progress_text', {
        current: '{{current}}',
        total: '{{total}}',
      }),
      showButtons: ['next', 'previous'],
      nextBtnText: getTranslation('next_btn_text'),
      prevBtnText: getTranslation('prev_btn_text'),
      doneBtnText: getTranslation('done_btn_text'),
      steps: getSteps(),
      onDestroyed: () => {
        dismissTour();
      },
    });

    driverObj.drive();
  });
});
