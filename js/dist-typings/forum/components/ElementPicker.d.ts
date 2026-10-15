import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
export interface ElementPickerAttrs extends ComponentAttrs {
    mode: 'pick' | 'test';
    selector: string | null;
    route: string | null;
}
export default class ElementPicker<CustomAttrs extends ElementPickerAttrs = ElementPickerAttrs> extends Component<CustomAttrs> {
    private access;
    private hovered;
    private selector;
    private matches;
    private outlineElement;
    private testedOn;
    private paused;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    view(): Mithril.Children;
    oncreate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    onupdate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    onremove(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    protected label(): string;
    protected notice(): Mithril.Children;
    protected togglePause(): void;
    protected showSelector(): void;
    private onmousemove;
    private onclick;
    private onkeydown;
    private select;
    private hideOutline;
    private outline;
}
