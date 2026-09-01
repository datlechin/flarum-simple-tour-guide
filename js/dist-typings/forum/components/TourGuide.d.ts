import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';
import type TourState from '../states/TourState';
export interface TourGuideAttrs extends ComponentAttrs {
    state: TourState;
}
/**
 * The tour itself: a dimmed page with a hole cut in it around the element the
 * current step is about, and a popover pointing at it.
 *
 * Position is written straight to the DOM on every frame rather than through a
 * redraw, because it has to track a page that scrolls, animates and reflows
 * underneath it, and none of that is state Mithril knows about.
 */
export default class TourGuide<CustomAttrs extends TourGuideAttrs = TourGuideAttrs> extends Component<CustomAttrs> {
    private titleId;
    private popover;
    private arrow;
    private cutout;
    private panes;
    private frame;
    private trap;
    /** The element currently wired up to advance the tour when clicked. */
    private awaited;
    /** The geometry the popover was last laid out for, so identical frames cost nothing. */
    private geometry;
    view(): Mithril.Children;
    items(): ItemList<Mithril.Children>;
    controls(): ItemList<Mithril.Children>;
    oncreate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    onupdate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    onremove(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    protected showProgress(): boolean;
    protected allowClose(): boolean;
    protected onbackdropclick(): void;
    private onkeydown;
    /**
     * On a click-to-continue step the tour listens to the element it points at,
     * so the reader's own click is what moves them on.
     */
    private syncAwaitedElement;
    private releaseAwaitedElement;
    private onawaitedclick;
    private tick;
    /**
     * Cover the viewport with four panes arranged around `hole`, or with one
     * pane over everything when there is no hole.
     */
    private layOutBackdrop;
    private reposition;
}
