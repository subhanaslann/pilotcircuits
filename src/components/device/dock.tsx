"use client";

import { useId, type ReactNode } from "react";
import { ChevronUp } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { LiveRegion } from "@/components/ui/status";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import {
  TestStatusChip,
  type DeviceTestStatus,
} from "@/components/device/test-status";
import { useCopy } from "@/content/copy-provider";
import { icon, layout } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * D-01 · Dock shell
 *
 * The workbench's fourth region: a narrow strip under the canvas that opens to
 * show what the board is saying and folds back to a 44px rail.
 *
 * **Not a `Drawer`.** `overlay.tsx`'s bottom drawer is a modal — portal, scrim,
 * focus trap, `aria-modal`, Escape — and every one of those is wrong here. The
 * dock does not cover the screen, does not take the canvas away, and is not
 * something you dismiss: it is part of the workbench, permanently. So it is an
 * ordinary section in the layout whose height animates between two tokens
 * (`layout.dockCollapsed` / `layout.dockOpen`). The drawer stays where it
 * belongs, in the stacked layout below 1120px.
 *
 * Ground is `surface-sunken` (rule 4): the dock represents a device — a real,
 * countable object — which is the same footing the canvas well sits on.
 *
 * The rail never changes shape. Collapsed or open, it is the same tabs on the
 * left and the same status chip on the right; only the body below it grows.
 * A rail that swapped its contents on open would be a change the user has to
 * re-read, and the point of the chip is that the test's outcome survives the
 * dock being shut.
 */

export type DeviceTab = "device" | "serial" | "test";

export function DeviceDock({
  open,
  onOpenChange,
  tab,
  onTabChange,
  status,
  /** Spoken when the run changes state; see `LiveRegion`. */
  announcement,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  tab: DeviceTab;
  onTabChange: (next: DeviceTab) => void;
  status: DeviceTestStatus;
  announcement?: string;
  className?: string;
  children: ReactNode;
}) {
  const copy = useCopy();
  const id = useId();
  const bodyId = `${id}-body`;

  const tabs = [
    { value: "device" as const, label: copy.device.tabs.device },
    { value: "serial" as const, label: copy.device.tabs.serial },
    { value: "test" as const, label: copy.device.tabs.test },
  ];

  return (
    <section
      aria-label={copy.device.dockRegion}
      className={cn(
        "bg-surface-sunken border-border flex flex-col overflow-hidden border-t transition-[height] duration-settle ease-out-soft",
        className,
      )}
      style={{ height: open ? layout.dockOpen : layout.dockCollapsed }}
    >
      <div className="border-border flex h-11 shrink-0 items-center gap-2 border-b pr-2 pl-1">
        <Tabs
          items={tabs}
          value={tab}
          onValueChange={(next) => {
            onTabChange(next);
            /* Choosing what to look at is asking to see it. */
            if (!open) onOpenChange(true);
          }}
          label={copy.device.dockRegion}
          size="sm"
          id={id}
          className="min-w-0 flex-1 border-b-0"
        />

        <TestStatusChip status={status} />

        <IconButton
          label={open ? copy.device.collapse : copy.device.expand}
          size="sm"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => onOpenChange(!open)}
        >
          <ChevronUp
            size={icon.sm}
            strokeWidth={icon.strokeWidth}
            className={cn(
              "transition-transform duration-settle ease-out-soft",
              open && "rotate-180",
            )}
          />
        </IconButton>
      </div>

      {/* Clipped content is still tabbable, which is how a folded dock ends up
          stealing focus into things nobody can see. `inert` closes it. */}
      <div
        id={bodyId}
        inert={!open}
        className="scroll-fade min-h-0 flex-1 overflow-y-auto px-4 py-2.5"
      >
        {/* The caller passes only the selected tab's content, so one panel is
            enough — but it has to exist, and it has to carry the id the tab's
            `aria-controls` names. It also gives the switch its `motion-expand`
            entrance, so changing tabs is something you see happen (rule 6). */}
        <TabPanel active tabsId={id} value={tab}>
          {children}
        </TabPanel>
      </div>

      {announcement ? <LiveRegion message={announcement} /> : null}
    </section>
  );
}
