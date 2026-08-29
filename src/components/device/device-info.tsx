"use client";

import { KeyValueRow } from "@/components/ui/card";
import { TelemetryReadout } from "@/components/device/telemetry";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * D-02 · Device info panel
 *
 * Four readings about the board, in the shape rule 13 asks for: the label is
 * prose and translates, the value is what the board says and does not.
 * `Simulated UNO-compatible board` is the exception that proves it — that is
 * the product describing the board, not the board describing itself, so it
 * translates.
 *
 * `KeyValueRow` renders `<dt>`/`<dd>`, so the list has to be a real `<dl>`.
 *
 * Test status is deliberately *not* a row here, though the brief lists it: the
 * dock rail carries it as a chip that stays readable with the dock shut and on
 * every tab. Saying it twice would be the finding-card mistake again — one
 * fact, two places, drifting.
 *
 * **D-04 landed here (direction A).** The distance is set apart from the list
 * rather than filed in it, because it is the only value on this tab that is
 * *measured*: board, port and voltage are facts about the device and do not
 * move. The `Last serial output` row is not a duplicate of it — that row shows
 * whatever the board last said, which after a run is `Barrier: closed`.
 *
 * It sits beside the list rather than above it for the reason the canvas
 * controls float: the dock is 224px tall and as wide as the workspace. Stacked,
 * the 34px readout pushed the fourth row under the fold every time the tab was
 * opened. Below `sm` there is no width to spend and it stacks after all.
 */
export function DeviceInfo({
  /** The most recent line the board printed, or nothing yet. */
  lastSerial,
  /** D-04 · the last distance the sensor measured, in centimetres. */
  distance = null,
  className,
}: {
  lastSerial?: string;
  distance?: number | null;
  className?: string;
}) {
  const copy = useCopy();

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:gap-6",
        className,
      )}
    >
      <TelemetryReadout value={distance} className="sm:w-[132px] sm:shrink-0" />

      <dl className="min-w-0 flex-1">
        <KeyValueRow
          label={copy.device.board}
          value={copy.device.boardValue}
          mono={false}
        />
        <KeyValueRow label={copy.device.port} value={copy.device.portValue} />
        <KeyValueRow
          label={copy.device.voltage}
          value={copy.device.voltageValue}
        />
        <KeyValueRow
          label={copy.device.lastSerial}
          value={
            lastSerial ?? (
              <span className="text-ink-tertiary">{copy.device.noReading}</span>
            )
          }
        />
      </dl>
    </div>
  );
}
