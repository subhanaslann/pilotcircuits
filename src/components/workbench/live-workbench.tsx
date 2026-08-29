"use client";

import { useState, type RefObject } from "react";
import { AgentWorkspace } from "@/components/agent/workspace";
import type { AgentSession } from "@/components/agent/use-agent-session";
import { type CanvasHandle } from "@/components/canvas/canvas-viewport";
import { CircuitSceneView } from "@/components/canvas/circuit-scene";
import { DeviceDock, type DeviceTab } from "@/components/device/dock";
import { DeviceInfo } from "@/components/device/device-info";
import { SerialMonitor } from "@/components/device/serial-monitor";
import { TestOutput } from "@/components/device/test-output";
import { ToastViewport } from "@/components/ui/status";
import { DemoControls } from "@/components/workbench/demo-menu";
import { demoScenarios } from "@/components/workbench/demo-scenarios";
import { WorkbenchFrame } from "@/components/workbench/frame";
import { InspectionModal } from "@/components/workbench/inspection";
import { StepRail } from "@/components/workbench/step-rail";
import { WorkbenchTopbar } from "@/components/workbench/topbar";
import {
  CanvasWorkspace,
  type CanvasView,
} from "@/components/workbench/workspace";
import type { CameraVariant } from "@/components/workbench/camera";
import { useCopy } from "@/content/copy-provider";
import { clockOf } from "@/lib/agent/activity";
import { stepParts } from "@/lib/agent/parts";
import { stepAside, stepWords } from "@/lib/agent/steps";
import { zoom as zoomLimits } from "@/lib/circuit/geometry";
import {
  smartParkingBarrier,
  withEchoFixed,
  withServoRemounted,
} from "@/lib/circuit/smart-parking-barrier";

/**
 * W-04 assembled: the whole workbench, wired to one session.
 *
 * Every control here runs a tool. `Inspect my build` reads the context,
 * compares against the sketch and opens the inspection on what it found —
 * §7's "opened by `Inspect my build` or by the matching WebMCP action", both
 * being the same call. The demo menu drives the same six tools from the other
 * side, and the panel, the rail, the dock and the two canvases all read one
 * store.
 *
 * **Batch 8 · the session and the canvas handles arrive as props.** Batch 7
 * built this component around its own `useAgentSession`, which was right while
 * the only assembly was a lab page. The product needs a build that survives the
 * walk to `/complete`, so the session is now owned by `BuildProvider` and the
 * refs it focuses through are owned there too — this component fills them in
 * and hands them back when it unmounts.
 *
 * The design lab still mounts a session of its own (see
 * `components/lab/workbench/live-workbench.tsx`). Playing at `/lab/workbench`
 * must not move the build the product is carrying, and one component taking a
 * session as an argument is how both are true at once.
 */

/** The finished build: what the sketch defines, both faults corrected. */
const referenceScene = withServoRemounted(withEchoFixed(smartParkingBarrier));

/** Hardware values that appear in the seven instructions (rule 13). */
const INSTRUCTION_MONO = {
  D7: "target",
  D8: "default",
  D9: "default",
  D3: "default",
  D2: "default",
} as const;

export function Workbench({
  session,
  canvas,
  camera,
  backHref,
  onFinish,
  wide,
  cameraVariant = "plate",
  className,
}: {
  session: AgentSession;
  /** The workbench canvas. Owned by the caller so focus outlives this mount. */
  canvas: RefObject<CanvasHandle | null>;
  /** The inspection's camera pane — `null` while the modal is closed. */
  camera: RefObject<CanvasHandle | null>;
  /** Where the back arrow goes: the project in the product, the lab in the lab. */
  backHref: string;
  /**
   * Where the build ends, when there is somewhere for it to end.
   *
   * Given, the pinned action becomes `Finish` once the last step is verified —
   * an offer, not a redirect. Absent (the lab, which has no completion screen),
   * the foot keeps Batch 7's behaviour exactly.
   *
   * A callback rather than an `href` because the summary is only true if the
   * session reaches it: a real link here would reload the document and the
   * build would be gone by the time the page it opened tried to report on it.
   */
  onFinish?: () => void;
  /** Overrides the media query, so the lab can show the folded layout. */
  wide?: boolean;
  /**
   * W-06, settled: **`plate`**. The frame is evidence, not a photograph — the
   * label and the capture time sit under the image in the interface's own
   * voice rather than burned into it. `capture` is still built and still live
   * at `#w-camera`, as the direction this was chosen over.
   */
  cameraVariant?: CameraVariant;
  className?: string;
}) {
  const copy = useCopy();

  const [scale, setScale] = useState(1);
  const [view, setView] = useState<CanvasView>("current");
  const [dockOpen, setDockOpen] = useState(false);
  const [dockTab, setDockTab] = useState<DeviceTab>("serial");
  const [inspecting, setInspecting] = useState(false);
  const [capturedAt, setCapturedAt] = useState("");

  const { state, step, steps, highlighted } = session;
  const inspected = state.findings.length > 0;

  /* What an agent does when asked to look at a build: read the context,
     compare against the sketch, then show the frame it compared. */
  const inspect = async () => {
    setCapturedAt(clockOf(Date.now()));
    setInspecting(true);
    await session.run("get_build_context", {});
    await session.run("inspect_build", { scope: "current_step" });
  };

  /**
   * G-14 · the one action in the pinned foot.
   *
   * `BuildStepDef.suggestion` has been sitting in `steps.ts` since Batch 4
   * waiting for a screen with a foot to put it in. A step nobody has inspected
   * yet is offered an inspection first, whatever it suggests afterwards — the
   * agent cannot verify what it has not read.
   *
   * Batch 8 adds one rung above all of them: a finished build is offered its
   * summary. It sits first because it is the only one that is true about the
   * *build* rather than about the step you are standing on.
   */
  const kind =
    onFinish && state.completedAt !== null
      ? "finish"
      : !inspected && step.connections.length
        ? "inspect"
        : step.suggestion;

  const action = {
    inspect: { id: "inspect", label: copy.workbench.inspect, run: inspect },
    verify: {
      id: "verify",
      label: copy.workbench.verify,
      run: () => void session.run("verify_current_step", {}),
    },
    /* A step with nothing to compare still closes by being verified, and the
       label is the same because the gesture is. */
    next: {
      id: "next",
      label: copy.workbench.verify,
      run: () => void session.run("verify_current_step", {}),
    },
    runTest: {
      id: "run-test",
      label: copy.workbench.runFullTest,
      run: () =>
        void session.run("run_functional_test", { test: "full_system" }),
    },
    finish: {
      id: "finish",
      label: copy.workbench.finish,
      run: () => onFinish?.(),
    },
  }[kind];

  const scene = view === "reference" ? referenceScene : session.scene;
  const words = stepWords(copy, step.id);

  return (
    <>
      <WorkbenchFrame
        wide={wide}
        className={className}
        topbar={
          <WorkbenchTopbar
            project={copy.build.project}
            backHref={backHref}
            steps={steps}
            agentConnected={state.webMcpAvailable}
            onSelectStep={(id) =>
              void session.run("navigate_build_step", {
                step_id: id as typeof step.id,
              })
            }
            demoMenu={
              <DemoControls
                scenarios={demoScenarios(session, copy)}
                busy={session.busy}
              />
            }
          />
        }
        rail={
          <StepRail
            steps={steps}
            parts={stepParts(scene, step.id)}
            className="h-full"
          />
        }
        workspace={
          <CanvasWorkspace
            canvas={canvas}
            instruction={words.instruction}
            rationale={words.rationale}
            aside={stepAside(copy, step.id)}
            mono={INSTRUCTION_MONO}
            view={view}
            onViewChange={setView}
            scale={scale}
            onScaleChange={setScale}
            ariaLabel={copy.workbench.region.circuit(copy.build.project)}
          >
            <CircuitSceneView
              scene={scene}
              showLabels={scale >= zoomLimits.labelThreshold}
              highlight={highlighted?.highlight}
              reference={view === "compare" ? referenceScene : undefined}
              successTrace={session.trace}
              ledState={session.leds}
              test={session.test}
            />
          </CanvasWorkspace>
        }
        dock={
          <DeviceDock
            open={dockOpen}
            onOpenChange={setDockOpen}
            tab={dockTab}
            onTabChange={setDockTab}
            status={session.testRun.status}
            className="shrink-0"
          >
            {dockTab === "device" ? (
              <DeviceInfo
                lastSerial={session.serial[session.serial.length - 1]}
                distance={session.readings.at(-1) ?? null}
              />
            ) : dockTab === "serial" ? (
              <SerialMonitor lines={session.serial} />
            ) : (
              <TestOutput
                states={session.testRun.rows}
                details={session.testRun.details}
                status={session.testRun.status}
                failedCount={session.testRun.failedCount}
              />
            )}
          </DeviceDock>
        }
        panel={
          <AgentWorkspace
            session={session}
            action={{
              id: action.id,
              label: action.label,
              onAction: action.run,
              loading: session.busy,
            }}
            className="h-full border-y-0 border-r-0"
          />
        }
      />

      <InspectionModal
        open={inspecting}
        onClose={() => setInspecting(false)}
        scene={session.scene}
        reference={referenceScene}
        findings={state.findings}
        highlight={highlighted?.highlight}
        highlighted={highlighted}
        camera={camera}
        cameraVariant={cameraVariant}
        capturedAt={capturedAt}
        busy={session.busy}
        onShow={(id) =>
          void session.run("show_correction", {
            finding_id: id,
            detail_level: state.coaching,
          })
        }
        onResolve={(id) => session.act({ kind: "resolve", findingId: id })}
      />

      <ToastViewport toasts={session.toasts} onDismiss={session.dismissToast} />
    </>
  );
}
