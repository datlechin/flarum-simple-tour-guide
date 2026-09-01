/**
 * The element a step points at, if it is on the page.
 *
 * The selector comes from a text field in the admin area, so it may not be a
 * valid selector at all. Either way the step has nothing to point at, which is
 * a thing the tour knows how to handle, not a reason to break.
 */
export declare function queryTarget(selector: string): HTMLElement | null;
/**
 * Whether an element actually occupies space on the page.
 *
 * Being in the DOM is not the same as being on screen, and the difference
 * matters more here than anywhere: a Flarum dropdown keeps its whole menu in
 * the document while closed, hidden by CSS. Matching one of those would give a
 * step an anchor with no position, and the popover would drift to the middle
 * of the screen pointing at nothing.
 */
export declare function isRendered(element: Element): boolean;
/**
 * Scroll a step's element into view, but only when it is not already
 * comfortably on screen: scrolling a target that the reader can already see
 * moves the page under them for no reason.
 */
export declare function revealTarget(element: HTMLElement): void;
