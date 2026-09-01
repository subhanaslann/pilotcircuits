"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { LabBlock } from "@/components/lab/lab-primitives";
import { Button, IconButton } from "@/components/ui/button";
import { Toolbar } from "@/components/ui/tabs";
import { SegmentedControl } from "@/components/ui/choice";
import { Divider, Sentence } from "@/components/ui/text";
import { Disclosure } from "@/components/ui/disclosure";
import { Alert, AlertStack } from "@/components/ui/status";
import {
  CanvasViewport,
  type CanvasHandle,
} from "@/components/canvas/canvas-viewport";
import { CircuitSceneView } from "@/components/canvas/circuit-scene";
import {
  smartParkingBarrier,
  withEchoFixed,
  withServoRemounted,
} from "@/lib/circuit/smart-parking-barrier";
import { diff, node } from "@/lib/circuit/graph";
import { boundsOf } from "@/lib/circuit/routing";
import { zoom as zoomLimits } from "@/lib/circuit/geometry";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";

const g = { size: icon.sm, strokeWidth: icon.strokeWidth } as const;

export function CanvasGallery() {
  const copy = useCopy();
  const t = copy.lab.molecules.canvas;
  const canvas = useRef<CanvasHandle>(null);
  const [scale, setScale] = useState(1);
  const [echoFixed, setEchoFixed] = useState(false);
  const [servoFixed, setServoFixed] = useState(false);
  const [showingCorrection, setShowingCorrection] = useState(false);
  const [servoGhost, setServoGhost] = useState(false);
  const [view, setView] = useState<"reference" | "current" | "compare">(
    "current",
  );
  const [trace, setTrace] = useState<string[] | undefined>();
  const [leds, setLeds] = useState<{ green: boolean; red: boolean }>();
  const [testAngle, setTestAngle] = useState<number | null>(null);
  const [test, setTest] = useState<{
    approach: number;
    distanceCm: number | null;
    sensing: boolean;
  }>();

  /* One place to cancel every pending step, so a reset mid-sequence cannot
     leave a stale timer to fire over the top of the reset state. */
  const timers = useRef<number[]>([]);
  const after = (ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, ms));
  };
  const clearTimers = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  /* The finished build — what the sketch defines, both faults corrected. */
  const referenceScene = withServoRemounted(withEchoFixed(smartParkingBarrier));

  let scene = smartParkingBarrier;
  if (echoFixed) scene = withEchoFixed(scene);
  if (servoFixed) scene = withServoRemounted(scene);
  if (view === "reference") scene = referenceScene;
  if (testAngle !== null) {
    scene = {
      ...scene,
      mechanical: { ...scene.mechanical, servoAngle: testAngle },
    };
  }

  const result = diff(scene, ["c.sensor.echo"]);
  const echoWrong = result.mismatches.length > 0;
  const servoWrong =
    scene.mechanical.servoAngle !== scene.mechanical.expectedAngle;

  const highlight =
    showingCorrection && echoWrong
      ? {
          connectionId: "c.sensor.echo",
          errorPin: "board.D6",
          targetPin: "board.D7",
          subject: "Echo",
        }
      : undefined;

  const showCorrection = () => {
    setShowingCorrection(true);
    /* Adjacent pins: the callout needs room above the header, so the box is
       padded upward and the scale pushed high enough to read 2.54 mm apart. */
    const box = boundsOf(
      [node(scene, "board.D6"), node(scene, "board.D7")],
      110,
    );
    if (box) canvas.current?.focusOn(box, { scale: 2.9 });
  };

  /* C-22 · The step verified, so one green pulse runs the wires it owns. */
  const runSuccessTrace = (connectionIds: string[]) => {
    setTrace(connectionIds);
    after(1300, () => setTrace(undefined));
  };

  /**
   * C-23 · The functional test.
   *
   * A car arrives, the reading falls, the gate answers, the gate closes. The
   * sequence is plain `setTimeout` because it is a fixed piece of theatre — in
   * Batch 7 `run_functional_test` drives exactly these same setters.
   */
  const runTest = () => {
    clearTimers();
    canvas.current?.fitView();
    setLeds({ green: false, red: true });
    setTestAngle(0);
    setTest({ approach: 0.02, distanceCm: null, sensing: true });

    after(400, () =>
      setTest({ approach: 0.42, distanceCm: 62, sensing: true }),
    );
    after(1100, () =>
      setTest({ approach: 0.72, distanceCm: 34, sensing: true }),
    );
    after(1800, () => setTest({ approach: 1, distanceCm: 18, sensing: true }));
    after(2400, () => {
      setLeds({ green: true, red: false });
      setTestAngle(90);
    });
    after(4400, () => {
      setTestAngle(0);
      setLeds({ green: false, red: true });
      setTest({ approach: 1, distanceCm: 18, sensing: false });
    });
    after(5400, () => {
      setTest(undefined);
      setLeds(undefined);
      setTestAngle(null);
    });
  };

  const reset = () => {
    clearTimers();
    setEchoFixed(false);
    setServoFixed(false);
    setShowingCorrection(false);
    setServoGhost(false);
    setView("current");
    setTrace(undefined);
    setLeds(undefined);
    setTestAngle(null);
    setTest(undefined);
    canvas.current?.fitView();
  };

  return (
    <>
      <LabBlock title={t.build.title} note={t.build.note}>
        <div className="border-border bg-surface shadow-e1 overflow-hidden rounded-xl border">
          <div className="border-border flex flex-wrap items-center gap-3 border-b px-4 py-3">
            <Toolbar className="border-0 p-0 shadow-none">
              <IconButton
                label={copy.workbench.canvas.zoomIn}
                size="sm"
                onClick={() => canvas.current?.zoomBy(1.35)}
              >
                <ZoomIn {...g} />
              </IconButton>
              <IconButton
                label={copy.workbench.canvas.zoomOut}
                size="sm"
                onClick={() => canvas.current?.zoomBy(1 / 1.35)}
              >
                <ZoomOut {...g} />
              </IconButton>
              <IconButton
                label={copy.workbench.canvas.fitView}
                size="sm"
                onClick={() => canvas.current?.fitView()}
              >
                <Maximize {...g} />
              </IconButton>
            </Toolbar>

            <Divider orientation="vertical" className="h-7" />

            <SegmentedControl
              size="sm"
              label={t.viewLabel}
              value={view}
              onValueChange={setView}
              options={[
                { value: "reference", label: copy.workbench.views.reference },
                { value: "current", label: copy.workbench.views.current },
                { value: "compare", label: copy.workbench.views.compare },
              ]}
            />

            <span className="text-mono-sm text-ink-tertiary tnum ml-auto font-mono">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <div className="h-[520px]">
            <CanvasViewport
              ref={canvas}
              ariaLabel={t.circuitLabel(copy.build.project)}
              onScaleChange={setScale}
            >
              <CircuitSceneView
                scene={scene}
                showLabels={scale >= zoomLimits.labelThreshold}
                highlight={highlight}
                servoGhost={servoGhost}
                reference={view === "compare" ? referenceScene : undefined}
                successTrace={trace}
                ledState={leds}
                test={test}
              />
            </CanvasViewport>
          </div>
        </div>
      </LabBlock>

      <LabBlock title={t.instruction.title} note={t.instruction.note}>
        <div className="border-border bg-surface shadow-e1 rounded-xl border p-5">
          <p className="text-h2 text-ink">
            <Sentence
              text={copy.build.steps.sensor.instruction}
              mono={{ D7: "target" }}
            />
          </p>
          <p className="text-body text-ink-secondary mt-1.5">
            {copy.build.steps.sensor.rationale}
          </p>
          <Disclosure summary={copy.workbench.whyThisPin} className="mt-1">
            <Sentence
              text={copy.build.steps.sensor.asideBody}
              mono={{ D7: "default", D6: "default" }}
            />
          </Disclosure>
        </div>
      </LabBlock>

      <LabBlock title={t.drive.title} note={t.drive.note}>
        <div className="border-border bg-surface shadow-e1 rounded-xl border p-5">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Eye {...g} />}
              onClick={showCorrection}
              disabled={!echoWrong}
            >
              {copy.workbench.showMe}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEchoFixed(true);
                setShowingCorrection(false);
                canvas.current?.fitView();
                runSuccessTrace(["c.sensor.echo"]);
              }}
              disabled={!echoWrong}
            >
              {copy.workbench.checkThis}
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setServoGhost((v) => !v)}
            >
              {servoGhost ? t.hideAngle : copy.workbench.previewAngle}
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => {
                setServoFixed(true);
                runSuccessTrace(["c.servo.signal"]);
              }}
              disabled={!servoWrong}
            >
              {copy.workbench.checkThis}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={runTest}
              disabled={echoWrong || servoWrong}
            >
              {copy.workbench.runFullTest}
            </Button>
            <Button variant="quiet" size="sm" onClick={reset}>
              {copy.workbench.resetDemo}
            </Button>
          </div>

          <Divider className="my-4" />

          <AlertStack>
            {echoWrong ? (
              <Alert tone="warning" title={copy.findings.connectionMismatch}>
                <Sentence
                  text={copy.findings.wrongPin("Echo", "D6", "D7")}
                  mono={{ D6: "error", D7: "target" }}
                />
              </Alert>
            ) : (
              <Alert tone="success" title={copy.workbench.stepVerified}>
                {copy.agentPanel.context.allMatch}
              </Alert>
            )}
            {servoWrong ? (
              <Alert tone="warning" title={copy.findings.servoOff}>
                {copy.findings.servoExplanation}
              </Alert>
            ) : null}
          </AlertStack>
        </div>
      </LabBlock>
    </>
  );
}
