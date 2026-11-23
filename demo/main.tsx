import { StrictMode, useState, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { TwinRange, formatTime, type RangeValue } from "twin-range";
import "twin-range/styles.css";

function Example({
  title,
  hint,
  initial,
  ...props
}: { title: string; hint: string; initial: RangeValue } & Omit<
  ComponentProps<typeof TwinRange>,
  "value" | "onChange" | "onChangeEnd"
>) {
  const [value, setValue] = useState<RangeValue>(initial);
  const [ended, setEnded] = useState<RangeValue | null>(null);
  return (
    <section>
      <h2>{title}</h2>
      <p>{hint}</p>
      <TwinRange {...props} value={value} onChange={setValue} onChangeEnd={setEnded} />
      <output>
        onChange: [{value.join(", ")}] · onChangeEnd: {ended ? `[${ended.join(", ")}]` : "—"}
      </output>
    </section>
  );
}

function App() {
  const [disabled, setDisabled] = useState(false);
  return (
    <>
      <h1>twin-range</h1>
      <label>
        <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />{" "}
        disable all
      </label>
      <br />
      <br />

      <Example
        title="Price"
        hint="Drag the thumbs together: the labels merge into one."
        className="price"
        min={1}
        max={2000}
        initial={[150, 1600]}
        minDistance={1}
        formatLabel={(v) => `$${v.toLocaleString()}`}
        disabled={disabled}
      />

      <Example
        title="Departure time"
        hint="Minutes since midnight shown with formatTime, step 15, with fixed min/max labels."
        min={0}
        max={1440}
        step={15}
        initial={[360, 1080]}
        minDistance={15}
        formatLabel={formatTime}
        showBounds
        disabled={disabled}
      />

      <Example
        title="Duration (thumbs may meet)"
        hint="minDistance 0: put both thumbs on the same value, then drag left or right to pull one out."
        min={60}
        max={1800}
        step={5}
        initial={[300, 900]}
        formatLabel={(m) => `${Math.floor(m / 60)}h ${m % 60}m`}
        disabled={disabled}
      />

      <Example
        title="Keyboard"
        hint="Tab to a thumb, then use arrow keys, PageUp/PageDown, Home/End."
        initial={[20, 80]}
        disabled={disabled}
      />

      <p className="tall">
        (Extra space so you can check on a phone that vertical swipes over a slider still scroll
        the page.)
      </p>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
