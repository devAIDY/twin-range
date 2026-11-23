import { StrictMode, useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { DurationRange, TimeRange, TwinRange, type RangeValue } from "twin-range";
import "twin-range/styles.css";
import pkg from "../package.json";
import { cssVars, helpers, keys, presetDefaults, twinRangeProps, type Row } from "./api";
import { FilterPanel } from "./FilterPanel";

const REPO = "https://github.com/devAIDY/twin-range";
const NPM = "https://www.npmjs.com/package/twin-range";

const money = (v: number) => `$${v.toLocaleString("en-US")}`;

/* ---------------- small building blocks ---------------- */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (http, permissions). The code is still selectable.
    }
  };
  return (
    <button type="button" className="copy" onClick={copy}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Code({ children, label }: { children: string; label?: string }) {
  return (
    <div className="code">
      {label && <div className="code-label">{label}</div>}
      <pre>
        <code>{children}</code>
      </pre>
      <CopyButton text={children} />
    </div>
  );
}

const MANAGERS = {
  npm: "npm install twin-range",
  yarn: "yarn add twin-range",
  pnpm: "pnpm add twin-range",
} as const;
type Manager = keyof typeof MANAGERS;

function readManager(): Manager {
  try {
    const saved = localStorage.getItem("twin-range:pm");
    if (saved && saved in MANAGERS) return saved as Manager;
  } catch {
    // storage unavailable
  }
  return "npm";
}

function Install() {
  const [pm, setPm] = useState<Manager>(readManager);
  const choose = (next: Manager) => {
    setPm(next);
    try {
      localStorage.setItem("twin-range:pm", next);
    } catch {
      // storage unavailable
    }
  };
  return (
    <div className="install">
      <div className="tabs" role="tablist" aria-label="Package manager">
        {(Object.keys(MANAGERS) as Manager[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={pm === m}
            className="tab"
            onClick={() => choose(m)}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="code code--install">
        <pre>
          <code>{MANAGERS[pm]}</code>
        </pre>
        <CopyButton text={MANAGERS[pm]} />
      </div>
    </div>
  );
}

function Example({
  id,
  title,
  children,
  note,
  code,
  css,
}: {
  id: string;
  title: string;
  children: ReactNode;
  note?: ReactNode;
  code: string;
  css?: string;
}) {
  return (
    <section className="example" id={id} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`}>
        <a href={`#${id}`}>{title}</a>
      </h3>
      {note && <p>{note}</p>}
      <div className="preview">{children}</div>
      <Code label={css ? "TSX" : undefined}>{code}</Code>
      {css && <Code label="CSS">{css}</Code>}
    </section>
  );
}

function Table({ rows, head }: { rows: Row[]; head: [string, string, string] | [string, string] }) {
  const hasType = head.length === 3 && rows.some((r) => r.type);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>
                <code>{r.name}</code>
                {hasType && r.type && <div className="type">{r.type}</div>}
              </td>
              {head.length === 3 && <td>{r.def && <code>{r.def}</code>}</td>}
              <td>{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- live examples ---------------- */

function PriceExample() {
  const [price, setPrice] = useState<RangeValue>([150, 1600]);
  const [ended, setEnded] = useState<RangeValue | null>(null);
  return (
    <>
      <TwinRange
        min={89}
        max={2400}
        value={price}
        onChange={setPrice}
        onChangeEnd={setEnded}
        formatLabel={money}
      />
      <p className="readout">
        onChange: {money(price[0])} – {money(price[1])}
        <br />
        onChangeEnd: {ended ? `${money(ended[0])} – ${money(ended[1])}` : "not called yet"}
      </p>
    </>
  );
}

/* ---------------- page ---------------- */

const NAV: [string, string][] = [
  ["install", "Install"],
  ["basic", "Basic"],
  ["controlled", "Controlled"],
  ["merging", "Merging labels"],
  ["time", "TimeRange"],
  ["duration", "DurationRange"],
  ["styling", "Styling"],
  ["disabled", "Disabled"],
  ["props", "Props"],
  ["presets", "Presets and helpers"],
  ["css", "CSS variables"],
  ["keyboard", "Keyboard"],
];

const NAV_IDS = NAV.map(([id]) => id);

/**
 * Which section the reader is in: the last one whose top has passed just below the top bar.
 * A clicked link stays highlighted until the reader scrolls themselves, because sections near
 * the bottom can't scroll up to the top bar.
 */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]!);
  const lockRef = useRef<string | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (lockRef.current) return setActive(lockRef.current);
      let current = ids[0]!;
      for (const id of ids) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= 120) current = id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setActive(atBottom ? ids[ids.length - 1]! : current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const unlock = () => {
      lockRef.current = null;
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Only the reader's own scrolling releases a clicked link.
    for (const type of ["wheel", "touchmove", "keydown"]) window.addEventListener(type, unlock, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      for (const type of ["wheel", "touchmove", "keydown"]) window.removeEventListener(type, unlock);
    };
  }, [ids]);

  const select = (id: string) => {
    lockRef.current = id;
    setActive(id);
  };
  return [active, select] as const;
}

function App() {
  const [active, select] = useActiveSection(NAV_IDS);

  // The page renders after the browser has tried to jump to the URL's #section,
  // so links like …/#props would open at the top. Jump once the content exists.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    document.getElementById(id)?.scrollIntoView();
    if (NAV_IDS.includes(id)) select(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#top">
          twin-range <span className="version">v{pkg.version}</span>
        </a>
        <nav className="toplinks" aria-label="Project links">
          <a href={REPO}>GitHub</a>
          <a href={NPM}>npm</a>
        </nav>
      </header>

      <div className="layout" id="top">
        <aside className="sidebar">
          <nav aria-label="On this page">
            {NAV.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={active === id ? "location" : undefined}
                onClick={() => select(id)}
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="content">
          <h1>twin-range</h1>
          <p className="intro">
            A two-thumb range slider for React. Each thumb shows its value above it, and when the two
            labels would overlap they merge into one. Works with mouse, touch and keyboard, renders
            on the server, and has no dependencies.
          </p>

          <section id="install">
            <h2>Install</h2>
            <Install />
            <p>
              Import the stylesheet once, anywhere in your app. Requires React 18 or later.
            </p>
            <Code>{`import "twin-range/styles.css";`}</Code>
          </section>

          <h2 className="group-title">Examples</h2>

          <Example
            id="basic"
            title="Basic"
            note="Uncontrolled: pass a starting value and read results from the callbacks."
            code={`import { TwinRange } from "twin-range";

<TwinRange defaultValue={[20, 80]} />`}
          >
            <TwinRange defaultValue={[20, 80]} />
          </Example>

          <Example
            id="controlled"
            title="Controlled, with formatted labels"
            note={
              <>
                <code>onChange</code> fires while dragging; <code>onChangeEnd</code> fires once when
                you let go, which is the moment to fetch results.
              </>
            }
            code={`const [price, setPrice] = useState<[number, number]>([150, 1600]);

<TwinRange
  min={89}
  max={2400}
  value={price}
  onChange={setPrice}
  onChangeEnd={(range) => searchFlights({ price: range })}
  formatLabel={(v) => \`$\${v.toLocaleString("en-US")}\`}
/>`}
          >
            <PriceExample />
          </Example>

          <Example
            id="merging"
            title="Merging labels"
            note="These start close enough to share one label. Drag them apart and it splits in two."
            code={`<TwinRange
  defaultValue={[44, 52]}
  formatLabel={(v) => \`\${v} km\`}
  formatMergedLabel={(low, high) => \`\${low}–\${high} km\`}
/>`}
          >
            <TwinRange
              defaultValue={[44, 52]}
              formatLabel={(v) => `${v} km`}
              formatMergedLabel={(low, high) => `${low}–${high} km`}
            />
          </Example>

          <Example
            id="time"
            title="TimeRange"
            note={
              <>
                Values are minutes since midnight (<code>360</code> is 6:00 AM). Defaults to the
                whole day in 15-minute steps. <code>showBounds</code> adds the fixed end labels.
              </>
            }
            code={`import { TimeRange } from "twin-range";

<TimeRange defaultValue={[360, 1080]} showBounds />`}
          >
            <TimeRange defaultValue={[360, 1080]} showBounds />
          </Example>

          <Example
            id="duration"
            title="DurationRange"
            note="Values are minutes, shown as hours and minutes. The same component covers trip length and layover time."
            code={`import { DurationRange } from "twin-range";

// Trip duration: 2 to 30 hours
<DurationRange min={120} max={1800} defaultValue={[300, 900]} />

// Layover: 30 minutes to 12 hours
<DurationRange min={30} max={720} step={15} minDistance={15} defaultValue={[60, 240]} />`}
          >
            <div className="stack">
              <div>
                <div className="caption">Trip duration</div>
                <DurationRange min={120} max={1800} defaultValue={[300, 900]} />
              </div>
              <div>
                <div className="caption">Layover</div>
                <DurationRange min={30} max={720} step={15} minDistance={15} defaultValue={[60, 240]} />
              </div>
            </div>
          </Example>

          <Example
            id="styling"
            title="Styling"
            note={
              <>
                Every colour and size is a CSS variable. Set them on your own class; see{" "}
                <a href="#css">CSS variables</a> for the full list.
              </>
            }
            code={`<TwinRange className="teal-range" defaultValue={[25, 60]} />`}
            css={`.teal-range {
  --tr-track-height: 8px;
  --tr-fill-color: #0f766e;
  --tr-thumb-size: 28px;
  --tr-thumb-border: 3px solid #0f766e;
  --tr-label-bg: #0f766e;
  --tr-label-color: #ffffff;
  --tr-label-border: 0;
  --tr-label-radius: 999px;
  --tr-label-padding: 4px 10px;
}`}
          >
            <TwinRange className="teal-range" defaultValue={[25, 60]} />
          </Example>

          <Example id="disabled" title="Disabled" code={`<TwinRange defaultValue={[30, 70]} disabled />`}>
            <TwinRange defaultValue={[30, 70]} disabled />
          </Example>

          <h2 className="group-title">API</h2>

          <section id="props">
            <h3>TwinRange props</h3>
            <Table head={["Prop", "Default", "Description"]} rows={twinRangeProps} />
          </section>

          <section id="presets">
            <h3>TimeRange and DurationRange</h3>
            <p>
              Both accept every <code>TwinRange</code> prop. Only the defaults differ:
            </p>
            <Table head={["Component", "Defaults", "Values"]} rows={presetDefaults} />
            <h3>Helpers</h3>
            <Table head={["Function", "Example", "Result"]} rows={helpers} />
          </section>

          <section id="css">
            <h3>CSS variables</h3>
            <Table head={["Variable", "Default", "Controls"]} rows={cssVars} />
          </section>

          <section id="keyboard">
            <h3>Keyboard</h3>
            <p>Tab to a thumb, then:</p>
            <Table head={["Key", "Action"]} rows={keys} />
          </section>

          <footer className="footer">
            Made by Ankit Yadav. Released under the MIT License.{" "}
            <a href={REPO}>Source on GitHub</a>.
          </footer>
        </main>
      </div>
    </>
  );
}

// `?shot` renders only the flight-filter panel, used for the README screenshot.
// `?dark` gives that panel a dark background.
const params = new URLSearchParams(location.search);
if (params.has("shot")) document.documentElement.dataset.shot = params.has("dark") ? "dark" : "light";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {params.has("shot") ? (
      <div className="shot">
        <FilterPanel />
      </div>
    ) : (
      <App />
    )}
  </StrictMode>,
);
