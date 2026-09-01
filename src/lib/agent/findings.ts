import type { Copy } from "@/content/i18n";
import {
  diff,
  extras,
  isServoAligned,
  maybeNode,
  type CircuitScene,
  type Connection,
  type Highlight,
  type NodeId,
} from "@/lib/circuit/graph";
import type { MonoTone, WireRole } from "@/lib/design/tokens";
import type { KitId } from "@/lib/projects/catalog";
/* The table that answers "which thing in the box is this a lead of" lives with
   the other node-id readings; the sentences below are its oldest caller but no
   longer its only one — the kit shelf and the step rail name a part the same
   way, off the lead a drag commits. */
import { partNameOf as ownerOf } from "@/lib/agent/parts";
import type { CoachingLevel, InspectionScope } from "@/lib/agent/model";
import {
  mechanicalStep,
  scopeChecksMechanical,
  scopeConnections,
  scopeKinds,
  stepById,
  stepOwning,
  type StepId,
} from "@/lib/agent/steps";

/**
 * Batch 4 · What the agent knows.
 *
 * The distinction this file exists to hold:
 *
 *   **The scene is what is true. A finding is what the agent has noticed.**
 *
 * Echo sits on D6 from the moment the page loads. The agent does not know that
 * until `inspect_build` runs — which is the only reason inspecting is an action
 * rather than a rendering pass, and the reason the activity timeline is a record
 * of discovery rather than a changelog.
 *
 * The two are reconciled, never merged. A finding stores node ids and a probe;
 * it never stores a copy of `"D6"`. Whether it is still open is answered by
 * re-reading the graph (`isResolved`), so moving one wire closes the finding,
 * drops the step back out of `issue` and re-labels the row — with no second
 * inspection and no second copy of the truth.
 */

export type FindingId = string;

export type FindingSeverity = "critical" | "warning" | "info";

export type FindingType =
  | "connection-mismatch"
  | "missing-connection"
  | "mechanical-alignment"
  /** A join nobody asked for. Not a wire in the wrong place — an extra path. */
  | "unexpected-connection"
  /**
   * A part the step needs that is still in the box.
   *
   * The finding this file could not make, and the gap the whole panel was
   * judged on. A connection naming a lead of a part in the kit has no nodes to
   * be wrong about, so the derivation below skipped it and `inspect_build`
   * answered **"Nothing to correct in this step"** on a bench with nothing on
   * it — and `verify_current_step`, which has no such guard, then refused the
   * same step with "1 issue still open" and named nothing. Two tools, one
   * build, opposite answers, and neither of them the truth.
   */
  | "part-not-placed";

/** G-07. Small, and never dressed up as instrumentation. */
export interface Evidence {
  /**
   * Which check saw it. The words are looked up, not stored.
   *
   * `graph` is the honest provenance for a stray: nothing was photographed and
   * nothing was measured against an angle — the sketch was read and something
   * was found in the build that is not in it.
   */
  kind: "camera" | "alignment" | "graph";
  /** 0–1. Rendered as a whole percent in mono, never as a bar. */
  confidence: number;
  /** Batch 4 is always true. Typed so a real vision service can say otherwise. */
  simulated: boolean;
}

/**
 * What kind of thing the sketch wants this lead to reach.
 *
 * The teaching ladder used to be one sentence for all 81 joins in the product,
 * and that sentence was the capstone's: *"the Echo pin sends the return pulse
 * timing back to the board"*, printed over a chapter-one resistor leg. The
 * middle rung has to be a fact about the join, and the only honest source for
 * such a fact is **what the far end is** — a numbered pin on the header, one of
 * the six holes marked A, a supply pin, a column of a breadboard, a rail, or
 * another part's own lead.
 *
 * Derived from the graph at derivation time and stored as a kind, never as a
 * sentence: the words are still looked up at render, so a finding already on
 * screen changes language with the rest of the panel.
 */
export type JoinTarget =
  | "digital-pin"
  | "analog-pin"
  | "power-pin"
  | "breadboard-row"
  | "power-rail"
  | "part-lead";

/**
 * What the near end physically is, for the sentences that have to name it.
 *
 * `exact` called every end a *wire* — "Move the black − wire" — on a chapter
 * whose two joins are the LED's and the resistor's own legs and which contains
 * no wire at all. A leg, a module's lead and a cable's end are three different
 * objects and the instruction differs for each.
 *
 * Read off the id's owner rather than off `Connection.medium`: chapter two's
 * four jumper cables are PARTS, and every one of their ends is `medium: "leg"`
 * twenty times over (`parts.ts`), so `medium` answers a different question.
 */
export type EndKind = "leg" | "lead" | "cable-end";

/** G-06. `Ultrasonic sensor → Echo`. */
export interface AffectedNode {
  id: NodeId;
  /** What the hardware itself prints on that pin. Never translated. */
  terminal: string;
  /** Mirrors the ring the canvas draws on that pin. */
  mark: "error" | "target" | "neutral";
}

/** How the session re-checks whether a finding is still true. */
export type FindingProbe =
  | { kind: "connection"; connectionId: Connection["id"] }
  /**
   * The INVERSE test: is this join gone?
   *
   * It must NOT go through `diff()`. `diff` filters `scene.expected`, so an id
   * nobody expects yields an empty list, zero mismatches and `resolved: true` —
   * a finding born already resolved, rendering as the green row and never
   * blocking anything. The endpoints ride along because the fix is a removal,
   * and a removal has to know what it is removing.
   */
  | {
      kind: "absent-connection";
      connectionId: Connection["id"];
      from: NodeId;
      to: NodeId;
    }
  | { kind: "servo-alignment" }
  /**
   * Is this lead on the bench at all?
   *
   * Answered from the scene rather than from the placement, deliberately:
   * `sceneFrom` emits a node for a lead only when its part has a path to a
   * board hole, so "has a node" *is* "is on the bench" — and `isResolved` keeps
   * its one-argument signature, which four call sites depend on.
   */
  | { kind: "absent-node"; nodeId: NodeId };

interface FindingBase {
  id: FindingId;
  severity: FindingSeverity;
  stepId: StepId;
  evidence: Evidence;
  affectedNodes: AffectedNode[];
  probe: FindingProbe;
  /**
   * Passed straight to `CircuitSceneView`. The panel and the canvas point at the
   * same thing because they are handed the same object.
   */
  highlight: Highlight;
  /** Feeds `boundsOf()` and then `CanvasHandle.focusOn`. */
  focus: { nodes: NodeId[]; padding: number; scale?: number };
  foundAt: number;
  /**
   * When `Check this` last read the build for this finding.
   *
   * Whether the finding is open is still answered by `isResolved`, live, off
   * the graph — these two fields carry only the fact that somebody asked, so
   * the row can say *"checked just now · still open"* rather than re-rendering
   * identically and looking like a button that does nothing. That silence was
   * the second half of the complaint the read-only check was written for: the
   * first half was the panel accepting a fix that had not happened, and the
   * cure for it is worthless if the honest answer is invisible.
   */
  checkedAt?: number;
  lastCheck?: "resolved" | "open" | "unreachable";
}

/**
 * The only words a finding stores are the ones the hardware prints: `Echo`,
 * `D6`, `D7`, `90`. Everything a person reads — the title, the sentence, the
 * three rungs, the buttons — is looked up from the dictionary at render time by
 * `findingWords`, so a finding already on screen changes language with the rest
 * of the panel instead of freezing in the language it was found in.
 */
export interface WiringFinding extends FindingBase {
  type: "connection-mismatch" | "missing-connection";
  /**
   * The role the sketch gives this join.
   *
   * It used to pick the wire's colour for the exact-fix rung, and that rung no
   * longer names one: `copy.wire.colour` is *"how you would ask for the wire
   * out loud, reaching into a tangle"*, which is the capstone's loose jumper.
   * Chapter one has no cable at all, the shelf deliberately draws all four of
   * chapter two's in one colour, and a lead in a mismatch is stroked in the
   * error orange rather than its role — so the named colour matched nothing on
   * screen. Kept because it is a fact about the join; nothing prints it.
   */
  role: WireRole;
  /** A leg, a module's lead, or a cable's end — see `EndKind`. */
  subjectKind: EndKind;
  /**
   * The terminal the wire leaves from, as the hardware prints it: `Echo`.
   *
   * Only what is actually printed. A part that prints nothing beside a lead —
   * every jumper cable in the product — has no answer here, which is why
   * `subjectLead` exists.
   */
  subject: string;
  /**
   * The lead itself, for the sentences, when the part prints nothing on it.
   *
   * Eight of chapter three's fifteen joins are cable ends, and a jumper prints
   * nothing on either of them by design — so `subject` fell back to the node
   * id and the panel said *"wire.power.pin is connected to 3V3"* while the chip
   * directly under it, which goes through `partNameOf`, said "Jumper wire".
   * The dictionary has had a name for every one of these ids since chapter two
   * (`build.leads`); this is what makes the sentence ask for it.
   */
  subjectLead?: NodeId;
  /** Where it belongs: `D7`. */
  expectedTerminal: string;
  /** Where it is, if it is plugged in at all: `D6`. */
  observedTerminal?: string;
  /**
   * The id of the far end, and what kind of thing it is.
   *
   * The id rather than only its printed label, because a lead is not printed
   * on: the sketch's target in chapter one is the LED's own long leg, and
   * *"clip it onto +"* is the panel reading a badge glyph out loud where the
   * dictionary has *"the LED's long leg"*. `expectedTerminal` stays the printed
   * value, which is what the `expected → observed` pair and `mono` want.
   */
  target: NodeId;
  targetKind: JoinTarget;
}

export interface MechanicalFinding extends FindingBase {
  type: "mechanical-alignment";
  expectedAngle: number;
  observedAngle: number;
}

/**
 * A join the sketch does not name.
 *
 * It cannot reuse `WiringFinding`: that shape carries an `expectedTerminal`,
 * and there is nothing the sketch wanted here. Saying "it belongs on D9" about
 * a join nobody asked for would be the interface inventing an intention.
 */
export interface ExtraFinding extends FindingBase {
  type: "unexpected-connection";
  /** The lead that made the join, as the hardware prints it: `+`. */
  subject: string;
  /** A leg, a module's lead, or a cable's end — see `EndKind`. */
  subjectKind: EndKind;
  /**
   * The lead itself, when the part prints nothing beside it.
   *
   * The same escape hatch `WiringFinding.subjectLead` is, and it was missing
   * here — so a stray made with a jumper end put `wire.gnd.pin` in the
   * sentence, in the chip, in the callout drawn on the canvas and in the
   * screen-reader label, which is a graph address on four surfaces at once.
   */
  subjectLead?: NodeId;
  /** What it reached: `220Ω`, `D13`. */
  otherTerminal: string;
  /** And the same, for the far end. */
  otherLead?: NodeId;
}

/**
 * A part the sketch needs and the bench does not have.
 *
 * Carries the `ComponentId` rather than a name, like every other finding
 * carries ids rather than words: the sentence is looked up at render, so a
 * finding already on screen changes language with the rest of the panel.
 */
export interface MissingPartFinding extends FindingBase {
  type: "part-not-placed";
  component: KitId;
  /** The lead the step names, which has no node because the part is in the kit. */
  terminal: NodeId;
}

export type Finding =
  | WiringFinding
  | MechanicalFinding
  | ExtraFinding
  | MissingPartFinding;

/* --- The words ----------------------------------------------------------
   One function, called at render. Nothing upstream of it may hold a sentence. */

export interface FindingWords {
  /** `Connection mismatch`. */
  title: string;
  /** One sentence. The hardware values inside it are listed in `mono`. */
  explanation: string;
  /** Values appearing in `explanation`, and the tone each carries. */
  mono: Record<string, MonoTone>;
  expected: string;
  observed: string;
  /** `Camera frame`, `Visual alignment check`. */
  evidenceLabel: string;
  /** The three rungs of the teaching ladder. */
  coaching: Record<CoachingLevel, string>;
  /**
   * `show` points at it; `check` asks the agent to look again.
   *
   * There used to be three different second labels — `I fixed it`, `I removed
   * it`, `I remounted it` — because the button asserted what the person had
   * done, and what they had done differed by finding kind. It reads the build
   * now, and reading is the same act whatever is wrong, so there is one word.
   */
  actions: { show: string; check: string };
  /** The chips, each with the part name in the reader's language. */
  nodes: (AffectedNode & { part: string })[];
}

/**
 * What the chip's mono half says.
 *
 * `AffectedNode.terminal` is *what the hardware prints there*, and a jumper
 * cable prints nothing on either of its ends by design — so the field fell back
 * to the node id and the chip read `Jumper wire → wire.gnd.pin`, in the font
 * reserved for silkscreen, with the same id read out by `a11y.showOnWorkbench`.
 * The dictionary has had a name for every one of those ids since chapter two.
 *
 * Resolved at render, never stored: `terminal === id` is exactly the case where
 * nothing was printed, because `affected()` falls back to the id and to nothing
 * else.
 */
function printedOrNamed(copy: Copy, node: AffectedNode): string {
  if (node.terminal !== node.id) return node.terminal;
  return copy.build.leads[node.id] ?? node.terminal;
}

export function findingWords(copy: Copy, finding: Finding): FindingWords {
  const nodes = finding.affectedNodes.map((n) => ({
    ...n,
    part: ownerOf(copy, n.id),
    terminal: printedOrNamed(copy, n),
  }));

  /* A lookup rather than a ternary: with three kinds, a two-way test captions
     everything that is not a camera frame as an alignment check — which is the
     one failure this file cannot see, because it still renders. */
  const evidenceLabel = copy.findings.evidence[finding.evidence.kind];

  if (finding.type === "mechanical-alignment") {
    return {
      title: copy.findings.servoOff,
      explanation: copy.findings.servoExplanation,
      mono: {},
      expected: `${finding.expectedAngle}°`,
      observed: `${finding.observedAngle}°`,
      evidenceLabel,
      coaching: {
        hint: copy.findings.servoHint,
        explain: copy.findings.servoExplain,
        exact: copy.findings.servoExact,
      },
      actions: {
        show: copy.workbench.previewAngle,
        check: copy.workbench.checkThis,
      },
      nodes,
    };
  }

  if (finding.type === "unexpected-connection") {
    /* Three forms of one lead again — see the wiring branch below. `nom` opens
       the sentence that reports the join and stands beside the arrow; `object`
       is what the two rungs act on. A lead its part prints nothing beside is
       named from the dictionary rather than from its node id. */
    const printed = finding.subject;
    const nom = finding.subjectLead
      ? (copy.build.leads[finding.subjectLead] ?? printed)
      : copy.findings.subjectNominative[finding.subjectKind](printed);
    const object = finding.subjectLead
      ? (copy.build.leadObject[finding.subjectLead] ?? printed)
      : copy.findings.subjectObject[finding.subjectKind](printed);
    const other = finding.otherLead
      ? (copy.build.leads[finding.otherLead] ?? finding.otherTerminal)
      : finding.otherTerminal;
    const subject = nom;
    return {
      title: copy.findings.unexpectedConnection,
      explanation: copy.findings.unexpectedDetail(subject, other),
      /* Only what the hardware actually prints goes in mono (rule 13). A lead
         its part says nothing about has a dictionary name, and a dictionary
         name set in the silkscreen font is the same category error as an id. */
      mono: {
        ...(finding.subjectLead ? {} : { [printed]: "error" as MonoTone }),
        ...(finding.otherLead ? {} : { [other]: "error" as MonoTone }),
      },
      /* There is no expected terminal, and a blank here would read as one the
         panel forgot to fill in. */
      expected: copy.findings.notAsked,
      observed: `${subject} → ${other}`,
      evidenceLabel,
      coaching: {
        hint: copy.findings.unexpectedHint(object),
        explain: copy.findings.unexpectedExplain(object),
        exact: copy.findings.unexpectedExact(object),
      },
      /* One label, and it fits this kind best of the three: the fix for a join
         the sketch does not ask for is a removal, made on the bench by pulling
         the lead loose. The panel's job is to look afterwards and say whether
         it is gone — which is what `Check this` promises and `I removed it`
         did not, because it performed the removal itself. */
      actions: {
        show: copy.workbench.showMe,
        check: copy.workbench.checkThis,
      },
      nodes,
    };
  }

  if (finding.type === "part-not-placed") {
    /* Named from the LEAD, not from `component`. `component` answers "which
       artwork", and chapter two has three parts sharing each of two answers —
       so `copy.build.parts[finding.component]` printed "LED" three times and
       "Resistor" three times, on three different rows of one panel, each about
       a different thing in the box. `ownerOf` is also what names the chips
       below, so the row's sentence and its chips cannot disagree.
       `finding.terminal` rather than `finding.probe.nodeId`: same node, but it
       is on the narrowed type and needs no re-narrowing of the probe union. */
    const part = ownerOf(copy, finding.terminal);
    return {
      title: copy.findings.partNotPlaced,
      explanation: copy.findings.partNotPlacedDetail(part),
      /* Nothing hardware prints appears in this sentence: the part's name is
         the product's word for it, and mono is reserved for what is silkscreened
         on the board (rule 13). */
      mono: {},
      expected: copy.findings.onTheBench,
      observed: copy.findings.inTheKit,
      evidenceLabel,
      coaching: {
        hint: copy.findings.partNotPlacedHint(part),
        explain: copy.findings.partNotPlacedExplain(part),
        exact: copy.findings.partNotPlacedExact(part),
      },
      actions: { show: copy.workbench.showMe, check: copy.workbench.checkThis },
      nodes,
    };
  }

  const { expectedTerminal: want, observedTerminal: got, targetKind } = finding;
  const words = copy.findings;

  /* The lead named three ways, because three sentences want three different
     things from it.

     `label` is the standing form — the one that goes either side of an arrow in
     the `expected` / `observed` pair, where `build.leads`'s own contract (a
     capitalised, article-less name) is exactly right.

     `nom` opens a sentence and `object` sits inside one. English marks the
     difference with an article and a capital; Turkish inflects the noun itself,
     which is why `build.leadObject` exists and why splicing the naming form
     mid-sentence produced "Compare the Jumper's board end wire".

     A part that prints something beside the lead keeps printing it (rule 13):
     chapter six's `Echo` is what is silkscreened on the module in your hand,
     and no dictionary name may replace it. What it gains is the noun that says
     what kind of thing it is — a leg, a lead, or a cable's end. */
  const named = finding.subjectLead;
  const printed = finding.subject;
  const label = named ? (copy.build.leads[named] ?? printed) : printed;
  const nom = named
    ? (copy.build.leads[named] ?? printed)
    : words.subjectNominative[finding.subjectKind](printed);
  const object = named
    ? (copy.build.leadObject[named] ?? printed)
    : words.subjectObject[finding.subjectKind](printed);

  /* Where the sketch wants it. A hole and a board pin print an address, and
     that address is what the sentence says; another part's lead prints a badge
     glyph, so "clip it onto +" would be the panel reading a symbol out loud
     where the dictionary has "the LED's long leg". `leadTarget` is the table
     written for exactly this — the case a sentence arrives at. */
  const target =
    targetKind === "part-lead"
      ? (copy.build.leadTarget[finding.target] ?? want)
      : want;

  return {
    title: got
      ? copy.findings.connectionMismatch
      : copy.findings.missingConnection,
    explanation: got
      ? copy.findings.wrongPin(nom, got, want)
      : copy.findings.missingWire(nom, want),
    mono: got ? { [got]: "error", [want]: "target" } : { [want]: "target" },
    expected: `${label} → ${want}`,
    observed: got ? `${label} → ${got}` : copy.findings.notWired,
    evidenceLabel,
    coaching: {
      hint: hintFor(copy, targetKind, object),
      explain: explainFor(copy, targetKind, object, target),
      /* Two sentences, not one with a hole in it. `exact` used to be handed
         `got ?? ""`, so a lead that is in no hole at all read *"Move the black
         − wire from  to F9."* — a double space in English, and in Turkish a
         case suffix stranded on nothing (" pininden"). A missing connection is
         a placement; only a misplaced one is a move. */
      exact: got
        ? moveFor(copy, targetKind, object, got, target)
        : putFor(copy, targetKind, object, target),
    },
    actions: { show: copy.workbench.showMe, check: copy.workbench.checkThis },
    nodes,
  };
}

/**
 * The first rung, per kind of target.
 *
 * It used to say *"Compare the ${subject} wire with the highlighted digital-pin
 * row"* for all 81 joins — the capstone's geometry, where every fault is on the
 * digital header. Only 16 of the 81 targets are digital pins. The rest are
 * breadboard columns, rails, supply pins, another part's leg, and chapter
 * four's `A0` — the analog hole that chapter's whole lesson is about, which the
 * ladder's first rung was pointing away from.
 */
function hintFor(copy: Copy, target: JoinTarget, subject: string): string {
  const words = copy.findings;
  switch (target) {
    case "analog-pin":
      return words.hintAnalog(subject);
    case "power-pin":
      return words.hintPower(subject);
    case "breadboard-row":
      return words.hintRow(subject);
    case "power-rail":
      return words.hintRail(subject);
    case "part-lead":
      return words.hintLead(subject);
    default:
      return words.hint(subject);
  }
}

/**
 * The middle rung: one true thing about this kind of join.
 *
 * Never about the chapter. The sentence a person reads under a chapter-one
 * resistor is about what a numbered pin is; the one under chapter two's lamp is
 * about what a breadboard column is made of. Neither of them is about an
 * ultrasonic sensor, which is what all six chapters said in both languages.
 */
function explainFor(
  copy: Copy,
  target: JoinTarget,
  subject: string,
  expected: string,
): string {
  const words = copy.findings;
  switch (target) {
    case "analog-pin":
      return words.explainAnalog(subject, expected);
    case "power-pin":
      return words.explainPower(subject, expected);
    case "breadboard-row":
      return words.explainRow(subject, expected);
    case "power-rail":
      return words.explainRail(subject, expected);
    case "part-lead":
      return words.explainLead(subject, expected);
    default:
      return words.explain(subject, expected);
  }
}

/** The lead is in the wrong place: take it out of there and put it here. */
function moveFor(
  copy: Copy,
  target: JoinTarget,
  subject: string,
  from: string,
  to: string,
): string {
  const words = copy.findings;
  if (target === "part-lead") return words.exactJoin(subject, to);
  if (target === "breadboard-row" || target === "power-rail") {
    return words.exactMoveHole(subject, from, to);
  }
  return words.exactMove(subject, from, to);
}

/** The lead is in no hole at all: there is nothing to move it from. */
function putFor(
  copy: Copy,
  target: JoinTarget,
  subject: string,
  to: string,
): string {
  const words = copy.findings;
  if (target === "part-lead") return words.exactJoin(subject, to);
  if (target === "breadboard-row" || target === "power-rail") {
    return words.exactPutHole(subject, to);
  }
  return words.exactPut(subject, to);
}

/* --- Naming -------------------------------------------------------------- */


/**
 * What is printed beside a node — and, for a hole, what a person reads off the
 * plastic when the chapter's own artwork carries no silkscreen.
 *
 * Chapters two to five label every hole (`F7`, `−6`); the capstone's carry only
 * `row` and `col`, so every reader that wanted an address there fell back to
 * the raw id and printed `bb.pos1` where the silkscreen belongs. The address is
 * derivable from the two fields the node already has, in exactly the form the
 * labelled chapters spell it — `U+2212` on the rail, because that is what is
 * printed there and what is read out loud.
 *
 * Exported because it is not only the findings' problem: the step checklist
 * (`checklist.tsx`) has the same `?? item.to` fallback and prints the same id
 * on the same chapter.
 */
export function printedLabel(
  scene: CircuitScene,
  id: NodeId,
): string | undefined {
  const found = maybeNode(scene, id);
  if (!found) return undefined;
  if (found.label) return found.label;
  if (found.row === undefined || found.col === undefined) return undefined;
  if (found.row === "+") return `+${found.col}`;
  if (found.row === "-") return `−${found.col}`;
  return `${found.row.toUpperCase()}${found.col}`;
}

function affected(
  scene: CircuitScene,
  id: NodeId,
  mark: AffectedNode["mark"],
): AffectedNode {
  return { id, terminal: printedLabel(scene, id) ?? id, mark };
}

/** Which of the six kinds of far end this is. Asked of the graph, once. */
function joinTargetOf(scene: CircuitScene, id: NodeId): JoinTarget {
  const found = maybeNode(scene, id);
  if (!found || found.kind === "terminal") return "part-lead";
  if (found.kind === "breadboard-hole") {
    return found.row === "+" || found.row === "-"
      ? "power-rail"
      : "breadboard-row";
  }
  const label = found.label ?? "";
  /* `A0`…`A5`. The one address chapter four exists to teach, and the one the
     shared hint used to steer a reader away from. */
  if (/^A\d+$/.test(label)) return "analog-pin";
  if (/^(5V|3V3|GND|VIN)$/.test(label)) return "power-pin";
  return "digital-pin";
}

/**
 * A leg, a module's lead, or a cable's end.
 *
 * By the id's owner, which is the same test `partOf` and `componentOf` already
 * make. Not by `Connection.medium`: chapter two's cables are parts whose ends
 * stand in holes as their own metal, so they are `"leg"` there twenty times
 * over and a sentence keyed off that field would call them legs.
 */
function endKindOf(id: NodeId): EndKind {
  if (id.startsWith("wire.")) return "cable-end";
  if (id.startsWith("led.") || id.startsWith("res.")) return "leg";
  return "lead";
}

/* --- Derivation ---------------------------------------------------------- */

const wiringFindingId = (id: Connection["id"]): FindingId =>
  `finding:wiring:${id}`;

export const SERVO_FINDING_ID: FindingId = "finding:mechanical:servo-horn";

/**
 * Tuned in Batch 3 for the D6/D7 case: the pins are 2.54 mm apart, so the
 * callout needs room above the header and the scale has to be high enough to
 * read them as two separate holes.
 */
const PIN_FOCUS = { padding: 110, scale: 2.9 } as const;
const SERVO_FOCUS = { padding: 160, scale: 1.8 } as const;

/** Which step a connection belongs to, whichever build it is part of. */
function owningStepId(connectionId: Connection["id"], fallback: StepId): StepId {
  return stepOwning(connectionId)?.id ?? fallback;
}

function wiringFinding(
  scene: CircuitScene,
  expected: Connection,
  observed: Connection | undefined,
  activeStepId: StepId,
  now: number,
): WiringFinding {
  const printed = maybeNode(scene, expected.from)?.label;
  const subject = printed ?? expected.from;
  const wantLabel = printedLabel(scene, expected.to) ?? expected.to;
  const gotLabel = observed
    ? (printedLabel(scene, observed.to) ?? observed.to)
    : undefined;

  return {
    id: wiringFindingId(expected.id),
    type: observed ? "connection-mismatch" : "missing-connection",
    severity: "warning",
    stepId: owningStepId(expected.id, activeStepId),
    role: expected.role,
    subjectKind: endKindOf(expected.from),
    subject,
    /* Only where the part prints nothing: an LED's `−`, a resistor's `220Ω`
       and a sensor's `D` are what is written on the thing in your hand, and a
       sentence that replaced them with a phrase would be naming the hardware
       for it. */
    ...(printed ? {} : { subjectLead: expected.from }),
    expectedTerminal: wantLabel,
    observedTerminal: gotLabel,
    target: expected.to,
    targetKind: joinTargetOf(scene, expected.to),
    evidence: { kind: "camera", confidence: 0.94, simulated: true },
    affectedNodes: [
      affected(scene, expected.from, "neutral"),
      ...(observed ? [affected(scene, observed.to, "error")] : []),
      affected(scene, expected.to, "target"),
    ],
    probe: { kind: "connection", connectionId: expected.id },
    /* Same rule as the stray's below: the callout sets this in the silkscreen
       font, so only what is silkscreened may go in it. */
    highlight: {
      connectionId: expected.id,
      errorPin: observed?.to,
      targetPin: expected.to,
      ...(printed ? { subject: printed } : {}),
    },
    focus: {
      nodes: [expected.to, ...(observed ? [observed.to] : [])],
      ...PIN_FOCUS,
    },
    foundAt: now,
  };
}

const extraFindingId = (id: Connection["id"]): FindingId =>
  `finding:extra:${id}`;

/**
 * Which step a stray belongs to: the one owning an expected connection that
 * names either of its ends.
 *
 * Its own decision rather than a fallback being leant on. `scopeConnections`
 * returns expected ids and cannot scope a join the sketch never named, and
 * `stepOwning` returns `undefined` for a minted id — so without this a stray
 * would either belong to every step or to none. Shared with `verifyStep`, which
 * asks the same question about the same connection and must get the same answer
 * or a step could tick while the panel still shows something open against it.
 */
/**
 * Whether a join the sketch does not ask for is this step's business.
 *
 * By the **parts** the step's connections name, not by the exact ends.
 *
 * The narrow reading — does the stray share an endpoint with one of the step's
 * expected connections — let chapter one's canonical mistake through. Step two
 * says *put the short leg in GND and leave the long leg loose*, and it owns one
 * connection, `led.cathode → board.GND`. Push the long leg into `D13` and the
 * stray touches `led.anode`, which that connection never names — so nothing
 * counted it, and the step verified green on an LED shorted straight across the
 * header. The step is about the LED. A join made with the LED's other leg is
 * about the LED too.
 */
function touchesStep(
  scene: CircuitScene,
  extra: Connection,
  within: Connection["id"][],
): boolean {
  const owner = (id: NodeId) => id.slice(0, id.lastIndexOf("."));
  const parts = new Set(
    scene.expected
      .filter((c) => within.includes(c.id))
      .flatMap((c) => [c.from, c.to])
      /* Board holes are not a part anybody placed: every step touches the
         board, so counting it would make every stray every step's business. */
      .filter((id) => !id.startsWith("board.") && !id.startsWith("bb."))
      .map(owner),
  );
  return [extra.from, extra.to].some((end) => parts.has(owner(end)));
}

function extraFinding(
  scene: CircuitScene,
  extra: Connection,
  activeStepId: StepId,
  now: number,
): ExtraFinding {
  const to = maybeNode(scene, extra.to);
  const fromLabel = printedLabel(scene, extra.from);
  const toLabel = printedLabel(scene, extra.to);
  const near = scene.expected.find((c) =>
    [c.from, c.to].some((end) => end === extra.from || end === extra.to),
  );

  return {
    id: extraFindingId(extra.id),
    type: "unexpected-connection",
    /* `warning`, like the other two. `critical` is used nowhere in the product,
       and introducing it here would put the only red disc on screen on the
       mildest of the three faults. */
    severity: "warning",
    stepId: near ? owningStepId(near.id, activeStepId) : activeStepId,
    subject: fromLabel ?? extra.from,
    subjectKind: endKindOf(extra.from),
    ...(fromLabel ? {} : { subjectLead: extra.from }),
    otherTerminal: toLabel ?? extra.to,
    ...(toLabel ? {} : { otherLead: extra.to }),
    evidence: { kind: "graph", confidence: 0.9, simulated: true },
    /* Both ends `error` and no `target`: there is no pin this belongs on. That
       also keeps `CorrectionCallout` — which needs both an error and a target
       pin — correctly off, so only `WrongPinMark` draws. */
    affectedNodes: [
      affected(scene, extra.from, "error"),
      affected(scene, extra.to, "error"),
    ],
    probe: {
      kind: "absent-connection",
      connectionId: extra.id,
      from: extra.from,
      to: extra.to,
    },
    /* The mark goes on the thing the person CHOSE. For a lead put into a hole
       that is the hole: the lead's drawn position is half a unit from the hole
       one along, and a disc there would accuse the wrong pin. */
    /* `subject` only where something is printed. It is drawn in the callout's
       mono, beside `F9 → F7`, and that component's own note says a translated
       noun there would be the one place the callout stopped speaking the
       board's language — so the honest answer for a lead that prints nothing is
       to say nothing and let the callout fall back to the pin's own address. */
    highlight: {
      connectionId: extra.id,
      errorPin: to?.kind === "board-pin" ? extra.to : extra.from,
      ...(fromLabel ? { subject: fromLabel } : {}),
    },
    focus: { nodes: [extra.from, extra.to], ...PIN_FOCUS },
    foundAt: now,
  };
}

function servoFinding(
  scene: CircuitScene,
  activeStepId: StepId,
  now: number,
): MechanicalFinding {
  const stepId =
    mechanicalStep(activeStepId)?.id ?? activeStepId;

  return {
    id: SERVO_FINDING_ID,
    type: "mechanical-alignment",
    severity: "warning",
    stepId,
    expectedAngle: scene.mechanical.expectedAngle,
    observedAngle: scene.mechanical.servoAngle,
    evidence: { kind: "alignment", confidence: 0.91, simulated: true },
    affectedNodes: [affected(scene, "servo.signal", "neutral")],
    probe: { kind: "servo-alignment" },
    highlight: {},
    focus: {
      nodes: ["servo.signal", "servo.power", "servo.ground"],
      ...SERVO_FOCUS,
    },
    foundAt: now,
  };
}

/** Which kit component a node belongs to, or `null` for the board itself. */
function componentOf(id: NodeId): KitId | null {
  if (id.startsWith("sensor.")) return "sensor";
  /* One ladder, three sensors. The counted vocabulary still says `sensor`
     once; the KIT id is what the shelf draws and what a finding names, and a
     motion sensor called "the ultrasonic sensor" would be the panel describing
     a part that is not on the bench. */
  if (id.startsWith("pir.")) return "sensorMotion";
  if (id.startsWith("soil.")) return "sensorMoisture";
  if (id.startsWith("servo.")) return "servo";
  if (id.startsWith("led.")) return "led";
  if (id.startsWith("res.")) return "resistor";
  /* A jumper is a part in chapter two, and this branch is what makes it
     findable at all. Without it `deriveFindings` gets `null`, the
     `if (component && …)` guard below silently `continue`s, and `inspect_build`
     answers "Nothing to correct in this step" on a bench whose ground cable is
     still in the box — the exact silence `part-not-placed` was written to end,
     re-opened for the one part chapter two hands over four of. Legal because
     the return type is `KitId`: what a bench holds is wider than what the
     ladder counts. */
  if (id.startsWith("wire.")) return "jumper";
  if (id.startsWith("bb.")) return "breadboard";
  if (id.startsWith("board.")) return "board";
  return null;
}

/**
 * One finding per PART — and a part is the owner segment of its lead's id.
 *
 * It used to be the component id, which is true of a chapter with one of
 * everything and false of every chapter without. Chapter two's ten parts fall
 * into three component ids, so all three LEDs collapsed into a single
 * `kit-led` that resolved the moment the FIRST one reached the bench: the panel
 * announced the lamps were placed with two of them still in the box, and the
 * two remaining `part-not-placed` findings were never even minted because the
 * dedupe had already seen that id. The capstone had the same fault, quietly,
 * with its red and green LEDs.
 *
 * `id.slice(0, id.lastIndexOf("."))` is the same slice `touchesStep` takes, so
 * a missing part and the step held responsible for it are scoped by one rule:
 * `led.red`, `res.green`, `wire.gnd`, and chapter one's `led` and `res`
 * unchanged in shape.
 *
 * The dot is guaranteed rather than hoped for: the only caller reaches this
 * behind `componentOf(absent)`, which answers non-null only for an id that
 * matched one of its dot-terminated `startsWith` prefixes.
 */
const partFindingId = (id: NodeId): FindingId =>
  `kit-${id.slice(0, id.lastIndexOf("."))}`;

function missingPartFinding(
  scene: CircuitScene,
  component: KitId,
  terminal: NodeId,
  stepId: StepId,
  now: number,
  /**
   * Where the part is going — the ends of its connection that **are** on the
   * bench.
   *
   * It used to focus nothing, on the reasoning that the thing this is about is
   * not there. True of the part; false of the finding. `show_correction` then
   * returned `focused: []`, the camera did not move, the ring did not come and
   * the agent had, in effect, pointed at nothing while reporting success. The
   * hole the sketch wants it in is on the bench and is exactly where a person
   * has to look.
   */
  towards: NodeId[] = [],
): MissingPartFinding {
  return {
    /* Keyed by the LEAD, not by `component`: `component` says which icon the
       kit strip draws, and three of chapter two's parts draw the same one. */
    id: partFindingId(terminal),
    type: "part-not-placed",
    /* Not `critical`: nothing is wired wrongly and nothing is at risk. It is
       the next thing to do, and the panel's job is to say so plainly. */
    severity: "info",
    stepId,
    component,
    terminal,
    /* `graph` is the honest provenance — nothing was photographed and nothing
       was measured. The sketch was read and a part it names is not there. */
    evidence: { kind: "graph", confidence: 1, simulated: true },
    /* Through the same reader the other three kinds use. This built its own
       node objects and put the raw id in `terminal`, so every one of these
       chips read `Breadboard → bb.f7` — in the mono reserved for silkscreen —
       while the wiring rows replacing them minutes later read `Breadboard →
       F7`. Two vocabularies for one hole, in one list.
       `target`, not `error`: nothing here is wrong. This is the hole waiting
       for a part that has not arrived. */
    affectedNodes: towards.map((id) => affected(scene, id, "target")),
    probe: { kind: "absent-node", nodeId: terminal },
    /* The hole it is going into gets the target ring — there is no error pin,
       because nothing is in the wrong place. */
    highlight: { targetPin: towards[0] },
    focus: { nodes: towards, padding: PIN_FOCUS.padding, scale: PIN_FOCUS.scale },
    foundAt: now,
  };
}

/**
 * The whole derivation. Nothing else in the codebase builds a `Finding`.
 *
 * `diff()` stays the only authority on wiring: this picks the `within` list off
 * the step definition and turns each `Mismatch` into product language.
 */
export function deriveFindings(
  scene: CircuitScene,
  scope: InspectionScope,
  activeStepId: StepId,
  now: number,
): Finding[] {
  const within = scopeConnections(scope, activeStepId);
  /* Which kinds this scope admits. Asking for `wiring` and being handed "the
     LED is still in the kit" is what this closes. */
  const kinds = scopeKinds(scope);
  const found: Finding[] = [];

  if (within === undefined || within.length > 0) {
    for (const mismatch of diff(scene, within).mismatches) {
      /* A connection can name a terminal that is not on the bench: a part
         still in the kit has no pins to be wrong about. Deriving a finding
         from it used to throw inside the handler, which the runner turned into
         a bare `Tool failed` — the central act of the product degraded into
         what looks like a flake. Saying nothing is not the final answer either
         (that is a finding of its own), but it is the honest floor. */
      const named = [
        mismatch.expected.from,
        mismatch.expected.to,
        ...(mismatch.observed ? [mismatch.observed.to] : []),
      ];
      /* A connection can name a lead of a part that is still in the box. That
         is not "nothing to correct" — it is the most correctable thing on the
         bench, and it is what the person is being asked to do next. One
         finding per part rather than one per lead: a resistor with both ends
         unplaced is one resistor in one box. Deduped on the PART, which is why
         `partFindingId` takes the lead and not the component — three lamps in
         one box are three things to fetch, not one. */
      const absent = named.find((id) => !maybeNode(scene, id));
      if (absent) {
        if (!kinds.placement) continue;
        const component = componentOf(absent);
        if (component && !found.some((f) => f.id === partFindingId(absent))) {
          found.push(
            missingPartFinding(
              scene,
              component,
              absent,
              /* The step that OWNS the connection, exactly as `wiringFinding`
                 does one branch below. It was handed `activeStepId`, so every
                 "this part is still in the box" was stamped on whichever step
                 the person happened to be standing on: the rail blamed the
                 wrong row, and `inspectionCovers` then counted these inside
                 `current_step` and filtered them straight back out. */
              owningStepId(mismatch.expected.id, activeStepId),
              now,
              /* The ends of this join that are on the bench: where the part is
                 going, which is the only part of the answer that can be shown. */
              named.filter((id) => id !== absent && maybeNode(scene, id)),
            ),
          );
        }
        continue;
      }

      if (!kinds.wiring) continue;
      found.push(
        wiringFinding(
          scene,
          mismatch.expected,
          mismatch.observed,
          activeStepId,
          now,
        ),
      );
    }

    /* The other question, which `diff` is structurally unable to ask: it
       enumerates `expected`, so an observed join with no counterpart there is
       invisible to it. No on-bench guard, unlike the pass above — `sceneFrom`
       emits an observed join only when both endpoints have nodes, so an
       extra's ends are on the bench by construction. */
    for (const extra of extras(scene)) {
      if (!kinds.wiring) continue;
      if (within && !touchesStep(scene, extra, within)) continue;
      found.push(extraFinding(scene, extra, activeStepId, now));
    }
  }

  if (
    kinds.mechanical &&
    scopeChecksMechanical(scope, activeStepId) &&
    !isServoAligned(scene)
  ) {
    found.push(servoFinding(scene, activeStepId, now));
  }

  return found;
}

/**
 * Whether an inspection of this scope was **looking at** this finding.
 *
 * The rule an inspection's patch follows: *it replaces what it looked at and
 * leaves what it did not.* Without it, `inspect_build` replaced the whole list
 * every time — so asking about the wiring threw away a still-true "the resistor
 * is in the kit" from a `placement` inspection a second earlier, and the id an
 * agent was holding stopped resolving. A tool that invalidates its own previous
 * answers cannot be driven by anything but a single call at a time.
 */
export function inspectionCovers(
  finding: Finding,
  scope: InspectionScope,
  activeStepId: StepId,
): boolean {
  const kinds = scopeKinds(scope);
  const admitted =
    finding.type === "part-not-placed"
      ? kinds.placement
      : finding.type === "mechanical-alignment"
        ? kinds.mechanical
        : kinds.wiring;
  if (!admitted) return false;
  /* Every other scope reads the whole build; only this one is narrowed to the
     step you are standing on. */
  return scope === "current_step" ? finding.stepId === activeStepId : true;
}

/** Re-reads the graph. A finding is never marked fixed; it is asked. */
export function isResolved(finding: Finding, scene: CircuitScene): boolean {
  if (finding.probe.kind === "servo-alignment") return isServoAligned(scene);
  /* Asked of `observed` directly, never through `diff`: `diff` scopes by
     `expected`, and an id nothing expects returns zero mismatches — a stray
     would be born resolved. The id is minted from the lead that made the join,
     which is what makes every outcome come out right: pull the lead loose and
     the id is gone; join it where the sketch asks and it becomes `bl.c.anode`,
     so the minted id is gone too; move it to a different wrong target and the
     id is unchanged, so the finding correctly stays open. */
  if (finding.probe.kind === "absent-connection") {
    const { connectionId } = finding.probe;
    return !scene.observed.some((c) => c.id === connectionId);
  }
  /* A part is on the bench exactly when its leads have nodes — `sceneFrom`
     emits one only for a part with a path to a board hole. */
  if (finding.probe.kind === "absent-node") {
    return maybeNode(scene, finding.probe.nodeId) !== undefined;
  }
  return diff(scene, [finding.probe.connectionId]).mismatches.length === 0;
}

/** Steps with something still open against them — what turns a tick amber. */
export function blockedSteps(
  findings: readonly Finding[],
  scene: CircuitScene,
): StepId[] {
  const open = findings.filter((finding) => !isResolved(finding, scene));
  return [...new Set(open.map((finding) => finding.stepId))];
}

/**
 * Whether every connection a step owns matches, nothing the sketch does not ask
 * for is touching them, and the horn is round the right way if the step cares.
 * This is what `verify_current_step` answers.
 *
 * The stray count is not decoration. Without it a person can tick step 3 and
 * then make a spurious join with nothing noticing — and `commit`'s
 * `completedSteps` filter is gated entirely on this function, so a step that
 * cannot fail here is a step that can never come back off.
 *
 * Which means, said out loud rather than discovered in review: **steps can now
 * retroactively un-tick.**
 */
export function verifyStep(scene: CircuitScene, stepId: StepId) {
  const step = stepById(stepId);
  const result = diff(scene, step.connections);
  const mechanicalOk = step.checksMechanical ? isServoAligned(scene) : true;
  const strays = extras(scene).filter((e) =>
    touchesStep(scene, e, step.connections),
  );

  return {
    stepId,
    /**
     * Four clauses, and the fourth is the one that was missing.
     *
     * `diff` filters `scene.expected` down to the step's ids, so a scene that
     * has never heard of them yields zero mismatches — and `verified: true`
     * then sat beside `matched: 0, expected: 6`, a record contradicting itself
     * in two adjacent fields. `verify_current_step` trusted the boolean,
     * ticked the step and advanced; six calls turned an untouched bench into a
     * finished build. The tool layer re-derives this through `fullyVerified`
     * and so the product was safe, but the model still answered a direct
     * caller with the contradiction, and the model is what an agent asking
     * twice is entitled to trust.
     *
     * No-op on every real step of all six builds — `matched === expected`
     * there by construction — and it deliberately leaves a step that owns no
     * connections verified, because zero of zero is matched.
     */
    verified:
      result.mismatches.length === 0 &&
      result.matched === step.connections.length &&
      mechanicalOk &&
      strays.length === 0,
    matched: result.matched,
    expected: step.connections.length,
    mechanicalOk,
    strays: strays.length,
  };
}
