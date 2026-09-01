import { describe, expect, it } from "vitest";
import {
  anchorsFor,
  attach,
  attachmentOf,
  candidatesFor,
  detach,
  effectsOf,
  isFree,
  onBench,
  partsInKit,
  prune,
  shortedParts,
  tryAttach,
  type Placement,
  type PlacementTopology,
} from "@/lib/circuit/placement";
import { diff, extras } from "@/lib/circuit/graph";
import { lampPlacement } from "@/lib/circuit/breathing-lamp";
import { lightPlacement } from "@/lib/circuit/traffic-light";
import { nightPlacement } from "@/lib/circuit/motion-night-light";
import { plantPlacement } from "@/lib/circuit/plant-guardian";
import { soapPlacement } from "@/lib/circuit/touchless-soap";

/**
 * The model, asserted.
 *
 * Everything in this file used to be guarded by a header comment. `Placement`
 * is keyed by `string`, so every constant in the repo typechecks however it is
 * spelled, and every way this model can be wrong renders as a plausible-looking
 * picture rather than a crash — which is how a careful codebase accumulated a
 * hole big enough to let two parts' leads share one hole in the header.
 *
 * The topology is a toy on purpose: three parts, six leads, four holes. Small
 * enough to enumerate exhaustively, and shaped to hit every branch — a rigid
 * two-lead part, a part that can hang off another one, and a chain three deep.
 */
const t: PlacementTopology = {
  parts: ["a", "b", "c"],
  terminals: ["a.1", "a.2", "b.1", "b.2", "c.1", "c.2"],
  terminalsOf: {
    a: ["a.1", "a.2"],
    b: ["b.1", "b.2"],
    c: ["c.1", "c.2"],
  },
  holes: ["h.1", "h.2", "h.3", "h.4"],
};

const empty: Placement = {
  "a.1": null,
  "a.2": null,
  "b.1": null,
  "b.2": null,
  "c.1": null,
  "c.2": null,
};

const of = (...pairs: [string, string | null][]): Placement =>
  pairs.reduce<Placement>((p, [k, v]) => ({ ...p, [k]: v }), empty);

describe("tryAttach", () => {
  it("seats a lead in a free hole", () => {
    const r = tryAttach(t, empty, "a.1", "h.1");
    expect(r).toEqual({
      kind: "attached",
      placement: { ...empty, "a.1": "h.1" },
    });
  });

  it("reports the lead already being there as unchanged, not as a write", () => {
    const p = of(["a.1", "h.1"]);
    expect(tryAttach(t, p, "a.1", "h.1")).toEqual({ kind: "unchanged" });
  });

  it("reports letting go of an already-loose lead as unchanged", () => {
    expect(tryAttach(t, empty, "a.1", null)).toEqual({ kind: "unchanged" });
  });

  /**
   * The `two-parts-one-hole` defect, as an executable statement.
   *
   * The old rule tested only the *same part* ("a part cannot be shorted to
   * itself"), so two different parts could legally stand in one 1 mm hole — a
   * build that cannot exist on a desk, that the drawing renders as two legs in
   * one hole, and that `connectionFor` then awards the expected connection id,
   * so the step verified green on it.
   */
  it("refuses a hole another PART's lead is already in", () => {
    const p = of(["a.1", "h.1"]);
    expect(tryAttach(t, p, "b.1", "h.1")).toEqual({
      kind: "refused",
      reason: "holeTaken",
    });
  });

  it("refuses a hole a SIBLING lead is already in", () => {
    const p = of(["a.1", "h.1"]);
    expect(tryAttach(t, p, "a.2", "h.1")).toEqual({
      kind: "refused",
      reason: "holeTaken",
    });
  });

  it("refuses joining a part to itself", () => {
    const p = of(["a.1", "h.1"]);
    expect(tryAttach(t, p, "a.2", "a.1")).toEqual({
      kind: "refused",
      reason: "sameCircuitPart",
    });
  });

  it("refuses a lead that already has something clipped to it", () => {
    const p = of(["a.1", "h.1"], ["b.1", "a.2"]);
    expect(tryAttach(t, p, "c.1", "a.2")).toEqual({
      kind: "refused",
      reason: "leadNotFree",
    });
  });

  /** The store-once rule: moving a lead lets go of whatever was joined ONTO it. */
  it("clears inbound edges when the lead it holds moves away", () => {
    const p = of(["a.1", "h.1"], ["b.1", "a.2"]);
    const r = tryAttach(t, p, "a.2", "h.2");
    expect(r.kind).toBe("attached");
    if (r.kind !== "attached") return;
    expect(r.placement["b.1"]).toBeNull();
    expect(r.placement["a.2"]).toBe("h.2");
  });

  it("attach() is tryAttach with the refusal thrown away", () => {
    const p = of(["a.1", "h.1"]);
    expect(attach(t, p, "b.1", "h.1")).toBe(p);
    expect(attach(t, p, "b.1", "h.2")["b.1"]).toBe("h.2");
  });

  it("detach round-trips: seat, detach, and the record is the one it started from", () => {
    const seated = attach(t, empty, "a.1", "h.1");
    expect(detach(t, seated, "a.1")).toEqual(empty);
  });
});

describe("attachmentOf / isFree", () => {
  it("answers from whichever side stored the edge", () => {
    const p = of(["a.1", "h.1"], ["b.1", "a.2"]);
    expect(attachmentOf(t, p, "b.1")).toBe("a.2");
    /* The edge is stored on `b.1`, so a reader that only looked at `p["a.2"]`
       would call this lead free and offer it as a target. */
    expect(attachmentOf(t, p, "a.2")).toBe("b.1");
    expect(isFree(t, p, "a.2")).toBe(false);
  });
});

describe("anchorsFor", () => {
  it("puts a part with no path to a hole in the kit", () => {
    expect(onBench(t, empty, "a")).toBe(false);
    expect(partsInKit(t, empty)).toEqual(["a", "b", "c"]);
  });

  it("holes outrank joins: a lead in a hole fixes its part", () => {
    const p = of(["a.1", "h.1"], ["a.2", "b.1"]);
    const anchors = anchorsFor(t, p);
    expect(anchors.find((x) => x.part === "a")).toMatchObject({
      terminal: "a.1",
      target: "h.1",
      intoHole: true,
    });
  });

  it("relaxes across a join in either direction", () => {
    /* `b` is held up by an edge stored on `a.2`, so the hanging part is the one
       that did NOT record the join. */
    const p = of(["a.1", "h.1"], ["a.2", "b.1"]);
    expect(onBench(t, p, "b")).toBe(true);
    /* And the other way round, where `b` recorded it. */
    const q = of(["a.1", "h.1"], ["b.1", "a.2"]);
    expect(onBench(t, q, "b")).toBe(true);
  });

  it("positions every anchor after the thing that holds it up", () => {
    const p = of(["a.1", "h.1"], ["b.1", "a.2"], ["c.1", "b.2"]);
    const order = anchorsFor(t, p).map((x) => x.part);
    expect(order).toEqual(["a", "b", "c"]);
  });

  /** Cycle-freedom is structural rather than checked, so it is checked here. */
  it("terminates on a cycle with no path to a hole", () => {
    const p = of(["a.1", "b.1"], ["b.2", "a.2"]);
    expect(anchorsFor(t, p)).toEqual([]);
    expect(partsInKit(t, p)).toEqual(["a", "b", "c"]);
  });

  it("never returns a part twice", () => {
    const p = of(["a.1", "h.1"], ["a.2", "h.2"], ["b.1", "h.3"]);
    const parts = anchorsFor(t, p).map((x) => x.part);
    expect(new Set(parts).size).toBe(parts.length);
  });
});

describe("prune", () => {
  it("drops a join between two parts that both lost the board", () => {
    const p = of(["b.1", "a.2"], ["c.1", "b.2"]);
    expect(prune(t, p)).toEqual(empty);
  });

  it("keeps everything on a build that is standing in the board", () => {
    const p = of(["a.1", "h.1"], ["b.1", "a.2"]);
    expect(prune(t, p)).toEqual(p);
  });

  it("is idempotent", () => {
    const p = of(["a.1", "h.1"], ["b.1", "a.2"], ["c.1", "b.2"]);
    expect(prune(t, prune(t, p))).toEqual(prune(t, p));
    const q = of(["b.1", "a.2"]);
    expect(prune(t, prune(t, q))).toEqual(prune(t, q));
  });
});

describe("candidatesFor", () => {
  it("offers the hole the lead is currently in", () => {
    const p = of(["a.1", "h.1"]);
    expect(candidatesFor(t, p, "a.1")).toContain("h.1");
  });

  it("never offers an occupied hole", () => {
    const p = of(["a.1", "h.1"]);
    expect(candidatesFor(t, p, "b.1")).not.toContain("h.1");
  });

  it("never offers a lead of the same part", () => {
    const p = of(["a.1", "h.1"]);
    expect(candidatesFor(t, p, "a.2")).not.toContain("a.1");
  });

  it("never offers a lead of a part that is still in the kit", () => {
    /* `b` has no path to a hole, so its leads have no coordinates and a mark
       drawn on one would be a target with nowhere to be. */
    const p = of(["a.1", "h.1"]);
    const out = candidatesFor(t, p, "a.2");
    expect(out).not.toContain("b.1");
    expect(out).not.toContain("b.2");
  });

  it("offers a free lead of a part that IS on the bench", () => {
    const p = of(["a.1", "h.1"], ["b.1", "h.2"]);
    expect(candidatesFor(t, p, "a.2")).toContain("b.2");
  });

  /** The one that matters: every candidate must be legal to commit. */
  it("every candidate it offers is one tryAttach accepts", () => {
    const placements: Placement[] = [
      empty,
      of(["a.1", "h.1"]),
      of(["a.1", "h.1"], ["b.1", "h.2"]),
      of(["a.1", "h.1"], ["b.1", "a.2"]),
      of(["a.1", "h.1"], ["a.2", "h.2"], ["b.1", "h.3"]),
      of(["a.1", "h.1"], ["b.1", "a.2"], ["c.1", "b.2"]),
    ];
    for (const p of placements) {
      for (const terminal of t.terminals) {
        for (const target of candidatesFor(t, p, terminal)) {
          const r = tryAttach(t, p, terminal, target);
          expect(
            r.kind,
            `${terminal} -> ${target} in ${JSON.stringify(p)}`,
          ).not.toBe("refused");
        }
      }
    }
  });
});

describe("effectsOf", () => {
  it("names a seating", () => {
    const before = empty;
    const after = attach(t, before, "a.1", "h.1");
    expect(effectsOf(t, before, after, "a.1")).toMatchObject({
      changed: true,
      seated: { terminal: "a.1", hole: "h.1" },
      enteredBench: ["a"],
    });
  });

  it("names a join", () => {
    const before = of(["a.1", "h.1"]);
    const after = attach(t, before, "b.1", "a.2");
    expect(effectsOf(t, before, after, "b.1")).toMatchObject({
      joined: { terminal: "b.1", lead: "a.2" },
      enteredBench: ["b"],
    });
  });

  /**
   * The consequence nobody was ever told about.
   *
   * Pulling `a.1` out of the board takes `a` off the bench — and `b`, which was
   * hanging off `a.2`, goes with it, and `prune` then drops the join. The
   * session used to say one sentence about one lead.
   */
  it("reports the second part that came off with the first", () => {
    const before = of(["a.1", "h.1"], ["b.1", "a.2"]);
    const after = prune(t, attach(t, before, "a.1", null));
    const e = effectsOf(t, before, after, "a.1");
    expect(e.loosened).toBe("a.1");
    expect(e.leftBench).toEqual(["a", "b"]);
    expect(e.brokeJoins).toEqual([{ from: "b.1", to: "a.2" }]);
  });

  it("reports a join the gesture pulled apart from the other side", () => {
    const before = of(["a.1", "h.1"], ["b.1", "a.2"], ["b.2", "h.2"]);
    const after = attach(t, before, "a.2", "h.3");
    const e = effectsOf(t, before, after, "a.2");
    expect(e.seated).toEqual({ terminal: "a.2", hole: "h.3" });
    expect(e.brokeJoins).toEqual([{ from: "b.1", to: "a.2" }]);
    /* `b` keeps its own lead in a hole, so it stays on the bench. */
    expect(e.leftBench).toEqual([]);
  });

  it("says nothing changed when nothing changed", () => {
    expect(effectsOf(t, empty, empty, "a.1")).toEqual({
      changed: false,
      brokeJoins: [],
      leftBench: [],
      enteredBench: [],
    });
  });
});

/**
 * `docs/bench-parts.md` §12's open item, written as a rule.
 *
 * Put both ends of a resistor on the `−` rail and every question the model
 * already asks answers "fine": `diff` finds no mismatch, because the rail is one
 * node and the loose end really is making the join the sketch asks for, and
 * `extras` finds nothing unexpected for the same reason. The component is
 * nevertheless shorted out. §12 says out loud that this is not `extras`' job but
 * a rule of its own, and this is that rule.
 */
describe("shortedParts", () => {
  /* The toy topology with two of its four holes declared one piece of metal —
     a rail, in the smallest form that can be one. */
  const railed = {
    ...t,
    sameNet: (a: string, b: string) =>
      a === b || (["h.3", "h.4"].includes(a) && ["h.3", "h.4"].includes(b)),
  };

  it("says nothing about a part with its ends in two different nets", () => {
    expect(shortedParts(railed, of(["a.1", "h.1"], ["a.2", "h.3"]))).toEqual([]);
  });

  it("says nothing about a part with only one end down", () => {
    expect(shortedParts(railed, of(["a.1", "h.1"]))).toEqual([]);
  });

  /* The §12 case itself: two different holes, one piece of metal. */
  it("reports both ends of one part on the same rail", () => {
    expect(shortedParts(railed, of(["a.1", "h.3"], ["a.2", "h.4"]))).toEqual([
      { part: "a", terminals: ["a.1", "a.2"], at: ["h.3", "h.4"] },
    ]);
  });

  /* And a part clipped to itself, which `tryAttach` refuses but an author's
     literal does not go through `tryAttach` at all. */
  it("reports a part clipped to its own other lead", () => {
    expect(shortedParts(railed, of(["a.1", "h.1"], ["a.2", "a.1"]))).toEqual([
      /* `a.1` reads back its own hole — the edge is stored on `a.2`, which is
         the side that made it, and that is what makes this pair a short. */
      { part: "a", terminals: ["a.1", "a.2"], at: ["h.1", "a.1"] },
    ]);
  });

  it("needs no net table to catch two ends in one hole", () => {
    /* `h.1` twice is not reachable by gesture — `tryAttach` refuses it as
       `holeTaken` — but it is exactly what a mistyped `complete` looks like. */
    const p: Placement = { ...empty, "a.1": "h.1", "a.2": "h.1" };
    expect(shortedParts(t, p)).toHaveLength(1);
  });
});

/**
 * The same rule against every chapter's own finished build.
 *
 * This is the assertion the boot block in `builds.ts` could not make: `diff`
 * and `extras` are both blind to a shorted part, so an author's `complete` with
 * a lead one rail along passed every check in the repo.
 */
describe("no chapter's finished build shorts a part", () => {
  it.each([
    ["chapter one · breathing lamp", lampPlacement],
    ["chapter two · traffic light", lightPlacement],
    ["chapter three · motion night light", nightPlacement],
    ["chapter four · plant guardian", plantPlacement],
    ["chapter five · touchless soap", soapPlacement],
  ])("%s", (_name, spec) => {
    expect(shortedParts(spec, spec.complete)).toEqual([]);
  });

  /* And it is not vacuous: move one resistor lead onto the rail its other lead
     is already in, and the rule is the only thing in the repo that says so. */
  it("catches chapter two's resistor with both ends on the − rail", () => {
    const shorted: Placement = { ...lightPlacement.complete, "res.red.in": "bb.neg2" };
    const scene = lightPlacement.sceneFrom(shorted, {
      servoAngle: 0,
      expectedAngle: 0,
    });
    expect(diff(scene).mismatches).toHaveLength(1);
    expect(extras(scene)).toHaveLength(0);
    expect(shortedParts(lightPlacement, shorted)).toEqual([
      { part: "resRed", terminals: ["res.red.in", "res.red.out"], at: ["bb.neg2", "bb.neg1"] },
    ]);
  });
});
