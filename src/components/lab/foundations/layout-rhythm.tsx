"use client";

import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { useCopy } from "@/content/copy-provider";
import type { foundations } from "@/content/locales/lab/foundations";
import { layout } from "@/lib/design/tokens";

type LayoutCopy = (typeof foundations)["en"]["layout"];

const buildSteps = (t: LayoutCopy["scale"]) => [
  { token: "0.5", px: 2, usage: t.px2 },
  { token: "1", px: 4, usage: t.px4 },
  { token: "1.5", px: 6, usage: t.px6 },
  { token: "2", px: 8, usage: t.px8 },
  { token: "2.5", px: 10, usage: t.px10 },
  { token: "3", px: 12, usage: t.px12 },
  { token: "4", px: 16, usage: t.px16 },
  { token: "5", px: 20, usage: t.px20 },
  { token: "6", px: 24, usage: t.px24 },
  { token: "8", px: 32, usage: t.px32 },
  { token: "12", px: 48, usage: t.px48 },
];

const buildFrames = (t: LayoutCopy["frames"]) => [
  {
    token: "topbar",
    px: layout.topbar,
    usage: t.topbar,
  },
  { token: "rail", px: layout.stepRail, usage: t.rail },
  { token: "agent", px: layout.agentPanel, usage: t.agent },
  { token: "dock", px: layout.dockCollapsed, usage: t.dock },
  { token: "dock-open", px: layout.dockOpen, usage: t.dockOpen },
  {
    token: "shell",
    px: layout.shell,
    usage: t.shell,
  },
];

export function LayoutRhythm() {
  const copy = useCopy();
  const t: LayoutCopy = copy.lab.foundations.layout;
  const steps = buildSteps(t.scale);
  const frames = buildFrames(t.frames);

  return (
    <>
      <LabBlock title={t.scale.title} note={t.scale.note}>
        <LabStage>
          <ul className="space-y-1.5">
            {steps.map((step) => (
              <li key={step.token} className="flex items-center gap-3">
                <code className="text-mono-sm text-ink-secondary tnum w-8 shrink-0 text-right font-mono">
                  {step.token}
                </code>
                <span
                  className="bg-accent-soft ring-accent-border h-3 shrink-0 rounded-xs ring-1 ring-inset"
                  style={{ width: step.px }}
                  aria-hidden="true"
                />
                <code className="text-mono-sm text-ink-tertiary tnum w-10 shrink-0 font-mono">
                  {step.px}px
                </code>
                <span className="text-caption text-ink-secondary">
                  {step.usage}
                </span>
              </li>
            ))}
          </ul>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.frames.title} note={t.frames.note}>
        <LabStage>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {frames.map((frame) => (
              <div
                key={frame.token}
                className="border-border/70 flex items-baseline gap-3 border-b py-1.5"
              >
                <dt className="text-body-sm text-ink w-24 shrink-0 font-medium">
                  {frame.token}
                </dt>
                <dd className="text-mono-sm text-accent tnum w-12 shrink-0 font-mono">
                  {frame.px}px
                </dd>
                <dd className="text-caption text-ink-secondary">
                  {frame.usage}
                </dd>
              </div>
            ))}
          </dl>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.workbench.title} note={t.workbench.note}>
        <LabStage>
          <div className="border-border-strong bg-app overflow-hidden rounded-md border">
            <div className="border-border bg-surface text-caption text-ink-secondary flex h-8 items-center justify-between border-b px-3">
              <span>{t.workbench.topbar}</span>
              <code className="text-mono-sm text-ink-tertiary font-mono">
                h {layout.topbar}
              </code>
            </div>
            <div className="flex h-44">
              <div className="border-border bg-surface text-caption text-ink-secondary flex w-[126px] shrink-0 flex-col justify-between border-r p-3">
                <span>{t.workbench.rail}</span>
                <code className="text-mono-sm text-ink-tertiary font-mono">
                  w {layout.stepRail}
                </code>
              </div>
              <div className="bg-surface-sunken grid-technical text-caption text-ink-secondary flex flex-1 flex-col justify-between p-3">
                <span>{t.workbench.canvas}</span>
                <code className="text-mono-sm text-ink-tertiary font-mono">
                  {t.workbench.canvasWidth}
                </code>
              </div>
              <div className="border-border bg-surface text-caption text-ink-secondary flex w-[180px] shrink-0 flex-col justify-between border-l p-3">
                <span>{t.workbench.agent}</span>
                <code className="text-mono-sm text-ink-tertiary font-mono">
                  w {layout.agentPanel}
                </code>
              </div>
            </div>
            <div className="border-border bg-surface text-caption text-ink-secondary flex h-7 items-center justify-between border-t px-3">
              <span>{t.workbench.dock}</span>
              <code className="text-mono-sm text-ink-tertiary font-mono">
                h {layout.dockCollapsed} / {layout.dockOpen}
              </code>
            </div>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.breakpoints.title}>
        <LabStage className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-border text-overline text-ink-tertiary border-b text-left uppercase">
                <th className="px-5 py-2.5 font-semibold">
                  {t.breakpoints.width}
                </th>
                <th className="px-3 py-2.5 font-semibold">
                  {t.breakpoints.behaviour}
                </th>
              </tr>
            </thead>
            <tbody className="text-body-sm">
              <tr className="border-border/70 border-b">
                <td className="text-mono-sm text-accent px-5 py-2.5 font-mono">
                  ≥ 1440
                </td>
                <td className="text-ink-secondary px-3 py-2.5">
                  {t.breakpoints.target}
                </td>
              </tr>
              <tr className="border-border/70 border-b">
                <td className="text-mono-sm text-accent px-5 py-2.5 font-mono">
                  1280–1439
                </td>
                <td className="text-ink-secondary px-3 py-2.5">
                  {t.breakpoints.absorb}
                </td>
              </tr>
              <tr className="border-border/70 border-b">
                <td className="text-mono-sm text-accent px-5 py-2.5 font-mono">
                  1120–1279
                </td>
                <td className="text-ink-secondary px-3 py-2.5">
                  {t.breakpoints.drawer}
                </td>
              </tr>
              <tr>
                <td className="text-mono-sm text-accent px-5 py-2.5 font-mono">
                  &lt; 1120
                </td>
                <td className="text-ink-secondary px-3 py-2.5">
                  {t.breakpoints.stacked}
                </td>
              </tr>
            </tbody>
          </table>
        </LabStage>
      </LabBlock>
    </>
  );
}
