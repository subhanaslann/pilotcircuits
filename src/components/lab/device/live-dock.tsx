"use client";

import { useRef, useState } from "react";
import { Cable, Play, RotateCcw, Wrench } from "lucide-react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { DeviceDock, type DeviceTab } from "@/components/device/dock";
import { DeviceInfo } from "@/components/device/device-info";
import { SerialMonitor } from "@/components/device/serial-monitor";
import { TestOutput } from "@/components/device/test-output";
import { useAgentSession } from "@/components/agent/use-agent-session";
import {
  CanvasViewport,
  type CanvasHandle,
} from "@/components/canvas/canvas-viewport";
import { CircuitSceneView } from "@/components/canvas/circuit-scene";
import { Button } from "@/components/ui/button";
import { ToastViewport } from "@/components/ui/status";
import { useCopy } from "@/content/copy-provider";
import { isServoAligned } from "@/lib/circuit/graph";
import { verifyStep } from "@/lib/agent/findings";
import { zoom as zoomLimits } from "@/lib/circuit/geometry";
import { icon } from "@/lib/design/tokens";

const g = { size: icon.sm, strokeWidth: icon.strokeWidth } as const;

/**
 * The batch's reason for existing, assembled.
 *
 * C-23 has worked on the canvas since Batch 3 and nobody could see the
 * numbers. Here the same `run_functional_test` call drives both — one clock,
 * one list of readings, two readings of the same run. Nothing on this page is
 * a separate demo path: it is the tool a WebMCP callback invokes in Batch 7.
 */
export function LiveDock() {
  const copy = useCopy();
  const t = copy.lab.deviceLab.live;
  const canvas = useRef<CanvasHandle>(null);
  const [scale, setScale] = useState(1);
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<DeviceTab>("serial");
  const session = useAgentSession({ canvas });

  const { state, serial, testRun } = session;
  const servoAligned = isServoAligned(state.scene);
  const wiringOk = verifyStep(state.scene, "sensor").verified;

  /**
   * The two faults the demo build ships with, each fixable on its own.
   *
   * Both matter here. A fresh board fails two of the three checks — the Echo
   * wire is on D6 and the horn is a quarter turn out — so the run everyone
   * describes (`Distance sensor` passed, `Barrier direction` failed) only
   * appears once the wire is moved. Being able to reach it in one press is
   * what makes the failing row worth looking at.
   *
   * Neither fix is something the agent can do. It inspects, it finds, and then
   * a person has to touch the build.
   */
  const repair = async (scope: "wiring" | "mechanical") => {
    const outcome = await session.run("inspect_build", { scope });
    const found =
      (outcome?.result as { findings?: { id: string }[] })?.findings ?? [];
    for (const finding of found) {
      session.act({ kind: "repair", findingId: finding.id });
    }
  };

  return (
    <LabBlock title={t.title} note={t.note}>
      <LabStage className="p-0">
        <div className="flex h-[560px] flex-col">
          <div className="min-h-0 flex-1 overflow-hidden">
            <CanvasViewport
              ref={canvas}
              ariaLabel={t.canvasLabel}
              onScaleChange={setScale}
              className="h-full rounded-t-lg"
            >
              <CircuitSceneView
                scene={session.scene}
                showLabels={scale >= zoomLimits.labelThreshold}
                successTrace={session.trace}
                ledState={session.leds}
                test={session.test}
              />
            </CanvasViewport>
          </div>

          <DeviceDock
            open={open}
            onOpenChange={setOpen}
            tab={tab}
            onTabChange={setTab}
            status={testRun.status}
            announcement={session.announcement}
            className="shrink-0"
          >
            {tab === "device" ? (
              <DeviceInfo
                lastSerial={serial[serial.length - 1]}
                distance={session.readings.at(-1) ?? null}
              />
            ) : tab === "serial" ? (
              <SerialMonitor lines={serial} />
            ) : (
              <TestOutput
                states={testRun.rows}
                details={testRun.details}
                status={testRun.status}
                failedCount={testRun.failedCount}
              />
            )}
          </DeviceDock>
        </div>

        <div className="border-border flex flex-wrap items-center gap-4 border-t px-5 py-4">
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Play {...g} />}
            onClick={() =>
              void session.run("run_functional_test", { test: "full_system" })
            }
            disabled={session.busy}
          >
            {copy.workbench.runFullTest}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Cable {...g} />}
            onClick={() => void repair("wiring")}
            disabled={session.busy || wiringOk}
          >
            {wiringOk ? t.wiringFixed : t.fixWiring}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Wrench {...g} />}
            onClick={() => void repair("mechanical")}
            disabled={session.busy || servoAligned}
          >
            {servoAligned ? t.servoFixed : t.fixServo}
          </Button>
          <Button
            variant="quiet"
            size="sm"
            iconLeft={<RotateCcw {...g} />}
            onClick={session.reset}
          >
            {copy.workbench.resetDemo}
          </Button>
        </div>
      </LabStage>

      <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
        {t.persistNote}
      </p>

      <ToastViewport toasts={session.toasts} onDismiss={session.dismissToast} />
    </LabBlock>
  );
}
