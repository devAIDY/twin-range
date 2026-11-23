import { describe, expect, it } from "vitest";
import { formatDuration, formatTime, labelsCollide, moveThumb, normalizeRange, pickThumb, snapToStep, valueToPercent } from "../src/utils";

const opts = { min: 0, max: 100, step: 1, minDistance: 0 };

describe("snapToStep", () => {
  it("snaps relative to min", () => {
    expect(snapToStep(7, 0, 5)).toBe(5);
    expect(snapToStep(8, 0, 5)).toBe(10);
    expect(snapToStep(8, 3, 5)).toBe(8);
  });

  it("avoids float noise", () => {
    expect(snapToStep(0.30000000000000004, 0, 0.1)).toBe(0.3);
    expect(snapToStep(0.7, 0, 0.05)).toBe(0.7);
  });
});

describe("valueToPercent", () => {
  it("maps and clamps", () => {
    expect(valueToPercent(25, 0, 100)).toBe(25);
    expect(valueToPercent(150, 0, 100)).toBe(100);
    expect(valueToPercent(5, 5, 5)).toBe(0);
  });
});

describe("normalizeRange", () => {
  it("sorts and clamps", () => {
    expect(normalizeRange([80, 20], 0, 100)).toEqual([20, 80]);
    expect(normalizeRange([-10, 200], 0, 100)).toEqual([0, 100]);
  });
});

describe("moveThumb", () => {
  it("does not let thumbs cross", () => {
    expect(moveThumb([20, 50], 0, 70, opts)).toEqual([50, 50]);
    expect(moveThumb([20, 50], 1, 10, opts)).toEqual([20, 20]);
  });

  it("respects minDistance", () => {
    expect(moveThumb([20, 50], 0, 48, { ...opts, minDistance: 10 })).toEqual([40, 50]);
    expect(moveThumb([20, 50], 1, 21, { ...opts, minDistance: 10 })).toEqual([20, 30]);
  });

  it("snaps and clamps to bounds", () => {
    expect(moveThumb([20, 50], 0, -5, { ...opts, step: 10 })).toEqual([0, 50]);
    expect(moveThumb([20, 50], 1, 64, { ...opts, step: 10 })).toEqual([20, 60]);
  });
});

describe("pickThumb", () => {
  it("picks the nearest thumb", () => {
    expect(pickThumb([20, 80], 30)).toBe(0);
    expect(pickThumb([20, 80], 70)).toBe(1);
  });

  it("defers the choice when thumbs are stacked at the press point", () => {
    expect(pickThumb([50, 50], 50)).toBeNull();
    expect(pickThumb([50, 50], 40)).toBe(0);
    expect(pickThumb([50, 50], 60)).toBe(1);
  });
});

describe("formatTime", () => {
  it("formats minutes since midnight as a 12-hour time", () => {
    expect(formatTime(0)).toBe("12:00 AM");
    expect(formatTime(615)).toBe("10:15 AM");
    expect(formatTime(720)).toBe("12:00 PM");
    expect(formatTime(1439)).toBe("11:59 PM");
    expect(formatTime(Number.NaN)).toBe("");
  });
});

describe("formatDuration", () => {
  it("short style", () => {
    expect(formatDuration(330)).toBe("5h 30m");
    expect(formatDuration(300)).toBe("5h 0m");
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(0)).toBe("0h 0m");
    expect(formatDuration(89.6)).toBe("1h 30m");
  });

  it("long style", () => {
    expect(formatDuration(330, "long")).toBe("5 hours 30 minutes");
    expect(formatDuration(60, "long")).toBe("1 hour");
    expect(formatDuration(1, "long")).toBe("1 minute");
    expect(formatDuration(0, "long")).toBe("0 minutes");
  });
});

describe("labelsCollide", () => {
  it("uses the gap", () => {
    expect(labelsCollide({ left: 0, right: 40 }, { left: 50, right: 90 }, 4)).toBe(false);
    expect(labelsCollide({ left: 0, right: 40 }, { left: 43, right: 90 }, 4)).toBe(true);
  });
});
