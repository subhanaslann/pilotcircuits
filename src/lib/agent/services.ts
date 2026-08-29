import type { Copy } from "@/content/i18n";
import { clockOf, summariseArgs, type ToolCall } from "@/lib/agent/activity";
import {
  deriveFindings,
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
import { nextStep, stepById, stepWords, type StepId } from "@/lib/agent/steps";
import { isServoAligned, type NodeId } from "@/lib/circuit/graph";
import { finalReadingCm } from "@/lib/device/test-run";
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
  subject: "sensor" | "servo" | "leds";
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
  | { kind: "runTest"; results: TestCheck[] }
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
  verify_current_step: Record<string, never>;
  navigate_build_step: { step_id: StepId };
  run_functional_test: { test: "sensor" | "servo" | "leds" | "full_system" };
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
    project: copy.build.project,
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
    /* Never hidden. The interface does not pretend to be real hardware. */
    source: "demo",
  };
}

/** What was found, named honestly: a servo a quarter turn out is not a wire. */
function foundLine(found: { type: string }[]): Line {
  const allWiring = found.every((f) => f.type !== "mechanical-alignment");
  return {
    ns: "activity",
    k: allWiring ? "mismatchFound" : "issuesFound",
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
        findings: found,
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

  async verify_current_step(_input, ctx) {
    const state = ctx.read();
    const copy = ctx.copy;
    const step = stepById(state.activeStepId);

    await ctx.phase({ ns: "phases", k: "rereading" }, 400);
    await ctx.phase({ ns: "phases", k: "comparingExpected" }, 480);

    const report = verifyStep(state.scene, state.activeStepId);
    const open =
      report.expected - report.matched + (report.mechanicalOk ? 0 : 1);

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

    const following = nextStep(state.activeStepId);

    return {
      status: "ok",
      result: { ...report, nextStepId: following?.id ?? null, source: "demo" },
      patch: {
        completedSteps: [...new Set([...state.completedSteps, step.id])],
        activeStepId: following?.id ?? state.activeStepId,
        /* Batch 8 · the last tick closes the build. Stamped here rather than by
           the screen that reads it, because this is the moment it happened —
           and the workbench does not throw the person out when it does. The
           foot changes to `Finish` and the door is offered, not walked
           through. */
        ...(following ? {} : { completedAt: Date.now() }),
        highlightedFindingId: null,
        /* The findings belonged to the step that just closed. Carrying them
           into the next one would let the panel claim every connection matches
           on a step the agent has not looked at — the resolved rows go with the
           step, and the timeline keeps the record either way. */
        findings: [],
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

    return {
      status: "ok",
      result: {
        stepId: step.id,
        name: stepWords(copy, step.id).name,
        source: "demo",
      },
      patch: {
        activeStepId: step.id,
        highlightedFindingId: null,
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

  async run_functional_test({ test }, ctx) {
    const state = ctx.read();
    const copy = ctx.copy;
    const wiringOk = verifyStep(state.scene, "sensor").verified;
    const servoOk = isServoAligned(state.scene);

    await ctx.phase({ ns: "phases", k: "runningTest" }, 900);

    /* `18 cm` is the reading the approach ends on, taken from the same list
       the canvas and the dock read — one number, one place. */
    const results: TestCheck[] = [
      { subject: "sensor", passed: wiringOk, detail: `${finalReadingCm} cm` },
      { subject: "servo", passed: servoOk, detail: "0° → 90°" },
      { subject: "leds", passed: true, detail: "green" },
    ];
    const failed = results.filter((r) => !r.passed).length;

    return {
      status: "ok",
      result: { test, results, source: "demo" },
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
        { kind: "runTest" as const, results },
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
