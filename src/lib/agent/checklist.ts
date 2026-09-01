import type { AgentSessionState } from "@/lib/agent/session";
import { stepById, stepsOwning } from "@/lib/agent/steps";
import { diff, type Connection } from "@/lib/circuit/graph";

/**
 * What this step is still waiting for, one line each.
 *
 * ## The hole this fills
 *
 * The guidance tab had three things in it — the step's name, a sentence about
 * whether the agent had looked yet, and a preference selector — and on a step
 * with nothing wired it was three short lines above four hundred pixels of
 * nothing. Worse than ugly: the panel had *nothing to say about the build* on
 * the screen where the build is the subject, and the one thing it did say
 * ("the agent has not looked at this step") is a fact about the agent.
 *
 * A connection is exactly the countable object rule 5 asks for a tick each —
 * and the list is the only place in the product that prints what the sketch
 * asks for, item by item, against what is on the bench. The rail names parts,
 * the canvas draws wires, the findings name mistakes. Nobody was naming the
 * *requirements*.
 *
 * ## Why a step with no connections gets the whole build
 *
 * `Check your kit` and `Upload and watch it breathe` own no connections, and an
 * empty list under them would put the void back. What is true on both is the
 * same thing from opposite ends: the build has three joins, and here is how
 * many of them are made. At the start it reads as what is coming; at the end it
 * reads as the final check before the test. `scope` says which of the two the
 * heading should claim, and nothing here writes a word.
 */

export interface ChecklistItem {
  id: Connection["id"];
  /** The lead the sketch asks to be moved. Named by the panel, not here. */
  from: string;
  /** Where it belongs. */
  to: string;
  done: boolean;
  /**
   * Attached, but not where the sketch asks.
   *
   * A separate state from *not done*, because they are different sentences to
   * the person: one is work outstanding, the other is work to take back. It is
   * also exactly what the amber tick on the step rail is about.
   */
  wrong: boolean;
}

export interface Checklist {
  /** Whether these are the step's own connections, or the whole build's. */
  scope: "step" | "build";
  items: ChecklistItem[];
  done: number;
}

export function checklistFor(state: AgentSessionState): Checklist {
  const step = stepById(state.activeStepId);
  const own = step.connections;
  const ids = own.length
    ? own
    : stepsOwning(state.activeStepId).flatMap((s) => s.connections);

  const wanted = state.scene.expected.filter((c) => ids.includes(c.id));
  const open = diff(state.scene, ids).mismatches;

  const items = wanted.map((connection) => {
    const missed = open.find((m) => m.expected.id === connection.id);
    return {
      id: connection.id,
      from: connection.from,
      to: connection.to,
      done: !missed,
      /* An observed join carrying this id landed somewhere else. `diff` already
         worked out which one that is, and it is the only place that can: a
         lead's stray join is matched by id first and by origin second. */
      wrong: Boolean(missed?.observed),
    };
  });

  return {
    scope: own.length ? "step" : "build",
    items,
    done: items.filter((item) => item.done).length,
  };
}
