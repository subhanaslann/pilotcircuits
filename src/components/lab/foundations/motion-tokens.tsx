"use client";

import { useState } from "react";
import { Play, Zap, ZapOff } from "lucide-react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { useCopy } from "@/content/copy-provider";
import type { foundations } from "@/content/locales/lab/foundations";
import { duration, ease, useReducedMotion } from "@/lib/design/motion";
import { icon } from "@/lib/design/tokens";

type MotionCopy = (typeof foundations)["en"]["motion"];

const buildDurations = (t: MotionCopy["durations"]) => [
  {
    token: "instant",
    ms: duration.instant * 1000,
    usage: t.instant,
  },
  {
    token: "quick",
    ms: duration.quick * 1000,
    usage: t.quick,
  },
  {
    token: "settle",
    ms: duration.settle * 1000,
    usage: t.settle,
  },
  {
    token: "deliberate",
    ms: duration.deliberate * 1000,
    usage: t.deliberate,
  },
];

const buildEasings = (t: MotionCopy["easing"]) => [
  {
    token: "out-soft",
    curve: ease.out,
    css: "cubic-bezier(0.16, 0.84, 0.44, 1)",
    usage: t.outSoft,
  },
  {
    token: "in-out-soft",
    curve: ease.inOut,
    css: "cubic-bezier(0.4, 0, 0.2, 1)",
    usage: t.inOutSoft,
  },
  {
    token: "overshoot",
    curve: ease.overshoot,
    css: "cubic-bezier(0.34, 1.26, 0.64, 1)",
    usage: t.overshoot,
  },
];

/** Draws the bezier so the curve can be judged, not just read. */
function EaseCurve({ curve }: { curve: readonly number[] }) {
  const [x1, y1, x2, y2] = curve;
  const w = 72;
  const h = 72;
  const path = `M 0 ${h} C ${x1 * w} ${h - y1 * h}, ${x2 * w} ${h - y2 * h}, ${w} 0`;
  return (
    <svg viewBox={`-6 -12 ${w + 12} ${h + 24}`} className="h-[76px] w-[76px]">
      <rect
        x="0"
        y="0"
        width={w}
        height={h}
        fill="var(--color-surface-sunken)"
        rx="4"
      />
      <path
        d={`M 0 ${h} L ${w} 0`}
        stroke="var(--color-border-strong)"
        strokeWidth="1"
        strokeDasharray="2 3"
        fill="none"
      />
      <path
        d={path}
        stroke="var(--color-accent)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MotionTokens() {
  const copy = useCopy();
  const t: MotionCopy = copy.lab.foundations.motion;
  const reduced = useReducedMotion();
  const [run, setRun] = useState(0);

  const durations = buildDurations(t.durations);
  const easings = buildEasings(t.easing);

  return (
    <>
      <LabBlock title={t.preference.title} note={t.preference.note}>
        <LabStage>
          <div className="flex items-center gap-2.5">
            {reduced ? (
              <ZapOff
                size={icon.md}
                strokeWidth={icon.strokeWidth}
                className="text-warning"
                aria-hidden="true"
              />
            ) : (
              <Zap
                size={icon.md}
                strokeWidth={icon.strokeWidth}
                className="text-success"
                aria-hidden="true"
              />
            )}
            <div>
              <p className="text-body-sm text-ink font-medium">
                {reduced
                  ? "prefers-reduced-motion: reduce"
                  : "prefers-reduced-motion: no-preference"}
              </p>
              <p className="text-caption text-ink-secondary">
                {reduced ? t.preference.reducedDetail : t.preference.fullDetail}
              </p>
            </div>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.durations.title} note={t.durations.note}>
        <LabStage>
          <button
            type="button"
            onClick={() => setRun((n) => n + 1)}
            className="border-border bg-surface text-body-sm text-ink hover:bg-surface-hover mb-4 inline-flex h-9 items-center gap-1.5 rounded-md border px-3 font-medium transition-colors"
          >
            <Play
              size={icon.xs}
              strokeWidth={icon.strokeWidth}
              aria-hidden="true"
            />
            {t.durations.replay}
          </button>
          <ul className="space-y-3">
            {durations.map((d) => (
              <li key={d.token} className="flex items-center gap-3">
                <span className="text-body-sm text-ink w-20 shrink-0 font-medium">
                  {d.token}
                </span>
                <code className="text-mono-sm text-ink-tertiary tnum w-12 shrink-0 font-mono">
                  {d.ms}ms
                </code>
                <span className="bg-surface-sunken relative h-6 w-40 shrink-0 overflow-hidden rounded-sm">
                  <span
                    key={`${d.token}-${run}`}
                    className="bg-accent absolute top-1.5 left-1.5 block size-3 rounded-xs"
                    style={{
                      animation: reduced
                        ? undefined
                        : `cp-lab-slide ${d.ms}ms var(--ease-out-soft) both`,
                      transform: reduced ? "translateX(136px)" : undefined,
                    }}
                  />
                </span>
                <span className="text-caption text-ink-secondary">
                  {d.usage}
                </span>
              </li>
            ))}
          </ul>
          <style>{`@keyframes cp-lab-slide { from { transform: translateX(0) } to { transform: translateX(136px) } }`}</style>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.easing.title}>
        <LabStage>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {easings.map((e) => (
              <div key={e.token} className="flex gap-3">
                <EaseCurve curve={e.curve} />
                <div className="min-w-0">
                  <p className="text-body-sm text-ink font-medium">{e.token}</p>
                  <code className="text-mono-sm text-ink-tertiary block font-mono break-all">
                    {e.css}
                  </code>
                  <p className="text-caption text-ink-secondary mt-1 leading-snug">
                    {e.usage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.vocabulary.title} note={t.vocabulary.note}>
        <LabStage>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="bg-surface-sunken flex h-16 items-center justify-center rounded-md">
                <span className="relative flex size-2.5">
                  <span
                    className="bg-success/50 absolute inline-flex size-full rounded-full"
                    style={{
                      animation: reduced
                        ? undefined
                        : "cp-pulse-ring 2.4s var(--ease-out-soft) infinite",
                    }}
                  />
                  <span className="bg-success relative inline-flex size-2.5 rounded-full" />
                </span>
              </div>
              <p className="text-body-sm text-ink mt-2 font-medium">
                cp-pulse-ring
              </p>
              <p className="text-caption text-ink-secondary leading-snug">
                {t.vocabulary.pulseRing}
              </p>
            </div>

            <div>
              <div className="bg-surface-sunken flex h-16 items-center justify-center rounded-md">
                <svg viewBox="0 0 120 24" className="h-6 w-[120px]">
                  <path
                    d="M4 12 H 116"
                    stroke="var(--color-border-strong)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 12 H 116"
                    stroke="var(--color-teal)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="12 12"
                    style={{
                      animation: reduced
                        ? undefined
                        : "cp-trace 1.6s linear infinite",
                    }}
                  />
                </svg>
              </div>
              <p className="text-body-sm text-ink mt-2 font-medium">cp-trace</p>
              <p className="text-caption text-ink-secondary leading-snug">
                {t.vocabulary.trace}
              </p>
            </div>

            <div>
              <div className="bg-surface-sunken flex h-16 items-center justify-center rounded-md">
                <span
                  className="bg-wire-error/15 ring-wire-error flex size-9 items-center justify-center rounded-full ring-2"
                  style={{
                    animation: reduced
                      ? undefined
                      : "cp-attention 1.8s var(--ease-in-out-soft) infinite",
                  }}
                >
                  <span className="bg-wire-error size-2.5 rounded-full" />
                </span>
              </div>
              <p className="text-body-sm text-ink mt-2 font-medium">
                cp-attention
              </p>
              <p className="text-caption text-ink-secondary leading-snug">
                {t.vocabulary.attention}
              </p>
            </div>

            <div>
              <div className="bg-surface-sunken flex h-16 items-center justify-center rounded-md">
                <span className="bg-surface ring-border relative h-2 w-[120px] overflow-hidden rounded-full ring-1 ring-inset">
                  <span
                    className="via-accent absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent to-transparent"
                    style={{
                      animation: reduced
                        ? undefined
                        : "cp-sweep 1.4s var(--ease-in-out-soft) infinite",
                    }}
                  />
                </span>
              </div>
              <p className="text-body-sm text-ink mt-2 font-medium">cp-sweep</p>
              <p className="text-caption text-ink-secondary leading-snug">
                {t.vocabulary.sweep}
              </p>
            </div>
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}
