"use client";

import { Check, Eye, RotateCcw } from "lucide-react";
import { LabBlock } from "@/components/lab/lab-primitives";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * A filled layer sitting *around* the capsule — a pad the button rests on,
 * offset a few pixels from the fill on every side.
 *
 * Each pad is a sibling element rather than an `outline` or a `box-shadow`
 * spread: the focus ring already owns `outline`, and a spread shadow cannot be
 * asymmetric, which F5 needs.
 */

const BLUE = "#0A66E0";
const BLUE_DEEP = "#0847A6";
const RED = "#C92A30";
const RED_DEEP = "#8F1D22";

const SHELL =
  "relative h-11 rounded-full px-5 text-body-sm font-medium inline-flex items-center gap-2 transition-all duration-instant ease-out-soft active:translate-y-[2px]";

type Role = "primary" | "secondary" | "tertiary" | "danger";

interface Variant {
  id: string;
  name: string;
  note: string;
  /** Padding around the button: [top, sides, bottom]. */
  gap: [number, number, number];
  /** Pad fill per role, or a single fill for every role. */
  pad: Record<Role, string> | string;
  /** Optional hairline on the pad itself. */
  padBorder?: string;
  /** Soft shadow under the pad. */
  padShadow?: string;
  /** Keeps the darker ledge under the fill. */
  ledge?: boolean;
}

function Wrapped({
  variant,
  role,
  fill,
  deep,
  text,
  children,
}: {
  variant: Variant;
  role: Role;
  fill: string;
  deep: string;
  text: string;
  children: React.ReactNode;
}) {
  const [top, side, bottom] = variant.gap;
  const padColor =
    typeof variant.pad === "string" ? variant.pad : variant.pad[role];

  return (
    <span className="relative inline-flex">
      <span
        aria-hidden="true"
        className="absolute rounded-full"
        /* Longhand rather than the `inset` shorthand: React drops the bottom
           edge when a shorthand and a longhand share one style object. */
        style={{
          top: -top,
          left: -side,
          right: -side,
          bottom: -bottom,
          backgroundColor: padColor,
          border: variant.padBorder
            ? `1px solid ${variant.padBorder}`
            : undefined,
          boxShadow: variant.padShadow,
        }}
      />
      <button
        type="button"
        className={cn(SHELL, text)}
        style={{
          backgroundColor: fill,
          boxShadow: variant.ledge
            ? `0 3px 0 -1px ${deep}`
            : role === "primary"
              ? "0 1px 2px rgba(10,102,224,0.28)"
              : role === "danger"
                ? "0 1px 2px rgba(201,42,48,0.28)"
                : "0 1px 2px rgba(16,24,40,0.08)",
        }}
      >
        {children}
      </button>
    </span>
  );
}

function Row({
  variant,
  tight = false,
}: {
  variant: Variant;
  tight?: boolean;
}) {
  const copy = useCopy();

  const roles: {
    role: Role;
    fill: string;
    deep: string;
    text: string;
    content: React.ReactNode;
  }[] = [
    {
      role: "primary",
      fill: BLUE,
      deep: BLUE_DEEP,
      text: "text-white",
      content: (
        <>
          <Check size={16} strokeWidth={2.25} />
          {copy.workbench.verify}
        </>
      ),
    },
    {
      role: "secondary",
      fill: "#FFFFFF",
      deep: "#D5DDE5",
      text: "text-ink",
      content: (
        <>
          <Eye size={16} strokeWidth={2.25} />
          {copy.workbench.showMe}
        </>
      ),
    },
    {
      role: "tertiary",
      fill: "#EEF1F4",
      deep: "#C8D1DA",
      text: "text-ink-secondary",
      content: <>{copy.workbench.iFixedIt}</>,
    },
    {
      role: "danger",
      fill: RED,
      deep: RED_DEEP,
      text: "text-white",
      content: (
        <>
          <RotateCcw size={16} strokeWidth={2.25} />
          {copy.workbench.resetDemo}
        </>
      ),
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center",
        tight ? "gap-x-4 gap-y-6" : "gap-x-8 gap-y-7",
      )}
    >
      {roles.map((r) => (
        <Wrapped
          key={r.role}
          variant={variant}
          role={r.role}
          fill={r.fill}
          deep={r.deep}
          text={r.text}
        >
          {r.content}
        </Wrapped>
      ))}
    </div>
  );
}

export function SurroundingLayers() {
  const copy = useCopy();
  const t = copy.lab.atoms.buttonsLab.surround;

  const variants: Variant[] = [
    {
      id: "F1",
      name: t.f1.name,
      note: t.f1.note,
      gap: [6, 6, 6],
      pad: "#E7ECF1",
    },
    {
      id: "F2",
      name: t.f2.name,
      note: t.f2.note,
      gap: [6, 6, 6],
      pad: {
        primary: "#D6E5FA",
        secondary: "#E4E9EE",
        tertiary: "#E2E7EC",
        danger: "#F6D8D9",
      },
    },
    {
      id: "F3",
      name: t.f3.name,
      note: t.f3.note,
      gap: [7, 7, 7],
      pad: "#FFFFFF",
      padShadow: "0 2px 8px -2px rgba(16,24,40,0.16)",
    },
    {
      id: "F4",
      name: t.f4.name,
      note: t.f4.note,
      gap: [5, 5, 9],
      pad: "#E4EAF0",
    },
    {
      id: "F5",
      name: t.f5.name,
      note: t.f5.note,
      gap: [5, 5, 10],
      pad: "#E4EAF0",
      padBorder: "#D3DBE3",
      ledge: true,
    },
  ];

  return (
    <>
      {variants.map((variant) => (
        <LabBlock key={variant.id}>
          <div className="border-border bg-surface shadow-e1 rounded-xl border p-5">
            <div className="mb-4">
              <h3 className="text-h3 text-ink flex items-center gap-2">
                <span className="text-mono-sm bg-surface-sunken text-ink-secondary rounded-full px-2 py-0.5 font-mono">
                  {variant.id}
                </span>
                {variant.name}
                <span className="text-mono-sm text-ink-tertiary tnum ml-1 font-mono">
                  {variant.gap[0]}/{variant.gap[1]}/{variant.gap[2]}
                </span>
              </h3>
              <p className="text-body-sm text-ink-secondary mt-1 max-w-prose">
                {variant.note}
              </p>
            </div>
            <div className="bg-app rounded-lg px-6 py-9">
              <Row variant={variant} />
            </div>
          </div>
        </LabBlock>
      ))}

      <LabBlock title={t.onWhite.title} note={t.onWhite.note}>
        <div className="border-border bg-surface shadow-e1 rounded-xl border p-5">
          <div className="space-y-7">
            {variants.map((variant) => (
              <div key={variant.id} className="flex items-center gap-5">
                <span className="text-mono-sm text-ink-tertiary w-8 shrink-0 font-mono">
                  {variant.id}
                </span>
                <Wrapped
                  variant={variant}
                  role="primary"
                  fill={BLUE}
                  deep={BLUE_DEEP}
                  text="text-white"
                >
                  <Check size={16} strokeWidth={2.25} />
                  {copy.workbench.verify}
                </Wrapped>
                <Wrapped
                  variant={variant}
                  role="secondary"
                  fill="#FFFFFF"
                  deep="#D5DDE5"
                  text="text-ink"
                >
                  <Eye size={16} strokeWidth={2.25} />
                  {copy.workbench.showMe}
                </Wrapped>
              </div>
            ))}
          </div>
        </div>
      </LabBlock>

      <LabBlock title={t.density.title} note={t.density.note}>
        <div className="border-border bg-surface shadow-e1 rounded-xl border p-5">
          <div className="bg-app rounded-lg px-6 py-9">
            <Row variant={variants[3]} tight />
          </div>
        </div>
      </LabBlock>
    </>
  );
}
