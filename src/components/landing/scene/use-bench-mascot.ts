"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { AgentSession } from "@/components/agent/use-agent-session";
import type { CanvasHandle } from "@/components/canvas/canvas-viewport";
import { INSPECTION, REPAIR } from "@/components/landing/scene/repair-demo";
import { optionsFrom } from "@/components/workbench/use-agent-mascot";
import { fly, land, type MascotJob } from "@/lib/agent/mascot";
import type { AgentTool } from "@/lib/agent/model";

/**
 * S-01 · The entry screen's bench, following the agent.
 *
 * The workbench's `use-agent-mascot.ts`, with the one question it has to
 * answer — *which place is this call about* — already answered: this bench is
 * one build in one arrangement, and its two registered tools are about the
 * same two places every time. So there is no resolving here, only the two
 * jobs the film defines, sent out on the same rule the workbench keeps: it
 * watches the **session**, keyed on the call's id, so the plate's call and a
 * WebMCP host's are one ring, and a second `show_correction` sends it out
 * again rather than being swallowed as "no change".
 *
 * Why this is a hook of its own rather than a branch in `use-repair.ts`: that
 * hook belongs to the ask beside the bench and has no drawing to measure. This
 * one is mounted by the scene, which owns the frame the ring is drawn over —
 * both watch the same `running`, both run in the same commit, and the film's
 * clock and the ring's start on the same frame.
 *
 * The flight is the bench's: out of the coach figure and back into it, when
 * there is one on this frame (`optionsFrom`), and a call that settles with an
 * error lands the ring where it is — a ring going on performing a carry the
 * handler has refused is a lie told in the one register reserved for *the
 * agent is doing this*.
 */
export function useBenchMascot(
  session: AgentSession,
  canvas: RefObject<CanvasHandle | null>,
) {
  const seen = useRef<string | null>(null);
  const running = session.state.running;

  useEffect(() => {
    if (!running) {
      const id = seen.current;
      if (!id) return;
      const entry = session.state.activity.find((e) => e.call?.id === id);
      if (entry?.status === "error") land();
      return;
    }
    if (seen.current === running.id) return;
    seen.current = running.id;

    const job = jobFor(running.name);
    if (!job) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    fly(job, optionsFrom(canvas.current?.getBounds() ?? null), reduced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  /* The ring belongs to this bench. Leaving the page mid-call would otherwise
     leave the store ticking against a frame that is no longer mounted. */
  useEffect(() => () => land(), []);
}

/**
 * The two calls this route registers, as the ring's two jobs. Anything else
 * — a host that reaches for a tool the entry screen has not handed it — is a
 * ring that does not come.
 */
function jobFor(name: AgentTool): MascotJob | null {
  switch (name) {
    case "inspect_build":
      return INSPECTION;
    case "show_correction":
      return REPAIR;
    default:
      return null;
  }
}
