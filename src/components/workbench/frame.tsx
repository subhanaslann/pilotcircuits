"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/overlay";
import { Alert } from "@/components/ui/status";
import { brand } from "@/content/brand";
import { useCopy } from "@/content/copy-provider";
import { icon, layout } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * W-04 · The four-zone layout   ·   W-11 · Small-screen notice
 *
 * Batch 3 built the middle, Batch 4 the right, Batch 5 the foot. This is the
 * first time the three stand beside each other, and the whole risk of the batch
 * is here rather than in any new drawing.
 *
 * Three things the frame is responsible for and nothing else is:
 *
 * **The geometry is the token.** `layout.stepRail` · `layout.agentPanel` ·
 * `layout.topbar` · `layout.dockOpen` were fixed in Batch 0 and are spent here
 * for the first time. At 1280 that leaves the canvas 668px across and, with the
 * dock open, 612 down — comfortable one way, tight the other, which is why the
 * canvas controls float (see `CanvasWorkspace`) and why the dock's default is
 * shut.
 *
 * **Every column scrolls itself.** `min-h-0` on each track and `overflow-hidden`
 * on the frame: without them the agent panel grows the row when a finding
 * arrives, and the canvas — which measures itself once, on purpose — is
 * squeezed by a change the user never asked for.
 *
 * **The canvas does not exist below the fold width.** Not hidden: not rendered.
 * `frontend-plan` §16 says the circuit is never shrunk to the point of
 * meaninglessness, and a `CanvasViewport` mounted inside a 380px column would
 * fit itself to that width once and keep the result. Below `workbenchMin` the
 * steps, the findings and the agent are all still reachable — which is the
 * other half of what §16 asks for — and the agent panel becomes the `Drawer`
 * Batch 5 declined to spend on the dock, precisely so it would still be here.
 */

const WIDE = `(min-width: ${layout.workbenchMin}px)`;

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Whether there is room for four regions.
 *
 * A media query rather than a breakpoint class, because this is not styling:
 * the two layouts hold different trees, and rendering both would mount two
 * agent panels, two live regions and two sets of tab ids. The server answers
 * `true` — the product's stated target is 1440 — so a narrow client corrects
 * itself on hydration rather than mismatching.
 */
export function useWideEnough() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
}

/**
 * W-11 · Best experienced on a larger screen.
 *
 * A sentence, not a box (rule 4). It is the same job `You can continue in
 * guided demo mode` has: nothing is broken and nothing is blocked, so a
 * warning-shaped container would say the opposite of the words inside it. Tone
 * `info` for the same reason — a narrow window is not a fault in the build.
 */
export function SmallScreenNotice({ className }: { className?: string }) {
  const copy = useCopy();

  return (
    <Alert tone="info" title={copy.a11y.smallScreen} className={className}>
      {copy.a11y.smallScreenDetail}
    </Alert>
  );
}

export function WorkbenchFrame({
  wide: forceWide,
  topbar,
  rail,
  workspace,
  dock,
  panel,
  className,
}: {
  /**
   * Overrides the media query. The design lab has to be able to show both
   * layouts on one screen; the product never passes it.
   */
  wide?: boolean;
  topbar: ReactNode;
  /**
   * The three side regions each get a track and are expected to fill it —
   * `h-full` on the element passed in. Every one of them scrolls its own body,
   * and a region that sized itself to its content would hand that scrolling
   * back to the page.
   */
  rail: ReactNode;
  /** The canvas region. Not rendered at all below the fold width. */
  workspace: ReactNode;
  dock: ReactNode;
  panel: ReactNode;
  className?: string;
}) {
  const copy = useCopy();
  const measured = useWideEnough();
  const wide = forceWide ?? measured;
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (wide) {
    return (
      <div className={cn("bg-app flex flex-col overflow-hidden", className)}>
        {topbar}
        <div className="flex min-h-0 flex-1">
          <div className="w-rail min-h-0 shrink-0">{rail}</div>

          {/* The canvas and the dock share one column: the dock is the foot of
              the workspace, not a bar across the window. */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1">{workspace}</div>
            {dock}
          </div>

          <div className="w-agent min-h-0 shrink-0">{panel}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-app flex flex-col overflow-hidden", className)}>
      {topbar}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-border bg-surface border-b px-4 py-1">
          <SmallScreenNotice />
        </div>

        <div className="p-4">
          <Button
            variant="secondary"
            size="sm"
            iconLeft={
              <PanelRight size={icon.sm} strokeWidth={icon.strokeWidth} />
            }
            onClick={() => setDrawerOpen(true)}
          >
            {copy.workbench.openAgentPanel}
          </Button>
        </div>

        {rail}
        {dock}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={brand.agentName}
        titleHidden
        side="right"
        /* The panel brings its own header, tabs and pinned action; the drawer
           only has to get out of its way. */
        className="[&>div:last-child]:p-0"
      >
        {panel}
      </Drawer>
    </div>
  );
}
