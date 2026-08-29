"use client";

import { useRef } from "react";
import { useAgentSession } from "@/components/agent/use-agent-session";
import { type CanvasHandle } from "@/components/canvas/canvas-viewport";
import { Workbench } from "@/components/workbench/live-workbench";
import type { CameraVariant } from "@/components/workbench/camera";
import { cn } from "@/lib/utils/cn";

/**
 * W-04, in the lab.
 *
 * Batch 7 built the assembly here; Batch 8 moved it to
 * `components/workbench/live-workbench.tsx` so the product route could mount it
 * against the session `BuildProvider` carries between screens. What is left is
 * the part that is genuinely the lab's: **its own session.**
 *
 * That separation is not tidiness. Injecting a fault or completing the build
 * while reviewing this page must not move the build the product is holding, and
 * one component that takes a session as an argument is how the two stay apart
 * without a second copy of the workbench.
 *
 * No `onFinish` either — the lab has no completion screen to offer, so the
 * pinned foot behaves exactly as it did when this batch was approved.
 */
export function LiveWorkbench({
  wide,
  cameraVariant = "plate",
  className,
}: {
  /** Overrides the media query, so the lab can show the folded layout. */
  wide?: boolean;
  cameraVariant?: CameraVariant;
  className?: string;
}) {
  const canvas = useRef<CanvasHandle>(null);
  const camera = useRef<CanvasHandle>(null);
  const session = useAgentSession({ canvas, camera });

  return (
    <Workbench
      session={session}
      canvas={canvas}
      camera={camera}
      backHref="/lab/library"
      wide={wide}
      cameraVariant={cameraVariant}
      className={cn("border-border rounded-lg border", className)}
    />
  );
}
