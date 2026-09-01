import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import type { TourData } from '../types';
/**
 * The member's own list of tours, on their settings page.
 *
 * Until now the only way back into a tour was to ask a moderator to reset it,
 * which is a lot of ceremony for "show me that again".
 */
export default class TourSettings<CustomAttrs extends ComponentAttrs = ComponentAttrs> extends Component<CustomAttrs> {
    private loading;
    private tours;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    view(): Mithril.Children;
    /**
     * Starting a tour the member has already been through means forgetting they
     * took it first, or the tour would mark itself done again over a record that
     * already says so and nothing would change.
     */
    protected take(tour: TourData): void;
}
