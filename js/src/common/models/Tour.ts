import Model from 'flarum/common/Model';
import type Group from 'flarum/common/models/Group';

import type TourCompletion from './TourCompletion';
import type TourStep from './TourStep';
import type { Devices, StartMode } from '../types';

export default class Tour extends Model {
  key() {
    return Model.attribute<string>('key').call(this);
  }

  title() {
    return Model.attribute<string>('title').call(this);
  }

  isEnabled() {
    return Model.attribute<boolean>('isEnabled').call(this);
  }

  startMode() {
    return Model.attribute<StartMode>('startMode').call(this);
  }

  route() {
    return Model.attribute<string | null>('route').call(this);
  }

  devices() {
    return Model.attribute<Devices>('devices').call(this);
  }

  maxAccountAgeDays() {
    return Model.attribute<number | null>('maxAccountAgeDays').call(this);
  }

  position() {
    return Model.attribute<number>('position').call(this);
  }

  groups() {
    return Model.hasMany<Group>('groups').call(this);
  }

  // From the store rather than the relationship, which misses steps added after the tour loaded.
  steps(): TourStep[] {
    return this.store
      .all<TourStep>('tour-guide-steps')
      .filter((step) => step.tour() === this)
      .sort((a, b) => a.position() - b.position());
  }

  enabledSteps() {
    return Model.hasMany<TourStep>('enabledSteps').call(this);
  }

  completion() {
    return Model.hasOne<TourCompletion>('completion').call(this);
  }
}
