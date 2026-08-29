import type { ComponentId } from "@/lib/projects/catalog";
import { node, type CircuitScene, type NodeId } from "@/lib/circuit/graph";
import { stepById, type StepId } from "@/lib/agent/steps";

/**
 * W-03 · What a step touches.
 *
 * Derived from the connections the step owns, never listed by hand. A written
 * list is one that stops matching the graph the moment a wire moves, and this
 * block sits directly under a rail that claims to describe the same step — two
 * copies of one fact, drifting, is the mistake Batch 4 named and Batch 6
 * repeated in the palette.
 *
 * Three things come out of the same pass:
 *
 *   **components** — which parts the step's wires actually reach. The board and
 *   the breadboard are deliberately not among them: they are the substrate,
 *   seated in step 2 and never fetched again, and listing them under every
 *   wiring step would bury the one part the step is really about.
 *
 *   **jumpers** — one per connection, which is what a jumper is.
 *
 *   **pins** — board terminals only, in the order the step's connections name
 *   them. A breadboard hole is an address rather than a pin, and `bb.pos4` is
 *   not something a person reads off the board in front of them.
 *
 * What it cannot see: the two resistors in the LED step. They have no node in
 * the graph because they sit in series inside a leg rather than between two
 * addressable points — and the step's own instruction names them, one line
 * above the canvas. A hand-added entry here would be the first line of the
 * hand-written list this function exists to avoid.
 */

export interface StepParts {
  components: ComponentId[];
  /** One per connection the step owns. */
  jumpers: number;
  /** `D7`, `5V`, `GND` — printed on the board, so never translated (rule 13). */
  pins: string[];
}

/** Which part of the kit a node belongs to, or `null` for the substrate. */
function partOf(id: NodeId): ComponentId | null {
  if (id.startsWith("sensor.")) return "sensor";
  if (id.startsWith("servo.")) return "servo";
  if (id.startsWith("led.")) return "led";
  return null;
}

export function stepParts(scene: CircuitScene, stepId: StepId): StepParts {
  const step = stepById(stepId);
  const owned = scene.expected.filter((c) => step.connections.includes(c.id));

  const components: ComponentId[] = [];
  const pins: string[] = [];

  for (const connection of owned) {
    for (const end of [connection.from, connection.to]) {
      const part = partOf(end);
      if (part && !components.includes(part)) components.push(part);
      if (end.startsWith("board.")) {
        const label = node(scene, end).label;
        if (label && !pins.includes(label)) pins.push(label);
      }
    }
  }

  return { components, jumpers: owned.length, pins };
}
