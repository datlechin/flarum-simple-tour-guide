/**
 * Resolve when the page changes shape, or when `timeout` passes.
 *
 * A Flarum page announces itself in `Page.oninit`, which is before it has
 * fetched anything: a discussion page renders a spinner and skips its whole
 * sidebar until the discussion arrives. Waiting a fixed couple of frames after
 * that is waiting for the wrong thing, so the tour watches for the page to
 * actually change instead.
 */
export default function domChanged(timeout: number): Promise<void>;
