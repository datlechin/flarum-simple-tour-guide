import TourState from './states/TourState';
import type { TourData } from './types';
/**
 * Be told whenever a tour finishes or is closed, however it ended.
 */
export declare function onTourEnded(listener: () => void): void;
/**
 * Run a tour over the page as it stands.
 *
 * Returns the state driving it, or `null` when none of its steps has anything
 * to point at here, in which case nothing is shown and nothing is recorded.
 *
 * The tour lives in its own root at the end of the body rather than inside the
 * app, because it covers the app.
 */
export default function showTour(tour: TourData): TourState | null;
export declare function tourIsRunning(): boolean;
