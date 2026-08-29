"use client";

import { useState } from "react";
import { LabBlock } from "@/components/lab/lab-primitives";
import { SegmentedControl } from "@/components/ui/choice";
import { LiveWorkbench } from "@/components/lab/workbench/live-workbench";
import { useCopy } from "@/content/copy-provider";

/**
 * W-04 · the four regions, at the two widths the product promises.
 *
 * The stage is the real size, not a scaled-down picture of it: 1440 × 900 and
 * 1280 × 900, scrolled horizontally when the lab column is narrower. A layout
 * judged at 60% is a layout judged at a font size nobody will read it at.
 */
export function LayoutStage() {
  const copy = useCopy();
  const t = copy.lab.workbenchLab.layout;
  const [width, setWidth] = useState<"1440" | "1280">("1440");

  return (
    <LabBlock title={t.stageTitle} note={t.stageNote}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-caption text-ink-tertiary">{t.widthLabel}</span>
        <SegmentedControl<"1440" | "1280">
          size="sm"
          label={t.widthLabel}
          value={width}
          onValueChange={setWidth}
          options={[
            { value: "1440", label: "1440 × 900" },
            { value: "1280", label: "1280 × 900" },
          ]}
        />
      </div>

      <div className="border-border bg-app overflow-x-auto rounded-lg border p-4">
        {/* Deliberately not keyed by width: switching does not remount, so
            the canvas keeps the view it fitted once — which is the behaviour
            the note underneath is about. */}
        <div style={{ width: Number(width) }} className="shrink-0">
          <LiveWorkbench className="h-[900px]" />
        </div>
      </div>

      <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
        {t.pressureNote}
      </p>
      <p className="text-caption text-ink-tertiary mt-2 max-w-prose">
        {t.refitNote}
      </p>
    </LabBlock>
  );
}
