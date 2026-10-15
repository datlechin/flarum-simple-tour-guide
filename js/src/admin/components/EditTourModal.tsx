import app from 'flarum/admin/app';
import Button from 'flarum/common/components/Button';
import Form from 'flarum/common/components/Form';
import FormModal from 'flarum/common/components/FormModal';
import type { IFormModalAttrs } from 'flarum/common/components/FormModal';
import MultiSelect from 'flarum/common/components/MultiSelect';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import Group from 'flarum/common/models/Group';
import ItemList from 'flarum/common/utils/ItemList';
import Stream from 'flarum/common/utils/Stream';
import extractText from 'flarum/common/utils/extractText';
import sortGroups from 'flarum/common/utils/sortGroups';
import type Mithril from 'mithril';

import type Tour from '../../common/models/Tour';
import deviceOptions from '../utils/deviceOptions';

export interface EditTourModalAttrs extends IFormModalAttrs {
  tour?: Tour;
}

// Suggestions only: extensions add routes of their own, and the admin app cannot list the forum's.
const CORE_ROUTES = ['index', 'discussion', 'user', 'settings', 'notifications', 'posts'];

export default class EditTourModal<CustomAttrs extends EditTourModalAttrs = EditTourModalAttrs> extends FormModal<CustomAttrs> {
  tour!: Tour;

  key!: Stream<string>;
  tourTitle!: Stream<string>;
  isEnabled!: Stream<boolean>;
  startMode!: Stream<string>;
  route!: Stream<string>;
  devices!: Stream<string>;
  groupIds!: Stream<string[]>;
  maxAccountAgeDays!: Stream<string>;

  oninit(vnode: Mithril.Vnode<CustomAttrs, this>) {
    super.oninit(vnode);

    this.tour = this.attrs.tour ?? app.store.createRecord<Tour>('tour-guide-tours');

    this.key = Stream(this.tour.key() || '');
    this.tourTitle = Stream(this.tour.title() || '');
    this.isEnabled = Stream(this.tour.exists ? this.tour.isEnabled() : true);
    this.startMode = Stream(this.tour.startMode() || 'auto');
    this.route = Stream(this.tour.route() || '');
    this.devices = Stream(this.tour.devices() || 'any');
    this.groupIds = Stream((this.tour.groups() || []).map((group) => group!.id()!));
    this.maxAccountAgeDays = Stream(this.tour.maxAccountAgeDays()?.toString() ?? '');
  }

  className() {
    return 'EditTourModal Modal--medium';
  }

  title() {
    return this.tour.exists
      ? app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.edit_title', { title: this.tour.title() })
      : app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.create_title');
  }

  content() {
    return (
      <div className="Modal-body">
        <Form>{this.fields().toArray()}</Form>
      </div>
    );
  }

  fields(): ItemList<Mithril.Children> {
    const items = new ItemList<Mithril.Children>();

    items.add(
      'title',
      <div className="Form-group">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.title_label')}</label>
        <input className="FormControl" name="title" disabled={this.loading} bidi={this.tourTitle} />
        <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.title_help')}</div>
      </div>,
      100
    );

    items.add(
      'key',
      <div className="Form-group">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.key_label')}</label>
        <input className="FormControl" name="key" disabled={this.loading} bidi={this.key} spellcheck={false} placeholder="welcome" />
        <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.key_help')}</div>
      </div>,
      90
    );

    items.add(
      'startMode',
      <div className="Form-group">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.start_mode_label')}</label>
        <Select
          value={this.startMode()}
          disabled={this.loading}
          options={{
            auto: extractText(app.translator.trans('datlechin-simple-tour-guide.admin.start_mode.auto')),
            manual: extractText(app.translator.trans('datlechin-simple-tour-guide.admin.start_mode.manual')),
          }}
          onchange={this.startMode}
        />
        <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.start_mode_help')}</div>
      </div>,
      80
    );

    items.add(
      'route',
      <div className="Form-group">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.route_label')}</label>
        <input
          className="FormControl"
          name="route"
          list="tour-guide-routes"
          disabled={this.loading}
          bidi={this.route}
          spellcheck={false}
          placeholder={extractText(app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.route_placeholder'))}
        />
        <datalist id="tour-guide-routes">
          {CORE_ROUTES.map((name) => (
            <option value={name} />
          ))}
        </datalist>
        <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.route_help')}</div>
      </div>,
      70
    );

    items.add(
      'devices',
      <div className="Form-group">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.devices_label')}</label>
        <Select value={this.devices()} disabled={this.loading} options={deviceOptions()} onchange={this.devices} />
      </div>,
      60
    );

    items.add('audience', this.audienceField(), 50);

    items.add(
      'enabled',
      <div className="Form-group">
        <Switch state={this.isEnabled()} onchange={this.isEnabled} disabled={this.loading}>
          {app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.enabled_label')}
        </Switch>
      </div>,
      40
    );

    items.add(
      'submit',
      <div className="Form-group Form-controls">
        <Button type="submit" className="Button Button--primary" loading={this.loading}>
          {app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.save_button')}
        </Button>

        {this.tour.exists && (
          <Button className="Button Button--danger EditTourModal-delete" disabled={this.loading} onclick={this.deleteTour.bind(this)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.delete_button')}
          </Button>
        )}
      </div>,
      0
    );

    return items;
  }

  protected audienceField(): Mithril.Children {
    const groups = sortGroups(app.store.all<Group>('groups').filter((group) => group.id() !== Group.GUEST_ID));

    return (
      <div className="Form-group EditTourModal-audience">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.audience_label')}</label>
        <MultiSelect
          value={this.groupIds()}
          disabled={this.loading}
          options={Object.fromEntries(groups.map((group) => [group.id()!, group.namePlural()]))}
          onchange={this.groupIds}
        />
        <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.audience_help')}</div>

        <label className="EditTourModal-age">
          {app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.max_age_label')}
          <input
            className="FormControl"
            name="maxAccountAgeDays"
            type="number"
            min="1"
            max="3650"
            disabled={this.loading}
            bidi={this.maxAccountAgeDays}
          />
        </label>
        <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.max_age_help')}</div>
      </div>
    );
  }

  onsubmit(e: SubmitEvent) {
    e.preventDefault();

    this.loading = true;

    const age = parseInt(this.maxAccountAgeDays(), 10);

    this.tour
      .save(
        {
          key: this.key().trim() || undefined,
          title: this.tourTitle(),
          isEnabled: this.isEnabled(),
          startMode: this.startMode(),
          route: this.route().trim() || null,
          devices: this.devices(),
          maxAccountAgeDays: age > 0 ? age : null,
          relationships: { groups: this.groupIds().map((id: string) => app.store.getById<Group>('groups', id)!) },
        },
        { errorHandler: this.onerror.bind(this) }
      )
      .then(this.hide.bind(this))
      .catch(() => {
        this.loading = false;
        m.redraw();
      });
  }

  deleteTour() {
    if (!confirm(extractText(app.translator.trans('datlechin-simple-tour-guide.admin.tour_modal.delete_confirmation')))) return;

    this.loading = true;

    this.tour.delete().then(this.hide.bind(this), this.loaded.bind(this));
  }
}
