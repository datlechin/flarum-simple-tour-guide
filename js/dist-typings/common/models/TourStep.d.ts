import Model from 'flarum/common/Model';
import type Tour from './Tour';
import type { Devices, Placement } from '../types';
export type StepTranslations = Record<string, {
    title: string;
    description: string;
}>;
export default class TourStep extends Model {
    title(): string;
    description(): string;
    localizedTitle(): string;
    descriptionHtml(): string;
    target(): string | null;
    placement(): Placement;
    devices(): Devices;
    isEnabled(): boolean;
    clicksTarget(): boolean;
    advanceOnClick(): boolean;
    position(): number;
    translations(): StepTranslations;
    tour(): false | Tour;
}
