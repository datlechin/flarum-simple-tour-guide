import app from 'flarum/admin/app';
import Button from 'flarum/common/components/Button';
import Form from 'flarum/common/components/Form';
import FormModal from 'flarum/common/components/FormModal';
import type { IFormModalAttrs } from 'flarum/common/components/FormModal';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import ItemList from 'flarum/common/utils/ItemList';
import Stream from 'flarum/common/utils/Stream';
import extractText from 'flarum/common/utils/extractText';
import type Mithril from 'mithril';

import type Tour from '../../common/models/Tour';
import type TourStep from '../../common/models/TourStep';
import type { StepTranslations } from '../../common/models/TourStep';
import pickElement from '../utils/pickElement';

export interface EditTourStepModalAttrs extends IFormModalAttrs {
  tour: Tour;
  step?: TourStep;
}

export default class EditTourStepModal<CustomAttrs extends EditTourStepModalAttrs = EditTourStepModalAttrs> extends FormModal<CustomAttrs> {
  step!: TourStep;

  stepTitle!: Stream<string>;
  description!: Stream<string>;
  target!: Stream<string>;
  placement!: Stream<string>;
  devices!: Stream<string>;
  isEnabled!: Stream<boolean>;
  clicksTarget!: Stream<boolean>;
  advanceOnClick!: Stream<boolean>;

  /** Wording per locale, edited one language at a time. */
  translations!: StepTranslations;
  locale!: Stream<string>;

  /** How many elements the target matched, the last time we asked the forum. */
  matches: number | null = null;

  picking = false;

  oninit(vnode: Mithril.Vnode<CustomAttrs, this>) {
    super.oninit(vnode);

    this.step = this.attrs.step ?? app.store.createRecord<TourStep>('tour-guide-steps');

    this.stepTitle = Stream(this.step.title() || '');
    this.description = Stream(this.step.description() || '');
    this.target = Stream(this.step.target() || '');
    this.placement = Stream(this.step.placement() || 'auto');
    this.devices = Stream(this.step.devices() || 'any');
    this.isEnabled = Stream(this.step.exists ? this.step.isEnabled() : true);
    this.clicksTarget = Stream(this.step.clicksTarget() || false);
    this.advanceOnClick = Stream(this.step.advanceOnClick() || false);

    this.translations = { ...(this.step.exists ? this.step.translations() : {}) };
    this.locale = Stream('');
  }

  className() {
    return 'EditTourStepModal Modal--medium';
  }

  title() {
    return this.step.exists
      ? app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.edit_title', { title: this.step.title() })
      : app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.create_title');
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
    const invalidTarget = this.invalidTarget();

    items.add(
      'title',
      <div className="Form-group">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.title_label')}</label>
        <input
          className="FormControl"
          name="title"
          disabled={this.loading}
          bidi={this.stepTitle}
          placeholder={extractText(app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.title_placeholder'))}
        />
      </div>,
      100
    );

    items.add(
      'description',
      <div className="Form-group">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.description_label')}</label>
        <textarea
          className="FormControl"
          name="description"
          rows="4"
          disabled={this.loading}
          bidi={this.description}
          placeholder={extractText(app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.description_placeholder'))}
        />
        <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.description_help')}</div>
      </div>,
      90
    );

    items.add('target', this.targetField(invalidTarget), 80);

    items.add(
      'placement',
      <div className="Form-group">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.placement_label')}</label>
        <Select
          value={this.placement()}
          disabled={this.loading}
          options={{
            auto: extractText(app.translator.trans('datlechin-simple-tour-guide.admin.placement.auto')),
            top: extractText(app.translator.trans('datlechin-simple-tour-guide.admin.placement.top')),
            bottom: extractText(app.translator.trans('datlechin-simple-tour-guide.admin.placement.bottom')),
            left: extractText(app.translator.trans('datlechin-simple-tour-guide.admin.placement.left')),
            right: extractText(app.translator.trans('datlechin-simple-tour-guide.admin.placement.right')),
          }}
          onchange={this.placement}
        />
        <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.placement_help')}</div>
      </div>,
      70
    );

    items.add(
      'devices',
      <div className="Form-group">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.devices_label')}</label>
        <Select value={this.devices()} disabled={this.loading} options={deviceOptions()} onchange={this.devices} />
        <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.devices_help')}</div>
      </div>,
      60
    );

    items.add('translations', this.translationsField(), 50);

    items.add(
      'behaviour',
      <div className="Form-group">
        <Switch state={this.clicksTarget()} onchange={this.clicksTarget} disabled={this.loading}>
          {app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.clicks_target_label')}
        </Switch>
        <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.clicks_target_help')}</div>

        <Switch state={this.advanceOnClick()} onchange={this.advanceOnClick} disabled={this.loading}>
          {app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.advance_on_click_label')}
        </Switch>
        <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.advance_on_click_help')}</div>

        <Switch state={this.isEnabled()} onchange={this.isEnabled} disabled={this.loading}>
          {app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.enabled_label')}
        </Switch>
      </div>,
      40
    );

    items.add(
      'submit',
      <div className="Form-group Form-controls">
        <Button type="submit" className="Button Button--primary" loading={this.loading} disabled={invalidTarget}>
          {app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.save_button')}
        </Button>

        {this.step.exists && (
          <Button className="Button Button--danger EditTourStepModal-delete" disabled={this.loading} onclick={this.deleteStep.bind(this)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.delete_button')}
          </Button>
        )}
      </div>,
      0
    );

    return items;
  }

  protected targetField(invalidTarget: boolean): Mithril.Children {
    return (
      <div className="Form-group">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.target_label')}</label>

        <div className="EditTourStepModal-target">
          <input
            className="FormControl"
            name="target"
            disabled={this.loading}
            bidi={this.target}
            spellcheck={false}
            placeholder={extractText(app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.target_placeholder'))}
          />
          <Button className="Button" icon="fas fa-crosshairs" loading={this.picking} onclick={() => this.pick('pick')}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.pick_button')}
          </Button>
          <Button className="Button" icon="fas fa-eye" disabled={!this.target().trim() || invalidTarget} onclick={() => this.pick('test')}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.test_button')}
          </Button>
        </div>

        <div className="helpText">
          {invalidTarget ? (
            <span className="EditTourStepModal-invalidTarget">
              {app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.target_invalid')}
            </span>
          ) : this.matches !== null ? (
            app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.target_matches', { count: this.matches })
          ) : (
            app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.target_help')
          )}
        </div>
      </div>
    );
  }

  protected translationsField(): Mithril.Children {
    const locales = app.data.locales as Record<string, string>;
    const chosen = this.locale();
    const content = chosen ? this.translations[chosen] ?? { title: '', description: '' } : null;

    return (
      <div className="Form-group EditTourStepModal-translations">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.translations_label')}</label>
        <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.translations_help')}</div>

        <Select
          value={chosen}
          disabled={this.loading}
          options={{
            '': extractText(app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.translations_pick')),
            ...Object.fromEntries(Object.entries(locales).map(([code, name]) => [code, this.translations[code] ? `${name} ✓` : name])),
          }}
          onchange={this.locale}
        />

        {!!chosen && content && (
          <div className="EditTourStepModal-translation">
            <input
              className="FormControl"
              disabled={this.loading}
              value={content.title}
              placeholder={this.stepTitle()}
              oninput={(e: InputEvent) => this.setTranslation(chosen, 'title', (e.target as HTMLInputElement).value)}
            />
            <textarea
              className="FormControl"
              rows="3"
              disabled={this.loading}
              value={content.description}
              placeholder={this.description()}
              oninput={(e: InputEvent) => this.setTranslation(chosen, 'description', (e.target as HTMLTextAreaElement).value)}
            />
          </div>
        )}
      </div>
    );
  }

  protected setTranslation(locale: string, key: 'title' | 'description', value: string): void {
    const existing = this.translations[locale] ?? { title: '', description: '' };

    this.translations[locale] = { ...existing, [key]: value };
  }

  /**
   * The target is typed or picked, so it is worth saying "that is not a
   * selector" here rather than letting the tour quietly skip the step later.
   */
  invalidTarget(): boolean {
    const selector = this.target().trim();

    if (!selector) return false;

    try {
      document.querySelector(selector);

      return false;
    } catch {
      return true;
    }
  }

  protected pick(mode: 'pick' | 'test'): void {
    this.picking = mode === 'pick';

    pickElement(mode, this.target().trim() || null).then((picked) => {
      this.picking = false;

      if (picked) {
        if (mode === 'pick') this.target(picked.selector);

        this.matches = picked.matches;
      }

      m.redraw();
    });
  }

  onsubmit(e: SubmitEvent) {
    e.preventDefault();

    if (this.invalidTarget()) return;

    this.loading = true;

    this.step
      .save(
        {
          title: this.stepTitle(),
          description: this.description(),
          target: this.target().trim() || null,
          placement: this.placement(),
          devices: this.devices(),
          isEnabled: this.isEnabled(),
          clicksTarget: this.clicksTarget(),
          advanceOnClick: this.advanceOnClick(),
          translations: this.translations,
          relationships: this.step.exists ? undefined : { tour: this.attrs.tour },
        },
        { meta: undefined }
      )
      .then(() => this.hide(), this.loaded.bind(this));
  }

  deleteStep() {
    const confirmation = extractText(app.translator.trans('datlechin-simple-tour-guide.admin.step_modal.delete_confirmation'));

    if (!confirm(confirmation)) return;

    this.loading = true;

    this.step.delete().then(() => this.hide(), this.loaded.bind(this));
  }
}

export function deviceOptions(): Record<string, string> {
  return {
    any: extractText(app.translator.trans('datlechin-simple-tour-guide.admin.devices.any')),
    desktop: extractText(app.translator.trans('datlechin-simple-tour-guide.admin.devices.desktop')),
    mobile: extractText(app.translator.trans('datlechin-simple-tour-guide.admin.devices.mobile')),
  };
}
