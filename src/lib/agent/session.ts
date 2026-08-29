import type { ActivityEntry, ToolCall } from "@/lib/agent/activity";
import type { Finding, FindingId } from "@/lib/agent/findings";
import type { Line } from "@/lib/agent/line";
import type { CoachingLevel } from "@/lib/agent/model";
import type { StepId } from "@/lib/agent/steps";
import type { CircuitScene } from "@/lib/circuit/graph";
import { smartParkingBarrier } from "@/lib/circuit/smart-parking-barrier";

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
  /** What is true. */
  scene: CircuitScene;
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
}

export function initialSession(): AgentSessionState {
  return {
    scene: smartParkingBarrier,
    activeStepId: "sensor",
    completedSteps: ["kit", "place"],
    startedAt: null,
    completedAt: null,
    repairs: 0,
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
    | "activeStepId"
    | "completedSteps"
    | "startedAt"
    | "completedAt"
    | "repairs"
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
   * Batch 8 · the build is now under way.
   *
   * Idempotent on purpose: pressing `Start build` twice, or an agent calling
   * `start_project` on a build already open, must not restart the clock. §9
   * asks every tool to be safe when called again with the same arguments, and
   * this is the one piece of state where "again" would quietly lose data.
   */
  | { type: "build/start"; at: number }
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

    case "build/start":
      return state.startedAt === null
        ? { ...state, startedAt: action.at }
        : state;

    /* The browser's capability survives a demo reset — resetting the demo does
       not uninstall WebMCP. Everything else goes back to the start. */
    case "reset":
      return {
        ...initialSession(),
        webMcpAvailable: state.webMcpAvailable,
        generation: state.generation + 1,
      };

    default:
      return state;
  }
}
