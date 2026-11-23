import { useState } from "react";
import { DurationRange, TimeRange, TwinRange, type RangeValue } from "twin-range";

const money = (v: number) => `$${v.toLocaleString("en-US")}`;

/** The flight-filter panel used for the README screenshot (`?shot`). */
export function FilterPanel() {
  const [price, setPrice] = useState<RangeValue>([150, 1600]);
  const [departure, setDeparture] = useState<RangeValue>([360, 1080]);
  const [duration, setDuration] = useState<RangeValue>([300, 900]);
  const [layover, setLayover] = useState<RangeValue>([60, 120]);

  return (
    <div className="panel">
      <div className="filter">
        <h3>
          Price <span>per person</span>
        </h3>
        <TwinRange className="is-price" min={89} max={2400} minDistance={1} value={price} onChange={setPrice} formatLabel={money} />
      </div>
      <div className="filter">
        <h3>
          Departure time <span>TimeRange</span>
        </h3>
        <TimeRange minDistance={15} value={departure} onChange={setDeparture} />
      </div>
      <div className="filter">
        <h3>
          Trip duration <span>DurationRange</span>
        </h3>
        <DurationRange min={120} max={1800} value={duration} onChange={setDuration} />
      </div>
      <div className="filter">
        <h3>
          Layover <span>DurationRange</span>
        </h3>
        <DurationRange min={30} max={720} step={15} minDistance={15} value={layover} onChange={setLayover} />
      </div>
    </div>
  );
}
