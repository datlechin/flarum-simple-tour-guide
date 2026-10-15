import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import type { ExtensionPageAttrs } from 'flarum/admin/components/ExtensionPage';
import FormSection from 'flarum/admin/components/FormSection';
import FormSectionGroup from 'flarum/admin/components/FormSectionGroup';
import Button from 'flarum/common/components/Button';
import Dropdown from 'flarum/common/components/Dropdown';
import Form from 'flarum/common/components/Form';
import Icon from 'flarum/common/components/Icon';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import classList from 'flarum/common/utils/classList';
import extractText from 'flarum/common/utils/extractText';
import type Mithril from 'mithril';

import type Tour from '../../common/models/Tour';
import { previewTour } from '../utils/openForum';
import { applyOrder, moveButton } from '../utils/order';
import { duplicateTour, exportTour, importTour, orderTours } from '../utils/tourApi';
import EditTourModal from './EditTourModal';
import SortableList from './SortableList';
import TourStats from './TourStats';
import TourStepList from './TourStepList';

export default class TourGuidePage<CustomAttrs extends ExtensionPageAttrs = ExtensionPageAttrs> extends ExtensionPage<CustomAttrs> {
  private loadingTours = true;
  private selectedId: string | null = null;

  oninit(vnode: Mithril.Vnode<CustomAttrs, this>) {
    super.oninit(vnode);

    app.store.find<Tour[]>('tour-guide-tours', { include: 'steps,groups' }).then(() => {
      this.loadingTours = false;

      m.redraw();
    });
  }

  content() {
    const tour = this.selected();

    return (
      <div className="ExtensionPage-settings TourGuidePage">
        <div className="container">
          {/* Core caps a section at 400px, so four abreast leaves none readable. */}
          <FormSectionGroup>
            <FormSection label={app.translator.trans('datlechin-simple-tour-guide.admin.tours.heading')}>
              {this.loadingTours ? <LoadingIndicator /> : this.tourList()}
            </FormSection>

            {tour && (
              <FormSection label={app.translator.trans('datlechin-simple-tour-guide.admin.steps.heading', { title: tour.title() })}>
                <TourStepList tour={tour} />
              </FormSection>
            )}
          </FormSectionGroup>

          <FormSectionGroup>
            {tour && (
              <FormSection label={app.translator.trans('datlechin-simple-tour-guide.admin.stats.heading')}>
                <TourStats key={tour.id()} tour={tour} />
              </FormSection>
            )}

            <FormSection label={app.translator.trans('datlechin-simple-tour-guide.admin.settings.heading')}>
              <Form>
                {(app.registry.getSettings(this.extension.id) ?? []).map(this.buildSettingComponent.bind(this))}
                <div className="Form-group Form-controls">{this.submitButton()}</div>
              </Form>
            </FormSection>
          </FormSectionGroup>
        </div>
      </div>
    );
  }

  protected tourList(): Mithril.Children {
    const tours = this.tours();

    return (
      <div>
        {tours.length ? (
          <SortableList className="TourList" handle=".TourListItem-handle" onsort={(ids: string[]) => applyOrder(tours, ids, orderTours)}>
            {tours.map(this.tourItem.bind(this))}
          </SortableList>
        ) : (
          <p className="TourList-empty">{app.translator.trans('datlechin-simple-tour-guide.admin.tours.none')}</p>
        )}

        <div className="TourList-actions">
          <Button className="Button Button--dashed" icon="fas fa-plus" onclick={() => app.modal.show(EditTourModal)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.tours.add_button')}
          </Button>
          <Button className="Button" icon="fas fa-file-import" onclick={() => importTour().then(() => m.redraw())}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.tours.import_button')}
          </Button>
        </div>
      </div>
    );
  }

  protected tourItem(tour: Tour): Mithril.Children {
    const tours = this.tours();
    const selected = tour === this.selected();

    return (
      <li className={classList('TourListItem', { 'TourListItem--selected': selected, 'TourListItem--off': !tour.isEnabled() })} data-id={tour.id()}>
        <span className="TourListItem-handle" aria-hidden="true">
          <Icon name="fas fa-grip-vertical" />
        </span>

        <button
          type="button"
          className="TourListItem-main"
          onclick={() => (this.selectedId = tour.id()!)}
          aria-current={selected ? 'true' : undefined}
        >
          <span className="TourListItem-title">{tour.title()}</span>
          <span className="TourListItem-meta">{this.meta(tour)}</span>
        </button>

        <Dropdown
          className="TourListItem-controls"
          buttonClassName="Button Button--icon Button--flat"
          menuClassName="Dropdown-menu--right"
          icon="fas fa-ellipsis-h"
          accessibleToggleLabel={extractText(app.translator.trans('datlechin-simple-tour-guide.admin.tours.controls_label', { title: tour.title() }))}
        >
          <Button icon="fas fa-pen-to-square" onclick={() => app.modal.show(EditTourModal, { tour })}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.tours.edit_action')}
          </Button>
          {moveButton(tours, tour, -1, orderTours)}
          {moveButton(tours, tour, 1, orderTours)}
          <Button icon="fas fa-play" onclick={() => previewTour(tour)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.tours.preview_button')}
          </Button>
          <Button icon="fas fa-clone" onclick={() => duplicateTour(tour).then(() => m.redraw())}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.tours.duplicate_button')}
          </Button>
          <Button icon="fas fa-file-export" onclick={() => exportTour(tour)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.tours.export_button')}
          </Button>
        </Dropdown>
      </li>
    );
  }

  protected meta(tour: Tour): Mithril.Children {
    const steps = tour.steps().length;
    const parts: Mithril.Children[] = [
      app.translator.trans('datlechin-simple-tour-guide.admin.tours.step_count', { count: steps }),
      tour.startMode() === 'auto'
        ? app.translator.trans('datlechin-simple-tour-guide.admin.start_mode.auto')
        : app.translator.trans('datlechin-simple-tour-guide.admin.start_mode.manual'),
    ];

    if (tour.route()) parts.push(tour.route());
    if (!tour.isEnabled()) parts.push(app.translator.trans('datlechin-simple-tour-guide.admin.tours.disabled'));

    if (tour.isEnabled() && !steps) {
      parts.push(
        <span className="TourListItem-warning">
          <Icon name="fas fa-triangle-exclamation" />
          {app.translator.trans('datlechin-simple-tour-guide.admin.tours.no_steps_warning')}
        </span>
      );
    }

    return parts.map((part, index) => (index ? [' · ', part] : part));
  }

  protected tours(): Tour[] {
    return app.store.all<Tour>('tour-guide-tours').sort((a, b) => a.position() - b.position());
  }

  protected selected(): Tour | null {
    return (this.selectedId && app.store.getById<Tour>('tour-guide-tours', this.selectedId)) || this.tours()[0] || null;
  }
}
