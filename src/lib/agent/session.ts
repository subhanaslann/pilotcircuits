import type { ActivityEntry, ToolCall } from "@/lib/agent/activity";
import type { Finding, FindingId } from "@/lib/agent/findings";
import type { Line } from "@/lib/agent/line";
import type { CoachingLevel } from "@/lib/agent/model";
import type { StepId } from "@/lib/agent/steps";
import type { CircuitScene } from "@/lib/circuit/graph";
import { buildFor, defaultBuild, type BuildDef } from "@/lib/agent/builds";
import type { Placement } from "@/lib/circuit/placement";
import type { ProjectId } from "@/lib/projects/catalog";

/**
 * Batch 4 · The session.
 *
 * A reducer rather than a handful of `useState` calls, for one measurable
 * reason: a single tool call lands several coupled changes at once. Verifying a
 * step has to mark it complete, drop the resolved findings, clear the
 * highlight, close the running activity entry with its duration and move the
 * suggestion — in **one** commit. As six separate setters it is exactly the bug
 * rule 6 exists to prevent: the agent says verified and the tick stays amber.
 *
 * Nothing in this file imports React. In Batch 7 a WebMCP callback is invoked
 * by the browser, not by a component, and everything it needs has to be
 * reachable without a hook.
 */

export type AgentTab = "guidance" | "findings" | "activity";

export interface AgentSessionState {
  /**
   * Which build is on the bench.
   *
   * Carried in state rather than read from the route, because the session
   * outlives the route: `/complete` reports on a build that finished on a
   * different URL, and it has to know which one.
   */
  projectId: ProjectId;

  /** What is true. */
  scene: CircuitScene;
  /**
   * What each lead is attached to — a board hole, another part's free lead, or
   * nothing — on a build the person assembles themselves.
   *
   * A part's position is not in here: it is derived by walking out from the
   * board holes across the joins, and a part with no path to a hole is in the
   * kit. So the record says *what somebody did*, and where the parts ended up
   * is read back out of it.
   *
   * `{}` on a build laid out by the author, which today is chapter six alone —
   * a decision rather than a queue, and `builds.ts` says why beside
   * `BuildDef.placement`. Where it is filled, **`scene` is a function of it** —
   * `sceneFrom(placement)` — and the two must never be written apart. There are
   * three writers, `placeIn`, `satisfy` and `clear`, and all three go through
   * one `commit` in `agent/placement.ts` that sets both from the same pruned
   * record — so the placement and the scene cannot disagree about which joins
   * exist. Two records of where a part is, kept by hand, is the bug this
   * codebase has spent eight batches not having.
   */
  placement: Placement;
  activeStepId: StepId;
  completedSteps: StepId[];

  /**
   * Batch 8 · what the completion screen is allowed to say.
   *
   * Three numbers rather than three sentences, which is the same rule as
   * everywhere else in this file: state holds what the build did, and the words
   * around it are resolved at render. They live in the reducer rather than in
   * the hook because they are facts about the build — a run that survives a
   * route change has to carry them, and `/complete` is a different route from
   * the one that produced them.
   *
   * `startedAt` and `completedAt` are stamps, never differences: the elapsed
   * time is computed once from two fixed numbers rather than read off a clock
   * during render, which would disagree between the server and the first
   * client paint.
   */
  startedAt: number | null;
  completedAt: number | null;
  /**
   * How many findings the person put right. Counted here rather than derived,
   * because `verify_current_step` drops the step's findings on its way out —
   * by the time the build is finished there is nothing left to count.
   */
  repairs: number;
  /**
   * How many of the gestures on this bench the **agent** made.
   *
   * An agent with `attach_lead` can assemble a chapter end to end and then
   * navigate to the last step, and every screen would report a finished build
   * with no way to tell it apart from one somebody learned from. That is not an
   * argument against the tool — it is an argument for the build saying who did
   * it. Counted rather than flagged, because "the agent placed one lead when I
   * was stuck" and "the agent built all of it" are different things and a
   * boolean cannot tell them apart.
   *
   * Read by `get_build_context` (so the agent knows too) and by the completion
   * screen. It is deliberately not reset by `undo`: taking a placement back
   * does not unmake the fact that it was made for you.
   */
  assistedEdits: number;
  /**
   * Which of the findings on the table have already been paid for.
   *
   * `repairs` used to be the drop in the number of open findings, and a finding
   * is a live re-read of the graph rather than a flag — so one mistake could be
   * billed over and over: fix the join, knock the leg loose while moving the
   * part, join it again, and the counter went up a second time for the same
   * original fault. A repair is a finding that came right, so it is counted per
   * finding. Emptied with the findings themselves, which is what it is about.
   */
  repaired: FindingId[];

  /**
   * The step the agent has actually looked at.
   *
   * Not the same question as "are there findings", which is what the pinned
   * action used to ask. On a build laid out by the author every inspectable
   * step had something wrong with it, so the two answers agreed by accident;
   * the moment a person can build a step *correctly*, an inspection that finds
   * nothing leaves no trace and the foot offers the same inspection for ever.
   *
   * Cleared whenever the build moves to another step, because looking at step
   * two says nothing about step three.
   */
  inspectedStepId: StepId | null;

  /** What the agent knows — see `findings.ts` for why these are not the same. */
  findings: Finding[];
  highlightedFindingId: FindingId | null;
  coaching: CoachingLevel;

  /** What was done, and by whom. */
  activity: ActivityEntry[];
  running: ToolCall | null;

  /** The frame. */
  tab: AgentTab;
  webMcpAvailable: boolean;
  /** Bumped by reset, so a call still in flight lands on the floor. */
  generation: number;
  seq: number;

  /**
   * What the bench looked like before each of the person's own gestures.
   *
   * A spatial editor without undo makes every mis-drop permanent, and this one
   * had none of any kind — so a lead pulled out of a hole by a gesture that
   * missed by a fifth of a pitch took the part off the bench, with no way back
   * but rebuilding it. That is the single change that makes everything else
   * here safe to be wrong about.
   *
   * A snapshot rather than a command stack, because `Placement` is already an
   * immutable flat record and `commit` is already the only writer — so a
   * snapshot is a handful of string references and an inverse operation would
   * be a second model of the same facts.
   *
   * **`findings` are deliberately not in it.** Whether a finding is open is a
   * live re-read of the graph (`isResolved`), so undoing a repair re-opens it
   * on its own; storing a copy would be the second opinion this codebase does
   * not keep anywhere else.
   */
  history: { past: BenchSnapshot[]; future: BenchSnapshot[] };
}

/**
 * Exactly what `commit` writes, and nothing else.
 *
 * Kept in step with `agent/placement.ts`'s `commit` by construction: if that
 * function learns to write a new field, this type is where it has to be added
 * or an undo will restore a bench that half-remembers.
 */
export type BenchSnapshot = Pick<
  AgentSessionState,
  | "placement"
  | "scene"
  | "completedSteps"
  | "completedAt"
  | "activeStepId"
  | "repairs"
  | "repaired"
>;

/** A ten-minute build does not need an unbounded history. */
const HISTORY_LIMIT = 50;

export const snapshotOf = (state: AgentSessionState): BenchSnapshot => ({
  placement: state.placement,
  scene: state.scene,
  completedSteps: state.completedSteps,
  completedAt: state.completedAt,
  activeStepId: state.activeStepId,
  repairs: state.repairs,
  repaired: state.repaired,
});

export function initialSession(build: BuildDef = defaultBuild): AgentSessionState {
  return {
    projectId: build.projectId,
    scene: build.scene,
    placement: build.placement?.empty ?? {},
    activeStepId: build.activeStepId,
    completedSteps: [...build.completedSteps],
    startedAt: null,
    completedAt: null,
    repairs: 0,
    assistedEdits: 0,
    repaired: [],
    inspectedStepId: null,
    findings: [],
    highlightedFindingId: null,
    coaching: "hint",
    activity: [],
    running: null,
    tab: "guidance",
    /**
     * Batch 8 · false until something is actually found.
     *
     * It started `true` in Batch 4, when there was nothing to detect and the
     * flag existed so the lab could show both panels. Now that the browser is
     * really probed, the honest opening value is "nothing registered yet" —
     * and the flash on a capable browser then runs the right way round, from
     * *not claimed* to *claimed*, rather than printing `WebMCP ready` for a
     * frame on a browser that has never heard of it.
     */
    webMcpAvailable: false,
    generation: 0,
    seq: 0,
    history: { past: [], future: [] },
  };
}

/**
 * `patch` carries everything a tool changed, so it commits with the tool's own
 * activity entry rather than a render later.
 */
export type SessionPatch = Partial<
  Pick<
    AgentSessionState,
    | "scene"
    | "placement"
    | "activeStepId"
    | "completedSteps"
    | "startedAt"
    | "completedAt"
    | "repairs"
    | "repaired"
    | "inspectedStepId"
    | "findings"
    | "highlightedFindingId"
    | "coaching"
    | "tab"
    | "webMcpAvailable"
  >
>;

export type SessionAction =
  | { type: "tool/start"; call: ToolCall; headline: Line }
  | { type: "tool/phase"; callId: string; note: Line }
  | {
      type: "tool/settle";
      callId: string;
      time: string;
      status: "ok" | "error";
      result?: unknown;
      errorMessage?: Line;
      durationMs: number;
      outcome?: Line;
      tone?: "found" | "passed" | "failed";
      patch?: SessionPatch;
    }
  | { type: "log"; entry: Omit<ActivityEntry, "id"> }
  | { type: "patch"; patch: SessionPatch }
  /**
   * A patch that is one of the person's own gestures, and can be taken back.
   *
   * Separate from `patch` rather than a flag on it, so the question "is this
   * undoable" is answered at the call site by which action is dispatched. An
   * agent tool reading the build is not an edit; a lead moving is.
   */
  /**
   * A gesture on the bench. `by` says whose — the person's own release, or a
   * tool call that moved something.
   */
  | { type: "commit"; patch: SessionPatch; by?: "user" | "agent" }
  | { type: "undo" }
  | { type: "redo" }
  /**
   * Batch 8 · the build is now under way.
   *
   * Idempotent on purpose: pressing `Start build` twice, or an agent calling
   * `start_project` on a build already open, must not restart the clock. §9
   * asks every tool to be safe when called again with the same arguments, and
   * this is the one piece of state where "again" would quietly lose data.
   */
  | { type: "build/start"; at: number }
  | { type: "openBuild"; build: BuildDef }
  | { type: "reset" };

/** A ten-minute demo should not grow an unbounded log. */
const ACTIVITY_LIMIT = 60;

const capped = (entries: ActivityEntry[]) =>
  entries.length > ACTIVITY_LIMIT ? entries.slice(-ACTIVITY_LIMIT) : entries;

export function sessionReducer(
  state: AgentSessionState,
  action: SessionAction,
): AgentSessionState {
  switch (action.type) {
    case "tool/start":
      return {
        ...state,
        seq: state.seq + 1,
        running: action.call,
        activity: capped([
          ...state.activity,
          {
            id: `act-${state.seq}`,
            actor: "agent",
            headline: action.headline,
            status: "running",
            call: action.call,
          },
        ]),
      };

    case "tool/phase":
      return {
        ...state,
        activity: state.activity.map((entry) =>
          entry.call?.id === action.callId
            ? { ...entry, phase: action.note }
            : entry,
        ),
      };

    /* The tool's own changes land in the same commit as its entry closing. */
    case "tool/settle":
      return {
        ...state,
        ...action.patch,
        running: null,
        activity: state.activity.map((entry) =>
          entry.call?.id !== action.callId
            ? entry
            : {
                ...entry,
                status: action.status,
                time: action.time,
                phase: undefined,
                outcome: action.outcome,
                tone: action.tone,
                call: {
                  ...entry.call!,
                  status: action.status,
                  result: action.result,
                  errorMessage: action.errorMessage,
                  durationMs: action.durationMs,
                },
              },
        ),
      };

    case "log":
      return {
        ...state,
        seq: state.seq + 1,
        activity: capped([
          ...state.activity,
          { ...action.entry, id: `act-${state.seq}` },
        ]),
      };

    case "patch":
      return { ...state, ...action.patch };

    case "commit": {
      const before = snapshotOf(state);
      const next = { ...state, ...action.patch };
      /* A gesture that changed nothing on the bench is not a step to take
         back — otherwise Ctrl+Z spends presses on nothing while the mistake it
         is aimed at stays put. */
      if (next.placement === state.placement && next.scene === state.scene) {
        return next;
      }
      return {
        ...next,
        assistedEdits: state.assistedEdits + (action.by === "agent" ? 1 : 0),
        history: {
          past: [...state.history.past, before].slice(-HISTORY_LIMIT),
          /* A new gesture abandons the redo branch, which is what every editor
             does and what a person expects: the future they had is no longer
             the future of the bench they are on. */
          future: [],
        },
      };
    }

    case "undo": {
      const previous = state.history.past.at(-1);
      if (!previous) return state;
      return {
        ...state,
        ...previous,
        /* Not restored: the highlight is about what the agent is pointing at
           now, and it has to be dropped either way because the pin it names
           may not be on the bench in the state being restored. */
        highlightedFindingId: null,
        history: {
          past: state.history.past.slice(0, -1),
          future: [snapshotOf(state), ...state.history.future],
        },
      };
    }

    case "redo": {
      const next = state.history.future[0];
      if (!next) return state;
      return {
        ...state,
        ...next,
        highlightedFindingId: null,
        history: {
          past: [...state.history.past, snapshotOf(state)].slice(-HISTORY_LIMIT),
          future: state.history.future.slice(1),
        },
      };
    }

    case "build/start":
      return state.startedAt === null
        ? { ...state, startedAt: action.at }
        : state;

    /* The browser's capability survives a demo reset — resetting the demo does
       not uninstall WebMCP. Everything else goes back to the start. */
    case "reset":
      return {
        ...initialSession(buildFor(state.projectId) ?? defaultBuild),
        webMcpAvailable: state.webMcpAvailable,
        generation: state.generation + 1,
      };

    /**
     * Walking into a different build's bench.
     *
     * A no-op when it is the build already on the bench — arriving at the same
     * workbench twice is one build, and resetting here would wipe the run every
     * time the route remounted. When it *is* a different one the session starts
     * over, because the product carries one build at a time and half a parking
     * barrier is not a state a breathing lamp can inherit.
     */
    case "openBuild": {
      if (action.build.projectId === state.projectId) return state;
      return {
        ...initialSession(action.build),
        webMcpAvailable: state.webMcpAvailable,
        generation: state.generation + 1,
      };
    }

    default:
      return state;
  }
}
