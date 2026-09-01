"use client";

import { useEffect, useRef, useState } from "react";
import { useWebMcpTools } from "@/components/agent/use-webmcp";
import { useLandingSession } from "@/components/landing/landing-session";
import { TOTAL, fix, getMode, reset } from "@/components/landing/scene/repair-demo";
import type { FindingId } from "@/lib/agent/findings";

/**
 * S-01 · The one call this screen can honour, wired both ways.
 *
 * ## The tools are really registered
 *
 * `inspect_build` and `show_correction` are handed to the browser on this
 * route. §9 only ever objected to registering a tool on a page that *cannot*
 * honour it — a `focus` effect landing on a canvas that is not mounted, going
 * quietly onto the floor. This page can honour these two: the bench answers
 * them. So the badge in the panel and the line on the plate stop being claims
 * and start being facts, and a WebMCP client can drive the entry screen.
 *
 * The other five are not registered here. `verify_current_step`,
 * `navigate_build_step` and `run_functional_test` need a workbench with steps
 * to move through, `get_build_context` would answer about a build nobody has
 * opened, and `attach_lead` would move a lead on a bench that is a film — this
 * screen's is one hard-coded run over one frame, and a write into it would be
 * a change nobody can see.
 *
 * ## One trigger, whoever pulled it
 *
 * The bench does not watch the button. It watches the *session*: when a call
 * named `show_correction` starts, the repair plays. That is what makes the
 * plate and a real agent the same thing rather than two paths that happen to
 * look alike — and it is the same rule the workbench keeps, where a tool the
 * browser invokes is the same call the button beside it makes.
 */
/** How long the working build is left standing before the fault returns. */
const REST = 2600;

export function useRepair() {
  const session = useLandingSession();
  const [busy, setBusy] = useState(false);

  useWebMcpTools(["inspect_build", "show_correction"], session);

  /**
   * The bench, following the session.
   *
   * Keyed on the call's id rather than on its name, so a second
   * `show_correction` — the plate pressed again, or an agent retrying — starts
   * the sequence again instead of being swallowed as "no change".
   */
  const seen = useRef<string | null>(null);
  const running = session.state.running;

  useEffect(() => {
    if (!running || running.name !== "show_correction") return;
    if (seen.current === running.id) return;
    seen.current = running.id;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (getMode() === "done") reset(reduced);
    fix(reduced);
  }, [running]);

  /**
   * What the plate does, and what an agent would do: look, then point.
   *
   * Two calls because that is the product's own shape — `show_correction` takes
   * a finding id and only `inspect_build` produces one. Reading the id off the
   * tool's *return value* rather than out of session state keeps this on the
   * same contract a WebMCP client reads.
   */
  /** The pending re-break, so leaving the page does not fire it into nothing. */
  const later = useRef<number | null>(null);
  useEffect(() => () => {
    if (later.current) window.clearTimeout(later.current);
  }, []);

  const repair = async () => {
    if (busy) return;
    if (later.current) window.clearTimeout(later.current);
    setBusy(true);
    const startedAt = performance.now();
    try {
      const looked = await session.run("inspect_build", { scope: "wiring" });
      const id = firstFinding(looked.result);
      if (!id) return;

      await session.run("show_correction", {
        finding_id: id,
        detail_level: "exact",
      });

      /* The cable is now in the right hole, so the graph has to agree: without
         this the sheet beside the bench keeps counting a finding the drawing
         has already resolved.

         `repair`, which is what `resolve` became: the write that satisfies a
         finding is a demo control now, not something a learner can press, and
         this screen is the demo. */
      session.act({ kind: "repair", findingId: id });

      /**
       * And then the fault goes back, so it can be watched again.
       *
       * Through `inject` rather than by rewinding: the workbench already has a
       * control that puts one of this build's two faults back, it commits
       * through the same reducer, and it lands in the timeline as a person
       * moving a wire. A demo that resets by quietly editing its own history
       * would be the one thing this screen is arguing against.
       */
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const left = Math.max(0, TOTAL - (performance.now() - startedAt));
      later.current = window.setTimeout(() => {
        later.current = null;
        session.act({ kind: "inject", fault: "echo" });
        reset(reduced);
      }, left + REST);
    } finally {
      setBusy(false);
    }
  };

  return { busy, repair };
}

function firstFinding(result: unknown): FindingId | null {
  const findings = (result as { findings?: { id?: string }[] } | undefined)
    ?.findings;
  const id = findings?.[0]?.id;
  return typeof id === "string" ? (id as FindingId) : null;
}
