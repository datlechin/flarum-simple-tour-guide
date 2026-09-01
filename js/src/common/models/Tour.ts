import Model from 'flarum/common/Model';

import type TourStep from './TourStep';

/**
 * A tour, as the admin area edits it. The forum reads a narrower payload of
 * its own; see `forum/loadTours`.
 */
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

  /** 'auto' starts itself, 'manual' waits to be launched by the member. */
  startMode() {
    return Model.attribute<'auto' | 'manual'>('startMode').call(this);
  }

  /** A Flarum route name, or null to run wherever the member is. */
  route() {
    return Model.attribute<string | null>('route').call(this);
  }

  devices() {
    return Model.attribute<'any' | 'desktop' | 'mobile'>('devices').call(this);
  }

  /** Group ids that may see it. Null or empty means everybody. */
  groupIds() {
    return Model.attribute<number[] | null>('groupIds').call(this);
  }

  maxAccountAgeDays() {
    return Model.attribute<number | null>('maxAccountAgeDays').call(this);
  }

  position() {
    return Model.attribute<number>('position').call(this);
  }

  stepCount() {
    return Model.attribute<number>('stepCount').call(this);
  }

  steps() {
    return Model.hasMany<TourStep>('steps').call(this);
  }
}
