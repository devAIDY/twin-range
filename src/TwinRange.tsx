import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  labelsCollide,
  moveThumb,
  normalizeRange,
  pickThumb,
  snapToStep,
  valueToPercent,
  type RangeValue,
} from "./utils";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface TwinRangeProps {
  /** Lowest selectable value. Default `0`. */
  min?: number;
  /** Highest selectable value. Default `100`. */
  max?: number;
  /** Granularity of the values. Default `1`. */
  step?: number;
  /** Controlled value `[low, high]`. */
  value?: RangeValue;
  /** Initial value when uncontrolled. Default `[min, max]`. */
  defaultValue?: RangeValue;
  /** Fires on every change while dragging or pressing keys. */
  onChange?: (value: RangeValue) => void;
  /**
   * Fires once when the user finishes an interaction: on every pointer release (even if the
   * value ended where it started) and after each key press that changed the value.
   */
  onChangeEnd?: (value: RangeValue) => void;
  /** Smallest allowed gap between the two values. Default `0`. */
  minDistance?: number;
  disabled?: boolean;
  /** Render the floating value labels. Default `true`. */
  showLabels?: boolean;
  /** Render fixed `min` and `max` labels at the two ends of the track. Default `false`. */
  showBounds?: boolean;
  /** Formats a single value for its label (and for `aria-valuetext` when it returns a string). */
  formatLabel?: (value: number) => ReactNode;
  /** Formats the merged label shown when the two labels would overlap. */
  formatMergedLabel?: (low: number, high: number) => ReactNode;
  /** Minimum horizontal gap in px between the two labels before they merge. Default `4`. */
  mergeGap?: number;
  /** Accessible names for the low and high thumbs. */
  ariaLabel?: [string, string];
  id?: string;
  className?: string;
  style?: CSSProperties;
}

const defaultFormat = (v: number): ReactNode => v;

export function TwinRange({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onChange,
  onChangeEnd,
  minDistance = 0,
  disabled = false,
  showLabels = true,
  showBounds = false,
  formatLabel = defaultFormat,
  formatMergedLabel,
  mergeGap = 4,
  ariaLabel = ["Minimum value", "Maximum value"],
  id,
  className,
  style,
}: TwinRangeProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<RangeValue>(() =>
    normalizeRange(defaultValue ?? [min, max], min, max),
  );
  const current = normalizeRange(isControlled ? value : internal, min, max);

  // Latest value for event handlers; several pointermoves can arrive before a re-render.
  const valueRef = useRef(current);
  valueRef.current = current;

  const railRef = useRef<HTMLDivElement>(null);
  const thumbRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)] as const;
  const labelRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)] as const;

  /** Thumb being dragged: 0/1, `null` = undecided (thumbs stacked), `undefined` = not dragging. */
  const dragRef = useRef<0 | 1 | null | undefined>(undefined);
  /** Value offset between the pointer and the grabbed thumb's centre, so grabbing doesn't jump. */
  const grabOffsetRef = useRef(0);
  /** Touch press on the track: wait for a move or a tap, since it may turn into a page scroll. */
  const pendingTouchRef = useRef(false);
  const [activeThumb, setActiveThumb] = useState<0 | 1 | null>(null);
  const [merged, setMerged] = useState(false);

  const commit = useCallback(
    (index: 0 | 1, raw: number): RangeValue => {
      const prev = valueRef.current;
      const next = moveThumb(prev, index, raw, { min, max, step, minDistance });
      if (next[0] !== prev[0] || next[1] !== prev[1]) {
        valueRef.current = next;
        if (!isControlled) setInternal(next);
        onChange?.(next);
      }
      return next;
    },
    [min, max, step, minDistance, isControlled, onChange],
  );

  const valueFromClientX = (clientX: number): number | undefined => {
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return undefined;
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return min + ratio * (max - min);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    const raw = valueFromClientX(e.clientX);
    if (raw === undefined) return;
    e.preventDefault(); // no text selection; focus is moved manually below
    e.currentTarget.setPointerCapture?.(e.pointerId);

    const [low, high] = valueRef.current;
    const hit = (e.target as Element).closest?.(".twin-range__thumb")?.getAttribute("data-thumb");
    let thumb: 0 | 1 | null;
    if (hit) {
      // Pressed on a thumb: grab it where it is.
      thumb = low === high ? null : hit === "low" ? 0 : 1;
      grabOffsetRef.current = (hit === "low" ? low : high) - raw;
    } else {
      thumb = pickThumb(valueRef.current, snapToStep(raw, min, step));
      grabOffsetRef.current = 0;
    }

    dragRef.current = thumb;
    pendingTouchRef.current = !hit && e.pointerType === "touch";
    setActiveThumb(thumb);
    thumbRefs[thumb ?? 0].current?.focus({ preventScroll: true });
    // Pressed on the track with a mouse/pen: jump the nearest thumb there right away.
    if (!hit && !pendingTouchRef.current && thumb !== null) commit(thumb, raw);
  };

  const dragTo = (clientX: number) => {
    const raw = valueFromClientX(clientX);
    if (raw === undefined || dragRef.current === undefined) return;
    const target = raw + grabOffsetRef.current;
    if (dragRef.current === null) {
      // Thumbs are stacked: the first movement decides which one comes along.
      const picked = pickThumb(valueRef.current, snapToStep(target, min, step));
      if (picked === null) return;
      dragRef.current = picked;
      setActiveThumb(picked);
      thumbRefs[picked].current?.focus({ preventScroll: true });
    }
    commit(dragRef.current, target);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current === undefined) return;
    pendingTouchRef.current = false;
    dragTo(e.clientX);
  };

  const finishPointer = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    if (dragRef.current === undefined) return;
    const wasPendingTouch = pendingTouchRef.current;
    if (wasPendingTouch && !cancelled) dragTo(e.clientX); // a tap on the track
    dragRef.current = undefined;
    pendingTouchRef.current = false;
    setActiveThumb(null);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    // A touch that the browser took over for scrolling never changed anything.
    if (!(wasPendingTouch && cancelled)) onChangeEnd?.(valueRef.current);
  };

  const handleKeyDown = (index: 0 | 1) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const v = valueRef.current[index];
    const bigStep = Math.max(step, snapToStep((max - min) / 10, 0, step));
    let target: number;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        target = v + step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        target = v - step;
        break;
      case "PageUp":
        target = v + bigStep;
        break;
      case "PageDown":
        target = v - bigStep;
        break;
      case "Home":
        target = min;
        break;
      case "End":
        target = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    const prev = valueRef.current;
    const next = commit(index, target);
    if (next[0] !== prev[0] || next[1] !== prev[1]) onChangeEnd?.(next);
  };

  // Merge labels when they would overlap. Runs after every render (values, formatting
  // and fonts all change label widths) and on resize; only sets state when it flips.
  const measure = useCallback(() => {
    const low = labelRefs[0].current;
    const high = labelRefs[1].current;
    if (!low || !high) return;
    const next = labelsCollide(low.getBoundingClientRect(), high.getBoundingClientRect(), mergeGap);
    setMerged((m) => (m === next ? m : next));
  }, [mergeGap]); // label refs are stable

  useIsoLayoutEffect(() => {
    if (showLabels) measure();
  });

  useEffect(() => {
    const rail = railRef.current;
    if (!showLabels || !rail || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(rail);
    return () => ro.disconnect();
  }, [showLabels, measure]);

  const [low, high] = current;
  const pLow = valueToPercent(low, min, max);
  const pHigh = valueToPercent(high, min, max);
  const labels = [formatLabel(low), formatLabel(high)] as const;
  const mergedContent =
    low === high
      ? labels[0]
      : formatMergedLabel
        ? formatMergedLabel(low, high)
        : (
            <>
              {labels[0]} – {labels[1]}
            </>
          );

  const ariaText = (node: ReactNode) =>
    typeof node === "string" || typeof node === "number" ? String(node) : undefined;

  const bounds: [[number, number], [number, number]] = [
    [min, Math.max(min, high - minDistance)],
    [Math.min(max, low + minDistance), max],
  ];

  return (
    <div
      id={id}
      className={["twin-range", className].filter(Boolean).join(" ")}
      style={style}
      data-disabled={disabled || undefined}
      data-merged={(showLabels && merged) || undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => finishPointer(e, false)}
      onPointerCancel={(e) => finishPointer(e, true)}
    >
      <div className="twin-range__rail" ref={railRef}>
        {showBounds && (
          <>
            <div className="twin-range__bound" data-bound="min" aria-hidden="true">
              {formatLabel(min)}
            </div>
            <div className="twin-range__bound" data-bound="max" aria-hidden="true">
              {formatLabel(max)}
            </div>
          </>
        )}

        <div className="twin-range__track" />
        <div
          className="twin-range__fill"
          style={{ left: `${pLow}%`, width: `${pHigh - pLow}%` }}
        />

        {([0, 1] as const).map((i) => (
          <div
            key={i}
            ref={thumbRefs[i]}
            className="twin-range__thumb"
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={ariaLabel[i]}
            aria-orientation="horizontal"
            aria-valuemin={bounds[i][0]}
            aria-valuemax={bounds[i][1]}
            aria-valuenow={current[i]}
            aria-valuetext={ariaText(labels[i])}
            aria-disabled={disabled || undefined}
            data-active={activeThumb === i || undefined}
            data-thumb={i === 0 ? "low" : "high"}
            // Past the midpoint the low thumb is the one that can still move, so draw it on top.
            style={{ left: `${i === 0 ? pLow : pHigh}%`, zIndex: i === 0 && pLow > 50 ? 3 : 2 }}
            onKeyDown={handleKeyDown(i)}
          />
        ))}

        {showLabels && (
          <>
            {([0, 1] as const).map((i) => (
              <div
                key={i}
                ref={labelRefs[i]}
                className="twin-range__label"
                aria-hidden="true"
                data-hidden={merged || undefined}
                data-thumb={i === 0 ? "low" : "high"}
                style={{ left: `${i === 0 ? pLow : pHigh}%` }}
              >
                {labels[i]}
              </div>
            ))}
            <div
              className="twin-range__label twin-range__label--merged"
              aria-hidden="true"
              data-hidden={!merged || undefined}
              style={{ left: `${(pLow + pHigh) / 2}%` }}
            >
              {mergedContent}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
