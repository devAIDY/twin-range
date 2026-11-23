// Reference tables shown in the demo's API section. Keep in sync with src/ and README.md.

export interface Row {
  name: string;
  type?: string;
  def: string;
  desc: string;
}

export const twinRangeProps: Row[] = [
  { name: "min", type: "number", def: "0", desc: "Lowest selectable value." },
  { name: "max", type: "number", def: "100", desc: "Highest selectable value." },
  { name: "step", type: "number", def: "1", desc: "Value granularity, counted from min." },
  { name: "value", type: "[number, number]", def: "none", desc: "Controlled value. Pair it with onChange." },
  { name: "defaultValue", type: "[number, number]", def: "[min, max]", desc: "Starting value when uncontrolled." },
  { name: "onChange", type: "(value) => void", def: "none", desc: "Called on every change while dragging or pressing keys." },
  {
    name: "onChangeEnd",
    type: "(value) => void",
    def: "none",
    desc: "Called once when an interaction ends: on every pointer release, and after each key press that changed the value. Use it to fetch results.",
  },
  { name: "minDistance", type: "number", def: "0", desc: "Smallest allowed gap between the two values." },
  { name: "disabled", type: "boolean", def: "false", desc: "Turns off pointer and keyboard input." },
  { name: "showLabels", type: "boolean", def: "true", desc: "Shows the floating value labels." },
  { name: "showBounds", type: "boolean", def: "false", desc: "Shows fixed min and max labels at the ends of the track." },
  { name: "formatLabel", type: "(value) => ReactNode", def: "the number", desc: "Label content. A string result is also used as aria-valuetext." },
  { name: "formatMergedLabel", type: "(low, high) => ReactNode", def: "low – high", desc: "Content of the merged label." },
  { name: "getAriaValueText", type: "(value) => string", def: "the label text", desc: "What screen readers announce, when it should differ from the label." },
  { name: "mergeGap", type: "number", def: "4", desc: "Space in px the two labels must keep before they merge." },
  { name: "ariaLabel", type: "[string, string]", def: '["Minimum value", "Maximum value"]', desc: "Accessible names of the two thumbs." },
  { name: "id, className, style", def: "none", desc: "Applied to the root element." },
];

export const presetDefaults: Row[] = [
  { name: "TimeRange", def: "min 0, max 1440, step 15", desc: "Minutes since midnight, labels like 06:00 AM." },
  { name: "DurationRange", def: "min 0, max 1440, step 5", desc: "Minutes, labels like 5h 30m, read aloud as “5 hours 30 minutes”." },
];

export const helpers: Row[] = [
  { name: "formatTime(minutes)", def: "formatTime(615)", desc: "Returns 10:15 AM." },
  { name: "formatDuration(minutes)", def: "formatDuration(330)", desc: "Returns 5h 30m. Under an hour: 45m." },
  { name: 'formatDuration(minutes, "long")', def: 'formatDuration(330, "long")', desc: "Returns 5 hours 30 minutes." },
];

export const cssVars: Row[] = [
  { name: "--tr-track-height", def: "4px", desc: "Track thickness." },
  { name: "--tr-track-color", def: "#e0e0e0", desc: "Unselected part of the track." },
  { name: "--tr-fill-color", def: "#003dc2", desc: "Selected range, and the thumb border." },
  { name: "--tr-thumb-size", def: "24px", desc: "Thumb diameter." },
  { name: "--tr-thumb-color", def: "#ffffff", desc: "Thumb fill." },
  { name: "--tr-thumb-border", def: "2px solid var(--tr-fill-color)", desc: "Thumb outline." },
  { name: "--tr-focus-outline", def: "2px solid #8daee3", desc: "Keyboard focus ring." },
  { name: "--tr-label-bg", def: "#ffffff", desc: "Label background." },
  { name: "--tr-label-color", def: "#339900", desc: "Label text." },
  { name: "--tr-label-border", def: "1px solid #7d7d7d", desc: "Label border." },
  { name: "--tr-label-font-size", def: "16px", desc: "Label text size." },
  { name: "--tr-label-padding", def: "3px 6px", desc: "Label padding." },
  { name: "--tr-label-radius", def: "4px", desc: "Label corner radius." },
  { name: "--tr-label-offset", def: "4px", desc: "Gap between labels and thumbs." },
  { name: "--tr-label-space", def: "30px", desc: "Room reserved above the thumbs for labels." },
  { name: "--tr-gutter", def: "40px", desc: "Side padding, so end labels stay inside." },
  { name: "--tr-transition", def: "150ms ease", desc: "Label fade and merge timing." },
];

export const keys: Row[] = [
  { name: "← ↓", def: "", desc: "One step down." },
  { name: "→ ↑", def: "", desc: "One step up." },
  { name: "Page Down / Page Up", def: "", desc: "A tenth of the range." },
  { name: "Home / End", def: "", desc: "Jump to min or max (stops at the other thumb)." },
];
