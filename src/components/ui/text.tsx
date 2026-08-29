import { Fragment, type AnchorHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { icon, type MonoTone } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * A-07 · Mono value
 *
 * Anything the board reports or the sketch defines: `D7`, `5V`, `18 cm`, `94%`.
 * Recognisable mid-sentence without bold or colour, and tabular so a live
 * distance readout does not shift its neighbours as digits change.
 */

export type { MonoTone };

const monoTones: Record<MonoTone, string> = {
  default: "bg-surface-sunken text-ink",
  accent: "bg-accent-soft text-accent",
  error: "bg-error-soft text-error",
  target: "bg-teal-soft text-teal-hover",
  quiet: "bg-transparent text-ink-tertiary px-0",
};

export function MonoValue({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: MonoTone;
  className?: string;
}) {
  return (
    <code
      className={cn(
        "text-mono-sm tnum rounded-xs px-1 py-0.5 font-mono",
        monoTones[tone],
        className,
      )}
    >
      {children}
    </code>
  );
}

/**
 * The agent's sentences carry hardware values inside them — `Echo is connected
 * to D6. This build expects D7.` Rule 13 says those render in mono; the copy
 * rule says the English lives in `copy.ts` as one string. Both hold if the
 * sentence stays a string and the values are marked here, at render.
 *
 * The alternative — composing the sentence from JSX fragments at the call site —
 * writes `D6` twice: once in the sentence, once in the markup. They then drift.
 */
export function Sentence({
  text,
  mono,
  className,
}: {
  text: string;
  /** Values appearing in `text`, each mapped to the tone it should carry. */
  mono?: Record<string, MonoTone>;
  className?: string;
}) {
  const entries = Object.entries(mono ?? {}).filter(([value]) => value.length);

  if (!entries.length) return <span className={className}>{text}</span>;

  /* Longest first, so `D10` is not swallowed by `D1`. */
  const ordered = [...entries].sort((a, b) => b[0].length - a[0].length);
  const tones = new Map(ordered);
  const pattern = new RegExp(
    `(${ordered.map(([value]) => escapeForSplit(value)).join("|")})`,
    "g",
  );

  return (
    <span className={className}>
      {text.split(pattern).map((part, index) =>
        tones.has(part) ? (
          <MonoValue key={index} tone={tones.get(part)}>
            {part}
          </MonoValue>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </span>
  );
}

const RESERVED = new Set("\^$.|?*+()[]{}".split(""));

/** Values are pin names and readings, but never trust them to be regex-safe. */
function escapeForSplit(value: string) {
  return value
    .split("")
    .map((char) => (RESERVED.has(char) ? "\\" + char : char))
    .join("");
}

/**
 * A-06 · Metadata line
 *
 * `35 min · Beginner · 7 steps`. Separators are inserted by the component so
 * every card, list row and detail header punctuates identically.
 *
 * The separator trails its item rather than leading the next one. In a 360px
 * column these lines wrap, and a line that opens with a lone `·` reads as a
 * broken list; one that closes with it reads as a sentence continuing.
 */
export function MetadataLine({
  items,
  className,
}: {
  items: ReactNode[];
  className?: string;
}) {
  const shown = items.filter(Boolean);
  return (
    <p
      className={cn(
        "text-caption text-ink-tertiary flex flex-wrap items-center gap-x-1.5 gap-y-0.5",
        className,
      )}
    >
      {shown.map((item, index) => (
        <span key={index} className="inline-flex items-center gap-1.5">
          {item}
          {index < shown.length - 1 ? (
            <span aria-hidden="true" className="text-ink-disabled">
              ·
            </span>
          ) : null}
        </span>
      ))}
    </p>
  );
}

/**
 * A-20 · Link
 *
 * `inline` sits inside a sentence; `standalone` is a small action that is not
 * important enough to be a button — "Why D7?", "View project".
 */

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: "inline" | "standalone";
  /** Marks the destination as leaving the app. */
  external?: boolean;
  children: ReactNode;
}

export function TextLink({
  href,
  variant = "inline",
  external = false,
  className,
  children,
  ...props
}: TextLinkProps) {
  const cls = cn(
    "text-accent rounded-xs font-medium transition-colors duration-instant",
    variant === "inline"
      ? "underline underline-offset-2 hover:text-accent-hover"
      : "text-body-sm inline-flex items-center gap-1 underline-offset-4 hover:underline",
    className,
  );

  const content = (
    <>
      {children}
      {external ? (
        <ArrowUpRight
          size={icon.xs}
          strokeWidth={icon.strokeWidth}
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cls}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={cls} {...props}>
      {content}
    </Link>
  );
}

/**
 * A-19 · Divider
 */
export function Divider({
  orientation = "horizontal",
  label,
  className,
}: {
  orientation?: "horizontal" | "vertical";
  /** Renders a centred caption inside the rule. */
  label?: string;
  className?: string;
}) {
  if (orientation === "vertical") {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={cn("bg-border w-px shrink-0 self-stretch", className)}
      />
    );
  }

  if (label) {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <span className="bg-border h-px flex-1" />
        <span className="text-overline text-ink-tertiary uppercase">
          {label}
        </span>
        <span className="bg-border h-px flex-1" />
      </div>
    );
  }

  return <hr className={cn("border-border border-t-0 border-b", className)} />;
}
