"use client";

import { CircleCheck, CircleDashed, TriangleAlert } from "lucide-react";
import { StatusBadge, type BadgeTone } from "@/components/ui/badge";
import { ActivityPulse } from "@/components/ui/feedback";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";

/**
 * D-07 · Test status chip
 *
 * Not a new badge variant — A-03's capsule with the four words the dock
 * already owns (`copy.device.states`). Rule 7 wants two signals, so each state
 * changes glyph as well as colour: a dashed ring for idle, the lattice for
 * running, a tick for passed, a triangle for failed. The triangle is the top of
 * the severity scale everywhere in this product (see `Alert`), and a failed
 * functional test is the top of it.
 *
 * `running` borrows the activity pulse rather than inventing a second
 * "in progress" animation (rule 8). It is the same organism doing the same
 * thing, so it is drawn the same way.
 */

export type DeviceTestStatus = "idle" | "running" | "passed" | "failed";

const g = { size: icon.sm, strokeWidth: 2 } as const;

const meta: Record<
  DeviceTestStatus,
  { tone: BadgeTone; glyph: React.ReactNode }
> = {
  idle: { tone: "neutral", glyph: <CircleDashed {...g} /> },
  running: { tone: "accent", glyph: null },
  passed: { tone: "success", glyph: <CircleCheck {...g} /> },
  failed: { tone: "error", glyph: <TriangleAlert {...g} /> },
};

export function TestStatusChip({
  status,
  className,
}: {
  status: DeviceTestStatus;
  className?: string;
}) {
  const copy = useCopy();
  const { tone, glyph } = meta[status];

  return (
    <StatusBadge
      tone={tone}
      glyph={
        glyph ?? (
          /* The pulse is its own live region by default; the dock announces
             through one `LiveRegion` instead, so this one stays quiet. */
          <ActivityPulse state="working" label="" announce={false} />
        )
      }
      className={className}
    >
      {copy.device.states[status]}
    </StatusBadge>
  );
}
