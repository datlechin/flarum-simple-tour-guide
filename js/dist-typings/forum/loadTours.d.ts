import type { TourData, TourOutcome } from './types';
/**
 * The tours this member could be shown.
 *
 * Cached for the life of the page: the answer only changes when they finish
 * one, and that goes through `recordCompletion` here, which refreshes it.
 */
export default function loadTours(): Promise<TourData[]>;
/**
 * Load one tour for an admin to look at, whether or not it is enabled and
 * whether or not they have already been through it. Never cached, and never
 * recorded.
 */
export declare function loadPreview(key: string): Promise<TourData[]>;
export declare function forgetTours(): void;
export declare function recordCompletion(tour: TourData, outcome: TourOutcome, lastStepId: number | null): void;
export declare function resetTours(userId: string, tourKey?: string): Promise<unknown>;
