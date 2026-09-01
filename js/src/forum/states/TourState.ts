import type { TourData, TourOutcome, TourStepData } from '../types';
import { matchesDevice } from '../utils/device';
import nextFrames from '../utils/nextFrames';
import { queryTarget, revealTarget } from '../utils/target';

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
  protected applicable: TourStepData[] = [];

  protected index = -1;

  protected ended = false;

  /**
   * Whether anything after the current step can still be shown.
   *
   * Worked out when the step changes rather than on every render, because
   * answering it means asking the page about every step still to come.
   */
  protected lastShowable = true;

  /** The element the current step points at, if it has one. */
  element: HTMLElement | null = null;

  /** Called once the tour is over, with how it ended and where it got to. */
  onend: (outcome: TourOutcome, lastStepId: number | null) => void = () => {};

  constructor(tour: TourData) {
    this.tour = tour;
  }

  get current(): TourStepData | null {
    return this.applicable[this.index] ?? null;
  }

  get number(): number {
    return this.index + 1;
  }

  get total(): number {
    return this.applicable.length;
  }

  get isFirst(): boolean {
    return this.index <= 0;
  }

  get isLast(): boolean {
    return this.lastShowable;
  }

  /**
   * Whether the reader has to click the highlighted element to move on, rather
   * than being offered a button.
   */
  get awaitingClick(): boolean {
    return !!this.current?.advanceOnClick && !!this.element;
  }

  /**
   * Begin the tour.
   *
   * Returns `false` when nothing on this page matches any step, so the caller
   * can leave the reader alone rather than open an empty tour.
   */
  start(): boolean {
    this.recomputeApplicable();

    return this.showFrom(0, 1);
  }

  async next(): Promise<void> {
    const step = this.current;

    // A step can click what it highlights on the way out, so a tour can open a
    // menu and then point inside it. That changes which of the remaining steps
    // have something to point at, so they are worked out again afterwards.
    if (step?.clicksTarget && this.element) {
      // The click on Next that got us here is still on its way up to the
      // document, and Flarum's dropdowns close on any document click. Firing
      // ours inside it means opening a menu that the outer click then shuts
      // again, so wait for it to finish first.
      await nextFrames(1);

      this.element.click();

      await nextFrames(2);
      this.recomputeApplicable();
    }

    if (!this.showFrom(this.index + 1, 1)) {
      this.end('finished');
    }

    m.redraw();
  }

  previous(): void {
    if (this.isFirst) return;

    const staying = this.current;

    if (!this.showFrom(this.index - 1, -1) && staying) {
      // Nothing behind them survived, so they stay where they are. Its own
      // place in the list may have shifted while we looked.
      this.index = this.applicable.indexOf(staying);
    }

    m.redraw();
  }

  /**
   * Stop treating the current step as anchored, because what it pointed at is
   * no longer on the page.
   */
  forgetElement(): void {
    this.element = null;
  }

  end(outcome: TourOutcome = 'dismissed'): void {
    // The close button, the backdrop and the Escape key all lead here, and the
    // tour is only torn down on the next frame, so more than one of them can
    // arrive before it goes.
    if (this.ended) return;

    const lastStepId = this.current?.id ?? null;

    this.ended = true;
    this.index = -1;
    this.applicable = [];
    this.element = null;

    this.onend(outcome, lastStepId);
  }

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
  protected showFrom(index: number, direction: 1 | -1): boolean {
    while (index >= 0 && index < this.applicable.length) {
      const step = this.applicable[index];
      const element = step.target ? queryTarget(step.target) : null;

      if (step.target && !element) {
        this.applicable.splice(index, 1);

        // Everything after the gap shifts down, so going forward we are
        // already looking at the next one and going back we step over it.
        if (direction === -1) index--;

        continue;
      }

      this.index = index;
      this.element = element;
      // Steps ahead can be dropped when we reach them, so counting them is not
      // the same as knowing one will be shown. Asking now is what stops the
      // button saying Next and then ending the tour.
      this.lastShowable = !this.applicable.slice(index + 1).some((later) => this.applies(later));

      if (element) revealTarget(element);

      return true;
    }

    return false;
  }

  /**
   * Keep the steps already shown, and work out afresh which of the rest apply.
   *
   * Only ever grows or trims the part of the tour still ahead of the reader, so
   * the step they are on never renumbers under them.
   */
  protected recomputeApplicable(): void {
    const shown = this.applicable.slice(0, this.index + 1);

    this.applicable = [...shown, ...this.tour.steps.filter((step) => !shown.includes(step) && this.applies(step))];
  }

  protected applies(step: TourStepData): boolean {
    if (!matchesDevice(step.devices)) return false;

    return !step.target || queryTarget(step.target) !== null;
  }
}
