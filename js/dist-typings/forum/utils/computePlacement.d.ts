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
/**
 * Decide where a step's popover goes.
 *
 * Tries the preferred side and then its fallbacks, taking the first that fits
 * on screen whole. When the element is large enough that no side has room, the
 * popover goes to the middle of the screen: overlapping what it describes is
 * better than hanging off the edge where it cannot be read.
 */
export default function computePlacement(target: Box | null, popover: Size, viewport: Size, preferred?: Exclude<TourSide, 'center'>): Placement;
