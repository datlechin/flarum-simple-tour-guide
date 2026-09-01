import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import type Tour from '../../common/models/Tour';
export interface TourStatsAttrs extends ComponentAttrs {
    tour: Tour;
}
/**
 * How a tour is doing: how many people finished it, and which step loses them.
 */
export default class TourStats<CustomAttrs extends TourStatsAttrs = TourStatsAttrs> extends Component<CustomAttrs> {
    private loading;
    private stats;
    private loadedFor;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    /**
     * The admin selects another tour and this same component is handed it, so
     * the reload belongs here rather than in `view`, which should only ever
     * describe what is already known.
     */
    onbeforeupdate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    view(): Mithril.Children;
    protected figure(value: number | string, key: string): Mithril.Children;
    /**
     * Loads on first view, and again whenever the admin selects another tour,
     * since the component is reused rather than remade.
     */
    protected load(): void;
}
