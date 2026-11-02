export interface Point {
  x: number;
  y: number;
}

/** How close the finger must be to the line. Generous, because small fingers wobble. */
export const TRACE_TOLERANCE = 11;
/** Share of a stroke that must be covered before moving to the next one. */
export const STROKE_DONE = 0.85;

export function markCovered(samples: Point[], covered: boolean[], finger: Point, tolerance = TRACE_TOLERANCE): boolean[] {
  return samples.map((p, i) => covered[i] || Math.hypot(p.x - finger.x, p.y - finger.y) <= tolerance);
}

export const coverage = (covered: boolean[]): number =>
  covered.length === 0 ? 1 : covered.filter(Boolean).length / covered.length;
