import Model from 'flarum/common/Model';

import type Tour from './Tour';

export type StepTranslations = Record<string, { title: string; description: string }>;

export default class TourStep extends Model {
  title() {
    return Model.attribute<string>('title').call(this);
  }

  description() {
    return Model.attribute<string>('description').call(this);
  }

  /** A CSS selector, or null for a step that stands on its own. */
  target() {
    return Model.attribute<string | null>('target').call(this);
  }

  placement() {
    return Model.attribute<'auto' | 'top' | 'bottom' | 'left' | 'right'>('placement').call(this);
  }

  devices() {
    return Model.attribute<'any' | 'desktop' | 'mobile'>('devices').call(this);
  }

  isEnabled() {
    return Model.attribute<boolean>('isEnabled').call(this);
  }

  /** Clicks the highlighted element on the way to the next step. */
  clicksTarget() {
    return Model.attribute<boolean>('clicksTarget').call(this);
  }

  /** Waits for the member to click the highlighted element. */
  advanceOnClick() {
    return Model.attribute<boolean>('advanceOnClick').call(this);
  }

  position() {
    return Model.attribute<number>('position').call(this);
  }

  /** Wording per locale, keyed by locale code. */
  translations() {
    const value = Model.attribute<StepTranslations | unknown>('translations').call(this);

    // An empty map comes back from PHP as `[]` rather than `{}`.
    return (Array.isArray(value) || !value ? {} : value) as StepTranslations;
  }

  tour() {
    return Model.hasOne<Tour>('tour').call(this);
  }
}
