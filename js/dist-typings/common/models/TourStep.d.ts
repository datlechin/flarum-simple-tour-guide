import Model from 'flarum/common/Model';
import type Tour from './Tour';
export type StepTranslations = Record<string, {
    title: string;
    description: string;
}>;
export default class TourStep extends Model {
    title(): string;
    description(): string;
    /** A CSS selector, or null for a step that stands on its own. */
    target(): string | null;
    placement(): "auto" | "top" | "bottom" | "left" | "right";
    devices(): "any" | "desktop" | "mobile";
    isEnabled(): boolean;
    /** Clicks the highlighted element on the way to the next step. */
    clicksTarget(): boolean;
    /** Waits for the member to click the highlighted element. */
    advanceOnClick(): boolean;
    position(): number;
    /** Wording per locale, keyed by locale code. */
    translations(): StepTranslations;
    tour(): false | Tour;
}
