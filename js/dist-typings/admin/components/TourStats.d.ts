import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import type Tour from '../../common/models/Tour';
export interface TourStatsAttrs extends ComponentAttrs {
    tour: Tour;
}
export default class TourStats<CustomAttrs extends TourStatsAttrs = TourStatsAttrs> extends Component<CustomAttrs> {
    private loading;
    private stats;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    view(): Mithril.Children;
    protected figure(value: number | string, label: Mithril.Children): Mithril.Children;
}
