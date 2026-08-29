"use client";

import { useState } from "react";
import { Check, Eye, RotateCcw } from "lucide-react";
import { useCopy } from "@/content/copy-provider";
import type { atoms } from "@/content/locales/lab/atoms";
import { cn } from "@/lib/utils/cn";

/**
 * Eight plump / oval / filled button directions, written as real code so the
 * decision is made on the actual rendered result rather than on a generated
 * picture of one. Whichever direction wins replaces `Button` in
 * `src/components/ui/button.tsx`.
 */

const g = { size: 16, strokeWidth: 2 } as const;

type DirectionCopy = (typeof atoms)["en"]["buttonsLab"]["directions"];

interface Direction {
  id: string;
  name: string;
  note: string;
  /** Shared shape: height, radius, padding, weight. */
  shell: string;
  primary: string;
  secondary: string;
  tertiary: string;
  danger: string;
  quiet: string;
}

/* The styling is the specimen and never changes; only the name and the note
   are language. */
const directions = (t: DirectionCopy): Direction[] => [
  {
    id: "A",
    name: t.a.name,
    note: t.a.note,
    shell:
      "h-11 rounded-full px-5 text-body-sm font-medium inline-flex items-center gap-2 transition-all duration-instant ease-out-soft active:translate-y-px",
    primary:
      "bg-[#1677FF] text-white shadow-[0_2px_6px_-1px_rgba(22,119,255,0.4)] hover:bg-[#0E63E0] hover:shadow-[0_4px_10px_-2px_rgba(22,119,255,0.45)] active:shadow-none",
    secondary:
      "bg-white text-ink shadow-[0_1px_3px_rgba(16,24,40,0.1)] hover:bg-[#F7F9FA] hover:shadow-[0_2px_6px_rgba(16,24,40,0.12)] active:shadow-none",
    tertiary:
      "bg-[#EEF1F4] text-ink-secondary hover:bg-[#E4E9ED] hover:text-ink active:bg-[#DDE3E9]",
    danger:
      "bg-[#E5484D] text-white shadow-[0_2px_6px_-1px_rgba(229,72,77,0.4)] hover:bg-[#CD383D] active:shadow-none",
    quiet:
      "bg-transparent text-ink-tertiary hover:bg-[#EEF1F4] hover:text-ink-secondary",
  },
  {
    id: "B",
    name: t.b.name,
    note: t.b.note,
    shell:
      "h-11 rounded-[16px] px-5 text-body-sm font-medium inline-flex items-center gap-2 transition-all duration-instant ease-out-soft active:translate-y-px",
    primary:
      "bg-[#1677FF] text-white shadow-[0_2px_8px_-2px_rgba(22,119,255,0.45)] hover:bg-[#0E63E0] active:shadow-none",
    secondary:
      "bg-white text-ink shadow-[0_1px_3px_rgba(16,24,40,0.1)] hover:bg-[#F7F9FA] active:shadow-none",
    tertiary:
      "bg-[#EEF1F4] text-ink-secondary hover:bg-[#E4E9ED] hover:text-ink",
    danger:
      "bg-[#E5484D] text-white shadow-[0_2px_8px_-2px_rgba(229,72,77,0.45)] hover:bg-[#CD383D] active:shadow-none",
    quiet: "bg-transparent text-ink-tertiary hover:text-ink-secondary",
  },
  {
    id: "C",
    name: t.c.name,
    note: t.c.note,
    shell:
      "h-11 rounded-full px-5 text-body-sm font-medium inline-flex items-center gap-2 transition-all duration-instant ease-out-soft active:translate-y-px",
    primary:
      "bg-[#0C1B33] text-white shadow-[0_3px_10px_-2px_rgba(12,27,51,0.4)] hover:bg-[#152845] active:shadow-none [&_svg]:text-[#4D9BFF]",
    secondary:
      "bg-white text-[#0C1B33] ring-1 ring-inset ring-[#0C1B33]/15 shadow-[0_1px_3px_rgba(16,24,40,0.08)] hover:ring-[#0C1B33]/30 active:shadow-none",
    tertiary: "bg-[#DDE5EE] text-[#0C1B33] hover:bg-[#CFDAE7]",
    danger:
      "bg-[#D4443F] text-white shadow-[0_3px_10px_-2px_rgba(212,68,63,0.35)] hover:bg-[#BC3A36] active:shadow-none",
    quiet: "bg-transparent text-ink-tertiary hover:text-[#0C1B33]",
  },
  {
    id: "D",
    name: t.d.name,
    note: t.d.note,
    shell:
      "h-11 rounded-full px-5 text-body-sm font-medium inline-flex items-center gap-2 transition-all duration-instant ease-out-soft active:translate-y-px",
    primary:
      "bg-[#1677FF] text-white shadow-[0_2px_8px_-2px_rgba(22,119,255,0.45)] hover:bg-[#0E63E0] active:shadow-none",
    secondary:
      "bg-[#D9E9FF] text-[#0A53BD] hover:bg-[#C7DEFF] active:bg-[#B9D8FF]",
    tertiary:
      "bg-[#EBEEF2] text-ink-secondary hover:bg-[#E1E6EC] hover:text-ink",
    danger:
      "bg-[#FBDDDD] text-[#B4292E] hover:bg-[#F8CBCB] active:bg-[#F4B4B6]",
    quiet: "bg-transparent text-ink-tertiary hover:text-ink-secondary",
  },
  {
    id: "E",
    name: t.e.name,
    note: t.e.note,
    shell:
      "h-11 rounded-[14px] px-5 text-body-sm font-medium inline-flex items-center gap-2 transition-all duration-instant ease-out-soft active:translate-y-px",
    primary:
      "bg-[#111827] text-white shadow-[0_2px_8px_-2px_rgba(17,24,39,0.35)] hover:bg-[#1F2937] active:shadow-none",
    secondary:
      "bg-white text-ink ring-1 ring-inset ring-[#E4E9ED] shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:ring-[#CFD8E0] active:shadow-none",
    tertiary:
      "bg-[#EEF1F4] text-ink-secondary hover:bg-[#E4E9ED] hover:text-ink",
    danger: "bg-[#E5484D] text-white hover:bg-[#CD383D]",
    quiet: "bg-transparent text-ink-tertiary hover:text-ink",
  },
  {
    id: "F",
    name: t.f.name,
    note: t.f.note,
    shell:
      "h-11 rounded-full px-5 text-body-sm font-medium inline-flex items-center gap-2 transition-all duration-instant ease-out-soft border-b-[3px] active:translate-y-[2px] active:border-b-[1px] active:mb-[2px]",
    primary: "bg-[#1677FF] border-[#0A53BD] text-white hover:bg-[#2685FF]",
    secondary: "bg-white border-[#D5DDE5] text-ink hover:bg-[#F7F9FA]",
    tertiary:
      "bg-[#EEF1F4] border-[#D5DDE5] text-ink-secondary hover:bg-[#E7EBEF] hover:text-ink",
    danger: "bg-[#E5484D] border-[#B4292E] text-white hover:bg-[#EC585D]",
    quiet:
      "bg-transparent border-transparent text-ink-tertiary hover:text-ink-secondary",
  },
  {
    id: "G",
    name: t.g.name,
    note: t.g.note,
    shell:
      "h-11 rounded-xl px-5 text-body-sm font-semibold inline-flex items-center gap-2 transition-all duration-instant ease-out-soft active:translate-y-px",
    primary:
      "bg-[#2B2E96] text-white shadow-[0_1px_1px_rgba(0,0,0,0.08),0_2px_5px_rgba(43,46,150,0.3)] hover:bg-[#22246F] active:shadow-none",
    secondary:
      "bg-white text-[#1F2547] shadow-[0_1px_1px_rgba(0,0,0,0.06),0_2px_4px_rgba(16,24,40,0.06)] hover:bg-[#F7F9FA] active:shadow-none",
    tertiary: "bg-[#DFE3EC] text-[#1F2547] hover:bg-[#D3D9E5]",
    danger:
      "bg-[#B33A34] text-white shadow-[0_2px_5px_rgba(179,58,52,0.3)] hover:bg-[#9A312C] active:shadow-none",
    quiet: "bg-transparent text-ink-tertiary hover:text-[#1F2547]",
  },
  {
    id: "H",
    name: t.h.name,
    note: t.h.note,
    shell:
      "h-11 rounded-full px-5 text-body-sm font-medium inline-flex items-center gap-2 transition-all duration-instant ease-out-soft active:translate-y-px",
    primary:
      "bg-[#1F5FBF] text-white shadow-[0_3px_10px_-3px_rgba(31,95,191,0.5)] hover:bg-[#1A5099] active:shadow-none",
    secondary:
      "bg-[#FAF7F2] text-[#2B2A27] shadow-[0_1px_3px_rgba(60,50,40,0.1)] hover:bg-[#F4F0E9] active:shadow-none",
    tertiary:
      "bg-[#EAE6DE] text-[#57534B] hover:bg-[#E0DBD1] hover:text-[#2B2A27]",
    danger:
      "bg-[#B0483C] text-white shadow-[0_3px_10px_-3px_rgba(176,72,60,0.45)] hover:bg-[#973D33] active:shadow-none",
    quiet: "bg-transparent text-[#8A8377] hover:text-[#2B2A27]",
  },
];

function Row({ direction }: { direction: Direction }) {
  const copy = useCopy();

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button type="button" className={cn(direction.shell, direction.primary)}>
        <Check {...g} />
        {copy.workbench.verify}
      </button>
      <button
        type="button"
        className={cn(direction.shell, direction.secondary)}
      >
        <Eye {...g} />
        {copy.workbench.showMe}
      </button>
      <button type="button" className={cn(direction.shell, direction.tertiary)}>
        {copy.workbench.iFixedIt}
      </button>
      <button type="button" className={cn(direction.shell, direction.danger)}>
        <RotateCcw {...g} />
        {copy.workbench.resetDemo}
      </button>
      <button type="button" className={cn(direction.shell, direction.quiet)}>
        {copy.library.clear}
      </button>
    </div>
  );
}

function Card({
  direction,
  picked,
  onPick,
}: {
  direction: Direction;
  picked: boolean;
  onPick: () => void;
}) {
  const t = useCopy().lab.atoms.buttonsLab.directions;

  return (
    <section
      className={cn(
        "rounded-xl border p-5 transition-colors",
        picked
          ? "border-accent bg-accent-soft/40 ring-accent/20 ring-2"
          : "border-border bg-surface",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-h3 text-ink flex items-center gap-2">
            <span className="text-mono-sm bg-surface-sunken text-ink-secondary rounded-xs px-1.5 py-0.5 font-mono">
              {direction.id}
            </span>
            {direction.name}
          </h2>
          <p className="text-body-sm text-ink-secondary mt-1 max-w-prose">
            {direction.note}
          </p>
        </div>
        <button
          type="button"
          onClick={onPick}
          className={cn(
            "text-caption h-8 shrink-0 rounded-md px-3 font-medium transition-colors",
            picked
              ? "bg-accent text-white"
              : "border-border text-ink-secondary hover:bg-surface-hover border",
          )}
        >
          {picked ? t.shortlisted : t.shortlist}
        </button>
      </div>

      <div className="bg-app rounded-lg p-5">
        <Row direction={direction} />
      </div>
    </section>
  );
}

export function ButtonDirections() {
  const t = useCopy().lab.atoms.buttonsLab.directions;
  const [picked, setPicked] = useState<string[]>(["A"]);

  const toggle = (id: string) =>
    setPicked((current) =>
      current.includes(id) ? current.filter((p) => p !== id) : [...current, id],
    );

  return (
    <div className="space-y-4">
      {picked.length ? (
        <p
          className="text-body-sm text-ink bg-accent-soft border-accent-border rounded-md border px-3 py-2"
          role="status"
        >
          {t.shortlistedPrefix}{" "}
          <strong className="font-semibold">{picked.join(", ")}</strong>
        </p>
      ) : null}

      {directions(t).map((direction) => (
        <Card
          key={direction.id}
          direction={direction}
          picked={picked.includes(direction.id)}
          onPick={() => toggle(direction.id)}
        />
      ))}
    </div>
  );
}
