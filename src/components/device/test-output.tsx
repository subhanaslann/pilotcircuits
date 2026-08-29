"use client";

import { Alert } from "@/components/ui/status";
import { StepLoader, type StepState } from "@/components/ui/feedback";
import { Divider } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import type { DeviceTestStatus } from "@/components/device/test-status";
import { cn } from "@/lib/utils/cn";

/**
 * D-05 · D-06 — the functional test, read as numbers.
 *
 * The canvas plays the same run as theatre (C-23): a car arrives, the sensor
 * pings, the gate answers. This is the other half of that — three named checks
 * and one verdict — and both are driven from one timeline, because a dock that
 * told a different story from the drawing would be worse than no dock.
 */

export type TestSubject = "sensor" | "servo" | "leds";

export const testSubjects: TestSubject[] = ["sensor", "servo", "leds"];

export type TestRowStates = Record<TestSubject, StepState>;

export const idleRows: TestRowStates = {
  sensor: "idle",
  servo: "idle",
  leds: "idle",
};

/**
 * D-05 · Test runner rows
 *
 * `StepLoader` (A-17) unchanged — fed, not rewritten. The label is the
 * activity (`Reading distance sensor`), because that is what the row is doing
 * while you watch it; the detail slot is whatever the board measured, and so
 * it is mono and untranslated (`18 cm`, `0° → 90°`).
 *
 * No box around the three. They are the device's report, and rule 4 gives
 * surfaces to the user's input and to countable objects, never to output.
 */
export function TestRunnerRows({
  states,
  details,
  className,
}: {
  states: TestRowStates;
  /** Mono measurements, per subject. Absent leaves the state word showing. */
  details?: Partial<Record<TestSubject, string>>;
  className?: string;
}) {
  const copy = useCopy();

  return (
    <div className={cn("w-full", className)}>
      {testSubjects.map((subject) => (
        <StepLoader
          key={subject}
          state={states[subject]}
          label={copy.test[subject]}
          detail={details?.[subject]}
        />
      ))}
    </div>
  );
}

/**
 * D-06 · Test result summary
 *
 * One sentence, no box — the editorial register (rule 4), because this is the
 * interface telling you how it went.
 *
 * It does **not** repeat the three subjects. The rows above already name which
 * check failed, and a summary that listed them again would be the finding-card
 * mistake from Batch 4: one fact in two places, drifting. Nor is there a
 * percentage — three checks are countable, so they are counted (rule 5).
 */
export function TestVerdict({
  status,
  /** How many of the three failed. Only read when `status` is `failed`. */
  failedCount = 0,
  className,
}: {
  status: DeviceTestStatus;
  failedCount?: number;
  className?: string;
}) {
  const copy = useCopy();
  const t = copy.test.summary;

  const verdict = {
    idle: { tone: "info" as const, title: t.idle, body: t.idleDetail },
    running: { tone: "info" as const, title: t.running, body: undefined },
    passed: { tone: "success" as const, title: t.passed, body: t.passedDetail },
    failed: {
      tone: "error" as const,
      title: t.failed(failedCount),
      body: t.failedDetail,
    },
  }[status];

  return (
    <Alert tone={verdict.tone} title={verdict.title} className={className}>
      {verdict.body}
    </Alert>
  );
}

/** The dock's Test output tab: the three rows, then the verdict. */
export function TestOutput({
  states,
  details,
  status,
  failedCount,
}: {
  states: TestRowStates;
  details?: Partial<Record<TestSubject, string>>;
  status: DeviceTestStatus;
  failedCount?: number;
}) {
  return (
    <div className="w-full">
      <TestRunnerRows states={states} details={details} />
      <Divider />
      <TestVerdict status={status} failedCount={failedCount} />
    </div>
  );
}
