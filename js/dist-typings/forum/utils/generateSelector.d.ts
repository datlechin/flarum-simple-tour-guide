/**
 * A CSS selector for one element on the page, aimed at surviving the next
 * render rather than at being the shortest thing that matches today.
 */
export default function generateSelector(target: Element): string | null;
export declare function matchCount(selector: string): number;
