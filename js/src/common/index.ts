import Extend from 'flarum/common/extenders';
import TourGuideStep from './models/TourGuideStep';

export default [new Extend.Store().add('tour-guide-steps', TourGuideStep)];
