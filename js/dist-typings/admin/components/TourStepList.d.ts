import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import type Tour from '../../common/models/Tour';
import type TourStep from '../../common/models/TourStep';
export interface TourStepListAttrs extends ComponentAttrs {
    tour: Tour;
}
export default class TourStepList<CustomAttrs extends TourStepListAttrs = TourStepListAttrs> extends Component<CustomAttrs> {
    view(): Mithril.Children;
    protected stepItem(step: TourStep, steps: TourStep[]): Mithril.Children;
    protected flag(icon: string, label: Mithril.Children): Mithril.Children;
}
