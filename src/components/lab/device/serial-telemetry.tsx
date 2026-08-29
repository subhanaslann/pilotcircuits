"use client";

import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { SerialMonitor } from "@/components/device/serial-monitor";
import {
  TelemetryReadout,
  TelemetryTrace,
} from "@/components/device/telemetry";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/content/copy-provider";
import {
  approachReadings,
  barrierLines,
  distanceLine,
} from "@/lib/device/test-run";
import { icon } from "@/lib/design/tokens";

const g = { size: icon.sm, strokeWidth: icon.strokeWidth } as const;

/** Fast enough to read as a live feed, slow enough to watch a line arrive. */
const TICK_MS = 320;

/**
 * D-03 · D-04, driven by the same reading list the canvas and the session use
 * (`lib/device/test-run.ts`). The specimen owns the clock and nothing else —
 * in step 5 that clock becomes the session's, and these components do not
 * change.
 */
export function SerialTelemetry() {
  const copy = useCopy();
  const t = copy.lab.deviceLab.serial;
  const [readings, setReadings] = useState<number[]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    },
    [],
  );

  /* A plain function, not `useCallback`: this project compiles with the React
     Compiler and a manual dependency list cannot express a ref's `.current`. */
  const play = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setReadings([]);
    setLines([]);

    approachReadings.forEach((cm, index) => {
      timers.current.push(
        window.setTimeout(
          () => {
            setReadings((prev) => [...prev, cm]);
            setLines((prev) => [...prev, distanceLine(cm)]);
          },
          (index + 1) * TICK_MS,
        ),
      );
    });

    const settled = (approachReadings.length + 1) * TICK_MS;
    timers.current.push(
      window.setTimeout(
        () => setLines((prev) => [...prev, barrierLines.opening]),
        settled,
      ),
    );
    timers.current.push(
      window.setTimeout(
        () => setLines((prev) => [...prev, barrierLines.closed]),
        settled + 900,
      ),
    );
  };

  const latest = readings.length ? readings[readings.length - 1] : null;
  const started = lines.length > 0;

  return (
    <>
      <LabBlock title={t.monitorTitle} note={t.monitorNote}>
        <LabStage className="bg-surface-sunken">
          <div className="h-[132px]">
            <SerialMonitor lines={lines} />
          </div>
        </LabStage>

        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            iconLeft={started ? <RotateCcw {...g} /> : <Play {...g} />}
            onClick={play}
          >
            {started ? t.replay : t.play}
          </Button>
        </div>

        <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
          {t.barrierNote}
        </p>
      </LabBlock>

      <LabBlock title={t.telemetryTitle} note={t.telemetryNote}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-overline text-ink-tertiary mb-2 uppercase">
              {t.directionA}
            </p>
            <LabStage className="bg-surface-sunken">
              <TelemetryReadout value={latest} />
            </LabStage>
            <p className="text-caption text-ink-tertiary mt-3">
              {t.directionANote}
            </p>
          </div>

          <div>
            <p className="text-overline text-ink-tertiary mb-2 uppercase">
              {t.directionB}
            </p>
            <LabStage className="bg-surface-sunken">
              <TelemetryTrace value={latest} readings={readings} />
            </LabStage>
            <p className="text-caption text-ink-tertiary mt-3">
              {t.directionBNote}
            </p>
          </div>
        </div>
      </LabBlock>
    </>
  );
}
