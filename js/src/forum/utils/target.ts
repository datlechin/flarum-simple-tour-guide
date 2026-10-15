// The first match on screen: a closed dropdown keeps its menu in the DOM, the closed phone drawer is only visibility:hidden.
export function queryTarget(selector: string): HTMLElement | null {
  let matches: NodeListOf<HTMLElement>;

  try {
    matches = document.querySelectorAll<HTMLElement>(selector);
  } catch {
    return null;
  }

  return Array.from(matches).find(isPresent) ?? null;
}

export function isPresent(element: Element): boolean {
  return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
}

export function revealTarget(element: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  const top = document.getElementById('header')?.offsetHeight ?? 0;

  if (rect.top >= top && rect.bottom <= document.documentElement.clientHeight) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
}
