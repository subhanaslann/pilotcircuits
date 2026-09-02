"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { AgentSession } from "@/components/agent/use-agent-session";
import type { CanvasHandle } from "@/components/canvas/canvas-viewport";
import { coachCentreIn } from "@/components/canvas/agent-mascot";
import { shelfArt } from "@/components/workbench/kit-strip";
import { buildFor } from "@/lib/agent/builds";
import { locate } from "@/lib/agent/services";
import {
  fly,
  land,
  type Anchor,
  type FlightOptions,
  type MascotJob,
} from "@/lib/agent/mascot";
import { maybeNode, type CircuitScene, type NodeId } from "@/lib/circuit/graph";
import { partOf, partsInKit } from "@/lib/circuit/placement";
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
 * that has gone, a hole this build has not got — is a ring that simply does
 * not come, rather than one standing at (0, 0).
 *
 * ## What it measures, and what it only asks about
 *
 * A carry that starts in the kit starts on the part's shelf tile, which is
 * HTML furniture over the well: it is found by `data-kit-part`, scrolled
 * into view — the shelf on chapter two is wider than the well, and a person
 * would scroll to the part before picking it up — and measured here, once
 * per call, into a screen anchor. The tile does not move while the ring is
 * out. The coach figure does (its caption grows with the call), so the ring
 * leaves from and returns to a `coach` anchor the layer measures on every
 * frame; this hook only asks whether there is a figure on this bench at all.
 */
export function useAgentMascot(
  session: AgentSession,
  canvas: RefObject<CanvasHandle | null>,
) {
  const seen = useRef<string | null>(null);
  const running = session.state.running;

  useEffect(() => {
    if (!running) {
      /* The call settled. A ring that goes on performing a carry the model
         has refused is a lie told in the one register reserved for "the agent
         is doing this", so an error lands it where it is. A call that landed
         well keeps its flight, which may outlive the call — the seat is at
         the end of the carry, not the end of the return. */
      const id = seen.current;
      if (!id) return;
      const entry = session.state.activity.find((e) => e.call?.id === id);
      if (entry?.status === "error") land();
      return;
    }
    if (seen.current === running.id) return;
    seen.current = running.id;

    const job = jobFor(session.state, session.scene, running);
    if (!job) return;

    const view = canvas.current;
    const shaped = view ? fromShelf(job, view) : job;
    const options = optionsFrom(view?.getBounds() ?? null);

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    fly(shaped, options, reduced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  /* The ring belongs to this bench. Walking to the summary while an agent is
     mid-call would otherwise leave the store running against a canvas that is
     no longer mounted. */
  useEffect(() => () => land(), []);
}

/** How the way in from the lamp bows: a short lift, not a descent from off-screen. */
const LAMP_ARC = 40;

/**
 * The flight every job on this bench gets: out of the coach figure and back
 * into it. Without a figure in the box — none mounted, or the box not measured
 * yet — the entry is the old fixed offset and there is nowhere to go home to.
 */
export function optionsFrom(bounds: DOMRect | null): FlightOptions {
  const lamp: Anchor = { kind: "coach" };
  return bounds && coachCentreIn(bounds)
    ? { entry: lamp, home: lamp, arc: LAMP_ARC }
    : { entry: undefined, home: null };
}

/**
 * A carry that starts in the kit, started on the part's tile.
 *
 * The tile is scrolled into view before it is measured, and the box is
 * measured *after* that, because bringing a tile in can move the page in the
 * lab. The ring closes on the anchor mark — the leg the shelf says will land
 * — at the tile's own scale, so the drawing it then carries lies exactly over
 * the tile as it takes hold. No tile on screen (the reference view, a shelf
 * that is not mounted) and the ring arrives already carrying, as it did
 * before the shelf was on the canvas; no artwork for the part and it comes
 * for the tile and carries nothing, rather than a guess.
 */
function fromShelf(job: MascotJob, view: CanvasHandle): MascotJob {
  if (job.kind !== "carry" || job.from !== null || !job.carrying) return job;
  const { carrying } = job;

  const before = view.getBounds();
  const tile = before ? tileIn(before, carrying.part) : null;
  if (!tile) return { ...job, carrying: undefined };

  tile.scrollIntoView({
    inline: "nearest",
    block: "nearest",
    behavior: "instant",
  });
  const bounds = view.getBounds();
  if (!bounds) return { ...job, carrying: undefined };

  const art = tile.querySelector("svg") ?? tile;
  const rect = art.getBoundingClientRect();
  const shelf = shelfArt(carrying.component);
  const mark = carrying.mark;
  const grip =
    shelf && mark
      ? { x: rect.left + mark.x * shelf.scale, y: rect.top + mark.y * shelf.scale }
      : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  const from: Anchor = {
    kind: "screen",
    x: grip.x - bounds.left,
    y: grip.y - bounds.top,
  };
  return shelf ? { ...job, from } : { ...job, from, carrying: undefined };
}

/**
 * The shelf tile for `part` that belongs to the well in `bounds`, if any.
 *
 * Membership is asked of the tile's shelf rather than of the tile: a tile
 * scrolled off the end of chapter two's shelf is outside the well on the
 * screen and still the tile to pick up.
 */
function tileIn(bounds: DOMRect, part: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  for (const tile of document.querySelectorAll<HTMLElement>(
    `[data-kit-part="${CSS.escape(part)}"]`,
  )) {
    const shelf = tile.closest("ul") ?? tile;
    const rect = shelf.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (
      cx >= bounds.left &&
      cx <= bounds.right &&
      cy >= bounds.top &&
      cy <= bounds.bottom
    ) {
      return tile;
    }
  }
  return null;
}

function pointOf(scene: CircuitScene, id: NodeId | undefined): Anchor | null {
  if (!id) return null;
  const node = maybeNode(scene, id);
  return node ? { kind: "scene", x: node.x, y: node.y } : null;
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
     * `from` is where the lead is standing now. On the bench it is a node; in
     * the kit it has none, and the part is then named so the effect above can
     * find its tile — the shelf is on the canvas since chapter two, and the
     * ring picks the part off it the way a person does. A `target` of null is
     * the lead being left loose, and there is nowhere to carry it to: the
     * ring points at where it was instead.
     */
    case "attach_lead": {
      const to = pointOf(scene, args.target ?? undefined);
      const from = pointOf(scene, args.lead ?? undefined);
      if (!to) return from ? { kind: "point", at: from } : null;
      if (from) return { kind: "carry", from, to };

      const spec = buildFor(state.projectId)?.placement;
      const part = spec && args.lead ? partOf(spec, args.lead) : undefined;
      if (!spec || !part || !partsInKit(spec, state.placement).includes(part)) {
        return { kind: "carry", from: null, to };
      }
      return {
        kind: "carry",
        from: null,
        to,
        carrying: {
          part,
          component: spec.componentOf[part],
          mark: spec.anchorMark(part),
          /* A third copy of a drawing the shelf and the person's own drag
             may both be showing; see `PartArt.uid`. */
          uid: `ring-${part}`,
        },
      };
    }

    /**
     * Pointing at a thing by name.
     *
     * The handler's own resolver, so the ring and the spotlight it leaves
     * behind cannot disagree about which hole a name means. One place: a
     * part is pointed at by the first of its leads on the bench, a
     * connection by the end `locate` lists first. A part still in the kit
     * has no place on the bench — the ring around its shelf tile and the
     * coach's arm say it instead — and a ring sent to hover over nothing
     * would be exactly the attention `readPoints` refuses to claim.
     */
    case "point_at": {
      const found =
        typeof args.target === "string" ? locate(state, args.target) : null;
      const at =
        found?.where === "bench" ? pointOf(scene, found.nodes[0]) : null;
      return at ? { kind: "point", at } : null;
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
): Anchor[] {
  const owned = new Set(connections);
  const points: Anchor[] = [];
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
