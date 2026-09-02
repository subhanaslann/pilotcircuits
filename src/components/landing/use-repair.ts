"use client";

import { useEffect, useRef, useState } from "react";
import { useWebMcpTools } from "@/components/agent/use-webmcp";
import { useLandingSession } from "@/components/landing/landing-session";
import {
  CYCLE,
  fix,
  getMode,
  getPhase,
  reset,
} from "@/components/landing/scene/repair-demo";
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
 *
 * ## And one consequence, whoever pulled it
 *
 * The film is a picture of the graph being put right, so the graph has to be
 * put right — and until this pass only the plate's own `repair()` did that
 * half. An agent's `show_correction` started the film through the effect below
 * and nothing else: the ring seated the cable, the car passed, and the session
 * still held the fault, so the agent's next `inspect_build` reported the wire
 * in D6 under a picture of it in D7 — measured on the real host
 * (`.audit/hackathon/chrome152/before/landing.json`: the second inspection
 * returns the same finding id). With animation on it was worse: the run ends
 * on the dip that covers the fault going back, and nothing on the agent path
 * ever put it back, so the bench stayed painted out.
 *
 * Both halves now hang off the call itself, in the same effect that starts
 * the film: the graph repair lands when the call settles, and the fault is
 * put back — through `inject`, with the film reset under it — `CYCLE` (the run
 * and its rest) after the film started. The plate's `repair()` only makes the
 * two calls; it no longer touches the session, so the plate and an agent
 * cannot act twice and cannot act differently.
 */
export function useRepair() {
  const session = useLandingSession();
  const [busy, setBusy] = useState(false);

  useWebMcpTools(["inspect_build", "show_correction"], session);

  /**
   * The session, readable from a timer and from an effect that closed over an
   * older render. `session` is a new object every render (no `useCallback`,
   * React Compiler), and the one a ten-second timer would otherwise hold is the
   * one from the render that armed it. Same device as `use-webmcp.ts`.
   */
  const live = useRef(session);
  useEffect(() => {
    live.current = session;
  });

  /**
   * The bench, following the session.
   *
   * Keyed on the call's id rather than on its name, so a second
   * `show_correction` — the plate pressed again, or an agent retrying — starts
   * the sequence again instead of being swallowed as "no change".
   */
  const seen = useRef<string | null>(null);
  /** The call whose graph repair is still owed, until it settles. */
  const owed = useRef<{ id: string; findingId: FindingId } | null>(null);
  /** Whether the graph has been repaired since the fault was last put back. */
  const repaired = useRef(false);
  /** The pending re-break, so leaving the page does not fire it into nothing. */
  const later = useRef<number | null>(null);
  useEffect(() => () => {
    if (later.current) window.clearTimeout(later.current);
  }, []);

  /**
   * The fault, back on the bench.
   *
   * Through `inject` rather than by rewinding: the workbench already has a
   * control that puts one of this build's two faults back, it commits
   * through the same reducer, and it lands in the timeline as a person
   * moving a wire. A demo that resets by quietly editing its own history
   * would be the one thing this screen is arguing against. Only when the
   * graph was actually repaired — putting a fault back that never left
   * would log a wire move nobody made. The film's reset goes under it.
   *
   * The timer below calls this when the rest is over; the plate calls it
   * early when somebody asks to watch again while the working build stands.
   */
  const putBack = () => {
    if (later.current) window.clearTimeout(later.current);
    later.current = null;
    if (repaired.current) {
      repaired.current = false;
      live.current.act({ kind: "inject", fault: "echo" });
    }
    reset(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  };

  const running = session.state.running;

  useEffect(() => {
    /**
     * The settle. Calls are serialised, so the call this hook is waiting on
     * has settled the moment `running` is anything other than it — `null`, or
     * already the next call in the queue. Its row in the timeline says how it
     * settled; only a call the handler accepted has highlighted a finding the
     * picture is about to fix, so only that one moves the graph.
     *
     * `repair` is what `resolve` became: the write that satisfies a finding is
     * a demo control now, not something a learner can press, and this screen
     * is the demo. Without it the sheet beside the bench keeps counting a
     * finding the drawing has already resolved.
     */
    const waiting = owed.current;
    if (waiting && running?.id !== waiting.id) {
      owed.current = null;
      const row = live.current.state.activity.find(
        (entry) => entry.call?.id === waiting.id,
      );
      if (row?.status === "ok") {
        live.current.act({ kind: "repair", findingId: waiting.findingId });
        repaired.current = true;
      }
    }

    if (!running || running.name !== "show_correction") return;
    if (seen.current === running.id) return;
    seen.current = running.id;

    /* The finding is in the call's own arguments — the same contract a WebMCP
       client writes to — so the graph repair needs nothing the plate knows and
       an agent does not. */
    const findingId = running.args.finding_id;
    owed.current =
      typeof findingId === "string"
        ? { id: running.id, findingId: findingId as FindingId }
        : null;

    /* A call that lands while the film is already playing joins it rather than
       restarting it (`fix` returns early in `fixing`); the reset already armed
       for that run stands. */
    if (getMode() === "fixing") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (getMode() === "done") reset(reduced);
    fix(reduced);

    /* And then the fault goes back, so it can be watched again — `putBack`,
       timed from the film's start: `CYCLE` is the run plus the rest its end
       frame stands for, then the fault fades back in with the film's reset. */
    if (later.current) window.clearTimeout(later.current);
    later.current = window.setTimeout(putBack, CYCLE);
    /* `putBack` is a plain function of refs and imports (React Compiler), so
       listing it would run this on every render; the effect is keyed on the
       call it is about. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  /**
   * What the plate does, and what an agent would do: look, then point.
   *
   * Two calls because that is the product's own shape — `show_correction` takes
   * a finding id and only `inspect_build` produces one. Reading the id off the
   * tool's *return value* rather than out of session state keeps this on the
   * same contract a WebMCP client reads. Nothing after the second call: the
   * graph repair, the re-inject and the film's reset hang off the call itself,
   * in the effect above, the same way for the plate as for an agent.
   */
  const repair = async () => {
    if (busy) return;
    setBusy(true);
    try {
      /* Asked during the rest — the working bench standing there — the run
         starts over now rather than when the timer says: the fault goes back
         first, so the two calls below have something to find. */
      if (getPhase() === "rest") putBack();
      const looked = await session.run("inspect_build", { scope: "wiring" });
      const id = firstFinding(looked.result);
      if (!id) return;

      await session.run("show_correction", {
        finding_id: id,
        detail_level: "exact",
      });
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
