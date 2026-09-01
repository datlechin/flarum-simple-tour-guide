export type TourSide = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface Size {
  width: number;
  height: number;
}

export interface Box extends Size {
  top: number;
  left: number;
}

export interface Placement {
  side: TourSide;
  /** Viewport coordinates, so the maths is the same whichever way the page reads. */
  top: number;
  left: number;
  /**
   * Where the arrow sits along the popover's edge, in pixels from the popover's
   * top-left corner. Meaningless when `side` is `center`, which has no arrow.
   */
  arrowOffset: number;
}

/** Space between the highlighted element and the popover. */
const GAP = 14;

/** How close to the edge of the screen the popover may come. */
const MARGIN = 12;

/** How close to a corner the arrow may come. */
const ARROW_INSET = 22;

/**
 * Which sides to try, and in what order, for each preferred side. The opposite
 * side comes second because flipping keeps the popover on the same axis as the
 * element it describes, which is the smaller change for the reader to follow.
 */
const FALLBACKS: Record<Exclude<TourSide, 'center'>, Exclude<TourSide, 'center'>[]> = {
  bottom: ['bottom', 'top', 'right', 'left'],
  top: ['top', 'bottom', 'right', 'left'],
  right: ['right', 'left', 'bottom', 'top'],
  left: ['left', 'right', 'bottom', 'top'],
};

/**
 * Decide where a step's popover goes.
 *
 * Tries the preferred side and then its fallbacks, taking the first that fits
 * on screen whole. When the element is large enough that no side has room, the
 * popover goes to the middle of the screen: overlapping what it describes is
 * better than hanging off the edge where it cannot be read.
 */
export default function computePlacement(
  target: Box | null,
  popover: Size,
  viewport: Size,
  preferred: Exclude<TourSide, 'center'> = 'bottom'
): Placement {
  if (!target) {
    return centered(popover, viewport);
  }

  for (const side of FALLBACKS[preferred]) {
    if (fits(side, target, popover, viewport)) {
      return place(side, target, popover, viewport);
    }
  }

  return centered(popover, viewport);
}

function fits(side: Exclude<TourSide, 'center'>, target: Box, popover: Size, viewport: Size): boolean {
  switch (side) {
    case 'bottom':
      return target.top + target.height + GAP + popover.height + MARGIN <= viewport.height;
    case 'top':
      return target.top - GAP - popover.height - MARGIN >= 0;
    case 'right':
      return target.left + target.width + GAP + popover.width + MARGIN <= viewport.width;
    case 'left':
      return target.left - GAP - popover.width - MARGIN >= 0;
  }
}

function place(side: Exclude<TourSide, 'center'>, target: Box, popover: Size, viewport: Size): Placement {
  const centerX = target.left + target.width / 2;
  const centerY = target.top + target.height / 2;

  if (side === 'top' || side === 'bottom') {
    const top = side === 'bottom' ? target.top + target.height + GAP : target.top - GAP - popover.height;
    const left = clamp(centerX - popover.width / 2, MARGIN, viewport.width - popover.width - MARGIN);

    return { side, top, left, arrowOffset: arrowAlong(centerX - left, popover.width) };
  }

  const left = side === 'right' ? target.left + target.width + GAP : target.left - GAP - popover.width;
  const top = clamp(centerY - popover.height / 2, MARGIN, viewport.height - popover.height - MARGIN);

  return { side, top, left, arrowOffset: arrowAlong(centerY - top, popover.height) };
}

function centered(popover: Size, viewport: Size): Placement {
  return {
    side: 'center',
    top: Math.max(MARGIN, (viewport.height - popover.height) / 2),
    left: Math.max(MARGIN, (viewport.width - popover.width) / 2),
    arrowOffset: 0,
  };
}

function arrowAlong(offset: number, extent: number): number {
  return clamp(offset, ARROW_INSET, Math.max(ARROW_INSET, extent - ARROW_INSET));
}

function clamp(value: number, min: number, max: number): number {
  // A popover wider than the space it has to sit in would give `max < min`;
  // pinning it to the near edge at least keeps its start on screen.
  return Math.max(min, Math.min(value, Math.max(min, max)));
}
