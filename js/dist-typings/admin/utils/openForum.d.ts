import type Tour from '../../common/models/Tour';
export interface PickedElement {
    selector: string;
    route: string | null;
}
export declare function previewTour(tour: Tour): void;
export declare function testTarget(tour: Tour, selector: string): void;
export declare function pickElement(tour: Tour): Promise<PickedElement | null>;
