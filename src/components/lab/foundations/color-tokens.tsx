"use client";

import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { useCopy } from "@/content/copy-provider";
import type { foundations } from "@/content/locales/lab/foundations";
import { contrastRatio, grade } from "@/lib/utils/contrast";
import { cn } from "@/lib/utils/cn";

type Colour = (typeof foundations)["en"]["colour"];

interface Token {
  name: string;
  hex: string;
  usage: string;
  /** Render a border on the swatch when the colour is near-white. */
  outline?: boolean;
}

const buildGroups = (
  t: Colour,
): {
  title: string;
  note?: string;
  /** Contrast is only meaningful for colours that carry text. */
  showContrast?: boolean;
  tokens: Token[];
}[] => [
  {
    title: t.surfaces.title,
    note: t.surfaces.note,
    tokens: [
      {
        name: "app",
        hex: "#f5f7f8",
        usage: t.surfaces.app,
        outline: true,
      },
      {
        name: "surface",
        hex: "#ffffff",
        usage: t.surfaces.surface,
        outline: true,
      },
      {
        name: "surface-sunken",
        hex: "#eef1f4",
        usage: t.surfaces.surfaceSunken,
        outline: true,
      },
      {
        name: "surface-hover",
        hex: "#f7f9fa",
        usage: t.surfaces.surfaceHover,
        outline: true,
      },
      {
        name: "surface-active",
        hex: "#eaeff3",
        usage: t.surfaces.surfaceActive,
        outline: true,
      },
      {
        name: "surface-inverse",
        hex: "#111827",
        usage: t.surfaces.surfaceInverse,
      },
    ],
  },
  {
    title: t.ink.title,
    note: t.ink.note,
    showContrast: true,
    tokens: [
      { name: "ink", hex: "#111827", usage: t.ink.ink },
      {
        name: "ink-secondary",
        hex: "#5b6576",
        usage: t.ink.inkSecondary,
      },
      {
        name: "ink-tertiary",
        hex: "#667085",
        usage: t.ink.inkTertiary,
      },
      {
        name: "ink-disabled",
        hex: "#94a2b1",
        usage: t.ink.inkDisabled,
      },
    ],
  },
  {
    title: t.lines.title,
    tokens: [
      {
        name: "border",
        hex: "#e4e9ed",
        usage: t.lines.border,
        outline: true,
      },
      {
        name: "border-strong",
        hex: "#cfd8e0",
        usage: t.lines.borderStrong,
        outline: true,
      },
      {
        name: "grid",
        hex: "#dce3e8",
        usage: t.lines.grid,
        outline: true,
      },
    ],
  },
  {
    title: t.accent.title,
    note: t.accent.note,
    tokens: [
      {
        name: "accent",
        hex: "#1677ff",
        usage: t.accent.accent,
      },
      { name: "accent-hover", hex: "#0e63e0", usage: t.accent.accentHover },
      { name: "accent-active", hex: "#0a53bd", usage: t.accent.accentActive },
      {
        name: "accent-soft",
        hex: "#eaf3ff",
        usage: t.accent.accentSoft,
        outline: true,
      },
      {
        name: "accent-border",
        hex: "#b9d8ff",
        usage: t.accent.accentBorder,
        outline: true,
      },
    ],
  },
  {
    title: t.teal.title,
    note: t.teal.note,
    tokens: [
      { name: "teal", hex: "#14b8a6", usage: t.teal.teal },
      { name: "teal-hover", hex: "#0f9e8e", usage: t.teal.tealHover },
      {
        name: "teal-soft",
        hex: "#e6f7f5",
        usage: t.teal.tealSoft,
        outline: true,
      },
      {
        name: "teal-border",
        hex: "#9ee4dc",
        usage: t.teal.tealBorder,
        outline: true,
      },
    ],
  },
  {
    title: t.status.title,
    note: t.status.note,
    tokens: [
      { name: "success", hex: "#16a36a", usage: t.status.success },
      { name: "warning", hex: "#f59e0b", usage: t.status.warning },
      {
        name: "error",
        hex: "#e5484d",
        usage: t.status.error,
      },
      {
        name: "success-soft",
        hex: "#e7f6ef",
        usage: t.status.successSoft,
        outline: true,
      },
      {
        name: "warning-soft",
        hex: "#fef4e6",
        usage: t.status.warningSoft,
        outline: true,
      },
      {
        name: "error-soft",
        hex: "#fdecec",
        usage: t.status.errorSoft,
        outline: true,
      },
    ],
  },
];

const APP_BG = "#f5f7f8";

function Swatch({
  token,
  showContrast,
  nonText,
}: {
  token: Token;
  showContrast?: boolean;
  nonText: string;
}) {
  const ratio = contrastRatio(token.hex, APP_BG);
  const rating = grade(ratio);
  const passes = rating !== "Fail";

  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "size-11 shrink-0 rounded-md",
          token.outline && "ring-border ring-1 ring-inset",
        )}
        style={{ backgroundColor: token.hex }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-body-sm text-ink font-medium">{token.name}</p>
        <p className="text-mono-sm text-ink-tertiary tnum font-mono uppercase">
          {token.hex}
          {showContrast ? (
            <span
              className={cn(
                "ml-1.5 normal-case",
                passes ? "text-success" : "text-warning",
              )}
            >
              {ratio.toFixed(1)}:1 {passes ? rating : nonText}
            </span>
          ) : null}
        </p>
        <p className="text-caption text-ink-secondary mt-0.5 leading-snug">
          {token.usage}
        </p>
      </div>
    </div>
  );
}

export function ColorTokens() {
  const copy = useCopy();
  const t: Colour = copy.lab.foundations.colour;
  const groups = buildGroups(t);

  return (
    <>
      {groups.map((group) => (
        <LabBlock key={group.title} title={group.title} note={group.note}>
          <LabStage>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.tokens.map((token) => (
                <Swatch
                  key={token.name}
                  token={token}
                  showContrast={group.showContrast}
                  nonText={t.nonText}
                />
              ))}
            </div>
          </LabStage>
        </LabBlock>
      ))}

      <LabBlock title={t.stack.title} note={t.stack.note}>
        <div className="bg-app border-border rounded-lg border p-5">
          <p className="text-caption text-ink-tertiary mb-3">app</p>
          <div className="bg-surface border-border shadow-e1 rounded-lg border p-4">
            <p className="text-caption text-ink-tertiary mb-3">surface</p>
            <div className="bg-surface-sunken border-border layer-sunken rounded-md border p-4">
              <p className="text-caption text-ink-tertiary mb-3">
                surface-sunken · {t.stack.canvasWell}
              </p>
              <div className="bg-surface border-border shadow-e2 rounded-md border p-3">
                <p className="text-caption text-ink-secondary">
                  surface + elevation e2 · {t.stack.floatingPanel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </LabBlock>
    </>
  );
}
