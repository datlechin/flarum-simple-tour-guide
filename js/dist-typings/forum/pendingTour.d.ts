import type Mithril from 'mithril';
import type Tour from '../common/models/Tour';
export interface TourRequest {
    key: string;
    preview: boolean;
}
export declare function requestTour(key: string, preview?: boolean): void;
export declare function pendingTour(): TourRequest | null;
export declare function clearPendingTour(): void;
export declare function leadTo(route: string | null, waiting: Mithril.Children): boolean;
export declare function startRequested(tour: Tour, preview?: boolean): void;
