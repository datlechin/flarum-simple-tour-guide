import Model from 'flarum/common/Model';
import type { TourOutcome } from '../types';
export default class TourCompletion extends Model {
    outcome(): TourOutcome;
}
