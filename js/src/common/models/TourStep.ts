import Model from 'flarum/common/Model';

import type Tour from './Tour';
import type { Devices, Placement } from '../types';

export type StepTranslations = Record<string, { title: string; description: string }>;

export default class TourStep extends Model {
  title() {
    return Model.attribute<string>('title').call(this);
  }

  description() {
    return Model.attribute<string>('description').call(this);
  }

  localizedTitle() {
    return Model.attribute<string>('localizedTitle').call(this);
  }

  descriptionHtml() {
    return Model.attribute<string>('descriptionHtml').call(this);
  }

  target() {
    return Model.attribute<string | null>('target').call(this);
  }

  placement() {
    return Model.attribute<Placement>('placement').call(this);
  }

  devices() {
    return Model.attribute<Devices>('devices').call(this);
  }

  isEnabled() {
    return Model.attribute<boolean>('isEnabled').call(this);
  }

  clicksTarget() {
    return Model.attribute<boolean>('clicksTarget').call(this);
  }

  advanceOnClick() {
    return Model.attribute<boolean>('advanceOnClick').call(this);
  }

  position() {
    return Model.attribute<number>('position').call(this);
  }

  translations() {
    const value = Model.attribute<StepTranslations | unknown[]>('translations').call(this);

    // PHP serializes an empty map as [].
    return (Array.isArray(value) || !value ? {} : value) as StepTranslations;
  }

  tour() {
    return Model.hasOne<Tour>('tour').call(this);
  }
}
