import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';
import type TourState from '../states/TourState';
export interface TourGuideAttrs extends ComponentAttrs {
    state: TourState;
}
export default class TourGuide<CustomAttrs extends TourGuideAttrs = TourGuideAttrs> extends Component<CustomAttrs> {
    private titleId;
    private popover;
    private arrow;
    private cutout;
    private frame;
    private trap;
    private closeWatcher;
    private shown;
    private geometry;
    view(): Mithril.Children;
    items(): ItemList<Mithril.Children>;
    controls(): ItemList<Mithril.Children>;
    onbeforeupdate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): boolean;
    oncreate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    onupdate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    onremove(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    protected showProgress(): boolean;
    protected allowClose(): boolean;
    protected dismiss(): void;
    protected onbackdropclick(): void;
    protected contain(event: MouseEvent): void;
    private onclickcapture;
    private onkeydown;
    private stepShown;
    private tick;
    private reposition;
}
