import app from 'flarum/forum/app';

import type Tour from '../../common/models/Tour';
import type TourStep from '../../common/models/TourStep';
import type { TourOutcome } from '../../common/types';
import { matchesDevice } from '../utils/device';
import { queryTarget } from '../utils/target';

export default class TourState {
  readonly tour: Tour;
  readonly preview: boolean;

  // Fixed when the tour starts, so the count never moves. A step whose element is missing is skipped when reached.
  readonly steps: TourStep[];

  element: HTMLElement | null = null;
  hasPrevious = false;
  ended = false;

  onend: (outcome: TourOutcome, lastStep: TourStep | null) => void = () => {};

  protected index = -1;

  // A move asked for by Next, Back or a click on the element, applied on the next redraw once the page has handled the click.
  protected pending: 1 | -1 | 0 = 0;

  // Clicked once per run: after Back, clicking again would close the menu it opened.
  protected clickedSteps = new Set<TourStep>();

  constructor(tour: Tour, preview = false) {
    this.tour = tour;
    this.preview = preview;
    this.steps = (tour.enabledSteps() || []).filter((step): step is TourStep => !!step && matchesDevice(step.devices()));
  }

  get current(): TourStep | null {
    return this.steps[this.index] ?? null;
  }

  get number(): number {
    return this.index + 1;
  }

  get total(): number {
    return this.steps.length;
  }

  get isLast(): boolean {
    return this.index === this.steps.length - 1;
  }

  get awaitingClick(): boolean {
    return !!this.current?.advanceOnClick() && !!this.element;
  }

  start(): boolean {
    return matchesDevice(this.tour.devices()) && this.go(0, 1);
  }

  next(): void {
    const step = this.current;

    if (this.pending || this.ended || !step) return;

    if (step.clicksTarget() && this.element && !this.clickedSteps.has(step)) {
      this.clickedSteps.add(step);
      this.element.click();
    }

    this.advance();
  }

  previous(): void {
    if (!this.pending && !this.ended) this.pending = -1;
  }

  clicked(): void {
    this.advance();

    m.redraw();
  }

  sync(): void {
    if (this.ended) return;

    if (app.modal.modal) {
      this.end('dismissed');

      return;
    }

    if (this.pending) {
      const direction = this.pending;

      this.pending = 0;

      if (!this.go(this.index + direction, direction) && direction === 1) {
        this.end('finished');

        return;
      }
    }

    this.element = this.resolve(this.current);
    this.hasPrevious = this.steps.slice(0, this.index).some((step) => this.showable(step));
  }

  end(outcome: TourOutcome = 'dismissed'): void {
    if (this.ended) return;

    this.ended = true;
    this.onend(outcome, this.current);
  }

  protected advance(): void {
    if (this.pending || this.ended) return;

    if (this.isLast) {
      this.end('finished');
    } else {
      this.pending = 1;
    }
  }

  protected go(from: number, direction: 1 | -1): boolean {
    for (let index = from; index >= 0 && index < this.steps.length; index += direction) {
      if (this.showable(this.steps[index])) {
        this.index = index;
        this.element = this.resolve(this.steps[index]);

        return true;
      }
    }

    return false;
  }

  protected showable(step: TourStep): boolean {
    return !step.target() || !!this.resolve(step);
  }

  protected resolve(step: TourStep | null): HTMLElement | null {
    const target = step?.target();

    return target ? queryTarget(target) : null;
  }
}
