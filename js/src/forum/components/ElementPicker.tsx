import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import extractText from 'flarum/common/utils/extractText';
import type PageState from 'flarum/common/states/PageState';
import type Mithril from 'mithril';

import generateSelector, { matchCount } from '../utils/generateSelector';
import { goToRoute } from '../utils/route';
import type { RouteAccess } from '../utils/route';

export interface ElementPickerAttrs extends ComponentAttrs {
  mode: 'pick' | 'test';
  selector: string | null;
  route: string | null;
}

export default class ElementPicker<CustomAttrs extends ElementPickerAttrs = ElementPickerAttrs> extends Component<CustomAttrs> {
  private access: RouteAccess = 'here';
  private hovered: Element | null = null;
  private selector: string | null = null;
  private matches = 0;
  private outlineElement: HTMLElement | null = null;
  private testedOn: PageState | null = null;

  // While paused the forum behaves normally, so the admin can browse to the step's page.
  private paused = false;

  oninit(vnode: Mithril.Vnode<CustomAttrs, this>) {
    super.oninit(vnode);

    this.access = goToRoute(this.attrs.route);
    this.paused = this.access === 'param';
  }

  view(): Mithril.Children {
    const testing = this.attrs.mode === 'test';

    return (
      <div className="TourPicker" role="dialog" aria-label={this.label()}>
        <div className="TourPicker-outline" />

        <div className="TourPicker-bar">
          <Icon name={testing ? 'fas fa-eye' : 'fas fa-crosshairs'} className="TourPicker-bar-icon" />

          <div className="TourPicker-bar-body">
            <div className="TourPicker-bar-title">{this.notice() ?? this.label()}</div>
            <code className="TourPicker-bar-selector">
              {this.selector ?? app.translator.trans('datlechin-simple-tour-guide.forum.picker.nothing_yet')}
            </code>
          </div>

          {!!this.selector && (
            <span className="TourPicker-bar-matches">
              {app.translator.trans('datlechin-simple-tour-guide.forum.picker.matches', { count: this.matches })}
            </span>
          )}

          <Button className="Button Button--link" icon={this.paused ? 'fas fa-crosshairs' : 'fas fa-hand'} onclick={() => this.togglePause()}>
            {!this.paused
              ? app.translator.trans('datlechin-simple-tour-guide.forum.picker.browse')
              : testing
              ? app.translator.trans('datlechin-simple-tour-guide.forum.picker.show')
              : app.translator.trans('datlechin-simple-tour-guide.forum.picker.resume')}
          </Button>

          <Button className="Button Button--link" onclick={() => window.close()}>
            {app.translator.trans('datlechin-simple-tour-guide.forum.picker.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  oncreate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void {
    super.oncreate(vnode);

    this.outlineElement = this.element.querySelector('.TourPicker-outline');

    document.body.classList.add('TourPicker-active');
    document.addEventListener('mousemove', this.onmousemove, true);
    document.addEventListener('click', this.onclick, true);
    document.addEventListener('keydown', this.onkeydown, true);

    if (this.attrs.mode === 'test' && !this.paused) this.showSelector();
  }

  // Leading to the tour's page is asynchronous, so a test runs again once that page has rendered.
  onupdate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void {
    super.onupdate(vnode);

    if (this.attrs.mode === 'test' && !this.paused && this.testedOn !== app.current) this.showSelector();
  }

  onremove(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void {
    super.onremove(vnode);

    document.body.classList.remove('TourPicker-active');
    document.removeEventListener('mousemove', this.onmousemove, true);
    document.removeEventListener('click', this.onclick, true);
    document.removeEventListener('keydown', this.onkeydown, true);
  }

  protected label(): string {
    return extractText(
      this.attrs.mode === 'test'
        ? app.translator.trans('datlechin-simple-tour-guide.forum.picker.testing')
        : app.translator.trans('datlechin-simple-tour-guide.forum.picker.picking')
    );
  }

  protected notice(): Mithril.Children {
    const route = this.attrs.route;

    if (this.access === 'param' && this.paused) return app.translator.trans('datlechin-simple-tour-guide.forum.picker.go_to_page', { route });
    if (this.access === 'unknown') return app.translator.trans('datlechin-simple-tour-guide.forum.unknown_page', { route });

    return null;
  }

  protected togglePause(): void {
    this.paused = !this.paused;
    this.hovered = null;

    if (this.paused) {
      this.hideOutline();
    } else if (this.attrs.mode === 'test') {
      this.showSelector();
    }
  }

  protected showSelector(): void {
    this.testedOn = app.current;
    this.select(this.attrs.selector);

    const found = this.selector ? document.querySelector(this.selector) : null;

    if (found) {
      found.scrollIntoView({ block: 'center' });
      this.outline(found.getBoundingClientRect());
    }

    m.redraw();
  }

  private onmousemove = (event: MouseEvent): void => {
    const target = event.target as Element | null;

    if (this.paused || this.attrs.mode === 'test' || !target || target.closest('.TourPicker') || target === this.hovered) return;

    this.hovered = target;
    this.select(generateSelector(target));
    this.outline(target.getBoundingClientRect());

    m.redraw();
  };

  private onclick = (event: MouseEvent): void => {
    const target = event.target as Element | null;

    if (this.paused || !target || target.closest('.TourPicker')) return;

    // The forum underneath is live: picking a link would follow it, picking the search box would open it.
    event.preventDefault();
    event.stopPropagation();

    if (this.attrs.mode === 'test') return;

    const selector = generateSelector(target);

    if (!selector) return;

    window.opener?.postMessage({ selector, route: app.current.get('routeName') ?? null }, window.location.origin);
    window.close();
  };

  private onkeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') window.close();
  };

  private select(selector: string | null): void {
    this.selector = selector;
    this.matches = matchCount(selector ?? '');
  }

  private hideOutline(): void {
    if (this.outlineElement) this.outlineElement.style.opacity = '0';
  }

  private outline(rect: DOMRect): void {
    const outline = this.outlineElement;

    if (!outline) return;

    outline.style.transform = `translate3d(${Math.round(rect.left)}px, ${Math.round(rect.top)}px, 0)`;
    outline.style.width = `${Math.round(rect.width)}px`;
    outline.style.height = `${Math.round(rect.height)}px`;
    outline.style.opacity = '1';
  }
}
