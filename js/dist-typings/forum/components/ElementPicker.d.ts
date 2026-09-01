import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
export interface ElementPickerAttrs extends ComponentAttrs {
    /** 'pick' captures an element, 'test' just shows what a selector matches. */
    mode: 'pick' | 'test';
    /** The selector to show matches for, in 'test' mode. */
    selector?: string | null;
}
/**
 * Point-and-click selector capture, opened by the admin area in a second
 * window.
 *
 * Typing a CSS selector by hand is the worst part of writing a tour: you have
 * to know the markup, and you find out you got it wrong later, silently, when
 * a step fails to appear.
 */
export default class ElementPicker<CustomAttrs extends ElementPickerAttrs = ElementPickerAttrs> extends Component<CustomAttrs> {
    private hovered;
    private selector;
    private matches;
    /**
     * While paused the forum behaves normally, so the admin can navigate to the
     * page their step is about. Without it the picker could only ever capture
     * something on whichever page it opened on, since it swallows every click.
     */
    private paused;
    view(): Mithril.Children;
    oncreate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    onremove(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    protected label(): string;
    protected togglePause(): void;
    private onmousemove;
    private onclick;
    private onkeydown;
    private outlineFirstMatch;
    private hideOutline;
    private outline;
}
