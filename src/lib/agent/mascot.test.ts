import { describe, expect, it } from "vitest";
import {
  GRIP_AT,
  SEAT_AT,
  durationOf,
  frameAt,
  type MascotJob,
} from "@/lib/agent/mascot";

/**
 * The ring is drawn from a clock, and the two things it has to get right are
 * both invisible to a typecheck: it must *arrive* at the place the call is
 * about, and on a carry it must arrive there **exactly** when the write lands.
 * `attach_lead` waits `SEAT_AT` before it commits, so if that constant and the
 * flight ever disagree the part moves without the thing that moved it.
 *
 * Nothing here asserts what the animation looks like. These are the four facts
 * the rest of the product depends on.
 */

const TARGET = { x: 400, y: 300 };
const SOURCE = { x: 120, y: 260 };

const near = (a: number, b: number, slack = 1.5) => Math.abs(a - b) <= slack;

describe("the ring's flight", () => {
  it("is not on the bench before or after its job", () => {
    const job: MascotJob = { kind: "point", at: TARGET };
    expect(frameAt(job, 0)).toBeNull();
    expect(frameAt(job, -100)).toBeNull();
    expect(frameAt(job, durationOf(job))).toBeNull();
    expect(frameAt(job, durationOf(job) + 500)).toBeNull();
  });

  it("comes from somewhere and lands on the place it was sent to", () => {
    const job: MascotJob = { kind: "point", at: TARGET };

    /* Early: still on its way in, and wide. A ring that starts closed on the
       pin is a highlight, which is the thing this replaces. */
    const arriving = frameAt(job, 60)!;
    expect(Math.hypot(arriving.x - TARGET.x, arriving.y - TARGET.y)).toBeGreaterThan(80);
    expect(arriving.r).toBeGreaterThan(40);

    /* Docked: on the pin, tight, arms out. */
    const held = frameAt(job, durationOf(job) - 300)!;
    expect(near(held.x, TARGET.x)).toBe(true);
    expect(near(held.y, TARGET.y)).toBe(true);
    expect(held.r).toBeLessThan(14);
    expect(held.dock).toBeGreaterThan(0.9);
  });

  it("seats a carried lead at the moment the tool commits", () => {
    const job: MascotJob = { kind: "carry", from: SOURCE, to: TARGET };

    /* It has hold of the lead where the lead is, not where it is going. */
    const gripping = frameAt(job, GRIP_AT - 20)!;
    expect(near(gripping.x, SOURCE.x, 2)).toBe(true);
    expect(gripping.dock).toBeGreaterThan(0.9);

    /* And it is over the destination on the frame the write lands. The lift
       is still unwinding, so the y is checked with the arc's slack. */
    const seating = frameAt(job, SEAT_AT - 1)!;
    expect(near(seating.x, TARGET.x, 2)).toBe(true);
    expect(near(seating.y, TARGET.y, 3)).toBe(true);

    expect(SEAT_AT).toBeGreaterThan(GRIP_AT);
    expect(durationOf(job)).toBeGreaterThan(SEAT_AT);
  });

  it("visits every place a read is about", () => {
    const stops = [
      { x: 100, y: 100 },
      { x: 500, y: 140 },
      { x: 320, y: 400 },
    ];
    const job: MascotJob = { kind: "read", over: stops };

    /* Each stop is reached by the end of its own beat — the ring reads them in
       the order they were given rather than settling on the first. */
    const plan = durationOf(job);
    for (const [index, stop] of stops.entries()) {
      const at = ((index + 1) * (plan - 260 - 320)) / stops.length + 320;
      const ring = frameAt(job, at - 1)!;
      expect(near(ring.x, stop.x, 3)).toBe(true);
      expect(near(ring.y, stop.y, 3)).toBe(true);
      /* Never closed: reading is not working on something. */
      expect(ring.dock).toBe(0);
    }
  });

  it("fades in and out rather than appearing", () => {
    const job: MascotJob = { kind: "point", at: TARGET };
    expect(frameAt(job, 8)!.opacity).toBeLessThan(0.6);
    expect(frameAt(job, durationOf(job) - 500)!.opacity).toBeGreaterThan(0.95);
    expect(frameAt(job, durationOf(job) - 10)!.opacity).toBeLessThan(0.1);
  });
});
