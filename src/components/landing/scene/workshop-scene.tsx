"use client";

import type React from "react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { CoachCorner } from "@/components/agent/coach-corner";
import { useCoachMood } from "@/components/agent/use-coach-mood";
import { AgentMascotLayer } from "@/components/canvas/agent-mascot";
import { useLandingSession } from "@/components/landing/landing-session";
import { useBenchHandle } from "@/components/landing/scene/bench-handle";
import { BenchView } from "@/components/landing/scene/bench-view";
import { NextStepControl } from "@/components/landing/scene/next-step-control";
import { arrive } from "@/components/landing/scene/repair-demo";
import { useBenchMascot } from "@/components/landing/scene/use-bench-mascot";
import { bench } from "@/components/illustration/spec";
import { useCopy } from "@/content/copy-provider";
import type { Copy } from "@/content/i18n";
import { atRest, type CoachMood } from "@/lib/agent/coach";
import {
  getServerTick,
  getTick,
  subscribe as subscribeRing,
  type MascotJob,
} from "@/lib/agent/mascot";
import { cn } from "@/lib/utils/cn";

/**
 * S-01 · The bench.
 *
 * This wrapper owns four things and nothing else: the printed label, when the
 * run starts, the control under the bench, and the agent standing on it.
 * The drawing itself is `BenchView`, which is `CircuitSceneView` — the
 * workbench's own parts, wires and pins, framed for this screen.
 *
 * ## The agent is the workbench's agent
 *
 * The coach figure in the top-right corner and the ring that leaves it are
 * the same two components the capstone bench mounts, fed by this screen's
 * own session (`landing-session.tsx`): the face follows the call in flight
 * (`useCoachMood`), the ring is sent out by `useBenchMascot` and drawn by
 * `AgentMascotLayer` in screen pixels over the whole frame, through a handle
 * that answers for a drawing with no camera (`bench-handle.ts`). This film
 * used to carry a ring of its own, and a person who pressed *Fix the wire*
 * here and then opened the workbench met two different agents.
 *
 * The coach stands on the mat plate the capstone gives it, at the corner the
 * capstone gives it, above the road's far lane where nothing drives. Below
 * `md` the bench is too narrow to carry a plate and the figure is not
 * mounted; the ring then enters from its own fixed offset, as it does on any
 * bench without a lamp.
 *
 * ## The face follows the ring as well as the session
 *
 * On the workbench the face and the ring agree for free: the one tool with
 * hands, `attach_lead`, lasts exactly as long as its carry by construction.
 * Here the call that starts the carry is `show_correction`, which settles in
 * a few milliseconds, and the ring it sent out then works the bench for two
 * seconds under a face that has gone back to *Waiting for an agent* —
 * filmed, and exactly the two-agents problem this screen had just stopped
 * having. So while the ring is out on this bench the face says what the ring
 * is doing (`faceFor`): working while it carries, reading while it reads and
 * the session has nothing better to say. The ring's flight is a measured
 * fact in the store, not a guess, so the face is still a badge that
 * measures something.
 *
 * The still life that used to live here is gone. It was a second drawing of one
 * build, and the argument for it (a photograph rather than a diagram) stopped
 * being worth its price the moment the price was a board drawn at forty per
 * cent of the size of the one in the reader's hand.
 *
 * `container-type: inline-size` is what makes the whole thing scale as one
 * object: the label sizes itself in `cqw` against this box, so nothing has to
 * be re-measured when the scene narrows.
 */
export function WorkshopScene({ className }: { className?: string }) {
  const copy = useCopy();
  const session = useLandingSession();
  const frame = useRef<HTMLDivElement>(null);
  const art = useRef<SVGSVGElement>(null);
  const canvas = useBenchHandle(frame, art);
  useBenchMascot(session, canvas);

  /* The store ticks sixty times a second; the job's kind changes twice a
     call, and React re-renders this only when it does. */
  const flying = useSyncExternalStore(subscribeRing, flyingKind, serverKind);
  const coach = faceFor(useCoachMood(session), flying, copy);

  /**
   * The car rolls up when the bench is actually on screen.
   *
   * Only the car: the repair is not played, it is *asked for*. The bench sits
   * there not working until somebody — or something — calls the tool, which is
   * the whole reason the ring is finally visible when it comes.
   */
  useEffect(() => {
    const node = frame.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (typeof IntersectionObserver === "undefined") {
      arrive(reduced);
      return;
    }
    const watch = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          arrive(reduced);
          watch.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    watch.observe(node);
    return () => watch.disconnect();
  }, []);

  return (
    <div
      ref={frame}
      className={cn("relative mx-auto w-full max-w-[860px] @container", className)}
    >
      {/* Printed on the bench above the mat's back edge, not inside a badge —
          it names what you are looking at and then gets out of the way. Below
          the breakpoint it becomes a caption above the drawing instead. */}
      {/* Printed on the mat, so it takes the mat's ink rather than the app's:
          `--color-ink-secondary` is tuned to read on white paper and goes to
          mud on a cutting mat (`illustration/spec.ts`, the same exception the
          pin labels take). Below the breakpoint it leaves the drawing and
          becomes a caption, where the app's ink is the right one again. */}
      <p
        className="font-condensed text-ink-secondary mb-2 text-[clamp(11px,1.52cqw,14px)] leading-none font-semibold tracking-[0.09em] whitespace-nowrap uppercase md:absolute md:top-[3%] md:left-[3.5%] md:z-10 md:mb-0 md:text-[color:var(--mat-label)]"
        style={{ "--mat-label": bench.label } as React.CSSProperties}
      >
        {copy.landing.sceneLabel}
      </p>

      <BenchView ref={art} />

      {/* The corner the capstone puts it in, on the plate it brings when there
          is no shelf. `z-10` as the workspace's furniture is, so the ring's
          layer (`z-[15]`) crosses it on the way out. */}
      <div className="absolute top-3 right-3 z-10 hidden md:block">
        <CoachCorner
          ground="mat"
          mood={coach.mood}
          line={coach.line}
          detail={coach.detail}
        />
      </div>

      {/* Over everything on the frame, inert to the pointer, and empty unless
          the agent is mid-call. Before the control so that the control is the
          last thing in the frame's reading order, as it is in its layout. */}
      <AgentMascotLayer canvas={canvas} primary />

      <NextStepControl />
    </div>
  );
}

type Face = { mood: CoachMood; line: string; detail?: string };

const flyingKind = (): MascotJob["kind"] | null => getTick()?.job.kind ?? null;
const serverKind = (): MascotJob["kind"] | null => getServerTick()?.job.kind ?? null;

/**
 * The face, given what the session says and what the ring is doing.
 *
 * A carry always wins: the agent has hold of a wire, whatever the timeline
 * says about the call that asked for it. A read only fills a face that would
 * otherwise be at rest — a reaction the session is holding (*Found something*,
 * after the inspection lands) is a verdict, and the ring finishing its look
 * is no reason to take it back.
 */
function faceFor(
  session: Face,
  flying: MascotJob["kind"] | null,
  copy: Copy,
): Face {
  if (flying === "carry") {
    return { mood: "touching", line: copy.agentPanel.coach.touching };
  }
  if (flying === "read" && atRest(session.mood)) {
    return { mood: "looking", line: copy.agentPanel.coach.looking };
  }
  return session;
}
