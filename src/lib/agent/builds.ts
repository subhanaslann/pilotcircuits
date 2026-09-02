import { diff, extras, type CircuitScene } from "@/lib/circuit/graph";
import {
  attach,
  partOf,
  shortedParts,
  type PlacementSpec,
} from "@/lib/circuit/placement";
import { PITCH } from "@/lib/circuit/geometry";
import { boxOf, frame } from "@/lib/circuit/wokwi";
import { stepsOwning, type StepId } from "@/lib/agent/steps";
import type { InspectionScope } from "@/lib/agent/model";
import {
  breathingLamp,
  lampBoardAt,
  lampBoxesFor,
  lampEmpty,
  lampFitBox,
  lampPlacement,
  lampSceneFrom,
} from "@/lib/circuit/breathing-lamp";
import {
  lightBoardAt,
  lightBoxesFor,
  lightEmpty,
  lightFitBox,
  lightPlacement,
  lightSceneFrom,
  trafficLight,
} from "@/lib/circuit/traffic-light";
import {
  motionNightLight,
  nightBoardAt,
  nightBoxesFor,
  nightEmpty,
  nightFitBox,
  nightPlacement,
  nightSceneFrom,
} from "@/lib/circuit/motion-night-light";
import {
  plantBoardAt,
  plantBoxesFor,
  plantEmpty,
  plantFitBox,
  plantGuardian,
  plantPlacement,
  plantSceneFrom,
} from "@/lib/circuit/plant-guardian";
import {
  soapBoardAt,
  soapBoxesFor,
  soapEmpty,
  soapFitBox,
  soapPlacement,
  soapSceneFrom,
  touchlessSoap,
} from "@/lib/circuit/touchless-soap";
import {
  smartParkingBarrier,
  withEchoFixed,
  withServoRemounted,
} from "@/lib/circuit/smart-parking-barrier";
import {
  isReady,
  projectBySlug,
  projects,
  type ProjectId,
} from "@/lib/projects/catalog";
import {
  barrierRun,
  lampRun,
  nightRun,
  plantRun,
  soapRun,
  trafficRun,
  type RunSpec,
} from "@/lib/device/run-spec";

/**
 * A rectangle in scene units.
 *
 * Written out here rather than imported from a chapter: every build that draws
 * one declares its own, they are the same four numbers, and the registry only
 * ever needs the shape. Importing chapter one's would make the row that
 * describes chapter two depend on chapter one for the meaning of `width`.
 */
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Which builds have a bench.
 *
 * Until now there was one and it was imported by name in six places, so the
 * workbench was the parking barrier's workbench and the `[slug]` in its URL was
 * decoration. This is the seam that stops that being true: a build is a row
 * here, and everything downstream — the session's opening state, the reference
 * the compare view draws, the route guard, the workspace's call to action —
 * reads the row rather than the barrier.
 *
 * All six chapters have a row today, so nothing in the product is a `preview`
 * and every route below is reachable. The rule is kept for the seventh: a
 * chapter with no row is a `preview`, which is the same fact `catalog.ts`
 * states with `status`, and the two have to agree — a `ready` chapter with no
 * row is a 404 behind a live-looking button, and a row on a `preview` chapter
 * is a bench nothing offers. The catalogue cannot import this file (this one
 * imports it), so the check runs the other way round, below, and throws in
 * development rather than waiting to be found.
 */
export interface BuildDef {
  projectId: ProjectId;
  /** The opening state, faults and all — the first frame of the demo. */
  scene: CircuitScene;
  /** The finished build: what the sketch defines, every fault corrected. */
  reference: CircuitScene;
  /**
   * Where the build opens — for the person, on every chapter.
   *
   * Every row here is step one with nothing ticked, the capstone included.
   * It used to be the exception: it opened *on* the step that carries the
   * fault with the two before it already ticked, because the first thing a
   * film has to show is the agent noticing something rather than two steps of
   * laying parts out. But the film is the entry screen and the design lab,
   * not the chapter — and a person pressing `Start building` on chapter six
   * was dropped into the middle of a rail whose top they had never seen, with
   * two steps ticked that they had not done. So the demo surfaces ask for
   * that opening by name (`demoStart`, below) and a chapter starts where a
   * chapter starts.
   */
  activeStepId: StepId;
  completedSteps: StepId[];
  /**
   * What running this build does — the checks it makes and the beats it plays.
   *
   * The last per-build fact that was still written into a handler. Chapter one
   * reported a distance reading and a servo sweep because `run_functional_test`
   * held the capstone's three rows; now the build says what its own test is,
   * the same way it already says what its scene and its steps are. Chapter two
   * is a row here, not an edit to a tool.
   */
  run: RunSpec;
  /**
   * Whether the person builds this one themselves.
   *
   * Present, the scene is a function of where the parts are and the bench can
   * be handed over empty. That is the five assembled chapters. Absent, the
   * build is laid out by the author exactly as it always was — which is
   * chapter six, and a decision rather than a queue: the capstone is the film,
   * and its bench is the one nothing on this side may move. The absence is also
   * what keeps it byte-for-byte unchanged through every shared edit, rather
   * than relying on anybody remembering not to touch it.
   */
  placement?: PlacementSpec;
  /**
   * What `fitView` frames, and what a briefing stages inside.
   *
   * A constant per build and never derived from the live placement:
   * `fitView`'s memo depends on this box, so a box that moved with the parts
   * would frame a different thing before and after every drop —
   * `breathing-lamp.ts` records that in full beside `lampFitBox`. The box is
   * the extent of every position the model can produce, not of the finished
   * build, which is why it is computed there and only referenced here.
   *
   * Absent means the whole desk, which is right for a build laid out to fill
   * it: the barrier's six parts are the reason the scene is 1200 x 820.
   */
  fitBox?: Box;
  /**
   * W-07 · where this build's parts are, for a vision result to outline.
   *
   * A function of the scene, because on a bench the person builds there is no
   * such thing as where a part is until they put it somewhere — an **absent
   * key** is what "still in the kit" looks like to the drawing, and both the
   * overlay and the scene view rely on that rather than on a box at (0,0).
   *
   * Absent means the static `partBox` in `geometry.ts`, which is the truth for
   * a build nobody moves. This and `fitBox` both lived in components as
   * `projectId === "breathingLamp" ? … : …` — a two-armed answer to a
   * six-chapter question, and the second chapter with a bench was where that
   * stopped being harmless. Five chapters answer it now. They are facts about
   * the build, so they are on the row.
   */
  boxesFor?: (scene: CircuitScene) => Record<string, Box>;
}

export const builds: Partial<Record<ProjectId, BuildDef>> = {
  breathingLamp: {
    projectId: "breathingLamp",
    placement: lampPlacement,
    /**
     * The bench opens **empty**, on step one, with nothing ticked.
     *
     * It used to open on the step that carried the fault, and the note that
     * said why is worth answering rather than deleting: *"the first thing the
     * product has to show is the agent noticing something — not two steps of
     * laying parts out."* That was written for a film with no briefing. The
     * briefing is now those two steps, done better — and it ends with `Başla`,
     * which cannot honestly hand over a build that is already three quarters
     * finished with two steps ticked that nobody did.
     *
     * `reference` is what the sketch defines, and it is derived from the
     * complete placement rather than from the scene. Derived from the scene it
     * would now be empty, and the compare view — which on an empty bench is
     * the most useful it has ever been in this chapter, drawing the whole
     * finished lamp as the route not yet taken — would draw nothing at all.
     */
    scene: lampSceneFrom(lampEmpty),
    reference: breathingLamp,
    activeStepId: "lampKit",
    completedSteps: [],
    run: lampRun,
    fitBox: lampFitBox,
    boxesFor: lampBoxesFor,
  },
  trafficLight: {
    projectId: "trafficLight",
    placement: lightPlacement,
    /**
     * Chapter one's opening, for chapter one's reason: **empty**, on step one,
     * nothing ticked. The briefing ends on `Başla`, and `Başla` cannot
     * honestly hand over a build that is already made.
     *
     * `reference` is the finished traffic light, derived from the complete
     * placement and never from `scene`. Derived from the scene it would be
     * empty, and on this chapter the compare view is at its most useful
     * exactly then — twenty joins nobody has made yet, drawn as the route.
     */
    scene: lightSceneFrom(lightEmpty),
    reference: trafficLight,
    activeStepId: "tlKit",
    completedSteps: [],
    run: trafficRun,
    fitBox: lightFitBox,
    boxesFor: lightBoxesFor,
  },
  motionNightLight: {
    projectId: "motionNightLight",
    placement: nightPlacement,
    /**
     * Chapter one's opening, for chapter one's reason: **empty**, on step one,
     * nothing ticked. The briefing ends on `Başla`, and `Başla` cannot honestly
     * hand over a build that is already made.
     *
     * `reference` is the finished night light, derived from the complete
     * placement and never from `scene` — derived from the scene it would be
     * empty, and the compare view would draw nothing at all on the bench where
     * it is most useful.
     */
    scene: nightSceneFrom(nightEmpty),
    reference: motionNightLight,
    activeStepId: "mnlKit",
    completedSteps: [],
    run: nightRun,
    fitBox: nightFitBox,
    boxesFor: nightBoxesFor,
  },
  plantGuardian: {
    projectId: "plantGuardian",
    placement: plantPlacement,
    /** Empty, on step one, nothing ticked — every assembled chapter's opening. */
    scene: plantSceneFrom(plantEmpty),
    reference: plantGuardian,
    activeStepId: "pgKit",
    completedSteps: [],
    run: plantRun,
    fitBox: plantFitBox,
    boxesFor: plantBoxesFor,
  },
  touchlessSoapDispenser: {
    projectId: "touchlessSoapDispenser",
    placement: soapPlacement,
    /** Empty, on step one, nothing ticked — every assembled chapter's opening. */
    scene: soapSceneFrom(soapEmpty),
    reference: touchlessSoap,
    activeStepId: "tsdKit",
    completedSteps: [],
    run: soapRun,
    fitBox: soapFitBox,
    boxesFor: soapBoxesFor,
  },
  smartParkingBarrier: {
    projectId: "smartParkingBarrier",
    scene: smartParkingBarrier,
    reference: withServoRemounted(withEchoFixed(smartParkingBarrier)),
    /**
     * Step one, like every other chapter — and this is still the one bench the
     * author lays out: no kit, no placement spec, the build standing finished
     * with the Echo lead one hole from where the sketch reads it.
     *
     * So its first two steps are not an assembly it has quietly done for you.
     * They are what those two steps are on a bench that arrives built: count
     * the parts against the list, and learn where they sit before reading a
     * wire. The dictionary says exactly that (`build.steps.kit` / `.place`),
     * and those two ids belong to this chapter alone, so saying it costs no
     * other chapter a word.
     */
    activeStepId: "kit",
    completedSteps: [],
    run: barrierRun,
  },
};

/** The build a session starts on when nothing has said otherwise. */
export const defaultBuild = builds.smartParkingBarrier!;

/**
 * Where the demo surfaces stand this build up: mid-way, on the step its fault
 * is on.
 *
 * The entry screen and the design lab are not somebody's chapter — they are a
 * film of one running, and the first frame has to be a build with wiring in it
 * and something wrong with that wiring. Open them at step one and
 * `inspect_build` reads a step with no connections and finds nothing, which is
 * the one thing those screens exist to show.
 *
 * This is what the capstone's row used to say for everybody, which is how
 * opening the chapter came to drop a learner into the middle of it. The fact
 * belongs to the screens that want it, so they pass it themselves
 * (`useAgentSession({ start })`).
 */
export const demoStart: {
  activeStepId: StepId;
  completedSteps: StepId[];
} = { activeStepId: "sensor", completedSteps: ["kit", "place"] };

export function buildFor(projectId: ProjectId): BuildDef | undefined {
  return builds[projectId];
}

/** The route's way in: an unknown or benchless slug is `undefined`, not a throw. */
export function buildBySlug(slug: string): BuildDef | undefined {
  const project = projectBySlug(slug);
  return project ? builds[project.id] : undefined;
}

/**
 * Everything a JSON schema needs to describe **this** build to an agent.
 *
 * ## The bug this closes
 *
 * The schemas were written once, for the capstone, and handed to the browser on
 * every bench. Standing at chapter one an agent was offered `sensor`, `servo`
 * and `leds` as tests of a lamp, all seven of the barrier's step ids to
 * navigate to, and a `mechanical` inspection of a build with nothing that
 * turns. It then did exactly what it was told it could — which is not the
 * agent's mistake. **A schema that describes a different build than the one on
 * the page is a lie told in the machine-readable half of the product.**
 *
 * So the facts come from the row, and `webmcp.ts` shapes them. Nothing here
 * knows what JSON Schema looks like; nothing there knows what a build is.
 */
export interface BuildSchemaFacts {
  stepIds: string[];
  /** The checks this build's run makes, plus the whole run. */
  tests: string[];
  /** Empty on a build laid out by the author: it has no leads to move. */
  leads: string[];
  holes: string[];
  scopes: InspectionScope[];
  /**
   * Every named thing `point_at` can be asked about — parts, leads, board pins
   * and expected connections, in that order. Breadboard holes are accepted by
   * the tool and deliberately not here: see `subjectsOf`.
   */
  subjects: string[];
}

/**
 * What `point_at` can be asked about on this build, by family.
 *
 * Four lists and not one, because the refusal samples each family separately
 * — a caller that misspelt a part should be shown what a part id looks like,
 * not six leads — and `schemaFactsFor` flattens them into the published enum.
 *
 * Parts and leads come from the placement spec where there is one, in the
 * order the steps ask for them. The capstone has no spec — its parts are laid
 * out by the author and are not addressable as parts — but its terminals are
 * nodes of the reference scene, so they are offered as leads there and
 * resolved the same way. Pins are read from the reference scene rather than
 * the opening one because an assembled chapter opens with an empty bench; the
 * board is on it either way, so the two agree, and the reference is the one
 * that cannot be empty. Connections are the sketch's own ids.
 *
 * Breadboard holes are not a family: 216 of them already sit in
 * `attach_lead`'s enum, and an enum that long describes a breadboard rather
 * than a tool. The tool takes them anyway, and the argument's sentence says
 * so.
 */
export function subjectsOf(build: BuildDef): {
  parts: string[];
  leads: string[];
  pins: string[];
  connections: string[];
} {
  const nodes = Object.values(build.reference.nodes);
  return {
    parts: [...(build.placement?.parts ?? [])],
    leads: build.placement
      ? [...build.placement.terminals]
      : nodes.filter((n) => n.kind === "terminal").map((n) => n.id),
    pins: nodes.filter((n) => n.kind === "board-pin").map((n) => n.id),
    connections: build.reference.expected.map((c) => c.id),
  };
}

export function schemaFactsFor(
  projectId: ProjectId,
): BuildSchemaFacts | undefined {
  const build = builds[projectId];
  if (!build) return undefined;

  const steps = stepsOwning(build.activeStepId);
  const turns = steps.some((step) => step.checksMechanical);
  const subjects = subjectsOf(build);

  return {
    stepIds: steps.map((step) => step.id),
    tests: [...build.run.checks.map((check) => check.id), "full_system"],
    leads: [...(build.placement?.terminals ?? [])],
    holes: [...(build.placement?.holes ?? [])],
    /* A scope a build cannot honour is not offered: there is no `mechanical`
       on a build with nothing mounted, and no `placement` on one the author
       laid out. */
    scopes: [
      "current_step",
      "wiring",
      ...(build.placement ? (["placement"] as const) : []),
      ...(turns ? (["mechanical"] as const) : []),
      "all",
    ],
    subjects: [
      ...subjects.parts,
      ...subjects.leads,
      ...subjects.pins,
      ...subjects.connections,
    ],
  };
}

/** Whether a chapter has a bench to open. The one question the CTA asks. */
export function hasBench(projectId: ProjectId): boolean {
  return Boolean(builds[projectId]);
}

/* The two lists have to say the same thing. Development only: in production
   this is dead weight on a fact that cannot change at runtime. */
if (process.env.NODE_ENV !== "production") {
  /** Nothing a placement spec describes turns; one rest state does for all. */
  const atRest = { servoAngle: 0, expectedAngle: 0 };

  /**
   * A placement spec has to agree with the graph it produces.
   *
   * There are no test files anywhere in this repo, and a green typecheck proves
   * nothing about any of this: `Placement` is keyed by `string`, so every
   * constant checked below typechecks however it is spelled, and every way this
   * model can be wrong renders as a plausible-looking picture rather than as a
   * crash. This block, throwing at `next dev` boot, is the whole safety net.
   */
  for (const build of Object.values(builds)) {
    const spec = build?.placement;
    if (!spec) continue;

    const finished = spec.sceneFrom(spec.complete, atRest);

    /* A `complete` that does not satisfy the sketch means the person could
       build the thing correctly and still be told it is wrong. Stronger than it
       used to be, for free: with nothing manufactured by the drawing code, a
       `complete` that forgets a join now fails here instead of passing because
       the scene invented it. */
    const open = diff(finished).mismatches;
    if (open.length) {
      throw new Error(
        `${build.projectId}: the complete placement does not satisfy the sketch — ` +
          open.map((m) => m.expected.id).join(", "),
      );
    }

    /* A hole that is not a node is a seat nothing can be placed in and a
       `focus` that frames nothing. */
    const missing = spec.holes.filter((id) => !finished.nodes[id]);
    if (missing.length) {
      throw new Error(
        `${build.projectId}: holes with no node — ${missing.join(", ")}`,
      );
    }

    /* The assertion this entire change exists for. An empty bench draws
       nothing, so a join that appears because two parts happen to both be
       present shows up here as a connection nobody made. */
    const onEmpty = spec.sceneFrom(spec.empty, atRest).observed;
    if (onEmpty.length) {
      throw new Error(
        `${build.projectId}: an empty bench already draws ${onEmpty
          .map((c) => c.id)
          .join(", ")}`,
      );
    }

    /* Its converse, and it needs its own pass: `diff` enumerates `expected`, so
       a `complete` that makes one join too many satisfies every mismatch check
       above in silence. */
    const unasked = extras(finished);
    if (unasked.length) {
      throw new Error(
        `${build.projectId}: the complete placement makes a join the sketch does not ask for — ` +
          unasked.map((c) => c.id).join(", "),
      );
    }

    /* A part with both ends on one piece of metal. `diff` and `extras` are both
       blind to it — the rail is one node, so the loose end really is making the
       join the sketch asks for — so an author's `complete` that shorts a part
       passed every assertion above. */
    const shorted = shortedParts(spec, spec.complete);
    if (shorted.length) {
      throw new Error(
        `${build.projectId}: \`complete\` shorts a part — ` +
          shorted
            .map(
              (s) =>
                `${s.part} (${s.terminals[0]} in ${s.at[0]}, ${s.terminals[1]} in ${s.at[1]})`,
            )
            .join(", "),
      );
    }

    /* `empty` and `complete` are hand-written literals, spread from five other
       files, and the key type is `string` — a misspelled lead compiles, is
       ignored by `sceneFrom`, and draws an empty board. */
    for (const [name, record] of [
      ["empty", spec.empty],
      ["complete", spec.complete],
    ] as const) {
      const absent = spec.terminals.filter((id) => !(id in record));
      const stray = Object.keys(record).filter(
        (id) => !spec.terminals.includes(id),
      );
      if (absent.length || stray.length) {
        throw new Error(
          `${build.projectId}: \`${name}\` is not keyed by this build's leads — ` +
            [
              ...absent.map((id) => `missing ${id}`),
              ...stray.map((id) => `unknown ${id}`),
            ].join(", "),
        );
      }
    }

    /* A lead goes into a hole or onto a lead of a DIFFERENT part. `attach`
       refuses anything else on the write, but `complete` is written by hand and
       never passes through it. */
    for (const terminal of spec.terminals) {
      const target = spec.complete[terminal];
      if (!target) continue;
      const owner = partOf(spec, target);
      if (
        !spec.holes.includes(target) &&
        (owner === undefined || owner === partOf(spec, terminal))
      ) {
        throw new Error(
          `${build.projectId}: \`complete\` attaches ${terminal} to ${target}, which is neither a hole nor another part's lead`,
        );
      }
    }

    /* Every single-lead placement, and every join the model accepts, actually
       drawn. Two facts the type system cannot state and no check above reaches:
       a part held up by another part's lead must not reach the board, and a
       join must be long enough to read as a cable rather than as two points on
       top of each other.

       Chapter one is 4 leads x 15 holes = 60 scenes, plus the 4 joins `attach`
       accepts once the holding part is anchored at its own `anchorOf` hole. The
       other four cross-part pairs are refused because that anchoring lead is
       not free — a refusal is a legal answer here, not a case to work around,
       which is why the write is checked rather than assumed. 64 scenes, once,
       at boot.

       Five chapters run it now and the cost is the reason every breadboard
       chapter builds its node grid once at module scope and spreads it: this
       loop is the largest consumer of `sceneFrom` in the product, and a chapter
       that constructs its nodes per call pays for that decision here, once per
       lead per hole, before the first frame is drawn. Chapter two is 20 x 195 =
       3,900; chapter five is the biggest at 17 x 382 = 6,494. */
    for (const terminal of spec.terminals) {
      const part = partOf(spec, terminal);
      if (!part) {
        throw new Error(
          `${build.projectId}: ${terminal} is not a lead of any part, so nothing can position it`,
        );
      }

      for (const hole of spec.holes) {
        const seated = spec.sceneFrom(
          attach(spec, spec.empty, terminal, hole),
          atRest,
        );
        for (const node of Object.values(seated.nodes)) {
          if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) {
            throw new Error(
              `${build.projectId}: ${terminal} in ${hole} puts ${node.id} at (${node.x}, ${node.y})`,
            );
          }
        }
      }

      for (const lead of spec.terminals) {
        const holder = partOf(spec, lead);
        if (!holder || holder === part) continue;
        const anchor = spec.anchorOf[holder];
        const hole = spec.complete[anchor];
        if (!hole) continue;

        const placement = attach(
          spec,
          attach(spec, spec.empty, anchor, hole),
          terminal,
          lead,
        );
        /* `attach` returns the record unchanged when it refuses, so without
           this the loop would go on to assert things about a scene it did not
           build and report them against the pair it never made. */
        if (placement[terminal] !== lead) continue;
        const scene = spec.sceneFrom(placement, atRest);

        /* A part held up by another part's lead must not be drawn over the
           board, which is a fact about the *drawing* and so is asked per
           chapter. Two branches rather than one loop over `build.boxesFor`:
           the assertion needs the board's own top edge, and the only place
           that survives on the row is inside a `board` box that has already
           been padded by a pitch — reading it back out would quietly turn
           "over the board" into "over the board plus a pitch". */
        if (build.projectId === "breathingLamp") {
          const box = lampBoxesFor(scene)[part];
          if (box && box.y + box.height > lampBoardAt.y) {
            throw new Error(
              `${build.projectId}: ${part} anchored by a join is drawn over the board (${terminal} -> ${lead})`,
            );
          }
        }
        if (build.projectId === "trafficLight") {
          const box = lightBoxesFor(scene)[part];
          if (box && box.y + box.height > lightBoardAt.y) {
            throw new Error(
              `${build.projectId}: ${part} anchored by a join is drawn over the board (${terminal} -> ${lead})`,
            );
          }
        }
        if (build.projectId === "motionNightLight") {
          const box = nightBoxesFor(scene)[part];
          if (box && box.y + box.height > nightBoardAt.y) {
            throw new Error(
              `${build.projectId}: ${part} anchored by a join is drawn over the board (${terminal} -> ${lead})`,
            );
          }
        }
        if (build.projectId === "touchlessSoapDispenser") {
          const box = soapBoxesFor(scene)[part];
          if (box && box.y + box.height > soapBoardAt.y) {
            throw new Error(
              `${build.projectId}: ${part} anchored by a join is drawn over the board (${terminal} -> ${lead})`,
            );
          }
        }
        /* Chapter four's board is ABOVE its breadboard, so the test is the
           other way round: a hung part descends, and what it must not be drawn
           into is the board's BOTTOM edge.

           The edge is computed here rather than read back out of
           `plantBoxesFor(...).board`, for the reason the comment above states:
           that box has already been padded by a pitch, and reading it back
           would quietly turn "over the board" into "over the board plus a
           pitch". */
        if (build.projectId === "plantGuardian") {
          const box = plantBoxesFor(scene)[part];
          const boardBottom = plantBoardAt.y + boxOf(frame.uno).height;
          if (box && box.y < boardBottom) {
            throw new Error(
              `${build.projectId}: ${part} anchored by a join is drawn over the board (${terminal} -> ${lead})`,
            );
          }
        }

        const join = scene.observed.find((c) => c.from === terminal);
        const from = join && scene.nodes[join.from];
        const to = join && scene.nodes[join.to];
        if (from && to && Math.hypot(to.x - from.x, to.y - from.y) < PITCH) {
          throw new Error(
            `${build.projectId}: the join ${terminal} -> ${lead} is drawn shorter than a pitch`,
          );
        }
      }
    }
  }

  /* Chapter six, frozen.

     A shared change — a required `Connection.medium`, a renamed field, a
     different `diff` — reaches the capstone through the same types, and nothing
     else here would say so: the barrier has no placement, so every check above
     skips it, and that absence is the whole of its protection.

     It records what `smart-parking-barrier.ts` builds and nothing derived from
     it — no `diff`, no findings — so it is a fact about a file this work never
     opens, and it says the same thing whenever it was taken. Regenerate ONLY
     with an explicit decision to change chapter six. */
  const BARRIER_SNAPSHOT = `{"e":[{"id":"c.sensor.vcc","from":"sensor.vcc","to":"bb.pos4","role":"power","label":"5V"},{"id":"c.sensor.gnd","from":"sensor.gnd","to":"bb.neg4","role":"ground","label":"GND"},{"id":"c.sensor.trig","from":"sensor.trig","to":"board.D8","role":"signalAlt","label":"Trig → D8"},{"id":"c.sensor.echo","from":"sensor.echo","to":"board.D7","role":"signal","label":"Echo → D7"},{"id":"c.servo.signal","from":"servo.signal","to":"board.D9","role":"signalAlt","label":"SIG → D9"},{"id":"c.servo.power","from":"servo.power","to":"bb.pos20","role":"power"},{"id":"c.servo.gnd","from":"servo.ground","to":"bb.neg20","role":"ground"},{"id":"c.led.green","from":"led.green.anode","to":"board.D3","role":"signalAlt","label":"Green → D3"},{"id":"c.led.red","from":"led.red.anode","to":"board.D2","role":"signalAlt","label":"Red → D2"},{"id":"c.rail.pos","from":"board.5V","to":"bb.pos1","role":"power"},{"id":"c.rail.neg","from":"board.GND","to":"bb.neg1","role":"ground"}],"o":[{"id":"c.sensor.vcc","from":"sensor.vcc","to":"bb.pos4","role":"power","label":"5V"},{"id":"c.sensor.gnd","from":"sensor.gnd","to":"bb.neg4","role":"ground","label":"GND"},{"id":"c.sensor.trig","from":"sensor.trig","to":"board.D8","role":"signalAlt","label":"Trig → D8"},{"id":"c.sensor.echo","from":"sensor.echo","to":"board.D6","role":"signal","label":"Echo → D6"},{"id":"c.servo.signal","from":"servo.signal","to":"board.D9","role":"signalAlt","label":"SIG → D9"},{"id":"c.servo.power","from":"servo.power","to":"bb.pos20","role":"power"},{"id":"c.servo.gnd","from":"servo.ground","to":"bb.neg20","role":"ground"},{"id":"c.led.green","from":"led.green.anode","to":"board.D3","role":"signalAlt","label":"Green → D3"},{"id":"c.led.red","from":"led.red.anode","to":"board.D2","role":"signalAlt","label":"Red → D2"},{"id":"c.rail.pos","from":"board.5V","to":"bb.pos1","role":"power"},{"id":"c.rail.neg","from":"board.GND","to":"bb.neg1","role":"ground"}],"m":{"servoAngle":0,"expectedAngle":90}}`;
  const barrier = builds.smartParkingBarrier!.scene;
  if (
    JSON.stringify({
      e: barrier.expected,
      o: barrier.observed,
      m: barrier.mechanical,
    }) !== BARRIER_SNAPSHOT
  ) {
    throw new Error(
      "Chapter six's scene changed. This work must not touch it.",
    );
  }

  /* ...and where its pins ARE, which the topology above cannot say.

     `expected`, `observed` and `mechanical` are a list of names. Re-source the
     pin coordinates from a different table and every one of those names still
     matches while the drawing moves underneath them — which is exactly what
     happened when the barrier's runs were re-derived from the Wokwi tables:
     `board.D13` went from `layout.board.x + width - PITCH*1.5` to `560 +
     125·(25/24)`, two wire labels landed on top of each other, and this guard
     said nothing.

     Every pin of every drawn part, plus the six rail holes the build actually
     wires into. The other 354 breadboard holes are a pure `PITCH` grid off
     `layout.breadboard` with no part table behind them, and the rails that are
     used stand for the grid's origin and step. Rounded to four places because
     the coordinates are exact ratios and a float printed in full is a diff
     nobody can read. Regenerate ONLY with an explicit decision to move chapter
     six's parts. */
  const BARRIER_PINS =
    "bb.neg1=160,596.2992|bb.neg20=350,596.2992|bb.neg4=190,596.2992|bb.pos1=160,413.7008|bb.pos20=350,413.7008|bb.pos4=190,413.7008|board.3V3=716.25,639.4792|board.5V=726.6667,639.4792|board.D0=826.1458,449.375|board.D10=719.8958,449.375|board.D11=710,449.375|board.D12=700.1042,449.375|board.D13=690.2083,449.375|board.D1=816.25,449.375|board.D2=806.3542,449.375|board.D3=796.4583,449.375|board.D4=786.5625,449.375|board.D5=776.6667,449.375|board.D6=766.7708,449.375|board.D7=756.875,449.375|board.D8=740.2083,449.375|board.D9=729.7917,449.375|board.GND2=746.4583,639.4792|board.GND=736.5625,639.4792|board.VIN=756.3542,639.4792|led.green.anode=326.0417,513.75|led.green.cathode=315.625,513.75|led.red.anode=376.0417,513.75|led.red.cathode=365.625,513.75|sensor.echo=395.1042,348.4375|sensor.gnd=405.5208,348.4375|sensor.trig=384.6875,348.4375|sensor.vcc=374.2708,348.4375|servo.ground=610,282.0833|servo.power=610,291.9792|servo.signal=610,301.875";
  const wired = new Set(
    [...barrier.expected, ...barrier.observed].flatMap((c) => [c.from, c.to]),
  );
  const round = (v: number) => Number(v.toFixed(4));
  const pins = Object.values(barrier.nodes)
    .filter((n) => n.kind !== "breadboard-hole" || wired.has(n.id))
    .map((n) => `${n.id}=${round(n.x)},${round(n.y)}`)
    .sort()
    .join("|");
  if (pins !== BARRIER_PINS) {
    throw new Error(
      "Chapter six's pin coordinates moved. This work must not touch them.",
    );
  }

  const mismatched = projects.filter(
    (project) => isReady(project) !== hasBench(project.id),
  );
  if (mismatched.length) {
    throw new Error(
      "Catalogue and benches disagree: " +
        mismatched
          .map((p) => `${p.id} is ${p.status} but ${hasBench(p.id) ? "has" : "has no"} bench`)
          .join(", "),
    );
  }
}
