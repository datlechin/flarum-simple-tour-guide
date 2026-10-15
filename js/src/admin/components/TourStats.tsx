import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import type Mithril from 'mithril';

import type Tour from '../../common/models/Tour';
import { fetchStats } from '../utils/tourApi';
import type { Stats } from '../utils/tourApi';

export interface TourStatsAttrs extends ComponentAttrs {
  tour: Tour;
}

export default class TourStats<CustomAttrs extends TourStatsAttrs = TourStatsAttrs> extends Component<CustomAttrs> {
  private loading = true;
  private stats: Stats | null = null;

  oninit(vnode: Mithril.Vnode<CustomAttrs, this>) {
    super.oninit(vnode);

    fetchStats(this.attrs.tour)
      .then((stats) => (this.stats = stats))
      .finally(() => {
        this.loading = false;

        m.redraw();
      });
  }

  view(): Mithril.Children {
    if (this.loading) return <LoadingIndicator display="inline" size="small" />;

    const stats = this.stats;

    if (!stats?.total) {
      return <p className="TourStats-empty">{app.translator.trans('datlechin-simple-tour-guide.admin.stats.none')}</p>;
    }

    const worst = Math.max(1, ...stats.steps.map((step) => step.abandoned));

    return (
      <div className="TourStats">
        <div className="TourStats-figures">
          {this.figure(stats.total, app.translator.trans('datlechin-simple-tour-guide.admin.stats.taken'))}
          {this.figure(stats.finished, app.translator.trans('datlechin-simple-tour-guide.admin.stats.finished'))}
          {this.figure(stats.dismissed, app.translator.trans('datlechin-simple-tour-guide.admin.stats.dismissed'))}
          {this.figure(
            `${Math.round((stats.finished / stats.total) * 100)}%`,
            app.translator.trans('datlechin-simple-tour-guide.admin.stats.completion_rate')
          )}
        </div>

        {!!stats.dismissed && (
          <div className="TourStats-dropoff">
            <label>{app.translator.trans('datlechin-simple-tour-guide.admin.stats.dropoff_heading')}</label>
            <div className="helpText">{app.translator.trans('datlechin-simple-tour-guide.admin.stats.dropoff_help')}</div>

            <ol className="TourStats-steps">
              {stats.steps.map((step) => (
                <li className="TourStats-step">
                  <span className="TourStats-step-title">{step.title}</span>
                  <span className="TourStats-step-bar" role="presentation">
                    <span className="TourStats-step-bar-fill" style={{ width: `${(step.abandoned / worst) * 100}%` }} />
                  </span>
                  <span className="TourStats-step-count">{step.abandoned}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  }

  protected figure(value: number | string, label: Mithril.Children): Mithril.Children {
    return (
      <div className="TourStats-figure">
        <span className="TourStats-figure-value">{value}</span>
        <span className="TourStats-figure-label">{label}</span>
      </div>
    );
  }
}
