"use client";

import { useRef, useState } from "react";
import { Eye, Play, RotateCcw, WifiOff } from "lucide-react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { CoachCorner } from "@/components/agent/coach-corner";
import { AgentWorkspace } from "@/components/agent/workspace";
import { useCoachMood } from "@/components/agent/use-coach-mood";
import { useAgentSession } from "@/components/agent/use-agent-session";
import { useWebMcpTools } from "@/components/agent/use-webmcp";
import {
  CanvasViewport,
  type CanvasHandle,
} from "@/components/canvas/canvas-viewport";
import { CircuitSceneView } from "@/components/canvas/circuit-scene";
import { Button } from "@/components/ui/button";
import { ToastViewport } from "@/components/ui/status";
import { useCopy } from "@/content/copy-provider";
import { demoStart } from "@/lib/agent/builds";
import { workbenchTools } from "@/lib/agent/model";
import { zoom as zoomLimits } from "@/lib/circuit/geometry";
import { icon } from "@/lib/design/tokens";

const g = { size: icon.sm, strokeWidth: icon.strokeWidth } as const;

/**
 * The batch's reason for existing, assembled: the canvas on the left, the real
 * agent panel on the right, and the agent actually working between them.
 *
 * Every button here calls the same `run(tool, input)` a WebMCP callback calls
 * on the workbench — same payload, same commit, same activity entry, same
 * canvas move. Nothing on this page is a separate demo path.
 *
 * ## What it does not do, and why the count below is zero
 *
 * It does not hand any of those eight names to the browser. `AgentPanel`
 * defaults its inventory to the bench's own list, and the number beside the
 * pulse is a claim about *the screen it is standing on* — so with no `tools`
 * prop this page printed `7 tools on this page` over a page that registers
 * none, directly contradicting `workspace.tsx`'s own note on that prop.
 *
 * The obstacle was never this file. `useWebMcpTools` read the carried build
 * session unconditionally, and the design lab is the one place deliberately
 * outside `BuildProvider` (`app/(product)/layout.tsx`,
 * `build-provider.tsx:181-195`), so calling the hook here threw
 * `useBuild must be used inside <BuildProvider>` before a single pixel
 * rendered. That read is optional now — `useBuildSessionIfAny` — and the page
 * hands in the session it already had, which is the argument the hook always
 * took. So the eight are registered here for real, against a mounted canvas
 * and a mounted panel, and the number beside the pulse is the length of the
 * list this page actually gave the browser.
 */
export function LiveSession() {
  const copy = useCopy();
  const t = copy.lab.agentLab.live;
  const canvas = useRef<CanvasHandle>(null);
  const [scale, setScale] = useState(1);
  const session = useAgentSession({ canvas, start: demoStart });
  /* Its own session, not the carried one — the lab must never move the build
     waiting at `/workbench`. Passing it is what lets the hook run outside
     `BuildProvider` at all; without it the hook throws by design. */
  useWebMcpTools(workbenchTools, session);
  /* The coach reads the same session the panel and the ring do, so pressing
     Inspect below moves all three at once — which is the demonstration. */
  const coach = useCoachMood(session);

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
          <div className="relative min-h-0 min-w-[380px] flex-1 overflow-hidden">
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
            {/* G-16 · in the corner the sketch put it, on its own plate because
                this canvas has no shelf. */}
            <CoachCorner
              ground="mat"
              mood={coach.mood}
              line={coach.line}
              detail={coach.detail}
              className="absolute top-3 right-3"
            />
          </div>

          {/* The panel is assembled once, in `agent/workspace.tsx`, and
              this page and the workbench both hand it the same session. The
              list passed here is the one registered above, so the count the
              header prints is a fact about this page rather than a constant. */}
          <AgentWorkspace
            session={session}
            action={{ ...action, loading: session.busy }}
            tools={workbenchTools}
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
          {/* The only thing on this page that moves `webMcpAvailable`, and it
              has to be: `useAgentSession`'s mount probe can only ever raise the
              flag and finds no host in any browser shipping today, and
              `useWebMcpTools` — whose two writes are `false` on arrival at a
              hostless page and the handshake's answer after — is not called
              here at all. Without this button the lab could show the offline
              panel and nothing else. */}
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
