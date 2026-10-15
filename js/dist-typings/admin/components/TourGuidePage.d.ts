import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import type { ExtensionPageAttrs } from 'flarum/admin/components/ExtensionPage';
import type Mithril from 'mithril';
import type Tour from '../../common/models/Tour';
export default class TourGuidePage<CustomAttrs extends ExtensionPageAttrs = ExtensionPageAttrs> extends ExtensionPage<CustomAttrs> {
    private loadingTours;
    private selectedId;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    content(): JSX.Element;
    protected tourList(): Mithril.Children;
    protected tourItem(tour: Tour): Mithril.Children;
    protected meta(tour: Tour): Mithril.Children;
    protected tours(): Tour[];
    protected selected(): Tour | null;
}
