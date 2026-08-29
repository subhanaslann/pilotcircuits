"use client";

import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { useCopy } from "@/content/copy-provider";
import type { Copy } from "@/content/i18n";
import type { foundations } from "@/content/locales/lab/foundations";

type TypeCopy = (typeof foundations)["en"]["typography"];

interface Scale {
  cls: string;
  name: string;
  spec: string;
  usage: string;
  sample: string;
  mono?: boolean;
}

const sansScales = (copy: Copy, t: TypeCopy): Scale[] => [
  {
    cls: "text-display",
    name: "display",
    spec: "30 / 36 · -0.021em · 600",
    usage: t.usage.display,
    sample: copy.complete.title,
  },
  {
    cls: "text-h1",
    name: "h1",
    spec: "24 / 30 · -0.017em · 600",
    usage: t.usage.h1,
    sample: copy.dashboard.heading,
  },
  {
    cls: "text-h2",
    name: "h2",
    spec: "19 / 26 · -0.012em · 600",
    usage: t.usage.h2,
    sample: copy.build.project,
  },
  {
    cls: "text-h3",
    name: "h3",
    spec: "15 / 22 · -0.006em · 600",
    usage: t.usage.h3,
    sample: copy.findings.connectionMismatch,
  },
  {
    cls: "text-body-lg",
    name: "body-lg",
    spec: "16 / 24",
    usage: t.usage.bodyLg,
    sample: copy.dashboard.sub,
  },
  {
    cls: "text-body",
    name: "body",
    spec: "14 / 21",
    usage: t.usage.body,
    sample: copy.build.steps.sensor.rationale,
  },
  {
    cls: "text-body-sm",
    name: "body-sm",
    spec: "13 / 19",
    usage: t.usage.bodySm,
    sample: copy.agentPanel.activity.inspecting(3),
  },
  {
    cls: "text-caption",
    name: "caption",
    spec: "12 / 16 · 500",
    usage: t.usage.caption,
    sample: `${copy.findings.evidence.camera} · ${copy.findings.confidence(
      copy.findings.confidenceValue(94),
    )}`,
  },
  {
    cls: "text-overline uppercase",
    name: "overline",
    spec: "11 / 14 · +0.06em · 600 · uppercase",
    usage: t.usage.overline,
    sample: copy.workbench.componentsInStep,
  },
];

/* The mono samples are verbatim machine output — a serial line, a tool call,
   a pin reference. Rule 13: whatever the board or the sketch says, it says in
   its own words, in every locale. */
const monoScales = (t: TypeCopy): Scale[] => [
  {
    cls: "text-mono-lg",
    name: "mono-lg",
    spec: "15 / 22",
    usage: t.usage.monoLg,
    sample: "Distance: 18 cm",
    mono: true,
  },
  {
    cls: "text-mono",
    name: "mono",
    spec: "13 / 18",
    usage: t.usage.mono,
    sample: "verify_current_step → passed in 240 ms",
    mono: true,
  },
  {
    cls: "text-mono-sm",
    name: "mono-sm",
    spec: "11 / 15 · +0.02em",
    usage: t.usage.monoSm,
    sample: "D6 → D7 · 5V · GND",
    mono: true,
  },
];

function Specimen({ scale }: { scale: Scale }) {
  return (
    <div className="border-border/70 grid grid-cols-[132px_1fr] gap-4 border-b py-4 last:border-0 last:pb-0 first:pt-0">
      <div>
        <p className="text-body-sm text-ink font-medium">{scale.name}</p>
        <p className="text-mono-sm text-ink-tertiary tnum font-mono">
          {scale.spec}
        </p>
        <p className="text-caption text-ink-tertiary mt-1.5 leading-snug">
          {scale.usage}
        </p>
      </div>
      <p
        className={`${scale.cls} ${scale.mono ? "font-mono tnum" : ""} text-ink self-center`}
      >
        {scale.sample}
      </p>
    </div>
  );
}

export function Typography() {
  const copy = useCopy();
  const t: TypeCopy = copy.lab.foundations.typography;
  const sans = sansScales(copy, t);
  const mono = monoScales(t);

  return (
    <>
      <LabBlock title={t.sans.title} note={t.sans.note}>
        <LabStage>
          {sans.map((scale) => (
            <Specimen key={scale.name} scale={scale} />
          ))}
        </LabStage>
      </LabBlock>

      <LabBlock title={t.mono.title} note={t.mono.note}>
        <LabStage>
          {mono.map((scale) => (
            <Specimen key={scale.name} scale={scale} />
          ))}
        </LabStage>
      </LabBlock>

      <LabBlock title={t.mixed.title} note={t.mixed.note}>
        <LabStage className="max-w-prose">
          <h3 className="text-h3 text-ink">{copy.build.steps.sensor.name}</h3>
          <p className="text-body text-ink mt-1.5">
            {t.mixed.instructionBefore}
            <code className="text-mono-sm bg-surface-sunken text-ink rounded-xs px-1 py-0.5 font-mono">
              D7
            </code>
            {t.mixed.instructionAfter}
          </p>
          <p className="text-caption text-ink-secondary mt-2">
            {copy.findings.evidence.camera} ·{" "}
            {copy.findings.confidence(copy.findings.confidenceValue(94))}
          </p>
        </LabStage>
      </LabBlock>
    </>
  );
}
