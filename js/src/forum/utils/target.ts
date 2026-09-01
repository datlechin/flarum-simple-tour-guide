/**
 * The element a step points at, if it is on the page.
 *
 * The selector comes from a text field in the admin area, so it may not be a
 * valid selector at all. Either way the step has nothing to point at, which is
 * a thing the tour knows how to handle, not a reason to break.
 */
export function queryTarget(selector: string): HTMLElement | null {
  let element: HTMLElement | null;

  try {
    element = document.querySelector<HTMLElement>(selector);
  } catch {
    return null;
  }

  return element && isRendered(element) ? element : null;
}

/**
 * Whether an element actually occupies space on the page.
 *
 * Being in the DOM is not the same as being on screen, and the difference
 * matters more here than anywhere: a Flarum dropdown keeps its whole menu in
 * the document while closed, hidden by CSS. Matching one of those would give a
 * step an anchor with no position, and the popover would drift to the middle
 * of the screen pointing at nothing.
 */
export function isRendered(element: Element): boolean {
  return element.getClientRects().length > 0;
}

/**
 * Scroll a step's element into view, but only when it is not already
 * comfortably on screen: scrolling a target that the reader can already see
 * moves the page under them for no reason.
 */
export function revealTarget(element: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  const viewportHeight = document.documentElement.clientHeight;

  // The forum header floats over the top of the page, and a popover wants room
  // of its own, so "on screen" means a little way in from either edge.
  const headroom = 96;

  if (rect.top >= headroom && rect.bottom <= viewportHeight - headroom) {
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
}
