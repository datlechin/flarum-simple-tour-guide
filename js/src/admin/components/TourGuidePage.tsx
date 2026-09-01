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
import EditTourModal from './EditTourModal';
import TourStats from './TourStats';
import TourStepList from './TourStepList';

/** Named off core's wrapper, so sortablejs stays core's dependency. */
type Sortable = typeof import('flarum/admin/utils/loadSortable')['default'];

/**
 * Where to open a preview for each of Flarum's routes that can be reached
 * without naming a particular discussion or member.
 */
const ROUTE_PATHS: Record<string, string> = {
  index: '/',
  posts: '/posts',
  settings: '/settings',
  notifications: '/notifications',
};

/**
 * Everything an admin does with tours, on one page: the tours themselves, the
 * steps of whichever is selected, how it is doing, and the two settings that
 * apply to all of them.
 */
export default class TourGuidePage<CustomAttrs extends ExtensionPageAttrs = ExtensionPageAttrs> extends ExtensionPage<CustomAttrs> {
  private loadingTours = true;
  private selectedId: string | null = null;
  private sortable: Sortable | null = null;
  private listKey = 0;

  oninit(vnode: Mithril.Vnode<CustomAttrs, this>) {
    super.oninit(vnode);

    Promise.all([
      app.store.find<Tour[]>('tour-guide-tours', { include: 'steps' }),
      app.store.find('groups'),
      import('flarum/admin/utils/loadSortable'),
    ]).then(([tours, , sortable]) => {
      this.sortable = sortable.default;
      this.loadingTours = false;
      this.selectedId ??= tours[0]?.id() ?? null;

      m.redraw();
    });
  }

  content() {
    return (
      <div className="ExtensionPage-settings TourGuidePage">
        <div className="container">
          {/* Two groups rather than one: core caps a section at 400px and
              shrinks it to share a row, so four abreast leaves none of them
              readable. Managing a tour on top, watching it underneath. */}
          <FormSectionGroup>
            <FormSection label={app.translator.trans('datlechin-simple-tour-guide.admin.tours.heading')}>
              {this.loadingTours ? <LoadingIndicator /> : this.tourList()}
            </FormSection>

            {this.steps()}
          </FormSectionGroup>

          <FormSectionGroup>
            {this.stats()}

            <FormSection label={app.translator.trans('datlechin-simple-tour-guide.admin.settings.heading')}>
              <Form>
                {this.settingFields()}
                <div className="Form-group Form-controls">{this.submitButton()}</div>
              </Form>
            </FormSection>
          </FormSectionGroup>
        </div>
      </div>
    );
  }

  /**
   * Built from what the extension registered, so the switches here and the
   * ones admin search finds can never describe different things.
   */
  protected settingFields(): Mithril.Children {
    return (app.registry.getSettings(this.extension.id) ?? []).map(this.buildSettingComponent.bind(this));
  }

  protected tourList(): Mithril.Children {
    const tours = this.tours();

    return (
      <div key={this.listKey} oncreate={this.onlistcreate.bind(this)}>
        {tours.length ? (
          <ol className="TourList">{tours.map(this.tourItem.bind(this))}</ol>
        ) : (
          <p className="TourList-empty">{app.translator.trans('datlechin-simple-tour-guide.admin.tours.none')}</p>
        )}

        <div className="TourList-actions">
          <Button className="Button Button--dashed" icon="fas fa-plus" onclick={() => app.modal.show(EditTourModal)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.tours.add_button')}
          </Button>
          <Button className="Button" icon="fas fa-file-import" onclick={this.importTour.bind(this)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.tours.import_button')}
          </Button>
        </div>
      </div>
    );
  }

  protected tourItem(tour: Tour): Mithril.Children {
    const selected = tour.id() === this.selectedId;

    return (
      <li className={classList('TourListItem', { 'TourListItem--selected': selected, 'TourListItem--off': !tour.isEnabled() })} data-id={tour.id()}>
        <span className="TourListItem-handle" aria-hidden="true">
          <Icon name="fas fa-grip-vertical" />
        </span>

        <button type="button" className="TourListItem-main" onclick={() => (this.selectedId = tour.id() ?? null)} aria-current={selected}>
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
          {/* Dragging is not something a keyboard can do, so the order has to
              be reachable another way. */}
          <Button icon="fas fa-arrow-up" disabled={this.tours()[0] === tour} onclick={() => this.move(tour, -1)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.move_up')}
          </Button>
          <Button icon="fas fa-arrow-down" disabled={this.tours().slice(-1)[0] === tour} onclick={() => this.move(tour, 1)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.move_down')}
          </Button>
          <Button icon="fas fa-play" onclick={() => this.preview(tour)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.tours.preview_button')}
          </Button>
          <Button icon="fas fa-clone" onclick={() => this.duplicate(tour)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.tours.duplicate_button')}
          </Button>
          <Button icon="fas fa-file-export" onclick={() => this.exportTour(tour)}>
            {app.translator.trans('datlechin-simple-tour-guide.admin.tours.export_button')}
          </Button>
        </Dropdown>
      </li>
    );
  }

  /**
   * The one line under a tour's name that says how it behaves, in the order
   * somebody scanning the list would ask: how big, when, where.
   */
  protected meta(tour: Tour): Mithril.Children {
    const parts: Mithril.Children[] = [
      app.translator.trans('datlechin-simple-tour-guide.admin.tours.step_count', { count: tour.stepCount() ?? 0 }),
      tour.startMode() === 'auto'
        ? app.translator.trans('datlechin-simple-tour-guide.admin.start_mode.auto')
        : app.translator.trans('datlechin-simple-tour-guide.admin.start_mode.manual'),
    ];

    if (tour.route()) parts.push(tour.route());
    if (!tour.isEnabled()) parts.push(app.translator.trans('datlechin-simple-tour-guide.admin.tours.disabled'));

    // Switched on with nothing to show is the one state that reads as fine in
    // the list and does nothing on the forum.
    if (tour.isEnabled() && !tour.stepCount()) {
      parts.push(
        <span className="TourListItem-warning">
          <Icon name="fas fa-triangle-exclamation" />
          {app.translator.trans('datlechin-simple-tour-guide.admin.tours.no_steps_warning')}
        </span>
      );
    }

    return parts.map((part, index) => (index ? [' · ', part] : part));
  }

  protected steps(): Mithril.Children {
    const tour = this.selected();

    if (!tour) return null;

    return (
      <FormSection label={app.translator.trans('datlechin-simple-tour-guide.admin.steps.heading', { title: tour.title() })}>
        <TourStepList tour={tour} />
      </FormSection>
    );
  }

  protected stats(): Mithril.Children {
    const tour = this.selected();

    if (!tour) return null;

    return (
      <FormSection label={app.translator.trans('datlechin-simple-tour-guide.admin.stats.heading')}>
        <TourStats tour={tour} />
      </FormSection>
    );
  }

  protected tours(): Tour[] {
    return app.store.all<Tour>('tour-guide-tours').sort((a, b) => a.position() - b.position());
  }

  protected selected(): Tour | null {
    return this.selectedId ? app.store.getById<Tour>('tour-guide-tours', this.selectedId) ?? null : null;
  }

  /**
   * Opens the forum with the tour running, whether or not it is enabled and
   * whether or not this admin has already been through it. Nothing is recorded.
   */
  protected preview(tour: Tour): void {
    const url = new URL(app.forum.attribute<string>('baseUrl'));

    url.searchParams.set('tour-preview', tour.key());

    // A tour bound to a page has nothing to show anywhere else, so the preview
    // opens on that page where it can. Where it cannot, because the route needs
    // to know which discussion or which member, the forum holds the preview
    // until the admin navigates there.
    const path = ROUTE_PATHS[tour.route() ?? ''];

    if (path) url.pathname = path;

    window.open(url.toString(), '_blank', 'noopener');

    if (tour.route() && !path) {
      app.alerts.show({ type: 'info' }, app.translator.trans('datlechin-simple-tour-guide.admin.tours.preview_navigate', { route: tour.route() }));
    }
  }

  /**
   * Shift a tour one place, and save the whole order the same way a drag does.
   */
  protected move(tour: Tour, delta: number): void {
    const tours = this.tours();
    const from = tours.indexOf(tour);
    const to = from + delta;

    if (from < 0 || to < 0 || to >= tours.length) return;

    tours.splice(to, 0, ...tours.splice(from, 1));

    this.saveOrder(tours.map((moved) => moved.id()!));
  }

  protected duplicate(tour: Tour): void {
    app
      .request({
        method: 'POST',
        url: `${app.forum.attribute('apiUrl')}/tour-guide-tours/${tour.id()}/duplicate`,
      })
      .then(async () => {
        await app.store.find<Tour[]>('tour-guide-tours', { include: 'steps' });

        this.listKey++;

        m.redraw();
      });
  }

  protected exportTour(tour: Tour): void {
    app
      .request<Record<string, unknown>>({
        method: 'GET',
        url: `${app.forum.attribute('apiUrl')}/tour-guide-tours/${tour.id()}/export`,
      })
      .then((document) => {
        const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
        const link = window.document.createElement('a');

        link.href = URL.createObjectURL(blob);
        link.download = `tour-${tour.key()}.json`;
        link.click();

        URL.revokeObjectURL(link.href);
      });
  }

  protected importTour(): void {
    const input = window.document.createElement('input');

    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) return;

      let body: unknown;

      try {
        body = JSON.parse(await file.text());
      } catch {
        app.alerts.show({ type: 'error' }, app.translator.trans('datlechin-simple-tour-guide.admin.tours.import_invalid'));

        return;
      }

      app
        .request({
          method: 'POST',
          url: `${app.forum.attribute('apiUrl')}/tour-guide-tours/import`,
          body,
        })
        .then(async () => {
          await app.store.find<Tour[]>('tour-guide-tours', { include: 'steps' });

          this.listKey++;

          app.alerts.show({ type: 'success' }, app.translator.trans('datlechin-simple-tour-guide.admin.tours.import_done'));

          m.redraw();
        });
    };

    input.click();
  }

  protected onlistcreate(vnode: Mithril.VnodeDOM): void {
    const list = (vnode.dom as HTMLElement).querySelector<HTMLElement>('.TourList');

    if (!list || !this.sortable) return;

    this.sortable.create(list, {
      handle: '.TourListItem-handle',
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
      app.store.getById<Tour>('tour-guide-tours', id)?.pushAttributes({ position });
    });

    app.request({
      url: `${app.forum.attribute('apiUrl')}/tour-guide-tours/order`,
      method: 'POST',
      body: { order },
    });

    this.listKey++;

    m.redraw();
  }
}
