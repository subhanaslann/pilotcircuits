import { describe, expect, it } from "vitest";
import { ECHO } from "@/components/landing/scene/bench-layout";
import {
  CYCLE,
  INSPECTION,
  REPAIR,
  TOTAL,
  getFrame,
  getServerFrame,
} from "@/components/landing/scene/repair-demo";
import {
  GRIP_AT,
  SEAT_AT,
  durationOf,
  frameAt,
  type Resolve,
} from "@/lib/agent/mascot";

/**
 * The seam between the film and the ring.
 *
 * The entry screen's cable is moved by `repair-demo.ts` on its own clock, and
 * the ring that appears to move it is `lib/agent/mascot.ts` on another. They
 * are started on the same frame and agree only because the film reads the
 * ring's exported beats — so this is the tripwire for someone retuning one
 * side: the leg must be in its hole until the ring has taken hold, in the air
 * exactly while the ring travels, and seated on the frame the ring arrives.
 *
 * The store is a module singleton, so the fixing frames are read through the
 * pure `fixingFrame` path by reaching it the way the screen does: `getFrame`
 * after `fix`. Driving the clock here would need `requestAnimationFrame`, so
 * the film's clock is not run; the frames are asked for by the numbers the
 * screen would pass.
 */

const identity: Resolve = (a) => (a.kind === "coach" ? { x: 0, y: 0 } : { x: a.x, y: a.y });

describe("the film follows the ring's beats", () => {
  it("opens on the fault, with the leg seated in the wrong hole", () => {
    const first = getServerFrame();
    expect(first.mode).toBe("stuck");
    expect(first.echo).toEqual({ ...ECHO.wrong, lifted: 0 });
    expect(first.red).toBe(1);
    expect(first.green).toBe(0);
    /* The client's first frame is a second object, and must say the same. */
    expect(getFrame()).toEqual(first);
  });

  it("times the run from the ring's seat and the cycle from the run", () => {
    expect(TOTAL).toBeGreaterThan(SEAT_AT);
    expect(CYCLE).toBeGreaterThan(TOTAL);
  });

  it("gives the ring a carry from the wrong hole to the right one", () => {
    expect(REPAIR).toEqual({
      kind: "carry",
      from: { kind: "scene", x: ECHO.wrong.x, y: ECHO.wrong.y },
      to: { kind: "scene", x: ECHO.right.x, y: ECHO.right.y },
    });
    /* And the carry is the flight whose beats the film reads: it has hold of
       the leg at `GRIP_AT` and is over the target at `SEAT_AT`. */
    const held = frameAt(REPAIR, GRIP_AT - 1, {}, identity);
    const seated = frameAt(REPAIR, SEAT_AT, {}, identity);
    expect(held?.x).toBeCloseTo(ECHO.wrong.x, 0);
    expect(seated?.x).toBeCloseTo(ECHO.right.x, 0);
    expect(durationOf(REPAIR, { home: { kind: "coach" } })).toBeLessThan(TOTAL);
  });

  it("reads along the signal path and ends on the wrong hole", () => {
    expect(INSPECTION.kind).toBe("read");
    if (INSPECTION.kind !== "read") return;
    expect(INSPECTION.over).toHaveLength(4);
    expect(INSPECTION.over[INSPECTION.over.length - 1]).toEqual({
      kind: "scene",
      x: ECHO.wrong.x,
      y: ECHO.wrong.y,
    });
  });
});
