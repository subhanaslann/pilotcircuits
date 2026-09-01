import { isResolved, verifyStep } from "@/lib/agent/findings";
import type { AgentSessionState, SessionPatch } from "@/lib/agent/session";
import { stepsOwning, type StepId } from "@/lib/agent/steps";
import type { NodeId } from "@/lib/circuit/graph";
import {
  effectsOf,
  prune,
  tryAttach,
  type Placement,
  type PlacementEffects,
  type PlacementSpec,
  type Refusal,
  type TerminalId,
} from "@/lib/circuit/placement";

/**
 * Moving one lead, as one commit.
 *
 * A pure function rather than a branch inside `act()`, for a reason that is
 * about a tool that does not exist yet: §9 will eventually want the agent to
 * be able to place a part, and a tool goes through `run()` while a person goes
 * through `act()`. If this logic lived in the `act` branch, the tool would have
 * to grow a copy — which is the *second flow* §10 and `demo-scenarios.ts` both
 * forbid. One function, two callers.
 *
 * Not a one-key spread over `state.placement`: a join is stored once, on the
 * lead that made it, so moving a lead has to let go of whatever was joined
 * *onto* it as well. That rule lives in `attach`, and this is not the place to
 * reimplement the half of it that happens to be needed today.
 */
/**
 * The outcome of one write attempt, in a shape a caller can narrate.
 *
 * `patch` is empty when nothing happened, and `effects` is what actually
 * changed — not what was asked for. The session's sentences come from
 * `effects`; there is no path by which it can announce a move the model
 * declined, and none by which a knocked-over join goes unmentioned.
 */
export interface PlacementCommit {
  patch: SessionPatch;
  changed: boolean;
  effects: PlacementEffects;
  /** Set when the model said no, and why. */
  refusal?: Refusal;
}

const declined = (
  spec: PlacementSpec,
  placement: Placement,
  refusal?: Refusal,
): PlacementCommit => ({
  patch: {},
  changed: false,
  effects: effectsOf(spec, placement, placement),
  ...(refusal ? { refusal } : {}),
});

export function placeIn(
  state: AgentSessionState,
  spec: PlacementSpec,
  terminal: TerminalId,
  /**
   * A board hole, another part's free lead, or `null` — the lead hangs loose.
   *
   * `null` is not "back in the kit". The part returns to the box only when this
   * was its last path to a board hole, which `anchorsFor` decides inside
   * `prune` and nothing on this side has to know.
   */
  target: NodeId | null,
): PlacementCommit {
  const result = tryAttach(spec, state.placement, terminal, target);
  if (result.kind !== "attached") {
    return declined(
      spec,
      state.placement,
      result.kind === "refused" ? result.reason : undefined,
    );
  }
  return commit(state, spec, result.placement, terminal);
}

/**
 * Take a whole part off the bench, in one commit.
 *
 * Not N × `placeIn(lead, null)`: a part is one thing on a desk, and pulling its
 * leads out one at a time is N sentences, N undo entries, and N intermediate
 * states in which the part is half-attached and the drawing has to have an
 * opinion about where it is. One write, one consequence set, one line.
 */
export function removePart(
  state: AgentSessionState,
  spec: PlacementSpec,
  part: string,
): PlacementCommit {
  const leads = spec.terminalsOf[part] ?? [];
  let next = state.placement;
  for (const terminal of leads) {
    const result = tryAttach(spec, next, terminal, null);
    if (result.kind === "attached") next = result.placement;
  }
  if (next === state.placement) return declined(spec, state.placement);
  return commit(state, spec, next);
}

/**
 * The demo control's shortcut: write the placement that makes one expected
 * connection true.
 *
 * Not reachable from the learner's panel any more — see `PlacementSpec.
 * satisfying`. `null` from the spec means declined, and a declined shortcut
 * says so rather than committing an identical record and claiming a repair.
 */
export function satisfy(
  state: AgentSessionState,
  spec: PlacementSpec,
  connectionId: string,
): PlacementCommit {
  const next = spec.satisfying(state.placement, connectionId);
  if (!next) return declined(spec, state.placement);
  return commit(state, spec, next);
}

/**
 * Remove a join the sketch does not ask for. Demo control only.
 *
 * The endpoints travel with the id because a finding is a snapshot — by the
 * time this runs, the lead it names may hold something else, and a removal that
 * cannot check what it is removing is a destructive command with a stale
 * argument. `clearing` does that checking and answers `null` when the edge has
 * moved; this is only the commit around it.
 */
export function clear(
  state: AgentSessionState,
  spec: PlacementSpec,
  connectionId: string,
  edge: { from: NodeId; to: NodeId },
): PlacementCommit {
  const next = spec.clearing(state.placement, connectionId, edge);
  if (!next) return declined(spec, state.placement);
  return commit(state, spec, next);
}

/**
 * The only writer, and the reason there is only one.
 *
 * Five things land together, and none of them can be left out:
 *
 *   **The placement is pruned before anything reads it.** The placement never
 *   carries an edge the scene will not draw. A join between two parts that have
 *   both lost their path to a hole is gone, not remembered — otherwise putting
 *   one of them back resurrects the other part *and* a connection nobody made
 *   this time round, and the person is congratulated for it a second time.
 *
 *   **The scene follows the placement.** `sceneFrom` is the only producer of a
 *   scene on a build like this, so the two can never disagree about where a
 *   lead is or which joins exist.
 *
 *   **A repair is counted.** The person's normal gesture is now *move the lead
 *   to the right hole*, which never touches `act`'s `resolve` branch — so the
 *   counter that feeds `/complete`'s `Issues fixed` would have sat at zero for
 *   somebody who made a mistake and put it right. Counted per finding that came
 *   right and never twice for the same one, because a finding is asked of the
 *   graph rather than flagged and can come right as often as it is broken. The
 *   prune above is what keeps that honest: a join that goes away because a part
 *   went back in the box has genuinely gone away.
 *
 *   **Completed steps are asked again.** `verify_current_step` empties
 *   `findings` when it succeeds, so nothing is left to re-open when a lead is
 *   pulled out of a step that was already ticked. Without this the tick stays
 *   green about something that is no longer true — rule 6 running backwards,
 *   and the one regression this whole feature could quietly ship.
 *
 *   **A tick that comes off is renderable.** Left alone, `toProgressSteps`
 *   paints the un-ticked step `upcoming` — the same grey as *not reached yet* —
 *   while `completedAt` keeps offering `Finish` for a build with a broken step
 *   in it. Walking the active step back to the earliest step that came off
 *   makes the row read `Active`, which is true and needs no new vocabulary.
 */
function commit(
  state: AgentSessionState,
  spec: PlacementSpec,
  next: Placement,
  subject?: TerminalId,
): PlacementCommit {
  const placement = prune(spec, next);
  const scene = spec.sceneFrom(placement, state.scene.mechanical);
  /* Read against the record the person started from and the one that is about
     to land — including everything `prune` dropped on the way through, which is
     precisely the class of consequence nobody was ever told about. */
  const effects = effectsOf(spec, state.placement, placement, subject);

  /* Findings, not transitions. `isResolved` is a live re-read of the graph, so
     one finding goes open → resolved as many times as the person knocks that
     leg loose and puts it back — and counting the drop in the open *number*
     billed the same original mistake once per round trip, until `/complete`
     reported five issues fixed for one. A finding that has been paid for stays
     paid for, and the list of them travels in the patch. */
  const credited = new Set(state.repaired);
  const fixed = state.findings.filter(
    (finding) =>
      !credited.has(finding.id) &&
      !isResolved(finding, state.scene) &&
      isResolved(finding, scene),
  );

  const completedSteps = state.completedSteps.filter(
    (id) => verifyStep(scene, id).verified,
  );
  const dropped = state.completedSteps.filter(
    (id) => !completedSteps.includes(id),
  );

  return {
    patch: {
      placement,
      scene,
      repairs: state.repairs + fixed.length,
      ...(fixed.length
        ? { repaired: [...state.repaired, ...fixed.map((f) => f.id)] }
        : {}),
      completedSteps,
      ...(dropped.length
        ? {
            completedAt: null,
            activeStepId: backTo(state.activeStepId, dropped),
          }
        : {}),
      highlightedFindingId: null,
    },
    changed: effects.changed,
    effects,
  };
}

/**
 * The step a regression sends the person to: the earliest one that came off.
 *
 * Not *the earliest un-ticked step*, which is one step too far back and was
 * what this was first written as. `lampKit` is never ticked — its suggestion is
 * `next`, so the person leaves it through `navigate_build_step`, which moves
 * the active step without completing it — so breaking step three would open
 * step one and tell somebody with a half-built lamp on the bench to go and take
 * the parts out of the box. A step that came off is a step that was true and is
 * not any more, and that is the only thing that happened here.
 *
 * Seeded with the current step, so this only ever walks backwards: breaking a
 * step you are no longer standing on must not drag you forwards onto it.
 */
function backTo(activeStepId: StepId, dropped: StepId[]): StepId {
  const order = stepsOwning(activeStepId).map((step) => step.id);
  return dropped.reduce(
    (earliest, id) =>
      order.indexOf(id) < order.indexOf(earliest) ? id : earliest,
    activeStepId,
  );
}
