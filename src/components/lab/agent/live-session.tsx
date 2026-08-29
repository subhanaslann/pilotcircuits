"use client";

import { useRef, useState } from "react";
import { Eye, Play, RotateCcw, WifiOff } from "lucide-react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { AgentWorkspace } from "@/components/agent/workspace";
import { useAgentSession } from "@/components/agent/use-agent-session";
import {
  CanvasViewport,
  type CanvasHandle,
} from "@/components/canvas/canvas-viewport";
import { CircuitSceneView } from "@/components/canvas/circuit-scene";
import { Button } from "@/components/ui/button";
import { ToastViewport } from "@/components/ui/status";
import { useCopy } from "@/content/copy-provider";
import { zoom as zoomLimits } from "@/lib/circuit/geometry";
import { icon } from "@/lib/design/tokens";

const g = { size: icon.sm, strokeWidth: icon.strokeWidth } as const;

/**
 * The batch's reason for existing, assembled: the canvas on the left, the real
 * agent panel on the right, and the agent actually working between them.
 *
 * Every button here calls the same `run(tool, input)` a WebMCP callback will
 * call in Batch 7 — same payload, same commit, same activity entry, same canvas
 * move. Nothing on this page is a separate demo path.
 */
export function LiveSession() {
  const copy = useCopy();
  const t = copy.lab.agentLab.live;
  const canvas = useRef<CanvasHandle>(null);
  const [scale, setScale] = useState(1);
  const session = useAgentSession({ canvas });

  const { state, highlighted } = session;
  const inspected = state.findings.length > 0;

  /* What an agent does when you ask it to look at your build: read the context,
     compare against the sketch, then point at what it found. */
  const inspectSequence = async () => {
    await session.run("get_build_context", {});
    const outcome = await session.run("inspect_build", {
      scope: "current_step",
    });
    const found =
      (outcome?.result as { findings?: { id: string }[] } | undefined)
        ?.findings ?? [];
    if (found.length) {
      await session.run("show_correction", {
        finding_id: found[0].id,
        detail_level: "hint",
      });
    }
  };

  const action = !inspected
    ? {
        id: "inspect",
        label: copy.workbench.inspect,
        onAction: inspectSequence,
      }
    : {
        id: "verify",
        label: copy.workbench.verify,
        onAction: () => void session.run("verify_current_step", {}),
      };

  return (
    <LabBlock title={t.title} note={t.note}>
      <LabStage className="p-0">
        {/* No wrapping: the two columns are the layout. `min-h-0` on both so the
            panel scrolls its own body instead of growing the row and pushing the
            canvas past its height. */}
        <div className="flex h-[560px] items-stretch">
          <div className="min-h-0 min-w-[380px] flex-1 overflow-hidden">
            <CanvasViewport
              ref={canvas}
              ariaLabel={t.canvasLabel}
              onScaleChange={setScale}
              className="h-full rounded-l-lg"
            >
              <CircuitSceneView
                scene={session.scene}
                showLabels={scale >= zoomLimits.labelThreshold}
                highlight={highlighted?.highlight}
                successTrace={session.trace}
                ledState={session.leds}
                test={session.test}
              />
            </CanvasViewport>
          </div>

          {/* The panel is assembled once, in `agent/workspace.tsx`, and
              this page and the workbench both hand it the same session. */}
          <AgentWorkspace
            session={session}
            action={{ ...action, loading: session.busy }}
            className="w-agent rounded-r-lg border-y-0 border-r-0"
          />
        </div>

        <div className="border-border flex flex-wrap items-center gap-4 border-t px-5 py-4">
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Eye {...g} />}
            onClick={() => void inspectSequence()}
            disabled={session.busy}
          >
            {copy.workbench.inspect}
          </Button>
          <Button
            variant="tertiary"
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
            variant="tertiary"
            size="sm"
            iconLeft={<WifiOff {...g} />}
            onClick={() => session.setWebMcpAvailable(!state.webMcpAvailable)}
          >
            {state.webMcpAvailable
              ? copy.agentPanel.webMcpUnavailable
              : copy.status.connectedViaWebMcp}
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

      <ToastViewport toasts={session.toasts} onDismiss={session.dismissToast} />
    </LabBlock>
  );
}
