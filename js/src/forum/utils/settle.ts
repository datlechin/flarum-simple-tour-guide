/**
 * Resolve when the page changes shape, or when `timeout` passes.
 *
 * A Flarum page announces itself in `Page.oninit`, which is before it has
 * fetched anything: a discussion page renders a spinner and skips its whole
 * sidebar until the discussion arrives. Waiting a fixed couple of frames after
 * that is waiting for the wrong thing, so the tour watches for the page to
 * actually change instead.
 */
export default function domChanged(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      observer.disconnect();
      window.clearTimeout(timer);
      resolve();
    };

    // A page settling fires a burst of mutations, so this waits for a short
    // quiet spell rather than reacting to the first one.
    let quiet: number | undefined;

    const observer = new MutationObserver(() => {
      window.clearTimeout(quiet);
      quiet = window.setTimeout(finish, 50);
    });

    const timer = window.setTimeout(finish, timeout);

    observer.observe(document.body, { childList: true, subtree: true });
  });
}
