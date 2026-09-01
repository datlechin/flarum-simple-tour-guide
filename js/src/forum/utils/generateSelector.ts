/**
 * Classes that describe what an element is doing right now rather than what it
 * is. A selector built from these stops matching the moment a menu closes or a
 * request finishes, which is exactly when a tour needs it most.
 */
const STATE_CLASSES =
  /^(open|active|focused|focus|hover|loading|disabled|hidden|selected|expanded|collapsed|dragging|sortable-.*|has-.*|is-.*|in|show|fade)$/;

/** Ids a framework made up, which will be different on the next page load. */
const GENERATED_ID = /\d{4,}|^[a-z]?[0-9a-f]{8,}$/i;

/** Deep selectors are unreadable and brittle; a few levels is plenty. */
const MAX_DEPTH = 4;

/**
 * A CSS selector for one element on the page, aimed at surviving the next
 * render rather than at being the shortest thing that matches today.
 */
export default function generateSelector(element: Element): string | null {
  if (!element.isConnected || element === document.body || element === document.documentElement) {
    return null;
  }

  const parts: string[] = [];
  let current: Element | null = element;

  for (let depth = 0; current && depth < MAX_DEPTH; depth++) {
    const id = usableId(current);

    if (id) {
      parts.unshift(`#${CSS.escape(id)}`);
      break;
    }

    parts.unshift(describe(current));

    const candidate = parts.join(' > ');

    if (matchCount(candidate) === 1) {
      return candidate;
    }

    current = current.parentElement;

    if (!current || current === document.body) break;
  }

  const selector = parts.join(' > ');

  if (!selector) return null;

  // Still ambiguous after climbing as far as we go. Position among its
  // siblings is the last thing left that tells them apart.
  if (matchCount(selector) !== 1) {
    const indexed = withNthChild(parts, element);

    if (matchCount(indexed) === 1) return indexed;
  }

  return selector;
}

export function matchCount(selector: string): number {
  if (!selector.trim()) return 0;

  try {
    return document.querySelectorAll(selector).length;
  } catch {
    return 0;
  }
}

function usableId(element: Element): string | null {
  const id = element.getAttribute('id');

  return id && !GENERATED_ID.test(id) && matchCount(`#${CSS.escape(id)}`) === 1 ? id : null;
}

function describe(element: Element): string {
  const tag = element.tagName.toLowerCase();

  const classes = Array.from(element.classList)
    .filter((name) => !STATE_CLASSES.test(name))
    // Flarum's own component classes are capitalised and stable; utility and
    // state classes tend not to be. Prefer the former, keep at most two so the
    // selector stays readable.
    .sort((a, b) => Number(/^[A-Z]/.test(b)) - Number(/^[A-Z]/.test(a)))
    .slice(0, 2)
    .map((name) => `.${CSS.escape(name)}`)
    .join('');

  return classes || tag;
}

function withNthChild(parts: string[], element: Element): string {
  const parent = element.parentElement;

  if (!parent) return parts.join(' > ');

  const index = Array.from(parent.children).indexOf(element) + 1;
  const last = [...parts];

  last[last.length - 1] = `${last[last.length - 1]}:nth-child(${index})`;

  return last.join(' > ');
}
