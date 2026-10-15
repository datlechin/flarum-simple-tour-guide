import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Dropdown from 'flarum/common/components/Dropdown';
import Icon from 'flarum/common/components/Icon';
import Tooltip from 'flarum/common/components/Tooltip';
import classList from 'flarum/common/utils/classList';
import extractText from 'flarum/common/utils/extractText';
import type Mithril from 'mithril';

import type Tour from '../../common/models/Tour';
import type TourStep from '../../common/models/TourStep';
import { applyOrder, moveButton } from '../utils/order';
import { duplicateStep, orderSteps } from '../utils/tourApi';
import EditTourStepModal from './EditTourStepModal';
import SortableList from './SortableList';

export interface TourStepListAttrs extends ComponentAttrs {
  tour: Tour;
}

export default class TourStepList<CustomAttrs extends TourStepListAttrs = TourStepListAttrs> extends Component<CustomAttrs> {
  view(): Mithril.Children {
    const tour = this.attrs.tour;
    const steps = tour.steps();

    return (
      <div>
        {steps.length ? (
          <SortableList
            className="TourStepList"
            handle=".TourStepListItem-handle"
            onsort={(ids: string[]) => applyOrder(steps, ids, (order) => orderSteps(tour, order))}
          >
            {steps.map((step) => this.stepItem(step, steps))}
          </SortableList>
        ) : (
          <p className="TourStepList-empty">{app.translator.trans('datlechin-simple-tour-guide.admin.steps.none')}</p>
        )}

        <Button className="Button Button--dashed TourStepList-add" icon="fas fa-plus" onclick={() => app.modal.show(EditTourStepModal, { tour })}>
          {app.translator.trans('datlechin-simple-tour-guide.admin.steps.add_button')}
        </Button>
      </div>
    );
  }

  protected stepItem(step: TourStep, steps: TourStep[]): Mithril.Children {
    const tour = this.attrs.tour;
    const title = step.title();
    const target = step.target();
    const translated = Object.keys(step.translations()).length;
    const save = (order: string[]) => orderSteps(tour, order);

    return (
      <li className={classList('TourStepListItem', { 'TourStepListItem--off': !step.isEnabled() })} data-id={step.id()}>
        <span className="TourStepListItem-handle" aria-hidden="true">
          <Icon name="fas fa-grip-vertical" />
        </span>

        <button type="button" className="TourStepListItem-main" onclick={() => app.modal.show(EditTourStepModal, { tour, step })}>
          <span className="TourStepListItem-title">{title}</span>
          <span className="TourStepListItem-target">
            {target ? <code>{target}</code> : app.translator.trans('datlechin-simple-tour-guide.admin.steps.no_target')}
          </span>
        </button>

        <span className="TourStepListItem-flags">
          {!step.isEnabled() && this.flag('fas fa-eye-slash', app.translator.trans('datlechin-simple-tour-guide.admin.steps.flags.disabled'))}
          {step.devices() === 'desktop' && this.flag('fas fa-desktop', app.translator.trans('datlechin-simple-tour-guide.admin.steps.flags.desktop'))}
          {step.devices() === 'mobile' &&
            this.flag('fas fa-mobile-screen', app.translator.trans('datlechin-simple-tour-guide.admin.steps.flags.mobile'))}
          {step.clicksTarget() &&
            this.flag('fas fa-hand-pointer', app.translator.trans('datlechin-simple-tour-guide.admin.steps.flags.clicks_target'))}
          {step.advanceOnClick() &&
            this.flag('fas fa-arrow-pointer', app.translator.trans('datlechin-simple-tour-guide.admin.steps.flags.advance_on_click'))}
          {!!translated &&
            this.flag('fas fa-language', app.translator.trans('datlechin-simple-tour-guide.admin.steps.flags.translated', { count: translated }))}
        </span>

        <Dropdown
          className="TourStepListItem-controls"
          buttonClassName="Button Button--icon Button--flat"
          menuClassName="Dropdown-menu--right"
          icon="fas fa-ellipsis-h"
          accessibleToggleLabel={extractText(app.translator.trans('datlechin-simple-tour-guide.admin.steps.controls_label', { title }))}
        >
          <Button icon="fas fa-clone" onclick={() => duplicateStep(step).then(() => m.redraw())}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.steps.duplicate_action')}
          </Button>
          {moveButton(steps, step, -1, save)}
          {moveButton(steps, step, 1, save)}
        </Dropdown>
      </li>
    );
  }

  protected flag(icon: string, label: Mithril.Children): Mithril.Children {
    const text = extractText(label);

    return (
      <Tooltip text={text}>
        <span className="TourStepListItem-flag" role="img" aria-label={text}>
          <Icon name={icon} />
        </span>
      </Tooltip>
    );
  }
}
