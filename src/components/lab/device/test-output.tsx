"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import {
  TestRunnerRows,
  TestVerdict,
  idleRows,
  type TestRowStates,
  type TestSubject,
} from "@/components/device/test-output";
import { StepLoader, type StepState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/text";
import type { DeviceTestStatus } from "@/components/device/test-status";
import { useCopy } from "@/content/copy-provider";
import { finalReadingCm } from "@/lib/device/test-run";
import { icon } from "@/lib/design/tokens";

const g = { size: icon.sm, strokeWidth: icon.strokeWidth } as const;

const ALL_STATES: StepState[] = [
  "idle",
  "running",
  "passed",
  "failed",
  "skipped",
];

/** What the handler reports, spelled the way the board would. */
const passedDetails: Partial<Record<TestSubject, string>> = {
  sensor: `${finalReadingCm} cm`,
  servo: "0° → 90°",
  leds: "green",
};

/**
 * D-05 · D-06, driven through both endings.
 *
 * The failing run is the default scenario of the whole product — the servo
 * horn is a quarter turn out — so it is the one worth watching most.
 */
export function TestOutputSpecimens() {
  const copy = useCopy();
  const t = copy.lab.deviceLab.test;
  const [rows, setRows] = useState<TestRowStates>(idleRows);
  const [status, setStatus] = useState<DeviceTestStatus>("idle");
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    },
    [],
  );

  const run = (failServo: boolean) => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setStatus("running");
    setRows({ sensor: "running", servo: "idle", leds: "idle" });

    const after = (ms: number, fn: () => void) => {
      timers.current.push(window.setTimeout(fn, ms));
    };

    after(900, () =>
      setRows({ sensor: "passed", servo: "running", leds: "idle" }),
    );
    after(1900, () =>
      setRows({
        sensor: "passed",
        servo: failServo ? "failed" : "passed",
        leds: "running",
      }),
    );
    after(2800, () => {
      setRows({
        sensor: "passed",
        servo: failServo ? "failed" : "passed",
        leds: "passed",
      });
      setStatus(failServo ? "failed" : "passed");
    });
  };

  /* A measurement replaces the state word, so only a passing row carries one —
     a failed row has to keep saying `Failed` (rule 9). */
  const details = Object.fromEntries(
    (Object.keys(rows) as TestSubject[])
      .filter((subject) => rows[subject] === "passed")
      .map((subject) => [subject, passedDetails[subject]]),
  ) as Partial<Record<TestSubject, string>>;

  const failedCount = (Object.keys(rows) as TestSubject[]).filter(
    (subject) => rows[subject] === "failed",
  ).length;

  return (
    <>
      <LabBlock title={t.rowsTitle} note={t.rowsNote}>
        <div className="mb-4 flex flex-wrap gap-4">
          <Button
            size="sm"
            variant="primary"
            iconLeft={<Play {...g} />}
            disabled={status === "running"}
            onClick={() => run(false)}
          >
            {t.runPassing}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={status === "running"}
            onClick={() => run(true)}
          >
            {t.runFailing}
          </Button>
        </div>

        <LabStage className="bg-surface-sunken">
          <div className="max-w-md">
            <TestRunnerRows states={rows} details={details} />
            <Divider />
            <TestVerdict status={status} failedCount={failedCount} />
          </div>
        </LabStage>

        <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
          {t.verdictNote}
        </p>
      </LabBlock>

      <LabBlock title={t.sweepTitle} note={t.sweepNote}>
        <LabStage>
          <p className="text-caption text-ink-tertiary mb-2.5">
            {t.statesLabel}
          </p>
          <div className="max-w-md">
            {ALL_STATES.map((state) => (
              <StepLoader
                key={state}
                state={state}
                label={copy.test.sensor}
                detail={state === "passed" ? passedDetails.sensor : undefined}
              />
            ))}
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}
