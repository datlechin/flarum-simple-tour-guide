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
import EditTourStepModal from './EditTourStepModal';

/** Named off core's wrapper, so sortablejs stays core's dependency. */
type Sortable = typeof import('flarum/admin/utils/loadSortable')['default'];

export interface TourStepListAttrs extends ComponentAttrs {
  tour: Tour;
}

/**
 * One tour's steps, in the order they run, reorderable by dragging.
 */
export default class TourStepList<CustomAttrs extends TourStepListAttrs = TourStepListAttrs> extends Component<CustomAttrs> {
  private sortable: Sortable | null = null;

  /**
   * Sortable rearranges the DOM behind Mithril's back, so once a drag lands the
   * list is rebuilt rather than diffed against a tree that no longer describes
   * the page. Changing the key is what forces that.
   */
  private listKey = 0;

  oninit(vnode: Mithril.Vnode<CustomAttrs, this>) {
    super.oninit(vnode);

    // Sortable is a good 100KB, and it is core's copy, so it arrives as its own
    // chunk only for the people who open this page.
    import('flarum/admin/utils/loadSortable').then((sortable) => {
      this.sortable = sortable.default;

      m.redraw();
    });
  }

  view(): Mithril.Children {
    return <div className="TourStepList-body">{this.body()}</div>;
  }

  /**
   * Keyed, and the only child of its parent, so that bumping the key replaces
   * the whole subtree instead of being ignored in an unkeyed diff.
   */
  protected body(): Mithril.Children {
    const steps = this.steps();

    return (
      <div key={this.listKey} oncreate={this.onbodycreate.bind(this)}>
        {steps.length ? (
          <ol className="TourStepList">{steps.map(this.stepItem.bind(this))}</ol>
        ) : (
          <p className="TourStepList-empty">{app.translator.trans('datlechin-simple-tour-guide.admin.steps.none')}</p>
        )}

        <Button
          className="Button Button--dashed TourStepList-add"
          icon="fas fa-plus"
          onclick={() => app.modal.show(EditTourStepModal, { tour: this.attrs.tour })}
        >
          {app.translator.trans('datlechin-simple-tour-guide.admin.steps.add_button')}
        </Button>
      </div>
    );
  }

  protected stepItem(step: TourStep): Mithril.Children {
    const title = step.title();
    const target = step.target();

    return (
      <li className={classList('TourStepListItem', { 'TourStepListItem--off': !step.isEnabled() })} data-id={step.id()}>
        {/* Dragging is the only way to reorder, and that is not something a
            keyboard can do, so the handle is not announced as if it were. */}
        <span className="TourStepListItem-handle" aria-hidden="true">
          <Icon name="fas fa-grip-vertical" />
        </span>

        <button type="button" className="TourStepListItem-main" onclick={() => app.modal.show(EditTourStepModal, { tour: this.attrs.tour, step })}>
          <span className="TourStepListItem-title">{title}</span>
          <span className="TourStepListItem-target">
            {target ? <code>{target}</code> : app.translator.trans('datlechin-simple-tour-guide.admin.steps.no_target')}
          </span>
        </button>

        <span className="TourStepListItem-flags">
          {!step.isEnabled() && this.flag('fas fa-eye-slash', 'disabled')}
          {step.devices() !== 'any' && this.flag(step.devices() === 'mobile' ? 'fas fa-mobile-screen' : 'fas fa-desktop', step.devices())}
          {step.clicksTarget() && this.flag('fas fa-hand-pointer', 'clicks_target')}
          {step.advanceOnClick() && this.flag('fas fa-arrow-pointer', 'advance_on_click')}
          {!!Object.keys(step.translations()).length &&
            this.flag('fas fa-language', 'translated', { count: Object.keys(step.translations()).length })}
        </span>

        <Dropdown
          className="TourStepListItem-controls"
          buttonClassName="Button Button--icon Button--flat"
          menuClassName="Dropdown-menu--right"
          icon="fas fa-ellipsis-h"
          accessibleToggleLabel={extractText(app.translator.trans('datlechin-simple-tour-guide.admin.steps.controls_label', { title }))}
        >
          <Button icon="fas fa-clone" onclick={() => this.duplicate(step)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.steps.duplicate_action')}
          </Button>
          {/* Dragging is not something a keyboard can do, so the order has to
              be reachable another way. */}
          <Button icon="fas fa-arrow-up" disabled={this.steps()[0] === step} onclick={() => this.move(step, -1)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.move_up')}
          </Button>
          <Button icon="fas fa-arrow-down" disabled={this.steps().slice(-1)[0] === step} onclick={() => this.move(step, 1)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.move_down')}
          </Button>
        </Dropdown>
      </li>
    );
  }

  protected flag(icon: string, key: string, params: Record<string, unknown> = {}): Mithril.Children {
    const text = extractText(app.translator.trans(`datlechin-simple-tour-guide.admin.steps.flags.${key}`, params));

    return (
      <Tooltip text={text}>
        <span className="TourStepListItem-flag" role="img" aria-label={text}>
          <Icon name={icon} />
        </span>
      </Tooltip>
    );
  }

  /**
   * Shift a step one place, and save the whole order the same way a drag does.
   */
  protected move(step: TourStep, delta: number): void {
    const steps = this.steps();
    const from = steps.indexOf(step);
    const to = from + delta;

    if (from < 0 || to < 0 || to >= steps.length) return;

    steps.splice(to, 0, ...steps.splice(from, 1));

    this.saveOrder(steps.map((moved) => moved.id()!));
  }

  protected duplicate(step: TourStep): void {
    app
      .request({
        method: 'POST',
        url: `${app.forum.attribute('apiUrl')}/tour-guide-steps/${step.id()}/duplicate`,
      })
      .then(async () => {
        await app.store.find<TourStep[]>('tour-guide-steps');

        this.listKey++;

        m.redraw();
      });
  }

  protected steps(): TourStep[] {
    return app.store
      .all<TourStep>('tour-guide-steps')
      .filter((step) => step.tour() === this.attrs.tour)
      .sort((a, b) => a.position() - b.position());
  }

  protected onbodycreate(vnode: Mithril.VnodeDOM): void {
    const list = (vnode.dom as HTMLElement).querySelector<HTMLElement>('.TourStepList');

    if (!list || !this.sortable) return;

    this.sortable.create(list, {
      handle: '.TourStepListItem-handle',
      animation: 150,
      delay: 50,
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      dragClass: 'sortable-dragging',
      ghostClass: 'sortable-placeholder',
      onSort: () => this.onsort(list),
    });
  }

  protected onsort(list: HTMLElement): void {
    this.saveOrder(
      Array.from(list.children)
        .map((item) => (item as HTMLElement).dataset.id)
        .filter((id): id is string => !!id)
    );
  }

  protected saveOrder(order: string[]): void {
    // Move the store to match what the admin is already looking at, so the
    // rebuilt list keeps the order they just chose.
    order.forEach((id, position) => {
      app.store.getById<TourStep>('tour-guide-steps', id)?.pushAttributes({ position });
    });

    app.request({
      url: `${app.forum.attribute('apiUrl')}/tour-guide-tours/${this.attrs.tour.id()}/steps/order`,
      method: 'POST',
      body: { order },
    });

    this.listKey++;

    m.redraw();
  }
}
