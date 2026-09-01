import { describe, expect, it } from "vitest";
import { node } from "@/lib/circuit/graph";
import { breathingLamp } from "@/lib/circuit/breathing-lamp";
import { smartParkingBarrier } from "@/lib/circuit/smart-parking-barrier";
import { wirePath, wirePointAt } from "@/lib/circuit/routing";

/**
 * A cable and a component's own lead are two different objects.
 *
 * Chapter one is made entirely of legs, and it was routed as though it were
 * made of Dupont cables: each end left the join *away* from the other, which is
 * right for a wire rising out of two holes and sagging between them and
 * backwards the moment one end is a hole and the other is a part standing above
 * it. The resistor's leg was drawn diving nine units through the PCB below `D9`
 * and coming back up; so was the LED's long leg below `D13`.
 *
 * Nine units is invisible on the capstone, where the whole desk is in frame.
 * On this bench the parts stand in the header and a person zooms to 287% to
 * choose between two holes 9.9 units apart.
 */

/** Twenty points along the drawn path — enough to catch an overshoot. */
const along = (
  from: ReturnType<typeof node>,
  to: ReturnType<typeof node>,
  medium: "jumper" | "leg",
) =>
  Array.from({ length: 21 }, (_, i) =>
    wirePointAt(from, to, i / 20, medium),
  );

describe("a leg is routed as a leg", () => {
  const legs = breathingLamp.observed.map((connection) => ({
    connection,
    from: node(breathingLamp, connection.from),
    to: node(breathingLamp, connection.to),
  }));

  it("chapter one has no cables in it at all", () => {
    expect(legs.length).toBeGreaterThan(0);
    for (const { connection } of legs) {
      expect(connection.medium).toBe("leg");
    }
  });

  it("never reaches past the hole it goes into", () => {
    for (const { from, to } of legs) {
      const hole = from.kind === "terminal" ? to : from;
      if (hole.kind === "terminal") continue;
      const deepest = Math.max(
        ...along(from, to, "leg").map((point) => point.y),
      );
      /* The board is where a leg stops. One unit of slack for the round cap
         the stroke is drawn with; nine — the jumper's exit stub — is a leg
         through the PCB. */
      expect(deepest).toBeLessThanOrEqual(hole.y + 1);
    }
  });

  it("starts and ends exactly on its two leads", () => {
    for (const { from, to } of legs) {
      const d = wirePath(from, to, "leg");
      expect(d.startsWith(`M ${from.x} ${from.y} `)).toBe(true);
      expect(d.endsWith(` ${to.x} ${to.y}`)).toBe(true);
      const points = along(from, to, "leg");
      expect(points[0]).toEqual({ x: from.x, y: from.y });
      expect(points[20]).toEqual({ x: to.x, y: to.y });
    }
  });

  it("does not sag: two leads in the air are joined by the shortest line", () => {
    const middle = legs.find(
      ({ from, to }) => from.kind === "terminal" && to.kind === "terminal",
    );
    /* Chapter one's whole lesson is this join — the LED's long leg onto the
       resistor's. If it stops existing, this test is asserting nothing. */
    expect(middle).toBeDefined();
    const { from, to } = middle!;
    for (const [i, point] of along(from, to, "leg").entries()) {
      const t = i / 20;
      expect(point.x).toBeCloseTo(from.x + (to.x - from.x) * t, 6);
      expect(point.y).toBeCloseTo(from.y + (to.y - from.y) * t, 6);
    }
  });
});

/**
 * The capstone is wired with jumpers and is not being touched.
 *
 * `medium` defaults to `jumper`, so every call site that has not been told
 * about legs keeps the exact path it drew before — this pins that, on the
 * build that has the most to lose from a routing change.
 */
describe("a jumper still sags out of its holes", () => {
  it("chapter six's paths are unchanged by the leg branch", () => {
    for (const connection of smartParkingBarrier.observed) {
      const from = node(smartParkingBarrier, connection.from);
      const to = node(smartParkingBarrier, connection.to);
      expect(connection.medium ?? "jumper").toBe("jumper");
      expect(wirePath(from, to)).toBe(wirePath(from, to, "jumper"));
      /* Four commands, the shape `wirePath` has always emitted: out of one
         hole, across on a sagging curve, into the other. */
      expect(wirePath(from, to)).toMatch(/^M .+ L .+ Q .+ L .+$/);
    }
  });

  it("a label still sits on the cable it names", () => {
    const connection = smartParkingBarrier.observed[0];
    const from = node(smartParkingBarrier, connection.from);
    const to = node(smartParkingBarrier, connection.to);
    const mid = wirePointAt(from, to, 0.5);
    const sagged = wirePointAt(from, to, 0.5, "leg");
    /* Not the same point — which is exactly why the pill has to be told which
       route it belongs to. */
    expect(mid).not.toEqual(sagged);
  });
});
