import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import type Tour from '../../common/models/Tour';
import type TourStep from '../../common/models/TourStep';
export interface TourStepListAttrs extends ComponentAttrs {
    tour: Tour;
}
/**
 * One tour's steps, in the order they run, reorderable by dragging.
 */
export default class TourStepList<CustomAttrs extends TourStepListAttrs = TourStepListAttrs> extends Component<CustomAttrs> {
    private sortable;
    /**
     * Sortable rearranges the DOM behind Mithril's back, so once a drag lands the
     * list is rebuilt rather than diffed against a tree that no longer describes
     * the page. Changing the key is what forces that.
     */
    private listKey;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    view(): Mithril.Children;
    /**
     * Keyed, and the only child of its parent, so that bumping the key replaces
     * the whole subtree instead of being ignored in an unkeyed diff.
     */
    protected body(): Mithril.Children;
    protected stepItem(step: TourStep): Mithril.Children;
    protected flag(icon: string, key: string, params?: Record<string, unknown>): Mithril.Children;
    /**
     * Shift a step one place, and save the whole order the same way a drag does.
     */
    protected move(step: TourStep, delta: number): void;
    protected duplicate(step: TourStep): void;
    protected steps(): TourStep[];
    protected onbodycreate(vnode: Mithril.VnodeDOM): void;
    protected onsort(list: HTMLElement): void;
    protected saveOrder(order: string[]): void;
}
