import FormModal from 'flarum/common/components/FormModal';
import type { IFormModalAttrs } from 'flarum/common/components/FormModal';
import ItemList from 'flarum/common/utils/ItemList';
import Stream from 'flarum/common/utils/Stream';
import type Mithril from 'mithril';
import type Tour from '../../common/models/Tour';
import type TourStep from '../../common/models/TourStep';
import type { StepTranslations } from '../../common/models/TourStep';
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
    /** Wording per locale, edited one language at a time. */
    translations: StepTranslations;
    locale: Stream<string>;
    /** How many elements the target matched, the last time we asked the forum. */
    matches: number | null;
    picking: boolean;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    className(): string;
    title(): string | any[];
    content(): JSX.Element;
    fields(): ItemList<Mithril.Children>;
    protected targetField(invalidTarget: boolean): Mithril.Children;
    protected translationsField(): Mithril.Children;
    protected setTranslation(locale: string, key: 'title' | 'description', value: string): void;
    /**
     * The target is typed or picked, so it is worth saying "that is not a
     * selector" here rather than letting the tour quietly skip the step later.
     */
    invalidTarget(): boolean;
    protected pick(mode: 'pick' | 'test'): void;
    onsubmit(e: SubmitEvent): void;
    deleteStep(): void;
}
export declare function deviceOptions(): Record<string, string>;
