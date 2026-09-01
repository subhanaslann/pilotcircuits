import { describe, expect, it } from "vitest";
import { framing, mat } from "@/lib/circuit/geometry";
import { lampFitBox, lampStageBox } from "@/lib/circuit/breathing-lamp";
import { lightFitBox, lightStageBox } from "@/lib/circuit/traffic-light";
import { nightFitBox, nightPartBox, nightStageBox } from "@/lib/circuit/motion-night-light";
import { plantFitBox, plantPartBox, plantStageBox } from "@/lib/circuit/plant-guardian";
import { soapFitBox, soapPartBox, soapStageBox } from "@/lib/circuit/touchless-soap";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const right = (b: Rect) => b.x + b.width;
const bottom = (b: Rect) => b.y + b.height;

/**
 * The briefing film's frame, against the bench it is a film of.
 *
 * `stageBox` is the film's viewBox exactly, and it was the chapter's `fitBox` —
 * a box padded by four pitches on all four sides whatever is out there. On
 * three chapters that padding reaches past the mat, so the assembly film opened
 * on a strip of bare oak: 21 units to the left on chapters three, four and
 * five, 36 above chapter three, 56 above chapter five, 39 below chapter four.
 * The parts were on the mat the whole time; only the frame was wrong.
 */
describe("framing", () => {
  it("pads the fit box on all four sides, out to the mat and no further", () => {
    const boxes = [{ x: 300, y: 300, width: 100, height: 100 }];
    const { fit, stage } = framing(boxes, 40);
    expect(fit).toEqual({ x: 260, y: 260, width: 180, height: 180 });
    /* Nowhere near an edge: the two boxes are the same. */
    expect(stage).toEqual(fit);
  });

  it("clips the padding where it would leave the mat", () => {
    const { fit, stage } = framing([{ x: 80, y: 60, width: 100, height: 100 }], 40);
    expect(fit.x).toBe(40);
    expect(stage.x).toBe(mat.x);
    expect(stage.y).toBe(mat.y);
    /* The far side is nowhere near an edge and keeps its air. */
    expect(right(stage)).toBe(right(fit));
  });

  /**
   * And it never crops. Chapter five's sensor stands six units above the mat's
   * top edge — a separate, still-open fault of the DESK — and a stage clamped
   * to the mat would cut the case in half to avoid showing oak, which is the
   * worse of the two mistakes.
   */
  it("follows the content where the content is already past the mat", () => {
    const { stage } = framing([{ x: 40, y: 20, width: 100, height: 100 }], 40);
    expect(stage.x).toBe(40);
    expect(stage.y).toBe(20);
  });
});

describe("every chapter's stage box", () => {
  const chapters = [
    ["chapter one · breathing lamp", lampFitBox, lampStageBox, null],
    ["chapter two · traffic light", lightFitBox, lightStageBox, null],
    ["chapter three · motion night light", nightFitBox, nightStageBox, nightPartBox],
    ["chapter four · plant guardian", plantFitBox, plantStageBox, plantPartBox],
    ["chapter five · touchless soap", soapFitBox, soapStageBox, soapPartBox],
  ] as const;

  it.each(chapters)("%s stays on the mat except where its parts do not", (
    _name,
    _fit,
    stage,
    parts,
  ) => {
    const art = parts ? Object.values(parts as Record<string, Rect>) : [];
    const artLeft = art.length ? Math.min(...art.map((b) => b.x)) : mat.x;
    const artTop = art.length ? Math.min(...art.map((b) => b.y)) : mat.y;
    expect(stage.x).toBeGreaterThanOrEqual(Math.min(mat.x, artLeft));
    expect(stage.y).toBeGreaterThanOrEqual(Math.min(mat.y, artTop));
    expect(right(stage)).toBeLessThanOrEqual(right(mat));
    expect(bottom(stage)).toBeLessThanOrEqual(bottom(mat));
  });

  /* Chapters one and two never left the mat, so their film must not move. */
  it.each([
    ["chapter one", lampFitBox, lampStageBox],
    ["chapter two", lightFitBox, lightStageBox],
  ])("%s frames exactly what it framed before", (_name, fit, stage) => {
    expect(stage).toEqual(fit);
  });

  /* And the canvas's own opening fit is untouched: `fitView` wants its air, and
     this change is about the film. */
  it("leaves fitView's box padded past the mat where it always was", () => {
    /* 21.25 units of oak to the left of the mat, on all three — the measured
       overhang, unchanged, because `fitView` is not what this fixed. */
    for (const fit of [nightFitBox, plantFitBox, soapFitBox]) {
      expect(mat.x - fit.x).toBeCloseTo(21.25, 6);
    }
    expect(nightStageBox.x).toBe(mat.x);
    expect(plantStageBox.x).toBe(mat.x);
    expect(soapStageBox.x).toBe(mat.x);
  });
});
