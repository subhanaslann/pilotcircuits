import type { Copy } from "@/content/i18n";
import { clockOf, summariseArgs, type ToolCall } from "@/lib/agent/activity";
import {
  deriveFindings,
  inspectionCovers,
  isResolved,
  verifyStep,
  type FindingId,
} from "@/lib/agent/findings";
import { say, type Line } from "@/lib/agent/line";
import type {
  AgentTool,
  CoachingLevel,
  InspectionScope,
} from "@/lib/agent/model";
import type { AgentSessionState, SessionPatch } from "@/lib/agent/session";
import {
  nextStep,
  stepById,
  stepWords,
  stepsOwning,
  type StepId,
} from "@/lib/agent/steps";
import { isServoAligned, maybeNode, type NodeId } from "@/lib/circuit/graph";
import { buildFor } from "@/lib/agent/builds";
import { placeIn } from "@/lib/agent/placement";
import { GRIP_AT, SEAT_AT } from "@/lib/agent/mascot";
import {
  isHole,
  partsInKit,
  type TerminalId,
} from "@/lib/circuit/placement";
import type { ProjectFilters } from "@/lib/projects/filter";

/**
 * Batch 4 · The six workbench tools.
 *
 * Each one is a plain async function of `(input, context)`. It reads the
 * session, waits out its own named phases, and returns three things: the
 * payload a caller gets back, the patch that lands in one commit, and the
 * effects that happen outside React state.
 *
 * Effects are **data, not calls**. A handler that reached for a canvas ref
 * would have to be a closure over React internals — untestable, and
 * un-callable from the WebMCP callback the browser invokes in Batch 7. As data,
 * the handler stays pure and the applier is one switch statement.
 *
 * The latency is real and deliberate. It is not animation, and reduced motion
 * must not remove it: a tool that lands instantly gives the user nothing to
 * read, and rule 6 says a change nobody sees did not happen.
 */

export type ToastTone = "info" | "success" | "warning" | "error";

/**
 * One line of `run_functional_test`'s report.
 *
 * `detail` is what the board measured — `18 cm`, `0° → 90°` — so it is never
 * translated (rule 13). It is also only shown on a check that passed: in
 * `StepLoader` a detail takes the place of the state word, and a failed row
 * has to keep saying `Failed` (rule 9).
 */
export interface TestCheck {
  /**
   * Which check this is — a `CheckSpec.id` from the build's own run.
   *
   * A string rather than the capstone's three, because the set is per build:
   * chapter one checks its wiring and whether the lamp can breathe, and it has
   * neither a sensor nor a servo to report on.
   */
  subject: string;
  passed: boolean;
  detail: string;
}

export type SessionEffect =
  | { kind: "focus"; nodes: NodeId[]; padding: number; scale?: number }
  | { kind: "fitView" }
  /** C-22 · run the green pulse along these connections. */
  | { kind: "trace"; connectionIds: string[] }
  /**
   * C-23 · D-01…D-06 · play the functional test.
   *
   * One effect, two readings: the canvas draws the run as theatre and the dock
   * prints it as numbers. It carries the per-check results because the dock
   * has to show *which* check failed while the sequence is still playing —
   * waiting for the tool's return value would put the rows a beat behind the
   * car.
   *
   * Emitted whether the test passes or fails. It used to fire only on success,
   * which left the product's default scenario — a servo horn a quarter turn
   * out — with nothing on the canvas and nothing in the dock. Rule 6: a change
   * nobody sees did not happen.
   */
  | {
      kind: "runTest";
      results: TestCheck[];
      /** Every row this build's run has, in order — including any not asked for. */
      checks: string[];
    }
  /**
   * Batch 8 · move the person to another route.
   *
   * The library's `open_project` and `start_project` change which screen you
   * are looking at, and a handler that reached for `useRouter` would be a
   * handler that could only ever run inside a component — the one thing this
   * file has avoided since Batch 4. So navigation is data too, and the applier
   * is one more case in the same switch.
   */
  | { kind: "navigate"; href: string }
  /**
   * Batch 8 · narrow the library, visibly.
   *
   * `find_projects` could answer from `filterProjects()` without touching the
   * screen, and the person would then watch an agent claim to have searched
   * while the toolbar sat unchanged. Rule 6: a change nobody sees did not
   * happen. The tool moves the same control the user moves.
   */
  | { kind: "filters"; next: ProjectFilters }
  | { kind: "toast"; tone: ToastTone; message: string };

export interface ToolContext {
  /** Live read — a handler never holds its own copy of the state. */
  read: () => AgentSessionState;
  /** The reader's dictionary. Every sentence a tool produces comes from it. */
  copy: Copy;
  /**
   * Batch 8 · the reader's locale.
   *
   * Needed by exactly one caller — the library search folds case with it, and
   * `İstasyon` folds differently under Turkish rules than invariant ones. It is
   * on the shared context rather than a second argument because a handler
   * should not have to know whether it is the one that cares.
   */
  locale: string;
  /** Announces a phase and waits it out. The simulated latency lives here. */
  phase: (note: Line, ms: number) => Promise<void>;
}

export interface ToolOutcome {
  status: "ok" | "error";
  /** Serialisable: what a caller gets, and what `Raw result` renders. */
  result?: unknown;
  errorMessage?: Line;
  /** Everything the call changed, committed with its activity entry. */
  patch?: SessionPatch;
  /**
   * Whether the patch is a **gesture on the bench** rather than a reading.
   *
   * Set, the runner lands it through `commit` instead of folding it into the
   * entry — which is what puts it on the undo stack. The person has to be able
   * to take back something an agent did to their build with the same keypress
   * they take back their own mistakes; an agent's write that cannot be undone
   * is a worse affordance than no write at all.
   */
  commits?: boolean;
  /** A sub-line under the call: what it did. */
  outcome?: Line;
  /** A separate entry: what it found. An outcome is not a call of its own. */
  note?: { headline: Line; tone?: "found" | "passed" | "failed" };
  effects?: SessionEffect[];
}

export interface ToolInputs {
  get_build_context: Record<string, never>;
  inspect_build: { scope?: InspectionScope };
  show_correction: { finding_id: FindingId; detail_level?: CoachingLevel };
  attach_lead: { lead: TerminalId; target?: NodeId | null };
  verify_current_step: Record<string, never>;
  navigate_build_step: { step_id: StepId };
  run_functional_test: { test: string };
}

/* --- Timing --------------------------------------------------------------
   Deterministic, never random: the demo has to be repeatable to be filmed.
   No phase runs long enough for the panel to look stuck.                    */

/* --- Projections ---------------------------------------------------------
   `get_build_context` answers from the same graph the canvas draws from.
   In the reader's language: an agent asked to explain the build to the person
   in front of it should be handed the same words they can see.              */

function summarise(state: AgentSessionState, copy: Copy) {
  const step = stepById(state.activeStepId);
  const words = stepWords(copy, step.id);
  return {
    /**
     * The build on the bench, not `copy.build.project`.
     *
     * That key is a single string — the capstone's name — so an agent standing
     * at chapter one was told it was looking at the Smart Parking Barrier while
     * every connection it read belonged to a breathing lamp. A per-build fact
     * in a global place, the same mistake this file has now made three times;
     * the catalogue names every chapter and is the only thing that should.
     */
    projectId: state.projectId,
    project: copy.projects[state.projectId].name,
    /**
     * How many gestures on this bench the agent made.
     *
     * Reported so that an agent asked to help can tell the difference between a
     * build somebody is making and one it made itself — and so that nothing
     * downstream has to infer it. See `AgentSessionState.assistedEdits`.
     */
    assistedEdits: state.assistedEdits,
    activeStep: {
      id: step.id,
      index: step.index,
      name: words.name,
      instruction: words.instruction,
    },
    expectedConnections: state.scene.expected.map(
      (c) => `${c.from} -> ${c.to}`,
    ),
    observedConnections: state.scene.observed.map(
      (c) => `${c.from} -> ${c.to}`,
    ),
    mechanical: {
      servoAngle: state.scene.mechanical.servoAngle,
      expectedAngle: state.scene.mechanical.expectedAngle,
      aligned: isServoAligned(state.scene),
    },
    openFindings: state.findings.filter((f) => !isResolved(f, state.scene))
      .length,
    /**
     * Where the parts are, on a build the person assembles.
     *
     * The gap this closes was the loudest one in the whole surface: an agent
     * standing at chapter one's empty bench could read every expected and
     * observed connection and still had no way to learn that the LED was in
     * the box — `observed` is empty either way, and a part with no leads on
     * the bench has no nodes to appear in it. It could describe a build it
     * could not see.
     *
     * `null` on a build laid out by the author, which is the honest answer:
     * there is no kit and nothing to place, and an empty object here would
     * read as a bench with everything still in it.
     */
    placement: placementOf(state),
    /* Never hidden. The interface does not pretend to be real hardware. */
    source: "demo",
  };
}

/** What `attach_lead` may be asked for, in the names it must be asked in. */
function placementOf(state: AgentSessionState) {
  const spec = buildFor(state.projectId)?.placement;
  if (!spec) return null;

  const inKit = partsInKit(spec, state.placement);
  return {
    parts: spec.parts.map((part) => ({
      id: part,
      component: spec.componentOf[part],
      onBench: !inKit.includes(part),
    })),
    /* Every lead and what it is holding on to — a hole, another lead, or
       nothing. This is the map `attach_lead` is read against. */
    leads: Object.fromEntries(
      spec.terminals.map((id) => [id, state.placement[id] ?? null]),
    ),
    /** Every hole a lead may go into, in the order they read on the board. */
    holes: spec.holes,
  };
}

/**
 * What was found, named honestly: a servo a quarter turn out is not a wire, and
 * a join the sketch never named is not a mismatch either — calling it one sends
 * the person looking for the line about it that the sketch does not have. Only
 * a set that is all of one kind gets that kind's sentence; anything mixed falls
 * back to the count of issues, which is true of every set.
 */
function foundLine(found: { type: string }[]): Line {
  const all = (type: string) => found.every((f) => f.type === type);
  /* A part still in the box is not a connection in the wrong hole either, and
     it was being counted as one: an empty bench reported `1 connection
     mismatch found` over a finding whose own sentence says the LED has not
     been placed. Wiring is what is left once the two named kinds are out. */
  const allWiring = found.every(
    (f) => f.type !== "mechanical-alignment" && f.type !== "part-not-placed",
  );
  return {
    ns: "activity",
    k: all("unexpected-connection")
      ? "extrasFound"
      : all("part-not-placed")
        ? "partsMissing"
        : allWiring
          ? "mismatchFound"
          : "issuesFound",
    args: [found.length],
  };
}

/* --- The handlers -------------------------------------------------------- */

/**
 * Annotated rather than `satisfies`: the annotation widens every return to
 * `ToolOutcome`, so the runner can read `patch`, `note` and `effects` off any
 * handler without narrowing per tool.
 */
type ToolHandlers = {
  [K in keyof ToolInputs]: (
    input: ToolInputs[K],
    ctx: ToolContext,
  ) => Promise<ToolOutcome>;
};

export const handlers: ToolHandlers = {
  async get_build_context(_input, ctx) {
    await ctx.phase({ ns: "phases", k: "readingContext" }, 420);
    return { status: "ok", result: summarise(ctx.read(), ctx.copy) };
  },

  async inspect_build({ scope = "current_step" }, ctx) {
    const state = ctx.read();
    const copy = ctx.copy;
    const step = stepById(state.activeStepId);

    await ctx.phase({ ns: "phases", k: "readingWiring" }, 380);
    await ctx.phase({ ns: "phases", k: "comparingSketch" }, 520);
    if (scope === "mechanical" || scope === "all" || step.checksMechanical) {
      await ctx.phase({ ns: "phases", k: "checkingAlignment" }, 340);
    }

    const found = deriveFindings(
      state.scene,
      scope,
      state.activeStepId,
      Date.now(),
    );

    /* What this inspection did not look at, and which is still true. An id an
       agent is holding stays valid for as long as the thing it names is. */
    const kept = state.findings.filter(
      (finding) =>
        !isResolved(finding, state.scene) &&
        !inspectionCovers(finding, scope, state.activeStepId) &&
        !found.some((fresh) => fresh.id === finding.id),
    );

    return {
      status: "ok",
      result: {
        scope,
        /* Structure, not sentences: what a caller — and Batch 7's WebMCP
           consumer — needs is the finding's type and the pins it names, not
           a rendering of them in whichever language the panel happens to be
           showing. `Raw result` prints exactly what the tool returned. */
        findings: found.map((f) => ({
          id: f.id,
          type: f.type,
          severity: f.severity,
          ...(f.type === "mechanical-alignment"
            ? { expected: f.expectedAngle, observed: f.observedAngle }
            : f.type === "unexpected-connection"
              ? /* `expected: null` rather than an omitted key: a caller reading
                   the three arms wants the same field names, and a stray's
                   answer to "where does it belong" is that there is nowhere. */
                {
                  subject: f.subject,
                  expected: null,
                  observed: f.otherTerminal,
                }
              : f.type === "part-not-placed"
                ? /* The part's own id, not its translated name: this is the
                     tool's answer, and §9 asks a tool to report what the build
                     is rather than what the panel happens to be printing. */
                  {
                    subject: f.component,
                    expected: "on-bench",
                    observed: "in-kit",
                  }
                : {
                    subject: f.subject,
                    expected: f.expectedTerminal,
                    observed: f.observedTerminal ?? null,
                  }),
          confidence: f.evidence.confidence,
        })),
        source: "demo",
      },
      patch: {
        findings: [...kept, ...found],
        /* The credit list belongs to the findings list: these are freshly
           derived, so nothing among them has been paid for yet. Left standing,
           it would be a set of ids about a table that has been cleared. */
        repaired: [],
        /* Looking is the fact, not finding. A step inspected and clean has to
           be able to move on. */
        inspectedStepId: state.activeStepId,
        tab: found.length ? ("findings" as const) : state.tab,
      },
      note: found.length
        ? { headline: foundLine(found), tone: "found" as const }
        : { headline: { ns: "activity" as const, k: "nothingFound" as const } },
      /* A toast is read once and gone, so it is words, not a `Line`. */
      effects: found.length
        ? [
            {
              kind: "toast" as const,
              tone: "warning" as const,
              message: say(copy, foundLine(found)),
            },
          ]
        : [],
    };
  },

  async show_correction({ finding_id, detail_level }, ctx) {
    const state = ctx.read();
    const copy = ctx.copy;
    const finding = state.findings.find((f) => f.id === finding_id);

    if (!finding) {
      return {
        status: "error",
        errorMessage: { ns: "errors", k: "unknownFinding" },
      };
    }

    await ctx.phase({ ns: "phases", k: "locating" }, 260);

    const level = detail_level ?? state.coaching;
    const alreadyShown =
      state.highlightedFindingId === finding_id && state.coaching === level;

    return {
      status: "ok",
      result: {
        findingId: finding.id,
        detailLevel: level,
        focused: finding.focus.nodes,
        source: "demo",
      },
      patch: {
        highlightedFindingId: finding.id,
        coaching: level,
        tab: "findings" as const,
      },
      outcome: {
        ns: "activity" as const,
        k: alreadyShown
          ? ("correctionAlreadyShown" as const)
          : ("correctionHighlighted" as const),
      },
      effects: [
        {
          kind: "focus" as const,
          nodes: finding.focus.nodes,
          padding: finding.focus.padding,
          scale: finding.focus.scale,
        },
        {
          kind: "toast" as const,
          tone: "info" as const,
          message: copy.workbench.correctionHighlighted,
        },
      ],
    };
  },

  /**
   * Batch 9 · The one call that moves the build.
   *
   * It is `placeIn` — the same pure function the person's own release goes
   * through — so an agent's write and a learner's write cannot diverge: the
   * same refusals, the same consequences, the same pruning of joins that lost
   * their hold. What differs is only who is announced as having done it.
   *
   * ## Why it waits
   *
   * The two phases are not decoration and they are not padding: they are
   * exactly as long as it takes the ring to reach the lead and carry it across
   * (`lib/agent/mascot.ts`). The commit lands on the frame the ring arrives, so
   * a person watching sees the part move under the thing that moved it. Take
   * the wait out and the build changes half a second before its cause appears.
   *
   * ## Read fresh, twice
   *
   * The state read at the top is a second old by the time the write happens and
   * nothing disables the bench while a tool runs. The person may have picked
   * that very lead up meanwhile — so the placement is asked again against the
   * state it is about to patch, and a refusal is a sentence rather than a
   * silence.
   */
  async attach_lead({ lead, target = null }, ctx) {
    const state = ctx.read();
    const spec = buildFor(state.projectId)?.placement;

    if (!spec) {
      return {
        status: "error",
        errorMessage: { ns: "errors", k: "noPlacement" },
      };
    }
    if (!spec.terminals.includes(lead)) {
      return {
        status: "error",
        errorMessage: { ns: "errors", k: "unknownLead" },
      };
    }
    if (
      target !== null &&
      !isHole(spec, target) &&
      !spec.terminals.includes(target)
    ) {
      return {
        status: "error",
        errorMessage: { ns: "errors", k: "unknownTarget" },
      };
    }

    await ctx.phase({ ns: "phases", k: "reaching" }, GRIP_AT);
    await ctx.phase({ ns: "phases", k: "carrying" }, SEAT_AT - GRIP_AT);

    const live = ctx.read();
    const outcome = placeIn(live, spec, lead, target);

    if (!outcome.changed) {
      return {
        status: "error",
        errorMessage:
          outcome.refusal === "holeTaken"
            ? {
                ns: "errors" as const,
                k: "holeTaken" as const,
                args: [
                  (target ? maybeNode(live.scene, target)?.label : undefined) ??
                    target ??
                    "",
                ] as [string],
              }
            : outcome.refusal === "leadNotFree"
              ? { ns: "errors" as const, k: "leadNotFree" as const }
              : outcome.refusal === "sameCircuitPart"
                ? { ns: "errors" as const, k: "sameCircuitPart" as const }
                : /* A cable end asked to clip onto a leg. It gets its own rung
                     rather than sharing `sameCircuitPart`, because the two
                     refusals teach opposite things: that one says a part
                     cannot meet itself, this one says a jumper only ever lives
                     in a hole — and an agent told the wrong one will retry the
                     same gesture with a different part and be refused again.
                     A rung missed here is not a compile error either: every
                     arm below falls through to `leadAlreadyThere`, which is
                     the one sentence in this ladder that claims the write
                     succeeded. */
                  outcome.refusal === "wireEnd"
                    ? { ns: "errors" as const, k: "wireEnd" as const }
                    : /* Changed nothing and refused nothing: the lead is
                         already exactly where it was asked to go. Not a
                         failure, but not a write either, and the caller has to
                         be able to tell. */
                      { ns: "errors" as const, k: "leadAlreadyThere" as const },
      };
    }

    const { effects } = outcome;

    return {
      status: "ok",
      result: {
        lead,
        target,
        /* Structure, not sentences — the same rule `inspect_build` follows.
           What a caller needs back is what the model did, in its own names. */
        seated: effects.seated?.hole ?? null,
        joinedTo: effects.joined?.lead ?? null,
        loosened: effects.loosened ?? null,
        brokeJoins: effects.brokeJoins.map((join) => join.from),
        leftBench: effects.leftBench,
        enteredBench: effects.enteredBench,
        source: "demo",
      },
      patch: outcome.patch,
      commits: true,
      outcome: effects.seated
        ? {
            ns: "activity" as const,
            k: "leadSeated" as const,
            args: [
              {
                ref: "lead" as const,
                id: effects.seated.terminal,
                case: "acc" as const,
              },
              maybeNode(outcome.patch.scene ?? live.scene, effects.seated.hole)
                ?.label ?? effects.seated.hole,
            ] as [{ ref: "lead"; id: TerminalId; case: "acc" }, string],
          }
        : effects.joined
          ? {
              ns: "activity" as const,
              k: "leadJoined" as const,
              args: [
                {
                  ref: "lead" as const,
                  id: effects.joined.terminal,
                  case: "acc" as const,
                },
                {
                  ref: "lead" as const,
                  id: effects.joined.lead,
                  case: "dat" as const,
                },
              ] as [
                { ref: "lead"; id: TerminalId; case: "acc" },
                { ref: "lead"; id: TerminalId; case: "dat" },
              ],
            }
          : {
              ns: "activity" as const,
              k: "leadLoosened" as const,
              args: [
                { ref: "lead" as const, id: lead, case: "acc" as const },
              ] as [{ ref: "lead"; id: TerminalId; case: "acc" }],
            },
    };
  },

  async verify_current_step(_input, ctx) {
    const state = ctx.read();
    const copy = ctx.copy;
    const step = stepById(state.activeStepId);

    await ctx.phase({ ns: "phases", k: "rereading" }, 400);
    await ctx.phase({ ns: "phases", k: "comparingExpected" }, 480);

    /* The three ways a step can fail, added up. Strays are in the sum because
       a step that fails only on a join the sketch does not ask for would
       otherwise report `0 issues still open` and then refuse to tick — the
       interface contradicting itself in two adjacent sentences. */
    const openCount = (r: ReturnType<typeof verifyStep>) =>
      r.expected - r.matched + (r.mechanicalOk ? 0 : 1) + r.strays;

    const report = verifyStep(state.scene, state.activeStepId);
    const open = openCount(report);

    if (!report.verified) {
      return {
        status: "ok",
        result: { ...report, source: "demo" },
        note: {
          headline: {
            ns: "activity" as const,
            k: "stepNotVerified" as const,
            args: [open] as [number],
          },
          tone: "found" as const,
        },
      };
    }

    /* The report above is 880 ms old and nothing disables the bench while a
       tool is running. `tool/settle` then spreads this patch over whatever the
       person did meanwhile — ticking a step and stamping `completedAt` for a
       build whose resistor has since gone back in the box. A verification is a
       claim about the build as it is now, so it is asked again against the
       state this is about to patch, and the patch below is built from that same
       read rather than from `state`. */
    const live = ctx.read();
    const fresh = verifyStep(live.scene, live.activeStepId);
    /* Two ways this stopped being an answer about the build in front of the
       person, and they are one failure seen from two sides: the step under
       verification broke, or `commit` walked the active step back off it
       because a DIFFERENT step came off while the phases ran. The fresh check
       alone cannot see the second — it only ever asks about one step. */
    if (!fresh.verified || live.activeStepId !== state.activeStepId) {
      return {
        status: "ok",
        /* `report`, not `fresh`: this is the measurement the tool actually
           made, and `stale` is the warning that it is no longer an answer
           about the build in front of the person. */
        result: { ...report, verified: false, stale: true, source: "demo" },
        note: {
          headline: {
            ns: "activity" as const,
            k: "stepNotVerified" as const,
            /* Counted from `fresh`, though. `open` was taken before the
               awaits, and this branch only fires when it was zero — so
               reusing it would print `0 issues still open` beside a step
               that has just refused to tick. */
            args: [openCount(fresh)] as [number],
          },
          tone: "found" as const,
        },
      };
    }

    const following = nextStep(state.activeStepId);

    return {
      status: "ok",
      result: { ...report, nextStepId: following?.id ?? null, source: "demo" },
      patch: {
        /* From `live`, never from `state`. A tick landed from the pre-await
           read would spread away a regression `commit` recorded during the
           phases above — restoring a green tick, and the `completedAt` that
           offers `Finish`, for a step whose lead is now on the floor. */
        completedSteps: [...new Set([...live.completedSteps, step.id])],
        activeStepId: following?.id ?? state.activeStepId,
        /* Batch 8 · the last tick closes the build. Stamped here rather than by
           the screen that reads it, because this is the moment it happened —
           and the workbench does not throw the person out when it does. The
           foot changes to `Finish` and the door is offered, not walked
           through. */
        ...(following ? {} : { completedAt: Date.now() }),
        highlightedFindingId: null,
        /* The findings that belonged to the step that just closed. Carrying
           them into the next one would let the panel claim every connection
           matches on a step the agent has not looked at — the resolved rows go
           with the step, and the timeline keeps the record either way.

           **Only that step's**, though. Emptying the whole list threw away
           everything the agent had found about steps the person had not
           finished — a stray join two steps ahead, or a part still in the box —
           so a build could be verified forward past faults the panel had
           already reported and then had no record of. */
        findings: live.findings.filter((f) => f.stepId !== step.id),
        /* And what was paid for goes with them, on the same scoping. `repairs`
           keeps the total; this only says which of the findings still on the
           table were already counted. */
        repaired: live.repaired.filter((id) =>
          live.findings.some((f) => f.id === id && f.stepId !== step.id),
        ),
        tab: "guidance" as const,
      },
      note: {
        headline: { ns: "activity" as const, k: "stepVerified" as const },
        tone: "passed" as const,
      },
      effects: [
        { kind: "trace" as const, connectionIds: step.connections },
        { kind: "fitView" as const },
        {
          kind: "toast" as const,
          tone: "success" as const,
          message: copy.workbench.stepVerified,
        },
      ],
    };
  },

  async navigate_build_step({ step_id }, ctx) {
    const state = ctx.read();
    const copy = ctx.copy;

    if (step_id === state.activeStepId) {
      return {
        status: "ok",
        result: { stepId: step_id, source: "demo" },
        outcome: {
          ns: "activity" as const,
          k: "alreadyOnStep" as const,
          args: [stepById(step_id).index] as [number],
        },
      };
    }

    await ctx.phase({ ns: "phases", k: "loadingStep" }, 260);
    const step = stepById(step_id);

    /**
     * Steps this jump goes **past** without their being finished.
     *
     * Navigation is allowed to skip — a person reading ahead is a normal thing
     * to do, and refusing would make the tool useless for the case it exists
     * for. What is not allowed is doing it silently: an agent that placed every
     * part and then jumped to the last step produced a build reporting a pass
     * with three steps still marked `Not started`, and nothing anywhere said
     * that had happened. So the call reports it and the timeline records it.
     */
    const order = stepsOwning(state.activeStepId);
    const skipped = order
      .slice(0, order.findIndex((s) => s.id === step.id))
      .filter((s) => !state.completedSteps.includes(s.id))
      .map((s) => s.id);

    return {
      status: "ok",
      result: {
        stepId: step.id,
        name: stepWords(copy, step.id).name,
        skippedSteps: skipped,
        source: "demo",
      },
      ...(skipped.length
        ? {
            note: {
              headline: {
                ns: "activity" as const,
                k: "skippedSteps" as const,
                args: [skipped.length] as [number],
              },
              tone: "found" as const,
            },
          }
        : {}),
      patch: {
        activeStepId: step.id,
        highlightedFindingId: null,
        inspectedStepId: null,
        tab: "guidance" as const,
      },
      /* The step's name is a `Ref`, not a word: it is translated too, and a
         copy of it here would freeze with the rest of the entry. */
      outcome: {
        ns: "activity" as const,
        k: "movedToStep" as const,
        args: [step.index, { ref: "step" as const, id: step.id }] as [
          number,
          { ref: "step"; id: StepId },
        ],
      },
      effects: [{ kind: "fitView" as const }],
    };
  },

  /**
   * The build's own test, asked of the build.
   *
   * Everything that used to be written here — which checks exist, what they
   * measure, what the board prints while they run — is now a row in the
   * registry (`lib/device/run-spec.ts`). What is left is the two things a tool
   * does: honour its argument, and report.
   *
   * **The argument is honoured.** `test` used to be accepted, echoed back and
   * ignored: asking for `servo` ran all three checks and returned all three
   * results. A named check now runs alone, and the rows it did not run are
   * reported as skipped rather than silently passing.
   */
  async run_functional_test({ test }, ctx) {
    const state = ctx.read();
    const copy = ctx.copy;
    const build = buildFor(state.projectId);

    if (!build) {
      return { status: "error", errorMessage: { ns: "errors", k: "noBench" } };
    }

    const all = build.run.checks;
    const wanted =
      test === "full_system" ? all : all.filter((check) => check.id === test);

    if (!wanted.length) {
      return {
        status: "error",
        errorMessage: {
          ns: "errors",
          k: "unknownCheck",
          args: [all.map((check) => check.id).join(", ")],
        },
      };
    }

    await ctx.phase({ ns: "phases", k: "runningTest" }, 900);

    /* Measured against the build as it is *now*, not as it was when the call
       started — the same freshness rule `verify_current_step` keeps. */
    const live = ctx.read();
    const results: TestCheck[] = wanted.map((check) => ({
      subject: check.id,
      passed: check.passes(live.scene),
      detail: check.detail(live.scene),
    }));
    const failed = results.filter((r) => !r.passed).length;

    return {
      status: "ok",
      result: {
        test,
        ran: results.map((r) => r.subject),
        skipped: all
          .map((check) => check.id)
          .filter((id) => !results.some((r) => r.subject === id)),
        results,
        source: "demo",
      },
      note: failed
        ? {
            headline: {
              ns: "activity" as const,
              k: "testFailed" as const,
              args: [failed] as [number],
            },
            tone: "failed" as const,
          }
        : {
            headline: { ns: "activity" as const, k: "testPassed" as const },
            tone: "passed" as const,
          },
      /* The run plays either way — a failing test is the thing this product
         most needs to show. Only the toast is conditional, because there is
         nothing to congratulate. */
      effects: [
        {
          kind: "runTest" as const,
          results,
          checks: all.map((check) => check.id),
        },
        ...(failed
          ? []
          : [
              {
                kind: "toast" as const,
                tone: "success" as const,
                message: say(copy, { ns: "activity", k: "testPassed" }),
              },
            ]),
      ],
    };
  },
};

/** The human sentence an entry opens with, before the call has finished. */
export function headlineFor<K extends keyof ToolInputs>(
  name: K,
  input: ToolInputs[K],
  state: AgentSessionState,
): Line {
  const step = stepById(state.activeStepId);

  switch (name) {
    case "inspect_build": {
      const scope = (input as ToolInputs["inspect_build"]).scope;
      if (scope === "mechanical")
        return { ns: "activity", k: "inspectingMechanical", args: [step.index] };
      if (scope === "all" || scope === "wiring")
        return { ns: "activity", k: "inspectingAll" };
      return { ns: "activity", k: "inspecting", args: [step.index] };
    }
    case "show_correction":
      return { ns: "activity", k: "showingCorrection" };
    case "attach_lead":
      return {
        ns: "activity",
        k: "attachingLead",
        args: [
          {
            ref: "lead",
            id: (input as ToolInputs["attach_lead"]).lead,
            case: "acc",
          },
        ],
      };
    case "verify_current_step":
      return { ns: "activity", k: "verifying", args: [step.index] };
    case "navigate_build_step":
      return {
        ns: "activity",
        k: "navigating",
        args: [
          stepById((input as ToolInputs["navigate_build_step"]).step_id).index,
        ],
      };
    case "run_functional_test":
      return {
        ns: "activity",
        k: "testing",
        args: [(input as ToolInputs["run_functional_test"]).test.replace("_", " ")],
      };
    /* `get_build_context` and anything a later batch adds. */
    default:
      return { ns: "activity", k: "readContext" };
  }
}

/** Builds the call record an entry carries from its first frame. */
export function toolCallOf(
  id: string,
  name: AgentTool,
  input: unknown,
): ToolCall {
  const args = (input ?? {}) as Record<string, unknown>;
  return {
    id,
    name,
    args,
    argsSummary: summariseArgs(args),
    status: "running",
    startedAt: Date.now(),
  };
}

export { clockOf };
