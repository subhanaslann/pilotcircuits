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
/* The run itself moved to `lib/device/run-spec.ts`, one row per build; what
   is left here is applying its beats. */
import type { StagePatch } from "@/lib/device/run-spec";
import {
  initialSession,
  sessionReducer,
  type AgentTab,
  type SessionAction,
  type SessionPatch,
} from "@/lib/agent/session";
import { blockedSteps } from "@/lib/agent/findings";
import { buildFor, type BuildDef } from "@/lib/agent/builds";
import { stepById, toProgressSteps } from "@/lib/agent/steps";
import type { ProjectFilters } from "@/lib/projects/filter";
import { isWebMcpAvailable } from "@/lib/agent/webmcp";
import { applyExpected, maybeNode, node, type NodeId } from "@/lib/circuit/graph";
import {
  effectsOf,
  partOf,
  type PartId,
  type TerminalId,
} from "@/lib/circuit/placement";
import { clear, placeIn, removePart, satisfy } from "@/lib/agent/placement";
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
  /**
   * Attaching one lead to something, or letting go of it.
   *
   * The half of the work the agent cannot do, in the most literal sense this
   * product has: the agent can read the build, say what is wrong and point at
   * it, and it has no hands. `target` is a board hole, another part's free lead,
   * or `null` — which leaves the lead **loose**, not back in the kit. The part
   * goes in the box only when that was its last path to a board hole, and the
   * placement decides that; this action does not say it.
   */
  | { kind: "place"; terminal: TerminalId; target: NodeId | null }
  /**
   * Take a whole part off the bench in one gesture.
   *
   * Not N × `place(lead, null)`. A part is one thing on a desk: pulling its
   * leads out one at a time is N sentences, N undo entries and N intermediate
   * states in which it is half-attached and the drawing has to have an opinion
   * about where it is.
   */
  | { kind: "remove-part"; part: PartId }
  /**
   * `Check this` — read the build and report. **Writes no build state.**
   *
   * This replaced `resolve`, which wrote the correct placement itself and then
   * congratulated the person for it. See the branch in `act` for the argument.
   */
  | { kind: "check"; findingId: FindingId }
  /**
   * W-10's other half: the demo control's shortcut, which DOES write.
   *
   * The old `resolve`, kept whole and moved behind the demo menu — where the
   * interface says out loud that it is driving the build rather than reading
   * it. The film needs a repair it can perform; a learner needs one it cannot.
   */
  | { kind: "repair"; findingId: FindingId }
  /**
   * Take back the last gesture, or put it back.
   *
   * A spatial editor with no undo makes every mis-drop permanent, which is what
   * turned a hit test that missed by a fifth of a pitch into a part that had to
   * be rebuilt from the kit.
   */
  | { kind: "undo" }
  | { kind: "redo" }
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
  /**
   * Chapter one's single lamp, which is not one of the capstone's two
   * indicator LEDs and was borrowing the green one's flag to get itself drawn.
   * A build with a lamp says so through its run's beats; a build without one
   * never sets this.
   */
  const [lamp, setLamp] = useState<{ lit: boolean; breathing: boolean }>();
  /**
   * Chapter two's three lights, which neither of the two flags above can say.
   *
   * `lamp` is one lamp — lit, and whether it is swelling — and `leds` is the
   * capstone's fixed pair of status indicators, green and red, which are not
   * the build's subject at all. A traffic light asks one question those two
   * have no vocabulary for: *which* light. So three named booleans, and
   * "all three dark" is a real frame rather than the absence of one — it is
   * the frame the run opens on.
   */
  const [lamps, setLamps] =
    useState<{ red: boolean; yellow: boolean; green: boolean }>();
  const [testAngle, setTestAngle] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  /**
   * Say it even when it is the same sentence twice.
   *
   * `setAnnouncement(sameString)` is a React state bail-out: no re-render, no
   * DOM mutation — and a live region is announced when its contents CHANGE, so
   * the second of two identical announcements was silent. Seating two leads
   * into the same hole in a row, or refusing the same drop twice, said nothing
   * the second time, which is exactly when a person most needs to hear that
   * the thing they just did did the same thing again.
   *
   * A zero-width space, alternated, is the smallest change that is a change:
   * the text node differs, the reader announces, and there is nothing to see
   * or to select. A counter would work too, but it would have to live in state
   * beside the sentence and this does not.
   */
  const announce = (text: string) =>
    setAnnouncement((prev) =>
      text === "" || prev.replace(/​$/, "") !== text
        ? text
        : prev.endsWith("​")
          ? text
          : `${text}​`,
    );
  /**
   * The last thing the model said no to.
   *
   * Ephemeral, and deliberately not session state: it is about a gesture that
   * did not happen, so there is nothing for the agent to be asked about and
   * nothing to survive a reload. It exists because a refused drop used to be
   * indistinguishable from an unnoticed one — the part sprang back and the
   * interface said nothing at all, which is the shape of "placing components
   * does not work properly".
   */
  const [refusal, setRefusal] = useState<string | null>(null);
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
  const playTest = (results: TestCheck[], checkIds: string[]) => {
    const spec = buildFor(latest.current.projectId)?.run;
    if (!spec) return;

    const byId = new Map(results.map((check) => [check.subject, check]));
    const failedCount = results.filter((check) => !check.passed).length;
    const last = spec.checks[spec.checks.length - 1];

    /**
     * A row nobody asked for is **skipped**, not passed.
     *
     * `run_functional_test({ test: "servo" })` now runs one check, and the two
     * it did not run must not sit there wearing a green tick. `skipped` is a
     * state `StepLoader` and the dictionary already have; it had no way to be
     * reached until the argument started meaning something.
     */
    const stateOf = (id: string): StepState => {
      const check = byId.get(id);
      if (!check) return "skipped";
      return check.passed ? "passed" : "failed";
    };

    /* A row runs from the moment the one before it settles, and settles at its
       own beat. Derived rather than written out, so a build with two checks and
       a build with three need no different code. */
    const rowsAt = (ms: number): TestRowStates => {
      const rows: TestRowStates = {};
      let opensAt = 0;
      /* The rows the call reported, not the spec read back at apply time: this
         is a picture of the run that happened. */
      for (const id of checkIds) {
        const settlesAt =
          spec.checks.find((check) => check.id === id)?.settlesAt ?? 0;
        rows[id] =
          ms >= settlesAt ? stateOf(id) : ms >= opensAt ? "running" : "idle";
        opensAt = settlesAt;
      }
      return rows;
    };

    /* A measurement replaces the state word, and only on a check that passed
       (rule 9) — a failed row has to keep saying `Failed`. */
    const detailsAt = (ms: number) => {
      const out: Record<string, string> = {};
      for (const check of spec.checks) {
        const found = byId.get(check.id);
        if (ms >= check.settlesAt && found?.passed) out[check.id] = found.detail;
      }
      return out;
    };

    /** What the bench shows, from a beat's own patch. */
    const stage = (patch: StagePatch) => {
      if (
        patch.approach !== undefined ||
        patch.distanceCm !== undefined ||
        patch.sensing !== undefined
      ) {
        setTest((prev) => ({
          approach: patch.approach ?? prev?.approach ?? 0,
          distanceCm:
            patch.distanceCm !== undefined
              ? patch.distanceCm
              : (prev?.distanceCm ?? null),
          sensing: patch.sensing ?? prev?.sensing ?? false,
        }));
      }
      if (patch.leds) setLeds(patch.leds);
      /* Assigned whole, not merged like `lamp` below: a beat of a traffic
         light says what all three lights are doing, because turning one on is
         the same event as turning the last one off. A merge would let a
         forgotten `false` leave two lamps burning at once. */
      if (patch.lamps) setLamps(patch.lamps);
      if (patch.hornAngle !== undefined) setTestAngle(patch.hornAngle);
      if (patch.lit !== undefined || patch.breathing !== undefined) {
        setLamp((prev) => ({
          lit: patch.lit ?? prev?.lit ?? false,
          breathing: patch.breathing ?? prev?.breathing ?? false,
        }));
      }
      /* The device panel's falling reading, from the same beat that printed it
         on the serial port. One number, one place. */
      if (patch.distanceCm !== undefined && patch.distanceCm !== null) {
        const cm = patch.distanceCm;
        setReadings((prev) => [...prev, cm]);
      }
    };

    /* The opening frame: nothing measured, nothing said, every row waiting. */
    setLeds(undefined);
    setLamp(undefined);
    setLamps(undefined);
    setTestAngle(null);
    setTest(undefined);
    setSerial([]);
    setReadings([]);
    setTestRun({
      status: "running",
      rows: rowsAt(0),
      details: {},
      failedCount: 0,
    });

    for (const beat of spec.beats) {
      after(beat.at, () => {
        if (beat.serial) setSerial((prev) => [...prev, beat.serial!]);
        if (beat.stage) stage(beat.stage(latest.current.scene));
      });
    }

    for (const check of spec.checks) {
      const closes = check.id === last?.id;
      after(check.settlesAt, () =>
        setTestRun({
          status: closes ? (failedCount ? "failed" : "passed") : "running",
          rows: rowsAt(check.settlesAt),
          details: detailsAt(check.settlesAt),
          failedCount: closes ? failedCount : 0,
        }),
      );
    }

    /* Only the canvas half clears. The dock keeps the log and the verdict,
       because that is what a person turns to after the run has gone. */
    after(spec.clearsAt, () => {
      setTest(undefined);
      setLeds(undefined);
      setLamp(undefined);
      setLamps(undefined);
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
          /* A finding can name a terminal that is not on the bench — a part
             still in the kit has no pins. Framing what is there beats throwing
             out here, where the failure is invisible: this runs after the tool
             has already settled. */
          const box = boundsOf(
            effect.nodes
              .map((id) => maybeNode(scene, id))
              .filter((found) => found !== undefined),
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
          playTest(effect.results, effect.checks);
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

    /**
     * The headline, composed defensively.
     *
     * It used to be built as an **argument** to `tool/start`, which is
     * dispatched before the try below — so a throw while composing it escaped
     * `execute` altogether: no activity entry was ever created, `tool/settle`
     * never ran, the error toast never fired and nothing was announced. The
     * agent got a raw JS `TypeError` where the handler had a good refusal
     * waiting. `headlineFor` is total now (`services.ts` says why); this is the
     * belt to that pair of braces, because rule 6 cuts both ways — a change
     * nobody sees did not happen, and neither did a refusal.
     */
    let headline: Line;
    try {
      headline = headlineForAny(name, input, before);
    } catch {
      headline = { ns: "activity", k: "readContext" };
    }

    apply({ type: "tool/start", call, headline });

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

    /**
     * A tool that moved the build lands as a **commit**, not as part of its
     * entry.
     *
     * `tool/settle` folds its patch into the state and touches no history, which
     * is right for every reading: undoing "the agent looked at the wiring" is
     * not a thing. `attach_lead` is the one call that does what a person's own
     * hands do, and it has to be takeable back the same way — the alternative
     * is an agent that can put a lead somewhere the person cannot get it out of
     * with `Ctrl+Z`.
     *
     * Applied first and then withheld from the settle, so the patch lands
     * exactly once.
     */
    if (outcome.commits && outcome.patch) {
      apply({ type: "commit", patch: outcome.patch, by: "agent" });
    }

    apply({
      type: "tool/settle",
      callId,
      time: clockOf(Date.now()),
      status: outcome.status,
      result: outcome.result,
      errorMessage: outcome.errorMessage,
      durationMs: Date.now() - call.startedAt,
      outcome: outcome.outcome,
      patch: outcome.commits ? undefined : outcome.patch,
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
    announce(spoken ? say(copy, spoken) : "");

    /**
     * A call that failed says so on screen.
     *
     * The only trace of a refused tool call used to be a red dot in the
     * activity tab, which is not the tab you are on: an agent asking for a
     * finding that had gone, or a hole that was taken, produced a screen that
     * did not move. Rule 6 cuts both ways — a change nobody sees did not
     * happen, and neither did a refusal.
     */
    if (outcome.status === "error" && outcome.errorMessage) {
      push(say(copy, outcome.errorMessage), "error");
    }

    /* Effects run *after* the entry has settled, so a throw in here cannot be
       turned into an error result — the row already says `ok`. What it can do
       is reject the promise the caller is awaiting, and several callers chain
       several tools (`Inspect my build`, every demo scenario). One canvas move
       that cannot be made must not take the rest of a sequence with it. */
    try {
      applyEffects(outcome.effects ?? []);
    } catch {
      /* Deliberately silent, and narrowly so: the tool did what it said and
         the applier is UI only. Every effect that can legitimately miss —
         `focus`, above — handles its own absence rather than relying on this. */
    }
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

    if (action.kind === "undo" || action.kind === "redo") {
      const stack =
        action.kind === "undo"
          ? current.history.past
          : current.history.future;
      if (!stack.length) {
        const nothing: Line = { ns: "user", k: "nothingToUndo" };
        announce(say(copy, nothing));
        return;
      }
      apply({ type: action.kind });
      /**
       * Said as *what came back*, not as "undone" — the sentence has to name
       * the bench you are now looking at or it is a confirmation with no
       * content.
       *
       * Read off `effectsOf`, the same way the gesture itself is narrated, and
       * for the same reason: a sentence built from the record by hand is a
       * second opinion about it. This one was reading `after.placement[moved]`
       * and calling any non-null target a hole, so undoing chapter one's middle
       * join — the one act the chapter is about — announced *"You put the LED's
       * long leg in 220Ω"*, which is not a thing anybody can do. A lead goes
       * into a hole or onto another lead, and those are different sentences.
       */
      const after = latest.current;
      const spec = buildFor(after.projectId)?.placement;
      const moved = spec?.terminals.find(
        (t) => (after.placement[t] ?? null) !== (current.placement[t] ?? null),
      );
      const effects = spec
        ? effectsOf(spec, current.placement, after.placement, moved)
        : undefined;
      const inner: Line = effects?.seated
        ? {
            ns: "user",
            k: "seatedLead",
            args: [
              { ref: "lead", id: effects.seated.terminal, case: "acc" },
              maybeNode(after.scene, effects.seated.hole)?.label ??
                effects.seated.hole,
            ],
          }
        : effects?.joined
          ? {
              ns: "user",
              k: "joinedLeads",
              args: [
                { ref: "lead", id: effects.joined.terminal, case: "acc" },
                { ref: "lead", id: effects.joined.lead, case: "dat" },
              ],
            }
          : effects?.loosened
            ? {
                ns: "user",
                k: "looseLead",
                args: [{ ref: "lead", id: effects.loosened, case: "acc" }],
              }
            : { ns: "user", k: "removedJoin" };
      /* And which of the two this was. Both branches used to be announced as
         `Undone:`, so redo — the control whose whole job is putting a gesture
         back — reported that it had taken one away.

         The inner sentence travels as a `Line`, not as words. `say(copy, inner)`
         here rendered it at gesture time and passed the STRING as an argument —
         and `resolve` returns a non-`Ref` verbatim, so that half never
         re-translated: switch language after an undo and the timeline read
         `Geri alındı: You put the LED's long leg in A5`, one clause in each
         language. It was the only sentence in `src/` frozen into state, and §14
         says there are none. */
      const headline: Line = {
        ns: "user",
        k: action.kind === "undo" ? "undone" : "redone",
        args: [{ ref: "line", line: inner }],
      };
      apply({
        type: "log",
        entry: {
          actor: "user",
          headline,
          status: "ok",
          time: clockOf(Date.now()),
        },
      });
      announce(say(copy, headline));
      return;
    }

    if (action.kind === "inject") {
      /* The two faults are the capstone's. Chapter one has its own and no menu
         that offers this yet, so on any other build the control does nothing
         rather than injecting a parking barrier's mistake into it. */
      if (current.projectId !== "smartParkingBarrier") return;

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
      announce(say(copy, headline));
      return;
    }

    if (action.kind === "place" || action.kind === "remove-part") {
      const spec = buildFor(current.projectId)?.placement;
      if (!spec) return;

      const outcome =
        action.kind === "remove-part"
          ? removePart(current, spec, action.part)
          : placeIn(current, spec, action.terminal, action.target);

      /**
       * A write that did not happen says so, and writes nothing.
       *
       * This is the branch the gesture was missing. `attach` returned the same
       * record on success and on refusal, so `place` committed unconditionally
       * and then announced the move from its own arguments — a person watched
       * the part spring back out of an occupied hole under a sentence saying
       * they had put it there. The model can refuse now, and a refusal is a
       * sentence rather than a silence.
       */
      if (!outcome.changed) {
        if (!outcome.refusal) return;
        /* One arm per `Refusal`, and the last one is a fallback rather than an
           exhaustive switch — so a new member added to the model without a rung
           here does not fail to compile, it says something false. `wireEnd` is
           the first one to arrive since; the same ladder in `services.ts` has
           to grow the same rung, or the agent's own refusal reads as the
           person's. */
        const reason: Line =
          outcome.refusal === "holeTaken"
            ? {
                ns: "errors",
                k: "holeTaken",
                args: [
                  (action.kind === "place" && action.target
                    ? maybeNode(current.scene, action.target)?.label
                    : undefined) ?? "",
                ],
              }
            : outcome.refusal === "leadNotFree"
              ? { ns: "errors", k: "leadNotFree" }
              : outcome.refusal === "wireEnd"
                ? { ns: "errors", k: "wireEnd" }
                : { ns: "errors", k: "sameCircuitPart" };
        setRefusal(say(copy, reason));
        announce(say(copy, reason));
        return;
      }

      /**
       * The sentences, derived from what changed rather than from what was
       * asked for.
       *
       * In the order they happened: what you did to the thing in your hand,
       * then everything that came apart or left the bench because of it. The
       * second half used to be one line about one join, read off `inbound` of
       * the moved lead — so a join stored on the other side, and a whole
       * second part falling off the bench with the first, went unmentioned.
       */
      const { effects } = outcome;
      const lines: Line[] = [];

      if (effects.seated) {
        lines.push({
          ns: "user",
          k: "seatedLead",
          args: [
            { ref: "lead", id: effects.seated.terminal, case: "acc" },
            maybeNode(outcome.patch.scene ?? current.scene, effects.seated.hole)
              ?.label ?? effects.seated.hole,
          ],
        });
      } else if (effects.joined) {
        lines.push({
          ns: "user",
          k: "joinedLeads",
          args: [
            { ref: "lead", id: effects.joined.terminal, case: "acc" },
            { ref: "lead", id: effects.joined.lead, case: "dat" },
          ],
        });
      } else if (effects.loosened) {
        const part = partOf(spec, effects.loosened);
        lines.push(
          part && effects.leftBench.includes(part)
            ? {
                ns: "user",
                k: "removedPart",
                args: [{ ref: "part", lead: effects.loosened }],
              }
            : {
                ns: "user",
                k: "looseLead",
                args: [{ ref: "lead", id: effects.loosened, case: "acc" }],
              },
        );
      } else if (action.kind === "remove-part") {
        lines.push({
          ns: "user",
          k: "removedPart",
          args: [{ ref: "part", lead: spec.anchorOf[action.part] }],
        });
      }

      /* A join the gesture did not name coming apart. `brokeJoins` includes
         the ones `prune` dropped, which is the half nobody was ever told. */
      for (const broke of effects.brokeJoins) {
        lines.push({
          ns: "user",
          k: "releasedJoin",
          args: [{ ref: "lead", id: broke.from, case: "acc" }],
        });
      }

      /* A second part that lost its last hold because this one moved. The part
         the gesture itself removed is already in the headline.

         Named through its anchor lead rather than through `componentOf`, like
         every other part sentence in this file: on chapter two `componentOf`
         answers `resistor` for three different resistors and `jumper` for four
         different cables, so "The Resistor came with it" could not say which. */
      const named =
        action.kind === "remove-part"
          ? action.part
          : effects.loosened
            ? partOf(spec, effects.loosened)
            : undefined;
      for (const part of effects.leftBench) {
        if (part === named) continue;
        lines.push({
          ns: "user",
          k: "cameWithIt",
          args: [{ ref: "part", lead: spec.anchorOf[part] }],
        });
      }

      setRefusal(null);
      /* `commit`, not `patch`: this is one of the person's own gestures, so it
         is a step Ctrl+Z can take back. An agent reading the build is not. */
      apply({ type: "commit", patch: outcome.patch });
      for (const line of lines) {
        apply({
          type: "log",
          entry: {
            actor: "user",
            headline: line,
            status: "ok",
            time: clockOf(Date.now()),
          },
        });
      }
      if (lines.length) {
        announce(lines.map((line) => say(copy, line)).join(" "));
      }
      return;
    }

    /**
     * `Check this` — the button that used to be `I fixed it`.
     *
     * **It is a read.** It never writes `placement`, `scene`, `mechanical`,
     * `repairs`, `repaired`, `completedSteps`, `completedAt` or
     * `activeStepId`. There is no path from here to a mutation of the build.
     *
     * It used to be the opposite: it called `satisfying` and wrote the correct
     * placement itself, then logged the move in the person's own voice and
     * credited them with the repair. A learner who pressed it having changed
     * nothing was told they had put it right, and the product's one claim —
     * *the thing on screen is the thing on your desk* — was broken by the panel
     * that exists to defend it. `verify_current_step` has always done the
     * honest version of this, in the same codebase; this is that, scoped to one
     * finding.
     *
     * The shortcut still exists, behind the demo menu, where the interface says
     * out loud that it is driving the build.
     */
    if (action.kind === "check") {
      const finding = current.findings.find((f) => f.id === action.findingId);
      if (!finding) return;

      const probe = finding.probe;
      const scene = current.scene;
      const resolved = isResolved(finding, scene);
      const spec = buildFor(current.projectId)?.placement;

      /* An endpoint that is not on the bench cannot be compared to anything.
         Saying "still wrong" would name a hole for a part that is in the box. */
      const missing =
        !resolved && probe.kind === "absent-node"
          ? probe.nodeId
          : !resolved && probe.kind !== "servo-alignment"
            ? [
                ...(probe.kind === "absent-connection"
                  ? [probe.from, probe.to]
                  : []),
                ...finding.affectedNodes.map((n) => n.id),
              ].find((id) => !maybeNode(scene, id))
            : undefined;

      const missingPart =
        missing && spec ? partOf(spec, missing) : undefined;

      const subject = finding.highlight.subject ?? "";
      const expectedPin =
        finding.affectedNodes.find((n) => n.mark === "target")?.terminal ?? "";
      const observedPin =
        finding.affectedNodes.find((n) => n.mark === "error")?.terminal ?? "";

      /* Both arms name the part through its LEAD, which is what the finding row
         this button sits on already does. This one asked `finding.component` —
         the counted kind — while the unresolved arm below asked the build, so
         one `if/else` used two naming authorities for the same part: placing
         chapter two's red lamp, then the amber, then the green produced three
         identical rows reading "Checked: the LED is on the bench now", under a
         finding row that said `Red LED`. `componentOf` is no better on that
         bench — it answers `resistor` three times and `jumper` four times. */
      const headline: Line = resolved
        ? finding.type === "part-not-placed"
          ? {
              ns: "activity",
              k: "checkedPartPlaced",
              args: [{ ref: "part", lead: finding.terminal }],
            }
          : probe.kind === "servo-alignment"
          ? { ns: "activity", k: "checkedAligned" }
          : probe.kind === "absent-connection"
            ? { ns: "activity", k: "checkedMatches", args: [subject, ""] }
            : {
                ns: "activity",
                k: "checkedMatches",
                args: [subject, expectedPin],
              }
        : missingPart && missing
          ? {
              ns: "activity",
              k: "checkedUnreachable",
              args: [{ ref: "part", lead: missing }],
            }
          : probe.kind === "servo-alignment"
            ? { ns: "activity", k: "checkedStillTurned" }
            : probe.kind === "absent-connection"
              ? { ns: "activity", k: "checkedStillJoined" }
              : {
                  ns: "activity",
                  k: "checkedStillOpen",
                  args: [subject, observedPin, expectedPin],
                };

      /* The only state this writes: when it last looked, and what it saw.
         Whether the finding is open is still answered by re-reading the graph,
         so the row already says the CURRENT fault rather than the one the
         inspection found — this records only that a check happened, so the
         panel can say "still open" instead of repeating itself in silence. */
      apply({
        type: "patch",
        patch: {
          findings: current.findings.map((f) =>
            f.id === finding.id
              ? {
                  ...f,
                  checkedAt: Date.now(),
                  lastCheck: resolved
                    ? ("resolved" as const)
                    : missingPart
                      ? ("unreachable" as const)
                      : ("open" as const),
                }
              : f,
          ),
          highlightedFindingId: resolved ? null : finding.id,
        },
      });
      apply({
        type: "log",
        entry: {
          actor: "agent",
          headline,
          status: "ok",
          /* The read succeeded either way — `status` is about the check, and
             `tone` is about the build. A check that finds the fault still
             there is not a failed check, and colouring it as one would make
             the honest answer look like a malfunction. */
          ...(resolved ? {} : { tone: "found" as const }),
          time: clockOf(Date.now()),
        },
      });
      announce(say(copy, headline));
      return;
    }

    /**
     * W-10 · the demo control's repair. **The only thing left that writes a
     * fix on the person's behalf.**
     *
     * This is the old `resolve` branch, unchanged in what it does and moved in
     * who can reach it. It belongs beside `inject`: in the fiction those are
     * the same gesture in two directions — a hand moving a wire — so both
     * commit through this reducer, land in the same timeline, and leave the
     * findings to re-answer themselves off the graph. What it must never be is
     * the button a learner presses to say they have finished, which is what it
     * was.
     */
    if (action.kind === "repair") {
      const finding = current.findings.find((f) => f.id === action.findingId);
      if (!finding) return;

      /* A finding is a snapshot, and this branch is reachable from the demo
         runner, which resolves a whole list against one read. `satisfy` was
         safe to re-apply — it writes the same edge twice. `clear` is not: it
         would undo the repair an earlier entry in the same loop just made. So
         a repair on something already put right is a no-op, for every probe
         kind. */
      if (isResolved(finding, current.scene)) return;

      /* On a build the person assembles, putting a wire right *is* moving a
         lead — so it goes through the placement, which the scene is derived
         from. Writing `observed` directly would leave the two disagreeing about
         where the part is, and the drawing would still show it in the old
         hole. */
      const spec = buildFor(current.projectId)?.placement;
      const probe = finding.probe;
      const outcome =
        probe.kind === "servo-alignment"
          ? {
              patch: {
                scene: {
                  ...current.scene,
                  mechanical: {
                    ...current.scene.mechanical,
                    servoAngle: current.scene.mechanical.expectedAngle,
                  },
                },
              } satisfies SessionPatch,
              changed: true,
            }
          : probe.kind === "absent-connection"
            ? /* The fix for a join the sketch does not ask for is a removal,
                 and `satisfying` cannot express one. There is no fallback for a
                 build with no placement: chapter six's observed ids are always
                 expected ids, so `extras()` never returns anything there and
                 this probe kind cannot arise on it. */
              spec
              ? clear(current, spec, probe.connectionId, {
                  from: probe.from,
                  to: probe.to,
                })
              : { patch: {} as SessionPatch, changed: false }
            : probe.kind === "absent-node"
              ? /* Nothing to shortcut: a part comes out of the box by hand,
                   and the demo has no story in which it does not. */
                { patch: {} as SessionPatch, changed: false }
              : spec
                ? satisfy(current, spec, probe.connectionId)
                : {
                    patch: {
                      scene: applyExpected(current.scene, probe.connectionId),
                    } satisfies SessionPatch,
                    changed: true,
                  };

      /* A shortcut the model declined writes nothing and says nothing. It used
         to commit an identical record and announce a move it had not made. */
      if (!outcome.changed) return;

      const target = finding.affectedNodes.find((n) => n.mark === "target");
      /* A cable or a leg. Chapter one's joins are the parts' own legs, so
         "the wire moved" would name a thing that is not in the kit. */
      const medium =
        probe.kind === "connection"
          ? current.scene.expected.find((c) => c.id === probe.connectionId)
              ?.medium
          : undefined;
      const headline: Line =
        probe.kind === "servo-alignment"
          ? { ns: "user", k: "remountedServo" }
          : probe.kind === "absent-connection"
            ? { ns: "user", k: "removedJoin" }
            : {
                ns: "user",
                k: medium === "leg" ? "movedLead" : "movedWire",
                args: [finding.highlight.subject ?? "", target?.terminal ?? ""],
              };

      apply({
        type: "patch",
        patch: {
          ...outcome.patch,
          highlightedFindingId: null,
          /* `placeIn` counts its own repairs from the drop in open findings;
             the servo has no placement to count, so it says so here. */
          repairs: outcome.patch.repairs ?? current.repairs + 1,
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
      announce(say(copy, headline));
      return;
    }
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

  /**
   * Put a build on the bench.
   *
   * Idempotent for the build already there, so a remount is not a reset — see
   * the reducer. Walking into a different chapter's bench does start over,
   * which is the honest reading of "one build, several screens".
   */
  const openBuild = (build: BuildDef) => apply({ type: "openBuild", build });

  /**
   * The other half of walking to a different bench.
   *
   * `openBuild` restarts the **reducer** — the placement, the scene, the step,
   * the findings, the timeline. Everything on this side of the hook is
   * ephemeral by design and lives outside it, so none of it was touched: walk
   * from chapter one to chapter two without a reload and the dock still holds
   * the lamp's serial log and its three verdict rows, the canvas is still
   * carrying whatever the last film left lit, and any beat still in flight
   * fires into a bench that is no longer the one it was measuring. The WebMCP
   * audit named this case exactly; nothing failed, which is what made it worth
   * writing down.
   *
   * The same cleanup `reset` does, minus the announcement — nobody pressed
   * anything, and "the board is back to the beginning" is not what happened.
   *
   * Guarded on a *change* rather than left to the dependency list, which also
   * fires on mount: a fresh session has nothing to clear, and two of these
   * setters mint new arrays, so an unguarded run would cost every mount a
   * second render to arrive back where it started.
   */
  const benched = useRef(state.projectId);
  useEffect(() => {
    if (benched.current === state.projectId) return;
    benched.current = state.projectId;
    clearTimers();
    setTrace(undefined);
    setTest(undefined);
    setLeds(undefined);
    setLamp(undefined);
    setLamps(undefined);
    setTestAngle(null);
    setSerial([]);
    setReadings([]);
    setTestRun(idleRun);
    /* And the last thing the model said no to, which named a lead of a build
       that is not on the bench any more. */
    setRefusal(null);
    /* The bench, and nothing else. `clearTimers` is a plain function — this
       project compiles with the React Compiler, so nothing here is wrapped in
       `useCallback` — and a list holding a value that is new on every render
       is not a list. The ref above is what actually decides when this runs. */
  }, [state.projectId]);

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
    /* `lamp` was missing from this list, and the omission was reachable:
       `clearTimers()` above kills the run's own `clearsAt`, so pressing Reset
       mid-film left chapter one's LED lit on a board that had just been put
       back to the beginning. */
    setLamp(undefined);
    setLamps(undefined);
    setTestAngle(null);
    setSerial([]);
    setReadings([]);
    setTestRun(idleRun);
    announce(say(copy, { ns: "activity", k: "reset" }));
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
    /** Chapter one's lamp while its run is playing. Undefined otherwise. */
    lamp,
    /** Chapter two's three lights, likewise — and only while its run plays. */
    lamps,
    serial,
    readings,
    testRun,
    announcement,
    /** Whether there is anything to take back, for the controls that offer it. */
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
    refusal,
    clearRefusal: () => setRefusal(null),
    toasts,
    dismissToast: dismiss,
    run,
    act,
    start,
    openBuild,
    reset,
    setTab,
    setWebMcpAvailable,
    busy: state.running !== null,
  };
}

export type AgentSession = ReturnType<typeof useAgentSession>;
