import type { TourData, TourOutcome, TourStepData } from '../types';
/**
 * A tour in progress.
 *
 * The interesting part is `applicable`: a step points at an element, and not
 * every page has every element, so the tour that runs is the subset of the
 * configured steps that has something to point at right now. Working that out
 * once up front is what keeps the progress count honest: the reader is never
 * told they are on step 2 of 6 and then handed the last one.
 */
export default class TourState {
    readonly tour: TourData;
    /** The steps that apply to the page as it stands. */
    protected applicable: TourStepData[];
    protected index: number;
    protected ended: boolean;
    /**
     * Whether anything after the current step can still be shown.
     *
     * Worked out when the step changes rather than on every render, because
     * answering it means asking the page about every step still to come.
     */
    protected lastShowable: boolean;
    /** The element the current step points at, if it has one. */
    element: HTMLElement | null;
    /** Called once the tour is over, with how it ended and where it got to. */
    onend: (outcome: TourOutcome, lastStepId: number | null) => void;
    constructor(tour: TourData);
    get current(): TourStepData | null;
    get number(): number;
    get total(): number;
    get isFirst(): boolean;
    get isLast(): boolean;
    /**
     * Whether the reader has to click the highlighted element to move on, rather
     * than being offered a button.
     */
    get awaitingClick(): boolean;
    /**
     * Begin the tour.
     *
     * Returns `false` when nothing on this page matches any step, so the caller
     * can leave the reader alone rather than open an empty tour.
     */
    start(): boolean;
    next(): Promise<void>;
    previous(): void;
    /**
     * Stop treating the current step as anchored, because what it pointed at is
     * no longer on the page.
     */
    forgetElement(): void;
    end(outcome?: TourOutcome): void;
    /**
     * Show the first step from `index` that still has something to point at,
     * searching in `direction`.
     *
     * Which steps apply is worked out before the tour starts, but the page keeps
     * moving: a menu closes, a widget finishes loading, and a target that was
     * there is not any more. Dropping those as we reach them is what stops a
     * step that says "look at this" appearing in the middle of the screen
     * pointing at nothing.
     *
     * Returns false when there is nothing left to show that way.
     */
    protected showFrom(index: number, direction: 1 | -1): boolean;
    /**
     * Keep the steps already shown, and work out afresh which of the rest apply.
     *
     * Only ever grows or trims the part of the tour still ahead of the reader, so
     * the step they are on never renumbers under them.
     */
    protected recomputeApplicable(): void;
    protected applies(step: TourStepData): boolean;
}
