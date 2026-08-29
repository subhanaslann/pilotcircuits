import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { icon } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * A-01 · Button — direction A, "Full capsule".
 *
 * Every role is a filled capsule: nothing in the product is a hollow outline.
 * Hierarchy comes from fill weight, not from shape — saturated blue for the
 * one action the agent is proposing, white for the recoverable alternative,
 * grey for acknowledgement, red for irreversible, transparent for dismissal.
 *
 * Every button rests on a plate: a 6px pad drawn as a shadow spread, with its
 * own soft shadow further out. Two levels of elevation — the plate floats
 * above the page, the button sits on the plate. Because the plate is painted
 * rather than laid out, button groups need at least 16px of gap.
 *
 * Fill-tinted shadows sit on top of that, so a primary reads as lifted without
 * a gradient or a glow. On press the plate stays and the lift goes.
 */

export type ButtonVariant =
  "primary" | "secondary" | "tertiary" | "danger" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "whitespace-nowrap select-none transition-all duration-instant ease-out-soft " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-45 " +
  "aria-disabled:pointer-events-none aria-disabled:opacity-45";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-ink-inverse shadow-btn-accent hover:bg-accent-hover " +
    "hover:shadow-btn-accent-lift active:bg-accent-active active:shadow-btn-flat",
  secondary:
    "bg-surface text-ink shadow-btn-surface hover:bg-surface-hover " +
    "hover:shadow-btn-surface-lift active:bg-surface-active active:shadow-btn-flat",
  tertiary:
    "bg-surface-sunken text-ink-secondary shadow-btn-flat " +
    "hover:bg-surface-active hover:text-ink active:bg-border",
  danger:
    "bg-error text-ink-inverse shadow-btn-error hover:bg-error-hover " +
    "active:shadow-btn-flat",
  /* Quiet is a dismissal, not an object — no plate, nothing to rest on. */
  quiet:
    "bg-transparent text-ink-tertiary hover:bg-surface-sunken hover:text-ink-secondary " +
    "active:bg-surface-active",
};

/** All three clear the 40px minimum target; md is the product default. */
const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-body-sm",
  md: "h-11 px-5 text-body-sm",
  lg: "h-12 px-6 text-body",
};

const iconOnlySizes: Record<ButtonSize, string> = {
  sm: "size-10 px-0",
  md: "size-11 px-0",
  lg: "size-12 px-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders before the label. Pass a Lucide element sized to `icon.sm`. */
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** Swaps the leading icon for a spinner and blocks interaction. */
  loading?: boolean;
  /** Stretches to the container — used by panel footers. */
  block?: boolean;
  /** Square control with no label; the glyph is the only child. */
  iconOnly?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  iconLeft,
  iconRight,
  loading = false,
  block = false,
  iconOnly = false,
  className,
  children,
  disabled,
  onClick,
  type = "button",
  ...props
}: ButtonProps) {
  const square = iconOnly || !children;

  /**
   * `loading` deliberately does **not** set the `disabled` attribute.
   *
   * A button the browser disables loses focus the moment it is disabled, and in
   * this product the thing that makes a button busy is the agent starting work.
   * The panel's suggested action goes busy on every single tool call, so a
   * keyboard user standing on it was thrown back to the top of the document
   * each time — repeatedly, for the duration of a build. `aria-disabled` tells
   * assistive technology the same thing and keeps the focus where the person
   * left it; the click is dropped here instead. Noted in Batch 7.
   *
   * A genuinely unavailable action still uses `disabled`, because that one
   * *should* leave the tab order.
   */
  const inert = disabled || loading;

  return (
    <button
      type={type}
      disabled={disabled}
      aria-disabled={inert || undefined}
      aria-busy={loading || undefined}
      onClick={inert ? undefined : onClick}
      className={cn(
        base,
        variants[variant],
        square ? iconOnlySizes[size] : sizes[size],
        block && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2
          size={icon.sm}
          strokeWidth={icon.strokeWidth}
          className="motion-safe:animate-spin"
          aria-hidden="true"
        />
      ) : (
        iconLeft
      )}
      {children}
      {!loading && iconRight}
    </button>
  );
}

/**
 * A-02 · Icon button
 *
 * Same capsule, square footprint. The label moves into `aria-label`, which is
 * required rather than optional.
 */
export interface IconButtonProps extends Omit<ButtonProps, "children"> {
  /** Announced to assistive tech and used as the tooltip text. */
  label: string;
  children: ReactNode;
}

export function IconButton({
  label,
  children,
  variant = "quiet",
  size = "md",
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button
      aria-label={label}
      title={label}
      variant={variant}
      size={size}
      iconOnly
      className={cn("shrink-0", className)}
      {...props}
    >
      {children}
    </Button>
  );
}

/**
 * Batch 8 · A-01, as a destination.
 *
 * The dashboard's two calls to action go somewhere rather than do something,
 * and the difference matters to more than semantics: a `<button>` with an
 * `onClick` that pushes a route cannot be opened in a new tab, cannot be
 * copied, and reads to a screen reader as an action with no target. So the
 * capsule is applied to a real link.
 *
 * Same recipe, deliberately — a second set of button styles is how two buttons
 * on one screen end up a pixel apart. What it drops is everything a link cannot
 * honestly have: `loading`, `disabled`, `type`. A destination that is not
 * available yet is not a faded link, it is a link that is not there.
 */
export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  iconLeft,
  iconRight,
  block = false,
  className,
  children,
  ...props
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<React.ComponentPropsWithoutRef<typeof Link>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...props}
    >
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}
