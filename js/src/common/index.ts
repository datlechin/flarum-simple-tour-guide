import Extend from 'flarum/common/extenders';
import User from 'flarum/common/models/User';

import Tour from './models/Tour';
import TourCompletion from './models/TourCompletion';
import TourStep from './models/TourStep';

export default [
  new Extend.Model(User).attribute<boolean>('canResetTourGuide'),

  new Extend.Store().add('tour-guide-tours', Tour).add('tour-guide-steps', TourStep).add('tour-guide-completions', TourCompletion),
];
