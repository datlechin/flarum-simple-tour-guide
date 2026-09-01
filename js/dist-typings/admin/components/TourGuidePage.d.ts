import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import type { ExtensionPageAttrs } from 'flarum/admin/components/ExtensionPage';
import type Mithril from 'mithril';
import type Tour from '../../common/models/Tour';
/**
 * Everything an admin does with tours, on one page: the tours themselves, the
 * steps of whichever is selected, how it is doing, and the two settings that
 * apply to all of them.
 */
export default class TourGuidePage<CustomAttrs extends ExtensionPageAttrs = ExtensionPageAttrs> extends ExtensionPage<CustomAttrs> {
    private loadingTours;
    private selectedId;
    private sortable;
    private listKey;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    content(): JSX.Element;
    /**
     * Built from what the extension registered, so the switches here and the
     * ones admin search finds can never describe different things.
     */
    protected settingFields(): Mithril.Children;
    protected tourList(): Mithril.Children;
    protected tourItem(tour: Tour): Mithril.Children;
    /**
     * The one line under a tour's name that says how it behaves, in the order
     * somebody scanning the list would ask: how big, when, where.
     */
    protected meta(tour: Tour): Mithril.Children;
    protected steps(): Mithril.Children;
    protected stats(): Mithril.Children;
    protected tours(): Tour[];
    protected selected(): Tour | null;
    /**
     * Opens the forum with the tour running, whether or not it is enabled and
     * whether or not this admin has already been through it. Nothing is recorded.
     */
    protected preview(tour: Tour): void;
    /**
     * Shift a tour one place, and save the whole order the same way a drag does.
     */
    protected move(tour: Tour, delta: number): void;
    protected duplicate(tour: Tour): void;
    protected exportTour(tour: Tour): void;
    protected importTour(): void;
    protected onlistcreate(vnode: Mithril.VnodeDOM): void;
    protected onsort(list: HTMLElement): void;
    protected saveOrder(order: string[]): void;
}
