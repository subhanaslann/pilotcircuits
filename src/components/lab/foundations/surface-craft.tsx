"use client";

import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { useCopy } from "@/content/copy-provider";
import type { foundations } from "@/content/locales/lab/foundations";

type SurfaceCopy = (typeof foundations)["en"]["surface"];

const buildRadii = (t: SurfaceCopy["radius"]) => [
  { cls: "rounded-xs", token: "xs", px: 4, usage: t.xs },
  { cls: "rounded-sm", token: "sm", px: 6, usage: t.sm },
  { cls: "rounded-md", token: "md", px: 10, usage: t.md },
  { cls: "rounded-lg", token: "lg", px: 12, usage: t.lg },
  {
    cls: "rounded-xl",
    token: "xl",
    px: 14,
    usage: t.xl,
  },
  {
    cls: "rounded-2xl",
    token: "2xl",
    px: 18,
    usage: t.xl2,
  },
  {
    cls: "rounded-full",
    token: "full",
    px: 999,
    usage: t.full,
  },
];

const buildShadows = (t: SurfaceCopy["elevation"]) => [
  {
    cls: "shadow-e1",
    token: "e1",
    usage: t.e1,
  },
  {
    cls: "shadow-e2",
    token: "e2",
    usage: t.e2,
  },
  {
    cls: "shadow-e3",
    token: "e3",
    usage: t.e3,
  },
];

export function SurfaceCraft() {
  const copy = useCopy();
  const t: SurfaceCopy = copy.lab.foundations.surface;
  const radii = buildRadii(t.radius);
  const shadows = buildShadows(t.elevation);

  return (
    <>
      <LabBlock title={t.radius.title} note={t.radius.note}>
        <LabStage>
          <div className="flex flex-wrap gap-5">
            {radii.map((r) => (
              <div key={r.token} className="w-[132px]">
                <div
                  className={`bg-surface-sunken ring-border-strong h-14 ring-1 ring-inset ${r.cls}`}
                  aria-hidden="true"
                />
                <p className="text-body-sm text-ink mt-2 font-medium">
                  {r.token}
                  <span className="text-mono-sm text-ink-tertiary tnum ml-1.5 font-mono">
                    {r.px === 999 ? "∞" : `${r.px}px`}
                  </span>
                </p>
                <p className="text-caption text-ink-secondary leading-snug">
                  {r.usage}
                </p>
              </div>
            ))}
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.elevation.title} note={t.elevation.note}>
        <div className="bg-app border-border grid grid-cols-1 gap-5 rounded-lg border p-6 sm:grid-cols-3">
          {shadows.map((s) => (
            <div key={s.token}>
              <div
                className={`bg-surface border-border h-20 rounded-lg border ${s.cls}`}
                aria-hidden="true"
              />
              <p className="text-body-sm text-ink mt-2.5 font-medium">
                {s.token}
              </p>
              <p className="text-caption text-ink-secondary leading-snug">
                {s.usage}
              </p>
            </div>
          ))}
        </div>
      </LabBlock>

      <LabBlock title={t.layers.title} note={t.layers.note}>
        <LabStage>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <div className="bg-surface border-border shadow-e1 rounded-md border p-3">
                <p className="text-body-sm text-ink">{t.layers.restingRow}</p>
                <p className="text-caption text-ink-secondary">border + e1</p>
              </div>
              <p className="text-caption text-ink-tertiary mt-2">
                {t.layers.restingCaption}
              </p>
            </div>
            <div>
              <div className="bg-accent-soft layer-active rounded-md p-3">
                <p className="text-body-sm text-ink">{t.layers.activeRow}</p>
                <p className="text-caption text-ink-secondary">
                  accent-soft + layer-active
                </p>
              </div>
              <p className="text-caption text-ink-tertiary mt-2">
                {t.layers.activeCaption}
              </p>
            </div>
            <div>
              <div className="bg-surface-sunken layer-sunken rounded-md p-3">
                <p className="text-body-sm text-ink">{t.layers.sunkenWell}</p>
                <p className="text-caption text-ink-secondary">
                  sunken + layer-sunken
                </p>
              </div>
              <p className="text-caption text-ink-tertiary mt-2">
                {t.layers.sunkenCaption}
              </p>
            </div>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.raised.title} note={t.raised.note}>
        <LabStage>
          <div className="flex flex-wrap items-center gap-5">
            <span className="bg-accent text-ink-inverse shadow-btn-accent text-body-sm inline-flex h-11 items-center rounded-full px-5 font-medium">
              {copy.workbench.verify}
            </span>
            <span className="bg-surface text-ink shadow-btn-surface text-body-sm inline-flex h-11 items-center rounded-full px-5 font-medium">
              {copy.workbench.showMe}
            </span>
            <span className="bg-surface-sunken text-ink-secondary text-body-sm inline-flex h-11 items-center rounded-full px-5 font-medium">
              {copy.workbench.checkThis}
            </span>
            <p className="text-caption text-ink-tertiary">
              {t.raised.staticNote}
            </p>
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}
