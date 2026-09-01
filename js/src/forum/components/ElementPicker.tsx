import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import type Mithril from 'mithril';

import generateSelector, { matchCount } from '../utils/generateSelector';

export interface ElementPickerAttrs extends ComponentAttrs {
  /** 'pick' captures an element, 'test' just shows what a selector matches. */
  mode: 'pick' | 'test';
  /** The selector to show matches for, in 'test' mode. */
  selector?: string | null;
}

/**
 * Point-and-click selector capture, opened by the admin area in a second
 * window.
 *
 * Typing a CSS selector by hand is the worst part of writing a tour: you have
 * to know the markup, and you find out you got it wrong later, silently, when
 * a step fails to appear.
 */
export default class ElementPicker<CustomAttrs extends ElementPickerAttrs = ElementPickerAttrs> extends Component<CustomAttrs> {
  private hovered: Element | null = null;
  private selector: string | null = null;
  private matches = 0;

  /**
   * While paused the forum behaves normally, so the admin can navigate to the
   * page their step is about. Without it the picker could only ever capture
   * something on whichever page it opened on, since it swallows every click.
   */
  private paused = false;

  view(): Mithril.Children {
    const testing = this.attrs.mode === 'test';

    return (
      <div className="TourPicker" role="dialog" aria-label={this.label()}>
        <div className="TourPicker-outline" />

        <div className="TourPicker-bar">
          <Icon name={testing ? 'fas fa-eye' : 'fas fa-crosshairs'} className="TourPicker-bar-icon" />

          <div className="TourPicker-bar-body">
            <div className="TourPicker-bar-title">{this.label()}</div>
            <code className="TourPicker-bar-selector">
              {this.selector ?? app.translator.trans('datlechin-simple-tour-guide.forum.picker.nothing_yet')}
            </code>
          </div>

          {!!this.selector && (
            <span className="TourPicker-bar-matches">
              {app.translator.trans('datlechin-simple-tour-guide.forum.picker.matches', { count: this.matches })}
            </span>
          )}

          {!testing && (
            <Button className="Button Button--link" icon={this.paused ? 'fas fa-crosshairs' : 'fas fa-hand'} onclick={() => this.togglePause()}>
              {this.paused
                ? app.translator.trans('datlechin-simple-tour-guide.forum.picker.resume')
                : app.translator.trans('datlechin-simple-tour-guide.forum.picker.browse')}
            </Button>
          )}

          <Button className="Button Button--link" onclick={() => window.close()}>
            {app.translator.trans('datlechin-simple-tour-guide.forum.picker.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  oncreate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void {
    super.oncreate(vnode);

    document.body.classList.add('TourPicker-active');

    if (this.attrs.mode === 'test') {
      this.selector = this.attrs.selector ?? null;
      this.matches = this.selector ? matchCount(this.selector) : 0;

      // Nothing to hunt for, so show what the selector already picks out.
      requestAnimationFrame(() => this.outlineFirstMatch());

      return;
    }

    document.addEventListener('mousemove', this.onmousemove, true);
    document.addEventListener('click', this.onclick, true);
    document.addEventListener('keydown', this.onkeydown, true);
  }

  onremove(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void {
    super.onremove(vnode);

    document.body.classList.remove('TourPicker-active');
    document.removeEventListener('mousemove', this.onmousemove, true);
    document.removeEventListener('click', this.onclick, true);
    document.removeEventListener('keydown', this.onkeydown, true);
  }

  protected label(): string {
    const key = this.attrs.mode === 'test' ? 'testing' : 'picking';

    return String(app.translator.trans(`datlechin-simple-tour-guide.forum.picker.${key}`, {}, true));
  }

  protected togglePause(): void {
    this.paused = !this.paused;

    if (this.paused) {
      this.hideOutline();
      this.hovered = null;
    }
  }

  private onmousemove = (event: MouseEvent): void => {
    if (this.paused) return;

    const target = event.target as Element | null;

    // The picker's own chrome is not part of the forum being pointed at.
    if (!target || target.closest('.TourPicker')) return;

    if (target === this.hovered) return;

    this.hovered = target;
    this.selector = generateSelector(target);
    this.matches = this.selector ? matchCount(this.selector) : 0;

    this.outline(target.getBoundingClientRect());

    m.redraw();
  };

  private onclick = (event: MouseEvent): void => {
    const target = event.target as Element | null;

    if (this.paused || target?.closest('.TourPicker')) return;

    // The forum underneath is live: without this, picking the search box opens
    // the search, and picking a link navigates away from the page being picked.
    event.preventDefault();
    event.stopPropagation();

    if (!this.selector) return;

    window.opener?.postMessage({ source: 'datlechin-simple-tour-guide', selector: this.selector, matches: this.matches }, window.location.origin);

    window.close();
  };

  private onkeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') window.close();
  };

  private outlineFirstMatch(): void {
    if (!this.selector) return;

    const found = document.querySelector(this.selector);

    if (found) {
      found.scrollIntoView({ block: 'center', behavior: 'smooth' });
      this.outline(found.getBoundingClientRect());
    }

    m.redraw();
  }

  private hideOutline(): void {
    const outline = this.element?.querySelector<HTMLElement>('.TourPicker-outline');

    if (outline) outline.style.opacity = '0';

    m.redraw();
  }

  private outline(rect: DOMRect): void {
    const outline = this.element?.querySelector<HTMLElement>('.TourPicker-outline');

    if (!outline) return;

    outline.style.transform = `translate3d(${Math.round(rect.left)}px, ${Math.round(rect.top)}px, 0)`;
    outline.style.width = `${Math.round(rect.width)}px`;
    outline.style.height = `${Math.round(rect.height)}px`;
    outline.style.opacity = '1';
  }
}
