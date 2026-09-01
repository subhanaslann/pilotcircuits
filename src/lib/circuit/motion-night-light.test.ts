import { describe, expect, it } from "vitest";
import { boxOf, frame } from "@/lib/circuit/wokwi";
import {
  motionNightLight,
  nightArtOrigins,
  nightAtRest,
  nightBoxesFor,
  nightCandidates,
  nightComplete,
  nightEmpty,
  nightFitBox,
  nightGrabPoint,
  nightLeadRoot,
  nightPartBox,
  nightPins,
  nightPlacement,
  nightSceneFrom,
  nightSensorAt,
  nightTerminals,
} from "@/lib/circuit/motion-night-light";
import {
  diff,
  extras,
  isExtraId,
  sameJoin,
  type Connection,
} from "@/lib/circuit/graph";
import { verifyStep } from "@/lib/agent/findings";
import { nightSteps } from "@/lib/agent/steps";
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
 * Chapter three's spec, conformed — and the three claims that live nowhere else.
 *
 * Chapter two's file is the template and most of it ports unchanged, for the
 * reason it gives: every way a `PlacementSpec` can be wrong renders as a
 * plausible picture rather than as a crash. What this chapter adds is three
 * facts that no other chapter's test can reach, because no other chapter has
 * the bench for them:
 *
 *   1. **The centre channel.** Chapter two offers ONE bank, so "a lead in the
 *      wrong row is right" is the whole of its lesson. Here the sensor comes
 *      down into the top bank and the lamp stands in the bottom one, so each
 *      column is TWO nets with a 2 mm trench between them — and a lead that
 *      crossed it is the same picture and a different circuit. That is a real
 *      breadboard's commonest silent mistake and it is untestable anywhere but
 *      here.
 *   2. **Three holes, one piece of metal.** An Uno prints GND three times. A
 *      ground cable in `GND3` is a correct build; a panel that called it a
 *      fault would be teaching the board wrong.
 *   3. **A part that is a body and three flying leads.** `pir` is `flexible`,
 *      which until now meant "a cable". A module's case is a constant and its
 *      leads are not, so "which lead is seated" must change nothing about where
 *      the case is drawn — and with nothing seated the module is not on the
 *      bench at all.
 *
 * `registry.test.ts` already runs the vocabulary checks over every build in the
 * registry — anchors, lead names, glyph shape, the `empty` / `complete` key
 * sets, component names, hole and terminal disjointness — so none of that is
 * repeated below. What is here is what is true of THIS chapter and of no other.
 */
const spec = nightPlacement;

const seat = (p: Placement, terminal: string, target: string | null) => {
  const r = tryAttach(spec, p, terminal, target);
  return r.kind === "attached" ? r.placement : p;
};

/** The sensor's three leads, in the order its silkscreen prints them. */
const PIR_LEADS = ["pir.vcc", "pir.out", "pir.gnd"] as const;

/** Every end of the four M–M jumpers — one interchangeable class, eight ends. */
const CABLE_ENDS = [
  "wire.power.rail", "wire.power.pin",
  "wire.ground.rail", "wire.ground.pin",
  "wire.signal.row", "wire.signal.pin",
  "wire.lamp.row", "wire.lamp.pin",
] as const;

/** A throwaway edge, for asking `sameJoin` a question directly. */
const probeJoin = (from: string, to: string): Connection => ({
  id: "probe",
  from,
  to,
  role: "signal",
  medium: "leg",
});

describe("the chapter's own shape is the shape it claims", () => {
  /* Seven parts and fifteen leads is not decoration: `builds.ts` builds one
     scene per (lead x offered hole) at every boot, which is 15 x 382 here, and
     the step rail, the kit shelf and the briefing all count these by hand. A
     part or a lead that appears without anyone deciding to add one is a row
     nothing in the product has a sentence for. */
  it("is seven parts, fifteen leads and fifteen joins", () => {
    expect(spec.parts).toHaveLength(7);
    expect(nightTerminals).toHaveLength(15);
    expect(motionNightLight.expected).toHaveLength(15);
    expect(Object.keys(nightComplete)).toHaveLength(15);
  });

  /**
   * The flexible set is the whole of what this chapter changed about parts.
   *
   * `flexible` says two things — each end is positioned from its own seat, and
   * nothing may be clipped to it — and both are true of a module on leads. Drop
   * `pir` out of this list and the sensor becomes a rigid body hung off one
   * anchoring lead: a 94 x 96 case that jumps across the desk depending on
   * which of its three leads was seated first, and legs that other parts may be
   * clipped onto. Add a rigid part to it and that part stops being drawn.
   */
  it("holds the four cables AND the sensor as flexible, and nothing else", () => {
    expect([...(spec.flexible ?? [])].sort()).toEqual([
      "pir",
      "wireGround",
      "wireLamp",
      "wirePower",
      "wireSignal",
    ]);
  });

  /**
   * §0, as an assertion: the breadboard is the join.
   *
   * Chapter one's middle join runs lead to lead. Chapter two has none, and
   * neither does this — fifteen leads, fifteen holes, one each — and that is
   * what keeps `satisfying` four lines and `leadNotFree` off the happy path.
   * The day somebody writes a lead-to-lead value into `complete`, both of those
   * simplifications become wrong and nothing else would say so.
   */
  it("makes not one join lead to lead", () => {
    for (const [terminal, target] of Object.entries(nightComplete)) {
      expect(target, terminal).not.toBeNull();
      expect(isHole(spec, target!), `${terminal} → ${target}`).toBe(true);
      expect(partOf(spec, target!), `${terminal} → ${target}`).toBeUndefined();
    }
  });

  /* A hole holds one lead. Fifteen leads and fourteen distinct holes would draw
     two legs in one 1 mm hole and `verifyStep` would tick green on it. */
  it("puts no two leads in one hole", () => {
    const seats = Object.values(nightComplete);
    expect(new Set(seats).size).toBe(seats.length);
  });

  /**
   * The two properties `connectionFor` and `diff` are decidable under.
   *
   * A terminal in two expected entries makes `expected.find(...)` a coin toss,
   * and two entries sharing a `from` makes `diff`'s same-origin fallback
   * (graph.ts) attribute one lead's stray to the other's expected join.
   */
  it("names every lead in exactly one expected connection", () => {
    const froms = motionNightLight.expected.map((c) => c.from);
    expect(new Set(froms).size).toBe(froms.length);
    for (const terminal of nightTerminals) {
      const owning = motionNightLight.expected.filter(
        (c) => c.from === terminal || c.to === terminal,
      );
      expect(owning, terminal).toHaveLength(1);
    }
  });

  /**
   * Every join runs from a lead to a hole — there is no other side.
   *
   * A hole is never the SUBJECT of an edge: `Placement` is keyed by terminals
   * and `registry.test.ts` forbids a hole from being one. Written backwards, an
   * expected entry would still be FOUND (`connectionFor` matches `from` or
   * `to`) and `satisfying` would then attach a hole to a lead: a placement
   * keyed `bb.f9`, drawn as nothing, reported as nothing.
   */
  it("runs every join from a lead into a hole", () => {
    for (const want of motionNightLight.expected) {
      expect(nightTerminals, want.id).toContain(want.from);
      expect(isHole(spec, want.to), want.id).toBe(true);
    }
  });

  /**
   * The sketch's two constants and the sketch's own wiring agree.
   *
   * `const int PIR = 2, LAMP = 13;` is printed in the chapter's code panel and
   * uploaded to the board. If either drifts from the header hole the cable
   * actually goes in, the learner uploads a program that reads a pin nothing is
   * wired to — and every check in this file still passes, because nothing else
   * reads `nightPins`.
   */
  it("wires the two pins the sketch names", () => {
    const byId = (id: string) =>
      motionNightLight.expected.find((c) => c.id === id);
    expect(byId("mnl.c.signal.pin")?.to).toBe(nightPins.sense);
    expect(byId("mnl.c.lamp.pin")?.to).toBe(nightPins.lamp);
    expect(nightPins.sense).toBe("board.D2");
    expect(nightPins.lamp).toBe("board.D13");
  });

  /**
   * Every join the sketch names belongs to exactly one step.
   *
   * `registry.test.ts` checks the other direction — a step may not claim a
   * connection the sketch does not define. The converse is the silent one: a
   * connection no step owns can never be verified, never appears in a kit list
   * derived from a step, and is invisible to the whole progress rail while
   * still being drawn on the canvas.
   */
  it("gives every join to exactly one step", () => {
    const claimed = nightSteps.flatMap((step) => step.connections);
    expect(new Set(claimed).size).toBe(claimed.length);
    expect([...claimed].sort()).toEqual(
      motionNightLight.expected.map((c) => c.id).sort(),
    );
  });
});

/**
 * The bench this chapter opened up.
 *
 * Chapter two offers one bank and one rail because nothing in it can reach the
 * others. Here the module comes down into the TOP bank, the lamp stands in the
 * bottom one, and the `+` rail is the first live power in the product — so
 * every region is reachable and every region is offered. That is 382 holes, and
 * the number is load-bearing: `builds.ts` pays for one scene per lead per hole
 * at boot, and a region quietly dropped from this list is a hole a person can
 * see, aim at and not hit.
 */
describe("the bench offers both banks, both rails and both headers", () => {
  it("offers 382 distinct holes and every one has a node", () => {
    expect(nightCandidates).toHaveLength(382);
    expect(new Set(nightCandidates).size).toBe(nightCandidates.length);
    for (const hole of nightCandidates) {
      expect(motionNightLight.nodes[hole], hole).toBeDefined();
    }
  });

  it("reaches the top bank, the `+` rail and the power header", () => {
    /* One from each region this chapter added to chapter two's bench. */
    for (const offered of [
      "bb.a1", "bb.e30", "bb.f1", "bb.j30",
      "bb.pos1", "bb.neg30", "board.D0", "board.5V",
      "board.GND2", "board.GND3", "board.VIN", "board.3V3",
    ]) {
      expect(nightCandidates, offered).toContain(offered);
    }
    /* A0–A5 are on the power header and are chapter FOUR's subject. Offering
       them here would put six holes on the bench that no step, no finding and
       no sentence in this chapter has anything to say about. */
    for (const withheld of ["board.A0", "board.A5"]) {
      expect(nightCandidates, withheld).not.toContain(withheld);
    }
  });

  /* The arrow-key order. `live-workbench.tsx` re-sorts its targets by
     `grabPoint`, so a list ordered any other way makes Home/End and the arrow
     keys disagree about which hole comes next. The Uno's header counts DOWN
     from left to right, which is why this is a screen order and not a pin
     order. */
  it("offers them in the order they read on screen", () => {
    for (let i = 1; i < nightCandidates.length; i += 1) {
      const prev = motionNightLight.nodes[nightCandidates[i - 1]];
      const next = motionNightLight.nodes[nightCandidates[i]];
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
 * On the one kind of chapter whose corrections are all about holes, `bb.f9` in
 * the slot reserved for the silkscreen is a graph id leaking into a sentence —
 * and an arrow drawn from one blank to another is not a correction at all.
 */
describe("the holes are addresses, not graph ids", () => {
  it("prints on a bank hole what the breadboard prints", () => {
    expect(motionNightLight.nodes["bb.f9"].label).toBe("F9");
    expect(motionNightLight.nodes["bb.a29"].label).toBe("A29");
    expect(motionNightLight.nodes["bb.j30"].label).toBe("J30");
  });

  it("prints a minus sign on the rail, and says it is a rail", () => {
    expect(motionNightLight.nodes["bb.neg3"].label).toBe("−3");
    expect(motionNightLight.nodes["bb.pos27"].label).toBe("+27");
    /* U+2212, not the hyphen a keyboard produces. Asserted by code point rather
       than by glyph, because the two are indistinguishable in review: a hyphen
       typed into this file would agree with a hyphen typed into the model, the
       pair would pass, and the rail would print a typewriter dash in the slot
       the silkscreen owns. */
    expect(motionNightLight.nodes["bb.neg3"].label?.codePointAt(0)).toBe(0x2212);
    /* `Breadboard` splits rails from banks on exactly these two literals; a
       rail spelled `"pos"` typechecks and then draws as a bank square in the
       middle of the plastic. */
    expect(motionNightLight.nodes["bb.neg3"].row).toBe("-");
    expect(motionNightLight.nodes["bb.pos27"].row).toBe("+");
  });

  /**
   * Three holes, three ids, one printed name.
   *
   * The Uno prints GND on the digital header and twice more on the power one.
   * They are three different NODES — a lead is in one of them and not the other
   * two — and one printed address. A panel that named them `GND1`, `GND2`,
   * `GND3` would be reading our ids back to a person holding a board that says
   * GND three times.
   */
  it("prints GND on all three of the board's ground holes", () => {
    const gnd = ["board.GND", "board.GND2", "board.GND3"] as const;
    for (const id of gnd) {
      expect(motionNightLight.nodes[id].label, id).toBe("GND");
    }
    const seen = gnd.map((id) => {
      const n = motionNightLight.nodes[id];
      return `${n.x},${n.y}`;
    });
    expect(new Set(seen).size, "three holes, three places").toBe(3);
  });
});

describe("sceneFrom", () => {
  it("draws nothing at all on an empty bench", () => {
    const scene = nightSceneFrom(nightEmpty);
    expect(scene.observed).toHaveLength(0);
    for (const terminal of nightTerminals) {
      expect(scene.nodes[terminal], terminal).toBeUndefined();
    }
    /* And nothing is outlined either: an absent key in `nightBoxesFor` means
       "still in the kit", and both the inspection panel and the scene view
       depend on that. The board and the plastic are furniture and are always
       there. */
    expect(Object.keys(nightBoxesFor(scene)).sort()).toEqual([
      "board",
      "breadboard",
    ]);
  });

  it("satisfies the sketch on the finished build and asks for nothing more", () => {
    const scene = nightSceneFrom(nightComplete);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    for (const id of ["mnlPower", "mnlSensor", "mnlLamp"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });

  /**
   * Every seated lead is somewhere, and the flexible ones are exactly in their
   * hole.
   *
   * A lead with no node is filtered straight out of the workbench's targets and
   * out of `observed` — it gets no handle and makes no connection — so a build
   * that seats a lead the scene does not position is a leg that vanishes. The
   * second half is the stronger claim and it is what `flexible` buys: a cable
   * end and a module lead ARE their hole, to the unit, because nothing rigid is
   * holding them anywhere else.
   */
  it("positions every terminal it seats", () => {
    for (const terminal of nightTerminals) {
      const n = motionNightLight.nodes[terminal];
      expect(n, terminal).toBeDefined();
      expect(Number.isFinite(n.x) && Number.isFinite(n.y), terminal).toBe(true);
    }
    for (const terminal of [...CABLE_ENDS, ...PIR_LEADS]) {
      const hole = motionNightLight.nodes[nightComplete[terminal]!];
      expect(motionNightLight.nodes[terminal].x, terminal).toBe(hole.x);
      expect(motionNightLight.nodes[terminal].y, terminal).toBe(hole.y);
    }
  });

  /**
   * The two grids are reconciled AT THE LEAD, and nowhere else.
   *
   * The LED's legs are 10 CSS pixels apart, which is 10.4167 scene units; the
   * breadboard we draw ourselves is on an exact 10. So the anode of an LED
   * whose cathode is in `bb.f9` lands four tenths of a unit off `bb.f10` — a
   * twenty-fifth of a hole, invisible, and correct. What must never happen is
   * that drift growing to something a person could read as the wrong hole.
   */
  it("lands the LED's far leg within half a hole of the hole it is in", () => {
    const anode = motionNightLight.nodes["led.night.anode"];
    const hole = motionNightLight.nodes["bb.f10"];
    const off = Math.hypot(anode.x - hole.x, anode.y - hole.y);
    expect(off).toBeGreaterThan(0);
    expect(off).toBeLessThan(PITCH * 0.5);
  });

  /**
   * And the resistor's far leg is deliberately NOT at its hole.
   *
   * `res.night.out` reaches `bb.neg3` from a body lying across the bottom bank,
   * so the node sits where the resistor's own wire ends and the join is drawn
   * as a line from there down into the rail — the bent leg, which is one of the
   * only two things on this bench that is drawn as a stroke rather than by a
   * part being in a hole. A "tidy-up" that snapped it to the hole would delete
   * the leg from the picture.
   */
  it("leaves the resistor's far leg standing above the rail it reaches", () => {
    const out = motionNightLight.nodes["res.night.out"];
    const rail = motionNightLight.nodes["bb.neg3"];
    expect(Math.hypot(out.x - rail.x, out.y - rail.y)).toBeGreaterThan(PITCH);
    expect(out.y, "the leg bends down into the rail, never up").toBeLessThan(
      rail.y,
    );
  });

  it("mints a distinct id for a join the sketch does not name", () => {
    /* Chapter one's build, made on chapter three's bench: the LED standing in
       its own column with its long leg reaching straight over to the header. */
    const p = seat(
      seat(nightEmpty, "led.night.cathode", "bb.f9"),
      "led.night.anode",
      "board.D13",
    );
    const stray = extras(nightSceneFrom(p));
    expect(stray).toHaveLength(1);
    expect(stray[0].id).not.toBe("mnl.c.led.anode");
    expect(stray[0].id).toBe("mnl.x.led.night.anode");
    /* Two spellings of the prefix — one exported from `graph.ts` and one
       hardcoded per build — is a rename away from `diff` quietly attributing a
       stray to an expected wire. */
    expect(isExtraId(stray[0].id)).toBe(true);
    expect(stray[0].role).toBe("idle");
  });

  it("carries `mechanical` through rather than resetting it", () => {
    const turned = { servoAngle: 45, expectedAngle: 0 };
    expect(nightSceneFrom(nightComplete, turned).mechanical).toEqual(turned);
  });

  it("omits a connection whose endpoints are not both on the bench", () => {
    /* A resistor clipped to an LED that is still in the kit. `prune` normally
       makes this unreachable, and this scene is reached from a hand-written
       literal — the briefing film and the lab both hand `nightSceneFrom` one. */
    const hanging = nightSceneFrom({
      ...nightEmpty,
      "res.night.in": "led.night.anode",
    });
    expect(hanging.observed).toHaveLength(0);

    const partial = nightSceneFrom(seat(nightEmpty, "led.night.cathode", "bb.f9"));
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
    expect(() => nightSceneFrom({ ledNight: "bb.f9" })).toThrow(/not a terminal/);
  });
});

/**
 * THE COLUMN IS ONE NODE — chapter two's lesson, on a bench with two banks.
 *
 * The five holes down a column are one strip of metal, and the aside under the
 * lamp step says so in words. `NODE_GROUPS` is that sentence in the model. If
 * the two disagree, the aside is teaching something the panel then marks wrong,
 * which is worse than teaching nothing.
 */
describe("a lead in the wrong row of the right column is the same circuit", () => {
  /* Every bank lead moved down its own strip — the sensor's OUT lead and the
     signal cable in the top bank, the lamp group in the bottom one. Nothing
     electrical changed: a person who read the row letters off the plastic and
     built it a hole lower has built this. */
  const otherRows = {
    ...nightComplete,
    "pir.out": "bb.d29",
    "wire.signal.row": "bb.b29",
    "led.night.cathode": "bb.i9",
    "res.night.in": "bb.g9",
    "led.night.anode": "bb.j10",
    "wire.lamp.row": "bb.f10",
  };

  it("is the finished build with every bank lead in a different row", () => {
    const scene = nightSceneFrom(otherRows, nightAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  it("verifies every step it touches", () => {
    const scene = nightSceneFrom(otherRows, nightAtRest);
    for (const id of ["mnlSensor", "mnlLamp"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });

  /* And each rail is one node from end to end, which is what lets a sensor
     drawing 5 V at column 27 and a cable delivering it at column 30 be the same
     join — and a resistor at column 3 reach the same ground the cable does at
     column 30. */
  it("treats each rail as one node from end to end", () => {
    const scene = nightSceneFrom(
      {
        ...nightComplete,
        "wire.power.rail": "bb.pos1",
        "pir.vcc": "bb.pos15",
        "wire.ground.rail": "bb.neg1",
        "pir.gnd": "bb.neg15",
        "res.night.out": "bb.neg28",
      },
      nightAtRest,
    );
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    expect(verifyStep(scene, "mnlPower").verified).toBe(true);
  });
});

/**
 * THE COLUMN IS THE WHOLE NODE.
 *
 * One column over is a fault, and it has to be reported as ONE fault. Exact
 * matching would make it a missing join plus a stray — two findings, two
 * repairs and two rows in the panel for one gesture — which is what the family
 * arm of `fits` exists to prevent.
 */
describe("a lead one column over is one fault, named where it landed", () => {
  const oneColumnOver = { ...nightComplete, "led.night.cathode": "bb.f8" };

  it("is exactly one mismatch, carrying the expected id", () => {
    const scene = nightSceneFrom(oneColumnOver, nightAtRest);
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("mnl.c.led.cathode");
    /* The observed side is what lets the panel say "it is in F8, it belongs in
       F9" instead of "something is missing". */
    expect(mismatches[0].observed?.id).toBe("mnl.c.led.cathode");
    expect(mismatches[0].observed?.to).toBe("bb.f8");
    expect(extras(scene)).toHaveLength(0);
  });

  it("fails its step once and leaves the rest of the build ticked", () => {
    const scene = nightSceneFrom(oneColumnOver, nightAtRest);
    const lamp = verifyStep(scene, "mnlLamp");
    expect(lamp.verified).toBe(false);
    expect(lamp.matched).toBe(5);
    expect(lamp.strays).toBe(0);
    expect(verifyStep(scene, "mnlSensor").verified).toBe(true);
    expect(verifyStep(scene, "mnlPower").verified).toBe(true);
  });
});

/**
 * THE CENTRE CHANNEL — chapter three's own version of the lesson.
 *
 * Chapter two cannot test this: it offers one bank, so every hole it knows
 * about is on the same side of the trench. Here the sensor's OUT lead stands in
 * column 29 of the TOP bank and the signal cable leaves from column 29 of the
 * top bank, four rows down; the lamp stands in the BOTTOM bank. Same column,
 * same x, one 2 mm channel apart on screen — and two different nets.
 *
 * A model that made each column one group would call a lead pushed across the
 * channel correct. It is the commonest silent mistake there is on a real
 * breadboard, it looks right in every photograph, and the only thing that can
 * tell a person about it is the panel.
 */
describe("a lead across the centre channel is a different circuit", () => {
  it("puts the two banks of one column in different groups", () => {
    const groups = motionNightLight.interchangeable ?? [];
    expect(groups.some((g) => g.includes("bb.a29") && g.includes("bb.e29"))).toBe(
      true,
    );
    expect(groups.some((g) => g.includes("bb.f9") && g.includes("bb.j9"))).toBe(
      true,
    );
    expect(groups.some((g) => g.includes("bb.a29") && g.includes("bb.f29"))).toBe(
      false,
    );
    /* Asked of `sameJoin` directly, because that is the function every
       comparison in `graph.ts` routes through. */
    expect(
      sameJoin(
        motionNightLight,
        probeJoin("pir.out", "bb.a29"),
        probeJoin("pir.out", "bb.e29"),
      ),
    ).toBe(true);
    expect(
      sameJoin(
        motionNightLight,
        probeJoin("pir.out", "bb.a29"),
        probeJoin("pir.out", "bb.f29"),
      ),
    ).toBe(false);
  });

  it("is the same column and the same x, which is why nothing else can see it", () => {
    const top = motionNightLight.nodes["bb.a29"];
    const bottom = motionNightLight.nodes["bb.f29"];
    expect(top.col).toBe(bottom.col);
    expect(top.x).toBe(bottom.x);
  });

  it("reports the sensor's lead pushed across the channel, once", () => {
    const scene = nightSceneFrom(
      { ...nightComplete, "pir.out": "bb.f29" },
      nightAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("mnl.c.pir.out");
    expect(mismatches[0].observed?.id).toBe("mnl.c.pir.out");
    expect(mismatches[0].observed?.to).toBe("bb.f29");
    expect(extras(scene)).toHaveLength(0);
    const sensor = verifyStep(scene, "mnlSensor");
    expect(sensor.verified).toBe(false);
    expect(sensor.matched).toBe(4);
    expect(sensor.strays).toBe(0);
  });

  it("reports the lamp's lead pushed the other way across it, once", () => {
    const scene = nightSceneFrom(
      { ...nightComplete, "led.night.cathode": "bb.a9" },
      nightAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("mnl.c.led.cathode");
    expect(mismatches[0].observed?.to).toBe("bb.a9");
    expect(extras(scene)).toHaveLength(0);
    expect(verifyStep(scene, "mnlLamp").matched).toBe(5);
  });
});

/**
 * THREE HOLES, ONE PIECE OF METAL.
 *
 * An Uno prints GND on the digital header and twice more on the power one, and
 * all three are the same copper. This chapter is the first to reach the power
 * header at all, so it is the first that can get this wrong — and the person
 * most likely to plug the ground cable into `GND2` is the one who has just come
 * from the `5V` hole beside it.
 */
describe("a ground cable in any of the board's three GND holes is correct", () => {
  for (const hole of ["board.GND2", "board.GND3"] as const) {
    it(`accepts the ground cable in ${hole}`, () => {
      const scene = nightSceneFrom(
        { ...nightComplete, "wire.ground.pin": hole },
        nightAtRest,
      );
      expect(diff(scene).mismatches).toHaveLength(0);
      expect(extras(scene)).toHaveLength(0);
      expect(verifyStep(scene, "mnlPower").verified).toBe(true);
      /* And the join still prints GND — the label names the hole the lead
         REACHED, so a person reading the panel sees the board's own word rather
         than our id for one of the three. */
      const got = scene.observed.find((c) => c.id === "mnl.c.ground.pin");
      expect(got?.to).toBe(hole);
      expect(got?.label).toBe("GND");
    });
  }

  /* And the licence stops at the three holes that print GND. `VIN` is on the
     same header, one hole along from `GND3`, and it is not ground. Without the
     group being an explicit list of three, "the power header" would be the
     family and this would pass. */
  it("still reports the ground cable in VIN, once", () => {
    const scene = nightSceneFrom(
      { ...nightComplete, "wire.ground.pin": "board.VIN" },
      nightAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("mnl.c.ground.pin");
    expect(mismatches[0].observed?.to).toBe("board.VIN");
    expect(mismatches[0].observed?.label).toBe("VIN");
    expect(extras(scene)).toHaveLength(0);
  });
});

/**
 * ONE RAIL FAMILY, FOR THE MOST INSTRUCTIVE MISTAKE IN THE CHAPTER.
 *
 * `familyOf` answers `"rail"` for BOTH rails on purpose. The family decides only
 * whether a lead may CLAIM its expected id; `sameJoin` then decides whether it
 * is right. One family for both means the power cable that went into the `−`
 * rail keeps `mnl.c.power.rail` and is reported ONCE — "it is in −12, it belongs
 * in +30" — instead of as a missing join AND a stray for the same gesture.
 *
 * Two families would split it into two findings, two repair buttons and two
 * rows in the panel, for one cable that one hand put in one wrong hole. And
 * this is the chapter's first live power rail: putting 5 V where ground belongs
 * is the mistake it exists to be able to talk about.
 */
describe("a power cable in the ground rail is one finding, not two", () => {
  const intoGroundRail = { ...nightComplete, "wire.power.rail": "bb.neg12" };

  it("keeps its own connection id and names the hole it is in", () => {
    const scene = nightSceneFrom(intoGroundRail, nightAtRest);
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("mnl.c.power.rail");
    expect(mismatches[0].observed?.id).toBe("mnl.c.power.rail");
    expect(mismatches[0].observed?.to).toBe("bb.neg12");
  });

  it("is not also a stray, which is the whole point of one rail family", () => {
    const scene = nightSceneFrom(intoGroundRail, nightAtRest);
    expect(extras(scene)).toHaveLength(0);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const power = verifyStep(scene, "mnlPower");
    expect(power.verified).toBe(false);
    expect(power.matched).toBe(3);
    expect(power.strays).toBe(0);
  });
});

/**
 * THE CABLES ARE THE SAME OBJECT.
 *
 * Four M–M jumper cables come out of one bag and nothing on them says which is
 * which. The model names them — `wirePower`, `wireLamp` — because naming them
 * is what keeps `touchesStep`, `partOf` and the step rail's pressable kit rows
 * working on per-end connections; but a person cannot tell them apart, so
 * somebody who powers the rail with the cable this file calls "the lamp's" has
 * built the right circuit and the panel must not report faults on it.
 */
describe("the four cables' eight ends are interchangeable", () => {
  /**
   * And they are interchangeable **as cables**, not as ends.
   *
   * A static class of all eight ends is the obvious way to say it and it is a
   * hole: `sameJoin` compares one endpoint against one endpoint, so with every
   * end equivalent to every other the eight expected seats are checked as a SET
   * and the four PAIRS are never checked at all. Chapter two carries that class
   * and can only cross-drive three lamps with it; here the same class spans two
   * power rails and `5V`, and swapping the two supply cables' rail ends puts
   * five volts on the `−` rail and verifies as a finished build.
   *
   * So the finished scene publishes no such group, and which cable is standing
   * in for which is decided per placement (`cable-joins.ts`). The two tests
   * below are the two halves of the claim: a substituted cable is accepted, and
   * a wrong PAIRING is not.
   */
  it("does not put the eight ends in one static group", () => {
    const groups = motionNightLight.interchangeable ?? [];
    for (const end of CABLE_ENDS) {
      const shared = groups.find(
        (g) => g.includes(end) && g.some((other) => other !== end),
      );
      expect(shared, `${end} is in a group with another lead`).toBeUndefined();
    }
  });

  /* The hole itself, as a test. Neither of these builds is the circuit the
     sketch asks for, and before the pairing rule both verified. */
  it("reports the two supply cables' rail ends swapped", () => {
    const scene = nightSceneFrom(
      {
        ...nightComplete,
        "wire.power.rail": "bb.neg30",
        "wire.ground.rail": "bb.pos30",
      },
      nightAtRest,
    );
    expect(diff(scene).mismatches).toHaveLength(2);
  });

  it("reports a dead short across the supply", () => {
    const scene = nightSceneFrom(
      {
        ...nightComplete,
        "wire.power.rail": "bb.pos30",
        "wire.power.pin": "bb.neg30",
        "wire.ground.rail": "board.5V",
        "wire.ground.pin": "board.GND",
      },
      nightAtRest,
    );
    expect(diff(scene).mismatches.length).toBeGreaterThan(0);
  });

  it("reports the sensor's line and the lamp's line swapped", () => {
    const scene = nightSceneFrom(
      {
        ...nightComplete,
        "wire.signal.pin": "board.D13",
        "wire.lamp.pin": "board.D2",
      },
      nightAtRest,
    );
    expect(diff(scene).mismatches).toHaveLength(2);
  });

  /**
   * The hard case, and the reason the mate branch has a guard.
   *
   * Neither cable's rail-aimed end can keep its own entry once it is in the
   * bank, and neither bank-aimed end can keep its own once it is in the rail —
   * so each has to BORROW its mate's, and the borrow may happen at most once
   * per id. Without the guard, two observed connections would wear the same id
   * and every reader that matches by id (`comparedTo`, `isResolved`, the
   * success trace, `stepParts`) would pick whichever came first.
   */
  it("accepts the lamp wired with the power cable, and the rail with the lamp's", () => {
    const swapped = {
      ...nightComplete,
      "wire.power.rail": "bb.h10",
      "wire.power.pin": "board.D13",
      "wire.lamp.row": "bb.pos30",
      "wire.lamp.pin": "board.5V",
    };
    const scene = nightSceneFrom(swapped, nightAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["mnlPower", "mnlLamp"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });

  it("accepts the signal cable and the ground cable swapped", () => {
    const swapped = {
      ...nightComplete,
      "wire.ground.rail": "bb.e29",
      "wire.ground.pin": "board.D2",
      "wire.signal.row": "bb.neg30",
      "wire.signal.pin": "board.GND",
    };
    const scene = nightSceneFrom(swapped, nightAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /* A cable on the wrong header pin keeps ITS OWN id and reports one finding,
     rather than borrowing the neighbour it landed next to. Its own entry is
     tried before any mate's, and this is what that ordering is for. */
  it("but a cable one pin over is still that cable's own mistake", () => {
    const scene = nightSceneFrom(
      { ...nightComplete, "wire.lamp.pin": "board.D12" },
      nightAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("mnl.c.lamp.pin");
    expect(mismatches[0].observed?.id).toBe("mnl.c.lamp.pin");
    /* The label names where the leg actually went, never where it belongs. */
    expect(mismatches[0].observed?.label).toBe("D12");
    expect(extras(scene)).toHaveLength(0);
  });
});

/**
 * A 220Ω resistor has no polarity, and the model must not pretend otherwise.
 *
 * Chapter one's shipped bug: built with the resistor turned round the lamp is
 * electrically identical and lights up, and the panel used to report four
 * faults on it. Here the two ends are in two different NETS — one in the bank
 * and one in the rail — so `fits` refuses each end its own expected entry and
 * the interchangeable branch has to hand each of them the other's.
 */
describe("the resistor turned round is a correct build", () => {
  const reversed = {
    ...nightComplete,
    "res.night.in": "bb.neg3",
    "res.night.out": "bb.j9",
  };

  it("reports nothing on it and verifies the lamp step", () => {
    const scene = nightSceneFrom(reversed, nightAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    expect(verifyStep(scene, "mnlLamp").verified).toBe(true);
  });

  it("keeps the sketch's own connection ids, so the panel can name them", () => {
    const ids = nightSceneFrom(reversed, nightAtRest).observed.map((c) => c.id);
    expect([...ids].sort()).toEqual(
      [...motionNightLight.expected.map((c) => c.id)].sort(),
    );
  });

  /**
   * And the licence is not a blank cheque.
   *
   * Both ends in the rail is one right join and one join the sketch does not
   * name — never two connections wearing the same id, which is what a mate
   * branch without its guard produces. The guard is that a mate's entry may be
   * borrowed only while the mate cannot currently make that join itself, and
   * here it can: it is sitting in the rail a few holes along.
   */
  it("does not let both ends claim the same connection", () => {
    const both = {
      ...nightComplete,
      "res.night.in": "bb.neg3",
      "res.night.out": "bb.neg4",
    };
    const scene = nightSceneFrom(both, nightAtRest);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const minted = scene.observed.filter((c) => isExtraId(c.id));
    expect(minted).toHaveLength(1);
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("mnl.c.res.in");
  });
});

/**
 * THE SENSOR'S THREE LEADS ARE NOT.
 *
 * The distinction §11's rule turns on, and the reason `SYMMETRIC` stops at the
 * cables and the resistor. A module's leads are colour-coded and printed on its
 * case — `+`, `D`, `−`, in white, right beside the pins — the person can tell
 * them apart, and putting 5 V into the OUT pin is a real mistake with a real
 * consequence. Fold them into the interchangeable class "for symmetry" and the
 * panel goes silent on the one wiring mistake that can damage the part.
 */
describe("the sensor's three leads are not interchangeable", () => {
  it("puts no sensor lead in any interchangeable group", () => {
    for (const group of motionNightLight.interchangeable ?? []) {
      expect(
        group.filter((id) => id.startsWith("pir.")),
        group.join(","),
      ).toHaveLength(0);
    }
  });

  /* Three leads, three different characters — which is WHY they are not
     interchangeable. A part that printed the same thing on all three would be a
     part a person cannot tell apart, and the rule would have to change with
     it. */
  it("prints a different character beside each of them", () => {
    const glyphs = PIR_LEADS.map((t) => spec.leadGlyph(t));
    expect(glyphs).toEqual(["+", "D", "−"]);
    expect(new Set(glyphs).size).toBe(3);
  });

  /**
   * The shelf's table and the scene's table say the same thing.
   *
   * `ART_LABELS` is keyed to what the KIT SHELF draws and `MODULE_LABELS` to
   * what the scene prints on the lead node. Two tables, one fact about the
   * silkscreen; the day they disagree, a lead changes its mind about which pin
   * it is on the way down from the shelf to the board.
   */
  it("prints the same character on the shelf and on the bench", () => {
    for (const terminal of PIR_LEADS) {
      expect(motionNightLight.nodes[terminal].label, terminal).toBe(
        spec.leadGlyph(terminal),
      );
    }
    /* And the resistor deliberately differs: the scene prints `220Ω` on both
       ends and the shelf prints nothing, because naming one of two identical
       ends would be the interface asserting a difference the part does not
       have. That asymmetry is the reason the two tables exist separately. */
    expect(spec.leadGlyph("res.night.in")).toBeUndefined();
    expect(motionNightLight.nodes["res.night.in"].label).toBe("220Ω");
  });

  it("reports the sensor's + and − leads swapped, as two findings", () => {
    const scene = nightSceneFrom(
      { ...nightComplete, "pir.vcc": "bb.neg25", "pir.gnd": "bb.pos27" },
      nightAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(2);
    expect(mismatches.map((m) => m.expected.id).sort()).toEqual([
      "mnl.c.pir.gnd",
      "mnl.c.pir.vcc",
    ]);
    /* Each one names the hole it is in, so the panel can say "the + lead is in
       −25" rather than "something is missing". Two findings here is right: two
       leads were put in two wrong holes, and each has to move. */
    for (const m of mismatches) {
      expect(m.observed, m.expected.id).toBeDefined();
    }
    expect(extras(scene)).toHaveLength(0);
    expect(verifyStep(scene, "mnlSensor").matched).toBe(3);
  });
});

/**
 * A MODULE IS A BODY THAT STANDS STILL AND LEADS THAT DO NOT.
 *
 * The other half of `flexible`, and the thing chapter three invented. An
 * HC-SR501's case is 94 x 96 scene units — nine and a half columns wide and
 * most of a bank tall — so a module plugged straight into the plastic would
 * stand over the rows either side of it and over the rail above them. On a real
 * bench nobody does that: it goes on the end of three jumpers and sits where it
 * can see the room. So its case is a constant of the DESK and its leads are the
 * placement.
 */
describe("the sensor's case never moves and its leads always do", () => {
  it("is not on the bench at all until one of its leads is seated", () => {
    for (const placement of [
      nightEmpty,
      /* And the whole rest of the build present, which is the case a bench
         actually reaches: everything wired, sensor still in the box. */
      {
        ...nightComplete,
        "pir.vcc": null,
        "pir.out": null,
        "pir.gnd": null,
      },
    ]) {
      const scene = nightSceneFrom(placement);
      for (const terminal of PIR_LEADS) {
        expect(scene.nodes[terminal], terminal).toBeUndefined();
      }
      /* A case with three leads reaching nowhere is a part on the bench that
         nobody has put there — so `nightArtOrigins` answers `undefined` and
         `nightBoxesFor` omits the key entirely, which is how both the scene
         view and the inspection panel read "still in the kit". */
      expect(nightArtOrigins(scene).pir).toBeUndefined();
      expect(nightBoxesFor(scene).pir).toBeUndefined();
    }
  });

  it("reports its three joins as missing while it is still in the box", () => {
    const scene = nightSceneFrom(
      { ...nightComplete, "pir.vcc": null, "pir.out": null, "pir.gnd": null },
      nightAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches.map((m) => m.expected.id).sort()).toEqual([
      "mnl.c.pir.gnd",
      "mnl.c.pir.out",
      "mnl.c.pir.vcc",
    ]);
    for (const m of mismatches) expect(m.observed).toBeUndefined();
    expect(extras(scene)).toHaveLength(0);
  });

  /**
   * One lead seated puts all three on the bench — the seated one in its hole
   * and the other two at the point they leave the case.
   *
   * A lead with no node is filtered out of the workbench's targets and gets no
   * handle, so a module whose unseated leads had nowhere to be would be a part
   * you can start placing and cannot finish. A cable solves this with a slack
   * rule; a module needs none, because its leads have somewhere REAL to be.
   */
  for (const anchor of PIR_LEADS) {
    it(`hangs its other two leads off the case when ${anchor} is the one seated`, () => {
      const hole = nightComplete[anchor]!;
      const scene = nightSceneFrom({ ...nightEmpty, [anchor]: hole });

      const seated = scene.nodes[anchor];
      expect(seated.x).toBe(scene.nodes[hole].x);
      expect(seated.y).toBe(scene.nodes[hole].y);

      for (const other of PIR_LEADS.filter((t) => t !== anchor)) {
        const node = scene.nodes[other];
        expect(node, other).toBeDefined();
        /* Compared against `nightLeadRoot`, which is what the DRAWING uses to
           start the strand from the case. Two tables of pin offsets — the
           scene's and the artwork's — is the drift `wokwi.ts` exists to
           prevent, and this is the assertion that they are one fact. */
        const root = nightLeadRoot(other, nightSensorAt);
        expect(root, other).toBeDefined();
        expect(node.x).toBeCloseTo(root!.x);
        expect(node.y).toBeCloseTo(root!.y);
        /* And it can still be picked up and finished. */
        expect(Number.isFinite(nightGrabPoint(node).x)).toBe(true);
        expect(candidatesFor(spec, { ...nightEmpty, [anchor]: hole }, other))
          .toContain(nightComplete[other]!);
      }
    });
  }

  it("draws its case in the same place whichever lead is holding it up", () => {
    const boxes = [
      nightBoxesFor(motionNightLight).pir,
      ...PIR_LEADS.map(
        (anchor) =>
          nightBoxesFor(
            nightSceneFrom({ ...nightEmpty, [anchor]: nightComplete[anchor]! }),
          ).pir,
      ),
      /* And with a lead in a hole at the far end of the bench, which is where a
         "position the body from its anchor" model would visibly break. */
      nightBoxesFor(nightSceneFrom({ ...nightEmpty, "pir.out": "bb.f1" })).pir,
    ];
    /* The BOX spans the case and wherever the leads have got to — it is what a
       vision result outlines, and a box that stopped at the case would frame a
       part whose own wires run off the edge of it. What must not move is the
       CASE, so every box has to contain it wherever the leads are. */
    const caseBox = {
      x: nightSensorAt.x - 10,
      y: nightSensorAt.y - 10,
      right: nightSensorAt.x + boxOf(frame.pir).width + 10,
      bottom: nightSensorAt.y + boxOf(frame.pir).height + 10,
    };
    for (const box of boxes) {
      expect(box).toBeDefined();
      expect(box!.x).toBeLessThanOrEqual(caseBox.x);
      expect(box!.y).toBeLessThanOrEqual(caseBox.y);
      expect(box!.x + box!.width).toBeGreaterThanOrEqual(caseBox.right);
      expect(box!.y + box!.height).toBeGreaterThanOrEqual(caseBox.bottom);
    }
    for (const placement of [nightComplete, { ...nightEmpty, "pir.gnd": "bb.j30" }]) {
      expect(nightArtOrigins(nightSceneFrom(placement)).pir).toEqual(
        nightSensorAt,
      );
    }
  });

  /* The three leads come out of the bottom edge of the case, left to right in
     the order the silkscreen prints them. A transposed pin table would draw the
     `+` strand from where `−` leaves the board, which is a picture that teaches
     the opposite of the truth. */
  it("takes its leads out of the bottom of its own case, in printed order", () => {
    const roots = PIR_LEADS.map((t) => nightLeadRoot(t, nightSensorAt)!);
    expect(roots.map((r) => r.x)).toEqual([...roots.map((r) => r.x)].sort((a, b) => a - b));
    expect(new Set(roots.map((r) => r.x)).size).toBe(3);
    for (const root of roots) {
      expect(root.y).toBeGreaterThan(nightSensorAt.y);
      expect(root.x).toBeGreaterThan(nightPartBox.pir.x);
      expect(root.x).toBeLessThan(nightPartBox.pir.x + nightPartBox.pir.width);
      expect(root.y).toBeLessThan(nightPartBox.pir.y + nightPartBox.pir.height);
    }
  });

  /* And it answers for nothing but its own leads. `nightLeadRoot` is asked
     about every terminal the drawing walks; a cable end that got a root would
     grow a strand out of a case it is not attached to. */
  it("gives a lead root to the module's leads and to nothing else", () => {
    for (const terminal of [...CABLE_ENDS, "led.night.cathode", "res.night.out"]) {
      expect(nightLeadRoot(terminal, nightSensorAt), terminal).toBeUndefined();
    }
    expect(nightLeadRoot("pir.vcc", { x: 0, y: 0 })).toBeDefined();
  });
});

/**
 * A CABLE END, AND NOW A MODULE LEAD, GOES IN A HOLE.
 *
 * Neither has a rigid body: each is positioned from its own seat, so a lead
 * clipped onto one — or one clipped onto a lead — is a join the model would
 * accept, `anchorsFor` would call anchored, and the drawing would have to
 * invent a body to hang off. `flexible` is what lets the refusal be said out
 * loud instead of the part springing back in silence.
 */
describe("nothing clips to a cable end or to a sensor lead", () => {
  const bench = seat(nightEmpty, "led.night.cathode", "bb.f9");

  it("refuses the gesture from either side, and says which one it is", () => {
    expect(tryAttach(spec, bench, "wire.lamp.row", "led.night.anode")).toEqual({
      kind: "refused",
      reason: "wireEnd",
    });
    const withCable = seat(bench, "wire.lamp.pin", "board.D13");
    expect(
      tryAttach(spec, withCable, "led.night.anode", "wire.lamp.row"),
    ).toEqual({ kind: "refused", reason: "wireEnd" });
  });

  /* The same refusal for the module, which is new here: chapter two's only
     flexible parts are cables, so `wireEnd` had never been asked about a part
     with three leads and a case. */
  it("refuses it for the sensor too, from either side", () => {
    expect(tryAttach(spec, bench, "pir.out", "led.night.anode")).toEqual({
      kind: "refused",
      reason: "wireEnd",
    });
    const withSensor = seat(bench, "pir.vcc", "bb.pos27");
    expect(tryAttach(spec, withSensor, "led.night.anode", "pir.out")).toEqual({
      kind: "refused",
      reason: "wireEnd",
    });
  });

  /* And the picker never draws a target the write refuses — a mark you can aim
     at and cannot hit is the one thing §8 of `docs/bench-parts.md` forbids. */
  it("offers a flexible lead nothing but holes, and offers no lead one of them", () => {
    const p = seat(seat(bench, "wire.lamp.pin", "board.D13"), "pir.vcc", "bb.pos27");

    for (const flexible of ["wire.lamp.row", "pir.out"]) {
      const offered = candidatesFor(spec, p, flexible);
      expect(offered.length, flexible).toBeGreaterThan(0);
      for (const id of offered) expect(isHole(spec, id), `${flexible} → ${id}`).toBe(true);
    }
    expect(candidatesFor(spec, p, "wire.lamp.row")).toContain("bb.h10");
    expect(candidatesFor(spec, p, "pir.out")).toContain("bb.a29");

    for (const id of candidatesFor(spec, p, "led.night.anode")) {
      expect(id.startsWith("wire."), id).toBe(false);
      expect(id.startsWith("pir."), id).toBe(false);
    }
  });

  /**
   * Half a cable is still a cable you have to be able to finish.
   *
   * The loose end hangs toward the board the cable is reaching for: down off
   * the plastic, up off the header. A module needs no such rule — its leads
   * hang on its own case — which is exactly the difference between the two
   * kinds of flexible part.
   */
  it("gives the loose end of a half-placed cable somewhere to be", () => {
    const onHeader = nightSceneFrom(
      seat(nightEmpty, "wire.lamp.pin", "board.D13"),
    );
    const seated = onHeader.nodes["board.D13"];
    const loose = onHeader.nodes["wire.lamp.row"];
    expect(loose).toBeDefined();
    expect(Number.isFinite(loose.x) && Number.isFinite(loose.y)).toBe(true);
    expect(Number.isFinite(nightGrabPoint(loose).x)).toBe(true);
    /* Far enough from its own seat to be a second thing you can take hold of. */
    expect(Math.hypot(loose.x - seated.x, loose.y - seated.y)).toBeGreaterThan(
      PITCH,
    );
    /* Seated on the header, it reaches up toward the breadboard. */
    expect(loose.y).toBeLessThan(seated.y);

    const onBoard = nightSceneFrom(
      seat(nightEmpty, "wire.power.rail", "bb.pos30"),
    );
    /* Seated on the plastic, it dangles down toward the Uno. */
    expect(onBoard.nodes["wire.power.pin"].y).toBeGreaterThan(
      onBoard.nodes["bb.pos30"].y,
    );
  });

  it("takes a hole with the lead that is in it, whosever lead that is", () => {
    const p = seat(nightEmpty, "wire.lamp.pin", "board.D13");
    expect(candidatesFor(spec, p, "wire.lamp.row")).not.toContain("board.D13");

    const q = seat(nightEmpty, "led.night.cathode", "bb.f9");
    expect(candidatesFor(spec, q, "res.night.in")).not.toContain("bb.f9");
    expect(tryAttach(spec, q, "res.night.in", "bb.f9")).toEqual({
      kind: "refused",
      reason: "holeTaken",
    });
  });
});

describe("satisfying — the demo control's shortcut", () => {
  it("reaches every expected connection from an empty bench", () => {
    for (const want of motionNightLight.expected) {
      const next = spec.satisfying(nightEmpty, want.id);
      expect(next, want.id).not.toBeNull();
      const scene = nightSceneFrom(prune(spec, next!), nightAtRest);
      expect(diff(scene, [want.id]).mismatches, want.id).toHaveLength(0);
    }
  });

  it("declines an id this build does not name", () => {
    expect(spec.satisfying(nightEmpty, "c.sensor.echo")).toBeNull();
    /* Chapters one and two are in the same global id namespace and this build
       must not answer for them. */
    expect(spec.satisfying(nightEmpty, "bl.c.anode")).toBeNull();
    expect(spec.satisfying(nightEmpty, "tl.c.red.cathode")).toBeNull();
  });

  /**
   * `null` rather than an unchanged record: returning the same placement made a
   * declined shortcut indistinguishable from a performed one, so the caller
   * committed, credited a repair and logged a move it had not made.
   */
  it("declines a join that is already true", () => {
    for (const want of motionNightLight.expected) {
      expect(spec.satisfying(nightComplete, want.id), want.id).toBeNull();
    }
  });

  /**
   * It reaches the finished build from ANY state, which is the property the
   * demo menu actually depends on.
   *
   * `freeing` is what makes this true: the target hole is emptied of whoever is
   * standing in it before the named lead is put there. Without it, driving the
   * demo from a half-wrong bench would silently no-op on exactly the joins a
   * demonstration is being given about.
   */
  it("walks any bench to the finished build, one shortcut at a time", () => {
    const scrambled: Placement = {
      ...nightComplete,
      "led.night.cathode": "bb.f10",
      "led.night.anode": "bb.f9",
      "pir.vcc": "bb.a29",
      "pir.out": "bb.pos27",
      "wire.power.rail": "bb.neg12",
      "wire.ground.pin": "board.GND3",
    };
    for (const start of [nightEmpty, scrambled, nightComplete]) {
      let p: Placement = start;
      for (const want of motionNightLight.expected) {
        p = spec.satisfying(p, want.id) ?? p;
      }
      expect(prune(spec, p)).toEqual(nightComplete);
    }
  });

  it("never breaks a join that was already right", () => {
    for (const want of motionNightLight.expected) {
      const others = motionNightLight.expected.filter((c) => c.id !== want.id);
      /* Build everything but `want`, then ask for `want`. */
      let p: Placement = nightEmpty;
      for (const other of others) p = spec.satisfying(p, other.id) ?? p;
      const built = prune(spec, p);
      const next = spec.satisfying(built, want.id);
      if (!next) continue;
      const scene = nightSceneFrom(prune(spec, next), nightAtRest);
      expect(diff(scene).mismatches, want.id).toHaveLength(0);
    }
  });
});

describe("clearing — the demo control's removal", () => {
  /* The LED standing in its own column with its long leg reaching over to the
     header — chapter one's build, made on chapter three's bench, where it is a
     join the sketch does not name. */
  const strayPlacement = seat(
    seat(nightEmpty, "led.night.cathode", "bb.f9"),
    "led.night.anode",
    "board.D13",
  );

  it("removes exactly the join it names", () => {
    const stray = extras(nightSceneFrom(strayPlacement))[0];
    const next = spec.clearing(strayPlacement, stray.id, {
      from: stray.from,
      to: stray.to,
    });
    expect(next).not.toBeNull();
    expect(extras(nightSceneFrom(prune(spec, next!)))).toHaveLength(0);
    /* And it did not disturb the leg that was in the right hole. */
    expect(next!["led.night.cathode"]).toBe("bb.f9");
  });

  it("declines a stale edge instead of firing on whatever is there now", () => {
    const stray = extras(nightSceneFrom(strayPlacement))[0];
    /* The person moved it themselves before pressing the button. */
    const moved = seat(strayPlacement, "led.night.anode", "board.D11");
    expect(
      spec.clearing(moved, stray.id, { from: stray.from, to: stray.to }),
    ).toBeNull();
  });

  it("declines an id that is not a stray at all", () => {
    expect(
      spec.clearing(nightComplete, "mnl.c.led.anode", {
        from: "led.night.anode",
        to: "bb.f10",
      }),
    ).toBeNull();
    /* And another chapter's minted id, which shares the shape but not the
       prefix. */
    expect(
      spec.clearing(strayPlacement, "tl.x.led.red.anode", {
        from: "led.night.anode",
        to: "board.D13",
      }),
    ).toBeNull();
  });
});

describe("grabPoint", () => {
  it("is total over every node in the finished scene", () => {
    for (const node of Object.values(motionNightLight.nodes)) {
      const at = nightGrabPoint(node);
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
    const lifted = nightGrabPoint(motionNightLight.nodes["led.night.cathode"]);
    const nearest = Math.min(
      ...nightCandidates.map((id) => {
        const hole = motionNightLight.nodes[id];
        return Math.hypot(lifted.x - hole.x, lifted.y - hole.y);
      }),
    );
    expect(nearest).toBeCloseTo(Math.hypot(PITCH * 0.5, PITCH * 0.5));
    expect(nearest).toBeGreaterThan(PITCH * 0.7);
  });

  it("leaves a hole where it is", () => {
    for (const id of ["board.5V", "bb.a29", "bb.pos30"]) {
      const hole = motionNightLight.nodes[id];
      expect(nightGrabPoint(hole), id).toEqual({ x: hole.x, y: hole.y });
    }
  });
});

describe("the bench is reachable by hand", () => {
  /**
   * The whole chapter, built the way a person builds it, one legal move at a
   * time — fifteen drops in the order the steps ask for them, each one offered
   * by the picker before it is accepted by the write, each one pruned after.
   *
   * This is the single most valuable assertion in the file: it is the only one
   * that says the finished build is REACHABLE rather than merely correct as a
   * literal, and it is the only place `candidatesFor` and `tryAttach` are made
   * to agree fifteen times running. It also walks the sensor onto the bench
   * lead by lead, which is the gesture nothing before chapter three had.
   */
  it("reaches the finished night light by a sequence of legal drops", () => {
    let p: Placement = nightEmpty;
    for (const terminal of nightTerminals) {
      const target = nightComplete[terminal]!;
      expect(
        candidatesFor(spec, p, terminal),
        `${terminal} → ${target}`,
      ).toContain(target);
      const r = tryAttach(spec, p, terminal, target);
      expect(r.kind, `${terminal} → ${target}`).toBe("attached");
      if (r.kind === "attached") p = prune(spec, r.placement);

      /* Nothing is invented on the way: every join made so far is one the
         sketch asks for, so a half-built bench never accuses the builder of a
         stray they have not made. */
      const partial = nightSceneFrom(p, nightAtRest);
      expect(extras(partial), `after ${terminal}`).toHaveLength(0);
      expect(partial.observed, `after ${terminal}`).toHaveLength(
        nightTerminals.indexOf(terminal) + 1,
      );
    }
    expect(p).toEqual(nightComplete);
    const scene = nightSceneFrom(p, nightAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  it("still lets chapter one's mistake be made, and calls it a stray here", () => {
    /* "The LED straight into the header" — the gesture chapter one is about,
       made on a bench where the LED belongs in the plastic. Deleting this would
       delete the continuity between the chapters. */
    let p = seat(nightEmpty, "led.night.cathode", "bb.f9");
    expect(candidatesFor(spec, p, "led.night.anode")).toContain("board.D13");
    p = seat(p, "led.night.anode", "board.D13");
    expect(p["led.night.anode"]).toBe("board.D13");
    expect(extras(nightSceneFrom(p))).toHaveLength(1);
  });

  /* And the sensor's own mistake, which is the one step three is about: the
     module powered from `3V3` instead of the rail the cable feeds. Reachable,
     as it must be — a lesson about a wrong pin is only a lesson if the wrong
     pin is on the bench. */
  it("still lets the sensor be powered off the wrong header hole", () => {
    const p = seat(nightEmpty, "pir.vcc", "board.3V3");
    expect(p["pir.vcc"]).toBe("board.3V3");
    const scene = nightSceneFrom(p);
    expect(extras(scene)).toHaveLength(1);
    expect(extras(scene)[0].id).toBe("mnl.x.pir.vcc");
  });
});

/**
 * `nightFitBox` is a CONSTANT, and it has to contain everything.
 *
 * `fitView`'s memo depends on this box, so one derived from the live placement
 * would frame a different thing before and after every drop. But chapter one
 * shipped with a box taken from the finished lamp alone and drew a just-placed
 * LED off the top of the canvas — so a constant is only correct if it covers
 * the states a person actually passes through on the way to the finished build.
 *
 * The walk below is the same fifteen drops as above, checked box by box, plus
 * the two standoff cases (a part hung off another part's free lead, which lifts
 * it a whole 14 mm off the plastic) and the sensor alone.
 */
describe("the fit box contains every box the model can produce", () => {
  const contains = (
    box: { x: number; y: number; width: number; height: number },
    what: string,
  ) => {
    expect(box.x, `${what} left`).toBeGreaterThanOrEqual(nightFitBox.x);
    expect(box.y, `${what} top`).toBeGreaterThanOrEqual(nightFitBox.y);
    expect(box.x + box.width, `${what} right`).toBeLessThanOrEqual(
      nightFitBox.x + nightFitBox.width,
    );
    expect(box.y + box.height, `${what} bottom`).toBeLessThanOrEqual(
      nightFitBox.y + nightFitBox.height,
    );
  };

  const checkAll = (placement: Placement, what: string) => {
    for (const [id, box] of Object.entries(nightBoxesFor(nightSceneFrom(placement)))) {
      contains(box, `${what} · ${id}`);
    }
  };

  it("is a real box with room in it", () => {
    expect(Number.isFinite(nightFitBox.x)).toBe(true);
    expect(Number.isFinite(nightFitBox.y)).toBe(true);
    expect(nightFitBox.width).toBeGreaterThan(0);
    expect(nightFitBox.height).toBeGreaterThan(0);
  });

  it("frames the empty bench and the finished build", () => {
    checkAll(nightEmpty, "empty");
    checkAll(nightComplete, "complete");
    /* The sensor's case stands off the desk, above and right of the plastic — a
       fit view taken from the board and the breadboard alone would crop it. */
    contains(nightPartBox.pir, "sensor case");
    expect(nightPartBox.pir.y).toBeLessThan(nightPartBox.breadboard.y);
  });

  it("frames every state on the way to the finished build", () => {
    let p: Placement = nightEmpty;
    for (const terminal of nightTerminals) {
      p = prune(spec, seat(p, terminal, nightComplete[terminal]!));
      checkAll(p, `after ${terminal}`);
    }
  });

  /* The two `STANDOFF` cases: a rigid part hung off another rigid part's free
     lead stands 14 mm clear of the plastic, which is the highest anything on
     this bench ever reaches and is not a state the finished build contains. */
  it("frames a part hung off another part's free lead, either way round", () => {
    checkAll(
      {
        ...nightEmpty,
        "res.night.in": "bb.j9",
        "led.night.cathode": "res.night.out",
      },
      "lamp on the resistor",
    );
    checkAll(
      {
        ...nightEmpty,
        "led.night.cathode": "bb.f9",
        "res.night.in": "led.night.anode",
      },
      "resistor on the lamp",
    );
  });

  /* A cable with one end down still has the other end out on its slack, up off
     the header or down off the plastic — the loose end reaches further than
     either seated end ever does. */
  it("frames a half-placed cable's loose end, on either board", () => {
    checkAll(
      {
        ...nightEmpty,
        "wire.power.pin": "board.5V",
        "wire.ground.pin": "board.GND",
        "wire.signal.pin": "board.D2",
        "wire.lamp.pin": "board.D13",
      },
      "cables on the header",
    );
    checkAll(
      {
        ...nightEmpty,
        "wire.power.rail": "bb.pos30",
        "wire.ground.rail": "bb.neg30",
        "wire.signal.row": "bb.e29",
        "wire.lamp.row": "bb.h10",
      },
      "cables on the plastic",
    );
  });

  it("frames the sensor whichever of its leads is the one on the bench", () => {
    for (const anchor of PIR_LEADS) {
      checkAll({ ...nightEmpty, [anchor]: nightComplete[anchor]! }, anchor);
    }
  });
});
