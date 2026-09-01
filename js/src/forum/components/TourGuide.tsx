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
import type { Box, Size, TourSide } from '../utils/computePlacement';
import spotlightPath from '../utils/spotlightPath';
import { isMobile } from '../utils/device';
import { isRendered } from '../utils/target';

export interface TourGuideAttrs extends ComponentAttrs {
  state: TourState;
}

/** Named off the factory, so the focus-trap package stays core's dependency. */
type FocusTrap = ReturnType<typeof createFocusTrap>;

/** Breathing room between the highlighted element and the edge of the cutout. */
const SPOTLIGHT_PADDING = 6;

const SPOTLIGHT_RADIUS = 6;

/**
 * The tour itself: a dimmed page with a hole cut in it around the element the
 * current step is about, and a popover pointing at it.
 *
 * Position is written straight to the DOM on every frame rather than through a
 * redraw, because it has to track a page that scrolls, animates and reflows
 * underneath it, and none of that is state Mithril knows about.
 */
export default class TourGuide<CustomAttrs extends TourGuideAttrs = TourGuideAttrs> extends Component<CustomAttrs> {
  private titleId = generateElementId();

  private popover: HTMLElement | null = null;
  private arrow: HTMLElement | null = null;
  private cutout: SVGPathElement | null = null;
  private panes: HTMLElement[] = [];

  private frame: number | null = null;
  private trap: FocusTrap | null = null;

  /** The element currently wired up to advance the tour when clicked. */
  private awaited: HTMLElement | null = null;

  /** The geometry the popover was last laid out for, so identical frames cost nothing. */
  private geometry = '';

  view(): Mithril.Children {
    const step = this.attrs.state.current;

    if (!step) return null;

    return (
      <div className="TourGuide" role="presentation">
        {/* Two layers, because they do two jobs: the backdrop swallows every
            click on the page underneath, and the cutout above it is only ever
            a picture. */}
        {/* Four panes rather than one clipped box. `clip-path: path()` with a
            fill-rule is not something every browser parses, and when it fails
            it fails silently and the whole page stays covered, which swallows
            the very click a click-to-continue step is waiting for. */}
        <div className="TourGuide-backdrop" onclick={this.onbackdropclick.bind(this)}>
          <span className="TourGuide-backdrop-pane" />
          <span className="TourGuide-backdrop-pane" />
          <span className="TourGuide-backdrop-pane" />
          <span className="TourGuide-backdrop-pane" />
        </div>
        <svg className="TourGuide-spotlight" aria-hidden="true">
          <path fill-rule="evenodd" />
        </svg>

        <div className="TourGuide-popover" role="dialog" aria-modal="true" aria-labelledby={this.titleId}>
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

    if (state.tour.preview) {
      items.add('preview', <div className="TourGuide-preview">{app.translator.trans('datlechin-simple-tour-guide.forum.preview_notice')}</div>, 110);
    }

    items.add(
      'content',
      // The dialog stays put from one step to the next, so a screen reader has
      // no new dialog to announce. This is what tells it the words changed.
      <div className="TourGuide-content" aria-live="polite">
        <h3 className="TourGuide-title" id={this.titleId}>
          {step.title}
        </h3>
        {/* HTML from the forum's own formatter, written by an admin. Flarum
            already trusts admins with the custom header, footer and CSS, so
            this is the same trust boundary, not a new one. */}
        <div className="TourGuide-description">{m.trust(step.description)}</div>
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

    if (!state.isFirst) {
      items.add(
        'previous',
        <Button className="Button Button--link TourGuide-previous" onclick={() => state.previous()}>
          {app.translator.trans('datlechin-simple-tour-guide.forum.previous_button')}
        </Button>,
        10
      );
    }

    // The whole point of this step is the reader doing the thing, so there is
    // no button offering to do it for them.
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
      <Button
        className="Button Button--primary TourGuide-next"
        onclick={() => {
          void state.next();
        }}
      >
        {state.isLast
          ? app.translator.trans('datlechin-simple-tour-guide.forum.done_button')
          : app.translator.trans('datlechin-simple-tour-guide.forum.next_button')}
      </Button>,
      0
    );

    return items;
  }

  oncreate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void {
    super.oncreate(vnode);

    this.popover = this.element.querySelector('.TourGuide-popover');
    this.arrow = this.element.querySelector('.TourGuide-arrow');
    this.cutout = this.element.querySelector('.TourGuide-spotlight path');
    this.panes = Array.from(this.element.querySelectorAll<HTMLElement>('.TourGuide-backdrop-pane'));

    if (this.popover) {
      this.trap = createFocusTrap(this.popover, {
        // Escape is handled here, so that it can respect the forum's setting.
        escapeDeactivates: false,
        // The backdrop is outside the trap and has a job of its own, and on a
        // click-to-continue step so is the highlighted element.
        allowOutsideClick: true,
        initialFocus: '.TourGuide-next',
        fallbackFocus: '.TourGuide-popover',
      });

      this.trap.activate();
    }

    document.addEventListener('keydown', this.onkeydown);

    this.syncAwaitedElement();
    this.tick();
  }

  onupdate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void {
    super.onupdate(vnode);

    // A new step is new geometry even when its element happens to sit exactly
    // where the last one did.
    this.geometry = '';

    this.syncAwaitedElement();
  }

  onremove(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void {
    super.onremove(vnode);

    if (this.frame !== null) cancelAnimationFrame(this.frame);

    document.removeEventListener('keydown', this.onkeydown);

    this.releaseAwaitedElement();

    this.trap?.deactivate();
  }

  protected showProgress(): boolean {
    return !!app.forum.attribute<boolean>('datlechin-simple-tour-guide.showProgress');
  }

  protected allowClose(): boolean {
    return !!app.forum.attribute<boolean>('datlechin-simple-tour-guide.allowClose');
  }

  protected onbackdropclick(): void {
    if (this.allowClose()) this.attrs.state.end('dismissed');
  }

  private onkeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this.allowClose()) return;

    event.preventDefault();

    this.attrs.state.end('dismissed');

    m.redraw();
  };

  /**
   * On a click-to-continue step the tour listens to the element it points at,
   * so the reader's own click is what moves them on.
   */
  private syncAwaitedElement(): void {
    const wanted = this.attrs.state.awaitingClick ? this.attrs.state.element : null;

    if (wanted === this.awaited) return;

    this.releaseAwaitedElement();

    if (wanted) {
      this.awaited = wanted;
      wanted.addEventListener('click', this.onawaitedclick);
    }
  }

  private releaseAwaitedElement(): void {
    this.awaited?.removeEventListener('click', this.onawaitedclick);
    this.awaited = null;
  }

  private onawaitedclick = (): void => {
    void this.attrs.state.next();
  };

  private tick = (): void => {
    this.reposition();

    this.frame = requestAnimationFrame(this.tick);
  };

  /**
   * Cover the viewport with four panes arranged around `hole`, or with one
   * pane over everything when there is no hole.
   */
  private layOutBackdrop(viewport: Size, hole: Box | null): void {
    const [top, bottom, left, right] = this.panes;

    if (!hole) {
      place(top, 0, 0, viewport.width, viewport.height);
      place(bottom, 0, 0, 0, 0);
      place(left, 0, 0, 0, 0);
      place(right, 0, 0, 0, 0);

      return;
    }

    const holeBottom = hole.top + hole.height;
    const holeRight = hole.left + hole.width;

    place(top, 0, 0, viewport.width, hole.top);
    place(bottom, 0, holeBottom, viewport.width, viewport.height - holeBottom);
    place(left, 0, hole.top, hole.left, hole.height);
    place(right, holeRight, hole.top, viewport.width - holeRight, hole.height);
  }

  private reposition(): void {
    if (!this.popover || !this.arrow || !this.cutout || this.panes.length < 4) return;

    const state = this.attrs.state;
    const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
    const popover = { width: this.popover.offsetWidth, height: this.popover.offsetHeight };
    // A target can be taken off the page while the tour is pointing at it. On
    // a click-to-continue step that would leave the reader waiting for a click
    // that can never land, so the step gives up and offers a button instead.
    if (state.element && !isRendered(state.element)) {
      state.forgetElement();
      m.redraw();
    }

    const rect = state.element?.getBoundingClientRect() ?? null;
    const step = state.current;
    const sheet = isMobile();

    const signature = [
      rect?.top,
      rect?.left,
      rect?.width,
      rect?.height,
      viewport.width,
      viewport.height,
      popover.width,
      popover.height,
      step?.placement,
      sheet,
      state.awaitingClick,
    ].join('/');

    if (signature === this.geometry) return;

    this.geometry = signature;

    // A hidden element measures zero, which is not something to cut a hole
    // around; the step falls back to standing on its own.
    const spotlight =
      rect && rect.width > 0 && rect.height > 0
        ? {
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
          }
        : null;

    this.cutout.setAttribute('d', spotlightPath(viewport, spotlight, SPOTLIGHT_RADIUS));

    // A gap in the cover only on a step that is waiting for the reader to click
    // the thing. Every other step keeps the page sealed.
    this.layOutBackdrop(viewport, state.awaitingClick ? spotlight : null);

    // On a phone the popover is a sheet across the bottom of the screen: there
    // is no room to sit beside a target, and nowhere for an arrow to point.
    if (sheet) {
      this.popover.style.transform = '';
      this.popover.dataset.side = 'sheet';

      return;
    }

    const preferred = (step && step.placement !== 'auto' ? step.placement : 'bottom') as Exclude<TourSide, 'center'>;

    const placement = computePlacement(spotlight, popover, viewport, preferred);

    this.popover.style.transform = `translate3d(${Math.round(placement.left)}px, ${Math.round(placement.top)}px, 0)`;
    this.popover.dataset.side = placement.side;

    // Physical offsets, because they come from viewport coordinates that are
    // already the right way round in either reading direction.
    const alongTheTop = placement.side === 'top' || placement.side === 'bottom';

    this.arrow.style.left = alongTheTop ? `${Math.round(placement.arrowOffset)}px` : '';
    this.arrow.style.top = alongTheTop ? '' : `${Math.round(placement.arrowOffset)}px`;
  }
}

function place(pane: HTMLElement, left: number, top: number, width: number, height: number): void {
  pane.style.left = `${Math.round(left)}px`;
  pane.style.top = `${Math.round(top)}px`;
  pane.style.width = `${Math.max(0, Math.round(width))}px`;
  pane.style.height = `${Math.max(0, Math.round(height))}px`;
}
