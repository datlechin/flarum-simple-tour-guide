import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import ItemList from 'flarum/common/utils/ItemList';
import extractText from 'flarum/common/utils/extractText';
import generateElementId from 'flarum/common/utils/generateElementId';
import { createFocusTrap } from 'flarum/common/utils/focusTrap';
import type Mithril from 'mithril';

import type TourState from '../states/TourState';
import computePlacement from '../utils/computePlacement';
import type { TourSide } from '../utils/computePlacement';
import spotlightPath from '../utils/spotlightPath';
import { isPhone } from '../utils/device';
import { isPresent, revealTarget } from '../utils/target';

export interface TourGuideAttrs extends ComponentAttrs {
  state: TourState;
}

type FocusTrap = ReturnType<typeof createFocusTrap>;

const SPOTLIGHT_PADDING = 6;

const SPOTLIGHT_RADIUS = 6;

export default class TourGuide<CustomAttrs extends TourGuideAttrs = TourGuideAttrs> extends Component<CustomAttrs> {
  private titleId = generateElementId();

  private popover: HTMLElement | null = null;
  private arrow: HTMLElement | null = null;
  private cutout: SVGPathElement | null = null;

  private frame: number | null = null;
  private trap: FocusTrap | null = null;
  private closeWatcher: CloseWatcher | null = null;

  private shown: { step: unknown; element: HTMLElement | null } = { step: null, element: null };

  // Last laid-out geometry, so an unchanged frame costs nothing.
  private geometry = '';

  view(): Mithril.Children {
    const state = this.attrs.state;

    if (!state.current) return null;

    return (
      <div className="TourGuide" role="presentation" onclick={this.contain.bind(this)}>
        {/* The evenodd hole is not hit-tested, so clicks in it reach the element. Only a click-to-continue step leaves it open. */}
        <svg className="TourGuide-spotlight" aria-hidden="true" onclick={this.onbackdropclick.bind(this)}>
          <path fill-rule="evenodd" />
        </svg>
        {!state.awaitingClick && <div className="TourGuide-backdrop" onclick={this.onbackdropclick.bind(this)} />}

        <div
          className="TourGuide-popover"
          role="dialog"
          tabindex="-1"
          aria-modal={state.awaitingClick ? 'false' : 'true'}
          aria-labelledby={this.titleId}
        >
          <span className="TourGuide-arrow" aria-hidden="true" />
          {this.items().toArray()}
        </div>
      </div>
    );
  }

  items(): ItemList<Mithril.Children> {
    const items = new ItemList<Mithril.Children>();
    const state = this.attrs.state;
    const step = state.current;

    if (!step) return items;

    if (state.preview) {
      items.add('preview', <div className="TourGuide-preview">{app.translator.trans('datlechin-simple-tour-guide.forum.preview_notice')}</div>, 110);
    }

    items.add(
      'content',
      // The dialog stays put between steps, so this is what tells a screen reader the words changed.
      <div className="TourGuide-content" aria-live="polite">
        <h3 className="TourGuide-title" id={this.titleId}>
          {step.localizedTitle()}
        </h3>
        {/* Rendered by the forum's formatter from what an admin wrote, the same trust as the custom header and footer. */}
        <div className="TourGuide-description">{m.trust(step.descriptionHtml())}</div>
      </div>,
      100
    );

    if (this.allowClose()) {
      items.add(
        'close',
        <Button
          className="Button Button--icon Button--link TourGuide-close"
          icon="fas fa-xmark"
          aria-label={extractText(app.translator.trans('datlechin-simple-tour-guide.forum.close_button'))}
          onclick={() => state.end('dismissed')}
        />,
        90
      );
    }

    if (this.showProgress() && state.total > 1) {
      items.add(
        'progressBar',
        <div className="TourGuide-progressBar" role="presentation">
          <span className="TourGuide-progressBar-fill" style={{ width: `${(state.number / state.total) * 100}%` }} />
        </div>,
        20
      );
    }

    items.add(
      'footer',
      <div className="TourGuide-footer">
        {this.showProgress() && state.total > 1 && (
          <span className="TourGuide-progress">
            {app.translator.trans('datlechin-simple-tour-guide.forum.progress', { current: state.number, total: state.total })}
          </span>
        )}
        <div className="TourGuide-controls">{this.controls().toArray()}</div>
      </div>,
      0
    );

    return items;
  }

  controls(): ItemList<Mithril.Children> {
    const items = new ItemList<Mithril.Children>();
    const state = this.attrs.state;

    if (state.hasPrevious) {
      items.add(
        'previous',
        <Button className="Button Button--link TourGuide-previous" onclick={() => state.previous()}>
          {app.translator.trans('datlechin-simple-tour-guide.forum.previous_button')}
        </Button>,
        10
      );
    }

    if (state.awaitingClick) {
      items.add(
        'awaitingClick',
        <span className="TourGuide-hint">
          <Icon name="fas fa-hand-pointer" />
          {app.translator.trans('datlechin-simple-tour-guide.forum.click_to_continue')}
        </span>,
        0
      );

      return items;
    }

    items.add(
      'next',
      <Button className="Button Button--primary TourGuide-next" onclick={() => state.next()}>
        {state.isLast
          ? app.translator.trans('datlechin-simple-tour-guide.forum.done_button')
          : app.translator.trans('datlechin-simple-tour-guide.forum.next_button')}
      </Button>,
      0
    );

    return items;
  }

  onbeforeupdate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): boolean {
    super.onbeforeupdate(vnode);

    this.attrs.state.sync();

    return true;
  }

  oncreate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void {
    super.oncreate(vnode);

    this.popover = this.element.querySelector('.TourGuide-popover');
    this.arrow = this.element.querySelector('.TourGuide-arrow');
    this.cutout = this.element.querySelector('.TourGuide-spotlight path');

    if (this.popover) {
      this.trap = createFocusTrap(this.popover, {
        escapeDeactivates: false,
        allowOutsideClick: true,
        initialFocus: () => this.popover!.querySelector<HTMLElement>('.TourGuide-next') ?? this.popover!,
        fallbackFocus: () => this.popover!,
      });

      this.trap.activate();
    }

    window.addEventListener('click', this.onclickcapture, true);

    if (this.allowClose()) {
      if ('CloseWatcher' in window) {
        this.closeWatcher = new CloseWatcher();
        this.closeWatcher.onclose = () => this.dismiss();
      } else {
        document.addEventListener('keydown', this.onkeydown);
      }
    }

    this.stepShown();
    this.tick();
  }

  onupdate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void {
    super.onupdate(vnode);

    const { current, element } = this.attrs.state;

    if (current !== this.shown.step || element !== this.shown.element) this.stepShown();

    // Before this frame paints, not on the next tick, so a new step never shows at the old spot.
    this.geometry = '';
    this.reposition();
  }

  onremove(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void {
    super.onremove(vnode);

    if (this.frame !== null) cancelAnimationFrame(this.frame);

    window.removeEventListener('click', this.onclickcapture, true);
    document.removeEventListener('keydown', this.onkeydown);

    this.closeWatcher?.destroy();
    this.trap?.deactivate();
  }

  protected showProgress(): boolean {
    return !!app.forum.attribute<boolean>('datlechin-simple-tour-guide.showProgress');
  }

  protected allowClose(): boolean {
    return !!app.forum.attribute<boolean>('datlechin-simple-tour-guide.allowClose');
  }

  protected dismiss(): void {
    this.attrs.state.end('dismissed');

    m.redraw();
  }

  protected onbackdropclick(): void {
    if (this.allowClose()) this.attrs.state.end('dismissed');
  }

  // Bootstrap closes every open menu on a document click, including the one a step points into. Links and the click that ends the tour go through.
  protected contain(event: MouseEvent): void {
    if (!this.attrs.state.ended && !(event.target as Element).closest('a[href]')) {
      event.stopPropagation();
    }
  }

  private onclickcapture = (event: MouseEvent): void => {
    const state = this.attrs.state;

    if (state.awaitingClick && state.element?.contains(event.target as Node)) {
      state.clicked();
    }
  };

  private onkeydown = (event: KeyboardEvent): void => {
    // A menu that took the Escape closes first, and the tour stays.
    if (event.key === 'Escape' && !event.defaultPrevented) {
      event.preventDefault();
      this.dismiss();
    }
  };

  private stepShown(): void {
    const { current, element, awaitingClick } = this.attrs.state;

    this.shown = { step: current, element };

    if (element) revealTarget(element);

    // On a click-to-continue step the keyboard has to reach the element too.
    this.trap?.updateContainerElements(awaitingClick && element ? [this.popover!, element] : this.popover!);
  }

  private tick = (): void => {
    this.reposition();

    this.frame = requestAnimationFrame(this.tick);
  };

  private reposition(): void {
    if (!this.popover || !this.arrow || !this.cutout) return;

    const state = this.attrs.state;

    // Gone between redraws: the next redraw resolves the target again.
    if (state.element && !isPresent(state.element)) {
      state.element = null;
      m.redraw();
    }

    const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
    const popover = { width: this.popover.offsetWidth, height: this.popover.offsetHeight };
    const rect = state.element?.getBoundingClientRect() ?? null;
    const step = state.current;
    const sheet = isPhone();

    const signature = [
      rect?.top,
      rect?.left,
      rect?.width,
      rect?.height,
      viewport.width,
      viewport.height,
      popover.width,
      popover.height,
      step?.placement(),
      sheet,
    ].join('/');

    if (signature === this.geometry) return;

    this.geometry = signature;

    const spotlight = rect
      ? {
          top: rect.top - SPOTLIGHT_PADDING,
          left: rect.left - SPOTLIGHT_PADDING,
          width: rect.width + SPOTLIGHT_PADDING * 2,
          height: rect.height + SPOTLIGHT_PADDING * 2,
        }
      : null;

    this.cutout.setAttribute('d', spotlightPath(viewport, spotlight, SPOTLIGHT_RADIUS));

    // A phone has no room beside the element, so the popover is a sheet across the bottom.
    if (sheet) {
      this.popover.style.transform = '';
      this.popover.dataset.side = 'sheet';

      return;
    }

    const placement = step?.placement();
    const preferred = (placement && placement !== 'auto' ? placement : 'bottom') as Exclude<TourSide, 'center'>;
    const position = computePlacement(spotlight, popover, viewport, preferred);

    this.popover.style.transform = `translate3d(${Math.round(position.left)}px, ${Math.round(position.top)}px, 0)`;
    this.popover.dataset.side = position.side;

    const alongTheTop = position.side === 'top' || position.side === 'bottom';

    this.arrow.style.left = alongTheTop ? `${Math.round(position.arrowOffset)}px` : '';
    this.arrow.style.top = alongTheTop ? '' : `${Math.round(position.arrowOffset)}px`;
  }
}
