import type { Copy } from "@/content/i18n";
import type { KitId } from "@/lib/projects/catalog";
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
 * Four things come out of the same pass:
 *
 *   **components** — which parts the step's wires actually reach. The board and
 *   the breadboard are deliberately not among them: they are the substrate,
 *   seated in step 2 and never fetched again, and listing them under every
 *   wiring step would bury the one part the step is really about.
 *
 *   **terminals** — the individual **leads** those wires name, in the order they
 *   name them. The same walk that finds the components already visits every one
 *   of them and used to throw them away; on a build the person assembles lead by
 *   lead, the rail asks a step which legs it is about, and deriving that from
 *   the connections is the only answer that cannot drift from them.
 *
 *   **jumpers** — one per connection *made with a cable*. Chapter one's joins
 *   are the components' own legs, so it asks for none; chapter two's are too,
 *   because there a cable is a part you fetch and it appears under
 *   **components** instead. The count is for loose wire nobody places, and
 *   both readings of it can be zero at once.
 *
 *   **pins** — board terminals only, in the order the step's connections name
 *   them. A breadboard hole is an address rather than a pin, and `bb.pos4` is
 *   not something a person reads off the board in front of them.
 *
 * What it cannot see: the capstone's two resistors. They have no node in that
 * graph because they sit in series inside a leg rather than between two
 * addressable points — and the step's own instruction names them, one line
 * above the canvas. A hand-added entry here would be the first line of the
 * hand-written list this function exists to avoid. Chapter one's resistor *is*
 * addressable, because there it is the part the step is about.
 */

export interface StepParts {
  components: KitId[];
  /**
   * The leads this step's connections name, in the order they name them.
   *
   * Empty for a step that owns no connection — chapter one's `Check your kit`
   * among them, which is right: it is about the box, not about a leg, and the
   * rail fills its rows from the spec's anchor leads instead.
   */
  terminals: NodeId[];
  /** One per connection the step owns. */
  jumpers: number;
  /** `D7`, `5V`, `GND` — printed on the board, so never translated (rule 13). */
  pins: string[];
}

/** Which part of the kit a node belongs to, or `null` for the substrate. */
function partOf(id: NodeId): KitId | null {
  if (id.startsWith("sensor.")) return "sensor";
  /* Chapters three and four. Their own prefixes rather than a shared
     `sensor.`, because these three tables are matched by prefix across every
     build at once: one `sensor.` answering for all three would put chapter
     five's drawing on chapter three's shelf and the ultrasonic sensor's name
     in chapter four's findings. */
  if (id.startsWith("pir.")) return "sensorMotion";
  if (id.startsWith("soil.")) return "sensorMoisture";
  if (id.startsWith("servo.")) return "servo";
  if (id.startsWith("led.")) return "led";
  if (id.startsWith("res.")) return "resistor";
  /* A cable is something you pick up in chapter two, so it is a component of
     the steps that name it and its two ends are leads like any other. This is
     what puts the four jumpers into `components` — the kit rows the rail draws
     — and their eight ends into `terminals`, which is the keyboard route into
     placing them; without it a cable can only ever be reached with a pointer.
     `"jumper"` is legal because the return type is `KitId` rather than
     `ComponentId`: the bench holds more kinds of thing than the ladder counts. */
  if (id.startsWith("wire.")) return "jumper";
  return null;
}

export function stepParts(scene: CircuitScene, stepId: StepId): StepParts {
  const step = stepById(stepId);
  const owned = scene.expected.filter((c) => step.connections.includes(c.id));

  /* What the step names outright comes first; the rest is derived from the
     wires it owns. */
  const components: KitId[] = [...(step.parts ?? [])];
  const terminals: NodeId[] = [];
  const pins: string[] = [];

  for (const connection of owned) {
    for (const end of [connection.from, connection.to]) {
      const part = partOf(end);
      if (part && !components.includes(part)) components.push(part);
      /* The same test, one level finer: an end that belongs to a part IS a
         lead — the substrate's ends are holes, and a hole is an address rather
         than something you pick up. */
      if (part && !terminals.includes(end)) terminals.push(end);
      if (end.startsWith("board.")) {
        const label = node(scene, end).label;
        if (label && !pins.includes(label)) pins.push(label);
      }
    }
  }

  /* Only the joins a cable actually makes. A leg is the part's own.
     Zero for every chapter-two step, and that is the right answer rather than
     a miscount: chapter two's cables are PARTS, every one of their ends stands
     in a hole as its own metal (`medium: "leg"`, twenty times), and they are
     already reported above as kit rows a person fetches. Counting them here as
     well would put "4 jumper wires" under a step that also lists four jumpers
     to pick up — one cable, said twice, in two different vocabularies. The
     count is for a chapter that wires with loose jumper wire nobody places. */
  const jumpers = owned.filter((c) => c.medium !== "leg").length;

  return { components, terminals, jumpers, pins };
}

/**
 * What a person would call the thing this lead belongs to.
 *
 * Three readers now, and they must agree: a finding's sentence, the kit shelf's
 * row, and the step rail's. They used to disagree — the panel said "the red
 * lamp's resistor" while the shelf beside it said "Resistor" three times over,
 * because the shelf named a part by its `componentOf` and a component is a
 * *kind*. On a bench holding three of a kind, a kind is not a name.
 *
 * Longest prefix first, always: `led.` matches `led.yellow.anode` too, so one
 * short prefix moved above a long one silently answers for every lamp.
 */
export function partNameOf(copy: Copy, id: NodeId): string {
  const parts = copy.build.parts;
  if (id.startsWith("board.")) return parts.board;
  if (id.startsWith("bb.")) return parts.breadboard;
  if (id.startsWith("sensor.")) return parts.sensor;
  if (id.startsWith("pir.")) return parts.sensorMotion;
  if (id.startsWith("soil.")) return parts.sensorMoisture;
  if (id.startsWith("servo.")) return parts.servo;
  /* Every cable in the kit is the same object, so there is nothing here to
     tell apart: `wire.gnd.pin` and `wire.green.row` are both "a jumper wire".
     The colour in a cable's id names the LAMP it serves, not the cable —
     spelling it out would invent a green jumper the box does not contain. */
  if (id.startsWith("wire.")) return parts.jumper;
  if (id.startsWith("led.green.")) return parts.ledGreen;
  if (id.startsWith("led.red.")) return parts.ledRed;
  if (id.startsWith("led.yellow.")) return parts.ledYellow;
  /* Chapter one has one LED and one resistor, so neither carries a side.
     Checked after the coloured ones, which are the longer prefixes — and
     missing until now, which is why chapter one's chips read `res.out`.
     The order is the whole rule: `led.` matches `led.yellow.anode` too, so a
     short prefix moved above a long one answers for it and all three of
     chapter two's lamps go back to reading "LED". */
  if (id.startsWith("led.")) return parts.led;
  /* Three resistors on one bench, and a finding names the one it means. Told
     apart by the lamp each serves rather than by the hole a sentence happens
     to point at: "the resistor is still in the box", printed three times
     identically, is a panel a person cannot act on. */
  if (id.startsWith("res.red.")) return parts.resistorRed;
  if (id.startsWith("res.yellow.")) return parts.resistorYellow;
  if (id.startsWith("res.green.")) return parts.resistorGreen;
  if (id.startsWith("res.")) return parts.resistor;
  return id;
}
