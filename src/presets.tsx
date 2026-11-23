import { TwinRange, type TwinRangeProps } from "./TwinRange";
import { formatDuration, formatTime } from "./utils";

const durationLong = (v: number) => formatDuration(v, "long");

/**
 * Time-of-day range. Values are minutes since midnight (`0`–`1440`); labels read `"06:00 AM"`.
 * Every `TwinRange` prop can still be passed to override the defaults.
 */
export function TimeRange({
  min = 0,
  max = 1440,
  step = 15,
  formatLabel = formatTime,
  ariaLabel = ["Earliest time", "Latest time"],
  ...rest
}: TwinRangeProps) {
  return (
    <TwinRange
      min={min}
      max={max}
      step={step}
      formatLabel={formatLabel}
      ariaLabel={ariaLabel}
      {...rest}
    />
  );
}

/**
 * Duration range (trip length, layover, …). Values are minutes; labels read `"5h 30m"` and
 * screen readers hear `"5 hours 30 minutes"`. Every `TwinRange` prop can override the defaults.
 */
export function DurationRange({
  min = 0,
  max = 1440,
  step = 5,
  formatLabel = formatDuration,
  getAriaValueText = durationLong,
  ariaLabel = ["Minimum duration", "Maximum duration"],
  ...rest
}: TwinRangeProps) {
  return (
    <TwinRange
      min={min}
      max={max}
      step={step}
      formatLabel={formatLabel}
      getAriaValueText={getAriaValueText}
      ariaLabel={ariaLabel}
      {...rest}
    />
  );
}
