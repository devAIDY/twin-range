import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { TwinRange, formatTime, type RangeValue } from "../src";

const RAIL_WIDTH = 100;
const LABEL_WIDTH = 20;

// jsdom has no layout. Fake it: the rail is 100px wide at x=0, and each label is 20px wide,
// centred on its CSS `left` percentage — enough to exercise pointer math and label merging.
beforeEach(() => {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const el = this as HTMLElement;
    const rect = (left: number, width: number) =>
      ({ left, right: left + width, width, top: 0, bottom: 0, height: 0, x: left, y: 0 }) as DOMRect;
    if (el.classList.contains("twin-range__rail")) return rect(0, RAIL_WIDTH);
    if (el.classList.contains("twin-range__label")) {
      const center = (parseFloat(el.style.left) / 100) * RAIL_WIDTH;
      return rect(center - LABEL_WIDTH / 2, LABEL_WIDTH);
    }
    return rect(0, 0);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const thumbs = () => screen.getAllByRole("slider") as [HTMLElement, HTMLElement];

describe("TwinRange", () => {
  it("renders two sliders with ARIA bounds that respect the other thumb", () => {
    render(<TwinRange defaultValue={[20, 80]} minDistance={5} />);
    const [low, high] = thumbs();
    expect(low).toHaveAttribute("aria-valuenow", "20");
    expect(low).toHaveAttribute("aria-valuemax", "75");
    expect(high).toHaveAttribute("aria-valuenow", "80");
    expect(high).toHaveAttribute("aria-valuemin", "25");
  });

  it("moves with the keyboard and fires onChange + onChangeEnd", () => {
    const onChange = vi.fn();
    const onChangeEnd = vi.fn();
    render(<TwinRange defaultValue={[20, 80]} onChange={onChange} onChangeEnd={onChangeEnd} />);
    const [low, high] = thumbs();

    fireEvent.keyDown(low, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith([21, 80]);
    expect(onChangeEnd).toHaveBeenLastCalledWith([21, 80]);

    fireEvent.keyDown(high, { key: "PageDown" });
    expect(onChange).toHaveBeenLastCalledWith([21, 70]);

    fireEvent.keyDown(low, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith([70, 70]);

    onChange.mockClear();
    fireEvent.keyDown(high, { key: "ArrowLeft" }); // blocked by the low thumb
    expect(onChange).not.toHaveBeenCalled();
  });

  it("works controlled", () => {
    function Controlled() {
      const [v, setV] = useState<RangeValue>([10, 90]);
      return <TwinRange value={v} onChange={setV} step={5} />;
    }
    render(<Controlled />);
    fireEvent.keyDown(thumbs()[1]!, { key: "ArrowLeft" });
    expect(thumbs()[1]).toHaveAttribute("aria-valuenow", "85");
  });

  it("drags the nearest thumb and reports onChangeEnd on release", () => {
    const onChangeEnd = vi.fn();
    const { container } = render(<TwinRange defaultValue={[20, 80]} onChangeEnd={onChangeEnd} />);
    const root = container.firstElementChild!;

    fireEvent.pointerDown(root, { clientX: 70, button: 0, pointerId: 1 });
    expect(thumbs()[1]).toHaveAttribute("aria-valuenow", "70");
    fireEvent.pointerMove(root, { clientX: 64, pointerId: 1 });
    fireEvent.pointerUp(root, { clientX: 64, pointerId: 1 });

    expect(thumbs()[1]).toHaveAttribute("aria-valuenow", "64");
    expect(thumbs()[0]).toHaveAttribute("aria-valuenow", "20");
    expect(onChangeEnd).toHaveBeenCalledOnce();
    expect(onChangeEnd).toHaveBeenCalledWith([20, 64]);
  });

  it("lets the drag direction pick a thumb when both are stacked", () => {
    const { container } = render(<TwinRange defaultValue={[50, 50]} />);
    const root = container.firstElementChild!;
    fireEvent.pointerDown(root, { clientX: 50, button: 0, pointerId: 1 });
    fireEvent.pointerMove(root, { clientX: 30, pointerId: 1 });
    fireEvent.pointerUp(root, { pointerId: 1 });
    expect(thumbs()[0]).toHaveAttribute("aria-valuenow", "30");
    expect(thumbs()[1]).toHaveAttribute("aria-valuenow", "50");
  });

  it("merges labels when they overlap and splits them again", () => {
    const { container, rerender } = render(
      <TwinRange value={[10, 90]} formatLabel={(v) => `$${v}`} />,
    );
    const root = container.firstElementChild!;
    const merged = container.querySelector(".twin-range__label--merged")!;
    expect(root).not.toHaveAttribute("data-merged");
    expect(merged).toHaveAttribute("data-hidden");

    // Labels are 20px wide at 40% and 55% → 15px apart → overlap.
    rerender(<TwinRange value={[40, 55]} formatLabel={(v) => `$${v}`} />);
    expect(root).toHaveAttribute("data-merged");
    expect(merged).not.toHaveAttribute("data-hidden");
    expect(merged).toHaveTextContent("$40 – $55");

    rerender(<TwinRange value={[40, 55]} formatLabel={(v) => `$${v}`} mergeGap={-10} />);
    expect(root).not.toHaveAttribute("data-merged");
  });

  it("shows a single value when merged thumbs are equal, and supports custom merged text", () => {
    const { container, rerender } = render(<TwinRange value={[50, 50]} />);
    const merged = container.querySelector(".twin-range__label--merged")!;
    expect(merged).toHaveTextContent(/^50$/);

    rerender(<TwinRange value={[48, 52]} formatMergedLabel={(a, b) => `${a} to ${b}`} />);
    expect(merged).toHaveTextContent("48 to 52");
  });

  it("grabs a thumb where it is pressed instead of jumping to the pointer", () => {
    const { container } = render(<TwinRange defaultValue={[20, 80]} />);
    const root = container.firstElementChild!;
    // Press 3px right of the low thumb's centre.
    fireEvent.pointerDown(thumbs()[0], { clientX: 23, button: 0, pointerId: 1 });
    expect(thumbs()[0]).toHaveAttribute("aria-valuenow", "20");
    fireEvent.pointerMove(root, { clientX: 33, pointerId: 1 });
    expect(thumbs()[0]).toHaveAttribute("aria-valuenow", "30");
  });

  it("treats a touch on the track as a tap only on release, and ignores scroll-cancelled touches", () => {
    const onChange = vi.fn();
    const onChangeEnd = vi.fn();
    const { container } = render(
      <TwinRange defaultValue={[20, 80]} onChange={onChange} onChangeEnd={onChangeEnd} />,
    );
    const root = container.firstElementChild!;
    const touch = { button: 0, pointerId: 1, pointerType: "touch" };

    // The browser takes the gesture over for vertical scrolling.
    fireEvent.pointerDown(root, { ...touch, clientX: 40 });
    fireEvent.pointerCancel(root, { ...touch, clientX: 40 });
    expect(onChange).not.toHaveBeenCalled();
    expect(onChangeEnd).not.toHaveBeenCalled();

    // A plain tap moves the nearest thumb on release.
    fireEvent.pointerDown(root, { ...touch, clientX: 40 });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerUp(root, { ...touch, clientX: 40 });
    expect(onChange).toHaveBeenLastCalledWith([40, 80]);
    expect(onChangeEnd).toHaveBeenLastCalledWith([40, 80]);
  });

  it("can show fixed min/max labels", () => {
    const { container } = render(<TwinRange min={0} max={1440} showBounds formatLabel={formatTime} />);
    const bounds = container.querySelectorAll(".twin-range__bound");
    expect([...bounds].map((b) => b.textContent)).toEqual(["12:00 AM", "12:00 AM"]);
    expect(thumbs()[1]).toHaveAttribute("aria-valuetext", "12:00 AM");
  });

  it("ignores input when disabled", () => {
    const onChange = vi.fn();
    const { container } = render(<TwinRange disabled defaultValue={[20, 80]} onChange={onChange} />);
    fireEvent.keyDown(thumbs()[0]!, { key: "ArrowRight" });
    fireEvent.pointerDown(container.firstElementChild!, { clientX: 50, button: 0, pointerId: 1 });
    expect(onChange).not.toHaveBeenCalled();
    expect(thumbs()[0]).toHaveAttribute("tabindex", "-1");
  });

  it("can hide labels", () => {
    const { container } = render(<TwinRange showLabels={false} />);
    expect(container.querySelector(".twin-range__label")).toBeNull();
  });
});
