import type { Copy } from "@/content/i18n";
import type { Connection } from "@/lib/circuit/graph";
import type { InspectionScope } from "@/lib/agent/model";
import type { KitId } from "@/lib/projects/catalog";

/**
 * Batch 4 · The seven steps.
 *
 * The definition is static: what the step asks for, and which connections it is
 * responsible for. What it is *doing* — completed, active, blocked — is never
 * stored, because a stored status is how you end up with the agent saying
 * "verified" while the tick stays amber. `toProgressSteps` derives it, and it is
 * the only place that does.
 *
 * `connections` is what scopes `diff()`. Step 3 owns the sensor's four wires and
 * the two rails; the mismatch the demo is built around is one of them.
 *
 * No words live here. Which connections a step owns is the same in every
 * language; what the step is *called* is not. The names come from the
 * dictionary at render, keyed by the same `StepId` — so adding a locale never
 * touches this file.
 */

/**
 * Every step in the product, across every build.
 *
 * One flat union rather than a union per build, and the ids are unique across
 * builds on purpose: `stepById` stays a global lookup, which is what lets the
 * dozen callers that only ever hold an id — the tool handlers, the parts list,
 * the landing strip — keep working without being handed a build as well.
 *
 * What *is* per build is the **order**, and only the three functions that need
 * ordering ask for it.
 */
export type StepId =
  | "kit" | "place" | "sensor" | "servo" | "leds" | "upload" | "test"
  | "lampKit" | "lampSeat" | "lampResistor" | "lampUpload"
  | "tlKit" | "tlGround" | "tlRed" | "tlOthers" | "tlUpload"
  | "mnlKit" | "mnlPower" | "mnlSensor" | "mnlLamp" | "mnlUpload"
  | "pgKit" | "pgPower" | "pgProbe" | "pgLamp" | "pgSketch" | "pgUpload"
  | "tsdKit" | "tsdPower" | "tsdSensor" | "tsdServo" | "tsdLamp" | "tsdUpload";

/** Lives here rather than in `build-progress.tsx`: a blocked step is a fact
 *  about the build, not a colour the rail chose. */
export type StepStatus = "completed" | "active" | "issue" | "upcoming";

/** The view model the step rail and the topbar progress render. Derived. */
export interface BuildStep {
  id: StepId;
  name: string;
  minutes?: number;
  status: StepStatus;
}

/** What the agent offers once a step has nothing open against it. */
export type StepSuggestion = "inspect" | "verify" | "runTest" | "next";

export interface BuildStepDef {
  id: StepId;
  /** 1-based, for `Step 3 of 7`. */
  index: number;
  minutes: number;
  connections: Connection["id"][];
  /**
   * Parts the step is about that its connections cannot name.
   *
   * `stepParts` derives the kit list from the wires a step owns, which is
   * right for every wiring step and empty for the one whose whole job is the
   * kit: `Check your kit` owns no connection, so the list under it was blank —
   * and on a build the person assembles, that list is where the parts are
   * picked up from. Written down only where deriving cannot work.
   */
  parts?: KitId[];
  /** True when the step also asserts the servo is mounted the right way round. */
  checksMechanical?: boolean;
  suggestion: StepSuggestion;
  /** Whether the step offers a `Why…?` aside. The words come from the copy. */
  hasAside?: boolean;
}

/** Everything a step says, in the reader's language. */
export function stepWords(copy: Copy, id: StepId) {
  return copy.build.steps[id];
}

/**
 * The `Why…?` disclosure, when the step has one. Returns `undefined` rather
 * than empty strings so a caller can simply not render the control.
 */
export function stepAside(
  copy: Copy,
  id: StepId,
): { summary: string; body: string } | undefined {
  const words = copy.build.steps[id];
  return "asideSummary" in words
    ? { summary: words.asideSummary, body: words.asideBody }
    : undefined;
}

/** Chapter six · the capstone, and the only build with all seven parts. */
export const barrierSteps: BuildStepDef[] = [
  {
    id: "kit",
    index: 1,
    minutes: 2,
    connections: [],
    suggestion: "next",
  },
  {
    id: "place",
    index: 2,
    minutes: 4,
    connections: [],
    suggestion: "next",
  },
  {
    id: "sensor",
    index: 3,
    minutes: 6,
    hasAside: true,
    connections: [
      "c.rail.pos",
      "c.rail.neg",
      "c.sensor.vcc",
      "c.sensor.gnd",
      "c.sensor.trig",
      "c.sensor.echo",
    ],
    suggestion: "verify",
  },
  {
    id: "servo",
    index: 4,
    minutes: 5,
    hasAside: true,
    connections: ["c.servo.signal", "c.servo.power", "c.servo.gnd"],
    checksMechanical: true,
    suggestion: "verify",
  },
  {
    id: "leds",
    index: 5,
    minutes: 4,
    connections: ["c.led.green", "c.led.red"],
    suggestion: "verify",
  },
  {
    id: "upload",
    index: 6,
    minutes: 8,
    connections: [],
    suggestion: "next",
  },
  {
    id: "test",
    index: 7,
    minutes: 6,
    connections: [],
    suggestion: "runTest",
  },
];

/**
 * Chapter one · three parts and no breadboard.
 *
 * Four steps, and the fault lives in the third: the resistor's free lead is in
 * D8 where the sketch writes to D9, so the lamp blinks instead of breathing.
 * Same shape as the capstone's misplaced Echo, one chapter's worth smaller.
 */
export const lampSteps: BuildStepDef[] = [
  {
    id: "lampKit",
    index: 1,
    minutes: 2,
    connections: [],
    /* The three the chapter is made of — and where the first two are taken
       from, once the bench opens empty. */
    parts: ["board", "led", "resistor"],
    suggestion: "next",
  },
  {
    id: "lampSeat",
    index: 2,
    minutes: 4,
    connections: ["bl.c.cathode"],
    suggestion: "verify",
  },
  {
    id: "lampResistor",
    index: 3,
    minutes: 5,
    hasAside: true,
    connections: ["bl.c.anode", "bl.c.pin"],
    suggestion: "verify",
  },
  {
    id: "lampUpload",
    index: 4,
    minutes: 4,
    connections: [],
    suggestion: "runTest",
  },
];

/**
 * Chapter two · three lamps, one breadboard, four cables.
 *
 * Five steps, and the shape of them is the chapter's argument: the red lamp
 * gets a step to itself and the other two share one. Three lamp steps would
 * have been the same screen printed three times; one lamp step would have left
 * the idea the chapter exists for — a column of five holes is one piece of
 * metal, so the row does not matter — with nowhere to be said. So the aside
 * hangs on `tlRed`, where a person is doing it for the first time.
 *
 * Ground comes before any lamp because the `−` rail is dead metal until a
 * cable reaches GND, and all three lamps hang off it.
 *
 * 2 + 3 + 6 + 6 + 3 = 20 minutes across five steps, which is exactly what
 * `catalog.trafficLight` promises on the card before anyone opens it.
 *
 * The three lists of connections are disjoint by part — `wire.gnd`, then the
 * red group, then the other two lamps — so a stray that `verifyStep`
 * attributes to one step can never retroactively un-tick a neighbour's.
 */
export const trafficSteps: BuildStepDef[] = [
  {
    id: "tlKit",
    index: 1,
    minutes: 2,
    connections: [],
    /* Five kinds of part, ten objects, and not one of them derivable: a step
       that owns no connection derives no kit list, and the board and the
       breadboard are never derivable at all — `partOf` returns null for
       `board.` and `bb.` on purpose. */
    parts: ["board", "breadboard", "led", "resistor", "jumper"],
    suggestion: "next",
  },
  {
    id: "tlGround",
    index: 2,
    minutes: 3,
    connections: ["tl.c.gnd.pin", "tl.c.gnd.rail"],
    suggestion: "verify",
  },
  {
    id: "tlRed",
    index: 3,
    minutes: 6,
    /* The aside is the chapter: why the LED's leg in F7 and the resistor's
       lead in J7 are already joined. */
    hasAside: true,
    connections: [
      "tl.c.red.cathode",
      "tl.c.red.anode",
      "tl.c.red.resin",
      "tl.c.red.resout",
      "tl.c.red.row",
      "tl.c.red.pin",
    ],
    suggestion: "verify",
  },
  {
    id: "tlOthers",
    index: 4,
    minutes: 6,
    /* Twice what `tlRed` asks for, in half again the time: by here it is the
       same twelve gestures with the columns moved along. */
    connections: [
      "tl.c.yellow.cathode",
      "tl.c.yellow.anode",
      "tl.c.yellow.resin",
      "tl.c.yellow.resout",
      "tl.c.yellow.row",
      "tl.c.yellow.pin",
      "tl.c.green.cathode",
      "tl.c.green.anode",
      "tl.c.green.resin",
      "tl.c.green.resout",
      "tl.c.green.row",
      "tl.c.green.pin",
    ],
    suggestion: "verify",
  },
  {
    id: "tlUpload",
    index: 5,
    minutes: 3,
    connections: [],
    suggestion: "runTest",
  },
];

/**
 * Chapter three · a lamp that waits, and the first live power rail.
 *
 * Five steps, and the cut is the chapter's argument. Power comes first and
 * alone, because two dead rails are the state the bench opens in and nothing
 * else can be done until they are not — and because a cable leaving the board's
 * *other* header is new here, which is worth a step rather than a clause. The
 * sensor gets the aside: `mnlSensor` is where a person meets a pin the sketch
 * READS, and where the difference between that and every pin in the two
 * chapters before it can be said.
 *
 * The lamp comes last and takes the longest, and that is not a mistake in the
 * ordering: it is chapter two's lamp group done once, from memory, and eight
 * minutes is what it takes when nobody is being told where the columns are.
 *
 * 2 + 4 + 7 + 8 + 4 = 25 minutes across five steps, which is exactly what
 * `catalog.motionNightLight` promises on the card before anyone opens it.
 *
 * The four lists of connections are disjoint by part, so a stray that
 * `verifyStep` attributes to one step can never retroactively un-tick another.
 */
export const nightSteps: BuildStepDef[] = [
  {
    id: "mnlKit",
    index: 1,
    minutes: 2,
    connections: [],
    /* Six kinds of part, seven objects, and not one of them derivable: a step
       that owns no connection derives no kit list, and the board and the
       breadboard are never derivable at all — `partOf` returns null for
       `board.` and `bb.` on purpose. */
    parts: ["board", "breadboard", "sensorMotion", "led", "resistor", "jumper"],
    suggestion: "next",
  },
  {
    id: "mnlPower",
    index: 2,
    minutes: 4,
    connections: [
      "mnl.c.power.pin",
      "mnl.c.power.rail",
      "mnl.c.ground.pin",
      "mnl.c.ground.rail",
    ],
    suggestion: "verify",
  },
  {
    id: "mnlSensor",
    index: 3,
    minutes: 7,
    /* The aside is the chapter: a pin the sketch reads is not the same kind of
       thing as a pin it writes, and the sensor decides what is on it. */
    hasAside: true,
    connections: [
      "mnl.c.pir.vcc",
      "mnl.c.pir.gnd",
      "mnl.c.pir.out",
      "mnl.c.signal.row",
      "mnl.c.signal.pin",
    ],
    suggestion: "verify",
  },
  {
    id: "mnlLamp",
    index: 4,
    minutes: 8,
    connections: [
      "mnl.c.led.cathode",
      "mnl.c.led.anode",
      "mnl.c.res.in",
      "mnl.c.res.out",
      "mnl.c.lamp.row",
      "mnl.c.lamp.pin",
    ],
    suggestion: "verify",
  },
  {
    id: "mnlUpload",
    index: 5,
    minutes: 4,
    connections: [],
    suggestion: "runTest",
  },
];

/**
 * Chapter four · a pin that answers with a number, and a value you choose.
 *
 * Six steps, and the fifth is the one no chapter has had before: it owns no
 * connection at all, because what it asks for is not a join. Watching the
 * reading fall as the soil dries and picking the number in between is the whole
 * of `thresholds`, and it happens with the wiring already finished and nothing
 * on the bench to move. A step that owns no connection is a step `verifyStep`
 * cannot fail, which is right — there is nothing here to get wrong, only
 * something to decide.
 *
 * The aside hangs on `pgProbe`, which is where a person first puts a lead in a
 * hole marked `A`. That is the chapter, and it is invisible: `A0` and `D2` are
 * the same size, the same brass and the same distance apart.
 *
 * 3 + 4 + 7 + 7 + 6 + 8 = 35 minutes across six steps, which is exactly what
 * `catalog.plantGuardian` promises on the card before anyone opens it.
 */
export const plantSteps: BuildStepDef[] = [
  {
    id: "pgKit",
    index: 1,
    minutes: 3,
    connections: [],
    parts: ["board", "breadboard", "sensorMoisture", "led", "resistor", "jumper"],
    suggestion: "next",
  },
  {
    id: "pgPower",
    index: 2,
    minutes: 4,
    connections: [
      "pg.c.power.pin",
      "pg.c.power.rail",
      "pg.c.ground.pin",
      "pg.c.ground.rail",
    ],
    suggestion: "verify",
  },
  {
    id: "pgProbe",
    index: 3,
    minutes: 7,
    hasAside: true,
    connections: [
      "pg.c.probe.vcc",
      "pg.c.probe.gnd",
      "pg.c.probe.aout",
      "pg.c.signal.row",
      "pg.c.signal.pin",
    ],
    suggestion: "verify",
  },
  {
    id: "pgLamp",
    index: 4,
    minutes: 7,
    connections: [
      "pg.c.led.cathode",
      "pg.c.led.anode",
      "pg.c.res.in",
      "pg.c.res.out",
      "pg.c.lamp.row",
      "pg.c.lamp.pin",
    ],
    suggestion: "verify",
  },
  {
    id: "pgSketch",
    index: 5,
    minutes: 6,
    /* No connection, deliberately: see the note above. The rail falls back to
       the whole build's kit rows here, which is the right answer for a step
       whose subject is a number rather than a part. */
    connections: [],
    suggestion: "next",
  },
  {
    id: "pgUpload",
    index: 6,
    minutes: 8,
    connections: [],
    suggestion: "runTest",
  },
];

/**
 * Chapter five · two pins that work as a pair, and something that moves.
 *
 * Six steps, and two of them are new kinds of thing. `tsdSensor` is the first
 * time a single measurement is spread across two pins — the board writes one
 * and reads the other, and neither works without the other, which is what the
 * aside is for. `tsdServo` is the first step in a build somebody assembles that
 * also asserts how a part is MOUNTED (`checksMechanical`): on this bench the
 * horn cannot be put on crooked, so what the assertion says is that a build
 * wired right has a horn that is where the sketch thinks it is.
 *
 * The lamp is last and takes the least new time of the three wiring steps. By
 * here it is the fourth time somebody has built it.
 *
 * 3 + 4 + 8 + 8 + 7 + 10 = 40 minutes across six steps, which is exactly what
 * `catalog.touchlessSoapDispenser` promises on the card.
 */
export const soapSteps: BuildStepDef[] = [
  {
    id: "tsdKit",
    index: 1,
    minutes: 3,
    connections: [],
    parts: [
      "board",
      "breadboard",
      "sensor",
      "servo",
      "led",
      "resistor",
      "jumper",
    ],
    suggestion: "next",
  },
  {
    id: "tsdPower",
    index: 2,
    minutes: 4,
    connections: [
      "tsd.c.power.pin",
      "tsd.c.power.rail",
      "tsd.c.ground.pin",
      "tsd.c.ground.rail",
    ],
    suggestion: "verify",
  },
  {
    id: "tsdSensor",
    index: 3,
    minutes: 8,
    /* The aside is the chapter's name: how two pins measure a distance. */
    hasAside: true,
    connections: [
      "tsd.c.sensor.vcc",
      "tsd.c.sensor.gnd",
      "tsd.c.sensor.trig",
      "tsd.c.sensor.echo",
    ],
    suggestion: "verify",
  },
  {
    id: "tsdServo",
    index: 4,
    minutes: 8,
    connections: [
      "tsd.c.servo.power",
      "tsd.c.servo.ground",
      "tsd.c.servo.signal",
    ],
    /* The first assembled chapter to claim it. See the note above, and
       `soapAtRest`: the two angles are equal on this bench, so what this
       asserts is that they stay that way. */
    checksMechanical: true,
    suggestion: "verify",
  },
  {
    id: "tsdLamp",
    index: 5,
    minutes: 7,
    connections: [
      "tsd.c.led.cathode",
      "tsd.c.led.anode",
      "tsd.c.res.in",
      "tsd.c.res.out",
      "tsd.c.lamp.row",
      "tsd.c.lamp.pin",
    ],
    suggestion: "verify",
  },
  {
    id: "tsdUpload",
    index: 6,
    minutes: 10,
    connections: [],
    suggestion: "runTest",
  },
];

/** Every step there is. Safe to search by id or by connection: both are
 *  unique across builds, which is the rule that keeps this list usable. */
const allSteps: BuildStepDef[] = [
  ...barrierSteps,
  ...lampSteps,
  ...trafficSteps,
  ...nightSteps,
  ...plantSteps,
  ...soapSteps,
];

/**
 * The ids, for the one caller that has to hand the browser a closed set.
 *
 * `navigate_build_step`'s JSON schema used to list them by hand, and it listed
 * the capstone's seven — so an agent on chapter one's bench could not name a
 * step of the build it was standing on. A schema is a second copy of this
 * array or it is derived from it; this is the derivation.
 */
export const allStepIds: StepId[] = allSteps.map((step) => step.id);

/** Every build's list, in one place, because more than one thing searches them. */
const stepLists: BuildStepDef[][] = [
  barrierSteps,
  lampSteps,
  trafficSteps,
  nightSteps,
  plantSteps,
  soapSteps,
];

/**
 * The ordered list the given step belongs to.
 *
 * A search, and it has to be one. This was
 * `lampSteps.some(...) ? lampSteps : barrierSteps` — a two-way question with
 * the capstone as its else, which reads as a default and is really a wrong
 * answer waiting for a third build. Chapter two's ids typecheck against that
 * ternary perfectly and every one of them would have been handed the barrier's
 * list: a seven-stop rail, `of 7` in the topbar, `nextStep` walking into
 * chapter six, and `schemaFactsFor` publishing the barrier's step ids to an
 * agent standing on the traffic light. Nothing would have failed; the product
 * would just have been describing a different build.
 *
 * The `??` is unreachable while every member of `StepId` is in a list above —
 * `find` simply cannot say so, and a throw here would take down a rail over an
 * id a caller could not have.
 */
export function stepsOwning(id: StepId): BuildStepDef[] {
  return (
    stepLists.find((list) => list.some((step) => step.id === id)) ?? barrierSteps
  );
}

/** How many steps the build containing this one has — the `of 7` in `3 of 7`. */
export function stepTotalFor(id: StepId): number {
  return stepsOwning(id).length;
}

export function stepById(id: StepId): BuildStepDef {
  const found = allSteps.find((step) => step.id === id);
  if (!found) throw new Error(`Unknown build step: ${id}`);
  return found;
}

/** The step after this one, or `null` at the end of the build. */
export function nextStep(id: StepId): BuildStepDef | null {
  return stepsOwning(id)[stepById(id).index] ?? null;
}

/** Which step owns a connection, whichever build it belongs to. */
export function stepOwning(connectionId: string): BuildStepDef | undefined {
  return allSteps.find((step) => step.connections.includes(connectionId));
}

/** The step in this build that also checks how a part is mounted, if any. */
export function mechanicalStep(activeStepId: StepId): BuildStepDef | undefined {
  return stepsOwning(activeStepId).find((step) => step.checksMechanical);
}

/**
 * Which connections `inspect_build` should compare, for a given scope.
 * `undefined` means every expected connection — what `diff()` does with no
 * `within` list.
 */
export function scopeConnections(
  scope: InspectionScope,
  activeStepId: StepId,
): Connection["id"][] | undefined {
  if (scope === "mechanical") return [];
  if (scope === "current_step") return stepById(activeStepId).connections;
  return undefined;
}

/**
 * Which **kinds** of finding a scope asks for.
 *
 * The half of scoping that did not exist. `scopeConnections` narrows *where* to
 * look and every scope then reported everything it found there, so `wiring`
 * answered with parts still in the kit and `placement` had no way to be asked
 * at all. Written as the set a scope admits, so a kind added later has to be
 * placed deliberately rather than leaking into every answer.
 */
export function scopeKinds(scope: InspectionScope): {
  wiring: boolean;
  placement: boolean;
  mechanical: boolean;
} {
  switch (scope) {
    case "wiring":
      return { wiring: true, placement: false, mechanical: false };
    case "placement":
      return { wiring: false, placement: true, mechanical: false };
    case "mechanical":
      return { wiring: false, placement: false, mechanical: true };
    /* The step you are standing on, and the whole build: both mean everything
       that is true in range. A person asking "what is wrong here" is not asking
       a taxonomic question. */
    default:
      return { wiring: true, placement: true, mechanical: true };
  }
}

/** Whether a scope also asks about the servo horn. */
export function scopeChecksMechanical(
  scope: InspectionScope,
  activeStepId: StepId,
): boolean {
  if (scope === "mechanical" || scope === "all") return true;
  return scope === "current_step"
    ? Boolean(stepById(activeStepId).checksMechanical)
    : false;
}

/**
 * The single derivation of step status. Nothing else computes one.
 *
 * A step with something open against it reads `issue` whether or not it is the
 * step you are standing on — the rail has to be able to say "you left something
 * behind on step 3" while you are looking at step 4.
 */
export function toProgressSteps(
  copy: Copy,
  activeStepId: StepId,
  completed: readonly StepId[],
  blocked: readonly StepId[],
): BuildStep[] {
  const isBlocked = new Set(blocked);
  const isDone = new Set(completed);

  /* The rail shows the build the active step belongs to. Derived rather than
     passed, so a caller cannot hand in one build's steps and another build's
     active id and get a rail with nothing highlighted on it. */
  return stepsOwning(activeStepId).map((step) => ({
    id: step.id,
    name: copy.build.steps[step.id].name,
    minutes: step.minutes,
    status: isBlocked.has(step.id)
      ? "issue"
      : step.id === activeStepId
        ? "active"
        : isDone.has(step.id)
          ? "completed"
          : "upcoming",
  }));
}
