import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
export interface SortableListAttrs extends ComponentAttrs {
    className?: string;
    handle: string;
    onsort: (ids: string[]) => void;
}
export default class SortableList<CustomAttrs extends SortableListAttrs = SortableListAttrs> extends Component<CustomAttrs> {
    private sortable;
    private instance;
    private list;
    private generation;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    view(vnode: Mithril.Vnode<CustomAttrs, this>): Mithril.Children;
    onremove(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    private attach;
}
