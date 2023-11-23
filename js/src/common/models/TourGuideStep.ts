import Model from 'flarum/common/Model';

export default class TourGuideStep extends Model {
  title() {
    return Model.attribute<string>('title').call(this);
  }

  description() {
    return Model.attribute<string>('description').call(this);
  }

  target() {
    return Model.attribute<string>('target').call(this);
  }
}
