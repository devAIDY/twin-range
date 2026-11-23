import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  DurationRange,
  TimeRange,
  TwinRange,
  formatDuration,
  formatTime,
  type RangeValue,
} from "twin-range";
import "twin-range/styles.css";

const money = (v: number) => `$${v.toLocaleString("en-US")}`;

type FilterKey = "price" | "departure" | "duration" | "layover";

const FILTERS: Record<FilterKey, { title: string; format: (v: number) => string; initial: RangeValue }> = {
  price: { title: "Price", format: money, initial: [150, 1600] },
  departure: { title: "Departure time", format: formatTime, initial: [360, 1080] },
  duration: { title: "Trip duration", format: formatDuration, initial: [300, 900] },
  layover: { title: "Layover", format: formatDuration, initial: [60, 120] },
};

interface LogEntry {
  id: number;
  filter: FilterKey;
  value: RangeValue;
}

function FilterPanel({
  disabled = false,
  onCommit,
}: {
  disabled?: boolean;
  onCommit?: (filter: FilterKey, value: RangeValue) => void;
}) {
  const [values, setValues] = useState(
    () => Object.fromEntries(Object.entries(FILTERS).map(([k, f]) => [k, f.initial])) as Record<FilterKey, RangeValue>,
  );

  const bind = (key: FilterKey) => ({
    value: values[key],
    onChange: (v: RangeValue) => setValues((prev) => ({ ...prev, [key]: v })),
    onChangeEnd: (v: RangeValue) => onCommit?.(key, v),
    disabled,
  });

  const heading = (key: FilterKey, note: string) => (
    <h3>
      {FILTERS[key].title} <span>{note}</span>
    </h3>
  );

  return (
    <div className="panel">
      <div className="filter">
        {heading("price", "per person")}
        <TwinRange
          className="is-price"
          min={89}
          max={2400}
          minDistance={1}
          formatLabel={money}
          ariaLabel={["Minimum price", "Maximum price"]}
          {...bind("price")}
        />
      </div>
      <div className="filter">
        {heading("departure", "TimeRange")}
        <TimeRange minDistance={15} {...bind("departure")} />
      </div>
      <div className="filter">
        {heading("duration", "DurationRange")}
        <DurationRange min={120} max={1800} {...bind("duration")} />
      </div>
      <div className="filter">
        {heading("layover", "DurationRange")}
        <DurationRange min={30} max={720} step={15} minDistance={15} {...bind("layover")} />
      </div>
    </div>
  );
}

function CopyInstall() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText("npm install twin-range");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked (insecure origin, permissions); the command is still visible.
    }
  };
  return (
    <div className="install">
      <code>npm install twin-range</code>
      <button type="button" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function App() {
  const [hero, setHero] = useState<RangeValue>([180, 640]);
  const [disabled, setDisabled] = useState(false);
  const [dark, setDark] = useState(startDark);
  const [log, setLog] = useState<LogEntry[]>([]);

  const toggleDark = (on: boolean) => {
    setDark(on);
    document.documentElement.dataset.theme = on ? "dark" : "light";
  };

  const commit = (filter: FilterKey, value: RangeValue) =>
    setLog((prev) => [{ id: Date.now() + Math.random(), filter, value }, ...prev].slice(0, 7));

  return (
    <main className="page">
      <header className="hero">
        <h1>twin-range</h1>
        <p className="lede">
          A React range slider with two thumbs. Each thumb carries its value, and when the two labels
          run into each other they join into one.
        </p>
        <CopyInstall />

        <div className="hero-stage">
          <TwinRange
            className="hero-slider"
            min={0}
            max={1000}
            step={10}
            value={hero}
            onChange={setHero}
            formatLabel={money}
            ariaLabel={["Minimum budget", "Maximum budget"]}
          />
        </div>
        <p className="hero-hint">Drag the thumbs toward each other.</p>
      </header>

      <section className="workbench" aria-label="Examples">
        <div>
          <h2>As a flight filter</h2>
          <p className="sub">The sliders this package was built for, with their default look.</p>
          <FilterPanel disabled={disabled} onCommit={commit} />
          <div className="controls">
            <label className="switch">
              <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
              Disable filters
            </label>
            <label className="switch">
              <input type="checkbox" checked={dark} onChange={(e) => toggleDark(e.target.checked)} />
              Dark theme
            </label>
          </div>
        </div>

        <div>
          <h2>What your code receives</h2>
          <p className="sub">
            <code>onChangeEnd</code> fires once when you let go, so you can fetch results then
            instead of on every pixel.
          </p>
          <ul className="log" aria-live="polite">
            {log.length === 0 && <li className="log-empty">Move a filter to see its value here.</li>}
            {log.map((entry) => {
              const { title, format } = FILTERS[entry.filter];
              return (
                <li key={entry.id}>
                  <span className="what">{title}</span>
                  <span className="value">
                    {format(entry.value[0])} – {format(entry.value[1])}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="keys">
            Keyboard: <kbd>Tab</kbd> to a thumb, then <kbd>←</kbd> <kbd>→</kbd> to step,{" "}
            <kbd>PgUp</kbd> <kbd>PgDn</kbd> for bigger steps, <kbd>Home</kbd> <kbd>End</kbd> to jump
            to the ends.
          </p>
        </div>
      </section>
    </main>
  );
}

// `?shot` renders just the filter panel, used to make the README screenshot.
// `?dark` starts in the dark theme.
const params = new URLSearchParams(location.search);
const shot = params.has("shot");
const startDark = params.has("dark");
if (startDark) document.documentElement.dataset.theme = "dark";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {shot ? (
      <div className="shot">
        <FilterPanel />
      </div>
    ) : (
      <App />
    )}
  </StrictMode>,
);
