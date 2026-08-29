"use client";

import { useEffect, useReducer, useRef, useState, type RefObject } from "react";
import type { CanvasHandle } from "@/components/canvas/canvas-viewport";
import {
  idleRows,
  type TestRowStates,
  type TestSubject,
} from "@/components/device/test-output";
import type { DeviceTestStatus } from "@/components/device/test-status";
import type { StepState } from "@/components/ui/feedback";
import { useToasts } from "@/components/ui/status";
import { useCopy, useLocale } from "@/content/copy-provider";
import { clockOf } from "@/lib/agent/activity";
import { say, type Line } from "@/lib/agent/line";
import { isResolved, type FindingId } from "@/lib/agent/findings";
import type { CoachingLevel } from "@/lib/agent/model";
import {
  toolCallOf,
  type SessionEffect,
  type TestCheck,
  type ToolContext,
  type ToolOutcome,
} from "@/lib/agent/services";
import {
  allHandlers,
  headlineForAny,
  type AllToolInputs,
} from "@/lib/agent/tools";
import {
  approachReadings,
  barrierLines,
  distanceLine,
  finalReadingCm,
} from "@/lib/device/test-run";
import {
  initialSession,
  sessionReducer,
  type AgentTab,
  type SessionAction,
} from "@/lib/agent/session";
import { blockedSteps } from "@/lib/agent/findings";
import { stepById, toProgressSteps } from "@/lib/agent/steps";
import type { ProjectFilters } from "@/lib/projects/filter";
import { isWebMcpAvailable } from "@/lib/agent/webmcp";
import { applyExpected, node } from "@/lib/circuit/graph";
import {
  withEchoMisplaced,
  withHornTurned,
} from "@/lib/circuit/smart-parking-barrier";
import { boundsOf } from "@/lib/circuit/routing";

/**
 * Batch 4 · The runner.
 *
 * One tool call at a time. An agent does not fan out, and serialising removes
 * the whole class of bug where two handlers both read the state before either
 * of them lands.
 *
 * Two guards earn their keep:
 *
 *   **`latest`** — handlers are called from click handlers and timers, never
 *   during render, so a ref written in a passive effect is always the committed
 *   state by the time one runs. In Batch 7 the caller is a browser callback,
 *   which is the same position.
 *
 *   **`generation`** — press Reset while `inspect_build` is in flight and, a
 *   second later, a finding would appear on a freshly reset board. The counter
 *   makes that landing a no-op.
 */

/** The half of the work the agent cannot do. */
export type UserAction =
  | { kind: "resolve"; findingId: FindingId }
  | { kind: "set-coaching"; level: CoachingLevel }
  /**
   * W-10 · A demo control putting one of the build's two faults back.
   *
   * It belongs here, beside "I fixed it", and not in a path of its own: in the
   * fiction it is the same gesture in the other direction — a person moving a
   * wire — so it commits through the same reducer, lands in the same timeline
   * as the person's own line, and leaves the findings to re-answer themselves
   * off the graph. §10: the demo buttons do not run a second flow.
   */
  | { kind: "inject"; fault: "echo" | "servo" };

export interface TestTheatre {
  approach: number;
  distanceCm: number | null;
  sensing: boolean;
}

/**
 * Batch 5 · the same run, counted.
 *
 * The canvas half of the functional test is theatre and ends when the car
 * drives off. This half is a record: it stays on screen afterwards, because
 * the dock is where you go to read what happened.
 */
export interface DockRun {
  status: DeviceTestStatus;
  rows: TestRowStates;
  /** Only the checks that passed. A measurement replaces the state word in
   *  `StepLoader`, and a failed row has to keep saying `Failed` (rule 9). */
  details: Partial<Record<TestSubject, string>>;
  failedCount: number;
}

const idleRun: DockRun = {
  status: "idle",
  rows: idleRows,
  details: {},
  failedCount: 0,
};

export function useAgentSession(options?: {
  canvas?: RefObject<CanvasHandle | null>;
  /**
   * A second view of the same build — the inspection's camera pane (W-06).
   *
   * Focus and fit reach both, because the agent is pointing at one build and
   * not at one component. Two independent transforms, one instruction: without
   * this, pressing `Show me` inside the inspection moved the workbench behind
   * the modal and left the frame you were looking at exactly where it was.
   * `null` while the modal is closed, which makes it a no-op.
   */
  camera?: RefObject<CanvasHandle | null>;
  /**
   * Batch 8 · where a navigating tool sends the person.
   *
   * `open_project` and `start_project` change the route. Absent — which is the
   * design lab, where there is nowhere to go — the effect is a no-op rather
   * than an error: a tool that cannot navigate still did the rest of its job.
   */
  navigate?: (href: string) => void;
  /**
   * Batch 8 · P-04's toolbar, when the session is the one holding it.
   *
   * `find_projects` narrows the same control the user narrows, so the search
   * is visible rather than merely answered (rule 6).
   */
  onFilters?: (next: ProjectFilters) => void;
}) {
  const copy = useCopy();
  const { locale } = useLocale();
  const [state, dispatch] = useReducer(
    sessionReducer,
    undefined,
    initialSession,
  );
  const { toasts, push, dismiss } = useToasts();

  /**
   * The committed state, readable synchronously.
   *
   * Not a `useEffect` mirror of `state`: tool calls are chained on a promise
   * queue, so the next handler starts on a microtask — long before React has
   * committed the previous one and run any effect. `show_correction` would then
   * look for a finding `inspect_build` had just produced and not find it.
   *
   * So every dispatch goes through `apply`, which runs the same pure reducer
   * against the ref first. React and the ref apply the identical action list in
   * the identical order, so they cannot diverge.
   */
  const latest = useRef(state);
  const apply = (action: SessionAction) => {
    latest.current = sessionReducer(latest.current, action);
    dispatch(action);
  };

  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const timers = useRef<number[]>([]);
  /* Plain functions, not `useCallback`. This project compiles with the React
     Compiler, and a manual dependency list cannot express a ref's `.current` —
     which is exactly what the canvas handle is. Let the compiler do it. */
  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };

  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    },
    [],
  );

  /**
   * Batch 8 · ask the browser once, on mount.
   *
   * Detection lives here rather than beside the registration hook so that every
   * session learns the same answer — the lab's live panels included. Both call
   * the same pure probe, so the two cannot disagree about what the browser can
   * do. Registration is a separate concern and belongs to the route that owns
   * the tools (`use-webmcp.ts`).
   *
   * The state starts `false`, so this only ever moves in the honest direction.
   */
  useEffect(() => {
    if (isWebMcpAvailable()) {
      apply({ type: "patch", patch: { webMcpAvailable: true } });
    }
    /* Once. The browser does not grow the API while the page is open. */
  }, []);

  /* Ephemeral canvas theatre — not session state, because none of it survives
     a reload and none of it is anything the agent could be asked about. */
  const [trace, setTrace] = useState<string[]>();
  const [test, setTest] = useState<TestTheatre>();
  const [leds, setLeds] = useState<{ green: boolean; red: boolean }>();
  const [testAngle, setTestAngle] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  /* The dock's half of the run. Ephemeral like the rest — it does not survive
     a reload, and it is not something the agent could be asked about — but it
     outlives the canvas theatre, because it is a record rather than a scene. */
  const [serial, setSerial] = useState<string[]>([]);
  /**
   * D-04 · the same approach, as numbers.
   *
   * Not derivable from `serial` without parsing it back, and parsing the
   * board's own output to recover a value we had before printing it is the
   * kind of round trip that breaks the first time a line changes shape. The
   * log keeps what the board said (rule 13); this keeps what it measured.
   */
  const [readings, setReadings] = useState<number[]>([]);
  const [testRun, setTestRun] = useState<DockRun>(idleRun);

  /**
   * C-23 · D-01…D-06 · the functional test, played once and read twice.
   *
   * One clock. The canvas gets the car, the sonar and the horn; the dock gets
   * the serial lines, the falling reading and the three rows. They cannot
   * disagree because there is nothing to keep in step — the readings come from
   * one list (`lib/device/test-run.ts`) and every tick writes both halves.
   *
   * **A failing run plays too.** The gate's fault in this build is mechanical:
   * the horn is fitted a quarter turn out, so the sketch commands OPEN, the
   * board reports that it opened, the green light comes on — and the arm does
   * not move. That contradiction, visible in three places at once, is the
   * thing the whole product is built to teach. Suppressing the sequence
   * whenever it failed hid exactly the case worth showing.
   */
  const playTest = (results: TestCheck[]) => {
    const byId = new Map(results.map((check) => [check.subject, check]));
    const servoOk = byId.get("servo")?.passed ?? false;
    const failedCount = results.filter((check) => !check.passed).length;

    const settled = (subject: TestSubject): StepState =>
      byId.get(subject)?.passed ? "passed" : "failed";

    const detailsFor = (...subjects: TestSubject[]) => {
      const out: Partial<Record<TestSubject, string>> = {};
      for (const subject of subjects) {
        const check = byId.get(subject);
        if (check?.passed) out[subject] = check.detail;
      }
      return out;
    };

    setLeds({ green: false, red: true });
    setTestAngle(0);
    setTest({ approach: 0.02, distanceCm: null, sensing: true });
    setSerial([]);
    setReadings([]);
    setTestRun({
      status: "running",
      rows: { sensor: "running", servo: "idle", leds: "idle" },
      details: {},
      failedCount: 0,
    });

    /* The approach. Five samples rather than three: the car needs only enough
       to move smoothly, but a serial monitor with three lines in it does not
       look like a board talking. */
    approachReadings.forEach((cm, index) => {
      const share = index / (approachReadings.length - 1);
      after(400 + index * 350, () => {
        setTest({
          approach: 0.3 + share * 0.7,
          distanceCm: cm,
          sensing: true,
        });
        setSerial((prev) => [...prev, distanceLine(cm)]);
        setReadings((prev) => [...prev, cm]);
      });
    });

    after(2000, () =>
      setTestRun({
        status: "running",
        rows: { sensor: settled("sensor"), servo: "running", leds: "idle" },
        details: detailsFor("sensor"),
        failedCount: 0,
      }),
    );

    after(2400, () => {
      /* The light reports the sketch's decision, which is right either way.
         The arm reports the room, which is not. */
      setLeds({ green: true, red: false });
      if (servoOk) setTestAngle(90);
      setSerial((prev) => [...prev, barrierLines.opening]);
    });

    after(3000, () =>
      setTestRun({
        status: "running",
        rows: {
          sensor: settled("sensor"),
          servo: settled("servo"),
          leds: "running",
        },
        details: detailsFor("sensor", "servo"),
        failedCount: 0,
      }),
    );

    after(3600, () =>
      setTestRun({
        status: failedCount ? "failed" : "passed",
        rows: {
          sensor: settled("sensor"),
          servo: settled("servo"),
          leds: settled("leds"),
        },
        details: detailsFor("sensor", "servo", "leds"),
        failedCount,
      }),
    );

    after(4400, () => {
      setTestAngle(0);
      setLeds({ green: false, red: true });
      setTest({ approach: 1, distanceCm: finalReadingCm, sensing: false });
      setSerial((prev) => [...prev, barrierLines.closed]);
    });

    /* Only the canvas half clears. The dock keeps the log and the verdict,
       because that is what a person turns to after the car has gone. */
    after(5400, () => {
      setTest(undefined);
      setLeds(undefined);
      setTestAngle(null);
    });
  };

  /** Every view of the build that is on screen right now. */
  const views = () =>
    [options?.canvas?.current, options?.camera?.current].filter(
      (view) => view !== null && view !== undefined,
    );

  const applyEffects = (effects: SessionEffect[]) => {
    for (const effect of effects) {
      switch (effect.kind) {
        case "focus": {
          const scene = latest.current.scene;
          const box = boundsOf(
            effect.nodes.map((id) => node(scene, id)),
            effect.padding,
          );
          if (box) {
            for (const view of views()) {
              view.focusOn(box, { scale: effect.scale });
            }
          }
          break;
        }
        case "fitView":
          for (const view of views()) view.fitView();
          break;
        case "trace":
          setTrace(effect.connectionIds);
          after(1300, () => setTrace(undefined));
          break;
        case "runTest":
          playTest(effect.results);
          break;
        case "navigate":
          options?.navigate?.(effect.href);
          break;
        case "filters":
          options?.onFilters?.(effect.next);
          break;
        case "toast":
          push(effect.message, effect.tone);
          break;
      }
    }
  };

  const execute = async <K extends keyof AllToolInputs>(
    name: K,
    input: AllToolInputs[K],
  ) => {
    const before = latest.current;
    const generation = before.generation;
    const callId = `call-${before.seq}`;
    const call = toolCallOf(callId, name, input);

    apply({
      type: "tool/start",
      call,
      headline: headlineForAny(name, input, before),
    });

    const ctx: ToolContext = {
      read: () => latest.current,
      copy,
      locale,
      phase: async (note, ms) => {
        apply({ type: "tool/phase", callId, note });
        await new Promise((resolve) => after(ms, () => resolve(null)));
      },
    };

    /**
     * Batch 8 · a handler that throws still closes its entry.
     *
     * Until the browser could call these, every caller was a button passing
     * arguments the types had already checked. A WebMCP client can hand a tool
     * anything, and an exception escaping here would leave the timeline with a
     * row that says `running` for the rest of the session — the panel claiming
     * the agent is still working on something that died. §9 asks for an
     * understandable error result; this is where an unexpected one becomes one.
     */
    let outcome: ToolOutcome;
    try {
      outcome = await allHandlers[name](input as never, ctx);
    } catch {
      outcome = {
        status: "error",
        errorMessage: { ns: "errors", k: "toolFailed" },
      };
    }

    /* Reset happened mid-flight: drop the landing entirely. */
    if (latest.current.generation !== generation) return outcome;

    apply({
      type: "tool/settle",
      callId,
      time: clockOf(Date.now()),
      status: outcome.status,
      result: outcome.result,
      errorMessage: outcome.errorMessage,
      durationMs: Date.now() - call.startedAt,
      outcome: outcome.outcome,
      patch: outcome.patch,
    });

    if (outcome.note) {
      apply({
        type: "log",
        entry: {
          actor: "agent",
          headline: outcome.note.headline,
          status: "ok",
          time: clockOf(Date.now()),
          tone: outcome.note.tone,
        },
      });
    }

    /* One sentence, three places: the timeline, the toast, the live region. A
         missed toast loses nothing because it is not a separate fact. */
    const spoken =
      outcome.note?.headline ?? outcome.outcome ?? outcome.errorMessage;
    setAnnouncement(spoken ? say(copy, spoken) : "");
    applyEffects(outcome.effects ?? []);
    return outcome;
  };

  const run = <K extends keyof AllToolInputs>(
    name: K,
    input: AllToolInputs[K],
  ) => {
    const task = queue.current.then(() => execute(name, input));
    queue.current = task.catch(() => undefined);
    return task;
  };

  const act = (action: UserAction) => {
    const current = latest.current;

    if (action.kind === "set-coaching") {
      apply({ type: "patch", patch: { coaching: action.level } });
      return;
    }

    if (action.kind === "inject") {
      const scene =
        action.fault === "echo"
          ? withEchoMisplaced(current.scene)
          : withHornTurned(current.scene);

      /* The wire names itself off the graph it just landed in, so the sentence
         cannot disagree with the canvas about where the wire went. */
      const moved = scene.observed.find((c) => c.id === "c.sensor.echo");
      const headline: Line =
        action.fault === "echo" && moved
          ? {
              ns: "user",
              k: "movedWire",
              args: [
                node(scene, moved.from).label ?? "",
                node(scene, moved.to).label ?? "",
              ],
            }
          : { ns: "user", k: "refittedHorn" };

      apply({ type: "patch", patch: { scene, highlightedFindingId: null } });
      apply({
        type: "log",
        entry: {
          actor: "user",
          headline,
          status: "ok",
          time: clockOf(Date.now()),
        },
      });
      setAnnouncement(say(copy, headline));
      return;
    }

    const finding = current.findings.find((f) => f.id === action.findingId);
    if (!finding) return;

    const scene =
      finding.probe.kind === "servo-alignment"
        ? {
            ...current.scene,
            mechanical: {
              ...current.scene.mechanical,
              servoAngle: current.scene.mechanical.expectedAngle,
            },
          }
        : applyExpected(current.scene, finding.probe.connectionId);

    const target = finding.affectedNodes.find((n) => n.mark === "target");
    const headline: Line =
      finding.probe.kind === "servo-alignment"
        ? { ns: "user", k: "remountedServo" }
        : {
            ns: "user",
            k: "movedWire",
            args: [finding.highlight.subject ?? "", target?.terminal ?? ""],
          };

    /* Batch 8 · the completion screen's `Issues fixed`. Counted at the moment
       the person puts something right, because `verify_current_step` drops the
       step's findings on its way out and there is nothing left to count later.
       `inject` deliberately does not increment: that is the same gesture in the
       other direction, not a repair. */
    apply({
      type: "patch",
      patch: {
        scene,
        highlightedFindingId: null,
        repairs: current.repairs + 1,
      },
    });
    apply({
      type: "log",
      entry: {
        actor: "user",
        headline,
        status: "ok",
        time: clockOf(Date.now()),
      },
    });
    setAnnouncement(say(copy, headline));
  };

  /**
   * Batch 8 · the build is under way from now on.
   *
   * Called by `Start build` on the project detail screen, by `start_project`,
   * and by the workbench itself on mount — a person who types the workbench
   * URL has started the build just as much as one who pressed the button. The
   * action is idempotent, so all three arriving is one clock, not three.
   */
  const start = () => apply({ type: "build/start", at: Date.now() });

  const reset = () => {
    clearTimers();
    const wasStarted = latest.current.startedAt !== null;
    apply({ type: "reset" });
    /**
     * Batch 8 · resetting the demo restarts the clock; it does not unstart the
     * build.
     *
     * `Reset` puts the board back to the beginning, and the person pressing it
     * is standing at the bench — they have not stopped building. Left alone,
     * `initialSession()` cleared `startedAt`, and the summary reached at the end
     * of that very run then announced it had been opened without a build. True
     * of the state, and plainly false about what had just happened.
     */
    if (wasStarted) apply({ type: "build/start", at: Date.now() });
    setTrace(undefined);
    setTest(undefined);
    setLeds(undefined);
    setTestAngle(null);
    setSerial([]);
    setReadings([]);
    setTestRun(idleRun);
    setAnnouncement(say(copy, { ns: "activity", k: "reset" }));
    for (const view of views()) view.fitView();
    apply({
      type: "log",
      entry: {
        actor: "system",
        headline: { ns: "activity", k: "reset" },
        status: "ok",
        time: clockOf(Date.now()),
      },
    });
  };

  const setTab = (tab: AgentTab) => apply({ type: "patch", patch: { tab } });

  const setWebMcpAvailable = (webMcpAvailable: boolean) =>
    apply({ type: "patch", patch: { webMcpAvailable } });

  /* Derived on every render, from the graph — which is why moving one wire
     resolves the finding, clears the step's amber tick and re-labels the row
     without a second inspection. */
  const openFindings = state.findings.filter(
    (finding) => !isResolved(finding, state.scene),
  );
  const steps = toProgressSteps(
    copy,
    state.activeStepId,
    state.completedSteps,
    blockedSteps(state.findings, state.scene),
  );

  /* The scene the canvas draws: the session's, with the test's horn angle laid
     over it while the theatre is playing. */
  const scene =
    testAngle === null
      ? state.scene
      : {
          ...state.scene,
          mechanical: { ...state.scene.mechanical, servoAngle: testAngle },
        };

  const highlighted =
    state.findings.find((f) => f.id === state.highlightedFindingId) ?? null;

  return {
    state,
    scene,
    step: stepById(state.activeStepId),
    steps,
    openFindings,
    highlighted,
    trace,
    test,
    leds,
    serial,
    readings,
    testRun,
    announcement,
    toasts,
    dismissToast: dismiss,
    run,
    act,
    start,
    reset,
    setTab,
    setWebMcpAvailable,
    busy: state.running !== null,
  };
}

export type AgentSession = ReturnType<typeof useAgentSession>;
