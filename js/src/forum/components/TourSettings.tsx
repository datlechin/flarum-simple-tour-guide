import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import type Mithril from 'mithril';

import loadTours, { resetTours } from '../loadTours';
import { canNavigateTo, requestTour } from '../pendingTour';
import showTour from '../showTour';
import type { TourData } from '../types';

/**
 * The member's own list of tours, on their settings page.
 *
 * Until now the only way back into a tour was to ask a moderator to reset it,
 * which is a lot of ceremony for "show me that again".
 */
export default class TourSettings<CustomAttrs extends ComponentAttrs = ComponentAttrs> extends Component<CustomAttrs> {
  private loading = true;
  private tours: TourData[] = [];

  oninit(vnode: Mithril.Vnode<CustomAttrs, this>) {
    super.oninit(vnode);

    loadTours().then((tours) => {
      this.tours = tours;
      this.loading = false;

      m.redraw();
    });
  }

  view(): Mithril.Children {
    if (this.loading) return <LoadingIndicator display="inline" size="small" />;

    if (!this.tours.length) {
      return <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.forum.settings.none')}</div>;
    }

    return (
      <ul className="TourSettingsList">
        {this.tours.map((tour) => (
          <li className="TourSettingsList-item">
            <span className="TourSettingsList-title">{tour.title}</span>
            <Button className="Button Button--link" onclick={() => this.take(tour)}>
              {tour.completed
                ? app.translator.trans('datlechin-simple-tour-guide.forum.settings.take_again')
                : app.translator.trans('datlechin-simple-tour-guide.forum.settings.take')}
            </Button>
          </li>
        ))}
      </ul>
    );
  }

  /**
   * Starting a tour the member has already been through means forgetting they
   * took it first, or the tour would mark itself done again over a record that
   * already says so and nothing would change.
   */
  protected take(tour: TourData): void {
    const actorId = app.session.user?.id();

    const start = () => {
      // A tour belongs to a page, and the settings page is rarely that page.
      // Rather than opening a tour with nothing to point at, go where it lives
      // and let it start on arrival.
      if (tour.route && tour.route !== app.current.get('routeName')) {
        requestTour(tour.key);

        if (canNavigateTo(tour.route)) {
          m.route.set(app.route(tour.route));
        } else {
          // Routes like `discussion` need to know which one, so the member
          // picks. The request waits until they get there.
          app.alerts.show({ type: 'info' }, app.translator.trans('datlechin-simple-tour-guide.forum.settings.waiting', { title: tour.title }));
        }

        return;
      }

      const state = showTour({ ...tour, completed: false });

      if (!state) {
        app.alerts.show({ type: 'warning' }, app.translator.trans('datlechin-simple-tour-guide.forum.settings.nothing_here', { title: tour.title }));
      }
    };

    if (!tour.completed || !actorId) {
      start();

      return;
    }

    resetTours(actorId, tour.key).then(() => {
      tour.completed = false;
      start();
    });
  }
}
