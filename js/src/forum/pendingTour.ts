/**
 * A tour asked for by name that is waiting for the right page.
 *
 * A tour belongs to a route, so "take this again" from the settings page, and
 * previewing a discussion tour from the admin area, both have somewhere to go
 * before they can start. Rather than refusing, the request is held here and
 * picked up when the reader arrives.
 */
let pending: string | null = null;

export function requestTour(key: string): void {
  pending = key;
}

export function pendingTourKey(): string | null {
  return pending;
}

export function clearPendingTour(): void {
  pending = null;
}

/**
 * Flarum routes that can be linked to without knowing which discussion or
 * which member is meant. Anything else, the reader has to navigate to.
 */
const ROUTES_WITHOUT_PARAMS = ['index', 'posts', 'settings', 'notifications'];

export function canNavigateTo(route: string | null): boolean {
  return route !== null && ROUTES_WITHOUT_PARAMS.includes(route);
}
