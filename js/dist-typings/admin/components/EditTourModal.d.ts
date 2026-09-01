import FormModal from 'flarum/common/components/FormModal';
import type { IFormModalAttrs } from 'flarum/common/components/FormModal';
import ItemList from 'flarum/common/utils/ItemList';
import Stream from 'flarum/common/utils/Stream';
import type Mithril from 'mithril';
import type Tour from '../../common/models/Tour';
export interface EditTourModalAttrs extends IFormModalAttrs {
    tour?: Tour;
}
export default class EditTourModal<CustomAttrs extends EditTourModalAttrs = EditTourModalAttrs> extends FormModal<CustomAttrs> {
    tour: Tour;
    key: Stream<string>;
    tourTitle: Stream<string>;
    isEnabled: Stream<boolean>;
    startMode: Stream<string>;
    route: Stream<string>;
    devices: Stream<string>;
    groupIds: Stream<string[]>;
    maxAccountAgeDays: Stream<string>;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    className(): string;
    title(): string | any[];
    content(): JSX.Element;
    fields(): ItemList<Mithril.Children>;
    protected audienceField(): Mithril.Children;
    protected toggleGroup(id: string): void;
    onsubmit(e: SubmitEvent): void;
    deleteTour(): void;
}
