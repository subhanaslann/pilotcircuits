"use client";

import {
  Activity,
  ArrowLeft,
  Check,
  ChevronDown,
  CircleAlert,
  CircuitBoard,
  Cpu,
  Crosshair,
  Eye,
  Gauge,
  Layers,
  Lightbulb,
  ListChecks,
  Maximize,
  Play,
  Plug,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  TriangleAlert,
  Wrench,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { useCopy } from "@/content/copy-provider";
import type { foundations } from "@/content/locales/lab/foundations";
import { icon } from "@/lib/design/tokens";

type IconCopy = (typeof foundations)["en"]["icons"];

const buildSizes = (t: IconCopy["sizes"]) => [
  { token: "xs", px: icon.xs, usage: t.xs },
  { token: "sm", px: icon.sm, usage: t.sm },
  { token: "md", px: icon.md, usage: t.md },
  { token: "lg", px: icon.lg, usage: t.lg },
];

/* Icon names are the Lucide exports, not words — they stay as they are in
   every locale, because that is what you type to get the glyph. */
const buildSets = (t: IconCopy["set"]) => [
  {
    title: t.navigation,
    icons: [
      { Icon: ArrowLeft, name: "ArrowLeft" },
      { Icon: Search, name: "Search" },
      { Icon: SlidersHorizontal, name: "SlidersHorizontal" },
      { Icon: ChevronDown, name: "ChevronDown" },
      { Icon: Settings2, name: "Settings2" },
      { Icon: RotateCcw, name: "RotateCcw" },
    ],
  },
  {
    title: t.status,
    icons: [
      { Icon: Check, name: "Check" },
      { Icon: TriangleAlert, name: "TriangleAlert" },
      { Icon: CircleAlert, name: "CircleAlert" },
      { Icon: Activity, name: "Activity" },
      { Icon: Play, name: "Play" },
    ],
  },
  {
    title: t.canvas,
    icons: [
      { Icon: ZoomIn, name: "ZoomIn" },
      { Icon: ZoomOut, name: "ZoomOut" },
      { Icon: Maximize, name: "Maximize" },
      { Icon: Layers, name: "Layers" },
      { Icon: Crosshair, name: "Crosshair" },
      { Icon: Eye, name: "Eye" },
    ],
  },
  {
    title: t.build,
    icons: [
      { Icon: CircuitBoard, name: "CircuitBoard" },
      { Icon: Cpu, name: "Cpu" },
      { Icon: Gauge, name: "Gauge" },
      { Icon: Lightbulb, name: "Lightbulb" },
      { Icon: Plug, name: "Plug" },
      { Icon: Wrench, name: "Wrench" },
      { Icon: ListChecks, name: "ListChecks" },
      { Icon: Terminal, name: "Terminal" },
      { Icon: Sparkles, name: "Sparkles" },
    ],
  },
];

export function IconSystem() {
  const copy = useCopy();
  const t: IconCopy = copy.lab.foundations.icons;
  const sizes = buildSizes(t.sizes);
  const sets = buildSets(t.set);

  return (
    <>
      <LabBlock title={t.stroke.title} note={t.stroke.note}>
        <LabStage>
          <div className="flex flex-wrap items-end gap-8">
            <div className="text-center">
              <div className="text-ink flex gap-3">
                <CircuitBoard size={24} strokeWidth={2} aria-hidden="true" />
                <Gauge size={24} strokeWidth={2} aria-hidden="true" />
                <TriangleAlert size={24} strokeWidth={2} aria-hidden="true" />
              </div>
              <p className="text-caption text-ink-tertiary mt-2">
                2.0 — {t.stroke.heavy}
              </p>
            </div>
            <div className="text-center">
              <div className="text-ink flex gap-3">
                <CircuitBoard size={24} strokeWidth={1.75} aria-hidden="true" />
                <Gauge size={24} strokeWidth={1.75} aria-hidden="true" />
                <TriangleAlert
                  size={24}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <p className="text-accent text-caption mt-2 font-medium">
                1.75 — {t.stroke.standard}
              </p>
            </div>
            <div className="text-center">
              <div className="text-ink flex gap-3">
                <CircuitBoard size={24} strokeWidth={1.5} aria-hidden="true" />
                <Gauge size={24} strokeWidth={1.5} aria-hidden="true" />
                <TriangleAlert size={24} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <p className="text-caption text-ink-tertiary mt-2">
                1.5 — {t.stroke.faint}
              </p>
            </div>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.sizes.title} note={t.sizes.note}>
        <LabStage>
          <div className="flex flex-wrap gap-8">
            {sizes.map((s) => (
              <div key={s.token}>
                <div className="text-ink flex h-8 items-center gap-2">
                  <Gauge
                    size={s.px}
                    strokeWidth={icon.strokeWidth}
                    aria-hidden="true"
                  />
                  <span className="text-body-sm">{t.sizes.sample}</span>
                </div>
                <p className="text-body-sm text-ink mt-1 font-medium">
                  {s.token}
                  <span className="text-mono-sm text-ink-tertiary tnum ml-1.5 font-mono">
                    {s.px}px
                  </span>
                </p>
                <p className="text-caption text-ink-secondary leading-snug">
                  {s.usage}
                </p>
              </div>
            ))}
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.set.title} note={t.set.note}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sets.map((set) => (
            <LabStage key={set.title}>
              <p className="text-overline text-ink-tertiary mb-3 uppercase">
                {set.title}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {set.icons.map(({ Icon, name }) => (
                  <div key={name} className="w-[104px]">
                    <Icon
                      size={icon.md}
                      strokeWidth={icon.strokeWidth}
                      className="text-ink"
                      aria-hidden="true"
                    />
                    <p className="text-mono-sm text-ink-tertiary mt-1.5 font-mono">
                      {name}
                    </p>
                  </div>
                ))}
              </div>
            </LabStage>
          ))}
        </div>
      </LabBlock>
    </>
  );
}
