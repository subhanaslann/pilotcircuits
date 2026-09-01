"use client";

import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { LiveRegion } from "@/components/ui/status";
import { MonoValue, Sentence } from "@/components/ui/text";
import { ProjectScene } from "@/components/illustration/project-scenes";
import { BuildSceneView } from "@/components/canvas/build-scene";
import { useCopy } from "@/content/copy-provider";
import {
  briefingScreenCount,
  type BriefingDef,
  type BriefingPart,
} from "@/lib/agent/briefings";
import type { PartId, Placement } from "@/lib/circuit/placement";
import { useReducedMotion } from "@/lib/design/motion";
import { cn } from "@/lib/utils/cn";

/**
 * The chapter briefing — what stands in front of the bench before it is yours.
 *
 * What the circuit is for, the parts introduced one at a time, and then the
 * circuit building itself. Then `Başla`, and the bench.
 *
 * ## A panel over the dimmed bench
 *
 * The window used to be opaque — `bg-app` edge to edge — and the bench behind
 * it was gone for as long as it was up. It now stands as a panel on a scrim,
 * which is a different claim and the right one: the briefing is *about* that
 * bench, and hiding it entirely made the window read as another screen you had
 * been sent to rather than as something held in front of this one.
 *
 * ## The acts are listed down the side
 *
 * Three of them — the project, the parts, the assembly — and the parts are one
 * act however many components it walks through. The list is read-only on
 * purpose: `İleri` is how you move, so a row that looked pressable would be
 * either a second way to travel or a dead control.
 *
 * ## It covers the workspace region, and only that
 *
 * The top bar, the step rail, the agent panel and the dock stay visible and
 * stay usable. That is the claim: the workbench is already here, and one region
 * of it is holding something else for a minute. It covers the instruction
 * header as well as the canvas, because that header prints the *step's*
 * imperative — a sentence telling you to bridge a gap with a resistor, hanging
 * over a window that says you have not started.
 *
 * ## Not a `Modal`, and here is the bill
 *
 * `overlay.tsx`'s modal is a shell over live content: portal, scrim,
 * `aria-modal`, focus trap, Escape. Every one of those is wrong here, and the
 * house precedent for saying so is `device/dock.tsx`. What was declined, and
 * what was paid instead:
 *
 *   *Scrim* — paid, where it used to be declined. The old reasoning was that
 *   there is no live content behind this, which was true only because the
 *   window was opaque. The bench is visible now, so the dimming is what says it
 *   is not yours yet.
 *
 *   *Portal, `aria-modal`, focus trap* — still declined. Four regions of the
 *   frame are genuinely available, and `aria-modal` would tell a screen reader
 *   they are not while the sighted user can see all four. The scrim is a
 *   picture of *this region is busy*, not a claim about the other four.
 *
 *   *Focus on open* — paid, on the region's heading rather than on the primary
 *   button. The briefing is read; focusing `İleri` would make a screen-reader
 *   user's first word the last thing on the screen.
 *
 *   *Focus on advance* — added. Each screen's own heading takes focus, which is
 *   what makes a live region unnecessary for all but the one act that moves on
 *   its own.
 *
 *   *Focus return on close* — paid by the caller: `onStart` hands focus to the
 *   instruction above the canvas, because "here is the bench" means "now read
 *   what to do".
 *
 *   *Escape closes* — declined, deliberately. Escape on a modal means *give me
 *   back what was behind you*, and there is nothing behind. A second, invisible
 *   exit that skips everything is the dead-button rule's sibling: an action
 *   nobody can see, doing something.
 *
 * ## It never touches the session
 *
 * No tool call, no `act`, no canvas handle. It reads a registry row and a
 * dictionary, and it draws. That is what lets its clock live here and die with
 * it — unlike the functional test's, which belongs to the session because the
 * dock keeps the record afterwards. It also means the canvas behind it keeps
 * its transform: the briefing has no way to refit it even by accident.
 */

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Screen =
  | { kind: "part"; part: BriefingPart }
  | { kind: "purpose" }
  | { kind: "assembly" };

/**
 * How to frame one box inside the stage's fixed viewBox.
 *
 * The stage travels between the close-ups rather than cutting — rule 6 already
 * owns this gesture for the canvas ("Kanvas odaklanması · 350ms yumuşak
 * kayma"), and three cuts read as three pictures where three moves read as one
 * bench seen from three distances. A CSS transform on a `<g>` rather than an
 * animated `viewBox`, which cannot be transitioned; `Resistor` sets a CSS
 * transform in user units the same way.
 */
function framing(box: Box, stage: Box) {
  const k = Math.min(stage.width / box.width, stage.height / box.height);
  const tx = stage.x + stage.width / 2 - k * (box.x + box.width / 2);
  const ty = stage.y + stage.height / 2 - k * (box.y + box.height / 2);
  return `translate(${tx}px, ${ty}px) scale(${k})`;
}

export function ChapterBriefing({
  def,
  onStart,
  className,
}: {
  def: BriefingDef;
  /** Hand the bench over. The caller decides where focus lands. */
  onStart: () => void;
  className?: string;
}) {
  const copy = useCopy();
  const reduced = useReducedMotion();

  /**
   * What the build is, then the parts, then the assembly.
   *
   * It used to open on the parts and reach the purpose fourth, which meant
   * three close-ups of components before the window had said what any of them
   * were for. The assembly still comes last: it is the only act that means
   * anything once you know both.
   */
  const screens: Screen[] = [
    { kind: "purpose" as const },
    ...def.parts.map((part) => ({ kind: "part" as const, part })),
    { kind: "assembly" as const },
  ];
  const total = briefingScreenCount(def);

  const [index, setIndex] = useState(0);
  /** Bumped by `Tekrar oynat`. Remounting the act is what replays it. */
  const [take, setTake] = useState(0);

  const screen = screens[index];
  const last = index === screens.length - 1;

  const titleRef = useRef<HTMLHeadingElement>(null);
  const actRef = useRef<HTMLHeadingElement>(null);
  const opened = useRef(false);

  /* The region's heading on open, each act's own heading after that. */
  useEffect(() => {
    if (!opened.current) {
      opened.current = true;
      titleRef.current?.focus();
      return;
    }
    actRef.current?.focus();
  }, [index]);

  return (
    <div
      className={cn(
        "motion-safe:motion-fade relative flex h-full min-h-0 p-6",
        className,
      )}
    >
      {/* The bench, dimmed rather than removed. The same ink the modal and the
          drawer put behind themselves, so the product has one darkness. */}
      <div aria-hidden="true" className="absolute inset-0 bg-[#0B1220]/45" />

      <section
        aria-labelledby="cp-briefing-title"
        className="bg-surface shadow-e3 relative flex min-h-0 w-full flex-col rounded-xl"
      >
        <header className="border-border shrink-0 border-b px-5 py-3.5">
          <h2
            id="cp-briefing-title"
            ref={titleRef}
            tabIndex={-1}
            className="text-h2 text-ink outline-none"
          >
            {copy.briefing.title}
          </h2>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[156px_minmax(0,1fr)]">
          <BriefingSteps
            def={def}
            index={index}
            className="border-border min-h-0 overflow-y-auto border-r px-4 py-4"
          />

          {/* One frame, four contents. Words and one stage, and neither moves
              between screens — the reader should never have to find the
              buttons again.

              Split or stacked by the *panel's* width rather than the window's:
              the region loses 612px to the rail and the agent panel before this
              gets any, so a viewport breakpoint here would stand two 200px
              columns side by side at 1280 and call it a composition. */}
          <div className="@container min-h-0 px-5 py-4">
            <div className="@[520px]:grid-cols-[1fr_1.1fr] @[520px]:grid-rows-1 @[520px]:gap-6 grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
              {screen.kind === "part" ? (
                <PartAct def={def} part={screen.part} ref={actRef} />
              ) : screen.kind === "purpose" ? (
                <PurposeAct def={def} ref={actRef} />
              ) : (
                <AssemblyAct
                  key={take}
                  def={def}
                  reduced={reduced}
                  onReplay={() => setTake((t) => t + 1)}
                  ref={actRef}
                />
              )}
            </div>
          </div>
        </div>

        <footer className="border-border flex shrink-0 items-center justify-between gap-4 border-t px-5 py-3">
          {/* Counted, but not with ticks. The top bar is drawing a tick strip
              of its own 250px above this, counting *build steps* in a
              four-state vocabulary; a second strip in the same shape counting
              screens in a two-state one teaches that the vocabulary is
              unstable, and puts two fractions on one screen with nothing saying
              which is which. Rule 5's ticks carry state, and a briefing screen
              has none. */}
          <span className="text-mono-sm text-ink-tertiary tnum font-mono">
            <span aria-hidden="true">
              {index + 1} / {total}
            </span>
            <span className="sr-only">
              {copy.briefing.screenOf(index + 1, total)}
            </span>
          </span>

          <div className="flex items-center gap-4">
            {/* Not rendered on the first screen rather than greyed out: a
                target that cannot be reached does not stand there (§18). The
                primary never moves, so nothing jumps when this appears. */}
            {index > 0 ? (
              <Button
                variant="secondary"
                className="motion-safe:motion-pop"
                onClick={() => setIndex((at) => at - 1)}
              >
                {copy.briefing.back}
              </Button>
            ) : null}
            <Button
              variant="primary"
              onClick={() => (last ? onStart() : setIndex((at) => at + 1))}
            >
              {last ? copy.briefing.start : copy.briefing.next}
            </Button>
          </div>
        </footer>
      </section>
    </div>
  );
}

/**
 * Where the window is, down the side.
 *
 * Three acts, and the parts are one of them with the components named under it
 * — that is the honest grouping: `İleri` walks through three close-ups, but
 * "the parts" is one thing the briefing has to say. The fraction in the footer
 * counts screens; this is the shape of the talk.
 *
 * A `<nav>` with a list, not a set of buttons. The only way through is `İleri`,
 * and a row that looked pressable would be a control nobody can honour.
 */
function BriefingSteps({
  def,
  index,
  className,
}: {
  def: BriefingDef;
  index: number;
  className?: string;
}) {
  const copy = useCopy();

  /* Screen 0 is the purpose, the parts run to `def.parts.length`, and anything
     after them is the assembly — the same arithmetic `screens` is built with,
     which is why both live in this file. */
  const at = index === 0 ? 0 : index <= def.parts.length ? 1 : 2;

  const acts = [
    { label: copy.briefing.steps.purpose, parts: null },
    {
      label: copy.briefing.steps.parts,
      parts: def.parts.map((part) => part.words(copy).name),
    },
    { label: copy.briefing.steps.assembly, parts: null },
  ];

  return (
    <nav aria-label={copy.briefing.steps.label} className={className}>
      <ol className="space-y-3.5">
        {acts.map((act, n) => (
          <li key={act.label}>
            <p className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "text-caption tnum grid size-5 shrink-0 place-items-center rounded-full font-mono leading-none",
                  n === at
                    ? "bg-accent text-inverse"
                    : "border-border text-ink-tertiary border",
                )}
              >
                {n + 1}
              </span>
              <span
                className={cn(
                  "text-body-sm min-w-0 truncate",
                  n === at ? "text-ink font-medium" : "text-ink-tertiary",
                )}
              >
                {act.label}
              </span>
            </p>

            {act.parts ? (
              <ul className="mt-1.5 ml-7 space-y-1">
                {act.parts.map((name, i) => (
                  <li
                    key={name}
                    className={cn(
                      "text-caption truncate",
                      n === at && index - 1 === i
                        ? "text-accent"
                        : "text-ink-tertiary",
                    )}
                  >
                    {name}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* --- The acts ------------------------------------------------------------
   Each returns the grid's two children as a fragment, so the frame is one
   layout and the acts only decide what stands in it.                        */

function PartAct({
  def,
  part,
  ref,
}: {
  /** The chapter, for the stage it is framed in and the pins it prints. */
  def: BriefingDef;
  part: BriefingPart;
  ref: Ref<HTMLHeadingElement>;
}) {
  const words = part.words(useCopy());

  return (
    <>
      <Column>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <ActHeading ref={ref}>{words.name}</ActHeading>
          {/* The part number comes off the build rather than out of the
              dictionary, so the two cannot disagree about what a 220Ω resistor
              is called — and it is printed on the part, so it is never
              translated (rule 13). */}
          <MonoValue>{part.number}</MonoValue>
        </div>
        <p className="text-body text-ink-secondary mt-2 max-w-[52ch]">
          {/* The chapter's own pins, off the row. This said `{D9}` — chapter
              one's board, written into the window that draws every chapter. */}
          <Sentence text={words.note} mono={def.mono} />
        </p>
      </Column>

      <Stage>
        <SceneStage def={def} box={part.box} placement={part.alone} />
      </Stage>
    </>
  );
}

function PurposeAct({
  def,
  ref,
}: {
  def: BriefingDef;
  ref: Ref<HTMLHeadingElement>;
}) {
  const copy = useCopy();

  return (
    <>
      <Column>
        <ActHeading ref={ref}>{copy.briefing.purposeHeading}</ActHeading>
        <p className="text-body text-ink-secondary mt-2 max-w-[52ch]">
          {def.words(copy).purpose}
        </p>
      </Column>

      {/* The one drawing here at illustration distance rather than bench
          distance. What holds it with the other four is the ground: P-02's
          scenes stand on the same cutting mat `DeskSurface` draws, which is
          why that set exists in the form it does. */}
      <Stage>
        {/* Capped rather than stretched. The other four stages are the bench
            filling the frame edge to edge; this one is a picture of the build,
            so it is centred at a size that reads as a picture instead of a
            scene that failed to fill its box. Batch 6's rule is that the set is
            held together by the shared ground, not by identical framing. */}
        <div className="flex h-full items-center justify-center p-5">
          <ProjectScene
            id={def.projectId}
            className="h-auto w-full max-w-[560px]"
          />
        </div>
      </Stage>
    </>
  );
}

/**
 * The assembly, and the only act with a clock.
 *
 * Mounted when the act is entered and remounted by the replay key, so `beat`
 * starts at nothing every time and there is no state to reset: a sequence
 * resumed half way through is one nobody can read. Unmounting clears the
 * timers, which is what stops a beat firing into a window that has gone.
 */
function AssemblyAct({
  def,
  reduced,
  onReplay,
  ref,
}: {
  def: BriefingDef;
  reduced: boolean;
  onReplay: () => void;
  ref: Ref<HTMLHeadingElement>;
}) {
  const copy = useCopy();
  const words = def.words(copy);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const timers = def.assembly
      .map((step, at) =>
        at === 0 ? null : window.setTimeout(() => setBeat(at), step.atMs),
      )
      .filter((id) => id !== null);
    return () => timers.forEach(window.clearTimeout);
  }, [def.assembly]);

  const current = def.assembly[beat];

  /**
   * Under reduced motion a lamp that breathes is drawn lit and steady.
   *
   * The schedule is *not* shortened: these are JavaScript timers, so the global
   * CSS collapse never touched them, and all six beats still land — the part
   * arrivals, the join, every caption and every announcement. What genuinely
   * breaks is the breath — an infinite keyframe collapsed to a single iteration
   * freezes on one value, and a lamp that is not breathing is the one frame
   * that cannot survive being still. The caption says it in words either way.
   */
  const breathing = Boolean(current.breathing) && !reduced;

  return (
    <>
      <Column>
        <ActHeading ref={ref}>{copy.briefing.assemblyHeading}</ActHeading>

        {/* The whole sequence as text, readable at any moment and with the
            current line marked three ways — weight, ink, and the drawing
            agreeing with it. This is what makes the act mean something when
            nothing is moving, and it is the live region's source. No box, no
            fill, no rule between the lines (rule 4). */}
        <ol className="mt-3 space-y-1.5">
          {def.assembly.map((step, at) => (
            <li
              key={step.id}
              className={cn(
                "text-body-sm duration-quick transition-colors",
                at === beat ? "text-ink font-medium" : "text-ink-tertiary",
              )}
            >
              <Sentence text={words.assembly[step.id]} mono={def.mono} />
            </li>
          ))}
        </ol>

        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={onReplay}
        >
          {copy.briefing.replay}
        </Button>

        <LiveRegion message={words.assembly[current.id]} />
      </Column>

      <Stage>
        <SceneStage
          def={def}
          box={def.stageBox}
          placement={current.placement}
          entering={current.entering}
          /* A beat may say it out loud; chapter one's never does, and a lamp
             that is breathing is a lamp that is on. Keeping the derivation as
             the fallback is what makes chapter one's six beats draw exactly
             what they drew before the field existed. */
          lit={current.lit ?? Boolean(current.breathing)}
          breathing={breathing}
          lamps={current.lamps}
          trace={current.trace}
          showLabels
        />
      </Stage>
    </>
  );
}

/* --- The frame ----------------------------------------------------------- */

/**
 * The reading half.
 *
 * `my-auto` rather than `justify-center`: it centres the text against the
 * stage when there is room and behaves like ordinary flow when there is not,
 * so a long note scrolls from the top instead of being clipped at both ends.
 * At 1280 the column is barely wider than the measure and this does nothing;
 * on a wide screen it is the difference between a composition and three lines
 * hanging in a corner.
 */
function Column({ children }: { children: ReactNode }) {
  return (
    <div className="scroll-fade flex min-h-0 flex-col overflow-y-auto py-1">
      <div className="my-auto">{children}</div>
    </div>
  );
}

/**
 * The one place the ground changes, and it changes **downwards** — the same
 * footing the canvas well and the dock stand on. Everything else in the window
 * is the plain app ground, because the window is already a surface and rule 4
 * asks what can be said without a second one.
 */
function Stage({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface-sunken layer-sunken min-h-0 overflow-hidden rounded-lg">
      {children}
    </div>
  );
}

function ActHeading({
  ref,
  children,
}: {
  ref: Ref<HTMLHeadingElement>;
  children: ReactNode;
}) {
  return (
    <h3 ref={ref} tabIndex={-1} className="text-h3 text-ink outline-none">
      {children}
    </h3>
  );
}

/**
 * The bench, framed on one box. Not a `CanvasViewport`: there is no third
 * pannable canvas in this product, and a briefing is watched, not flown.
 *
 * **Drawn through `BuildSceneView`, and that is the whole of the change.** It
 * called `lampSceneFrom` and `LampSceneView` by name, which was honest while
 * one chapter had a briefing and became a window that draws a breathing lamp
 * under chapter two's captions the moment a second row landed. The dispatcher
 * is already the single answer to "which view draws this build" — the
 * inspection modal learned that the hard way (`build-scene.tsx`) — and the
 * frame comes off the row beside it, so neither can be right about a chapter
 * the other has not heard of.
 *
 * `placement` is required rather than defaulting to the finished build: both
 * callers name a frame, and a default here would be this file holding an
 * opinion about what a chapter looks like when nobody said.
 */
function SceneStage({
  def,
  box,
  placement,
  entering,
  lit = false,
  breathing = false,
  lamps,
  trace,
  showLabels = false,
}: {
  def: BriefingDef;
  box: Box;
  /** What is on the bench in this frame. */
  placement: Placement;
  entering?: PartId;
  lit?: boolean;
  breathing?: boolean;
  /** Chapter two's three lights, on the beats that name them. */
  lamps?: { red: boolean; yellow: boolean; green: boolean };
  trace?: string;
  showLabels?: boolean;
}) {
  const reduced = useReducedMotion();
  const stage = def.stageBox;

  return (
    <svg
      aria-hidden="true"
      viewBox={`${stage.x} ${stage.y} ${stage.width} ${stage.height}`}
      className="block h-full w-full"
    >
      <g
        style={{
          transform: framing(box, stage),
          transition: reduced
            ? "none"
            : "transform var(--duration-deliberate) var(--ease-out-soft)",
        }}
      >
        <BuildSceneView
          projectId={def.projectId}
          scene={def.sceneFrom(placement)}
          showLabels={showLabels}
          entering={entering}
          lit={lit}
          breathing={breathing}
          lamps={lamps}
          successTrace={trace ? [trace] : undefined}
        />
      </g>
    </svg>
  );
}
