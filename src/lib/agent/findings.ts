import type { Copy } from "@/content/i18n";
import {
  diff,
  isServoAligned,
  node,
  type CircuitScene,
  type Connection,
  type Highlight,
  type NodeId,
} from "@/lib/circuit/graph";
import type { MonoTone, WireRole } from "@/lib/design/tokens";
import type { CoachingLevel, InspectionScope } from "@/lib/agent/model";
import {
  buildSteps,
  scopeChecksMechanical,
  scopeConnections,
  stepById,
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
  "connection-mismatch" | "missing-connection" | "mechanical-alignment";

/** G-07. Small, and never dressed up as instrumentation. */
export interface Evidence {
  /** Which check saw it. The words are looked up, not stored. */
  kind: "camera" | "alignment";
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
  | { kind: "servo-alignment" };

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
  /** The terminal the wire leaves from: `Echo`. */
  subject: string;
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

export type Finding = WiringFinding | MechanicalFinding;

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
  actions: { show: string; resolve: string };
  /** The chips, each with the part name in the reader's language. */
  nodes: (AffectedNode & { part: string })[];
}

export function findingWords(copy: Copy, finding: Finding): FindingWords {
  const nodes = finding.affectedNodes.map((n) => ({
    ...n,
    part: ownerOf(copy, n.id),
  }));

  const evidenceLabel =
    finding.evidence.kind === "camera"
      ? copy.findings.evidence.camera
      : copy.findings.evidence.alignment;

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
        resolve: copy.workbench.iRemounted,
      },
      nodes,
    };
  }

  const { subject, expectedTerminal: want, observedTerminal: got } = finding;
  const colour = copy.wire.colour[finding.role];

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
    actions: { show: copy.workbench.showMe, resolve: copy.workbench.iFixedIt },
    nodes,
  };
}

/* --- Naming -------------------------------------------------------------- */

function ownerOf(copy: Copy, id: NodeId): string {
  const parts = copy.build.parts;
  if (id.startsWith("board.")) return parts.board;
  if (id.startsWith("bb.")) return parts.breadboard;
  if (id.startsWith("sensor.")) return parts.sensor;
  if (id.startsWith("servo.")) return parts.servo;
  if (id.startsWith("led.green.")) return parts.ledGreen;
  if (id.startsWith("led.red.")) return parts.ledRed;
  return id;
}

function affected(
  scene: CircuitScene,
  id: NodeId,
  mark: AffectedNode["mark"],
): AffectedNode {
  return { id, terminal: node(scene, id).label ?? id, mark };
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

function stepOwning(connectionId: Connection["id"], fallback: StepId): StepId {
  return (
    buildSteps.find((step) => step.connections.includes(connectionId))?.id ??
    fallback
  );
}

function wiringFinding(
  scene: CircuitScene,
  expected: Connection,
  observed: Connection | undefined,
  activeStepId: StepId,
  now: number,
): WiringFinding {
  const want = node(scene, expected.to);
  const got = observed ? node(scene, observed.to) : undefined;
  const subject = node(scene, expected.from).label ?? expected.from;
  const wantLabel = want.label ?? expected.to;

  return {
    id: wiringFindingId(expected.id),
    type: got ? "connection-mismatch" : "missing-connection",
    severity: "warning",
    stepId: stepOwning(expected.id, activeStepId),
    role: expected.role,
    subject,
    expectedTerminal: wantLabel,
    observedTerminal: got ? (got.label ?? observed!.to) : undefined,
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

function servoFinding(
  scene: CircuitScene,
  activeStepId: StepId,
  now: number,
): MechanicalFinding {
  const stepId =
    buildSteps.find((step) => step.checksMechanical)?.id ?? activeStepId;

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
  const found: Finding[] = [];

  if (within === undefined || within.length > 0) {
    for (const mismatch of diff(scene, within).mismatches) {
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
  }

  if (scopeChecksMechanical(scope, activeStepId) && !isServoAligned(scene)) {
    found.push(servoFinding(scene, activeStepId, now));
  }

  return found;
}

/** Re-reads the graph. A finding is never marked fixed; it is asked. */
export function isResolved(finding: Finding, scene: CircuitScene): boolean {
  return finding.probe.kind === "servo-alignment"
    ? isServoAligned(scene)
    : diff(scene, [finding.probe.connectionId]).mismatches.length === 0;
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
 * Whether every connection a step owns matches, and the horn is round the right
 * way if the step cares. This is what `verify_current_step` answers.
 */
export function verifyStep(scene: CircuitScene, stepId: StepId) {
  const step = stepById(stepId);
  const result = diff(scene, step.connections);
  const mechanicalOk = step.checksMechanical ? isServoAligned(scene) : true;

  return {
    stepId,
    verified: result.mismatches.length === 0 && mechanicalOk,
    matched: result.matched,
    expected: step.connections.length,
    mechanicalOk,
  };
}
