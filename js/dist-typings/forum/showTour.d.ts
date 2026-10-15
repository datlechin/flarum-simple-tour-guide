import type Tour from '../common/models/Tour';
import TourState from './states/TourState';
export default function showTour(tour: Tour, preview?: boolean): TourState | null;
export declare function runningTour(): TourState | null;
