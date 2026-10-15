// Classes that say what an element is doing right now, which stop matching the moment a menu closes.
const STATE_CLASSES =
  /^(open|active|focused|focus|hover|loading|disabled|hidden|selected|expanded|collapsed|dragging|sortable-.*|has-.*|is-.*|in|show|fade)$/;

// Ids made up by a framework, different on the next page load.
const GENERATED_ID = /\d{4,}|^[a-z]?[0-9a-f]{8,}$/i;

const MAX_DEPTH = 4;

export default function generateSelector(target: Element): string | null {
  const element = meaningful(target);

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

// Pointing at a button lands on the span holding its label; climb to the control, but only from close by.
function meaningful(element: Element): Element {
  if (!/^(span|i|svg|path|b|strong|em|small|label)$/i.test(element.tagName)) {
    return element;
  }

  const control = element.closest('button, a, [role="button"], input, select, textarea');

  if (!control) return element;

  let depth = 0;

  for (let node: Element | null = element; node && node !== control; node = node.parentElement) {
    if (++depth > 3) return element;
  }

  return control;
}

// The rarest classes say which element this is: `Button` is on every button, `IndexPage-newDiscussion` on one.
function describe(element: Element): string {
  const tag = element.tagName.toLowerCase();

  const classes = Array.from(element.classList)
    .filter((name) => !STATE_CLASSES.test(name))
    .map((name) => ({ name, count: document.getElementsByClassName(name).length }))
    .sort((a, b) => a.count - b.count)
    .slice(0, 2)
    .map(({ name }) => `.${CSS.escape(name)}`)
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
