import type Tour from '../common/models/Tour';
import type TourStep from '../common/models/TourStep';
import type { TourOutcome } from '../common/types';
export default function loadTours(): Promise<Tour[]>;
export declare function loadPreview(): Promise<Tour[]>;
export declare function forgetTours(): void;
export declare function endedThisVisit(tour: Tour): boolean;
export declare function recordCompletion(tour: Tour, outcome: TourOutcome, lastStep: TourStep | null): void;
export declare function resetTours(userId: string): Promise<unknown>;
