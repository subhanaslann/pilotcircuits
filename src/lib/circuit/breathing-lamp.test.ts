import { describe, expect, it } from "vitest";
import {
  breathingLamp,
  lampAtRest,
  lampCandidates,
  lampComplete,
  lampEmpty,
  lampGrabPoint,
  lampPlacement,
  lampSceneFrom,
  lampTerminals,
} from "@/lib/circuit/breathing-lamp";
import { diff, extras, sameEndpoints } from "@/lib/circuit/graph";
import { verifyStep } from "@/lib/agent/findings";
import {
  candidatesFor,
  isHole,
  partOf,
  prune,
  tryAttach,
  type Placement,
} from "@/lib/circuit/placement";

/**
 * Chapter one's spec, conformed.
 *
 * The dev-only block at the bottom of `builds.ts` exercises six of a
 * `PlacementSpec`'s ten members. It has never called `satisfying`, `clearing`,
 * `grabPoint` or `componentOf` — which is how `satisfying` came to re-seat a
 * resistor nobody asked it about and resolve a second finding on the way past,
 * silently, for as long as it existed.
 */
const spec = lampPlacement;

const seat = (p: Placement, terminal: string, target: string | null) => {
  const r = tryAttach(spec, p, terminal, target);
  return r.kind === "attached" ? r.placement : p;
};

describe("the topology agrees with itself", () => {
  it("anchors are leads of the part they anchor", () => {
    for (const part of spec.parts) {
      expect(spec.terminalsOf[part]).toContain(spec.anchorOf[part]);
    }
  });

  it("every part has a component and a lead list", () => {
    expect(Object.keys(spec.componentOf).sort()).toEqual([...spec.parts].sort());
    expect(Object.keys(spec.terminalsOf).sort()).toEqual([...spec.parts].sort());
  });

  it("holes and terminals are disjoint", () => {
    for (const hole of spec.holes) expect(spec.terminals).not.toContain(hole);
  });

  it("`terminals` is exactly the key set of `empty` and of `complete`", () => {
    const keys = [...lampTerminals].sort();
    expect(Object.keys(spec.empty).sort()).toEqual(keys);
    expect(Object.keys(spec.complete).sort()).toEqual(keys);
  });

  it("every non-null value of `complete` is a hole or another part's lead", () => {
    for (const [terminal, target] of Object.entries(spec.complete)) {
      if (!target) continue;
      if (isHole(spec, target)) continue;
      expect(partOf(spec, target)).not.toBe(partOf(spec, terminal));
      expect(partOf(spec, target)).toBeDefined();
    }
  });

  it("every candidate hole has a node in the finished scene", () => {
    for (const hole of lampCandidates) {
      expect(breathingLamp.nodes[hole]).toBeDefined();
    }
  });
});

describe("sceneFrom", () => {
  it("draws nothing on an empty bench — the manufactured join is gone", () => {
    expect(lampSceneFrom(lampEmpty).observed).toHaveLength(0);
  });

  it("the finished build matches the sketch and has no strays", () => {
    const scene = lampSceneFrom(lampComplete);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  /**
   * Invariant 1 in `placement.ts`'s header: a join the sketch asks for reuses
   * the expected id, whichever side made it. Everything downstream matches
   * connections by id.
   */
  it("a join made from the other side keeps the expected id", () => {
    const fromOneSide = lampSceneFrom(lampComplete);
    const other = seat(seat(lampComplete, "res.in", null), "led.anode", "res.in");
    const fromOther = lampSceneFrom(other);
    const want = fromOneSide.observed.find((c) => c.id === "bl.c.anode");
    const got = fromOther.observed.find((c) => c.id === "bl.c.anode");
    expect(want).toBeDefined();
    expect(got).toBeDefined();
    expect(sameEndpoints(want!, got!)).toBe(true);
    expect(extras(fromOther)).toHaveLength(0);
  });

  it("mints a distinct id for a join the sketch does not name", () => {
    const p = seat(seat(lampEmpty, "led.cathode", "board.GND"), "led.anode", "board.D13");
    const scene = lampSceneFrom(p);
    const stray = extras(scene);
    expect(stray).toHaveLength(1);
    expect(stray[0].id).not.toBe("bl.c.anode");
    expect(stray[0].id).toContain(".x.");
  });

  it("carries `mechanical` through rather than resetting it", () => {
    const turned = { servoAngle: 45, expectedAngle: 0 };
    expect(lampSceneFrom(lampComplete, turned).mechanical).toEqual(turned);
  });

  it("omits a connection whose endpoints are not both on the bench", () => {
    const scene = lampSceneFrom(seat(lampEmpty, "led.cathode", "board.GND"));
    expect(scene.observed.every((c) => scene.nodes[c.from] && scene.nodes[c.to])).toBe(true);
  });
});

describe("satisfying — the demo control's shortcut", () => {
  it("reaches every expected connection from an empty bench", () => {
    for (const want of breathingLamp.expected) {
      const next = spec.satisfying(lampEmpty, want.id);
      expect(next, want.id).not.toBeNull();
      const scene = lampSceneFrom(prune(spec, next!), lampAtRest);
      expect(diff(scene, [want.id]).mismatches, want.id).toHaveLength(0);
    }
  });

  it("declines an id this build does not name", () => {
    expect(spec.satisfying(lampEmpty, "c.sensor.echo")).toBeNull();
  });

  /**
   * `null` rather than an unchanged record.
   *
   * Returning the same placement made a declined shortcut indistinguishable
   * from a performed one: the caller committed, credited a repair, and logged
   * a move it had not made.
   */
  it("declines a join that is already true", () => {
    for (const want of breathingLamp.expected) {
      expect(spec.satisfying(lampComplete, want.id), want.id).toBeNull();
    }
  });

  it("reaching one connection never breaks another that was already right", () => {
    for (const want of breathingLamp.expected) {
      const others = breathingLamp.expected.filter((c) => c.id !== want.id);
      /* Build everything but `want`, then ask for `want`. */
      let p: Placement = lampEmpty;
      for (const other of others) p = spec.satisfying(p, other.id) ?? p;
      const built = prune(spec, p);
      const next = spec.satisfying(built, want.id);
      if (!next) continue;
      const scene = lampSceneFrom(prune(spec, next), lampAtRest);
      expect(diff(scene).mismatches, want.id).toHaveLength(0);
    }
  });
});

describe("clearing — the demo control's removal", () => {
  const strayPlacement = seat(
    seat(lampEmpty, "led.cathode", "board.GND"),
    "led.anode",
    "board.D13",
  );

  it("removes exactly the join it names", () => {
    const scene = lampSceneFrom(strayPlacement);
    const stray = extras(scene)[0];
    const next = spec.clearing(strayPlacement, stray.id, {
      from: stray.from,
      to: stray.to,
    });
    expect(next).not.toBeNull();
    expect(extras(lampSceneFrom(prune(spec, next!)))).toHaveLength(0);
    /* And it did not disturb the cathode. */
    expect(next!["led.cathode"]).toBe("board.GND");
  });

  it("declines a stale edge instead of firing on whatever is there now", () => {
    const scene = lampSceneFrom(strayPlacement);
    const stray = extras(scene)[0];
    /* The person moved it themselves before pressing the button. */
    const moved = seat(strayPlacement, "led.anode", "board.D11");
    expect(
      spec.clearing(moved, stray.id, { from: stray.from, to: stray.to }),
    ).toBeNull();
  });

  it("declines an id that is not a stray at all", () => {
    expect(
      spec.clearing(lampComplete, "bl.c.anode", {
        from: "res.in",
        to: "led.anode",
      }),
    ).toBeNull();
  });
});

describe("grabPoint", () => {
  it("is total over every node in the finished scene", () => {
    for (const node of Object.values(breathingLamp.nodes)) {
      const at = lampGrabPoint(node);
      expect(Number.isFinite(at.x), node.id).toBe(true);
      expect(Number.isFinite(at.y), node.id).toBe(true);
    }
  });

  it("lifts a lead clear of the header row it would otherwise collide with", () => {
    /* A seated LED's free long leg is 0.5208 scene units from `board.D13` —
       one twentieth of a hole. Any hit test that puts the two in the same place
       decides this chapter's central gesture by rounding. */
    const scene = lampSceneFrom(seat(lampEmpty, "led.cathode", "board.GND"));
    const anode = scene.nodes["led.anode"];
    const d13 = scene.nodes["board.D13"];
    expect(Math.hypot(anode.x - d13.x, anode.y - d13.y)).toBeLessThan(1);
    const lifted = lampGrabPoint(anode);
    expect(Math.hypot(lifted.x - d13.x, lifted.y - d13.y)).toBeGreaterThan(10);
  });

  it("leaves a board hole where it is", () => {
    const hole = breathingLamp.nodes["board.D9"];
    expect(lampGrabPoint(hole)).toEqual({ x: hole.x, y: hole.y });
  });
});

/**
 * A 220Ω resistor has no polarity, and the model must not pretend otherwise.
 *
 * Built with the resistor turned round the lamp is electrically identical and
 * lights up — and the panel used to report four faults on it: two connections
 * missing and two the sketch does not ask for. `res.in` and `res.out` are one
 * component's two ends, and the names are a convention of the record.
 */
describe("the resistor, turned round", () => {
  const reversed = seat(
    seat(seat(lampEmpty, "led.cathode", "board.GND"), "res.in", "board.D9"),
    "res.out",
    "led.anode",
  );

  it("is a correct build", () => {
    const scene = lampSceneFrom(reversed, lampAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  it("verifies every step it touches", () => {
    const scene = lampSceneFrom(reversed, lampAtRest);
    for (const id of ["lampSeat", "lampResistor"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });

  it("keeps the sketch's own connection ids, so the panel can name them", () => {
    const ids = lampSceneFrom(reversed, lampAtRest).observed.map((c) => c.id);
    expect([...ids].sort()).toEqual(
      [...breathingLamp.expected.map((c) => c.id)].sort(),
    );
  });

  /* And the licence is not a blank cheque: both ends in holes is still one
     right join and one stray, not two connections wearing the same id. */
  it("does not let both ends claim the same connection", () => {
    const both = seat(
      seat(seat(lampEmpty, "led.cathode", "board.GND"), "res.out", "board.D9"),
      "res.in",
      "board.D5",
    );
    const scene = lampSceneFrom(both, lampAtRest);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(extras(scene)).toHaveLength(1);
  });
});

describe("the bench is reachable by hand", () => {
  /**
   * The whole chapter, built the way a person builds it, one legal move at a
   * time — and it has to end at a graph the sketch accepts.
   */
  it("a sequence of legal drops reaches the finished lamp", () => {
    let p: Placement = lampEmpty;
    const moves: [string, string][] = [
      ["led.cathode", "board.GND"],
      ["res.out", "board.D9"],
      ["res.in", "led.anode"],
    ];
    for (const [terminal, target] of moves) {
      expect(candidatesFor(spec, p, terminal), `${terminal} -> ${target}`).toContain(target);
      const r = tryAttach(spec, p, terminal, target);
      expect(r.kind, `${terminal} -> ${target}`).toBe("attached");
      if (r.kind === "attached") p = prune(spec, r.placement);
    }
    const scene = lampSceneFrom(p, lampAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  it("the canonical beginner mistake is still makeable", () => {
    /* "The LED straight into the header" — both legs in two different holes.
       Deleting this would delete the mistake the chapter is about. */
    let p = seat(lampEmpty, "led.cathode", "board.GND");
    expect(candidatesFor(spec, p, "led.anode")).toContain("board.D13");
    p = seat(p, "led.anode", "board.D13");
    expect(p["led.anode"]).toBe("board.D13");
    expect(extras(lampSceneFrom(p))).toHaveLength(1);
  });
});
