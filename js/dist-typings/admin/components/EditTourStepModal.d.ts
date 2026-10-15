import FormModal from 'flarum/common/components/FormModal';
import type { IFormModalAttrs } from 'flarum/common/components/FormModal';
import ItemList from 'flarum/common/utils/ItemList';
import Stream from 'flarum/common/utils/Stream';
import type Mithril from 'mithril';
import type Tour from '../../common/models/Tour';
import type TourStep from '../../common/models/TourStep';
import type { StepTranslations } from '../../common/models/TourStep';
import type { PickedElement } from '../utils/openForum';
export interface EditTourStepModalAttrs extends IFormModalAttrs {
    tour: Tour;
    step?: TourStep;
}
export default class EditTourStepModal<CustomAttrs extends EditTourStepModalAttrs = EditTourStepModalAttrs> extends FormModal<CustomAttrs> {
    step: TourStep;
    stepTitle: Stream<string>;
    description: Stream<string>;
    target: Stream<string>;
    placement: Stream<string>;
    devices: Stream<string>;
    isEnabled: Stream<boolean>;
    clicksTarget: Stream<boolean>;
    advanceOnClick: Stream<boolean>;
    translations: StepTranslations;
    locale: Stream<string>;
    picked: PickedElement | null;
    picking: boolean;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    className(): string;
    title(): string | any[];
    content(): JSX.Element;
    fields(): ItemList<Mithril.Children>;
    protected targetField(invalidTarget: boolean): Mithril.Children;
    protected translationsField(): Mithril.Children;
    protected setTranslation(locale: string, key: 'title' | 'description', value: string): void;
    invalidTarget(): boolean;
    protected pick(): void;
    protected routeMismatch(): string | null;
    onsubmit(e: SubmitEvent): void;
    deleteStep(): void;
}
