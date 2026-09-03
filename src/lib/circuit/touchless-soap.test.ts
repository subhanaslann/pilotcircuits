import { describe, expect, it } from "vitest";
import { boxOf, frame } from "@/lib/circuit/wokwi";
import {
  soapArtOrigins,
  soapAtRest,
  soapBoxesFor,
  soapCandidates,
  soapComplete,
  soapEmpty,
  soapFitBox,
  soapGrabPoint,
  soapLeadRoot,
  soapLines,
  soapPartBox,
  soapPins,
  soapPlacement,
  soapSceneFrom,
  soapSensorAt,
  soapServoAt,
  soapTerminals,
  touchlessSoap,
} from "@/lib/circuit/touchless-soap";
import {
  diff,
  extras,
  isExtraId,
  isServoAligned,
  sameJoin,
  type Connection,
} from "@/lib/circuit/graph";
import { verifyStep } from "@/lib/agent/findings";
import { soapSteps } from "@/lib/agent/steps";
import { pwmPins } from "@/lib/circuit/breathing-lamp";
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
 * Chapter five's spec, conformed — and the four claims that live nowhere else.
 *
 * Chapter three's file is the template and most of it ports unchanged, for the
 * reason it gives: every way a `PlacementSpec` can be wrong renders as a
 * plausible picture rather than as a crash. What this chapter adds is four
 * facts that no other chapter's test can reach, because no other chapter has
 * the bench for them:
 *
 *   1. **Two modules at once.** Chapter three invented "a case that stands
 *      still and leads that do not" and had one of them. Here there are two,
 *      standing in two places, and every claim about one of them has to hold
 *      of the other independently — which is the property a single module
 *      cannot distinguish from a global constant. Taking one module off the
 *      bench must leave the other where it was.
 *   2. **A pin that has to be able to hold a value.** The servo's signal goes
 *      straight to `board.D9`, which is marked `~`. Moved to any other digital
 *      pin the build is still seventeen joins of two seated ends each, and the
 *      pump does not move at all — so the fault has to be visible twice: as a
 *      wiring mismatch, and as a pin `pwmPins` excludes. This is chapter one's
 *      lesson arriving on a part where getting it wrong is silent.
 *   3. **Two pins that are one measurement.** `Trig` and `Echo` reach `D8` and
 *      `D7` on the sensor's own leads — no cable, no breadboard — and they are
 *      not interchangeable in either direction. Swapped, that is two leads in
 *      two wrong holes and therefore two findings.
 *   4. **`mechanical` on a bench somebody builds.** `soapAtRest` has the two
 *      angles EQUAL on purpose: no gesture here mounts a horn, so what
 *      `checksMechanical` asserts on the servo step is that a build wired
 *      right has a horn where the sketch thinks it is.
 *
 * `registry.test.ts` already runs the vocabulary checks over every build in the
 * registry — anchors, lead names, glyph shape, the `empty` / `complete` key
 * sets, component names, hole and terminal disjointness — so none of that is
 * repeated below. What is here is what is true of THIS chapter and of no other.
 */
const spec = soapPlacement;

const seat = (p: Placement, terminal: string, target: string | null) => {
  const r = tryAttach(spec, p, terminal, target);
  return r.kind === "attached" ? r.placement : p;
};

/** The distance sensor's four leads, in the order its silkscreen prints them. */
const SENSOR_LEADS = [
  "sensor.vcc",
  "sensor.trig",
  "sensor.echo",
  "sensor.gnd",
] as const;

/** The servo's three leads, top to bottom down the case's left edge. */
const SERVO_LEADS = ["servo.ground", "servo.power", "servo.signal"] as const;

/** Both modules, as the two things every module claim has to hold of. */
const MODULES = [
  { part: "sensor", at: soapSensorAt, leads: SENSOR_LEADS, art: frame.sensor },
  { part: "servo", at: soapServoAt, leads: SERVO_LEADS, art: frame.servo },
] as const;

const MODULE_LEADS = [...SENSOR_LEADS, ...SERVO_LEADS];

/** Every end of the three M–M jumpers — one interchangeable class, six ends. */
const CABLE_ENDS = [
  "wire.power.rail",
  "wire.power.pin",
  "wire.ground.rail",
  "wire.ground.pin",
  "wire.lamp.row",
  "wire.lamp.pin",
] as const;

/** A digital pin that is NOT marked `~`, and that this build leaves empty. */
const NOT_PWM = "board.D4";

/** A throwaway edge, for asking `sameJoin` a question directly. */
const probeJoin = (from: string, to: string): Connection => ({
  id: "probe",
  from,
  to,
  role: "signal",
  medium: "leg",
});

describe("the chapter's own shape is the shape it claims", () => {
  /* Seven parts and seventeen leads is not decoration: `builds.ts` builds one
     scene per (lead x offered hole) at every boot, which is 17 x 382 here, and
     the step rail, the kit shelf and the briefing all count these by hand. A
     part or a lead that appears without anyone deciding to add one is a row
     nothing in the product has a sentence for. */
  it("is seven parts, seventeen leads and seventeen joins", () => {
    expect(spec.parts).toHaveLength(7);
    expect(soapTerminals).toHaveLength(17);
    expect(touchlessSoap.expected).toHaveLength(17);
    expect(Object.keys(soapComplete)).toHaveLength(17);
  });

  /**
   * The flexible set is what this chapter has two of.
   *
   * `flexible` says two things — each end is positioned from its own seat, and
   * nothing may be clipped to it — and both are true of a module on leads. Drop
   * `servo` out of this list and the pump becomes a rigid body hung off one
   * anchoring lead: a 177 x 124 case that jumps around the desk depending on
   * which of its three leads was seated first, and legs that other parts may be
   * clipped onto. Add a rigid part to it and that part stops being drawn.
   */
  it("holds the three cables AND both modules as flexible, and nothing else", () => {
    expect([...(spec.flexible ?? [])].sort()).toEqual([
      "sensor",
      "servo",
      "wireGround",
      "wireLamp",
      "wirePower",
    ]);
  });

  /**
   * §0, as an assertion: the board and the breadboard are the join.
   *
   * Chapter one's middle join runs lead to lead. Chapters two to five have none
   * — seventeen leads, seventeen holes, one each — and that is what keeps
   * `satisfying` four lines and `leadNotFree` off the happy path. The day
   * somebody writes a lead-to-lead value into `complete`, both of those
   * simplifications become wrong and nothing else would say so.
   */
  it("makes not one join lead to lead", () => {
    for (const [terminal, target] of Object.entries(soapComplete)) {
      expect(target, terminal).not.toBeNull();
      expect(isHole(spec, target!), `${terminal} → ${target}`).toBe(true);
      expect(partOf(spec, target!), `${terminal} → ${target}`).toBeUndefined();
    }
  });

  /* A hole holds one lead. Seventeen leads and sixteen distinct holes would
     draw two legs in one 1 mm hole and `verifyStep` would tick green on it. */
  it("puts no two leads in one hole", () => {
    const seats = Object.values(soapComplete);
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
    const froms = touchlessSoap.expected.map((c) => c.from);
    expect(new Set(froms).size).toBe(froms.length);
    for (const terminal of soapTerminals) {
      const owning = touchlessSoap.expected.filter(
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
   * keyed `bb.f8`, drawn as nothing, reported as nothing.
   */
  it("runs every join from a lead into a hole", () => {
    for (const want of touchlessSoap.expected) {
      expect(soapTerminals, want.id).toContain(want.from);
      expect(isHole(spec, want.to), want.id).toBe(true);
    }
  });

  /**
   * The sketch's four constants and the sketch's own wiring agree.
   *
   * `const int TRIG = 8, ECHO = 7, PUMP = 9, LAMP = 13;` is printed in the
   * chapter's code panel and uploaded to the board. If any of them drifts from
   * the hole the lead actually goes in, the learner uploads a program that
   * pulses a pin nothing is wired to — and every check in this file still
   * passes, because nothing else reads `soapPins`.
   */
  it("wires the four pins the sketch names", () => {
    const byId = (id: string) => touchlessSoap.expected.find((c) => c.id === id);
    expect(byId("tsd.c.sensor.trig")?.to).toBe(soapPins.trig);
    expect(byId("tsd.c.sensor.echo")?.to).toBe(soapPins.echo);
    expect(byId("tsd.c.servo.signal")?.to).toBe(soapPins.pump);
    expect(byId("tsd.c.lamp.pin")?.to).toBe(soapPins.lamp);
    expect(soapPins.trig).toBe("board.D8");
    expect(soapPins.echo).toBe("board.D7");
    expect(soapPins.pump).toBe("board.D9");
    expect(soapPins.lamp).toBe("board.D13");
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
    const claimed = soapSteps.flatMap((step) => step.connections);
    expect(new Set(claimed).size).toBe(claimed.length);
    expect([...claimed].sort()).toEqual(
      touchlessSoap.expected.map((c) => c.id).sort(),
    );
  });

  /* Every id this chapter mints is this chapter's. Connection ids are one flat
     global namespace (`registry.test.ts` guards the collisions); the prefix is
     what lets a person reading a finding know which bench it came off. */
  it("prefixes every connection it names with its own chapter's stem", () => {
    for (const want of touchlessSoap.expected) {
      expect(want.id.startsWith("tsd.c."), want.id).toBe(true);
    }
  });
});

/**
 * The bench, which is chapter three's with the analogue header still withheld.
 *
 * Both banks, both rails and both headers, because the sensor's supply goes to
 * the rails, its two signal leads go straight to the digital header, and `5V`
 * is on the power one. That is 382 holes, and the number is load-bearing:
 * `builds.ts` pays for one scene per lead per hole at boot, and a region
 * quietly dropped from this list is a hole a person can see, aim at and not
 * hit.
 */
describe("the bench offers both banks, both rails and both headers", () => {
  it("offers 382 distinct holes and every one has a node", () => {
    expect(soapCandidates).toHaveLength(382);
    expect(new Set(soapCandidates).size).toBe(soapCandidates.length);
    for (const hole of soapCandidates) {
      expect(touchlessSoap.nodes[hole], hole).toBeDefined();
    }
  });

  it("reaches both banks, both rails and both of the board's headers", () => {
    for (const offered of [
      "bb.a1", "bb.e30", "bb.f1", "bb.j30",
      "bb.pos1", "bb.neg30", "board.D0", "board.D13",
      "board.5V", "board.GND2", "board.GND3", "board.VIN", "board.3V3",
    ]) {
      expect(soapCandidates, offered).toContain(offered);
    }
    /* A0–A5 are on the power header and are chapter FOUR's subject. Offering
       them here would put six holes on the bench that no step, no finding and
       no sentence in this chapter has anything to say about. */
    for (const withheld of ["board.A0", "board.A5"]) {
      expect(soapCandidates, withheld).not.toContain(withheld);
    }
  });

  /* The arrow-key order. `live-workbench.tsx` re-sorts its targets by
     `grabPoint`, so a list ordered any other way makes Home/End and the arrow
     keys disagree about which hole comes next. The Uno's header counts DOWN
     from left to right, which is why this is a screen order and not a pin
     order. */
  it("offers them in the order they read on screen", () => {
    for (let i = 1; i < soapCandidates.length; i += 1) {
      const prev = touchlessSoap.nodes[soapCandidates[i - 1]];
      const next = touchlessSoap.nodes[soapCandidates[i]];
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
 * On a chapter whose corrections are mostly about holes, `bb.f8` in the slot
 * reserved for the silkscreen is a graph id leaking into a sentence — and an
 * arrow drawn from one blank to another is not a correction at all.
 */
describe("the holes are addresses, not graph ids", () => {
  it("prints on a bank hole what the breadboard prints", () => {
    expect(touchlessSoap.nodes["bb.f8"].label).toBe("F8");
    expect(touchlessSoap.nodes["bb.a29"].label).toBe("A29");
    expect(touchlessSoap.nodes["bb.j30"].label).toBe("J30");
  });

  it("prints a minus sign on the rail, and says it is a rail", () => {
    expect(touchlessSoap.nodes["bb.neg2"].label).toBe("−2");
    expect(touchlessSoap.nodes["bb.pos25"].label).toBe("+25");
    /* U+2212, not the hyphen a keyboard produces. Asserted by code point rather
       than by glyph, because the two are indistinguishable in review: a hyphen
       typed into this file would agree with a hyphen typed into the model, the
       pair would pass, and the rail would print a typewriter dash in the slot
       the silkscreen owns. */
    expect(touchlessSoap.nodes["bb.neg2"].label?.codePointAt(0)).toBe(0x2212);
    /* `Breadboard` splits rails from banks on exactly these two literals; a
       rail spelled `"pos"` typechecks and then draws as a bank square in the
       middle of the plastic. */
    expect(touchlessSoap.nodes["bb.neg2"].row).toBe("-");
    expect(touchlessSoap.nodes["bb.pos25"].row).toBe("+");
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
      expect(touchlessSoap.nodes[id].label, id).toBe("GND");
    }
    const seen = gnd.map((id) => {
      const n = touchlessSoap.nodes[id];
      return `${n.x},${n.y}`;
    });
    expect(new Set(seen).size, "three holes, three places").toBe(3);
  });

  /* And `board.GND` is the digital header's GND1, which is this chapter's
     choice and the opposite of chapters four and six's. Everything this build
     reads or drives is on the digital side; only `5V` is not. */
  it("puts the ground cable on the digital header, beside the pins it drives", () => {
    const gnd1 = touchlessSoap.nodes["board.GND"];
    const d13 = touchlessSoap.nodes["board.D13"];
    const gnd2 = touchlessSoap.nodes["board.GND2"];
    expect(gnd1.y).toBe(d13.y);
    expect(gnd1.y).not.toBe(gnd2.y);
  });
});

describe("sceneFrom", () => {
  it("draws nothing at all on an empty bench", () => {
    const scene = soapSceneFrom(soapEmpty);
    expect(scene.observed).toHaveLength(0);
    for (const terminal of soapTerminals) {
      expect(scene.nodes[terminal], terminal).toBeUndefined();
    }
    /* And nothing is outlined either: an absent key in `soapBoxesFor` means
       "still in the kit", and both the inspection panel and the scene view
       depend on that. The board and the plastic are furniture and are always
       there. */
    expect(Object.keys(soapBoxesFor(scene)).sort()).toEqual([
      "board",
      "breadboard",
    ]);
  });

  it("satisfies the sketch on the finished build and asks for nothing more", () => {
    const scene = soapSceneFrom(soapComplete);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    for (const id of ["tsdPower", "tsdSensor", "tsdServo", "tsdLamp"] as const) {
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
    for (const terminal of soapTerminals) {
      const n = touchlessSoap.nodes[terminal];
      expect(n, terminal).toBeDefined();
      expect(Number.isFinite(n.x) && Number.isFinite(n.y), terminal).toBe(true);
    }
    for (const terminal of [...CABLE_ENDS, ...MODULE_LEADS]) {
      const hole = touchlessSoap.nodes[soapComplete[terminal]!];
      expect(touchlessSoap.nodes[terminal].x, terminal).toBe(hole.x);
      expect(touchlessSoap.nodes[terminal].y, terminal).toBe(hole.y);
    }
  });

  /**
   * The two grids are reconciled AT THE LEAD, and nowhere else.
   *
   * The LED's legs are 10 CSS pixels apart, which is 10.4167 scene units; the
   * breadboard we draw ourselves is on an exact 10. So the anode of an LED
   * whose cathode is in `bb.f8` lands four tenths of a unit off `bb.f9` — a
   * twenty-fifth of a hole, invisible, and correct. What must never happen is
   * that drift growing to something a person could read as the wrong hole.
   */
  it("lands the LED's far leg within half a hole of the hole it is in", () => {
    const anode = touchlessSoap.nodes["led.soap.anode"];
    const hole = touchlessSoap.nodes["bb.f9"];
    const off = Math.hypot(anode.x - hole.x, anode.y - hole.y);
    expect(off).toBeGreaterThan(0);
    expect(off).toBeLessThan(PITCH * 0.5);
  });

  /**
   * And the resistor's far leg is deliberately NOT at its hole.
   *
   * `res.soap.out` reaches `bb.neg2` from a body lying across the bottom bank,
   * so the node sits where the resistor's own wire ends and the join is drawn
   * as a line from there down into the rail — the bent leg, which is one of the
   * only two things on this bench that is drawn as a stroke rather than by a
   * part being in a hole. A "tidy-up" that snapped it to the hole would delete
   * the leg from the picture.
   */
  it("leaves the resistor's far leg standing above the rail it reaches", () => {
    const out = touchlessSoap.nodes["res.soap.out"];
    const rail = touchlessSoap.nodes["bb.neg2"];
    expect(Math.hypot(out.x - rail.x, out.y - rail.y)).toBeGreaterThan(PITCH);
    expect(out.y, "the leg bends down into the rail, never up").toBeLessThan(
      rail.y,
    );
  });

  it("mints a distinct id for a join the sketch does not name", () => {
    /* Chapter one's build, made on chapter five's bench: the LED standing in
       its own column with its long leg reaching straight over to the header. */
    const p = seat(
      seat(soapEmpty, "led.soap.cathode", "bb.f8"),
      "led.soap.anode",
      "board.D13",
    );
    const stray = extras(soapSceneFrom(p));
    expect(stray).toHaveLength(1);
    expect(stray[0].id).not.toBe("tsd.c.led.anode");
    expect(stray[0].id).toBe("tsd.x.led.soap.anode");
    /* Two spellings of the prefix — one exported from `graph.ts` and one
       hardcoded per build — is a rename away from `diff` quietly attributing a
       stray to an expected wire. */
    expect(isExtraId(stray[0].id)).toBe(true);
    expect(stray[0].role).toBe("idle");
  });

  it("carries `mechanical` through rather than resetting it", () => {
    const turned = { servoAngle: 45, expectedAngle: 0 };
    expect(soapSceneFrom(soapComplete, turned).mechanical).toEqual(turned);
  });

  it("omits a connection whose endpoints are not both on the bench", () => {
    /* A resistor clipped to an LED that is still in the kit. `prune` normally
       makes this unreachable, and this scene is reached from a hand-written
       literal — the briefing film and the lab both hand `soapSceneFrom` one. */
    const hanging = soapSceneFrom({
      ...soapEmpty,
      "res.soap.in": "led.soap.anode",
    });
    expect(hanging.observed).toHaveLength(0);

    const partial = soapSceneFrom(seat(soapEmpty, "led.soap.cathode", "bb.f8"));
    expect(
      partial.observed.every((c) => partial.nodes[c.from] && partial.nodes[c.to]),
    ).toBe(true);
  });

  it("refuses a placement keyed by parts instead of by leads", () => {
    /* `Placement`'s key type is `string`, so this typechecks everywhere it is
       written. It draws an empty board and throws nothing, which is a bug that
       survives review; the dev guard is what makes it loud. */
    expect(() => soapSceneFrom({ ledSoap: "bb.f8" })).toThrow(/not a terminal/);
  });
});

/**
 * THE COLUMN IS ONE NODE — chapter two's lesson, on chapter five's bench.
 *
 * The five holes down a column are one strip of metal, and the aside under the
 * lamp step says so in words. `NODE_GROUPS` is that sentence in the model. If
 * the two disagree, the aside is teaching something the panel then marks wrong,
 * which is worse than teaching nothing.
 */
describe("a lead in the wrong row of the right column is the same circuit", () => {
  /* Every bank lead moved down its own strip. This chapter's bank leads are all
     in the BOTTOM bank and all belong to the lamp — the sensor and the servo
     take their supply off the rails and their signals off the header — so this
     is the lamp group, built by somebody who read the row letters off the
     plastic and came down a hole lower. Nothing electrical changed. */
  const otherRows = {
    ...soapComplete,
    "led.soap.cathode": "bb.h8",
    "led.soap.anode": "bb.h9",
    "res.soap.in": "bb.i8",
    "wire.lamp.row": "bb.j9",
  };

  it("is the finished build with every bank lead in a different row", () => {
    const scene = soapSceneFrom(otherRows, soapAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  it("verifies every step it touches, and leaves the others ticked", () => {
    const scene = soapSceneFrom(otherRows, soapAtRest);
    for (const id of ["tsdPower", "tsdSensor", "tsdServo", "tsdLamp"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });

  /* And each rail is one node from end to end, which is what lets the sensor
     drawing 5 V at column 25 and the servo drawing it at column 28 be fed by
     one cable delivering it at column 30 — and a resistor at column 2 reach the
     same ground the servo returns to at column 26. */
  it("treats each rail as one node from end to end", () => {
    const scene = soapSceneFrom(
      {
        ...soapComplete,
        "wire.power.rail": "bb.pos1",
        "sensor.vcc": "bb.pos15",
        "servo.power": "bb.pos20",
        "wire.ground.rail": "bb.neg1",
        "sensor.gnd": "bb.neg15",
        "servo.ground": "bb.neg20",
        "res.soap.out": "bb.neg22",
      },
      soapAtRest,
    );
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    for (const id of ["tsdPower", "tsdSensor", "tsdServo"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
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
  const oneColumnOver = { ...soapComplete, "led.soap.cathode": "bb.f7" };

  it("is exactly one mismatch, carrying the expected id", () => {
    const scene = soapSceneFrom(oneColumnOver, soapAtRest);
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("tsd.c.led.cathode");
    /* The observed side is what lets the panel say "it is in F7, it belongs in
       F8" instead of "something is missing". */
    expect(mismatches[0].observed?.id).toBe("tsd.c.led.cathode");
    expect(mismatches[0].observed?.to).toBe("bb.f7");
    expect(extras(scene)).toHaveLength(0);
  });

  it("fails its step once and leaves the rest of the build ticked", () => {
    const scene = soapSceneFrom(oneColumnOver, soapAtRest);
    const lamp = verifyStep(scene, "tsdLamp");
    expect(lamp.verified).toBe(false);
    expect(lamp.matched).toBe(5);
    expect(lamp.strays).toBe(0);
    for (const id of ["tsdPower", "tsdSensor", "tsdServo"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });
});

/**
 * THE CENTRE CHANNEL.
 *
 * The lamp stands in the BOTTOM bank, and the top bank of the same column is a
 * different piece of metal — same x, one 2 mm channel apart on screen, two
 * nets. A model that made each column one group would call a lead pushed across
 * the channel correct. It is the commonest silent mistake there is on a real
 * breadboard, it looks right in every photograph, and the only thing that can
 * tell a person about it is the panel.
 */
describe("a lead across the centre channel is a different circuit", () => {
  it("puts the two banks of one column in different groups", () => {
    const groups = touchlessSoap.interchangeable ?? [];
    expect(groups.some((g) => g.includes("bb.a8") && g.includes("bb.e8"))).toBe(
      true,
    );
    expect(groups.some((g) => g.includes("bb.f8") && g.includes("bb.j8"))).toBe(
      true,
    );
    expect(groups.some((g) => g.includes("bb.a8") && g.includes("bb.f8"))).toBe(
      false,
    );
    /* Asked of `sameJoin` directly, because that is the function every
       comparison in `graph.ts` routes through. */
    expect(
      sameJoin(
        touchlessSoap,
        probeJoin("led.soap.cathode", "bb.f8"),
        probeJoin("led.soap.cathode", "bb.j8"),
      ),
    ).toBe(true);
    expect(
      sameJoin(
        touchlessSoap,
        probeJoin("led.soap.cathode", "bb.f8"),
        probeJoin("led.soap.cathode", "bb.e8"),
      ),
    ).toBe(false);
  });

  it("is the same column and the same x, which is why nothing else can see it", () => {
    const top = touchlessSoap.nodes["bb.e8"];
    const bottom = touchlessSoap.nodes["bb.f8"];
    expect(top.col).toBe(bottom.col);
    expect(top.x).toBe(bottom.x);
  });

  it("reports the lamp's leg pushed across the channel, once", () => {
    const scene = soapSceneFrom(
      { ...soapComplete, "led.soap.cathode": "bb.e8" },
      soapAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("tsd.c.led.cathode");
    expect(mismatches[0].observed?.id).toBe("tsd.c.led.cathode");
    expect(mismatches[0].observed?.to).toBe("bb.e8");
    expect(extras(scene)).toHaveLength(0);
    expect(verifyStep(scene, "tsdLamp").matched).toBe(5);
  });

  it("reports the lamp cable pushed the other way across it, once", () => {
    const scene = soapSceneFrom(
      { ...soapComplete, "wire.lamp.row": "bb.c9" },
      soapAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("tsd.c.lamp.row");
    expect(mismatches[0].observed?.to).toBe("bb.c9");
    expect(extras(scene)).toHaveLength(0);
    expect(verifyStep(scene, "tsdLamp").matched).toBe(5);
  });
});

/**
 * THREE HOLES, ONE PIECE OF METAL.
 *
 * An Uno prints GND on the digital header and twice more on the power one, and
 * all three are the same copper. The person most likely to plug the ground
 * cable into `GND2` is the one who has just come from the `5V` hole beside it,
 * which on this bench is the very next thing they wire.
 */
describe("a ground cable in any of the board's three GND holes is correct", () => {
  for (const hole of ["board.GND2", "board.GND3"] as const) {
    it(`accepts the ground cable in ${hole}`, () => {
      const scene = soapSceneFrom(
        { ...soapComplete, "wire.ground.pin": hole },
        soapAtRest,
      );
      expect(diff(scene).mismatches).toHaveLength(0);
      expect(extras(scene)).toHaveLength(0);
      expect(verifyStep(scene, "tsdPower").verified).toBe(true);
      /* And the join still prints GND — the label names the hole the lead
         REACHED, so a person reading the panel sees the board's own word rather
         than our id for one of the three. */
      const got = scene.observed.find((c) => c.id === "tsd.c.ground.pin");
      expect(got?.to).toBe(hole);
      expect(got?.label).toBe("GND");
    });
  }

  /* And the licence stops at the three holes that print GND. `VIN` is on the
     same header, one hole along from `GND3`, and it is not ground. Without the
     group being an explicit list of three, "the power header" would be the
     family and this would pass. */
  it("still reports the ground cable in VIN, once", () => {
    const scene = soapSceneFrom(
      { ...soapComplete, "wire.ground.pin": "board.VIN" },
      soapAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("tsd.c.ground.pin");
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
 * rail keeps `tsd.c.power.rail` and is reported ONCE — "it is in −12, it
 * belongs in +30" — instead of as a missing join AND a stray for the same
 * gesture.
 *
 * Two families would split it into two findings, two repair buttons and two
 * rows in the panel, for one cable that one hand put in one wrong hole. And on
 * this bench the rail feeds a motor: putting 5 V where ground belongs is the
 * mistake the chapter most needs to be able to talk about.
 */
describe("a power cable in the ground rail is one finding, not two", () => {
  const intoGroundRail = { ...soapComplete, "wire.power.rail": "bb.neg12" };

  it("keeps its own connection id and names the hole it is in", () => {
    const scene = soapSceneFrom(intoGroundRail, soapAtRest);
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("tsd.c.power.rail");
    expect(mismatches[0].observed?.id).toBe("tsd.c.power.rail");
    expect(mismatches[0].observed?.to).toBe("bb.neg12");
  });

  it("is not also a stray, which is the whole point of one rail family", () => {
    const scene = soapSceneFrom(intoGroundRail, soapAtRest);
    expect(extras(scene)).toHaveLength(0);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const power = verifyStep(scene, "tsdPower");
    expect(power.verified).toBe(false);
    expect(power.matched).toBe(3);
    expect(power.strays).toBe(0);
  });
});

/**
 * THE CABLES ARE THE SAME OBJECT.
 *
 * Three M–M jumper cables come out of one bag and nothing on them says which is
 * which. The model names them — `wirePower`, `wireLamp` — because naming them
 * is what keeps `touchesStep`, `partOf` and the step rail's pressable kit rows
 * working on per-end connections; but a person cannot tell them apart, so
 * somebody who powers the rail with the cable this file calls "the lamp's" has
 * built the right circuit and the panel must not report faults on it.
 */
describe("the three cables' six ends are interchangeable", () => {
  /**
   * And they are interchangeable **as cables**, not as ends.
   *
   * A static class of all six ends is the obvious way to say it and it is a
   * hole: `sameJoin` compares one endpoint against one endpoint, so with every
   * end equivalent to every other the six expected seats are checked as a SET
   * and the three PAIRS are never checked at all. Here that class would span
   * two power rails and `5V`, and swapping the two supply cables' rail ends
   * would put five volts on the `−` rail — with a servo across it — and verify
   * as a finished build.
   *
   * So the finished scene publishes no such group, and which cable is standing
   * in for which is decided per placement (`cable-joins.ts`).
   */
  it("does not put the six ends in one static group", () => {
    const groups = touchlessSoap.interchangeable ?? [];
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
    const scene = soapSceneFrom(
      {
        ...soapComplete,
        "wire.power.rail": "bb.neg30",
        "wire.ground.rail": "bb.pos30",
      },
      soapAtRest,
    );
    expect(diff(scene).mismatches).toHaveLength(2);
  });

  it("reports a dead short across the supply", () => {
    const scene = soapSceneFrom(
      {
        ...soapComplete,
        "wire.power.rail": "bb.pos30",
        "wire.power.pin": "bb.neg30",
        "wire.ground.rail": "board.5V",
        "wire.ground.pin": "board.GND",
      },
      soapAtRest,
    );
    expect(diff(scene).mismatches.length).toBeGreaterThan(0);
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
      ...soapComplete,
      "wire.power.rail": "bb.h9",
      "wire.power.pin": "board.D13",
      "wire.lamp.row": "bb.pos30",
      "wire.lamp.pin": "board.5V",
    };
    const scene = soapSceneFrom(swapped, soapAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["tsdPower", "tsdLamp"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });

  it("accepts the ground cable and the lamp cable swapped", () => {
    const swapped = {
      ...soapComplete,
      "wire.ground.rail": "bb.h9",
      "wire.ground.pin": "board.D13",
      "wire.lamp.row": "bb.neg30",
      "wire.lamp.pin": "board.GND",
    };
    const scene = soapSceneFrom(swapped, soapAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /* A cable on the wrong header pin keeps ITS OWN id and reports one finding,
     rather than borrowing the neighbour it landed next to. Its own pair scores
     one and no other pair scores at all, which is what that ordering is for. */
  it("but a cable one pin over is still that cable's own mistake", () => {
    const scene = soapSceneFrom(
      { ...soapComplete, "wire.lamp.pin": "board.D12" },
      soapAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("tsd.c.lamp.pin");
    expect(mismatches[0].observed?.id).toBe("tsd.c.lamp.pin");
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
    ...soapComplete,
    "res.soap.in": "bb.neg2",
    "res.soap.out": "bb.j8",
  };

  it("reports nothing on it and verifies the lamp step", () => {
    const scene = soapSceneFrom(reversed, soapAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    expect(verifyStep(scene, "tsdLamp").verified).toBe(true);
  });

  it("keeps the sketch's own connection ids, so the panel can name them", () => {
    const ids = soapSceneFrom(reversed, soapAtRest).observed.map((c) => c.id);
    expect([...ids].sort()).toEqual(
      [...touchlessSoap.expected.map((c) => c.id)].sort(),
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
      ...soapComplete,
      "res.soap.in": "bb.neg2",
      "res.soap.out": "bb.neg4",
    };
    const scene = soapSceneFrom(both, soapAtRest);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const minted = scene.observed.filter((c) => isExtraId(c.id));
    expect(minted).toHaveLength(1);
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("tsd.c.res.in");
  });
});

/**
 * NEITHER MODULE'S LEADS ARE INTERCHANGEABLE — WITH EACH OTHER OR WITH ANYTHING.
 *
 * The distinction §11's rule turns on, and the reason `SYMMETRIC` stops at the
 * resistor. An HC-SR04 prints `VCC Trig Echo GND` on its own silkscreen and an
 * SG90's three wires are a colour code every servo in the world shares — so all
 * seven leads are things a person can tell apart, and getting one wrong has a
 * consequence. Fold any of them into an interchangeable class "for symmetry"
 * and the panel goes silent on the wiring mistakes that can damage the part.
 */
describe("neither module's leads are interchangeable with anything", () => {
  it("puts no module lead in any interchangeable group", () => {
    for (const group of touchlessSoap.interchangeable ?? []) {
      expect(
        group.filter(
          (id) => id.startsWith("sensor.") || id.startsWith("servo."),
        ),
        group.join(","),
      ).toHaveLength(0);
    }
  });

  /* Different characters within each module — which is WHY its leads are not
     interchangeable. A part that printed the same thing on all of them would be
     a part a person cannot tell apart, and the rule would have to change with
     it. The two modules may share a glyph (`+` is `+` on both cases); what may
     not happen is one case printing one character twice. */
  it("prints a different character beside each lead of each module", () => {
    const sensor = SENSOR_LEADS.map((t) => spec.leadGlyph(t));
    expect(sensor).toEqual(["+", "T", "E", "−"]);
    expect(new Set(sensor).size).toBe(4);
    const servo = SERVO_LEADS.map((t) => spec.leadGlyph(t));
    expect(servo).toEqual(["−", "+", "S"]);
    expect(new Set(servo).size).toBe(3);
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
    for (const terminal of MODULE_LEADS) {
      expect(touchlessSoap.nodes[terminal].label, terminal).toBe(
        spec.leadGlyph(terminal),
      );
    }
    /* And the resistor deliberately differs: the scene prints `220Ω` on both
       ends and the shelf prints nothing, because naming one of two identical
       ends would be the interface asserting a difference the part does not
       have. That asymmetry is the reason the two tables exist separately. */
    expect(spec.leadGlyph("res.soap.in")).toBeUndefined();
    expect(touchlessSoap.nodes["res.soap.in"].label).toBe("220Ω");
  });

  /**
   * TRIG AND ECHO SWAPPED — the chapter's own two-pin mistake.
   *
   * One measurement across two pins: the board pulses one and times the other.
   * They are both ordinary digital pins, so `familyOf` lets each keep its own
   * connection id and the panel can say where each one landed — and it is TWO
   * findings, because two leads were put in two wrong holes and each has to
   * move. Reporting it as one would leave the person with half a repair.
   */
  it("reports Trig and Echo swapped, as two findings", () => {
    const scene = soapSceneFrom(
      { ...soapComplete, "sensor.trig": "board.D7", "sensor.echo": "board.D8" },
      soapAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(2);
    expect(mismatches.map((m) => m.expected.id).sort()).toEqual([
      "tsd.c.sensor.echo",
      "tsd.c.sensor.trig",
    ]);
    for (const m of mismatches) {
      expect(m.observed, m.expected.id).toBeDefined();
      /* Each names the hole it is in, so the panel can say "Trig is on D7"
         rather than "something is missing". */
      expect(m.observed?.label, m.expected.id).toMatch(/^D[78]$/);
    }
    expect(extras(scene)).toHaveLength(0);
    const sensor = verifyStep(scene, "tsdSensor");
    expect(sensor.verified).toBe(false);
    expect(sensor.matched).toBe(2);
    expect(sensor.strays).toBe(0);
  });

  it("reports the sensor's + and − leads swapped, as two findings", () => {
    const scene = soapSceneFrom(
      { ...soapComplete, "sensor.vcc": "bb.neg28", "sensor.gnd": "bb.pos25" },
      soapAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(2);
    expect(mismatches.map((m) => m.expected.id).sort()).toEqual([
      "tsd.c.sensor.gnd",
      "tsd.c.sensor.vcc",
    ]);
    for (const m of mismatches) expect(m.observed, m.expected.id).toBeDefined();
    expect(extras(scene)).toHaveLength(0);
    expect(verifyStep(scene, "tsdSensor").matched).toBe(2);
  });

  /* The same mistake on the other module, which is the one that costs a part: a
     servo across the rails the wrong way round is 5 V into its ground wire. */
  it("reports the servo's + and − leads swapped, as two findings", () => {
    const scene = soapSceneFrom(
      { ...soapComplete, "servo.power": "bb.neg26", "servo.ground": "bb.pos28" },
      soapAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(2);
    expect(mismatches.map((m) => m.expected.id).sort()).toEqual([
      "tsd.c.servo.ground",
      "tsd.c.servo.power",
    ]);
    expect(extras(scene)).toHaveLength(0);
    const servo = verifyStep(scene, "tsdServo");
    expect(servo.verified).toBe(false);
    expect(servo.matched).toBe(1);
  });
});

/**
 * TWO MODULES, EACH A BODY THAT STANDS STILL AND LEADS THAT DO NOT.
 *
 * Chapter three's shape, and the first bench to carry two of them. An HC-SR04's
 * case is 177 x 98 scene units and an SG90's is 177 x 124 — either one plugged
 * straight into the plastic would stand over the rows either side of it. And
 * the servo could not be plugged in at all: its three leads leave the case's
 * LEFT edge on a 9.5 px pitch, stacked vertically, so all three would land in
 * ONE column, which is one strip of metal and a short across its own supply.
 *
 * So each case is a constant of the DESK and its leads are the placement. With
 * two of them the claim gets its teeth: everything below has to hold of each
 * module INDEPENDENTLY of the other, which is what a single module could never
 * distinguish from a global constant.
 */
describe("each module's case never moves and its leads always do", () => {
  const withoutModules = {
    ...soapComplete,
    ...Object.fromEntries(MODULE_LEADS.map((t) => [t, null])),
  };

  for (const m of MODULES) {
    describe(m.part, () => {
      const inKit = {
        ...soapComplete,
        ...Object.fromEntries(m.leads.map((t) => [t, null])),
      };

      it("is not on the bench at all until one of its leads is seated", () => {
        for (const placement of [soapEmpty, withoutModules]) {
          const scene = soapSceneFrom(placement);
          for (const terminal of m.leads) {
            expect(scene.nodes[terminal], terminal).toBeUndefined();
          }
          /* A case with leads reaching nowhere is a part on the bench that
             nobody has put there — so `soapArtOrigins` answers `undefined` and
             `soapBoxesFor` omits the key entirely, which is how both the scene
             view and the inspection panel read "still in the kit". */
          expect(soapArtOrigins(scene)[m.part]).toBeUndefined();
          expect(soapBoxesFor(scene)[m.part]).toBeUndefined();
        }
      });

      it("reports its joins as missing while it is still in the box", () => {
        const scene = soapSceneFrom(inKit, soapAtRest);
        const { mismatches } = diff(scene);
        expect(mismatches.map((mm) => mm.expected.from).sort()).toEqual(
          [...m.leads].sort(),
        );
        for (const mm of mismatches) expect(mm.observed).toBeUndefined();
        expect(extras(scene)).toHaveLength(0);
      });

      /**
       * One lead seated puts all of them on the bench — the seated one in its
       * hole and the rest at the point they leave the case.
       *
       * A lead with no node is filtered out of the workbench's targets and gets
       * no handle, so a module whose unseated leads had nowhere to be would be
       * a part you can start placing and cannot finish. A cable solves this
       * with a slack rule; a module needs none, because its leads have
       * somewhere REAL to be.
       */
      for (const anchor of m.leads) {
        it(`hangs its other leads off the case when ${anchor} is the one seated`, () => {
          const hole = soapComplete[anchor]!;
          const scene = soapSceneFrom({ ...soapEmpty, [anchor]: hole });

          const seated = scene.nodes[anchor];
          expect(seated.x).toBe(scene.nodes[hole].x);
          expect(seated.y).toBe(scene.nodes[hole].y);

          for (const other of m.leads.filter((t) => t !== anchor)) {
            const n = scene.nodes[other];
            expect(n, other).toBeDefined();
            /* Compared against `soapLeadRoot`, which is what the DRAWING uses
               to start the strand from the case. Two tables of pin offsets —
               the scene's and the artwork's — is the drift `wokwi.ts` exists to
               prevent, and this is the assertion that they are one fact. */
            const root = soapLeadRoot(other, m.at);
            expect(root, other).toBeDefined();
            expect(n.x).toBeCloseTo(root!.x);
            expect(n.y).toBeCloseTo(root!.y);
            /* And it can still be picked up and finished. */
            expect(Number.isFinite(soapGrabPoint(n).x)).toBe(true);
            expect(
              candidatesFor(spec, { ...soapEmpty, [anchor]: hole }, other),
            ).toContain(soapComplete[other]!);
          }
        });
      }

      it("draws its case in the same place whichever lead is holding it up", () => {
        const boxes = [
          soapBoxesFor(touchlessSoap)[m.part],
          ...m.leads.map(
            (anchor) =>
              soapBoxesFor(
                soapSceneFrom({ ...soapEmpty, [anchor]: soapComplete[anchor]! }),
              )[m.part],
          ),
          /* And with a lead in a hole at the far end of the bench, which is
             where a "position the body from its anchor" model would visibly
             break. */
          soapBoxesFor(
            soapSceneFrom({ ...soapEmpty, [m.leads[0]]: "bb.a1" }),
          )[m.part],
        ];
        /* The BOX spans the case and wherever the leads have got to — it is
           what a vision result outlines, and a box that stopped at the case
           would frame a part whose own wires run off the edge of it. What must
           not move is the CASE, so every box has to contain it wherever the
           leads are. */
        const caseBox = {
          x: m.at.x - PITCH,
          y: m.at.y - PITCH,
          right: m.at.x + boxOf(m.art).width + PITCH,
          bottom: m.at.y + boxOf(m.art).height + PITCH,
        };
        for (const box of boxes) {
          expect(box).toBeDefined();
          expect(box!.x).toBeLessThanOrEqual(caseBox.x);
          expect(box!.y).toBeLessThanOrEqual(caseBox.y);
          expect(box!.x + box!.width).toBeGreaterThanOrEqual(caseBox.right);
          expect(box!.y + box!.height).toBeGreaterThanOrEqual(caseBox.bottom);
        }
        for (const placement of [
          soapComplete,
          { ...soapEmpty, [m.leads[m.leads.length - 1]]: "bb.j30" },
        ]) {
          expect(soapArtOrigins(soapSceneFrom(placement))[m.part]).toEqual(m.at);
        }
      });
    });
  }

  /**
   * TAKING ONE MODULE OFF THE BENCH LEAVES THE OTHER ON IT.
   *
   * The claim two modules exist to make. A model that decided "is a module on
   * the bench" from anything global — a flag, the first seated lead it found,
   * the presence of any module lead at all — passes every test above with one
   * module and fails here: pull the sensor and the servo goes with it, or stays
   * behind as a case with no leads. Both of those draw a picture of a desk
   * nobody is standing at.
   */
  it("leaves the other module standing when one goes back in the box", () => {
    for (const m of MODULES) {
      const other = MODULES.find((entry) => entry.part !== m.part)!;
      const scene = soapSceneFrom({
        ...soapComplete,
        ...Object.fromEntries(m.leads.map((t) => [t, null])),
      });
      expect(soapArtOrigins(scene)[m.part], m.part).toBeUndefined();
      expect(soapArtOrigins(scene)[other.part], other.part).toEqual(other.at);
      expect(soapBoxesFor(scene)[m.part], m.part).toBeUndefined();
      expect(soapBoxesFor(scene)[other.part], other.part).toBeDefined();
      for (const terminal of other.leads) {
        expect(scene.nodes[terminal], terminal).toBeDefined();
      }
    }
  });

  /* The sensor's four leads come out of the BOTTOM edge of its case, left to
     right in the order the silkscreen prints them. A transposed pin table would
     draw the `+` strand from where `−` leaves the board, which is a picture
     that teaches the opposite of the truth. */
  it("takes the sensor's leads out of the bottom of its case, in printed order", () => {
    const roots = SENSOR_LEADS.map((t) => soapLeadRoot(t, soapSensorAt)!);
    const xs = roots.map((r) => r.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(new Set(xs).size).toBe(4);
    const height = boxOf(frame.sensor).height;
    for (const root of roots) {
      /* On the bottom edge: below the case's own middle, and inside the box the
         module is drawn in. */
      expect(root.y).toBeGreaterThan(soapSensorAt.y + height * 0.9);
      expect(root.y).toBeLessThan(soapSensorAt.y + height + PITCH);
      expect(root.x).toBeGreaterThan(soapSensorAt.x);
      expect(root.x).toBeLessThan(soapSensorAt.x + boxOf(frame.sensor).width);
    }
  });

  /**
   * The servo's three leave the LEFT edge, stacked — which is the whole reason
   * the body/leads split had to exist.
   *
   * All three x are the case's own left edge, so they are 9.5 px apart in Y and
   * nothing else. A servo pushed into a breadboard would put all three of them
   * in one column: one strip of metal, and a short across its own supply.
   */
  it("takes the servo's leads out of the left edge of its case, stacked", () => {
    const roots = SERVO_LEADS.map((t) => soapLeadRoot(t, soapServoAt)!);
    const ys = roots.map((r) => r.y);
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    expect(new Set(ys).size).toBe(3);
    for (const root of roots) {
      expect(root.x).toBe(soapServoAt.x);
      expect(root.y).toBeGreaterThan(soapServoAt.y);
      expect(root.y).toBeLessThan(soapServoAt.y + boxOf(frame.servo).height);
    }
    /* All three within one column of each other in x, which is the fact that
       makes the breadboard impossible for this part. */
    expect(Math.max(...roots.map((r) => r.x)) - Math.min(...roots.map((r) => r.x)))
      .toBeLessThan(PITCH);
  });

  /* And a lead root is given to the modules' leads and to nothing else.
     `soapLeadRoot` is asked about every terminal the drawing walks; a cable end
     that got a root would grow a strand out of a case it is not attached to. */
  it("gives a lead root to the modules' leads and to nothing else", () => {
    for (const terminal of [
      ...CABLE_ENDS,
      "led.soap.cathode",
      "led.soap.anode",
      "res.soap.in",
      "res.soap.out",
    ]) {
      expect(soapLeadRoot(terminal, soapSensorAt), terminal).toBeUndefined();
    }
    for (const terminal of MODULE_LEADS) {
      expect(soapLeadRoot(terminal, { x: 0, y: 0 }), terminal).toBeDefined();
    }
  });
});

/**
 * A CABLE END AND A MODULE LEAD GO IN A HOLE, AND NOWHERE ELSE.
 *
 * Neither has a rigid body: each is positioned from its own seat, so a lead
 * clipped onto one — or one clipped onto a lead — is a join the model would
 * accept, `anchorsFor` would call anchored, and the drawing would have to
 * invent a body to hang off. `flexible` is what lets the refusal be said out
 * loud instead of the part springing back in silence.
 */
describe("nothing clips to a cable end or to a module lead", () => {
  const bench = seat(soapEmpty, "led.soap.cathode", "bb.f8");

  it("refuses the gesture from either side, and says which one it is", () => {
    expect(tryAttach(spec, bench, "wire.lamp.row", "led.soap.anode")).toEqual({
      kind: "refused",
      reason: "wireEnd",
    });
    const withCable = seat(bench, "wire.lamp.pin", "board.D13");
    expect(
      tryAttach(spec, withCable, "led.soap.anode", "wire.lamp.row"),
    ).toEqual({ kind: "refused", reason: "wireEnd" });
  });

  /* The same refusal for each module, from either side — asserted per module
     because `wireEnd` is decided from the PART, and a module missing from
     `flexible` would be refused nothing while its case flew around the desk. */
  for (const m of MODULES) {
    it(`refuses it for the ${m.part} too, from either side`, () => {
      expect(tryAttach(spec, bench, m.leads[0], "led.soap.anode")).toEqual({
        kind: "refused",
        reason: "wireEnd",
      });
      const withModule = seat(bench, m.leads[1], soapComplete[m.leads[1]]!);
      expect(
        tryAttach(spec, withModule, "led.soap.anode", m.leads[0]),
      ).toEqual({ kind: "refused", reason: "wireEnd" });
    });
  }

  /* And the picker never draws a target the write refuses — a mark you can aim
     at and cannot hit is the one thing §8 forbids. */
  it("offers a flexible lead nothing but holes, and offers no lead one of them", () => {
    const p = seat(
      seat(seat(bench, "wire.lamp.pin", "board.D13"), "sensor.vcc", "bb.pos25"),
      "servo.power",
      "bb.pos28",
    );

    for (const flexible of ["wire.lamp.row", "sensor.trig", "servo.signal"]) {
      const offered = candidatesFor(spec, p, flexible);
      expect(offered.length, flexible).toBeGreaterThan(0);
      for (const id of offered) {
        expect(isHole(spec, id), `${flexible} → ${id}`).toBe(true);
      }
    }
    expect(candidatesFor(spec, p, "wire.lamp.row")).toContain("bb.h9");
    expect(candidatesFor(spec, p, "sensor.trig")).toContain("board.D8");
    expect(candidatesFor(spec, p, "servo.signal")).toContain("board.D9");

    for (const id of candidatesFor(spec, p, "led.soap.anode")) {
      expect(id.startsWith("wire."), id).toBe(false);
      expect(id.startsWith("sensor."), id).toBe(false);
      expect(id.startsWith("servo."), id).toBe(false);
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
    const onHeader = soapSceneFrom(
      seat(soapEmpty, "wire.lamp.pin", "board.D13"),
    );
    const seated = onHeader.nodes["board.D13"];
    const loose = onHeader.nodes["wire.lamp.row"];
    expect(loose).toBeDefined();
    expect(Number.isFinite(loose.x) && Number.isFinite(loose.y)).toBe(true);
    expect(Number.isFinite(soapGrabPoint(loose).x)).toBe(true);
    /* Far enough from its own seat to be a second thing you can take hold of. */
    expect(Math.hypot(loose.x - seated.x, loose.y - seated.y)).toBeGreaterThan(
      PITCH,
    );
    /* Seated on the header, it reaches up toward the breadboard. */
    expect(loose.y).toBeLessThan(seated.y);

    const onBoard = soapSceneFrom(seat(soapEmpty, "wire.power.rail", "bb.pos30"));
    /* Seated on the plastic, it dangles down toward the Uno. */
    expect(onBoard.nodes["wire.power.pin"].y).toBeGreaterThan(
      onBoard.nodes["bb.pos30"].y,
    );
  });

  it("takes a hole with the lead that is in it, whosever lead that is", () => {
    const p = seat(soapEmpty, "wire.lamp.pin", "board.D13");
    expect(candidatesFor(spec, p, "wire.lamp.row")).not.toContain("board.D13");

    const q = seat(soapEmpty, "led.soap.cathode", "bb.f8");
    expect(candidatesFor(spec, q, "res.soap.in")).not.toContain("bb.f8");
    expect(tryAttach(spec, q, "res.soap.in", "bb.f8")).toEqual({
      kind: "refused",
      reason: "holeTaken",
    });
    /* And a module lead cannot take a hole either — the sensor's Trig lead
       reaching for the pin the servo's signal is already in. */
    const r = seat(soapEmpty, "servo.signal", "board.D9");
    expect(tryAttach(spec, r, "sensor.trig", "board.D9")).toEqual({
      kind: "refused",
      reason: "holeTaken",
    });
  });
});

/**
 * THE FOUR LINES THE SKETCH ACTUALLY HAS, READ BACK OFF THE BENCH.
 *
 * `soapLines` is what the functional run asks — not "is this wire where I put
 * it" but "which pin is the pump actually listening on". The two questions have
 * different answers on a build somebody else wired, and the run has to ask the
 * second one.
 *
 * It reads the two module lines straight off the record, because a module lead
 * is not interchangeable with anything and its own id is therefore the truth;
 * and it reads the lamp's ACROSS the metal, because that one runs through a
 * cable and the cables are one object (`cable-joins.ts`).
 */
describe("soapLines reads the four lines off the bench, not off the ids", () => {
  it("answers the sketch's own four pins on the finished build", () => {
    expect(soapLines(touchlessSoap)).toEqual({
      trig: soapPins.trig,
      echo: soapPins.echo,
      pump: soapPins.pump,
      lamp: soapPins.lamp,
    });
  });

  /* The module lines follow the lead, wherever it went: no cable, no
     breadboard, nothing between the case and the header to reinterpret. */
  it("follows a module lead to whatever pin it is actually in", () => {
    const scene = soapSceneFrom(
      {
        ...soapComplete,
        "sensor.trig": "board.D12",
        "servo.signal": "board.D10",
      },
      soapAtRest,
    );
    const lines = soapLines(scene);
    expect(lines.trig).toBe("board.D12");
    expect(lines.echo).toBe("board.D7");
    expect(lines.pump).toBe("board.D10");
  });

  /**
   * And the lamp's line is asked of the METAL.
   *
   * The lamp cable moved to another row of the same column is the same net and
   * the same answer, because a column is one strip. Reading it off the cable's
   * id would give the same answer for the wrong reason; reading it off the hole
   * would give none at all.
   */
  it("follows the lamp's line across the column it lands in", () => {
    const scene = soapSceneFrom(
      { ...soapComplete, "wire.lamp.row": "bb.j9" },
      soapAtRest,
    );
    expect(soapLines(scene).lamp).toBe("board.D13");
  });

  /* And across a cable that is not the one the file calls "the lamp's". Whoever
     picked up which jumper is not a fact about the circuit, and the run may not
     depend on it. */
  it("follows it across whichever cable is actually making the join", () => {
    const scene = soapSceneFrom(
      {
        ...soapComplete,
        "wire.power.rail": "bb.h9",
        "wire.power.pin": "board.D13",
        "wire.lamp.row": "bb.pos30",
        "wire.lamp.pin": "board.5V",
      },
      soapAtRest,
    );
    expect(soapLines(scene).lamp).toBe("board.D13");
  });

  it("says nothing at all about a part that is still in the kit", () => {
    expect(soapLines(soapSceneFrom(soapEmpty))).toEqual({
      trig: undefined,
      echo: undefined,
      pump: undefined,
      lamp: undefined,
    });
  });
});

/**
 * THE PUMP'S PIN HAS TO BE ABLE TO HOLD A VALUE — the run's own lesson.
 *
 * A servo is told an ANGLE, and an angle is a value between two ends, so the
 * pin it listens on has to be one of the six marked `~`. On any other digital
 * pin the wiring is perfect by every measure a connection test has — two ends,
 * both seated, both in the family the model allows — and the horn does not move
 * at all.
 *
 * So the fault has to be visible twice, and this is the pair of assertions that
 * says so: the wiring test reports it as one mismatch naming the hole, and
 * `pwmPins` — chapter one's own list, read rather than copied — excludes it. A
 * chapter that only had the first would ship a build that verifies and does
 * nothing.
 */
describe("the servo's signal on a pin that cannot hold a value is a fault twice over", () => {
  const onDumbPin = { ...soapComplete, "servo.signal": NOT_PWM };

  it("is one wiring mismatch, naming the hole the lead is in", () => {
    const scene = soapSceneFrom(onDumbPin, soapAtRest);
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("tsd.c.servo.signal");
    expect(mismatches[0].observed?.id).toBe("tsd.c.servo.signal");
    expect(mismatches[0].observed?.to).toBe(NOT_PWM);
    expect(mismatches[0].observed?.label).toBe("D4");
    expect(extras(scene)).toHaveLength(0);
    const servo = verifyStep(scene, "tsdServo");
    expect(servo.verified).toBe(false);
    expect(servo.matched).toBe(2);
  });

  it("is a pin `pwmPins` excludes, which is the half wiring cannot see", () => {
    const scene = soapSceneFrom(onDumbPin, soapAtRest);
    expect(soapLines(scene).pump).toBe(NOT_PWM);
    expect(pwmPins).not.toContain(NOT_PWM);
    /* And the sketch's own pin is one it includes — the positive half, without
       which this test would pass on a chapter that had picked D4 on purpose. */
    expect(pwmPins).toContain(soapPins.pump);
    expect(soapLines(touchlessSoap).pump).toBe(soapPins.pump);
  });

  /**
   * And the two halves are genuinely independent.
   *
   * `D10` is marked `~` and is still the wrong hole: a pin that CAN hold a
   * value is not therefore the pin the sketch writes to. If the wiring test
   * ever started deferring to `pwmPins`, this build would verify and the pump
   * would sit still — the exact failure the chapter is about, hidden by the
   * check written to catch it.
   */
  it("still reports a PWM pin that is not the one the sketch names", () => {
    const scene = soapSceneFrom(
      { ...soapComplete, "servo.signal": "board.D10" },
      soapAtRest,
    );
    expect(pwmPins).toContain("board.D10");
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("tsd.c.servo.signal");
    expect(verifyStep(scene, "tsdServo").verified).toBe(false);
  });
});

/**
 * THE HORN IS ON STRAIGHT, AND THE SERVO STEP IS THE STEP THAT SAYS SO.
 *
 * `servoAngle` / `expectedAngle` have existed since the capstone and have only
 * ever run on a build an author laid out. Here they are at rest and EQUAL on
 * purpose: nothing on a bench somebody assembles mounts a horn, so a difference
 * would be a fault with no gesture behind it and no way to fix it.
 *
 * What `checksMechanical` buys is that the servo step's tick is about the pump
 * being able to turn rather than about a wire being present — and it has to be
 * exactly one step, because the flag is what routes `mechanicalStep`,
 * `scopeChecksMechanical` and the mechanical finding to a place in the rail.
 */
describe("the horn is aligned at rest, and one step is the step that checks it", () => {
  it("is at rest and where the sketch wants it, which is the same angle", () => {
    expect(soapAtRest.servoAngle).toBe(soapAtRest.expectedAngle);
    expect(isServoAligned(touchlessSoap)).toBe(true);
    /* And a scene built with no second argument is that scene: the default is
       the rest state, not a zero-filled placeholder. */
    expect(soapSceneFrom(soapComplete).mechanical).toEqual(soapAtRest);
  });

  it("carries a passed-in mechanical state through unchanged", () => {
    const turned = { servoAngle: 90, expectedAngle: 0 };
    const scene = soapSceneFrom(soapComplete, turned);
    expect(scene.mechanical).toEqual(turned);
    expect(scene.mechanical).not.toBe(soapAtRest);
    expect(isServoAligned(scene)).toBe(false);
  });

  it("gives `checksMechanical` to the servo step and to no other", () => {
    const checking = soapSteps.filter((step) => step.checksMechanical);
    expect(checking.map((step) => step.id)).toEqual(["tsdServo"]);
  });

  /* A crooked horn fails the servo step and nothing else, on a build whose
     every wire is right. Without the flag the step would tick green on a pump
     that cannot reach the position the sketch commands. */
  it("fails only the servo step when the horn is crooked", () => {
    const scene = soapSceneFrom(soapComplete, {
      servoAngle: 45,
      expectedAngle: 0,
    });
    const servo = verifyStep(scene, "tsdServo");
    expect(servo.verified).toBe(false);
    expect(servo.mechanicalOk).toBe(false);
    /* Every wire it asks for is still made — the tick is amber for the horn and
       for nothing else, which is what the panel has to be able to say. */
    expect(servo.matched).toBe(3);
    expect(servo.strays).toBe(0);
    for (const id of ["tsdPower", "tsdSensor", "tsdLamp"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });
});

describe("satisfying — the demo control's shortcut", () => {
  it("reaches every expected connection from an empty bench", () => {
    for (const want of touchlessSoap.expected) {
      const next = spec.satisfying(soapEmpty, want.id);
      expect(next, want.id).not.toBeNull();
      const scene = soapSceneFrom(prune(spec, next!), soapAtRest);
      expect(diff(scene, [want.id]).mismatches, want.id).toHaveLength(0);
    }
  });

  it("declines an id this build does not name", () => {
    expect(spec.satisfying(soapEmpty, "c.sensor.echo")).toBeNull();
    /* Every chapter is in the same global id namespace and this build must not
       answer for any of them. */
    expect(spec.satisfying(soapEmpty, "bl.c.anode")).toBeNull();
    expect(spec.satisfying(soapEmpty, "mnl.c.pir.out")).toBeNull();
  });

  /**
   * `null` rather than an unchanged record: returning the same placement made a
   * declined shortcut indistinguishable from a performed one, so the caller
   * committed, credited a repair and logged a move it had not made.
   */
  it("declines a join that is already true", () => {
    for (const want of touchlessSoap.expected) {
      expect(spec.satisfying(soapComplete, want.id), want.id).toBeNull();
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
      ...soapComplete,
      "led.soap.cathode": "bb.f9",
      "led.soap.anode": "bb.f10",
      "sensor.trig": "board.D7",
      "sensor.echo": "board.D8",
      "servo.signal": NOT_PWM,
      "wire.power.rail": "bb.neg12",
      "wire.ground.pin": "board.GND3",
    };
    for (const start of [soapEmpty, scrambled, soapComplete]) {
      let p: Placement = start;
      for (const want of touchlessSoap.expected) {
        p = spec.satisfying(p, want.id) ?? p;
      }
      expect(prune(spec, p)).toEqual(soapComplete);
    }
  });

  it("never breaks a join that was already right", () => {
    for (const want of touchlessSoap.expected) {
      const others = touchlessSoap.expected.filter((c) => c.id !== want.id);
      /* Build everything but `want`, then ask for `want`. */
      let p: Placement = soapEmpty;
      for (const other of others) p = spec.satisfying(p, other.id) ?? p;
      const built = prune(spec, p);
      const next = spec.satisfying(built, want.id);
      if (!next) continue;
      const scene = soapSceneFrom(prune(spec, next), soapAtRest);
      expect(diff(scene).mismatches, want.id).toHaveLength(0);
    }
  });
});

describe("clearing — the demo control's removal", () => {
  /* The LED standing in its own column with its long leg reaching over to the
     header — chapter one's build, made on chapter five's bench, where it is a
     join the sketch does not name. */
  const strayPlacement = seat(
    seat(soapEmpty, "led.soap.cathode", "bb.f8"),
    "led.soap.anode",
    "board.D13",
  );

  it("removes exactly the join it names", () => {
    const stray = extras(soapSceneFrom(strayPlacement))[0];
    const next = spec.clearing(strayPlacement, stray.id, {
      from: stray.from,
      to: stray.to,
    });
    expect(next).not.toBeNull();
    expect(extras(soapSceneFrom(prune(spec, next!)))).toHaveLength(0);
    /* And it did not disturb the leg that was in the right hole. */
    expect(next!["led.soap.cathode"]).toBe("bb.f8");
  });

  it("declines a stale edge instead of firing on whatever is there now", () => {
    const stray = extras(soapSceneFrom(strayPlacement))[0];
    /* The person moved it themselves before pressing the button. */
    const moved = seat(strayPlacement, "led.soap.anode", "board.D11");
    expect(
      spec.clearing(moved, stray.id, { from: stray.from, to: stray.to }),
    ).toBeNull();
  });

  it("declines an id that is not a stray at all", () => {
    expect(
      spec.clearing(soapComplete, "tsd.c.led.anode", {
        from: "led.soap.anode",
        to: "bb.f9",
      }),
    ).toBeNull();
    /* And another chapter's minted id, which shares the shape but not the
       prefix. */
    expect(
      spec.clearing(strayPlacement, "mnl.x.led.night.anode", {
        from: "led.soap.anode",
        to: "board.D13",
      }),
    ).toBeNull();
  });
});

describe("grabPoint", () => {
  it("is total over every node in the finished scene", () => {
    for (const n of Object.values(touchlessSoap.nodes)) {
      const at = soapGrabPoint(n);
      expect(Number.isFinite(at.x), n.id).toBe(true);
      expect(Number.isFinite(at.y), n.id).toBe(true);
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
    const lifted = soapGrabPoint(touchlessSoap.nodes["led.soap.cathode"]);
    const nearest = Math.min(
      ...soapCandidates.map((id) => {
        const hole = touchlessSoap.nodes[id];
        return Math.hypot(lifted.x - hole.x, lifted.y - hole.y);
      }),
    );
    expect(nearest).toBeCloseTo(Math.hypot(PITCH * 0.5, PITCH * 0.5));
    expect(nearest).toBeGreaterThan(PITCH * 0.7);
  });

  it("leaves a hole where it is", () => {
    for (const id of ["board.5V", "bb.a29", "bb.pos30"]) {
      const hole = touchlessSoap.nodes[id];
      expect(soapGrabPoint(hole), id).toEqual({ x: hole.x, y: hole.y });
    }
  });
});

describe("the bench is reachable by hand", () => {
  /**
   * The whole chapter, built the way a person builds it, one legal move at a
   * time — seventeen drops in the order the steps ask for them, each one
   * offered by the picker before it is accepted by the write, each one pruned
   * after.
   *
   * This is the single most valuable assertion in the file: it is the only one
   * that says the finished build is REACHABLE rather than merely correct as a
   * literal, and it is the only place `candidatesFor` and `tryAttach` are made
   * to agree seventeen times running. It also walks BOTH modules onto the bench
   * lead by lead, which nothing before chapter five has had to do.
   */
  it("reaches the finished dispenser by a sequence of legal drops", () => {
    let p: Placement = soapEmpty;
    for (const terminal of soapTerminals) {
      const target = soapComplete[terminal]!;
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
      const partial = soapSceneFrom(p, soapAtRest);
      expect(extras(partial), `after ${terminal}`).toHaveLength(0);
      expect(partial.observed, `after ${terminal}`).toHaveLength(
        soapTerminals.indexOf(terminal) + 1,
      );
    }
    expect(p).toEqual(soapComplete);
    const scene = soapSceneFrom(p, soapAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  it("still lets chapter one's mistake be made, and calls it a stray here", () => {
    /* "The LED straight into the header" — the gesture chapter one is about,
       made on a bench where the LED belongs in the plastic. Deleting this would
       delete the continuity between the chapters. */
    let p = seat(soapEmpty, "led.soap.cathode", "bb.f8");
    expect(candidatesFor(spec, p, "led.soap.anode")).toContain("board.D13");
    p = seat(p, "led.soap.anode", "board.D13");
    expect(p["led.soap.anode"]).toBe("board.D13");
    expect(extras(soapSceneFrom(p))).toHaveLength(1);
  });

  /* And this chapter's own mistake, which is the one step four is about: the
     pump told to move by a pin that cannot say an angle. Reachable, as it must
     be — a lesson about a wrong pin is only a lesson if the wrong pin is on the
     bench. It is NOT a stray: it is a real connection to the wrong hole, which
     is exactly why it takes two different checks to catch it. */
  it("still lets the pump be driven from a pin that cannot say an angle", () => {
    const p = seat(soapEmpty, "servo.signal", NOT_PWM);
    expect(p["servo.signal"]).toBe(NOT_PWM);
    const scene = soapSceneFrom(p);
    expect(extras(scene)).toHaveLength(0);
    expect(soapLines(scene).pump).toBe(NOT_PWM);
    expect(diff(scene, ["tsd.c.servo.signal"]).mismatches).toHaveLength(1);
  });
});

/**
 * `soapFitBox` is a CONSTANT, and it has to contain everything.
 *
 * `fitView`'s memo depends on this box, so one derived from the live placement
 * would frame a different thing before and after every drop. But chapter one
 * shipped with a box taken from the finished lamp alone and drew a just-placed
 * LED off the top of the canvas — so a constant is only correct if it covers
 * the states a person actually passes through on the way to the finished build.
 *
 * The walk below is the same seventeen drops as above, checked box by box, plus
 * the two standoff cases (a part hung off another part's free lead, which lifts
 * it a whole 14 mm off the plastic) and each module on its own.
 */
describe("the fit box contains every box the model can produce", () => {
  const contains = (
    box: { x: number; y: number; width: number; height: number },
    what: string,
  ) => {
    expect(box.x, `${what} left`).toBeGreaterThanOrEqual(soapFitBox.x);
    expect(box.y, `${what} top`).toBeGreaterThanOrEqual(soapFitBox.y);
    expect(box.x + box.width, `${what} right`).toBeLessThanOrEqual(
      soapFitBox.x + soapFitBox.width,
    );
    expect(box.y + box.height, `${what} bottom`).toBeLessThanOrEqual(
      soapFitBox.y + soapFitBox.height,
    );
  };

  const checkAll = (placement: Placement, what: string) => {
    for (const [id, box] of Object.entries(
      soapBoxesFor(soapSceneFrom(placement)),
    )) {
      contains(box, `${what} · ${id}`);
    }
  };

  it("is a real box with room in it", () => {
    expect(Number.isFinite(soapFitBox.x)).toBe(true);
    expect(Number.isFinite(soapFitBox.y)).toBe(true);
    expect(soapFitBox.width).toBeGreaterThan(0);
    expect(soapFitBox.height).toBeGreaterThan(0);
  });

  it("frames the empty bench and the finished build", () => {
    checkAll(soapEmpty, "empty");
    checkAll(soapComplete, "complete");
    contains(soapPartBox.sensor, "sensor case");
    contains(soapPartBox.servo, "servo case");
  });

  /**
   * And the two cases stand where they have to stand.
   *
   * The sensor's pins are on its bottom edge, so it goes ABOVE the plastic and
   * every lead runs down. The servo's leave its left edge, so it goes to the
   * RIGHT of everything and every lead runs left — and it has to clear the Uno
   * in y as well, because a case with a wire drawn across it is the one thing
   * this bench must avoid.
   */
  it("stands the sensor above the plastic and the servo clear of both boards", () => {
    expect(soapSensorAt.y).toBeLessThan(soapPartBox.breadboard.y);
    expect(soapServoAt.x).toBeGreaterThan(
      soapPartBox.breadboard.x + soapPartBox.breadboard.width,
    );
    expect(soapServoAt.y + boxOf(frame.servo).height).toBeLessThan(
      soapPartBox.board.y,
    );
  });

  it("frames every state on the way to the finished build", () => {
    let p: Placement = soapEmpty;
    for (const terminal of soapTerminals) {
      p = prune(spec, seat(p, terminal, soapComplete[terminal]!));
      checkAll(p, `after ${terminal}`);
    }
  });

  /* The two `STANDOFF` cases: a rigid part hung off another rigid part's free
     lead stands 14 mm clear of the plastic, which is the highest anything on
     this bench ever reaches and is not a state the finished build contains. */
  it("frames a part hung off another part's free lead, either way round", () => {
    checkAll(
      {
        ...soapEmpty,
        "res.soap.in": "bb.j8",
        "led.soap.cathode": "res.soap.out",
      },
      "lamp on the resistor",
    );
    checkAll(
      {
        ...soapEmpty,
        "led.soap.cathode": "bb.f8",
        "res.soap.in": "led.soap.anode",
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
        ...soapEmpty,
        "wire.power.pin": "board.5V",
        "wire.ground.pin": "board.GND",
        "wire.lamp.pin": "board.D13",
      },
      "cables on the header",
    );
    checkAll(
      {
        ...soapEmpty,
        "wire.power.rail": "bb.pos30",
        "wire.ground.rail": "bb.neg30",
        "wire.lamp.row": "bb.h9",
      },
      "cables on the plastic",
    );
  });

  it("frames each module whichever of its leads is the one on the bench", () => {
    for (const m of MODULES) {
      for (const anchor of m.leads) {
        checkAll({ ...soapEmpty, [anchor]: soapComplete[anchor]! }, anchor);
      }
    }
  });
});
