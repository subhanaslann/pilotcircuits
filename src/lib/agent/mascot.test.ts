import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CARRY_FROM,
  GRIP_AT,
  SEAT_AT,
  carryingPart,
  continueFrom,
  durationOf,
  fly,
  frameAt,
  getTick,
  land,
  reportDrawn,
  type Anchor,
  type MascotJob,
  type Resolve,
  type Ring,
} from "@/lib/agent/mascot";

/**
 * The ring is drawn from a clock, and the two things it has to get right are
 * both invisible to a typecheck: it must *arrive* at the place the call is
 * about, and on a carry it must arrive there **exactly** when the write lands.
 * `attach_lead` waits `SEAT_AT` before it commits, so if that constant and the
 * flight ever disagree the part moves without the thing that moved it.
 *
 * Since the ring left the viewport's transform there are three more: a job
 * that arrives mid-flight continues from the ring as it was last drawn, a
 * ring with a home ends there, and every anchor — a shelf tile in screen
 * pixels, a hole in scene units — goes through the caller's resolver.
 *
 * Nothing here asserts what the animation looks like.
 */

const scene = (x: number, y: number) => ({ kind: "scene" as const, x, y });
const screen = (x: number, y: number) => ({ kind: "screen" as const, x, y });
const COACH: Anchor = { kind: "coach" };

const TARGET = scene(400, 300);
const SOURCE = scene(120, 260);
const LAMP = screen(700, 40);

/** The resolver a test wants: anchors are already pixels, and the coach is at the lamp. */
const asIs: Resolve = (anchor) =>
  anchor.kind === "coach" ? { x: LAMP.x, y: LAMP.y } : { x: anchor.x, y: anchor.y };

const near = (a: number, b: number, slack = 1.5) => Math.abs(a - b) <= slack;

describe("the ring's flight", () => {
  it("is not on the bench before or after its job", () => {
    const job: MascotJob = { kind: "point", at: TARGET };
    expect(frameAt(job, 0, {}, asIs)).toBeNull();
    expect(frameAt(job, -100, {}, asIs)).toBeNull();
    expect(frameAt(job, durationOf(job), {}, asIs)).toBeNull();
    expect(frameAt(job, durationOf(job) + 500, {}, asIs)).toBeNull();
  });

  it("comes from somewhere and lands on the place it was sent to", () => {
    const job: MascotJob = { kind: "point", at: TARGET };

    /* Early: still on its way in, and wide. A ring that starts closed on the
       pin is a highlight, which is the thing this replaces. */
    const arriving = frameAt(job, 60, {}, asIs)!;
    expect(
      Math.hypot(arriving.x - TARGET.x, arriving.y - TARGET.y),
    ).toBeGreaterThan(80);
    expect(arriving.r).toBeGreaterThan(40);

    /* Docked: on the pin, tight, arms out. */
    const held = frameAt(job, durationOf(job) - 300, {}, asIs)!;
    expect(near(held.x, TARGET.x)).toBe(true);
    expect(near(held.y, TARGET.y)).toBe(true);
    expect(held.r).toBeLessThan(14);
    expect(held.dock).toBeGreaterThan(0.9);
  });

  it("seats a carried lead at the moment the tool commits", () => {
    const job: MascotJob = { kind: "carry", from: SOURCE, to: TARGET };

    /* It has hold of the lead where the lead is, not where it is going. */
    const gripping = frameAt(job, GRIP_AT - 20, {}, asIs)!;
    expect(near(gripping.x, SOURCE.x, 2)).toBe(true);
    expect(gripping.dock).toBeGreaterThan(0.9);

    /* And it is over the destination on the frame the write lands. The lift
       is still unwinding, so the y is checked with the arc's slack. */
    const seating = frameAt(job, SEAT_AT - 1, {}, asIs)!;
    expect(near(seating.x, TARGET.x, 2)).toBe(true);
    expect(near(seating.y, TARGET.y, 3)).toBe(true);

    expect(SEAT_AT).toBeGreaterThan(GRIP_AT);
    expect(durationOf(job)).toBeGreaterThan(SEAT_AT);
  });

  it("keeps the two moments the handler waits for", () => {
    /* `services.ts` phases `attach_lead` on these two numbers and the shelf
       fades its tile on the third. The layer's move to screen space changed
       every size and nothing about time. */
    expect(GRIP_AT).toBe(760);
    expect(SEAT_AT).toBe(1160);
    expect(CARRY_FROM).toBe(560);
  });

  it("visits every place a read is about", () => {
    const stops = [scene(100, 100), scene(500, 140), scene(320, 400)];
    const job: MascotJob = { kind: "read", over: stops };

    /* Each stop is reached by the end of its own beat — the ring reads them in
       the order they were given rather than settling on the first. */
    const plan = durationOf(job);
    for (const [index, stop] of stops.entries()) {
      const at = ((index + 1) * (plan - 260 - 320)) / stops.length + 320;
      const ring = frameAt(job, at - 1, {}, asIs)!;
      expect(near(ring.x, stop.x, 3)).toBe(true);
      expect(near(ring.y, stop.y, 3)).toBe(true);
      /* Never closed: reading is not working on something. */
      expect(ring.dock).toBe(0);
    }
  });

  it("fades in and out rather than appearing", () => {
    const job: MascotJob = { kind: "point", at: TARGET };
    expect(frameAt(job, 8, {}, asIs)!.opacity).toBeLessThan(0.6);
    expect(
      frameAt(job, durationOf(job) - 500, {}, asIs)!.opacity,
    ).toBeGreaterThan(0.95);
    expect(frameAt(job, durationOf(job) - 10, {}, asIs)!.opacity).toBeLessThan(
      0.1,
    );
  });
});

describe("where it comes from and where it goes", () => {
  it("leaves from the entry it is given", () => {
    const job: MascotJob = { kind: "point", at: TARGET };
    const first = frameAt(job, 1, { entry: LAMP, arc: 40 }, asIs)!;
    expect(near(first.x, LAMP.x, 2)).toBe(true);
    expect(near(first.y, LAMP.y, 2)).toBe(true);
  });

  it("a continuation starts where the last ring was drawn, at its radius, already visible", () => {
    const last: Ring = { x: 300, y: 200, r: 26, dock: 0, spin: 0, opacity: 1 };
    const opts = continueFrom(last, { home: LAMP });
    const job: MascotJob = { kind: "point", at: TARGET };

    const first = frameAt(job, 1, opts, asIs)!;
    expect(near(first.x, last.x, 2)).toBe(true);
    expect(near(first.y, last.y, 2)).toBe(true);
    expect(first.r).toBe(last.r);
    expect(first.opacity).toBe(1);
    /* What the caller asked for survives the override. */
    expect(opts.home).toEqual(LAMP);
  });

  it("goes home when it has one, and is gone when it gets there", () => {
    const job: MascotJob = { kind: "point", at: TARGET };
    const opts = { home: LAMP };
    const total = durationOf(job, opts);
    /* The return is a journey, not a fade: 420 ms against 260. */
    expect(total).toBe(durationOf(job) + 160);

    /* Still on the hole, fully visible, as the leave begins... */
    const leaving = frameAt(job, total - 419, opts, asIs)!;
    expect(near(leaving.x, TARGET.x, 2)).toBe(true);
    expect(leaving.opacity).toBeGreaterThan(0.95);

    /* ...and at the lamp, faded out, as it ends. The return eases in, so the
       last frame before the end is a couple of pixels short of the lamp and
       all but invisible — which is the point of easing it. */
    const last = frameAt(job, total - 1, opts, asIs)!;
    expect(near(last.x, LAMP.x, 4)).toBe(true);
    expect(near(last.y, LAMP.y, 4)).toBe(true);
    expect(last.opacity).toBeLessThan(0.05);
  });

  it("a read goes home open, at the radius it read with", () => {
    const job: MascotJob = { kind: "read", over: [TARGET, SOURCE] };
    const opts = { home: LAMP };
    const total = durationOf(job, opts);
    const leaving = frameAt(job, total - 400, opts, asIs)!;
    expect(leaving.dock).toBe(0);
    expect(leaving.r).toBeGreaterThanOrEqual(26);
    expect(leaving.r).toBeLessThan(30);
  });
});

describe("anchors", () => {
  it("resolves a shelf tile and a hole through the same resolver, every frame", () => {
    /* Screen anchors are pixels already; scene anchors are what a camera
       makes of them. A carry off the kit is one of each. */
    const camera: Resolve = (anchor) =>
      anchor.kind === "scene"
        ? { x: anchor.x * 2 + 100, y: anchor.y * 2 + 50 }
        : asIs(anchor);
    const job: MascotJob = { kind: "carry", from: screen(60, 40), to: TARGET };

    const gripping = frameAt(job, GRIP_AT - 20, {}, camera)!;
    expect(near(gripping.x, 60, 2)).toBe(true);
    expect(near(gripping.y, 40, 2)).toBe(true);

    const seating = frameAt(job, SEAT_AT - 1, {}, camera)!;
    expect(near(seating.x, TARGET.x * 2 + 100, 2)).toBe(true);
    expect(near(seating.y, TARGET.y * 2 + 50, 3)).toBe(true);
  });

  it("follows a camera that moves while it flies", () => {
    const job: MascotJob = { kind: "point", at: TARGET };
    const t = durationOf(job) - 300;
    const before = frameAt(job, t, {}, asIs)!;
    const shifted: Resolve = (a) => {
      const p = asIs(a);
      return { x: p.x + 40, y: p.y - 25 };
    };
    const after = frameAt(job, t, {}, shifted)!;
    expect(near(after.x - before.x, 40)).toBe(true);
    expect(near(after.y - before.y, -25)).toBe(true);
  });

  it("leaves from and returns to the coach wherever it is on the frame", () => {
    /* The figure moves while the ring is out — its caption grows with the
       call — so the anchor names the figure and the resolver says where it
       is now. Two resolvers, two lamps, and the ring is at each. */
    const job: MascotJob = { kind: "point", at: TARGET };
    const opts = { entry: COACH, home: COACH, arc: 40 };
    const total = durationOf(job, opts);
    const moved: Resolve = (a) =>
      a.kind === "coach" ? { x: 620, y: 44 } : asIs(a);

    expect(near(frameAt(job, 1, opts, asIs)!.x, LAMP.x, 2)).toBe(true);
    expect(near(frameAt(job, 1, opts, moved)!.x, 620, 2)).toBe(true);
    expect(near(frameAt(job, total - 1, opts, asIs)!.x, LAMP.x, 4)).toBe(true);
    expect(near(frameAt(job, total - 1, opts, moved)!.x, 620, 4)).toBe(true);
  });
});

/**
 * The store, driven by hand. Node has no `requestAnimationFrame`, so the
 * frames the store asks for are queued and run with a stamp of the test's
 * choosing; `performance.now` is pinned so the stamp is the clock.
 */
describe("the store", () => {
  let queued: FrameRequestCallback[] = [];
  const T0 = 5000;

  beforeEach(() => {
    queued = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      queued.push(cb);
      return queued.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    vi.spyOn(performance, "now").mockReturnValue(T0);
  });

  afterEach(() => {
    land();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("hands a job that arrives mid-flight the ring as it was last drawn", () => {
    fly({ kind: "read", over: [TARGET] });
    reportDrawn({ x: 300, y: 200, r: 26, dock: 0, spin: 0, opacity: 1 });

    fly({ kind: "point", at: TARGET }, { home: LAMP });
    const { opts } = getTick()!;
    expect(opts.entry).toEqual(screen(300, 200));
    expect(opts.open).toBe(26);
    expect(opts.fadeIn).toBe(false);
    expect(opts.arc).toBe(30);
    expect(opts.home).toEqual(LAMP);
  });

  it("does not, when nothing is flying", () => {
    fly({ kind: "point", at: TARGET }, { home: LAMP });
    expect(getTick()!.opts.entry).toBeUndefined();
    expect(getTick()!.opts.fadeIn).toBeUndefined();
  });

  it("reports the carried part only while the ring has hold of it", () => {
    fly({
      kind: "carry",
      from: screen(60, 40),
      to: TARGET,
      carrying: { part: "ledRed", component: "ledRed", uid: "ring-ledRed" },
    });
    expect(carryingPart()).toBeNull();

    const step = queued[0];
    step(T0 + CARRY_FROM - 1);
    expect(carryingPart()).toBeNull();
    step(T0 + CARRY_FROM);
    expect(carryingPart()).toBe("ledRed");
    step(T0 + SEAT_AT + 100);
    expect(carryingPart()).toBe("ledRed");

    /* And nothing once the job is over — the tile it faded comes back. */
    step(T0 + 5000);
    expect(carryingPart()).toBeNull();
    expect(getTick()).toBeNull();
  });

  it("a carry with nothing in hand reports nothing", () => {
    fly({ kind: "carry", from: SOURCE, to: TARGET });
    queued[0](T0 + CARRY_FROM + 50);
    expect(carryingPart()).toBeNull();
  });
});
