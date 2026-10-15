import type Tour from '../../common/models/Tour';
import type TourStep from '../../common/models/TourStep';
export interface Stats {
    finished: number;
    dismissed: number;
    total: number;
    steps: Array<{
        id: number;
        title: string;
        abandoned: number;
    }>;
}
export declare function orderTours(ids: string[]): Promise<unknown>;
export declare function orderSteps(tour: Tour, ids: string[]): Promise<unknown>;
export declare function duplicateTour(tour: Tour): Promise<Tour>;
export declare function duplicateStep(step: TourStep): Promise<TourStep>;
export declare function fetchStats(tour: Tour): Promise<Stats>;
export declare function exportTour(tour: Tour): Promise<void>;
export declare function importTour(): Promise<Tour | null>;
