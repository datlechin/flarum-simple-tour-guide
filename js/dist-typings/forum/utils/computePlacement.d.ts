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
    arrowOffset: number;
}
export default function computePlacement(target: Box | null, popover: Size, viewport: Size, preferred?: Exclude<TourSide, 'center'>): Placement;
