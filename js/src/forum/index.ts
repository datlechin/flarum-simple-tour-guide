import app from 'flarum/forum/app';

import addResetTourGuideControl from './addResetTourGuideControl';
import addTourSettings from './addTourSettings';
import autoStartTour from './autoStartTour';
import startElementPicker from './startElementPicker';

export { default as extend } from '../common';

export { default as showTour } from './showTour';
export { default as loadTours } from './loadTours';
export { default as TourState } from './states/TourState';
export { default as TourGuide } from './components/TourGuide';
export { default as TourSettings } from './components/TourSettings';
export { default as ElementPicker } from './components/ElementPicker';
export { default as generateSelector } from './utils/generateSelector';
export * from './types';

app.initializers.add('datlechin/flarum-simple-tour-guide', () => {
  addResetTourGuideControl();
  addTourSettings();
  autoStartTour();
  startElementPicker();
});
