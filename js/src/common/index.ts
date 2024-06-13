import Extend from 'flarum/common/extenders';
import TourGuideStep from './models/TourGuideStep';
import User from 'flarum/common/models/User';

export default [
  new Extend.Model(User).attribute<boolean>('tourGuideDismissedAt').attribute<boolean>('canResetTourGuide'),

  new Extend.Store().add('tour-guide-steps', TourGuideStep),
];
