"use client";

import { LabStage } from "@/components/lab/lab-primitives";
import {
  TelemetryReadout,
  TelemetryTrace,
} from "@/components/device/telemetry";
import { approachReadings, finalReadingCm } from "@/lib/device/test-run";

/**
 * D-04, at rest rather than running.
 *
 * The live version at `/lab/device#d-serial` has a clock, because there the
 * question is what a reading looks like while it arrives. Here the question is
 * only which of the two shapes belongs in the dock, and a number that is
 * changing while you compare it is a number you cannot compare. Both sides get
 * the same finished approach — the five readings the board actually prints.
 */
export function TelemetryA() {
  return (
    <LabStage className="bg-surface-sunken">
      <TelemetryReadout value={finalReadingCm} />
    </LabStage>
  );
}

export function TelemetryB() {
  return (
    <LabStage className="bg-surface-sunken">
      <TelemetryTrace value={finalReadingCm} readings={[...approachReadings]} />
    </LabStage>
  );
}
