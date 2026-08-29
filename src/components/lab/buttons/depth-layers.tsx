"use client";

import { Check, Eye, RotateCcw } from "lucide-react";
import { LabBlock } from "@/components/lab/lab-primitives";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * Five readings of "a layer sitting slightly below the edge".
 *
 * The capsule is settled; this is only about what happens under it. Each row
 * presses: the ledge thins and the button sinks by the same amount, so the
 * travel feels mechanical rather than decorative.
 */

interface Variant {
  id: string;
  name: string;
  note: string;
  /** Extra classes on the shell. */
  shell?: string;
  /** Per-role style objects, since these are box-shadow compositions. */
  styles: {
    primary: React.CSSProperties;
    secondary: React.CSSProperties;
    tertiary: React.CSSProperties;
    danger: React.CSSProperties;
  };
  pressClass: string;
}

/* Shared tones. */
const BLUE = "#0A66E0";
const BLUE_DEEP = "#0847A6";
const RED = "#C92A30";
const RED_DEEP = "#8F1D22";
const GREY_EDGE = "#C8D1DA";
const WHITE_EDGE = "#D5DDE5";

const SHELL =
  "relative h-11 rounded-full px-5 text-body-sm font-medium inline-flex items-center gap-2 transition-all duration-instant ease-out-soft";

/**
 * L3 stacks a second capsule behind the button. It has to be a *sibling* —
 * a negative-z-index child paints above its own parent's background, which
 * would cover the fill instead of sitting under it.
 */
function Stacked({
  color,
  className,
  style,
  children,
}: {
  color: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <span className="relative inline-flex">
      <span
        aria-hidden="true"
        className="absolute inset-x-[3px] top-[5px] bottom-[-5px] rounded-full"
        style={{ backgroundColor: color }}
      />
      <button type="button" className={className} style={style}>
        {children}
      </button>
    </span>
  );
}

function Row({ variant }: { variant: Variant }) {
  const copy = useCopy();

  const roles = [
    {
      key: "primary" as const,
      plate: BLUE_DEEP,
      text: "text-white",
      content: (
        <>
          <Check size={16} strokeWidth={2.25} />
          {copy.workbench.verify}
        </>
      ),
    },
    {
      key: "secondary" as const,
      plate: WHITE_EDGE,
      text: "text-ink",
      content: (
        <>
          <Eye size={16} strokeWidth={2.25} />
          {copy.workbench.showMe}
        </>
      ),
    },
    {
      key: "tertiary" as const,
      plate: GREY_EDGE,
      text: "text-ink-secondary",
      content: <>{copy.workbench.iFixedIt}</>,
    },
    {
      key: "danger" as const,
      plate: RED_DEEP,
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
    <div className="flex flex-wrap items-center gap-3">
      {roles.map((role) => {
        const className = cn(
          SHELL,
          variant.shell,
          variant.pressClass,
          role.text,
        );
        const style = variant.styles[role.key];

        if (variant.id === "L3") {
          return (
            <Stacked
              key={role.key}
              color={role.plate}
              className={className}
              style={style}
            >
              {role.content}
            </Stacked>
          );
        }

        return (
          <button
            key={role.key}
            type="button"
            className={className}
            style={style}
          >
            {role.content}
          </button>
        );
      })}
    </div>
  );
}

export function DepthLayers() {
  const copy = useCopy();
  const t = copy.lab.atoms.buttonsLab.depth;

  const variants: Variant[] = [
    {
      id: "L1",
      name: t.l1.name,
      note: t.l1.note,
      styles: {
        primary: {
          backgroundColor: BLUE,
          boxShadow: `0 3px 0 -1px ${BLUE_DEEP}, 0 4px 10px -3px rgba(10,102,224,0.45)`,
        },
        secondary: {
          backgroundColor: "#FFFFFF",
          boxShadow: `0 3px 0 -1px ${WHITE_EDGE}, 0 4px 10px -3px rgba(16,24,40,0.14)`,
        },
        tertiary: {
          backgroundColor: "#EEF1F4",
          boxShadow: `0 3px 0 -1px ${GREY_EDGE}`,
        },
        danger: {
          backgroundColor: RED,
          boxShadow: `0 3px 0 -1px ${RED_DEEP}, 0 4px 10px -3px rgba(201,42,48,0.4)`,
        },
      },
      pressClass: "active:translate-y-[3px] active:[box-shadow:none]",
    },
    {
      id: "L2",
      name: t.l2.name,
      note: t.l2.note,
      styles: {
        primary: {
          backgroundColor: BLUE,
          boxShadow:
            "inset 0 -3px 0 rgba(0,0,0,0.22), 0 2px 6px -1px rgba(10,102,224,0.4)",
        },
        secondary: {
          backgroundColor: "#FFFFFF",
          boxShadow:
            "inset 0 -3px 0 rgba(16,24,40,0.09), 0 2px 6px -1px rgba(16,24,40,0.12)",
        },
        tertiary: {
          backgroundColor: "#EEF1F4",
          boxShadow: "inset 0 -3px 0 rgba(16,24,40,0.09)",
        },
        danger: {
          backgroundColor: RED,
          boxShadow:
            "inset 0 -3px 0 rgba(0,0,0,0.22), 0 2px 6px -1px rgba(201,42,48,0.38)",
        },
      },
      pressClass:
        "active:translate-y-px active:[box-shadow:inset_0_2px_4px_rgba(0,0,0,0.18)]",
    },
    {
      id: "L3",
      name: t.l3.name,
      note: t.l3.note,
      shell: "relative",
      styles: {
        primary: { backgroundColor: BLUE },
        secondary: { backgroundColor: "#FFFFFF" },
        tertiary: { backgroundColor: "#EEF1F4" },
        danger: { backgroundColor: RED },
      },
      pressClass: "active:translate-y-[4px]",
    },
    {
      id: "L4",
      name: t.l4.name,
      note: t.l4.note,
      styles: {
        primary: {
          backgroundColor: BLUE,
          boxShadow: `0 0 0 1px ${BLUE_DEEP}, 0 2px 0 0 ${BLUE_DEEP}, 0 4px 8px -3px rgba(10,102,224,0.4)`,
        },
        secondary: {
          backgroundColor: "#FFFFFF",
          boxShadow: `0 0 0 1px #DDE4EB, 0 2px 0 0 ${WHITE_EDGE}, 0 4px 8px -3px rgba(16,24,40,0.12)`,
        },
        tertiary: {
          backgroundColor: "#EEF1F4",
          boxShadow: `0 0 0 1px #DFE5EB, 0 2px 0 0 ${GREY_EDGE}`,
        },
        danger: {
          backgroundColor: RED,
          boxShadow: `0 0 0 1px ${RED_DEEP}, 0 2px 0 0 ${RED_DEEP}, 0 4px 8px -3px rgba(201,42,48,0.38)`,
        },
      },
      pressClass: "active:translate-y-[2px]",
    },
    {
      id: "L5",
      name: t.l5.name,
      note: t.l5.note,
      styles: {
        primary: {
          backgroundColor: BLUE,
          boxShadow:
            "0 2px 0 -0.5px rgba(0,0,0,0.28), 0 6px 14px -4px rgba(10,102,224,0.45)",
        },
        secondary: {
          backgroundColor: "#FFFFFF",
          boxShadow:
            "0 2px 0 -0.5px rgba(16,24,40,0.14), 0 6px 14px -4px rgba(16,24,40,0.14)",
        },
        tertiary: {
          backgroundColor: "#EEF1F4",
          boxShadow: "0 2px 0 -0.5px rgba(16,24,40,0.12)",
        },
        danger: {
          backgroundColor: RED,
          boxShadow:
            "0 2px 0 -0.5px rgba(0,0,0,0.28), 0 6px 14px -4px rgba(201,42,48,0.42)",
        },
      },
      pressClass: "active:translate-y-[2px] active:[box-shadow:none]",
    },
  ];

  return (
    <>
      <LabBlock title={t.today.title} note={t.today.note}>
        <div className="border-border bg-surface shadow-e1 rounded-xl border p-5">
          <div className="bg-app rounded-lg p-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={cn(SHELL, "text-white active:translate-y-px")}
                style={{
                  backgroundColor: BLUE,
                  boxShadow: "0 2px 6px -1px rgba(10,102,224,0.4)",
                }}
              >
                <Check size={16} strokeWidth={2.25} />
                {copy.workbench.verify}
              </button>
              <button
                type="button"
                className={cn(SHELL, "text-ink active:translate-y-px")}
                style={{
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 1px 3px rgba(16,24,40,0.1)",
                }}
              >
                <Eye size={16} strokeWidth={2.25} />
                {copy.workbench.showMe}
              </button>
            </div>
          </div>
        </div>
      </LabBlock>

      {variants.map((variant) => (
        <LabBlock key={variant.id}>
          <div className="border-border bg-surface shadow-e1 rounded-xl border p-5">
            <div className="mb-4">
              <h3 className="text-h3 text-ink flex items-center gap-2">
                <span className="text-mono-sm bg-surface-sunken text-ink-secondary rounded-full px-2 py-0.5 font-mono">
                  {variant.id}
                </span>
                {variant.name}
              </h3>
              <p className="text-body-sm text-ink-secondary mt-1 max-w-prose">
                {variant.note}
              </p>
            </div>
            <div className="bg-app rounded-lg p-6">
              <Row variant={variant} />
            </div>
            <p className="text-caption text-ink-tertiary mt-3">{t.pressHint}</p>
          </div>
        </LabBlock>
      ))}
    </>
  );
}
