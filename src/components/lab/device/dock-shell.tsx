"use client";

import { useState } from "react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { DeviceDock, type DeviceTab } from "@/components/device/dock";
import { DeviceInfo } from "@/components/device/device-info";
import { SerialMonitor } from "@/components/device/serial-monitor";
import { TestOutput, idleRows } from "@/components/device/test-output";
import {
  TestStatusChip,
  type DeviceTestStatus,
} from "@/components/device/test-status";
import { Chip } from "@/components/ui/badge";
import { useCopy } from "@/content/copy-provider";

const STATUSES: DeviceTestStatus[] = ["idle", "running", "passed", "failed"];

/**
 * D-01 · D-02 · D-07, assembled and drivable.
 *
 * The dock is the real component, at the width it will have under the canvas.
 * Everything it says comes from `copy.device.*` — the specimen supplies state,
 * never words.
 */
export function DockShell() {
  const copy = useCopy();
  const t = copy.lab.deviceLab.dock;
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<DeviceTab>("device");
  const [status, setStatus] = useState<DeviceTestStatus>("idle");

  return (
    <>
      <LabBlock title={t.shellTitle} note={t.shellNote}>
        <LabStage className="p-0">
          {/* Fixed overall height with the canvas as the flexible half, which
              is the workbench's own arrangement — so the fold can be judged
              for what it actually does: give the drawing back its room. */}
          <div className="flex h-[420px] flex-col">
            <div className="grid-technical bg-app text-caption text-ink-tertiary flex min-h-0 flex-1 items-center justify-center rounded-t-lg">
              {copy.lab.agentLab.live.canvasLabel}
            </div>

            <DeviceDock
              open={open}
              onOpenChange={setOpen}
              tab={tab}
              onTabChange={setTab}
              status={status}
              className="shrink-0 rounded-b-lg"
            >
              {tab === "device" ? (
                <DeviceInfo lastSerial="Distance: 18 cm" />
              ) : tab === "serial" ? (
                <SerialMonitor lines={[]} />
              ) : (
                <TestOutput states={idleRows} status="idle" />
              )}
            </DeviceDock>
          </div>
        </LabStage>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip selected={open} onToggle={() => setOpen(true)}>
            {t.toggleOpen}
          </Chip>
          <Chip selected={!open} onToggle={() => setOpen(false)}>
            {t.toggleShut}
          </Chip>
        </div>
        <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
          {t.railNote}
        </p>
      </LabBlock>

      <LabBlock title={t.stateTitle} note={t.stateNote}>
        <LabStage>
          <div className="flex flex-wrap items-center gap-4">
            {STATUSES.map((value) => (
              <TestStatusChip key={value} status={value} />
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {STATUSES.map((value) => (
              <Chip
                key={value}
                selected={status === value}
                onToggle={() => setStatus(value)}
              >
                {copy.device.states[value]}
              </Chip>
            ))}
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.infoTitle} note={t.infoNote}>
        <LabStage className="bg-surface-sunken">
          <div className="max-w-md">
            <DeviceInfo lastSerial="Distance: 18 cm" />
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}
