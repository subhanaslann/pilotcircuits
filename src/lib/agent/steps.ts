import type { Copy } from "@/content/i18n";
import type { Connection } from "@/lib/circuit/graph";
import type { InspectionScope } from "@/lib/agent/model";

/**
 * Batch 4 · The seven steps.
 *
 * The definition is static: what the step asks for, and which connections it is
 * responsible for. What it is *doing* — completed, active, blocked — is never
 * stored, because a stored status is how you end up with the agent saying
 * "verified" while the tick stays amber. `toProgressSteps` derives it, and it is
 * the only place that does.
 *
 * `connections` is what scopes `diff()`. Step 3 owns the sensor's four wires and
 * the two rails; the mismatch the demo is built around is one of them.
 *
 * No words live here. Which connections a step owns is the same in every
 * language; what the step is *called* is not. The names come from the
 * dictionary at render, keyed by the same `StepId` — so adding a locale never
 * touches this file.
 */

export type StepId =
  "kit" | "place" | "sensor" | "servo" | "leds" | "upload" | "test";

/** Lives here rather than in `build-progress.tsx`: a blocked step is a fact
 *  about the build, not a colour the rail chose. */
export type StepStatus = "completed" | "active" | "issue" | "upcoming";

/** The view model the step rail and the topbar progress render. Derived. */
export interface BuildStep {
  id: StepId;
  name: string;
  minutes?: number;
  status: StepStatus;
}

/** What the agent offers once a step has nothing open against it. */
export type StepSuggestion = "inspect" | "verify" | "runTest" | "next";

export interface BuildStepDef {
  id: StepId;
  /** 1-based, for `Step 3 of 7`. */
  index: number;
  minutes: number;
  connections: Connection["id"][];
  /** True when the step also asserts the servo is mounted the right way round. */
  checksMechanical?: boolean;
  suggestion: StepSuggestion;
  /** Whether the step offers a `Why…?` aside. The words come from the copy. */
  hasAside?: boolean;
}

/** Everything a step says, in the reader's language. */
export function stepWords(copy: Copy, id: StepId) {
  return copy.build.steps[id];
}

/**
 * The `Why…?` disclosure, when the step has one. Returns `undefined` rather
 * than empty strings so a caller can simply not render the control.
 */
export function stepAside(
  copy: Copy,
  id: StepId,
): { summary: string; body: string } | undefined {
  const words = copy.build.steps[id];
  return "asideSummary" in words
    ? { summary: words.asideSummary, body: words.asideBody }
    : undefined;
}

export const buildSteps: BuildStepDef[] = [
  {
    id: "kit",
    index: 1,
    minutes: 2,
    connections: [],
    suggestion: "next",
  },
  {
    id: "place",
    index: 2,
    minutes: 4,
    connections: [],
    suggestion: "next",
  },
  {
    id: "sensor",
    index: 3,
    minutes: 6,
    hasAside: true,
    connections: [
      "c.rail.pos",
      "c.rail.neg",
      "c.sensor.vcc",
      "c.sensor.gnd",
      "c.sensor.trig",
      "c.sensor.echo",
    ],
    suggestion: "verify",
  },
  {
    id: "servo",
    index: 4,
    minutes: 5,
    hasAside: true,
    connections: ["c.servo.signal", "c.servo.power", "c.servo.gnd"],
    checksMechanical: true,
    suggestion: "verify",
  },
  {
    id: "leds",
    index: 5,
    minutes: 4,
    connections: ["c.led.green", "c.led.red"],
    suggestion: "verify",
  },
  {
    id: "upload",
    index: 6,
    minutes: 8,
    connections: [],
    suggestion: "next",
  },
  {
    id: "test",
    index: 7,
    minutes: 6,
    connections: [],
    suggestion: "runTest",
  },
];

export const stepCount = buildSteps.length;

export function stepById(id: StepId): BuildStepDef {
  const found = buildSteps.find((step) => step.id === id);
  if (!found) throw new Error(`Unknown build step: ${id}`);
  return found;
}

/** The step after this one, or `null` at the end of the build. */
export function nextStep(id: StepId): BuildStepDef | null {
  return buildSteps[stepById(id).index] ?? null;
}

/**
 * Which connections `inspect_build` should compare, for a given scope.
 * `undefined` means every expected connection — what `diff()` does with no
 * `within` list.
 */
export function scopeConnections(
  scope: InspectionScope,
  activeStepId: StepId,
): Connection["id"][] | undefined {
  if (scope === "mechanical") return [];
  if (scope === "current_step") return stepById(activeStepId).connections;
  return undefined;
}

/** Whether a scope also asks about the servo horn. */
export function scopeChecksMechanical(
  scope: InspectionScope,
  activeStepId: StepId,
): boolean {
  if (scope === "mechanical" || scope === "all") return true;
  return scope === "current_step"
    ? Boolean(stepById(activeStepId).checksMechanical)
    : false;
}

/**
 * The single derivation of step status. Nothing else computes one.
 *
 * A step with something open against it reads `issue` whether or not it is the
 * step you are standing on — the rail has to be able to say "you left something
 * behind on step 3" while you are looking at step 4.
 */
export function toProgressSteps(
  copy: Copy,
  activeStepId: StepId,
  completed: readonly StepId[],
  blocked: readonly StepId[],
): BuildStep[] {
  const isBlocked = new Set(blocked);
  const isDone = new Set(completed);

  return buildSteps.map((step) => ({
    id: step.id,
    name: copy.build.steps[step.id].name,
    minutes: step.minutes,
    status: isBlocked.has(step.id)
      ? "issue"
      : step.id === activeStepId
        ? "active"
        : isDone.has(step.id)
          ? "completed"
          : "upcoming",
  }));
}
