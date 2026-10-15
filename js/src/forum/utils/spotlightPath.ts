import type { Box, Size } from './computePlacement';

export default function spotlightPath(viewport: Size, hole: Box | null, radius: number): string {
  const cover = `M0,0H${viewport.width}V${viewport.height}H0Z`;

  return hole ? cover + roundedRect(hole, radius) : cover;
}

function roundedRect(box: Box, radius: number): string {
  const { top: y, left: x, width: w, height: h } = box;
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));

  return (
    `M${x + r},${y}` +
    `H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}` +
    `V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}` +
    `H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}` +
    `V${y + r}A${r},${r} 0 0 1 ${x + r},${y}` +
    'Z'
  );
}
