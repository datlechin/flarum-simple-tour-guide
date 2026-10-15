import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import type Mithril from 'mithril';

import type Tour from '../../common/models/Tour';
import loadTours from '../loadTours';
import { leadTo, requestTour, startRequested } from '../pendingTour';

export default class TourSettings<CustomAttrs extends ComponentAttrs = ComponentAttrs> extends Component<CustomAttrs> {
  private loading = true;
  private tours: Tour[] = [];

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
            <span className="TourSettingsList-title">{tour.title()}</span>
            <Button className="Button Button--link" onclick={() => this.take(tour)}>
              {tour.completion()
                ? app.translator.trans('datlechin-simple-tour-guide.forum.settings.take_again')
                : app.translator.trans('datlechin-simple-tour-guide.forum.settings.take')}
            </Button>
          </li>
        ))}
      </ul>
    );
  }

  protected take(tour: Tour): void {
    const waiting = app.translator.trans('datlechin-simple-tour-guide.forum.go_to_page', { title: tour.title() });

    if (leadTo(tour.route(), waiting)) {
      startRequested(tour);
    } else {
      requestTour(tour.key());
    }
  }
}
