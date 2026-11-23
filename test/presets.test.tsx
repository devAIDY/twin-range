import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DurationRange, TimeRange } from "../src";

afterEach(cleanup);

const thumbs = () => screen.getAllByRole("slider") as [HTMLElement, HTMLElement];

describe("TimeRange", () => {
  it("covers a whole day in 15-minute steps with clock labels", () => {
    const { container } = render(<TimeRange defaultValue={[360, 1080]} />);
    const [low, high] = thumbs();
    expect(low).toHaveAttribute("aria-label", "Earliest time");
    expect(low).toHaveAttribute("aria-valuetext", "06:00 AM");
    expect(high).toHaveAttribute("aria-valuetext", "06:00 PM");
    expect(high).toHaveAttribute("aria-valuemax", "1440");

    fireEvent.keyDown(low, { key: "ArrowRight" });
    expect(low).toHaveAttribute("aria-valuenow", "375");
    expect(container.querySelector(".twin-range__label")).toHaveTextContent("06:15 AM");
  });

  it("lets every default be overridden", () => {
    render(<TimeRange min={300} max={1200} step={30} ariaLabel={["From", "To"]} />);
    const [low, high] = thumbs();
    expect(low).toHaveAttribute("aria-label", "From");
    expect(low).toHaveAttribute("aria-valuenow", "300");
    expect(high).toHaveAttribute("aria-valuenow", "1200");
  });
});

describe("DurationRange", () => {
  it("shows short labels and announces long ones", () => {
    const { container } = render(<DurationRange min={60} max={1800} defaultValue={[90, 330]} />);
    const [low, high] = thumbs();
    expect(low).toHaveAttribute("aria-label", "Minimum duration");
    expect(low).toHaveAttribute("aria-valuetext", "1 hour 30 minutes");
    expect(high).toHaveAttribute("aria-valuetext", "5 hours 30 minutes");
    const labels = container.querySelectorAll(".twin-range__label:not(.twin-range__label--merged)");
    expect([...labels].map((l) => l.textContent)).toEqual(["1h 30m", "5h 30m"]);

    fireEvent.keyDown(high, { key: "ArrowLeft" });
    expect(high).toHaveAttribute("aria-valuenow", "325");
  });
});
