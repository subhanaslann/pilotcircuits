import { describe, expect, it } from "vitest";
import { boxOf, frame } from "@/lib/circuit/wokwi";
import {
  analogPins,
  plantArtOrigins,
  plantAtRest,
  plantBoardAt,
  plantBoxesFor,
  plantBreadboardAt,
  plantCandidates,
  plantComplete,
  plantEmpty,
  plantFitBox,
  plantGrabPoint,
  plantGuardian,
  plantLeadRoot,
  plantLines,
  plantPartBox,
  plantPins,
  plantPlacement,
  plantProbeAt,
  plantSceneFrom,
  plantTerminals,
} from "@/lib/circuit/plant-guardian";
import {
  diff,
  extras,
  isExtraId,
  sameJoin,
  type Connection,
} from "@/lib/circuit/graph";
import { verifyStep } from "@/lib/agent/findings";
import { plantSteps } from "@/lib/agent/steps";
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
 * Chapter four's spec, conformed — and the two claims that live nowhere else.
 *
 * Chapter three's file is the template and most of it ports unchanged, for the
 * reason it gives: every way a `PlacementSpec` can be wrong renders as a
 * plausible picture rather than as a crash. What this chapter adds is two facts
 * no other chapter's test can reach, because no other chapter has the bench for
 * them:
 *
 *   1. **A pin that answers with a number.** `board.A0`–`board.A5` did not
 *      exist anywhere in this product before this file's subject, and all six
 *      are offered on purpose: the lesson is *which kind of pin can report a
 *      number*, and that is only a lesson if the wrong kind is reachable. A
 *      probe line wired into `D2` is two seated ends and a made join — the
 *      shape of every correct wire on the bench — and it can only ever say wet
 *      or dry.
 *   2. **The desk is upside down.** Every chapter before this put the Uno below
 *      the breadboard. Three of this chapter's four board holes are on the
 *      POWER header, so the board turns over and the power header faces the
 *      plastic. Every direction in the file inverts with it — the cable slack,
 *      the standoff, which of two y values is "toward the board" — and every
 *      one of those inversions is a picture that still renders if it is missed.
 *
 * `registry.test.ts` already runs the vocabulary checks over every build in the
 * registry — anchors, lead names, glyph shape, the `empty` / `complete` key
 * sets, component names, hole and terminal disjointness — so none of that is
 * repeated below. What is here is what is true of THIS chapter and of no other.
 */
const spec = plantPlacement;

const seat = (p: Placement, terminal: string, target: string | null) => {
  const r = tryAttach(spec, p, terminal, target);
  return r.kind === "attached" ? r.placement : p;
};

/** The probe's three leads, in the order its silkscreen prints them. */
const PROBE_LEADS = ["soil.vcc", "soil.gnd", "soil.aout"] as const;

/** Every end of the four M–M jumpers — one interchangeable class, eight ends. */
const CABLE_ENDS = [
  "wire.power.rail", "wire.power.pin",
  "wire.ground.rail", "wire.ground.pin",
  "wire.signal.row", "wire.signal.pin",
  "wire.lamp.row", "wire.lamp.pin",
] as const;

/** The six holes marked `A`, written out rather than read from the export. */
const ANALOG_HOLES = [
  "board.A0",
  "board.A1",
  "board.A2",
  "board.A3",
  "board.A4",
  "board.A5",
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
     scene per (lead x offered hole) at every boot, which is 15 x 388 here, and
     the step rail, the kit shelf and the briefing all count these by hand. A
     part or a lead that appears without anyone deciding to add one is a row
     nothing in the product has a sentence for. */
  it("is seven parts, fifteen leads and fifteen joins", () => {
    expect(spec.parts).toHaveLength(7);
    expect(plantTerminals).toHaveLength(15);
    expect(plantGuardian.expected).toHaveLength(15);
    expect(Object.keys(plantComplete)).toHaveLength(15);
  });

  /**
   * The flexible set, and the one entry in it that is not a cable.
   *
   * `flexible` says two things — each end is positioned from its own seat, and
   * nothing may be clipped to it — and both are true of a module on leads. Drop
   * `probe` out of this list and the probe becomes a rigid body hung off one
   * anchoring lead: a 90 x 386 case, longer than the Uno, that jumps across the
   * desk depending on which of its three leads was seated first, and legs other
   * parts may be clipped onto. Add a rigid part to it and that part stops being
   * drawn at all.
   */
  it("holds the four cables AND the probe as flexible, and nothing else", () => {
    expect([...(spec.flexible ?? [])].sort()).toEqual([
      "probe",
      "wireGround",
      "wireLamp",
      "wirePower",
      "wireSignal",
    ]);
  });

  /**
   * §0, as an assertion: the breadboard is the join.
   *
   * Chapter one's middle join runs lead to lead. Chapters two, three and this
   * one have none — fifteen leads, fifteen holes, one each — and that is what
   * keeps `satisfying` four lines and `leadNotFree` off the happy path. The day
   * somebody writes a lead-to-lead value into `complete`, both of those
   * simplifications become wrong and nothing else would say so.
   */
  it("makes not one join lead to lead", () => {
    for (const [terminal, target] of Object.entries(plantComplete)) {
      expect(target, terminal).not.toBeNull();
      expect(isHole(spec, target!), `${terminal} → ${target}`).toBe(true);
      expect(partOf(spec, target!), `${terminal} → ${target}`).toBeUndefined();
    }
  });

  /* A hole holds one lead. Fifteen leads and fourteen distinct holes would draw
     two legs in one 1 mm hole and `verifyStep` would tick green on it. */
  it("puts no two leads in one hole", () => {
    const seats = Object.values(plantComplete);
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
    const froms = plantGuardian.expected.map((c) => c.from);
    expect(new Set(froms).size).toBe(froms.length);
    for (const terminal of plantTerminals) {
      const owning = plantGuardian.expected.filter(
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
    for (const want of plantGuardian.expected) {
      expect(plantTerminals, want.id).toContain(want.from);
      expect(isHole(spec, want.to), want.id).toBe(true);
    }
  });

  /**
   * The sketch's two constants and the sketch's own wiring agree.
   *
   * `const int PROBE = A0, LAMP = 9;` is printed in the chapter's code panel
   * and uploaded to the board. If either drifts from the header hole the cable
   * actually goes in, the learner uploads a program that reads a pin nothing is
   * wired to — and every check in this file still passes, because nothing else
   * reads `plantPins`.
   */
  it("wires the two pins the sketch names", () => {
    const byId = (id: string) => plantGuardian.expected.find((c) => c.id === id);
    expect(byId("pg.c.signal.pin")?.to).toBe(plantPins.sense);
    expect(byId("pg.c.lamp.pin")?.to).toBe(plantPins.lamp);
    expect(plantPins.sense).toBe("board.A0");
    expect(plantPins.lamp).toBe("board.D9");
  });

  /**
   * Every join the sketch names belongs to exactly one step.
   *
   * `registry.test.ts` checks the other direction — a step may not claim a
   * connection the sketch does not define. The converse is the silent one: a
   * connection no step owns can never be verified, never appears in a kit list
   * derived from a step, and is invisible to the whole progress rail while
   * still being drawn on the canvas. Two of this chapter's six steps own
   * nothing on purpose (the kit step and the one where the person picks a
   * number), which makes the other four owe all fifteen between them.
   */
  it("gives every join to exactly one step", () => {
    const claimed = plantSteps.flatMap((step) => step.connections);
    expect(new Set(claimed).size).toBe(claimed.length);
    expect([...claimed].sort()).toEqual(
      plantGuardian.expected.map((c) => c.id).sort(),
    );
  });
});

/**
 * The bench, with the last region of the Uno on it.
 *
 * Chapter three offered both banks, both rails and everything on both headers
 * except the six holes marked `A`, and said in its own test why it withheld
 * them: they are chapter FOUR's subject. This is chapter four, so the number
 * goes up by exactly six. It is load-bearing: `builds.ts` pays for one scene
 * per lead per hole at boot, and a region quietly dropped from this list is a
 * hole a person can see, aim at and not hit.
 */
describe("the bench offers both banks, both rails and the whole of both headers", () => {
  it("offers 388 distinct holes and every one has a node", () => {
    expect(plantCandidates).toHaveLength(388);
    expect(new Set(plantCandidates).size).toBe(plantCandidates.length);
    for (const hole of plantCandidates) {
      expect(plantGuardian.nodes[hole], hole).toBeDefined();
    }
  });

  it("reaches every bank, every rail and every hole on both headers", () => {
    for (const offered of [
      "bb.a1", "bb.e30", "bb.f1", "bb.j30",
      "bb.pos1", "bb.neg30", "board.D0", "board.D13",
      "board.5V", "board.GND", "board.GND1", "board.GND3",
      "board.VIN", "board.3V3", "board.IOREF", "board.RESET",
      ...ANALOG_HOLES,
    ]) {
      expect(plantCandidates, offered).toContain(offered);
    }
  });

  /* The arrow-key order. `live-workbench.tsx` re-sorts its targets by
     `grabPoint`, so a list ordered any other way makes Home/End and the arrow
     keys disagree about which hole comes next. The Uno's headers count DOWN
     from left to right, which is why this is a screen order and not a pin
     order — and with the board turned over it is now two rows of holes that
     have to interleave with the plastic's thirty columns rather than one. */
  it("offers them in the order they read on screen", () => {
    for (let i = 1; i < plantCandidates.length; i += 1) {
      const prev = plantGuardian.nodes[plantCandidates[i - 1]];
      const next = plantGuardian.nodes[plantCandidates[i]];
      expect(
        prev.x < next.x || (prev.x === next.x && prev.y <= next.y),
        `${prev.id} → ${next.id}`,
      ).toBe(true);
    }
  });
});

/**
 * THE PIN THAT ANSWERS WITH A NUMBER — the chapter, as assertions.
 *
 * No build before this one turned an `A` hole into a node, so `board.A0` did
 * not exist anywhere in the product. Three things have to be true together for
 * the chapter to teach anything at all: the six holes exist and are reachable,
 * the model knows which six they are, and the WRONG kind of pin is reachable
 * too. Withhold the digital header and the lesson becomes unmakeable; withhold
 * `analogPins` and the run has to keep a second copy of a fact about the board.
 */
describe("the analog header is on the bench, and it is what this chapter is about", () => {
  it("puts all six analog holes on the board and offers every one of them", () => {
    for (const id of ANALOG_HOLES) {
      const node = plantGuardian.nodes[id];
      expect(node, id).toBeDefined();
      /* The board's own word, not our id: a panel that said `board.A0` would be
         reading a graph id back to somebody holding a board that says `A0`. */
      expect(node.label, id).toBe(id.replace("board.", ""));
      expect(plantCandidates, id).toContain(id);
    }
    /* Six holes, six places — a transposed pin table would draw them on top of
       one another and every one of them would still be offered. */
    const seen = ANALOG_HOLES.map((id) => {
      const n = plantGuardian.nodes[id];
      return `${n.x},${n.y}`;
    });
    expect(new Set(seen).size).toBe(6);
  });

  /**
   * `analogPins` is exactly those six and nothing else.
   *
   * A property of the BOARD, which is why the run reads it from here instead of
   * keeping its own list (`run-spec.ts`). A digital hole that crept into this
   * list would make `readsANumber` pass on a build that can only ever say wet
   * or dry — the one check this chapter exists to make.
   */
  it("names exactly those six as the holes that can report a number", () => {
    expect([...analogPins]).toEqual([...ANALOG_HOLES]);
    for (const digital of [
      "board.D2",
      "board.D9",
      "board.D13",
      "board.5V",
      "board.GND",
      "board.VIN",
    ]) {
      expect(analogPins, digital).not.toContain(digital);
    }
    expect(analogPins, plantPins.sense).toContain(plantPins.sense);
  });

  /**
   * The two lines, read off the metal rather than off the cable names.
   *
   * `plantLines` asks "of the cable that reaches this net, where does the other
   * end land?" — chapter three's argument, because the four cables are one
   * object as far as a person is concerned and asking *which cable* went where
   * would fail a build that is correct.
   */
  it("reads the sketch's two lines off the finished build", () => {
    const lines = plantLines(plantGuardian);
    expect(lines.sense).toBe(plantPins.sense);
    expect(lines.lamp).toBe(plantPins.lamp);
    expect(analogPins).toContain(lines.sense!);
  });

  /**
   * THE MISTAKE THE CHAPTER IS ABOUT, and it looks exactly like a correct wire.
   *
   * The probe's answer carried into `D2` instead of `A0`: two seated ends, a
   * cable that reaches from the probe's column to a header hole, a picture
   * identical to the right one — `A0` and `D2` are the same brass, the same
   * size and the same distance apart. `analogRead` on a digital pin comes back
   * 0 or 1023 and nothing in between, so the threshold the person spent step
   * five choosing can never be crossed.
   *
   * The wiring panel does catch it, because the sketch names `A0` and this is
   * not it; what `plantLines` plus `analogPins` add is the ability to say WHY,
   * which is the sentence a person needs and "wrong hole" is not.
   */
  it("lets the probe's line reach a digital pin, and reports it as one", () => {
    /* Reachable first — a lesson about the wrong kind of pin is only a lesson
       if the wrong kind of pin can be aimed at and hit. */
    expect(candidatesFor(spec, plantEmpty, "wire.signal.pin")).toContain(
      "board.D2",
    );
    expect(tryAttach(spec, plantEmpty, "wire.signal.pin", "board.D2").kind).toBe(
      "attached",
    );

    const scene = plantSceneFrom(
      { ...plantComplete, "wire.signal.pin": "board.D2" },
      plantAtRest,
    );
    /* A made join: every lead is seated and every one of them is observed. */
    expect(scene.observed).toHaveLength(15);
    expect(
      scene.observed.some(
        (c) => c.from === "wire.signal.pin" && c.to === "board.D2",
      ),
    ).toBe(true);

    const lines = plantLines(scene);
    expect(lines.sense).toBe("board.D2");
    expect(analogPins).not.toContain(lines.sense!);
    /* And the lamp is untouched by it, so the run reports one failure and not
       two on a build with one wire in the wrong hole. */
    expect(lines.lamp).toBe(plantPins.lamp);

    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("pg.c.signal.pin");
    expect(mismatches[0].observed?.to).toBe("board.D2");
    expect(mismatches[0].observed?.label).toBe("D2");
    expect(extras(scene)).toHaveLength(0);
    expect(verifyStep(scene, "pgProbe").verified).toBe(false);
  });
});

/**
 * THE DESK IS THE OTHER WAY UP.
 *
 * Every chapter before this put the Uno BELOW the breadboard, because
 * everything it needed was on the digital header along the board's top edge.
 * This chapter needs `5V`, a `GND` and `A0`, all three on the other header, so
 * the board turns over and its power header faces the plastic.
 *
 * Nothing about that is visible to a type. Every vertical direction in the file
 * inverts with it — which way a loose cable end dangles, which way a part hung
 * off another part's lead stands clear — and a direction that was not turned
 * over renders as a picture, not as a crash: a cable that hangs off the top of
 * the canvas, or a part drawn over the Uno.
 */
describe("the board sits above the breadboard, which no other chapter does", () => {
  it("puts the Uno above the plastic, in the constants and in the picture", () => {
    expect(plantBoardAt.y).toBeLessThan(plantBreadboardAt.y);
    /* Not merely higher — entirely clear of it, so the two boxes a briefing
       frames one at a time never overlap. */
    expect(
      plantPartBox.board.y + plantPartBox.board.height,
    ).toBeLessThan(plantPartBox.breadboard.y);
    for (const pin of ["board.5V", "board.GND", "board.A0", "board.D9"]) {
      for (const hole of ["bb.pos1", "bb.a1", "bb.j30", "bb.neg30"]) {
        expect(
          plantGuardian.nodes[pin].y,
          `${pin} above ${hole}`,
        ).toBeLessThan(plantGuardian.nodes[hole].y);
      }
    }
    /* And the probe stands clear of the Uno in x, which it has to: its board is
       386 units long and hangs down through the whole height of the bench. */
    expect(plantProbeAt.x).toBeGreaterThan(
      plantPartBox.board.x + plantPartBox.board.width,
    );
  });

  /**
   * The power header is the edge that faces the plastic — which is the whole
   * reason the board was turned over.
   *
   * Three of this chapter's four board holes are on it. Turn the board back and
   * those three cables become the long ones and the lamp's becomes the short
   * one, which is the trade chapter three made in the other direction.
   */
  it("faces the power header at the breadboard and the digital one away", () => {
    const power = ["board.5V", "board.GND", "board.GND3", ...ANALOG_HOLES];
    const digital = ["board.D0", "board.D9", "board.D13", "board.GND1"];
    for (const near of power) {
      for (const far of digital) {
        expect(
          plantGuardian.nodes[near].y,
          `${near} below ${far}`,
        ).toBeGreaterThan(plantGuardian.nodes[far].y);
      }
    }
  });

  /**
   * A part hung off another part's free lead stands clear of the BOARD.
   *
   * `candidatesFor` offers a free rigid lead as a target for another rigid
   * part's lead and `tryAttach` accepts it — a legal, reachable state that is
   * what `EXTRA_PREFIX` and `clearing` exist for — and the part that lands
   * there is lifted 14 mm off the plastic so a person can see it is not seated.
   * Which way it is lifted is a fact about the desk, and this desk is the other
   * way up: `WIRE_SLACK` was turned over with it and `STANDOFF` was not, so the
   * hung part climbs toward the Uno instead of clear of it.
   *
   * That is not a rounding error, it is a picture. A resistor in `bb.pos20`
   * with the lamp hung off its far lead draws the LED's box at
   * y 274.8–346.9, x 263.1–324.8, and the Uno's box is y 110–340, x 290–595.7:
   * a 35 x 65 unit overlap, an LED drawn sitting on the Arduino. From `bb.a20`
   * it is 35 x 29. Every hole in the top bank and the `+` rail — half the
   * plastic — is like that, and nothing else in the suite can see it, because
   * the fit box is derived from the same sign and therefore agrees with it.
   */
  it("lifts a part hung off another part's lead away from the board", () => {
    for (const [what, placement] of [
      [
        "lamp on the resistor",
        {
          ...plantEmpty,
          "res.plant.in": "bb.j9",
          "led.plant.cathode": "res.plant.out",
        },
      ],
      [
        "resistor on the lamp",
        {
          ...plantEmpty,
          "led.plant.cathode": "bb.f9",
          "res.plant.in": "led.plant.anode",
        },
      ],
    ] as const) {
      const scene = plantSceneFrom(placement);
      const anchor = what.startsWith("lamp")
        ? scene.nodes["res.plant.out"]
        : scene.nodes["led.plant.anode"];
      const hung = what.startsWith("lamp")
        ? scene.nodes["led.plant.cathode"]
        : scene.nodes["res.plant.in"];
      /* Clear of the lead it hangs from, by the whole standoff... */
      expect(Math.abs(hung.y - anchor.y), what).toBeGreaterThan(PITCH * 4);
      /* ...and clear of it in the direction the board is NOT. */
      expect(hung.y, `${what} moves away from the board`).toBeGreaterThan(
        anchor.y,
      );
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
    expect(plantGuardian.nodes["bb.f9"].label).toBe("F9");
    expect(plantGuardian.nodes["bb.a28"].label).toBe("A28");
    expect(plantGuardian.nodes["bb.j30"].label).toBe("J30");
  });

  it("prints a minus sign on the rail, and says it is a rail", () => {
    expect(plantGuardian.nodes["bb.neg3"].label).toBe("−3");
    expect(plantGuardian.nodes["bb.pos26"].label).toBe("+26");
    /* U+2212, not the hyphen a keyboard produces. Asserted by code point rather
       than by glyph, because the two are indistinguishable in review: a hyphen
       typed into this file would agree with a hyphen typed into the model, the
       pair would pass, and the rail would print a typewriter dash in the slot
       the silkscreen owns. */
    expect(plantGuardian.nodes["bb.neg3"].label?.codePointAt(0)).toBe(0x2212);
    /* `Breadboard` splits rails from banks on exactly these two literals; a
       rail spelled `"pos"` typechecks and then draws as a bank square in the
       middle of the plastic. */
    expect(plantGuardian.nodes["bb.neg3"].row).toBe("-");
    expect(plantGuardian.nodes["bb.pos26"].row).toBe("+");
  });

  /**
   * Three holes, three ids, one printed name — and this chapter means a
   * different one of them by `board.GND`.
   *
   * The Uno prints GND on the digital header and twice more on the power one.
   * They are three different NODES and one printed address. Chapters one to
   * three call the digital one `board.GND`; here the supply leaves from the
   * power header, so `board.GND` is GND2 and `board.GND1` is the odd one out.
   * The id is the same in all five files and the hole is not, which is exactly
   * the kind of fact that has to be asserted somewhere.
   */
  it("prints GND on all three of the board's ground holes", () => {
    const gnd = ["board.GND", "board.GND1", "board.GND3"] as const;
    for (const id of gnd) {
      expect(plantGuardian.nodes[id].label, id).toBe("GND");
    }
    const seen = gnd.map((id) => {
      const n = plantGuardian.nodes[id];
      return `${n.x},${n.y}`;
    });
    expect(new Set(seen).size, "three holes, three places").toBe(3);
    /* And this chapter's `board.GND` is the one on the POWER header, beside
       `5V` and `A0` — not the digital header's, which is `board.GND1` here. */
    expect(plantGuardian.nodes["board.GND"].y).toBe(
      plantGuardian.nodes["board.5V"].y,
    );
    expect(plantGuardian.nodes["board.GND1"].y).toBe(
      plantGuardian.nodes["board.D13"].y,
    );
  });
});

describe("sceneFrom", () => {
  it("draws nothing at all on an empty bench", () => {
    const scene = plantSceneFrom(plantEmpty);
    expect(scene.observed).toHaveLength(0);
    for (const terminal of plantTerminals) {
      expect(scene.nodes[terminal], terminal).toBeUndefined();
    }
    /* And nothing is outlined either: an absent key in `plantBoxesFor` means
       "still in the kit", and both the inspection panel and the scene view
       depend on that. The board and the plastic are furniture and are always
       there. */
    expect(Object.keys(plantBoxesFor(scene)).sort()).toEqual([
      "board",
      "breadboard",
    ]);
  });

  it("satisfies the sketch on the finished build and asks for nothing more", () => {
    const scene = plantSceneFrom(plantComplete);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    for (const id of ["pgPower", "pgProbe", "pgLamp"] as const) {
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
    for (const terminal of plantTerminals) {
      const n = plantGuardian.nodes[terminal];
      expect(n, terminal).toBeDefined();
      expect(Number.isFinite(n.x) && Number.isFinite(n.y), terminal).toBe(true);
    }
    for (const terminal of [...CABLE_ENDS, ...PROBE_LEADS]) {
      const hole = plantGuardian.nodes[plantComplete[terminal]!];
      expect(plantGuardian.nodes[terminal].x, terminal).toBe(hole.x);
      expect(plantGuardian.nodes[terminal].y, terminal).toBe(hole.y);
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
    const anode = plantGuardian.nodes["led.plant.anode"];
    const hole = plantGuardian.nodes["bb.f10"];
    const off = Math.hypot(anode.x - hole.x, anode.y - hole.y);
    expect(off).toBeGreaterThan(0);
    expect(off).toBeLessThan(PITCH * 0.5);
  });

  /**
   * And the resistor's far leg is deliberately NOT at its hole.
   *
   * `res.plant.out` reaches `bb.neg3` from a body lying across the bottom bank,
   * so the node sits where the resistor's own wire ends and the join is drawn
   * as a line from there down into the rail — the bent leg, which is one of the
   * only two things on this bench that is drawn as a stroke rather than by a
   * part being in a hole. A "tidy-up" that snapped it to the hole would delete
   * the leg from the picture.
   */
  it("leaves the resistor's far leg standing above the rail it reaches", () => {
    const out = plantGuardian.nodes["res.plant.out"];
    const rail = plantGuardian.nodes["bb.neg3"];
    expect(Math.hypot(out.x - rail.x, out.y - rail.y)).toBeGreaterThan(PITCH);
    /* The `−` rail is below the bottom bank on this bench as on every other, so
       the leg still bends downward into it — the one direction the turned-over
       desk did not change, because both ends of it moved together. */
    expect(out.y, "the leg bends down into the rail, never up").toBeLessThan(
      rail.y,
    );
  });

  it("mints a distinct id for a join the sketch does not name", () => {
    /* Chapter one's build, made on chapter four's bench: the LED standing in
       its own column with its long leg reaching straight over to the header. */
    const p = seat(
      seat(plantEmpty, "led.plant.cathode", "bb.f9"),
      "led.plant.anode",
      "board.D9",
    );
    const stray = extras(plantSceneFrom(p));
    expect(stray).toHaveLength(1);
    expect(stray[0].id).not.toBe("pg.c.led.anode");
    expect(stray[0].id).toBe("pg.x.led.plant.anode");
    /* Two spellings of the prefix — one exported from `graph.ts` and one
       hardcoded per build — is a rename away from `diff` quietly attributing a
       stray to an expected wire. */
    expect(isExtraId(stray[0].id)).toBe(true);
    expect(stray[0].role).toBe("idle");
  });

  it("carries `mechanical` through rather than resetting it", () => {
    const turned = { servoAngle: 45, expectedAngle: 0 };
    expect(plantSceneFrom(plantComplete, turned).mechanical).toEqual(turned);
  });

  it("omits a connection whose endpoints are not both on the bench", () => {
    /* A resistor clipped to an LED that is still in the kit. `prune` normally
       makes this unreachable, and this scene is reached from a hand-written
       literal — the briefing film and the lab both hand `plantSceneFrom` one. */
    const hanging = plantSceneFrom({
      ...plantEmpty,
      "res.plant.in": "led.plant.anode",
    });
    expect(hanging.observed).toHaveLength(0);

    const partial = plantSceneFrom(
      seat(plantEmpty, "led.plant.cathode", "bb.f9"),
    );
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
    expect(() => plantSceneFrom({ ledPlant: "bb.f9" })).toThrow(/not a terminal/);
  });
});

/**
 * THE COLUMN IS ONE NODE.
 *
 * The five holes down a column are one strip of metal, and the aside under the
 * lamp step says so in words. `NODE_GROUPS` is that sentence in the model. If
 * the two disagree, the aside is teaching something the panel then marks wrong,
 * which is worse than teaching nothing.
 */
describe("a lead in the wrong row of the right column is the same circuit", () => {
  /* Every bank lead moved down its own strip — the probe's `A` lead and the
     signal cable in the top bank, the lamp group in the bottom one. Nothing
     electrical changed: a person who read the row letters off the plastic and
     built it a hole lower has built this. */
  const otherRows = {
    ...plantComplete,
    "soil.aout": "bb.d28",
    "wire.signal.row": "bb.e28",
    "led.plant.cathode": "bb.i9",
    "res.plant.in": "bb.g9",
    "led.plant.anode": "bb.j10",
    "wire.lamp.row": "bb.f10",
  };

  it("is the finished build with every bank lead in a different row", () => {
    const scene = plantSceneFrom(otherRows, plantAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  it("verifies every step it touches", () => {
    const scene = plantSceneFrom(otherRows, plantAtRest);
    for (const id of ["pgProbe", "pgLamp"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });

  /* And each rail is one node from end to end, which is what lets a probe
     drawing 5 V at column 26 and a cable delivering it at column 30 be the same
     join — and a resistor at column 3 reach the same ground the cable does at
     column 30. */
  it("treats each rail as one node from end to end", () => {
    const scene = plantSceneFrom(
      {
        ...plantComplete,
        "wire.power.rail": "bb.pos1",
        "soil.vcc": "bb.pos15",
        "wire.ground.rail": "bb.neg1",
        "soil.gnd": "bb.neg15",
        "res.plant.out": "bb.neg22",
      },
      plantAtRest,
    );
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    expect(verifyStep(scene, "pgPower").verified).toBe(true);
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
  const oneColumnOver = { ...plantComplete, "led.plant.cathode": "bb.f8" };

  it("is exactly one mismatch, carrying the expected id", () => {
    const scene = plantSceneFrom(oneColumnOver, plantAtRest);
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("pg.c.led.cathode");
    /* The observed side is what lets the panel say "it is in F8, it belongs in
       F9" instead of "something is missing". */
    expect(mismatches[0].observed?.id).toBe("pg.c.led.cathode");
    expect(mismatches[0].observed?.to).toBe("bb.f8");
    expect(extras(scene)).toHaveLength(0);
  });

  it("fails its step once and leaves the rest of the build ticked", () => {
    const scene = plantSceneFrom(oneColumnOver, plantAtRest);
    const lamp = verifyStep(scene, "pgLamp");
    expect(lamp.verified).toBe(false);
    expect(lamp.matched).toBe(5);
    expect(lamp.strays).toBe(0);
    expect(verifyStep(scene, "pgProbe").verified).toBe(true);
    expect(verifyStep(scene, "pgPower").verified).toBe(true);
  });
});

/**
 * THE CENTRE CHANNEL.
 *
 * The probe's `A` lead stands in column 28 of the TOP bank and the cable that
 * carries its answer leaves from column 28 of the top bank, four rows down; the
 * lamp stands in the BOTTOM bank. Same column, same x, one 2 mm channel apart
 * on screen — and two different nets.
 *
 * A model that made each column one group would call a lead pushed across the
 * channel correct. It is the commonest silent mistake there is on a real
 * breadboard, it looks right in every photograph, and the only thing that can
 * tell a person about it is the panel.
 */
describe("a lead across the centre channel is a different circuit", () => {
  it("puts the two banks of one column in different groups", () => {
    const groups = plantGuardian.interchangeable ?? [];
    expect(groups.some((g) => g.includes("bb.a28") && g.includes("bb.e28"))).toBe(
      true,
    );
    expect(groups.some((g) => g.includes("bb.f9") && g.includes("bb.j9"))).toBe(
      true,
    );
    expect(groups.some((g) => g.includes("bb.a28") && g.includes("bb.f28"))).toBe(
      false,
    );
    /* Asked of `sameJoin` directly, because that is the function every
       comparison in `graph.ts` routes through. */
    expect(
      sameJoin(
        plantGuardian,
        probeJoin("soil.aout", "bb.a28"),
        probeJoin("soil.aout", "bb.e28"),
      ),
    ).toBe(true);
    expect(
      sameJoin(
        plantGuardian,
        probeJoin("soil.aout", "bb.a28"),
        probeJoin("soil.aout", "bb.f28"),
      ),
    ).toBe(false);
  });

  it("is the same column and the same x, which is why nothing else can see it", () => {
    const top = plantGuardian.nodes["bb.a28"];
    const bottom = plantGuardian.nodes["bb.f28"];
    expect(top.col).toBe(bottom.col);
    expect(top.x).toBe(bottom.x);
  });

  it("reports the probe's lead pushed across the channel, once", () => {
    const scene = plantSceneFrom(
      { ...plantComplete, "soil.aout": "bb.f28" },
      plantAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("pg.c.probe.aout");
    expect(mismatches[0].observed?.id).toBe("pg.c.probe.aout");
    expect(mismatches[0].observed?.to).toBe("bb.f28");
    expect(extras(scene)).toHaveLength(0);
    const probe = verifyStep(scene, "pgProbe");
    expect(probe.verified).toBe(false);
    expect(probe.matched).toBe(4);
    expect(probe.strays).toBe(0);
  });

  it("reports the lamp's lead pushed the other way across it, once", () => {
    const scene = plantSceneFrom(
      { ...plantComplete, "led.plant.cathode": "bb.a9" },
      plantAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("pg.c.led.cathode");
    expect(mismatches[0].observed?.to).toBe("bb.a9");
    expect(extras(scene)).toHaveLength(0);
    expect(verifyStep(scene, "pgLamp").matched).toBe(5);
  });
});

/**
 * THREE HOLES, ONE PIECE OF METAL — and this chapter starts from the other one.
 *
 * An Uno prints GND on the digital header and twice more on the power one, and
 * all three are the same copper. Chapters one to three mean the digital
 * header's by `board.GND`; this one means GND2, because its supply leaves from
 * the power header. So the two holes a person is most likely to use instead are
 * `GND3` beside it and `GND1` right across the board, and both are correct.
 */
describe("a ground cable in any of the board's three GND holes is correct", () => {
  for (const hole of ["board.GND1", "board.GND3"] as const) {
    it(`accepts the ground cable in ${hole}`, () => {
      const scene = plantSceneFrom(
        { ...plantComplete, "wire.ground.pin": hole },
        plantAtRest,
      );
      expect(diff(scene).mismatches).toHaveLength(0);
      expect(extras(scene)).toHaveLength(0);
      expect(verifyStep(scene, "pgPower").verified).toBe(true);
      /* And the join still prints GND — the label names the hole the lead
         REACHED, so a person reading the panel sees the board's own word rather
         than our id for one of the three. */
      const got = scene.observed.find((c) => c.id === "pg.c.ground.pin");
      expect(got?.to).toBe(hole);
      expect(got?.label).toBe("GND");
    });
  }

  /* And the licence stops at the three holes that print GND. `VIN` is on the
     same header, one hole along from `GND3`, and it is not ground. Without the
     group being an explicit list of three, "the power header" would be the
     family and this would pass. */
  it("still reports the ground cable in VIN, once", () => {
    const scene = plantSceneFrom(
      { ...plantComplete, "wire.ground.pin": "board.VIN" },
      plantAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("pg.c.ground.pin");
    expect(mismatches[0].observed?.to).toBe("board.VIN");
    expect(mismatches[0].observed?.label).toBe("VIN");
    expect(extras(scene)).toHaveLength(0);
  });
});

/**
 * ONE RAIL FAMILY, FOR THE MOST INSTRUCTIVE MISTAKE IN THE CHAPTER.
 *
 * `familyOf` answers `"rail"` for BOTH rails on purpose. The family decides
 * only whether a lead may CLAIM its expected id; `sameJoin` then decides
 * whether it is right. One family for both means the power cable that went into
 * the `−` rail keeps `pg.c.power.rail` and is reported ONCE — "it is in −12, it
 * belongs in +30" — instead of as a missing join AND a stray for the same
 * gesture.
 *
 * Two families would split it into two findings, two repair buttons and two
 * rows in the panel, for one cable that one hand put in one wrong hole. And
 * putting 5 V where ground belongs is the mistake this rail exists to be able
 * to talk about.
 */
describe("a power cable in the ground rail is one finding, not two", () => {
  const intoGroundRail = { ...plantComplete, "wire.power.rail": "bb.neg12" };

  it("keeps its own connection id and names the hole it is in", () => {
    const scene = plantSceneFrom(intoGroundRail, plantAtRest);
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("pg.c.power.rail");
    expect(mismatches[0].observed?.id).toBe("pg.c.power.rail");
    expect(mismatches[0].observed?.to).toBe("bb.neg12");
  });

  it("is not also a stray, which is the whole point of one rail family", () => {
    const scene = plantSceneFrom(intoGroundRail, plantAtRest);
    expect(extras(scene)).toHaveLength(0);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const power = verifyStep(scene, "pgPower");
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
   * and the four PAIRS are never checked at all. On this bench that class spans
   * two power rails, `5V` and an analog hole, so swapping the two supply
   * cables' rail ends would put five volts on the `−` rail and verify as a
   * finished build.
   *
   * So the finished scene publishes no such group, and which cable is standing
   * in for which is decided per placement (`cable-joins.ts`).
   */
  it("does not put the eight ends in one static group", () => {
    const groups = plantGuardian.interchangeable ?? [];
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
    const scene = plantSceneFrom(
      {
        ...plantComplete,
        "wire.power.rail": "bb.neg30",
        "wire.ground.rail": "bb.pos30",
      },
      plantAtRest,
    );
    expect(diff(scene).mismatches).toHaveLength(2);
  });

  it("reports a dead short across the supply", () => {
    const scene = plantSceneFrom(
      {
        ...plantComplete,
        "wire.power.rail": "bb.pos30",
        "wire.power.pin": "bb.neg30",
        "wire.ground.rail": "board.5V",
        "wire.ground.pin": "board.GND",
      },
      plantAtRest,
    );
    expect(diff(scene).mismatches.length).toBeGreaterThan(0);
  });

  /**
   * And the swap this chapter is uniquely able to be wrong about.
   *
   * The probe's line and the lamp's line traded header holes: the answer goes
   * into `D9`, which cannot report a number, and the lamp is driven from `A0`.
   * Both ends of both cables are seated and the picture is the right one.
   */
  it("reports the probe's line and the lamp's line swapped", () => {
    const scene = plantSceneFrom(
      {
        ...plantComplete,
        "wire.signal.pin": "board.D9",
        "wire.lamp.pin": "board.A0",
      },
      plantAtRest,
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
      ...plantComplete,
      "wire.power.rail": "bb.h10",
      "wire.power.pin": "board.D9",
      "wire.lamp.row": "bb.pos30",
      "wire.lamp.pin": "board.5V",
    };
    const scene = plantSceneFrom(swapped, plantAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["pgPower", "pgLamp"] as const) {
      expect(verifyStep(scene, id).verified, id).toBe(true);
    }
  });

  it("accepts the signal cable and the ground cable swapped", () => {
    const swapped = {
      ...plantComplete,
      "wire.ground.rail": "bb.e28",
      "wire.ground.pin": "board.A0",
      "wire.signal.row": "bb.neg30",
      "wire.signal.pin": "board.GND",
    };
    const scene = plantSceneFrom(swapped, plantAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    /* And the two lines are still read off the metal correctly, which is what
       the run's own check depends on. */
    expect(plantLines(scene).sense).toBe(plantPins.sense);
  });

  /* A cable on the wrong header pin keeps ITS OWN id and reports one finding,
     rather than borrowing the neighbour it landed next to. Its own entry is
     tried before any mate's, and this is what that ordering is for. */
  it("but a cable one pin over is still that cable's own mistake", () => {
    const scene = plantSceneFrom(
      { ...plantComplete, "wire.lamp.pin": "board.D10" },
      plantAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("pg.c.lamp.pin");
    expect(mismatches[0].observed?.id).toBe("pg.c.lamp.pin");
    /* The label names where the leg actually went, never where it belongs. */
    expect(mismatches[0].observed?.label).toBe("D10");
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
    ...plantComplete,
    "res.plant.in": "bb.neg3",
    "res.plant.out": "bb.j9",
  };

  it("reports nothing on it and verifies the lamp step", () => {
    const scene = plantSceneFrom(reversed, plantAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
    expect(verifyStep(scene, "pgLamp").verified).toBe(true);
  });

  it("keeps the sketch's own connection ids, so the panel can name them", () => {
    const ids = plantSceneFrom(reversed, plantAtRest).observed.map((c) => c.id);
    expect([...ids].sort()).toEqual(
      [...plantGuardian.expected.map((c) => c.id)].sort(),
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
      ...plantComplete,
      "res.plant.in": "bb.neg3",
      "res.plant.out": "bb.neg4",
    };
    const scene = plantSceneFrom(both, plantAtRest);
    const ids = scene.observed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const minted = scene.observed.filter((c) => isExtraId(c.id));
    expect(minted).toHaveLength(1);
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].expected.id).toBe("pg.c.res.in");
  });
});

/**
 * THE PROBE'S THREE LEADS ARE NOT.
 *
 * The distinction §11's rule turns on, and the reason `SYMMETRIC` stops at the
 * resistor. A module's leads are printed on its own board — `+`, `GND`, `AOUT`,
 * in white beside the posts — the person can tell them apart, and putting five
 * volts into the output is a real mistake with a real consequence. Fold them
 * into the interchangeable class "for symmetry" and the panel goes silent on
 * the one wiring mistake that can damage the part.
 */
describe("the probe's three leads are not interchangeable", () => {
  it("puts no probe lead in any interchangeable group", () => {
    for (const group of plantGuardian.interchangeable ?? []) {
      expect(
        group.filter((id) => id.startsWith("soil.")),
        group.join(","),
      ).toHaveLength(0);
    }
  });

  /* Three leads, three different characters — which is WHY they are not
     interchangeable. A part that printed the same thing on all three would be a
     part a person cannot tell apart, and the rule would have to change with it.
     `A` rather than `AOUT`: a badge holds two characters and the board's own
     word does not fit in one, so the full name lives in the lead's sentence. */
  it("prints a different character beside each of them", () => {
    const glyphs = PROBE_LEADS.map((t) => spec.leadGlyph(t));
    expect(glyphs).toEqual(["+", "−", "A"]);
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
    for (const terminal of PROBE_LEADS) {
      expect(plantGuardian.nodes[terminal].label, terminal).toBe(
        spec.leadGlyph(terminal),
      );
    }
    /* And the resistor deliberately differs: the scene prints `220Ω` on both
       ends and the shelf prints nothing, because naming one of two identical
       ends would be the interface asserting a difference the part does not
       have. That asymmetry is the reason the two tables exist separately. */
    expect(spec.leadGlyph("res.plant.in")).toBeUndefined();
    expect(plantGuardian.nodes["res.plant.in"].label).toBe("220Ω");
  });

  it("reports the probe's + and − leads swapped, as two findings", () => {
    const scene = plantSceneFrom(
      { ...plantComplete, "soil.vcc": "bb.neg26", "soil.gnd": "bb.pos28" },
      plantAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches).toHaveLength(2);
    expect(mismatches.map((m) => m.expected.id).sort()).toEqual([
      "pg.c.probe.gnd",
      "pg.c.probe.vcc",
    ]);
    /* Each one names the hole it is in, so the panel can say "the + lead is in
       −26" rather than "something is missing". Two findings here is right: two
       leads were put in two wrong holes, and each has to move. */
    for (const m of mismatches) {
      expect(m.observed, m.expected.id).toBeDefined();
    }
    expect(extras(scene)).toHaveLength(0);
    expect(verifyStep(scene, "pgProbe").matched).toBe(3);
  });
});

/**
 * A MODULE IS A BODY THAT STANDS STILL AND LEADS THAT DO NOT.
 *
 * The other half of `flexible`. This probe's board is 23 x 98 mm — 90 x 386
 * scene units, a stick a third again as long as the Uno — so nothing about it
 * plugs into a breadboard: it stands in a pot with three wires running back to
 * the bench. Its case is a constant of the DESK and its leads are the
 * placement.
 */
describe("the probe's case never moves and its leads always do", () => {
  it("is not on the bench at all until one of its leads is seated", () => {
    for (const placement of [
      plantEmpty,
      /* And the whole rest of the build present, which is the case a bench
         actually reaches: everything wired, probe still in the box. */
      {
        ...plantComplete,
        "soil.vcc": null,
        "soil.aout": null,
        "soil.gnd": null,
      },
    ]) {
      const scene = plantSceneFrom(placement);
      for (const terminal of PROBE_LEADS) {
        expect(scene.nodes[terminal], terminal).toBeUndefined();
      }
      /* A case with three leads reaching nowhere is a part on the bench that
         nobody has put there — so `plantArtOrigins` answers `undefined` and
         `plantBoxesFor` omits the key entirely, which is how both the scene
         view and the inspection panel read "still in the kit". */
      expect(plantArtOrigins(scene).probe).toBeUndefined();
      expect(plantBoxesFor(scene).probe).toBeUndefined();
    }
  });

  it("reports its three joins as missing while it is still in the box", () => {
    const scene = plantSceneFrom(
      { ...plantComplete, "soil.vcc": null, "soil.aout": null, "soil.gnd": null },
      plantAtRest,
    );
    const { mismatches } = diff(scene);
    expect(mismatches.map((m) => m.expected.id).sort()).toEqual([
      "pg.c.probe.aout",
      "pg.c.probe.gnd",
      "pg.c.probe.vcc",
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
  for (const anchor of PROBE_LEADS) {
    it(`hangs its other two leads off the case when ${anchor} is the one seated`, () => {
      const hole = plantComplete[anchor]!;
      const scene = plantSceneFrom({ ...plantEmpty, [anchor]: hole });

      const seated = scene.nodes[anchor];
      expect(seated.x).toBe(scene.nodes[hole].x);
      expect(seated.y).toBe(scene.nodes[hole].y);

      for (const other of PROBE_LEADS.filter((t) => t !== anchor)) {
        const node = scene.nodes[other];
        expect(node, other).toBeDefined();
        /* Compared against `plantLeadRoot`, which is what the DRAWING uses to
           start the strand from the case. Two tables of pin offsets — the
           scene's and the artwork's — is the drift `wokwi.ts` exists to
           prevent, and this is the assertion that they are one fact. */
        const root = plantLeadRoot(other, plantProbeAt);
        expect(root, other).toBeDefined();
        expect(node.x).toBeCloseTo(root!.x);
        expect(node.y).toBeCloseTo(root!.y);
        /* And it can still be picked up and finished. */
        expect(Number.isFinite(plantGrabPoint(node).x)).toBe(true);
        expect(candidatesFor(spec, { ...plantEmpty, [anchor]: hole }, other))
          .toContain(plantComplete[other]!);
      }
    });
  }

  it("draws its case in the same place whichever lead is holding it up", () => {
    const boxes = [
      plantBoxesFor(plantGuardian).probe,
      ...PROBE_LEADS.map(
        (anchor) =>
          plantBoxesFor(
            plantSceneFrom({ ...plantEmpty, [anchor]: plantComplete[anchor]! }),
          ).probe,
      ),
      /* And with a lead in a hole at the far end of the bench, which is where a
         "position the body from its anchor" model would visibly break. */
      plantBoxesFor(plantSceneFrom({ ...plantEmpty, "soil.aout": "bb.f1" })).probe,
    ];
    /* The BOX spans the case and wherever the leads have got to — it is what a
       vision result outlines, and a box that stopped at the case would frame a
       part whose own wires run off the edge of it. What must not move is the
       CASE, so every box has to contain it wherever the leads are. */
    const caseBox = {
      x: plantProbeAt.x - 10,
      y: plantProbeAt.y - 10,
      right: plantProbeAt.x + boxOf(frame.soil).width + 10,
      bottom: plantProbeAt.y + boxOf(frame.soil).height + 10,
    };
    for (const box of boxes) {
      expect(box).toBeDefined();
      expect(box!.x).toBeLessThanOrEqual(caseBox.x);
      expect(box!.y).toBeLessThanOrEqual(caseBox.y);
      expect(box!.x + box!.width).toBeGreaterThanOrEqual(caseBox.right);
      expect(box!.y + box!.height).toBeGreaterThanOrEqual(caseBox.bottom);
    }
    for (const placement of [
      plantComplete,
      { ...plantEmpty, "soil.gnd": "bb.j30" },
    ]) {
      expect(plantArtOrigins(plantSceneFrom(placement)).probe).toEqual(
        plantProbeAt,
      );
    }
  });

  /**
   * The three leads come out of the TOP of the board, left to right in the
   * order it prints them.
   *
   * The opposite end from chapter three's module, and the reason is the part:
   * this is a spike that goes into soil, so its header is at the top and the
   * business end is 98 mm below it. A transposed pin table would draw the `+`
   * strand from where `−` leaves the board, which is a picture that teaches the
   * opposite of the truth.
   */
  it("takes its leads out of the top of its own case, in printed order", () => {
    const roots = PROBE_LEADS.map((t) => plantLeadRoot(t, plantProbeAt)!);
    expect(roots.map((r) => r.x)).toEqual(
      [...roots.map((r) => r.x)].sort((a, b) => a - b),
    );
    expect(new Set(roots.map((r) => r.x)).size).toBe(3);
    const box = boxOf(frame.soil);
    for (const root of roots) {
      /* Below the top edge, and in the top tenth of a very long board. */
      expect(root.y).toBeGreaterThan(plantProbeAt.y);
      expect(root.y).toBeLessThan(plantProbeAt.y + box.height * 0.1);
      /* And across the width of it rather than off the side. */
      expect(root.x).toBeGreaterThan(plantProbeAt.x);
      expect(root.x).toBeLessThan(plantProbeAt.x + box.width);
    }
  });

  /* And it answers for nothing but its own leads. `plantLeadRoot` is asked
     about every terminal the drawing walks; a cable end that got a root would
     grow a strand out of a case it is not attached to. */
  it("gives a lead root to the module's leads and to nothing else", () => {
    for (const terminal of [...CABLE_ENDS, "led.plant.cathode", "res.plant.out"]) {
      expect(plantLeadRoot(terminal, plantProbeAt), terminal).toBeUndefined();
    }
    expect(plantLeadRoot("soil.vcc", { x: 0, y: 0 })).toBeDefined();
  });
});

/**
 * A CABLE END, AND A MODULE LEAD, GOES IN A HOLE.
 *
 * Neither has a rigid body: each is positioned from its own seat, so a lead
 * clipped onto one — or one clipped onto a lead — is a join the model would
 * accept, `anchorsFor` would call anchored, and the drawing would have to
 * invent a body to hang off. `flexible` is what lets the refusal be said out
 * loud instead of the part springing back in silence.
 */
describe("nothing clips to a cable end or to a probe lead", () => {
  const bench = seat(plantEmpty, "led.plant.cathode", "bb.f9");

  it("refuses the gesture from either side, and says which one it is", () => {
    expect(tryAttach(spec, bench, "wire.lamp.row", "led.plant.anode")).toEqual({
      kind: "refused",
      reason: "wireEnd",
    });
    const withCable = seat(bench, "wire.lamp.pin", "board.D9");
    expect(
      tryAttach(spec, withCable, "led.plant.anode", "wire.lamp.row"),
    ).toEqual({ kind: "refused", reason: "wireEnd" });
  });

  it("refuses it for the probe too, from either side", () => {
    expect(tryAttach(spec, bench, "soil.aout", "led.plant.anode")).toEqual({
      kind: "refused",
      reason: "wireEnd",
    });
    const withProbe = seat(bench, "soil.vcc", "bb.pos26");
    expect(tryAttach(spec, withProbe, "led.plant.anode", "soil.aout")).toEqual({
      kind: "refused",
      reason: "wireEnd",
    });
  });

  /* And the picker never draws a target the write refuses — a mark you can aim
     at and cannot hit is the one thing §8 of `docs/bench-parts.md` forbids. */
  it("offers a flexible lead nothing but holes, and offers no lead one of them", () => {
    const p = seat(seat(bench, "wire.lamp.pin", "board.D9"), "soil.vcc", "bb.pos26");

    for (const flexible of ["wire.lamp.row", "soil.aout"]) {
      const offered = candidatesFor(spec, p, flexible);
      expect(offered.length, flexible).toBeGreaterThan(0);
      for (const id of offered) expect(isHole(spec, id), `${flexible} → ${id}`).toBe(true);
    }
    expect(candidatesFor(spec, p, "wire.lamp.row")).toContain("bb.h10");
    expect(candidatesFor(spec, p, "soil.aout")).toContain("bb.a28");

    for (const id of candidatesFor(spec, p, "led.plant.anode")) {
      expect(id.startsWith("wire."), id).toBe(false);
      expect(id.startsWith("soil."), id).toBe(false);
    }
  });

  /**
   * Half a cable is still a cable you have to be able to finish — and on this
   * bench the slack points the other way.
   *
   * The loose end hangs toward the board the cable is reaching for. With the
   * Uno above the plastic that means UP off the breadboard and DOWN off the
   * header, which is the exact inverse of chapters two and three. A slack rule
   * that was not turned over with the desk sends every half-placed cable away
   * from the thing it is reaching for.
   */
  it("gives the loose end of a half-placed cable somewhere to be", () => {
    const onHeader = plantSceneFrom(
      seat(plantEmpty, "wire.lamp.pin", "board.D9"),
    );
    const seated = onHeader.nodes["board.D9"];
    const loose = onHeader.nodes["wire.lamp.row"];
    expect(loose).toBeDefined();
    expect(Number.isFinite(loose.x) && Number.isFinite(loose.y)).toBe(true);
    expect(Number.isFinite(plantGrabPoint(loose).x)).toBe(true);
    /* Far enough from its own seat to be a second thing you can take hold of. */
    expect(Math.hypot(loose.x - seated.x, loose.y - seated.y)).toBeGreaterThan(
      PITCH,
    );
    /* Seated on the header, it reaches DOWN toward the breadboard. */
    expect(loose.y).toBeGreaterThan(seated.y);

    const onBoard = plantSceneFrom(
      seat(plantEmpty, "wire.power.rail", "bb.pos30"),
    );
    /* Seated on the plastic, it dangles UP toward the Uno. */
    expect(onBoard.nodes["wire.power.pin"].y).toBeLessThan(
      onBoard.nodes["bb.pos30"].y,
    );
  });

  it("takes a hole with the lead that is in it, whosever lead that is", () => {
    const p = seat(plantEmpty, "wire.lamp.pin", "board.D9");
    expect(candidatesFor(spec, p, "wire.lamp.row")).not.toContain("board.D9");

    const q = seat(plantEmpty, "led.plant.cathode", "bb.f9");
    expect(candidatesFor(spec, q, "res.plant.in")).not.toContain("bb.f9");
    expect(tryAttach(spec, q, "res.plant.in", "bb.f9")).toEqual({
      kind: "refused",
      reason: "holeTaken",
    });
  });
});

describe("satisfying — the demo control's shortcut", () => {
  it("reaches every expected connection from an empty bench", () => {
    for (const want of plantGuardian.expected) {
      const next = spec.satisfying(plantEmpty, want.id);
      expect(next, want.id).not.toBeNull();
      const scene = plantSceneFrom(prune(spec, next!), plantAtRest);
      expect(diff(scene, [want.id]).mismatches, want.id).toHaveLength(0);
    }
  });

  it("declines an id this build does not name", () => {
    expect(spec.satisfying(plantEmpty, "c.sensor.echo")).toBeNull();
    /* Every chapter is in the same global id namespace and this build must not
       answer for any of the others. */
    expect(spec.satisfying(plantEmpty, "bl.c.anode")).toBeNull();
    expect(spec.satisfying(plantEmpty, "tl.c.red.cathode")).toBeNull();
    expect(spec.satisfying(plantEmpty, "mnl.c.pir.out")).toBeNull();
  });

  /**
   * `null` rather than an unchanged record: returning the same placement made a
   * declined shortcut indistinguishable from a performed one, so the caller
   * committed, credited a repair and logged a move it had not made.
   */
  it("declines a join that is already true", () => {
    for (const want of plantGuardian.expected) {
      expect(spec.satisfying(plantComplete, want.id), want.id).toBeNull();
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
      ...plantComplete,
      "led.plant.cathode": "bb.f10",
      "led.plant.anode": "bb.f9",
      "soil.vcc": "bb.a28",
      "soil.aout": "bb.pos26",
      "wire.power.rail": "bb.neg12",
      "wire.ground.pin": "board.GND3",
    };
    for (const start of [plantEmpty, scrambled, plantComplete]) {
      let p: Placement = start;
      for (const want of plantGuardian.expected) {
        p = spec.satisfying(p, want.id) ?? p;
      }
      expect(prune(spec, p)).toEqual(plantComplete);
    }
  });

  it("never breaks a join that was already right", () => {
    for (const want of plantGuardian.expected) {
      const others = plantGuardian.expected.filter((c) => c.id !== want.id);
      /* Build everything but `want`, then ask for `want`. */
      let p: Placement = plantEmpty;
      for (const other of others) p = spec.satisfying(p, other.id) ?? p;
      const built = prune(spec, p);
      const next = spec.satisfying(built, want.id);
      if (!next) continue;
      const scene = plantSceneFrom(prune(spec, next), plantAtRest);
      expect(diff(scene).mismatches, want.id).toHaveLength(0);
    }
  });
});

describe("clearing — the demo control's removal", () => {
  /* The LED standing in its own column with its long leg reaching over to the
     header — chapter one's build, made on chapter four's bench, where it is a
     join the sketch does not name. */
  const strayPlacement = seat(
    seat(plantEmpty, "led.plant.cathode", "bb.f9"),
    "led.plant.anode",
    "board.D9",
  );

  it("removes exactly the join it names", () => {
    const stray = extras(plantSceneFrom(strayPlacement))[0];
    const next = spec.clearing(strayPlacement, stray.id, {
      from: stray.from,
      to: stray.to,
    });
    expect(next).not.toBeNull();
    expect(extras(plantSceneFrom(prune(spec, next!)))).toHaveLength(0);
    /* And it did not disturb the leg that was in the right hole. */
    expect(next!["led.plant.cathode"]).toBe("bb.f9");
  });

  it("declines a stale edge instead of firing on whatever is there now", () => {
    const stray = extras(plantSceneFrom(strayPlacement))[0];
    /* The person moved it themselves before pressing the button. */
    const moved = seat(strayPlacement, "led.plant.anode", "board.D11");
    expect(
      spec.clearing(moved, stray.id, { from: stray.from, to: stray.to }),
    ).toBeNull();
  });

  it("declines an id that is not a stray at all", () => {
    expect(
      spec.clearing(plantComplete, "pg.c.led.anode", {
        from: "led.plant.anode",
        to: "bb.f10",
      }),
    ).toBeNull();
    /* And another chapter's minted id, which shares the shape but not the
       prefix. */
    expect(
      spec.clearing(strayPlacement, "mnl.x.led.night.anode", {
        from: "led.plant.anode",
        to: "board.D9",
      }),
    ).toBeNull();
  });
});

describe("grabPoint", () => {
  it("is total over every node in the finished scene", () => {
    for (const node of Object.values(plantGuardian.nodes)) {
      const at = plantGrabPoint(node);
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
    const lifted = plantGrabPoint(plantGuardian.nodes["led.plant.cathode"]);
    const nearest = Math.min(
      ...plantCandidates.map((id) => {
        const hole = plantGuardian.nodes[id];
        return Math.hypot(lifted.x - hole.x, lifted.y - hole.y);
      }),
    );
    expect(nearest).toBeCloseTo(Math.hypot(PITCH * 0.5, PITCH * 0.5));
    expect(nearest).toBeGreaterThan(PITCH * 0.7);
  });

  it("leaves a hole where it is", () => {
    for (const id of ["board.A0", "bb.a28", "bb.pos30"]) {
      const hole = plantGuardian.nodes[id];
      expect(plantGrabPoint(hole), id).toEqual({ x: hole.x, y: hole.y });
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
   * to agree fifteen times running.
   */
  it("reaches the finished plant guardian by a sequence of legal drops", () => {
    let p: Placement = plantEmpty;
    for (const terminal of plantTerminals) {
      const target = plantComplete[terminal]!;
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
      const partial = plantSceneFrom(p, plantAtRest);
      expect(extras(partial), `after ${terminal}`).toHaveLength(0);
      expect(partial.observed, `after ${terminal}`).toHaveLength(
        plantTerminals.indexOf(terminal) + 1,
      );
    }
    expect(p).toEqual(plantComplete);
    const scene = plantSceneFrom(p, plantAtRest);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });

  it("still lets chapter one's mistake be made, and calls it a stray here", () => {
    /* "The LED straight into the header" — the gesture chapter one is about,
       made on a bench where the LED belongs in the plastic. Deleting this would
       delete the continuity between the chapters. */
    let p = seat(plantEmpty, "led.plant.cathode", "bb.f9");
    expect(candidatesFor(spec, p, "led.plant.anode")).toContain("board.D9");
    p = seat(p, "led.plant.anode", "board.D9");
    expect(p["led.plant.anode"]).toBe("board.D9");
    expect(extras(plantSceneFrom(p))).toHaveLength(1);
  });

  /* And the probe's own mistake, which is the one step three is about: the
     module powered from `3V3` instead of the rail the cable feeds. Reachable,
     as it must be — a lesson about a wrong pin is only a lesson if the wrong
     pin is on the bench. */
  it("still lets the probe be powered off the wrong header hole", () => {
    const p = seat(plantEmpty, "soil.vcc", "board.3V3");
    expect(p["soil.vcc"]).toBe("board.3V3");
    const scene = plantSceneFrom(p);
    expect(extras(scene)).toHaveLength(1);
    expect(extras(scene)[0].id).toBe("pg.x.soil.vcc");
  });
});

/**
 * `plantFitBox` is a CONSTANT, and it has to contain everything.
 *
 * `fitView`'s memo depends on this box, so one derived from the live placement
 * would frame a different thing before and after every drop. But chapter one
 * shipped with a box taken from the finished lamp alone and drew a just-placed
 * LED off the top of the canvas — so a constant is only correct if it covers
 * the states a person actually passes through on the way to the finished build.
 *
 * The walk below is the same fifteen drops as above, checked box by box, plus
 * the two standoff cases (a part hung off another part's free lead, which lifts
 * it a whole 14 mm off the plastic) and the probe alone.
 */
describe("the fit box contains every box the model can produce", () => {
  const contains = (
    box: { x: number; y: number; width: number; height: number },
    what: string,
  ) => {
    expect(box.x, `${what} left`).toBeGreaterThanOrEqual(plantFitBox.x);
    expect(box.y, `${what} top`).toBeGreaterThanOrEqual(plantFitBox.y);
    expect(box.x + box.width, `${what} right`).toBeLessThanOrEqual(
      plantFitBox.x + plantFitBox.width,
    );
    expect(box.y + box.height, `${what} bottom`).toBeLessThanOrEqual(
      plantFitBox.y + plantFitBox.height,
    );
  };

  const checkAll = (placement: Placement, what: string) => {
    for (const [id, box] of Object.entries(
      plantBoxesFor(plantSceneFrom(placement)),
    )) {
      contains(box, `${what} · ${id}`);
    }
  };

  it("is a real box with room in it", () => {
    expect(Number.isFinite(plantFitBox.x)).toBe(true);
    expect(Number.isFinite(plantFitBox.y)).toBe(true);
    expect(plantFitBox.width).toBeGreaterThan(0);
    expect(plantFitBox.height).toBeGreaterThan(0);
  });

  it("frames the empty bench and the finished build", () => {
    checkAll(plantEmpty, "empty");
    checkAll(plantComplete, "complete");
    /* The probe's case stands off the desk, out to the right of everything — a
       fit view taken from the board and the breadboard alone would crop it. */
    contains(plantPartBox.probe, "probe case");
    expect(plantPartBox.probe.x + plantPartBox.probe.width).toBeGreaterThan(
      plantPartBox.board.x + plantPartBox.board.width,
    );
  });

  it("frames every state on the way to the finished build", () => {
    let p: Placement = plantEmpty;
    for (const terminal of plantTerminals) {
      p = prune(spec, seat(p, terminal, plantComplete[terminal]!));
      checkAll(p, `after ${terminal}`);
    }
  });

  /* The two `STANDOFF` cases: a rigid part hung off another rigid part's free
     lead stands 14 mm clear of the plastic, which is the furthest anything on
     this bench ever reaches and is not a state the finished build contains. */
  it("frames a part hung off another part's free lead, either way round", () => {
    checkAll(
      {
        ...plantEmpty,
        "res.plant.in": "bb.j9",
        "led.plant.cathode": "res.plant.out",
      },
      "lamp on the resistor",
    );
    checkAll(
      {
        ...plantEmpty,
        "led.plant.cathode": "bb.f9",
        "res.plant.in": "led.plant.anode",
      },
      "resistor on the lamp",
    );
  });

  /* A cable with one end down still has the other end out on its slack, up off
     the plastic or down off the header — the loose end reaches further than
     either seated end ever does. */
  it("frames a half-placed cable's loose end, on either board", () => {
    checkAll(
      {
        ...plantEmpty,
        "wire.power.pin": "board.5V",
        "wire.ground.pin": "board.GND",
        "wire.signal.pin": "board.A0",
        "wire.lamp.pin": "board.D9",
      },
      "cables on the header",
    );
    checkAll(
      {
        ...plantEmpty,
        "wire.power.rail": "bb.pos30",
        "wire.ground.rail": "bb.neg30",
        "wire.signal.row": "bb.e28",
        "wire.lamp.row": "bb.h10",
      },
      "cables on the plastic",
    );
  });

  it("frames the probe whichever of its leads is the one on the bench", () => {
    for (const anchor of PROBE_LEADS) {
      checkAll({ ...plantEmpty, [anchor]: plantComplete[anchor]! }, anchor);
    }
  });
});
