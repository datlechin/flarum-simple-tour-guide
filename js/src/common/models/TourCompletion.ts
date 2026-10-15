import Model from 'flarum/common/Model';

import type { TourOutcome } from '../types';

export default class TourCompletion extends Model {
  outcome() {
    return Model.attribute<TourOutcome>('outcome').call(this);
  }
}
