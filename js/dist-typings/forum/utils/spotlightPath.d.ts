import type { Box, Size } from './computePlacement';
/**
 * An SVG path that covers the viewport with a hole cut out of it.
 *
 * Both rings are drawn clockwise, so filling the path with `evenodd` leaves the
 * hole empty. That gives a real cutout rather than four rectangles arranged
 * around a gap, which is what makes rounded corners and a single fade possible.
 */
export default function spotlightPath(viewport: Size, hole: Box | null, radius: number): string;
