import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import type Tour from '../../common/models/Tour';
export default class TourSettings<CustomAttrs extends ComponentAttrs = ComponentAttrs> extends Component<CustomAttrs> {
    private loading;
    private tours;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    view(): Mithril.Children;
    protected take(tour: Tour): void;
}
