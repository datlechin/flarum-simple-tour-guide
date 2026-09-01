/**
 * Resolve once the browser has painted `count` more frames.
 *
 * Mithril schedules its redraws on animation frames, so this is how long it
 * takes for a change the tour just made to the page to become something the
 * tour can measure.
 */
export default function nextFrames(count = 1): Promise<void> {
  return new Promise((resolve) => {
    const frame = (remaining: number): void => {
      if (remaining <= 0) {
        resolve();
        return;
      }

      requestAnimationFrame(() => frame(remaining - 1));
    };

    frame(count);
  });
}
