import type { Devices } from '../types';

/**
 * Flarum's own tablet breakpoint. Below it the header collapses into the
 * drawer, which is what makes a desktop selector stop matching.
 */
const PHONE_MAX_WIDTH = 767.98;

export function isMobile(): boolean {
  return window.matchMedia(`(max-width: ${PHONE_MAX_WIDTH}px)`).matches;
}

export function matchesDevice(devices: Devices): boolean {
  if (devices === 'any') return true;

  return devices === (isMobile() ? 'mobile' : 'desktop');
}
