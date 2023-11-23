import app from 'flarum/admin/app';
import Button from 'flarum/common/components/Button';
import Modal, { IInternalModalAttrs } from 'flarum/common/components/Modal';
import ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';
import Stream from 'flarum/common/utils/Stream';
import TourGuideStep from 'src/common/models/TourGuideStep';
import extractText from 'flarum/common/utils/extractText';

export interface EditTourGuideStepModalAttrs extends IInternalModalAttrs {
  model?: TourGuideStep;
}

export default class EditTourGuideStepModal extends Modal<EditTourGuideStepModalAttrs> {
  tourGuideStep!: TourGuideStep;

  tourTitle!: Stream<string>;
  description!: Stream<string>;
  target!: Stream<string>;

  oninit(vnode: Mithril.Vnode) {
    super.oninit(vnode);

    this.tourGuideStep = this.attrs.model || app.store.createRecord('tour-guide-steps');

    this.tourTitle = Stream(this.tourGuideStep.title() || '');
    this.description = Stream(this.tourGuideStep.description() || '');
    this.target = Stream(this.tourGuideStep.target() || '');
  }

  className() {
    return 'EditTourGuideStepModal Modal--small';
  }

  title() {
    return this.tourGuideStep.exists
      ? app.translator.trans('datlechin-simple-tour-guide.admin.edit_modal.edit_step', { title: this.tourGuideStep.title() })
      : app.translator.trans('datlechin-simple-tour-guide.admin.edit_modal.create_step');
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="Form">{this.fields().toArray()}</div>
      </div>
    );
  }

  fields() {
    const items = new ItemList();

    items.add(
      'title',
      <div className="Form-group">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.title')}</label>
        <input
          className="FormControl"
          disabled={this.loading}
          bidi={this.tourTitle}
          placeholder={app.translator.trans('datlechin-simple-tour-guide.admin.title_placeholder')}
        />
      </div>,
      30
    );

    items.add(
      'description',
      <div className="Form-group">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.description')}</label>
        <textarea
          className="FormControl"
          disabled={this.loading}
          bidi={this.description}
          rows="3"
          placeholder={app.translator.trans('datlechin-simple-tour-guide.admin.description_placeholder')}
        />
      </div>,
      20
    );

    items.add(
      'target',
      <div className="Form-group">
        <label>{app.translator.trans('datlechin-simple-tour-guide.admin.target')}</label>
        <input
          className="FormControl"
          disabled={this.loading}
          bidi={this.target}
          placeholder={app.translator.trans('datlechin-simple-tour-guide.admin.target_placeholder')}
        />
      </div>,
      10
    );

    items.add(
      'submit',
      <div className="Form-group">
        <Button type="submit" className="Button Button--primary EditTagModal-save" loading={this.loading}>
          Submit
        </Button>
        {this.tourGuideStep.exists && (
          <button type="button" className="Button EditTagModal-delete" onclick={() => this.delete()}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.edit_modal.delete_step')}
          </button>
        )}
      </div>,
      0
    );

    return items;
  }

  submitData() {
    return {
      title: this.tourTitle(),
      description: this.description(),
      target: this.target(),
    };
  }

  onsubmit(e: SubmitEvent) {
    e.preventDefault();

    this.loading = true;

    this.tourGuideStep.save(this.submitData()).then(
      () => this.hide(),
      () => (this.loading = false)
    );
  }

  delete() {
    if (confirm(extractText(app.translator.trans('datlechin-simple-tour-guide.admin.edit_modal.delete_step_confirmation')))) {
      this.tourGuideStep.delete().then(() => m.redraw());

      this.hide();
    }
  }
}
