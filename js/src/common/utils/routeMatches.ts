export default function routeMatches(wanted: string | null, actual: string | null | undefined): boolean {
  if (wanted === null) return true;

  return actual === wanted || !!actual?.startsWith(`${wanted}.`);
}
