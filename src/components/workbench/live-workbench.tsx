"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AgentWorkspace } from "@/components/agent/workspace";
import type { AgentSession } from "@/components/agent/use-agent-session";
import { type CanvasHandle } from "@/components/canvas/canvas-viewport";
import { AgentMascot } from "@/components/canvas/agent-mascot";
import { BuildSceneView } from "@/components/canvas/build-scene";
import { buildFor, defaultBuild } from "@/lib/agent/builds";
import { DeviceDock, type DeviceTab } from "@/components/device/dock";
import { DeviceInfo } from "@/components/device/device-info";
import { SerialMonitor } from "@/components/device/serial-monitor";
import { TestOutput } from "@/components/device/test-output";
import { ToastViewport } from "@/components/ui/status";
import { DemoControls } from "@/components/workbench/demo-menu";
import { demoScenarios } from "@/components/workbench/demo-scenarios";
import { ChapterBriefing } from "@/components/workbench/briefing";
import { WorkbenchFrame } from "@/components/workbench/frame";
import { InspectionModal } from "@/components/workbench/inspection";
import {
  minSpacing,
  zoomToAim,
  type Aim,
} from "@/components/canvas/drag-math";
import { KitStrip } from "@/components/workbench/kit-strip";
import { useAgentMascot } from "@/components/workbench/use-agent-mascot";
import { StepRail, type KitRow } from "@/components/workbench/step-rail";
import { WorkbenchTopbar } from "@/components/workbench/topbar";
import {
  CanvasWorkspace,
  type CanvasView,
} from "@/components/workbench/workspace";
import type { CameraVariant } from "@/components/workbench/camera";
import { useCopy } from "@/content/copy-provider";
import { clockOf } from "@/lib/agent/activity";
import { partNameOf, stepParts } from "@/lib/agent/parts";
import { stepAside, stepWords } from "@/lib/agent/steps";
import type { BriefingDef } from "@/lib/agent/briefings";
import { zoom as zoomLimits } from "@/lib/circuit/geometry";
import { maybeNode, type NodeId } from "@/lib/circuit/graph";
import {
  anchorsFor,
  attachmentOf,
  candidatesFor,
  isFree,
  isHole,
  onBench,
  partOf,
  type PartId,
  type PlacementSpec,
  type TerminalId,
} from "@/lib/circuit/placement";


/**
 * W-04 assembled: the whole workbench, wired to one session.
 *
 * Every control here runs a tool. `Inspect my build` reads the context,
 * compares against the sketch and opens the inspection on what it found —
 * §7's "opened by `Inspect my build` or by the matching WebMCP action", both
 * being the same call. The demo menu drives the same six tools from the other
 * side, and the panel, the rail, the dock and the two canvases all read one
 * store.
 *
 * **Batch 8 · the session and the canvas handles arrive as props.** Batch 7
 * built this component around its own `useAgentSession`, which was right while
 * the only assembly was a lab page. The product needs a build that survives the
 * walk to `/complete`, so the session is now owned by `BuildProvider` and the
 * refs it focuses through are owned there too — this component fills them in
 * and hands them back when it unmounts.
 *
 * The design lab still mounts a session of its own (see
 * `components/lab/workbench/live-workbench.tsx`). Playing at `/lab/workbench`
 * must not move the build the product is carrying, and one component taking a
 * session as an argument is how both are true at once.
 */

/** The finished build: what the sketch defines, both faults corrected. */
/**
 * The finished build, for the compare view.
 *
 * Read off the bench the session is carrying rather than pinned to the
 * capstone: comparing a breathing lamp against a parking barrier drew every
 * one of its three wires as a mismatch.
 */

/**
 * Hardware values that appear in a step's instruction, in mono (rule 13).
 *
 * One map for every chapter, because one instruction is on screen at a time
 * and a value belonging to another board never appears in it. `Sentence`
 * matches longest first, which is what lets `D13` and `D12` stand beside `D1`.
 *
 * Chapter two's entries are hole addresses as well as pin names, and that is
 * the chapter's own difference: `F7` and `J7` are printed down the side of the
 * breadboard exactly the way `D9` is printed on the header, so an instruction
 * naming one is quoting the plastic. Only the addresses its instructions
 * actually say — the whole ground rail verifies, so `tlGround` names no hole
 * at all, and `tlOthers` says "columns 18 and 19" in prose rather than
 * spelling out eight more. An address here that no sentence contains would be
 * a guess about copy that is already written.
 *
 * `GND` is new to this list and it reaches chapter one too, where step two's
 * instruction has always named it. That was the oversight: the same word was
 * already mono in chapter one's *briefing*, so the bench contradicted the
 * window that had introduced it two screens earlier.
 */
const INSTRUCTION_MONO = {
  /* The capstone and chapter one. */
  D7: "target",
  D8: "default",
  D9: "default",
  D3: "default",
  D2: "default",
  /* Chapter one and two both: the pin the board prints `GND` beside. */
  GND: "default",
  /* Chapter two: the three drive pins, and the red lamp's four holes.
     `F8` is here because `F7` is — one of a pair set in mono and the other
     left as prose is worse than neither. */
  D13: "default",
  D12: "default",
  D11: "default",
  F7: "default",
  F8: "default",
  J7: "default",
  H8: "default",
  /* Chapter three: the supply pin its power step names, the two holes its
     sensor step names, and the four its lamp step does. `GND`, `D2` and `D13`
     are already above — three chapters now print the same three words, which
     is the argument for this being one table rather than one per build. */
  "5V": "default",
  A29: "default",
  E29: "default",
  F9: "default",
  F10: "default",
  J9: "default",
  H10: "default",
  /* Chapter four. `A0` is the one address in this product a person meets for
     the first time in its own chapter, and the two holes its probe step names.
     Longest-first matching in `Sentence` is what keeps `A0` out of `A28`. */
  A0: "default",
  A28: "default",
  E28: "default",
  /* Chapter five: its own two columns. `F8` is already above (chapter two's
     red lamp stands in it too), and so are `D7`, `D8`, `D9` and `D13` — five
     chapters printing the same handful of addresses is the argument for this
     being one table rather than one per build. */
  J8: "default",
  H9: "default",
  /* Printed on the part, and named by four chapters' kit steps. Every briefing
     row already sets it (`briefings.ts`), so the bench printing it as prose was
     the same four characters set two ways two screens apart — the inconsistency
     this map exists to stop. Deliberately reaches chapters one and two as well. */
  "220Ω": "default",
} as const;

export function Workbench({
  session,
  canvas,
  camera,
  backHref,
  briefing,
  onBriefed,
  onFinish,
  wide,
  cameraVariant = "plate",
  className,
}: {
  session: AgentSession;
  /** The workbench canvas. Owned by the caller so focus outlives this mount. */
  canvas: RefObject<CanvasHandle | null>;
  /** The inspection's camera pane — `null` while the modal is closed. */
  camera: RefObject<CanvasHandle | null>;
  /** Where the back arrow goes: the project in the product, the lab in the lab. */
  backHref: string;
  /**
   * The chapter briefing, when this arrival opens with one.
   *
   * Handed in rather than looked up, because *whether* it plays is a fact
   * about the arrival — the route decides it once, on the way in.
   */
  briefing?: BriefingDef;
  /** Called when the briefing hands the bench over. */
  onBriefed?: () => void;
  /**
   * Where the build ends, when there is somewhere for it to end.
   *
   * Given, the pinned action becomes `Finish` once the last step is verified —
   * an offer, not a redirect. Absent (the lab, which has no completion screen),
   * the foot keeps Batch 7's behaviour exactly.
   *
   * A callback rather than an `href` because the summary is only true if the
   * session reaches it: a real link here would reload the document and the
   * build would be gone by the time the page it opened tried to report on it.
   */
  onFinish?: () => void;
  /** Overrides the media query, so the lab can show the folded layout. */
  wide?: boolean;
  /**
   * W-06, settled: **`plate`**. The frame is evidence, not a photograph — the
   * label and the capture time sit under the image in the interface's own
   * voice rather than burned into it. `capture` is still built and still live
   * at `#w-camera`, as the direction this was chosen over.
   */
  cameraVariant?: CameraVariant;
  className?: string;
}) {
  const copy = useCopy();

  /**
   * The agent, on the bench.
   *
   * Watches the session rather than any of the controls below, so a call that
   * arrives through WebMCP is exactly as visible as one made by pressing the
   * button beside it — which is the claim the whole product rests on, finally
   * made in the one register nobody can miss.
   */
  useAgentMascot(session);

  const railRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [view, setView] = useState<CanvasView>("current");
  const [dockOpen, setDockOpen] = useState(false);
  const [dockTab, setDockTab] = useState<DeviceTab>("serial");
  const [inspecting, setInspecting] = useState(false);
  const [capturedAt, setCapturedAt] = useState("");
  const instructionRef = useRef<HTMLHeadingElement>(null);
  /** The lead in the person's hand, if any. Local: it is a gesture, not a fact
   *  about the build, and nothing outside this screen may ask about it. */
  const [picking, setPicking] = useState<TerminalId | null>(null);
  /** What a dragged lead would land on. Same reasoning: a gesture. */
  const [hoverTarget, setHoverTarget] = useState<NodeId | null>(null);
  /**
   * A release that reached the bench and committed nothing.
   *
   * Ephemeral, and not session state: it is about a gesture that did not
   * happen. It exists because the honest answer to a mis-aim — *nothing
   * changed* — is invisible without one, and an interface that answers a
   * gesture with an unchanged screen is one the person reads as broken.
   */
  const [nearMiss, setNearMiss] = useState<"miss" | "ambiguous" | null>(null);
  const [handedOver, setHandedOver] = useState(false);
  /** The control the gesture started on, so the caret can go back to it. */
  const origin = useRef<HTMLElement | SVGElement | null>(null);
  /** The lead a finished gesture owes a focus restore to. */
  const pendingRestore = useRef<TerminalId | null>(null);

  /**
   * Focus lands on the instruction *after* the briefing has gone.
   *
   * Not inside the click handler: the header is `inert` while the briefing is
   * up, and an inert element cannot take focus — a synchronous `focus()` there
   * runs one commit too early and silently does nothing. "Here is the bench"
   * means "now read what to do", so this is the sentence that gets it.
   */
  useEffect(() => {
    if (handedOver) instructionRef.current?.focus();
  }, [handedOver]);

  const { state, step, steps, highlighted } = session;
  const inspected = state.inspectedStepId === state.activeStepId;

  /* What an agent does when asked to look at a build: read the context,
     compare against the sketch, then show the frame it compared. */
  const inspect = async () => {
    setCapturedAt(clockOf(Date.now()));
    setInspecting(true);
    await session.run("get_build_context", {});
    await session.run("inspect_build", { scope: "current_step" });
  };

  /**
   * G-14 · the one action in the pinned foot.
   *
   * `BuildStepDef.suggestion` has been sitting in `steps.ts` since Batch 4
   * waiting for a screen with a foot to put it in. A step nobody has inspected
   * yet is offered an inspection first, whatever it suggests afterwards — the
   * agent cannot verify what it has not read.
   *
   * Batch 8 adds one rung above all of them: a finished build is offered its
   * summary. It sits first because it is the only one that is true about the
   * *build* rather than about the step you are standing on.
   */
  const kind =
    onFinish && state.completedAt !== null
      ? "finish"
      : !inspected && step.connections.length
        ? "inspect"
        : step.suggestion;

  const action = {
    inspect: { id: "inspect", label: copy.workbench.inspect, run: inspect },
    verify: {
      id: "verify",
      label: copy.workbench.verify,
      run: () => void session.run("verify_current_step", {}),
    },
    /* A step with nothing to compare still closes by being verified, and the
       label is the same because the gesture is. */
    next: {
      id: "next",
      label: copy.workbench.verify,
      run: () => void session.run("verify_current_step", {}),
    },
    runTest: {
      id: "run-test",
      label: copy.workbench.runFullTest,
      run: () =>
        void session.run("run_functional_test", { test: "full_system" }),
    },
    finish: {
      id: "finish",
      label: copy.workbench.finish,
      run: () => onFinish?.(),
    },
  }[kind];

  const build = buildFor(state.projectId) ?? defaultBuild;
  const referenceScene = build.reference;
  const scene = view === "reference" ? referenceScene : session.scene;
  const parts = stepParts(scene, step.id);

  /* --- The kit, on a build the person assembles ------------------------- */

  const spec = build.placement;

  /**
   * Every answer the placement model owes this render, asked once.
   *
   * `candidatesFor` and `onBench` both walk the whole placement, and four
   * things below need the same walk. Asking the model here and passing the
   * answers down is also the rule this file exists to keep: nothing under it
   * may work out for itself what is on the bench.
   */
  const anchors = useMemo(
    () => (spec ? anchorsFor(spec, state.placement) : []),
    [spec, state.placement],
  );
  const benchParts = useMemo(
    () => new Set(anchors.map((anchor) => anchor.part)),
    [anchors],
  );
  const freeLeads = useMemo(
    () =>
      new Set(
        spec
          ? spec.terminals.filter((t) => isFree(spec, state.placement, t))
          : [],
      ),
    [spec, state.placement],
  );

  /**
   * Everywhere the lead in hand may go — **the** list, for the shelf, the
   * bench and the picker alike.
   *
   * Memoised on the placement rather than rebuilt per render, and passed by
   * identity: `SeatPicker` keys an effect on this array, and a fresh one every
   * render snatches the keyboard selection back to the first hole in the middle
   * of choosing — the first time a toast expires.
   *
   * Empty while nothing is in hand, which is not a hole in the shelf's gesture:
   * `usePartDrag` raises `onPick` on pointer *down*, so this has been recomputed
   * for the lead being carried before the first move, and a drop has to travel.
   */
  /**
   * The same answer, asked for at the moment of a press.
   *
   * The memoised `targets` below cannot be that: it is derived from what is in
   * hand, which is React state, so between the press and the render it causes
   * the list is empty. A gesture that starts and finishes inside one task —
   * a fast flick, and every scripted one — then resolves against no candidates
   * and reads as *carried clear of the bench*, which is the destructive answer.
   */
  const candidateNodes = (terminal: TerminalId) =>
    spec
      ? candidatesFor(spec, state.placement, terminal)
          .map((id) => maybeNode(session.scene, id))
          .filter((node) => node !== undefined)
          .sort(
            (a, b) =>
              spec.grabPoint(a).x - spec.grabPoint(b).x ||
              spec.grabPoint(a).y - spec.grabPoint(b).y,
          )
      : [];

  const targets = useMemo(
    () =>
      spec && picking
        ? candidatesFor(spec, state.placement, picking)
            .map((id) => maybeNode(session.scene, id))
            .filter((node) => node !== undefined)
            /* Sorted where the marks are drawn, not by kind. `candidatesFor`
               answers holes first and leads after, which is an answer about the
               model; this array is the roving tabindex's order, the arrow-key
               order and Home/End — and the picker's own doc calls it "the order
               they read on screen". A free lead's diamond is painted between
               two holes, so unsorted, ArrowRight stepped over the mark beside
               it and reached it fourteen presses later. */
            .sort(
              (a, b) =>
                spec.grabPoint(a).x - spec.grabPoint(b).x ||
                spec.grabPoint(a).y - spec.grabPoint(b).y,
            )
        : [],
    [spec, state.placement, picking, session.scene],
  );

  /* --- One gesture, wherever it starts ---------------------------------- */

  /**
   * A part whose lead is being chosen — the question that comes *before* where.
   *
   * Placing is two decisions and the bench used to make the first one silently:
   * a press anywhere on an LED committed `anchorOf`, so "move the long leg" was
   * only reachable through an 8-unit ring one pitch from its twin. A click on
   * the part now asks, and nothing is in hand until it is answered — which is
   * why this and `picking` are exclusive and each clears the other.
   */
  const [choosingPart, setChoosingPart] = useState<PartId | null>(null);

  const endPick = (terminal: TerminalId) => {
    pendingRestore.current = terminal;
    setPicking(null);
    setHoverTarget(null);
  };

  const pick = (terminal: TerminalId | null) => {
    /* A new gesture clears the last one's failure. The sentence is about the
       release that just happened, not a standing condition. */
    setNearMiss(null);
    setChoosingPart(null);
    session.clearRefusal();
    if (terminal === null) {
      if (picking) endPick(picking);
      return;
    }
    /* Read off `document.activeElement`, because none of the three surfaces
       that raise a pick hands over an event — the rail, the shelf and the bench
       all pass an id and nothing else. It is exact on the keyboard, which is
       the route that needs it: a click has already focused the button, and
       `Enter` on a lead handle happens on the handle. A pointer press on the
       canvas focuses the handle a moment *after* this runs, which is why the
       restore below is a chain and does not trust this alone. */
    const focused = document.activeElement;
    origin.current =
      (focused instanceof HTMLElement || focused instanceof SVGElement) &&
      focused !== document.body
        ? focused
        : null;
    setPicking(terminal);
  };

  /**
   * A closer look, once the gesture has turned out to be a **click**.
   *
   * At the opening fit the whole board is in view and the fifteen header holes
   * are about 9 CSS px apart — under half of WCAG 2.5.8's 24 px, and a
   * precision no pointer has. A wider catch radius cannot fix that: the
   * boundary between two holes is half the gap however wide the radius is.
   *
   * This is the one place the view moves on its own, and it is bounded four
   * ways so it does not become the re-fit rule 6 forbids: only after a pick-up,
   * which is a change the person just made; only when that pick-up was a click
   * rather than a drag, because zooming mid-drag pulls the board out from under
   * the hand that is already reaching; only upwards; and only from a zoom that
   * is genuinely below the floor, so anybody who has already looked closer is
   * left exactly where they are.
   */
  const closer = (terminal: TerminalId) => {
    const view = canvas.current;
    if (!spec || !view) return;
    const marks = candidatesFor(spec, state.placement, terminal)
      .map((id) => maybeNode(session.scene, id))
      .filter((n) => n !== undefined)
      .map((n) => spec.grabPoint(n));
    if (marks.length < 2) return;
    const needed = zoomToAim(
      view.getScale(),
      minSpacing(marks.map((at, i) => ({ id: String(i), at }))),
    );
    if (needed === null) return;
    const xs = marks.map((m) => m.x);
    const ys = marks.map((m) => m.y);
    view.focusOn(
      {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      },
      { scale: needed, animate: true },
    );
  };

  /**
   * Rule 14, and objection 18: the caret goes back to whatever started this.
   *
   * In an effect rather than in the commit, because the control the gesture
   * started on is often the one the commit unmounts — the shelf row of a part
   * that has just left the box, the picker's own marks — and a `focus()` fired
   * while that element is still in the document lands on something about to go,
   * which drops the caret on `<body>` with nothing announced.
   *
   * Then a chain, because a single rail selector is null the moment the lead
   * that moved is not one this step lists, and `?.focus()` on null is the same
   * silent drop. The last rung is the instruction rather than the canvas: the
   * canvas takes no focus of its own — it is a region holding controls, not a
   * control — and the sentence above it is the one thing on this screen that
   * always says what to do next.
   */
  useEffect(() => {
    const terminal = pendingRestore.current;
    if (terminal === null || picking !== null) return;
    pendingRestore.current = null;

    if (origin.current?.isConnected) {
      origin.current.focus();
      return;
    }
    const rail = railRef.current;
    const row =
      rail?.querySelector<HTMLButtonElement>(
        `footer button[data-terminal="${terminal}"]`,
      ) ??
      rail?.querySelector<HTMLButtonElement>("footer button[data-terminal]");
    (row ?? instructionRef.current)?.focus();
  }, [picking]);

  /**
   * Escape puts the lead down, from anywhere.
   *
   * The picker has always answered Escape — but only with focus inside it, and
   * a *pointer* pick never gets there: the press leaves focus on the shelf
   * button it started from. So the one way out of "holding a lead" was to
   * complete the gesture, which is not a way out. At document level it works
   * however the pick started, which is the only version of a cancel worth
   * having.
   */
  useEffect(() => {
    if (!picking && !choosingPart) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      /* The two questions come off in the order they went on: Escape while
         choosing a lead puts the part down, not the build. */
      if (choosingPart) setChoosingPart(null);
      else pick(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  /**
   * The shortcuts everyone already has in their fingers.
   *
   * Guarded on a build the person assembles and on nothing being typed into:
   * the bench has no text fields today, and the day it does, Ctrl+Z belongs to
   * whatever the caret is in.
   */
  useEffect(() => {
    if (!spec) return;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;
      if (!event.ctrlKey && !event.metaKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      event.preventDefault();
      session.act({
        kind: key === "y" || event.shiftKey ? "redo" : "undo",
      });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  /** What the picker and the rail commit: the lead in hand goes somewhere. */
  const seat = (target: NodeId | null) => {
    if (!picking) return;
    session.act({ kind: "place", terminal: picking, target });
    endPick(picking);
  };

  /**
   * The drop at the end of a drag, from the shelf or from the bench.
   *
   * It names its lead rather than reading `picking`, because a drop commits at
   * the end of the same gesture that picked it up — asking what is in hand would
   * be asking a state update that has not landed yet.
   */
  const seatLead = (terminal: TerminalId, target: NodeId | null) => {
    session.act({ kind: "place", terminal, target });
    endPick(terminal);
  };

  /**
   * What a release means, decided by how far it landed from anything.
   *
   * Three intentions, not two. A drop that hit nothing used to mean *let this
   * lead go* whatever the distance, so the failure mode of a mis-aim was the
   * part going back in the box with no undo and no sentence — a nudge one hole
   * sideways that fell 0.2 units short read exactly like a deliberate lift-off.
   *
   *   · `target`    — commit it.
   *   · `ambiguous` — two candidates too close to tell apart. Commit nothing
   *                   and leave the lead in hand: the picker is already up, it
   *                   can name both, and it is the route a keyboard shares.
   *   · `miss`      — aimed at the board and landed between holes. Nothing
   *                   commits, the part springs back, and the interface says so
   *                   rather than looking like it did not notice.
   *   · `away`      — carried clear of everything. This is the removal.
   */
  const release = (terminal: TerminalId, aim: Aim) => {
    setNearMiss(null);
    if (aim.kind === "target") {
      seatLead(terminal, aim.id);
      return;
    }
    if (aim.kind === "away") {
      seatLead(terminal, null);
      return;
    }
    /* Still in hand. The picker keeps the choice — which is the one path in
       this product that can be precise at any zoom and on any input device. */
    setHoverTarget(aim.kind === "ambiguous" ? aim.near : null);
    setNearMiss(aim.kind);
  };

  /**
   * A lead in hand is a gesture about the bench, and the other two views are
   * pictures — so switching away puts it down, rather than leaving the header
   * telling somebody to choose a hole on a drawing that offers none.
   *
   * No focus restore on this one, deliberately: nobody finished a gesture here,
   * they pressed the view switch, and that is where the caret belongs.
   */
  const changeView = (next: CanvasView) => {
    if (next !== "current") {
      setPicking(null);
      setHoverTarget(null);
    }
    setView(next);
  };

  /* --- What the model says, in the words of the interface ---------------- */

  /** The lead in hand, in the case a sentence acts on it. */
  const pickedObject = picking ? copy.build.leadObject[picking] : "";

  /**
   * Whether the header may promise a lead to clip onto.
   *
   * `chooseWhy` says a lead can go into a hole **or onto a free lead of another
   * part**, and half of that is false whenever every lead on the bench is
   * already in one. Chapter one reaches that state on its most likely wrong
   * turn — both of the LED's legs pushed into the header — and the person then
   * aims at the LED to bridge the gap, finds nothing offered there, and has
   * been told by this very sentence that there should be.
   *
   * Read off `targets`, which is the list the picker is actually drawing, so
   * the sentence cannot disagree with the marks. `parts.length > 1` because on
   * a bench with one part there is nothing to clip onto in principle and the
   * absence needs no explaining.
   */
  const noFreeLead =
    Boolean(picking) &&
    benchParts.size > 1 &&
    targets.every((target) => target.kind !== "terminal");

  /**
   * The leads the picker is *not* offering, and why the LED looks empty.
   *
   * Every lead of another part that is on the bench and already holding
   * something. `candidatesFor` leaves them out — correctly, they cannot be hit
   * — and the bench then had nothing at all where the person was aiming.
   */
  const blockedLeads = useMemo(
    () =>
      !spec || !picking
        ? []
        : spec.terminals
            .filter(
              (t) =>
                partOf(spec, t) !== partOf(spec, picking) &&
                benchParts.has(partOf(spec, t) ?? "") &&
                !isFree(spec, state.placement, t),
            )
            .map((t) => maybeNode(session.scene, t))
            .filter((n) => n !== undefined),
    [spec, picking, benchParts, state.placement, session.scene],
  );

  const pickedPart = spec && picking ? partOf(spec, picking) : undefined;
  const leadActions =
    spec && picking
      ? [
          ...(isFree(spec, state.placement, picking)
            ? []
            : [
                {
                  label: copy.workbench.leaveLoose,
                  onClick: () => seat(null),
                },
              ]),
          ...(pickedPart && onBench(spec, state.placement, pickedPart)
            ? [
                {
                  label: copy.workbench.backToKit,
                  onClick: () => {
                    session.act({ kind: "remove-part", part: pickedPart });
                    endPick(picking);
                  },
                },
              ]
            : []),
        ]
      : undefined;

  /* What the last release did not do. The model's own refusal outranks the
     bench's, because it is the more specific of the two. */
  const refusalLine =
    session.refusal ??
    (nearMiss === "ambiguous"
      ? copy.agentPanel.errors.tooClose
      : nearMiss === "miss"
        ? copy.agentPanel.errors.noTarget
        : null);

  /**
   * Which parts travel when this one does.
   *
   * A part held up by another part's lead hangs off it, so lifting the one in
   * your hand lifts everything downstream. One forward pass is enough:
   * `anchorsFor` returns parts in an order where whatever holds a part up comes
   * before it.
   */
  const dependentsOf = (part: PartId): PartId[] => {
    const carried: PartId[] = [];
    const holding = new Set([part]);
    for (const anchor of anchors) {
      if (anchor.intoHole || holding.has(anchor.part)) continue;
      const owner = spec ? partOf(spec, anchor.target) : undefined;
      if (owner && holding.has(owner)) {
        holding.add(anchor.part);
        carried.push(anchor.part);
      }
    }
    return carried;
  };

  const rowFor = (
    s: PlacementSpec,
    terminal: TerminalId,
    lead: string | null,
  ): KitRow => {
    /* Every terminal belongs to a part — `builds.ts` throws at boot if one does
       not — so this is a total lookup and not a fallback. */
    const part = partOf(s, terminal) ?? "";
    const attached = attachmentOf(s, state.placement, terminal);
    return {
      terminal,
      component: s.componentOf[part],
      lead,
      /* The four states, and the one that could not be said before: a lead
         clipped to another lead is `joined`, and it is neither in a hole nor
         loose. `attachmentOf` is what makes that readable from either side of
         the join, since the edge is only ever stored on one of them. */
      state: !benchParts.has(part)
        ? "inKit"
        : attached === undefined
          ? "loose"
          : isHole(s, attached)
            ? "seated"
            : "joined",
    };
  };

  /**
   * The rail's rows: one per lead the step is about, or one per part when the
   * step is about the box.
   *
   * Derived from the step's own connections through `stepParts`, so the rail
   * cannot drift from what the step asks for. `Check your kit` owns no
   * connection and gets the whole-part reading, keyed by the lead a shelf drag
   * commits; a step that names no part at all — the upload — gets no rows, and
   * the foot stays off a screen with no kit on it.
   */
  /**
   * The same leads, said out loud with the hole that is holding them.
   *
   * The struck marks say *these are not available*; this says **why**, and the
   * why is the one fact the drawing cannot carry — a leg standing in `D13` and
   * a leg hanging in the air beside `D13` are the same picture, which is the
   * ambiguity this whole chapter turns on. Told only that "no lead is free",
   * a person looking straight at the leg they need reads it as the bench
   * being broken; told that it is in `D13`, they know the move.
   *
   * Only leads held by a **hole** are named: one held by another lead is not
   * "in" anything a person can point at.
   */
  const blockedWhere = !spec
    ? ""
    : blockedLeads
        .map((lead) => {
          const held = attachmentOf(spec, state.placement, lead.id);
          if (!held || !isHole(spec, held)) return null;
          return copy.workbench.lead.blockedLead(
            copy.build.leads[lead.id],
            maybeNode(session.scene, held)?.label ?? held,
          );
        })
        .filter((line) => line !== null)
        .join(" ");

  const kitRows: KitRow[] = !spec
    ? []
    : parts.terminals.length
      ? parts.terminals.map((terminal) =>
          rowFor(spec, terminal, copy.build.leads[terminal]),
        )
      : parts.components.length
        ? spec.parts.map((part) => rowFor(spec, spec.anchorOf[part], null))
        : [];

  const kit = spec
    ? {
        rows: kitRows,
        picking,
        /* A rail row is always a click, never the start of a drag, so the
           closer look is owed immediately. */
        onPick: (terminal: TerminalId | null) => {
          pick(terminal);
          if (terminal) closer(terminal);
        },
      }
    : undefined;

  /**
   * The bench's half of the same gesture.
   *
   * A lead already on the bench can be carried to another hole, onto another
   * part's free lead, or off everything — and the last of those is the whole
   * point: putting a lead in is only a decision if taking it back out is one
   * gesture and not a menu. A drop that lands on nothing leaves the lead loose,
   * which is what happens on a desk when you pull a leg out and let go; the part
   * goes back in the box only when that was its last hold on the board, and the
   * placement decides that, not this.
   *
   * `view === "current"` only. Compare draws the reference over the top, and a
   * grip on a doubled drawing is a control that cannot honour itself.
   */
  const handling =
    spec && view === "current"
      ? {
          toScene: (clientX: number, clientY: number) =>
            canvas.current?.toScene(clientX, clientY) ?? { x: 0, y: 0 },
          aimAt: spec.grabPoint,
          nameFor: (terminal: TerminalId) =>
            copy.workbench.lead.move(copy.build.leadObject[terminal]),
          glyphFor: spec.leadGlyph,
          onChoosePart: (part: PartId) => {
            /* Written straight, not through `pick(null)`.
               `onPick` fires on pointer DOWN and this fires on the release, and
               a press and a release can land in one task — so `pick`'s closure
               still reads `picking === null` and its guard does nothing, which
               left the seat picker's fifteen candidates on screen *underneath*
               the question about which lead they were for. */
            setPicking(null);
            setHoverTarget(null);
            setNearMiss(null);
            session.clearRefusal();
            setChoosingPart(part);
          },
          /* The build's own answer to what a part is made of, in the order it
             lists them. The chooser sorts by where they are drawn. */
          leadsOf: (part: PartId) => spec.terminalsOf[part] ?? [],
          partOf: (terminal: TerminalId) => partOf(spec, terminal),
          anchorOf: (part: PartId) =>
            anchors.find((anchor) => anchor.part === part)?.terminal,
          dependentsOf,
          free: freeLeads,
          onPick: pick,
          onSettle: closer,
          onHover: setHoverTarget,
          onRelease: release,
          candidatesFor: candidateNodes,
          scale: () => canvas.current?.getScale() ?? 1,
        }
      : undefined;

  /* Not "all its leads are null": a resistor held up only by a join to a seated
     LED is standing on the bench, and that test would keep offering it on the
     shelf while it is drawn in the board. */
  const inKit = spec ? spec.parts.filter((part) => !benchParts.has(part)) : [];

  /**
   * The kit shelf, stuck to the top of the bench.
   *
   * Only for a build the person assembles, and only on the live views: the
   * reference is a picture of the finished circuit, and a shelf of parts you
   * could drag onto a photograph would be an interface pretending the picture
   * is the bench.
   */
  const kitShelf =
    spec && view !== "reference" && inKit.length > 0 ? (
      <KitStrip
        caption={copy.workbench.kit.tray}
        parts={inKit.map((part) => ({
          part,
          /* The lead a drag off the shelf commits. The build decides it — a
             shelf that spelled out `led.cathode` would be one more place to
             keep chapter one's vocabulary in step. */
          terminal: spec.anchorOf[part],
          component: spec.componentOf[part],
          /* Named off the lead it lands on, not off its component: three 220Ω
             resistors share one component id and a shelf that printed it would
             offer the same row three times over. `partNameOf` is the same table
             the findings speak, so the panel and the shelf cannot call one part
             two things. */
          name: copy.workbench.kit.pickUp(
            partNameOf(copy, spec.anchorOf[part]),
          ),
          /* Which end of it lands. The build knows; the shelf draws it. */
          mark: spec.anchorMark(part),
        }))}
        targets={targets}
        aimAt={spec.grabPoint}
        toScene={(clientX, clientY) =>
          canvas.current?.toScene(clientX, clientY) ?? { x: 0, y: 0 }
        }
        onPick={pick}
        onSettle={closer}
        onHover={setHoverTarget}
        onSeat={seatLead}
        targetsFor={candidateNodes}
        onNear={(aim) =>
          setNearMiss(aim.kind === "ambiguous" ? "ambiguous" : "miss")
        }
        scale={() => canvas.current?.getScale() ?? 1}
      />
    ) : undefined;

  const words = stepWords(copy, step.id);

  return (
    <>
      <WorkbenchFrame
        wide={wide}
        className={className}
        topbar={
          <WorkbenchTopbar
            project={copy.projects[state.projectId].name}
            backHref={backHref}
            steps={steps}
            agentConnected={state.webMcpAvailable}
            onSelectStep={(id) =>
              void session.run("navigate_build_step", {
                step_id: id as typeof step.id,
              })
            }
            demoMenu={
              /* W-10 · development only, the way `builds.ts`'s assertion block
                 is. These controls drive the build on the person's behalf —
                 which is honest theatre while the film is being shown and is
                 the exact affordance the learner's own panel was just stripped
                 of. Shipping both would put the shortcut back one menu over. */
              process.env.NODE_ENV !== "production" ? (
                <DemoControls
                  scenarios={demoScenarios(session, copy)}
                  busy={session.busy}
                />
              ) : undefined
            }
          />
        }
        rail={
          <div ref={railRef} className="h-full">
            <StepRail
              steps={steps}
              parts={parts}
              kit={kit}
              className="h-full"
            />
          </div>
        }
        workspace={
          <CanvasWorkspace
            canvas={canvas}
            /* Rule 9: the word for the *mode* lives in the sentence above the
               canvas, not on fifteen holes. */
            instruction={
              choosingPart && spec
                ? copy.workbench.lead.whichLead(
                    copy.build.parts[spec.componentOf[choosingPart]],
                  )
                : picking
                  ? copy.workbench.lead.choose(pickedObject)
                  : words.instruction
            }
            /**
             * The one line on this screen that always says what to do next —
             * and now also what just failed to happen.
             *
             * A release the model declined, or one that landed between two
             * holes, changes nothing on the bench. Without a sentence here that
             * is a gesture answered by an unchanged screen, which is exactly
             * what "placing components doesn't work properly" looks like from
             * the outside: not a wrong result, an absent one.
             */
            rationale={
              refusalLine ??
              (choosingPart
                ? copy.workbench.lead.whichLeadWhy
                : picking
                  ? noFreeLead
                    ? /* Named where they can be named; the general rule when
                         they cannot — a lead held by another lead is not "in"
                         a hole and has no name to give. */
                      blockedWhere
                      ? copy.workbench.lead.chooseWhyBlocked(blockedWhere)
                      : copy.workbench.lead.chooseWhyNoLead
                    : copy.workbench.lead.chooseWhy
                  : words.rationale)
            }
            aside={
              picking || choosingPart ? undefined : stepAside(copy, step.id)
            }
            /* Named, on screen, while something is in hand — see
               `copy.workbench.leaveLoose`. `Leave it loose` only appears when
               the lead is actually holding something, which is the same
               condition the picker's Delete key has always been offered on;
               `Back in the kit` takes the whole part off in one commit rather
               than one lead at a time. */
            actions={leadActions}
            history={
              spec
                ? {
                    canUndo: session.canUndo,
                    canRedo: session.canRedo,
                    onUndo: () => session.act({ kind: "undo" }),
                    onRedo: () => session.act({ kind: "redo" }),
                  }
                : undefined
            }
            mono={INSTRUCTION_MONO}
            view={view}
            onViewChange={changeView}
            scale={scale}
            onScaleChange={setScale}
            ariaLabel={copy.workbench.region.circuit(
              copy.projects[state.projectId].name,
            )}
            /* The bench holds the lead handles and the seat picker, and a
               canvas that called itself an image would prune every one of them
               out of the accessibility tree. The same condition `handling` is
               built on, spelled out rather than read off it: everything else —
               the capstone, and either of the other two views — is a picture
               and keeps saying so. */
            interactive={spec !== undefined && view === "current"}
            /* Off the row, not off a name. A chapter that framed itself with
               `projectId === "breathingLamp"` would open every later bench on
               the capstone's whole-scene box — the desk, not the build. A row
               with no `fitBox` still means "frame the scene", which is what
               the capstone wants. */
            fitBox={build.fitBox}
            instructionRef={instructionRef}
            kit={kitShelf}
            overlay={
              briefing ? (
                <ChapterBriefing
                  def={briefing}
                  onStart={() => {
                    onBriefed?.();
                    setHandedOver(true);
                  }}
                />
              ) : undefined
            }
          >
            {/* Two builds, two sets of parts. The router, the marks and the
                callout inside both are the same code, and which view draws
                which build is `build-scene.tsx`'s one answer — it used to be
                this ternary, and the copy of it in the inspection modal was
                never kept in step. */}
            <BuildSceneView
              projectId={state.projectId}
              handling={handling}
              scene={scene}
              showLabels={scale >= zoomLimits.labelThreshold}
              highlight={highlighted?.highlight}
              reference={view === "compare" ? referenceScene : undefined}
              successTrace={session.trace}
              /* The lamp's own flag where there is a lamp, the capstone's
                 green indicator where there is not — they are different parts
                 and chapter one was borrowing the barrier's. */
              lit={session.lamp?.lit ?? session.leds?.green}
              breathing={session.lamp?.breathing}
              /* Chapter two's three lights, which neither of the other two
                 flags can say: `lit` is one lamp and `ledState` is the
                 capstone's pair of indicators. */
              lamps={session.lamps}
              ledState={session.leds}
              test={session.test}
              targets={targets}
              picking={
                spec && picking
                  ? {
                      lead: picking,
                      blocked: blockedLeads,
                      attached: attachmentOf(spec, state.placement, picking),
                      hover: hoverTarget ?? undefined,
                      aimAt: spec.grabPoint,
                      /* The node, not its label: only the node knows a hole
                         from a lead, and `res.in` and `res.out` both print
                         `220Ω` — two candidates with one name otherwise. */
                      nameFor: (node) =>
                        node.kind === "terminal"
                          ? copy.workbench.lead.joinTo(
                              pickedObject,
                              copy.build.leadTarget[node.id],
                            )
                          : copy.workbench.lead.seatIn(
                              pickedObject,
                              node.label ?? node.id,
                            ),
                      /* The third thing the lead can do, and the only one with
                         no mark of its own: Delete leaves it loose. The picker
                         says it beside the shortcut, on every candidate, so the
                         one route out of a join is not a gesture you have to
                         guess at. */
                      release: copy.workbench.lead.release(pickedObject),
                    }
                  : undefined
              }
              choosing={choosingPart ?? undefined}
              /* Answering it hands the lead over and takes the closer look the
                 seat picker needs — the same two calls a rail row makes, which
                 is the other route to exactly this state. */
              onPickLead={(terminal) => {
                pick(terminal);
                closer(terminal);
              }}
              onCancelChoose={() => setChoosingPart(null)}
              onSeat={seat}
              /* Offered whenever the lead is held by something, in either
                 direction — a lead with another one clipped ONTO it is not
                 free either, and `place` with a null target clears both. */
              onRemove={
                spec && picking && !isFree(spec, state.placement, picking)
                  ? () => seat(null)
                  : undefined
              }
              onCancelPick={() => pick(null)}
            />

            {/* Last, so it stands on the bench rather than under it — and
                inside the viewport's transform, which is what lets it land on
                a hole rather than near one. It draws nothing at all unless the
                agent is mid-call. */}
            <AgentMascot />
          </CanvasWorkspace>
        }
        dock={
          <DeviceDock
            open={dockOpen}
            onOpenChange={setDockOpen}
            tab={dockTab}
            onTabChange={setDockTab}
            status={session.testRun.status}
            className="shrink-0"
          >
            {dockTab === "device" ? (
              <DeviceInfo
                lastSerial={session.serial[session.serial.length - 1]}
                distance={session.readings.at(-1) ?? null}
              />
            ) : dockTab === "serial" ? (
              <SerialMonitor lines={session.serial} />
            ) : (
              <TestOutput
                states={session.testRun.rows}
                details={session.testRun.details}
                status={session.testRun.status}
                failedCount={session.testRun.failedCount}
              />
            )}
          </DeviceDock>
        }
        panel={
          <AgentWorkspace
            session={session}
            action={{
              id: action.id,
              label: action.label,
              onAction: action.run,
              loading: session.busy,
            }}
            className="h-full border-y-0 border-r-0"
          />
        }
      />

      <InspectionModal
        open={inspecting}
        projectId={state.projectId}
        onClose={() => setInspecting(false)}
        projectName={copy.projects[state.projectId].name}
        scene={session.scene}
        reference={referenceScene}
        findings={state.findings}
        highlight={highlighted?.highlight}
        highlighted={highlighted}
        camera={camera}
        cameraVariant={cameraVariant}
        capturedAt={capturedAt}
        busy={session.busy}
        /**
         * Two different answers, and the difference is the point.
         *
         * With something still open, the next move is on the bench behind this
         * window — so the button says so and closes it, rather than offering a
         * verification that is going to come back refused.
         *
         * With nothing open, it is the panel's own suggestion, run from the
         * window that has just made the case for it. The window goes first:
         * what the call then does — a tick, a step change, a toast — all
         * happens on the bench, and watching it from behind an overlay of a
         * frame taken before it is watching the wrong screen.
         */
        continueAction={{
          label: session.openFindings.length
            ? copy.inspection.backToBench
            : action.label,
          loading: session.busy,
          onAction: () => {
            setInspecting(false);
            if (!session.openFindings.length) action.run();
          },
        }}
        onShow={(id) =>
          void session.run("show_correction", {
            finding_id: id,
            detail_level: state.coaching,
          })
        }
        onCheck={(id) => session.act({ kind: "check", findingId: id })}
        /* Only where there is nothing to drag — see `FindingRow.onSimulate`. */
        onSimulate={
          spec
            ? undefined
            : (id) => session.act({ kind: "repair", findingId: id })
        }
      />

      <ToastViewport toasts={session.toasts} onDismiss={session.dismissToast} />
    </>
  );
}
