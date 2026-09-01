import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import type Mithril from 'mithril';

import type Tour from '../../common/models/Tour';

interface Stats {
  finished: number;
  dismissed: number;
  total: number;
  steps: Array<{ id: number; title: string; abandoned: number }>;
}

export interface TourStatsAttrs extends ComponentAttrs {
  tour: Tour;
}

/**
 * How a tour is doing: how many people finished it, and which step loses them.
 */
export default class TourStats<CustomAttrs extends TourStatsAttrs = TourStatsAttrs> extends Component<CustomAttrs> {
  private loading = true;
  private stats: Stats | null = null;
  private loadedFor: string | null = null;

  oninit(vnode: Mithril.Vnode<CustomAttrs, this>) {
    super.oninit(vnode);

    this.load();
  }

  /**
   * The admin selects another tour and this same component is handed it, so
   * the reload belongs here rather than in `view`, which should only ever
   * describe what is already known.
   */
  onbeforeupdate(vnode: Mithril.VnodeDOM<CustomAttrs, this>) {
    super.onbeforeupdate(vnode);

    this.load();
  }

  view(): Mithril.Children {
    if (this.loading) return <LoadingIndicator display="inline" size="small" />;

    const stats = this.stats;

    if (!stats || !stats.total) {
      return <p className="TourStats-empty">{app.translator.trans('datlechin-simple-tour-guide.admin.stats.none')}</p>;
    }

    const rate = Math.round((stats.finished / stats.total) * 100);
    const worst = Math.max(1, ...stats.steps.map((step) => step.abandoned));

    return (
      <div className="TourStats">
        <div className="TourStats-figures">
          {this.figure(stats.total, 'taken')}
          {this.figure(stats.finished, 'finished')}
          {this.figure(stats.dismissed, 'dismissed')}
          {this.figure(`${rate}%`, 'completion_rate')}
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

  protected figure(value: number | string, key: string): Mithril.Children {
    return (
      <div className="TourStats-figure">
        <span className="TourStats-figure-value">{value}</span>
        <span className="TourStats-figure-label">{app.translator.trans(`datlechin-simple-tour-guide.admin.stats.${key}`)}</span>
      </div>
    );
  }

  /**
   * Loads on first view, and again whenever the admin selects another tour,
   * since the component is reused rather than remade.
   */
  protected load(): void {
    const id = this.attrs.tour.id()!;

    if (this.loadedFor === id) return;

    this.loadedFor = id;
    this.loading = true;

    app
      .request<Stats>({
        method: 'GET',
        url: `${app.forum.attribute('apiUrl')}/tour-guide-tours/${id}/stats`,
      })
      .then((stats) => {
        this.stats = stats;
        this.loading = false;

        m.redraw();
      })
      .catch(() => {
        this.loading = false;

        m.redraw();
      });
  }
}
