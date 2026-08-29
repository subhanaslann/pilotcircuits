"use client";

import { Check, Eye, RotateCcw } from "lucide-react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * White-on-fill contrast options for the capsule button.
 *
 * The shipped `#1677FF` fill measures 4.10:1 against white text and `#E5484D`
 * measures 3.91:1 — both below the 4.5:1 that 13px text needs. These are the
 * three ways out, rendered side by side so the decision is made on the result.
 */

interface Option {
  id: string;
  name: string;
  blurb: string;
  blue: string;
  blueHover: string;
  red: string;
  ratios: { blue: string; red: string };
  keeps: string;
  costs: string;
}

function Row({ option }: { option: Option }) {
  const copy = useCopy();
  const shell =
    "h-11 rounded-full px-5 text-body-sm font-medium inline-flex items-center gap-2 transition-all duration-instant ease-out-soft active:translate-y-px";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        className={cn(shell, "text-white")}
        style={{
          backgroundColor: option.blue,
          boxShadow: `0 2px 6px -1px ${option.blue}66`,
        }}
      >
        <Check
          size={16}
          strokeWidth={2}
          style={{ color: option.id === "3" ? "#4D9BFF" : "white" }}
        />
        {copy.workbench.verify}
      </button>
      <button
        type="button"
        className={cn(shell, "bg-surface text-ink shadow-btn-surface")}
      >
        <Eye size={16} strokeWidth={2} />
        {copy.workbench.showMe}
      </button>
      <button
        type="button"
        className={cn(shell, "bg-surface-sunken text-ink-secondary")}
      >
        {copy.workbench.iFixedIt}
      </button>
      <button
        type="button"
        className={cn(shell, "text-white")}
        style={{
          backgroundColor: option.red,
          boxShadow: `0 2px 6px -1px ${option.red}5c`,
        }}
      >
        <RotateCcw size={16} strokeWidth={2} />
        {copy.workbench.resetDemo}
      </button>
    </div>
  );
}

export function ContrastOptions() {
  const copy = useCopy();
  const t = copy.lab.atoms.buttonsLab.contrast;

  const options: Option[] = [
    {
      id: "1",
      name: t.o1.name,
      blurb: t.o1.blurb,
      blue: "#0A66E0",
      blueHover: "#0A57C9",
      red: "#C92A30",
      ratios: { blue: "5.26:1", red: "5.44:1" },
      keeps: t.o1.keeps,
      costs: t.o1.costs,
    },
    {
      id: "2",
      name: t.o2.name,
      blurb: t.o2.blurb,
      blue: "#0F6FF0",
      blueHover: "#0A66E0",
      red: "#D33439",
      ratios: { blue: "4.61:1", red: "4.86:1" },
      keeps: t.o2.keeps,
      costs: t.o2.costs,
    },
    {
      id: "3",
      name: t.o3.name,
      blurb: t.o3.blurb,
      blue: "#0C1B33",
      blueHover: "#152845",
      red: "#B4292E",
      ratios: { blue: "16.1:1", red: "6.37:1" },
      keeps: t.o3.keeps,
      costs: t.o3.costs,
    },
  ];

  return (
    <>
      <LabBlock title={t.problem.title}>
        <LabStage>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="text-body-sm inline-flex h-11 items-center gap-2 rounded-full bg-[#1677FF] px-5 font-medium text-white"
            >
              <Check size={16} strokeWidth={2} />
              {copy.workbench.verify}
            </button>
            <button
              type="button"
              className="text-body-sm inline-flex h-11 items-center gap-2 rounded-full bg-[#E5484D] px-5 font-medium text-white"
            >
              <RotateCcw size={16} strokeWidth={2} />
              {copy.workbench.resetDemo}
            </button>
            <div className="text-body-sm text-ink-secondary">
              <p>
                {t.problem.whiteOnBefore}{" "}
                <code className="text-mono-sm font-mono">#1677FF</code>{" "}
                {t.problem.whiteOnAfter}{" "}
                <strong className="text-error tnum">4.10:1</strong>
              </p>
              <p>
                {t.problem.whiteOnBefore}{" "}
                <code className="text-mono-sm font-mono">#E5484D</code>{" "}
                {t.problem.whiteOnAfter}{" "}
                <strong className="text-error tnum">3.91:1</strong>
              </p>
              <p className="text-caption text-ink-tertiary mt-1">
                {t.problem.floor}
              </p>
            </div>
          </div>
        </LabStage>
      </LabBlock>

      {options.map((option) => (
        <LabBlock key={option.id}>
          <div className="border-border bg-surface shadow-e1 rounded-xl border p-5">
            <div className="mb-4">
              <h3 className="text-h3 text-ink flex items-center gap-2">
                <span className="text-mono-sm bg-surface-sunken text-ink-secondary rounded-full px-2 py-0.5 font-mono">
                  {option.id}
                </span>
                {option.name}
                <span className="text-mono-sm text-success tnum ml-1 font-mono">
                  {option.ratios.blue} · {option.ratios.red}
                </span>
              </h3>
              <p className="text-body-sm text-ink-secondary mt-1 max-w-prose">
                {option.blurb}
              </p>
            </div>

            <div className="bg-app rounded-lg p-5">
              <Row option={option} />
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="text-caption text-success shrink-0 font-medium">
                  {t.keeps}
                </dt>
                <dd className="text-caption text-ink-secondary">
                  {option.keeps}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-caption text-warning-hover shrink-0 font-medium">
                  {t.costs}
                </dt>
                <dd className="text-caption text-ink-secondary">
                  {option.costs}
                </dd>
              </div>
            </dl>
          </div>
        </LabBlock>
      ))}
    </>
  );
}
