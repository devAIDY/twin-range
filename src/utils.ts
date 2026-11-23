export type RangeValue = [number, number];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function decimalPlaces(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const s = String(n);
  const exp = s.indexOf("e-");
  if (exp !== -1) return Number(s.slice(exp + 2));
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

/** Snap `value` to the nearest step counted from `min`, avoiding float noise (0.1 + 0.2). */
export function snapToStep(value: number, min: number, step: number): number {
  if (!(step > 0)) return value;
  const snapped = min + Math.round((value - min) / step) * step;
  return Number(snapped.toFixed(Math.max(decimalPlaces(step), decimalPlaces(min))));
}

export function valueToPercent(value: number, min: number, max: number): number {
  const span = max - min;
  if (span <= 0) return 0;
  return clamp(((value - min) / span) * 100, 0, 100);
}

/** Sort and clamp an incoming value pair so rendering never sees an inverted range. */
export function normalizeRange(value: RangeValue, min: number, max: number): RangeValue {
  const a = clamp(value[0], min, max);
  const b = clamp(value[1], min, max);
  return a <= b ? [a, b] : [b, a];
}

/**
 * Move one thumb to `raw`, snapped and clamped, without crossing the other thumb
 * (keeping at least `minDistance` between them).
 */
export function moveThumb(
  current: RangeValue,
  index: 0 | 1,
  raw: number,
  opts: { min: number; max: number; step: number; minDistance: number },
): RangeValue {
  const { min, max, step, minDistance } = opts;
  const v = clamp(snapToStep(raw, min, step), min, max);
  const [low, high] = current;
  if (index === 0) return [clamp(v, min, Math.max(min, high - minDistance)), high];
  return [low, clamp(v, Math.min(max, low + minDistance), max)];
}

/** Which thumb a press at `raw` should grab. `null` = thumbs coincide here; decide on first move. */
export function pickThumb(current: RangeValue, raw: number): 0 | 1 | null {
  const [low, high] = current;
  if (low === high) {
    if (raw < low) return 0;
    if (raw > high) return 1;
    return null;
  }
  return Math.abs(raw - low) <= Math.abs(raw - high) ? 0 : 1;
}

/**
 * Format minutes since midnight as a 12-hour clock time, e.g. `615` → `"10:15 AM"`.
 * Handy as `formatLabel` for a time-of-day slider with `min={0} max={1440}`.
 */
export function formatTime(minutes: number): string {
  if (!Number.isFinite(minutes)) return "";
  const total = clamp(Math.round(minutes), 0, 1440);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export interface Box {
  left: number;
  right: number;
}

/** True when the low label's right edge comes within `gap` px of the high label's left edge. */
export function labelsCollide(low: Box, high: Box, gap: number): boolean {
  return low.right + gap > high.left;
}
