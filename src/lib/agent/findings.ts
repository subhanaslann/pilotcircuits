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
  /** Names the wire's colour in the exact-fix rung. */
  role: WireRole;
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
  /** What it reached: `220Ω`, `D13`. */
  otherTerminal: string;
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

export function findingWords(copy: Copy, finding: Finding): FindingWords {
  const nodes = finding.affectedNodes.map((n) => ({
    ...n,
    part: ownerOf(copy, n.id),
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
    const { subject, otherTerminal: other } = finding;
    return {
      title: copy.findings.unexpectedConnection,
      explanation: copy.findings.unexpectedDetail(subject, other),
      mono: { [subject]: "error", [other]: "error" },
      /* There is no expected terminal, and a blank here would read as one the
         panel forgot to fill in. */
      expected: copy.findings.notAsked,
      observed: `${subject} → ${other}`,
      evidenceLabel,
      coaching: {
        hint: copy.findings.unexpectedHint(subject),
        explain: copy.findings.unexpectedExplain(subject),
        exact: copy.findings.unexpectedExact(subject),
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

  const { expectedTerminal: want, observedTerminal: got } = finding;
  const colour = copy.wire.colour[finding.role];
  /* What the part prints, if it prints anything; otherwise what a person would
     call the lead. Never the raw id — that is a graph address leaking into a
     sentence, which is the fault `bb.f7` in a callout was fixed for. */
  const subject = finding.subjectLead
    ? (copy.build.leads[finding.subjectLead] ?? finding.subject)
    : finding.subject;

  return {
    title: got
      ? copy.findings.connectionMismatch
      : copy.findings.missingConnection,
    explanation: got
      ? copy.findings.wrongPin(subject, got, want)
      : copy.findings.missingWire(subject, want),
    mono: got ? { [got]: "error", [want]: "target" } : { [want]: "target" },
    expected: `${subject} → ${want}`,
    observed: got ? `${subject} → ${got}` : copy.findings.notWired,
    evidenceLabel,
    coaching: {
      hint: copy.findings.hint(subject),
      explain: copy.findings.explain(subject, want),
      exact: copy.findings.exact(colour, subject, got ?? "", want),
    },
    actions: { show: copy.workbench.showMe, check: copy.workbench.checkThis },
    nodes,
  };
}

/* --- Naming -------------------------------------------------------------- */


function affected(
  scene: CircuitScene,
  id: NodeId,
  mark: AffectedNode["mark"],
): AffectedNode {
  return { id, terminal: maybeNode(scene, id)?.label ?? id, mark };
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
  const want = maybeNode(scene, expected.to);
  const got = observed ? maybeNode(scene, observed.to) : undefined;
  const printed = maybeNode(scene, expected.from)?.label;
  const subject = printed ?? expected.from;
  const wantLabel = want?.label ?? expected.to;

  return {
    id: wiringFindingId(expected.id),
    type: observed ? "connection-mismatch" : "missing-connection",
    severity: "warning",
    stepId: owningStepId(expected.id, activeStepId),
    role: expected.role,
    subject,
    /* Only where the part prints nothing: an LED's `−`, a resistor's `220Ω`
       and a sensor's `D` are what is written on the thing in your hand, and a
       sentence that replaced them with a phrase would be naming the hardware
       for it. */
    ...(printed ? {} : { subjectLead: expected.from }),
    expectedTerminal: wantLabel,
    observedTerminal: observed ? (got?.label ?? observed.to) : undefined,
    evidence: { kind: "camera", confidence: 0.94, simulated: true },
    affectedNodes: [
      affected(scene, expected.from, "neutral"),
      ...(observed ? [affected(scene, observed.to, "error")] : []),
      affected(scene, expected.to, "target"),
    ],
    probe: { kind: "connection", connectionId: expected.id },
    highlight: {
      connectionId: expected.id,
      errorPin: observed?.to,
      targetPin: expected.to,
      subject,
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
  const from = maybeNode(scene, extra.from);
  const to = maybeNode(scene, extra.to);
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
    subject: from?.label ?? extra.from,
    otherTerminal: to?.label ?? extra.to,
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
    highlight: {
      connectionId: extra.id,
      errorPin: to?.kind === "board-pin" ? extra.to : extra.from,
      subject: from?.label ?? extra.from,
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
    affectedNodes: towards.map((id) => ({
      id,
      terminal: id,
      /* `target`, not `error`: nothing here is wrong. This is the hole waiting
         for a part that has not arrived. */
      mark: "target" as const,
    })),
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
              component,
              absent,
              activeStepId,
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
    verified:
      result.mismatches.length === 0 && mechanicalOk && strays.length === 0,
    matched: result.matched,
    expected: step.connections.length,
    mechanicalOk,
    strays: strays.length,
  };
}
