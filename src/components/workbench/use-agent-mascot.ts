"use client";

import { useEffect, useRef } from "react";
import type { AgentSession } from "@/components/agent/use-agent-session";
import { fly, land, type MascotJob, type Point } from "@/lib/agent/mascot";
import { maybeNode, type CircuitScene, type NodeId } from "@/lib/circuit/graph";
import { stepById, stepsOwning } from "@/lib/agent/steps";
import type { AgentSessionState } from "@/lib/agent/session";
import type { ToolCall } from "@/lib/agent/activity";

/**
 * The bench, following the agent.
 *
 * It does not watch the buttons. It watches the **session**: when a call
 * starts, the ring is sent to whatever that call is about. That is what makes a
 * button in the panel and a real WebMCP client the same thing rather than two
 * paths that happen to look alike — the browser's call and the panel's call are
 * one `session.run`, so one of them cannot be visible and the other silent.
 *
 * Keyed on the call's **id** rather than its name, so a second
 * `show_correction` — the same finding shown again, or an agent retrying —
 * sends the ring out again instead of being swallowed as "no change".
 *
 * ## Why the job is resolved here
 *
 * `lib/agent/mascot.ts` is a clock and a shape and knows nothing about
 * circuits; deciding *which* pin a call is about is a question about the build.
 * Answering it here also means an argument the model cannot honour — a finding
 * that has gone, a lead that is still in the kit, a hole this build has not got
 * — is a ring that simply does not come, rather than one standing at (0, 0).
 */
export function useAgentMascot(session: AgentSession) {
  const seen = useRef<string | null>(null);
  const running = session.state.running;

  useEffect(() => {
    if (!running) return;
    if (seen.current === running.id) return;
    seen.current = running.id;

    const job = jobFor(session.state, session.scene, running);
    if (!job) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    fly(job, reduced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  /* The ring belongs to this bench. Walking to the summary while an agent is
     mid-call would otherwise leave the store running against a canvas that is
     no longer mounted. */
  useEffect(() => () => land(), []);
}

function pointOf(scene: CircuitScene, id: NodeId | undefined): Point | null {
  if (!id) return null;
  const node = maybeNode(scene, id);
  return node ? { x: node.x, y: node.y } : null;
}

function jobFor(
  state: AgentSessionState,
  scene: CircuitScene,
  call: ToolCall,
): MascotJob | null {
  const args = call.args as Record<string, string | null | undefined>;

  switch (call.name) {
    /**
     * Showing one place.
     *
     * The **error** node, not the target: at `hint` the whole point is that the
     * answer is not given away yet, and a ring parked on the correct hole says
     * it whatever the words above it are careful to withhold. Standing on the
     * thing that is wrong is true at all three levels — *this lead is what I am
     * talking about* — and it is what the person has to touch either way.
     */
    case "show_correction": {
      const finding = state.findings.find((f) => f.id === args.finding_id);
      if (!finding) return null;
      const wrong = finding.affectedNodes.find((n) => n.mark === "error");
      const at =
        pointOf(scene, wrong?.id) ??
        finding.focus.nodes.map((id) => pointOf(scene, id)).find(Boolean);
      return at ? { kind: "point", at } : null;
    }

    /**
     * Looking — over the places the call is about, in the order they read.
     *
     * `inspect_build` is scoped by its own argument: asked about the step it
     * reads the step, asked about the wiring it reads the build. A verification
     * is only ever about the step it is on.
     */
    case "inspect_build": {
      const scope = args.scope ?? "current_step";
      const over = readPoints(
        scene,
        scope === "current_step"
          ? stepById(state.activeStepId).connections
          : stepsOwning(state.activeStepId).flatMap((s) => s.connections),
      );
      return over.length ? { kind: "read", over } : null;
    }
    case "verify_current_step": {
      const over = readPoints(
        scene,
        stepById(state.activeStepId).connections,
      );
      return over.length ? { kind: "read", over } : null;
    }

    /**
     * The one call with hands.
     *
     * `from` is where the lead is standing now — `null` when it is in the kit,
     * which the model draws as the ring arriving already carrying it. A
     * `target` of null is the lead being left loose, and there is nowhere to
     * carry it to: the ring points at where it was instead.
     */
    case "attach_lead": {
      const to = pointOf(scene, args.target ?? undefined);
      const from = pointOf(scene, args.lead ?? undefined);
      if (!to) return from ? { kind: "point", at: from } : null;
      return { kind: "carry", from, to };
    }

    /* Everything else moves the panel, the camera or the dock rather than the
       bench. A ring for every call would be a ring nobody reads. */
    default:
      return null;
  }
}

/**
 * Up to four of the places these connections are about — and **nothing at all**
 * when they name no place on the bench.
 *
 * This used to fall back to the centre of everything drawn, on the reasoning
 * that the agent is reading *something* so the ring should be somewhere. It is
 * the wrong reasoning and it produced exactly the nonsense it deserved:
 * `Check your kit` owns no connection, so verifying it sent the ring to hover
 * over the middle of the Uno — a step about the box on the shelf, answered by
 * an agent pointing at a board it has nothing to say about.
 *
 * A ring that comes for no reason is worse than no ring: it is the product
 * claiming attention it has not earned, in the one register it reserved for
 * "the agent is working on this". So the honest answer to *where is it
 * looking* is sometimes nowhere, and then it does not come.
 */
function readPoints(
  scene: CircuitScene,
  connections: readonly string[],
): Point[] {
  const owned = new Set(connections);
  const points: Point[] = [];
  const seen = new Set<NodeId>();

  for (const connection of scene.expected) {
    if (!owned.has(connection.id)) continue;
    for (const id of [connection.from, connection.to]) {
      if (seen.has(id)) continue;
      seen.add(id);
      /* A lead whose part is still in the kit has no node, and is skipped
         rather than guessed at — the hole it belongs in is on the bench and
         is the half of the pair worth looking at anyway. */
      const at = pointOf(scene, id);
      if (at) points.push(at);
      if (points.length === 4) return points;
    }
  }

  return points;
}
