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
  top: number;
  left: number;
  // Along the popover's edge, from its top-left corner.
  arrowOffset: number;
}

const GAP = 14;

const MARGIN = 12;

const ARROW_INSET = 22;

// The opposite side comes second: flipping keeps the popover on the same axis as its element.
const FALLBACKS: Record<Exclude<TourSide, 'center'>, Exclude<TourSide, 'center'>[]> = {
  bottom: ['bottom', 'top', 'right', 'left'],
  top: ['top', 'bottom', 'right', 'left'],
  right: ['right', 'left', 'bottom', 'top'],
  left: ['left', 'right', 'bottom', 'top'],
};

// When no side has room the popover goes to the middle: overlapping its element beats hanging off the screen.
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
  // A popover wider than its space gives max < min; pin it to the near edge.
  return Math.max(min, Math.min(value, Math.max(min, max)));
}
