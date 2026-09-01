import { describe, expect, it } from "vitest";
import {
  lightAtRest,
  lightCandidates,
  lightComplete,
  lightEmpty,
  lightGrabPoint,
  lightPlacement,
  lightSceneFrom,
  lightTerminals,
  trafficLight,
} from "@/lib/circuit/traffic-light";
import { diff, extras } from "@/lib/circuit/graph";
import { verifyStep } from "@/lib/agent/findings";
import { PITCH } from "@/lib/circuit/geometry";
import {
  candidatesFor,
  isHole,
  partOf,
  prune,
  tryAttach,
  type Placement,
} from "@/lib/circuit/placement";

/**
 * Chapter two's spec, conformed — and the two claims that live nowhere else.
 *
 * Chapter one's file exists because every way a `PlacementSpec` can be wrong
 * renders as a plausible picture rather than as a crash, and because the
 * dev-only block in `builds.ts` exercises six of a spec's ten members and has
 * never called `satisfying`, `clearing`, `grabPoint` or `componentOf`. All of
 * that is still true here, so the port below is not ceremony.
 *
 * What chapter two adds is worse. Two of its claims are *only* in the model:
 *
 *   1. the five holes down a column are one piece of metal, so a lead in the
 *      wrong ROW is right and a lead one COLUMN over is wrong;
 *   2. four M–M jumper cables are one object, so the person who takes the cable
 *      this file calls green and wires the red lamp with it has built the right
 *      circuit — and a cable making a join the sketch does not ask for has not.
 *
 * Neither draws differently when it is wrong. The board looks like a board full
 * of legs either way, and the only symptom is a panel confidently saying
 * something false about a build — which is the exact failure chapter one
 * shipped once already, with the resistor turned round, and which claim 2 then
 * shipped in the other direction: every one of the 40 320 ways of seating eight
 * cable ends verified, including a jumper shorting `D13` to ground.
 */
const spec = lightPlacement;

const seat = (p: Placement, terminal: string, target: string | null) => {
  const r = tryAttach(spec, p, terminal, target);
  return r.kind === "attached" ? r.placement : p;
};

describe("the topology agrees with itself", () => {
  it("anchors are leads of the part they anchor", () => {
    for (const part of spec.parts) {
      expect(spec.terminalsOf[part], part).toContain(spec.anchorOf[part]);
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
    const keys = [...lightTerminals].sort();
    expect(Object.keys(spec.empty).sort()).toEqual(keys);
    expect(Object.keys(spec.complete).sort()).toEqual(keys);
  });

  /**
   * §0, as an assertion: the breadboard is the join.
   *
   * Chapter one's version of this test allowed a value to be another part's
   * lead, because its middle join *is* one. Chapter two has no such join at
   * all — twenty leads, twenty holes, one each — and that is what makes
   * `satisfying` four lines and keeps `leadNotFree` off the happy path. The day
   * somebody writes a lead-to-lead value into `complete`, both of those
   * simplifications become wrong and nothing else would say so.
   */
  it("not one join in this chapter is lead to lead", () => {
    for (const [terminal, target] of Object.entries(lightComplete)) {
      expect(target, terminal).not.toBeNull();
      expect(isHole(spec, target!), `${terminal} → ${target}`).toBe(true);
      expect(partOf(spec, target!), `${terminal} → ${target}`).toBeUndefined();
    }
  });

  /* A hole holds one lead. Twenty leads and nineteen distinct holes would draw
     two legs in one 1 mm hole and `verifyStep` would tick green on it. */
  it("the finished build puts no two leads in one hole", () => {
    const seats = Object.values(lightComplete);
    expect(new Set(seats).size).toBe(seats.length);
  });

  it("every candidate hole has a node in the finished scene", () => {
    for (const hole of lightCandidates) {
      expect(trafficLight.nodes[hole], hole).toBeDefined();
    }
  });

  /**
   * The two properties `connectionFor` and `diff` are decidable under.
   *
   * A terminal in two expected entries makes `expected.find(...)` a coin toss,
   * and two entries sharing a `from` makes `diff`'s same-origin fallback
   * (graph.ts) attribute one lead's stray to the other's expected join.
   */
  it("every lead is named by exactly one expected connection", () => {
    const froms = trafficLight.expected.map((c) => c.from);
    expect(new Set(froms).size).toBe(froms.length);
    for (const terminal of lightTerminals) {
      const owning = trafficLight.expected.filter(
        (c) => c.from === terminal || c.to === terminal,
      );
      expect(owning, terminal).toHaveLength(1);
    }
  });

  /**
   * 195 and not 375, which costs `builds.ts` twenty scenes per hole at every
   * boot. The top bank and the `+` rail are DRAWN — the LED bodies stand over
   * rows a–e — and deliberately not offered, so "it is in the scene" and "a
   * lead may go there" are two different questions and the drawing must not
   * assume they have the same answer.
   */
  it("offers the bottom bank, the rail and the header, and no more", () => {
    expect(lightCandidates).toHaveLength(195);
    expect(new Set(lightCandidates).size).toBe(lightCandidates.length);
    for (const drawn of ["bb.a1", "bb.e30", "bb.pos1"]) {
      expect(trafficLight.nodes[drawn], drawn).toBeDefined();
      expect(lightCandidates, drawn).not.toContain(drawn);
    }
    for (const offered of ["bb.f1", "bb.j30", "bb.neg15", "board.D0"]) {
      expect(lightCandidates, offered).toContain(offered);
    }
  });

  /* The arrow-key order. `live-workbench.tsx` re-sorts its targets by
     `grabPoint`, so a list ordered any other way makes Home/End and the arrow
     keys disagree about which hole comes next. */
  it("offers them in the order they read on screen", () => {
    for (let i = 1; i < lightCandidates.length; i += 1) {
      const prev = trafficLight.nodes[lightCandidates[i - 1]];
      const next = trafficLight.nodes[lightCandidates[i]];
      expect(
        prev.x < next.x || (prev.x === next.x && prev.y <= next.y),
        `${prev.id} → ${next.id}`,
      ).toBe(true);
    }
  });
});

/**
 * A hole's address is what the panel prints about it.
 *
 * Chapter six's holes carry no label and every reader falls back to the raw id,
 * which is survivable on a chapter whose corrections are about named pins. On
 * the one chapter whose corrections are all about holes, `bb.f7` in the slot
 * reserved for the silkscreen is a graph id leaking into a sentence — and an
 * arrow drawn from one blank to another is not a correction at all.
 */
describe("the holes are addresses, not graph ids", () => {
  it("a bank hole prints the address the breadboard prints", () => {
    expect(trafficLight.nodes["bb.f7"].label).toBe("F7");
    expect(trafficLight.nodes["bb.j18"].label).toBe("J18");
    expect(trafficLight.nodes["bb.f9"].label).toBe("F9");
  });

  it("a rail hole prints a minus sign, and says it is a rail", () => {
    expect(trafficLight.nodes["bb.neg1"].label).toBe("−1");
    expect(trafficLight.nodes["bb.pos12"].label).toBe("+12");
    /* And the minus is U+2212, not the hyphen a keyboard produces. Asserted by
       code point rather than by glyph, because the two are indistinguishable in
       review: a hyphen typed into this file would agree with a hyphen typed
       into the model, the pair would pass, and the rail would print a
       typewriter dash in the slot the silkscreen owns. */
    expect(trafficLight.nodes["bb.neg1"].label?.codePointAt(0)).toBe(0x2212);
    /* `Breadboard` splits rails from banks on exactly these two literals; a
       rail spelled `"pos"` typechecks and then draws as a bank square in the
       middle of the plastic. */
    expect(trafficLight.nodes["bb.neg1"].row).toBe("-");
    expect(trafficLight.nodes["bb.pos12"].row).toBe("+");
  });
});

describe("sceneFrom", () => {
  it("draws nothing on an empty bench", () => {
    expect(lightSceneFrom(lightEmpty).observed).toHaveLength(0);
  });

  it("the finished build matches the sketch and has no strays", () => {
    const scene = lightSceneFrom(lightComplete);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  /**
   * Chapter one asserts here that a join made from the other side keeps the
   * expected id. Chapter two cannot: a hole is never the SUBJECT of an edge —
   * `Placement` is keyed by terminals and registry.test.ts forbids a hole from
   * being one — so every join in this chapter has exactly one side that can
   * make it, and every expected entry has to be written pointing that way.
   *
   * Backwards, it would still be *found* (`connectionFor` matches `from` or
   * `to`) and `satisfying` would then try to attach a hole to a lead: a
   * placement keyed `bb.f7`, drawn as nothing, reported as nothing.
   */
  it("every join runs from a lead to a hole — there is no other side", () => {
    for (const want of trafficLight.expected) {
      expect(lightTerminals, want.id).toContain(want.from);
      expect(isHole(spec, want.to), want.id).toBe(true);
    }
  });

  it("mints a distinct id for a join the sketch does not name", () => {
    const p = seat(
      seat(lightEmpty, "led.red.cathode", "bb.f7"),
      "led.red.anode",
      "board.D13",
    );
    const scene = lightSceneFrom(p);
    const stray = extras(scene);
    expect(stray).toHaveLength(1);
    expect(stray[0].id).not.toBe("tl.c.red.anode");
    expect(stray[0].id).toContain(".x.");
  });

  it("carries `mechanical` through rather than resetting it", () => {
    const turned = { servoAngle: 45, expectedAngle: 0 };
    expect(lightSceneFrom(lightComplete, turned).mechanical).toEqual(turned);
  });

  it("omits a connection whose endpoints are not both on the bench", () => {
    /* A resistor clipped to an LED that is still in the kit. `prune` normally
       makes this unreachable, and this scene is reached from a hand-written
       literal — the briefing film and the lab both hand `lightSceneFrom` one. */
    const hanging = lightSceneFrom({
      ...lightEmpty,
      "res.red.in": "led.red.anode",
    });
    expect(hanging.observed).toHaveLength(0);

    const partial = lightSceneFrom(seat(lightEmpty, "led.red.cathode", "bb.f7"));
    expect(
      partial.observed.every(
        (c) => partial.nodes[c.from] && partial.nodes[c.to],
      ),
    ).toBe(true);
  });

  it("refuses a placement keyed by parts instead of by leads", () => {
    /* `Placement`'s key type is `string`, so this typechecks everywhere it is
       written. It draws an empty board and throws nothing, which is a bug that
       survives review; the dev guard is what makes it loud. */
    expect(() => lightSceneFrom({ ledRed: "bb.f7" })).toThrow(/not a terminal/);
  });
});

describe("satisfying — the demo control's shortcut", () => {
  it("reaches every expected connection from an empty bench", () => {
    for (const want of trafficLight.expected) {
      const next = spec.satisfying(lightEmpty, want.id);
      expect(next, want.id).not.toBeNull();
      const scene = lightSceneFrom(prune(spec, next!), lightAtRest);
      expect(diff(scene, [want.id]).mismatches, want.id).toHaveLength(0);
    }
  });

  it("declines an id this build does not name", () => {
    expect(spec.satisfying(lightEmpty, "c.sensor.echo")).toBeNull();
    /* Chapter one's ids are in the same global namespace and this build must
       not answer for them. */
    expect(spec.satisfying(lightEmpty, "bl.c.anode")).toBeNull();
  });

  /**
   * `null` rather than an unchanged record: returning the same placement made a
   * declined shortcut indistinguishable from a performed one, so the caller
   * committed, credited a repair and logged a move it had not made.
   */
  it("declines a join that is already true", () => {
    for (const want of trafficLight.expected) {
      expect(spec.satisfying(lightComplete, want.id), want.id).toBeNull();
    }
  });

  it("reaching one connection never breaks another that was already right", () => {
    for (const want of trafficLight.expected) {
      const others = trafficLight.expected.filter((c) => c.id !== want.id);
      /* Build everything but `want`, then ask for `want`. */
      let p: Placement = lightEmpty;
      for (const other of others) p = spec.satisfying(p, other.id) ?? p;
      const built = prune(spec, p);
      const next = spec.satisfying(built, want.id);
      if (!next) continue;
      const scene = lightSceneFrom(prune(spec, next), lightAtRest);
      expect(diff(scene).mismatches, want.id).toHaveLength(0);
    }
  });
});

describe("clearing — the demo control's removal", () => {
  /* The red LED standing in its own column with its long leg reaching over to
     the header — chapter one's build, made on chapter two's bench, where it is
     a join the sketch does not name. */
  const strayPlacement = seat(
    seat(lightEmpty, "led.red.cathode", "bb.f7"),
    "led.red.anode",
    "board.D13",
  );

  it("removes exactly the join it names", () => {
    const stray = extras(lightSceneFrom(strayPlacement))[0];
    const next = spec.clearing(strayPlacement, stray.id, {
      from: stray.from,
      to: stray.to,
    });
    expect(next).not.toBeNull();
    expect(extras(lightSceneFrom(prune(spec, next!)))).toHaveLength(0);
    /* And it did not disturb the leg that was in the right hole. */
    expect(next!["led.red.cathode"]).toBe("bb.f7");
  });

  it("declines a stale edge instead of firing on whatever is there now", () => {
    const stray = extras(lightSceneFrom(strayPlacement))[0];
    /* The person moved it themselves before pressing the button. */
    const moved = seat(strayPlacement, "led.red.anode", "board.D11");
    expect(
      spec.clearing(moved, stray.id, { from: stray.from, to: stray.to }),
    ).toBeNull();
  });

  it("declines an id that is not a stray at all", () => {
    expect(
      spec.clearing(lightComplete, "tl.c.red.anode", {
        from: "led.red.anode",
        to: "bb.f8",
      }),
    ).toBeNull();
  });
});

describe("grabPoint", () => {
  it("is total over every node in the finished scene", () => {
    for (const node of Object.values(trafficLight.nodes)) {
      const at = lightGrabPoint(node);
      expect(Number.isFinite(at.x), node.id).toBe(true);
      expect(Number.isFinite(at.y), node.id).toBe(true);
    }
  });

  /**
   * The half-pitch DIAGONAL, and why no vertical lift works here.
   *
   * A seated lead's node is exactly its hole, so an unlifted mark is a mark on
   * top of a target — a hit test that decides this chapter's central gesture by
   * rounding. A breadboard is 10 units in BOTH axes, so any purely vertical
   * lift lands on another hole or exactly midway between two; the diagonal puts
   * the mark at the centre of a lattice cell, hypot(5, 5) from all four
   * neighbours, which is the farthest a point on a square grid can be from all
   * of them. Nobody may "tidy" the offset back to a vertical one.
   */
  it("puts a lead's mark at the centre of a lattice cell", () => {
    const lifted = lightGrabPoint(trafficLight.nodes["led.red.cathode"]);
    const nearest = Math.min(
      ...lightCandidates.map((id) => {
        const hole = trafficLight.nodes[id];
        return Math.hypot(lifted.x - hole.x, lifted.y - hole.y);
      }),
    );
    expect(nearest).toBeCloseTo(Math.hypot(PITCH * 0.5, PITCH * 0.5));
    expect(nearest).toBeGreaterThan(PITCH * 0.7);
  });

  it("leaves a hole where it is", () => {
    for (const id of ["board.D9", "bb.j30"]) {
      const hole = trafficLight.nodes[id];
      expect(lightGrabPoint(hole), id).toEqual({ x: hole.x, y: hole.y });
    }
  });
});

/**
 * THE COLUMN IS ONE NODE.
 *
 * The chapter's whole lesson, and the one thing about this build that a person
 * gets told twice: the aside under `tlRed` says the five holes down a column
 * are one strip of metal, and `NODE_GROUPS` is that sentence in the model. If
 * the two ever disagree, the aside is teaching something the panel then marks
 * wrong — which is worse than teaching nothing.
 */
describe("the column is one node", () => {
  /* All twelve bank leads in a row they were not in — columns 27 and 28 with
     their two leads swapped outright, the rest simply moved down the strip.
     Nothing electrical changed: a person who read the row letters off the
     plastic and built it a hole lower has built this. */
  const otherRows = {
    ...lightComplete,
    "led.red.cathode": "bb.g7",
    "res.red.in": "bb.i7",
    "led.red.anode": "bb.i8",
    "wire.red.row": "bb.j8",
    "led.yellow.cathode": "bb.h18",
    "res.yellow.in": "bb.g18",
    "led.yellow.anode": "bb.j19",
    "wire.yellow.row": "bb.f19",
    "led.green.cathode": "bb.j27",
    "res.green.in": "bb.f27",
    "led.green.anode": "bb.h28",
    "wire.green.row": "bb.f28",
  };

  it("is the same build with every lead in a different row", () => {
    const scene = lightSceneFrom(otherRows, lightAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  it("verifies the steps it touches", () => {
    const scene = lightSceneFrom(otherRows, lightAtRest);
    for (const id of ["tlGround", "tlRed", "tlOthers"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });

  /* And the whole `−` rail is one node too, which is what lets three resistors
     and one cable reach ground from four holes that are nowhere near each
     other. */
  it("the ground rail is one node from end to end", () => {
    const scene = lightSceneFrom(
      {
        ...lightComplete,
        "wire.gnd.rail": "bb.neg30",
        "res.red.out": "bb.neg29",
        "res.yellow.out": "bb.neg28",
        "res.green.out": "bb.neg27",
      },
      lightAtRest,
    );
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });
});

/**
 * THE COLUMN IS THE WHOLE NODE.
 *
 * The other half, and the one that has to stay expensive: one column over is a
 * fault, and it has to be reported as ONE fault. Exact matching would make it a
 * missing join plus a stray — two findings, two repairs and two rows in the
 * panel for one gesture — which is what the family arm of `fits` exists to
 * prevent.
 */
describe("the column is the whole node", () => {
  const oneColumnOver = { ...lightComplete, "led.red.cathode": "bb.f9" };

  it("is exactly one mismatch, carrying the expected id", () => {
    const scene = lightSceneFrom(oneColumnOver, lightAtRest);
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("tl.c.red.cathode");
    /* The observed side is what lets the panel say "it is in F9, it belongs in
       F7" instead of "something is missing". */
    expect(mismatches[0].observed?.id).toBe("tl.c.red.cathode");
    expect(mismatches[0].observed?.to).toBe("bb.f9");
    expect(extras(scene)).toHaveLength(0);
  });

  it("fails its step once and leaves the rest of the build ticked", () => {
    const scene = lightSceneFrom(oneColumnOver, lightAtRest);
    const red = verifyStep(scene, "tlRed");
    expect(red.verified).toBe(false);
    expect(red.matched).toBe(5);
    expect(red.strays).toBe(0);
    expect(verifyStep(scene, "tlOthers").verified).toBe(true);
  });
});

/**
 * A 220Ω resistor has no polarity, and the model must not pretend otherwise.
 *
 * Chapter one's bug, on chapter two's bench: built with the resistor turned
 * round the lamp is electrically identical and lights up, and the panel used to
 * report four faults on it. Here the two ends are in two different NETS — one
 * in the bank and one in the rail — so `fits` refuses each end its own expected
 * entry and the interchangeable branch has to hand each of them the other's.
 */
describe("the resistor, turned round", () => {
  const reversed = {
    ...lightComplete,
    "res.red.in": "bb.neg1",
    "res.red.out": "bb.j7",
  };

  it("is a correct build", () => {
    const scene = lightSceneFrom(reversed, lightAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  it("verifies every step it touches", () => {
    const scene = lightSceneFrom(reversed, lightAtRest);
    for (const id of ["tlGround", "tlRed"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });

  it("keeps the sketch's own connection ids, so the panel can name them", () => {
    const ids = lightSceneFrom(reversed, lightAtRest).observed.map((c) => c.id);
    expect([...ids].sort()).toEqual(
      [...trafficLight.expected.map((c) => c.id)].sort(),
    );
  });

  /**
   * And the licence is not a blank cheque.
   *
   * Both ends in the rail is one right join and one join the sketch does not
   * name — never two connections wearing the same id, which is what a mate
   * branch without its guard produces. The guard is that a mate's entry may be
   * borrowed only while the mate cannot currently make that join itself, and
   * here it can: it is sitting in the rail two holes along.
   *
   * `extras()` is silent about it, and that is correct rather than a miss: the
   * whole `−` rail is one node, so the loose end IS making the join the sketch
   * asks for — the panel reports the end that is now missing from the bank,
   * once, which is the finding a person can act on.
   */
  it("does not let both ends claim the same connection", () => {
    const both = {
      ...lightComplete,
      "res.red.in": "bb.neg1",
      "res.red.out": "bb.neg2",
    };
    const scene = lightSceneFrom(both, lightAtRest);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const minted = scene.observed.filter((c) => c.id.includes(".x."));
    expect(minted).toHaveLength(1);
    expect(minted[0].from).toBe("res.red.in");
    expect(diff(scene).mismatches).toHaveLength(1);
    expect(diff(scene).mismatches[0].expected.id).toBe("tl.c.red.resin");
  });
});

/**
 * THE CABLES ARE THE SAME OBJECT.
 *
 * Four M–M jumper cables come out of one bag and nothing on them says which is
 * which. The model names them — `wireRed`, `wireGreen` — because naming them is
 * what keeps `touchesStep`, `partOf` and the step rail's pressable kit rows
 * working on per-end connections; but a person cannot tell them apart, so
 * somebody who wires the red lamp with the cable this file calls green has
 * built the right circuit and the panel must not report faults on it. That is
 * the reversed resistor one level up.
 *
 * The chapter shipped saying that with a single `interchangeable` class holding
 * all EIGHT ends, and that is the wrong sentence for the right claim: `sameJoin`
 * compares one endpoint against one endpoint, so the eight expected SEATS were
 * checked as a set and the four PAIRS were never checked at all. Every one of
 * the 8! = 40 320 seatings verified as a finished build; only 384 of them are
 * this circuit. Which cable is standing in for which is decided per placement
 * now (`cable-joins.ts`), and the tests below are the two halves of the claim: a
 * substituted cable is accepted, and a wrong PAIRING is not.
 */
describe("the cables are the same object", () => {
  it("puts no cable end in a static group with another lead", () => {
    const ends: string[] = lightTerminals.filter((t) => t.startsWith("wire."));
    for (const group of trafficLight.interchangeable ?? []) {
      const cables = group.filter((n) => ends.includes(n));
      expect(cables.length, JSON.stringify(group)).toBeLessThan(2);
    }
  });

  /**
   * The hole itself, as a test: the red jumper running `D13` straight to
   * `board.GND`.
   *
   * Three ordinary gestures from the finished bench reached it, and the product
   * said every check had passed — a digital output shorted to ground, under the
   * one sentence this whole product rests on.
   */
  it("reports a jumper shorting a drive pin to ground", () => {
    const scene = lightSceneFrom(
      { ...lightComplete, "wire.red.row": "board.GND", "wire.gnd.pin": "bb.h8" },
      lightAtRest,
    );
    expect(diff(scene).mismatches).toHaveLength(2);
  });

  /* The same shape one step milder: one end of each of two cables exchanged, so
     one jumper ties two breadboard columns together and the other ties two
     header pins to each other. */
  it("reports two cables' ends exchanged", () => {
    const scene = lightSceneFrom(
      {
        ...lightComplete,
        "wire.red.pin": "bb.h19",
        "wire.yellow.row": "board.D13",
      },
      lightAtRest,
    );
    expect(diff(scene).mismatches).toHaveLength(2);
    expect(extras(scene)).toHaveLength(0);
  });

  /* And the other direction, which the `sequence` check used to fail: one cable
     turned end for end is the same circuit, and nobody can see which way round
     a jumper went in. */
  it("accepts a drive cable plugged in the other way round", () => {
    const scene = lightSceneFrom(
      { ...lightComplete, "wire.red.row": "board.D13", "wire.red.pin": "bb.h8" },
      lightAtRest,
    );
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  it("two drive cables swapped is still a finished build", () => {
    const swapped = {
      ...lightComplete,
      "wire.red.row": "bb.h28",
      "wire.red.pin": "board.D11",
      "wire.green.row": "bb.h8",
      "wire.green.pin": "board.D13",
    };
    const scene = lightSceneFrom(swapped, lightAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    for (const id of ["tlRed", "tlOthers"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });

  /**
   * The harder half: the ground cable used as the red drive line and the red
   * one as ground. Neither end can keep its own expected entry — a rail-aimed
   * join cannot be claimed from the bank and vice versa — so each has to borrow
   * its mate's, and the borrow has to happen at most once per id.
   */
  it("the ground cable and a drive cable swapped is too", () => {
    const swapped = {
      ...lightComplete,
      "wire.gnd.rail": "bb.h8",
      "wire.gnd.pin": "board.D13",
      "wire.red.row": "bb.neg6",
      "wire.red.pin": "board.GND",
    };
    const scene = lightSceneFrom(swapped, lightAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["tlGround", "tlRed"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });

  /* A cable on the wrong header pin keeps ITS OWN id and reports one finding,
     rather than borrowing the neighbour it landed next to. Its own entry is
     tried before any mate's, and this is what that ordering is for. */
  it("but a cable one pin over is still that cable's mistake", () => {
    const scene = lightSceneFrom(
      { ...lightComplete, "wire.red.pin": "board.D10" },
      lightAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("tl.c.red.pin");
    expect(mismatches[0].observed?.id).toBe("tl.c.red.pin");
    /* The label names where the leg actually went, never where it belongs. */
    expect(mismatches[0].observed?.label).toBe("D10");
    expect(extras(scene)).toHaveLength(0);
  });
});

/**
 * A CABLE END GOES IN A HOLE.
 *
 * A cable has no rigid body: each end is drawn from its own seat, so a cable
 * end clipped onto a leg — or a leg clipped onto a cable end — is a join the
 * model would accept, `anchorsFor` would call anchored, and the drawing would
 * have to invent a body to hang off. `flexible` is what lets the refusal be
 * said out loud instead of the part springing back in silence.
 */
describe("a cable end refuses a lead", () => {
  const bench = seat(lightEmpty, "led.red.cathode", "bb.f7");

  it("refuses the gesture from either side, and says which one it is", () => {
    expect(tryAttach(spec, bench, "wire.red.row", "led.red.anode")).toEqual({
      kind: "refused",
      reason: "wireEnd",
    });
    const withCable = seat(bench, "wire.red.pin", "board.D13");
    expect(tryAttach(spec, withCable, "led.red.anode", "wire.red.row")).toEqual({
      kind: "refused",
      reason: "wireEnd",
    });
  });

  /* And the picker never draws a target the write refuses — a mark you can aim
     at and cannot hit is the one thing §8 of `docs/bench-parts.md` forbids. The
     cable is ON the bench here and its free end is a lead of a different part,
     which is exactly what would qualify without the flexible filter. */
  it("offers a cable end nothing but holes, and offers no lead a cable", () => {
    const withCable = seat(bench, "wire.red.pin", "board.D13");

    const forCable = candidatesFor(spec, withCable, "wire.red.row");
    expect(forCable.length).toBeGreaterThan(0);
    for (const id of forCable) expect(isHole(spec, id), id).toBe(true);
    expect(forCable).toContain("bb.h8");

    for (const id of candidatesFor(spec, withCable, "led.red.anode")) {
      expect(id.startsWith("wire."), id).toBe(false);
    }
  });

  /**
   * Half a cable is still a cable you have to be able to finish.
   *
   * A lead with no node is filtered straight out of the workbench's targets and
   * gets no handle, so an end with nothing to hang from would be a gesture that
   * can be started and not completed. The loose end hangs toward the board the
   * cable is reaching for: down off the plastic, up off the header.
   */
  it("gives the loose end of a half-placed cable somewhere to be", () => {
    const onHeader = lightSceneFrom(
      seat(lightEmpty, "wire.red.pin", "board.D13"),
    );
    const seated = onHeader.nodes["board.D13"];
    const loose = onHeader.nodes["wire.red.row"];
    expect(loose).toBeDefined();
    expect(Number.isFinite(loose.x) && Number.isFinite(loose.y)).toBe(true);
    expect(Number.isFinite(lightGrabPoint(loose).x)).toBe(true);
    /* Far enough from its own seat to be a second thing you can take hold of. */
    expect(
      Math.hypot(loose.x - seated.x, loose.y - seated.y),
    ).toBeGreaterThan(PITCH);
    /* Seated on the header, it reaches up toward the breadboard. */
    expect(loose.y).toBeLessThan(seated.y);

    const onBoard = lightSceneFrom(seat(lightEmpty, "wire.gnd.rail", "bb.neg6"));
    /* Seated on the plastic, it dangles down toward the Uno. */
    expect(onBoard.nodes["wire.gnd.pin"].y).toBeGreaterThan(
      onBoard.nodes["bb.neg6"].y,
    );
  });

  it("a cable end takes its hole with it, like any other lead", () => {
    const p = seat(lightEmpty, "wire.red.pin", "board.D13");
    expect(candidatesFor(spec, p, "wire.red.row")).not.toContain("board.D13");
  });
});

describe("the bench is reachable by hand", () => {
  /**
   * The whole chapter, built the way a person builds it, one legal move at a
   * time — twenty drops in the order the steps ask for them, each one offered
   * by the picker before it is accepted by the write, each one pruned after.
   *
   * This is the single most valuable assertion in the file: it is the only one
   * that says the finished build is REACHABLE rather than merely correct as a
   * literal, and it is the only place `candidatesFor` and `tryAttach` are made
   * to agree twenty times running.
   */
  it("a sequence of legal drops reaches the finished traffic light", () => {
    let p: Placement = lightEmpty;
    for (const terminal of lightTerminals) {
      const target = lightComplete[terminal]!;
      expect(
        candidatesFor(spec, p, terminal),
        `${terminal} → ${target}`,
      ).toContain(target);
      const r = tryAttach(spec, p, terminal, target);
      expect(r.kind, `${terminal} → ${target}`).toBe("attached");
      if (r.kind === "attached") p = prune(spec, r.placement);
    }
    expect(p).toEqual(lightComplete);
    const scene = lightSceneFrom(p, lightAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  it("chapter one's mistake is still makeable, and is a stray here", () => {
    /* "The LED straight into the header" — the gesture chapter one is about,
       made on a bench where the LED belongs in the plastic. Deleting this
       would delete the continuity between the two chapters. */
    let p = seat(lightEmpty, "led.red.cathode", "bb.f7");
    expect(candidatesFor(spec, p, "led.red.anode")).toContain("board.D13");
    p = seat(p, "led.red.anode", "board.D13");
    expect(p["led.red.anode"]).toBe("board.D13");
    expect(extras(lightSceneFrom(p))).toHaveLength(1);
  });

  it("a hole holds one lead, whosever it is", () => {
    const p = seat(lightEmpty, "led.red.cathode", "bb.f7");
    expect(candidatesFor(spec, p, "res.red.in")).not.toContain("bb.f7");
    expect(tryAttach(spec, p, "res.red.in", "bb.f7")).toEqual({
      kind: "refused",
      reason: "holeTaken",
    });
  });
});
