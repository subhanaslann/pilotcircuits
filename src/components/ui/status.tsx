"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * Batch 2, rebuilt on the language settled in Batch 1:
 *
 *   · colour lives in the glyph, never in the body text
 *   · the surface stays white; tone is carried by a soft disc and a hairline
 *   · shape distinguishes states, so colour is never the only signal
 *   · everything that appears, appears visibly — the agent opens these
 */

export type AlertTone = "info" | "success" | "warning" | "error";

/**
 * The triangle is always the top of the scale.
 *
 * This is the opposite of the usual web convention, and it is deliberate: the
 * product already committed to the triangle meaning "this build has a problem"
 * everywhere it ships — `wireRoles.error.icon`, the callout drawn on the canvas,
 * the step rail's open-finding marker. Leaving `Alert` on the convention meant
 * the same finding drew a triangle in the panel and a circle in the inspection
 * modal, which is precisely what rule 7 exists to prevent. Swapped 2026-08-28,
 * after Batch 2 was approved.
 */
const alertMeta = {
  info: { Icon: Info, disc: "bg-accent" },
  success: { Icon: CircleCheck, disc: "bg-success" },
  warning: { Icon: CircleAlert, disc: "bg-warning" },
  error: { Icon: TriangleAlert, disc: "bg-error" },
} as const;

/**
 * The one element that carries colour in the editorial register: a filled disc
 * with a white glyph. Extracted because it now has three consumers — the alert,
 * the toast and the agent panel's finding row — and a register that lives in
 * three copies is a register that drifts. Composing this is how a new agent
 * message inherits the language instead of re-inventing it.
 */
export function ToneDisc({
  tone,
  size = 24,
  className,
}: {
  tone: AlertTone;
  size?: 20 | 24;
  className?: string;
}) {
  const meta = alertMeta[tone];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "text-ink-inverse grid shrink-0 place-items-center rounded-full",
        size === 24 ? "size-6" : "size-5",
        meta.disc,
        className,
      )}
    >
      <meta.Icon size={size === 24 ? 14 : 12} strokeWidth={2.75} />
    </span>
  );
}

/**
 * The shell every agent utterance is built on: disc, gap, body column, optional
 * dismiss — and no card, no border, no fill, no shadow. The message sits
 * directly on the page.
 *
 * The body is entirely the caller's: `Alert` puts one title and one line in it,
 * the agent panel's finding stacks four blocks. What they share is the thing
 * that must not vary — the register itself.
 */
export function EditorialRow({
  tone,
  role,
  onDismiss,
  className,
  children,
}: {
  tone: AlertTone;
  role?: "status" | "alert";
  onDismiss?: () => void;
  className?: string;
  children: ReactNode;
}) {
  const copy = useCopy();

  return (
    <div
      role={role ?? (tone === "error" ? "alert" : "status")}
      className={cn("motion-expand flex gap-3 py-3", className)}
    >
      <ToneDisc tone={tone} className="mt-0.5" />

      <div className="min-w-0 flex-1">{children}</div>

      {onDismiss ? (
        <IconButton label={copy.a11y.dismiss} size="sm" onClick={onDismiss}>
          <X size={icon.xs} strokeWidth={icon.strokeWidth} />
        </IconButton>
      ) : null}
    </div>
  );
}

/**
 * M-10 · Alert
 *
 * No card, no border, no fill, no shadow — the message sits directly on the
 * page. All the colour is in one filled disc; the title is dark and full size,
 * the body grey beneath it. Stacked alerts are separated by a hairline rather
 * than by four competing containers.
 *
 * This is the product's editorial register: when the agent tells you something,
 * it reads as a sentence in the interface, not as a notification bolted onto
 * it. `You can continue in guided demo mode` is the load-bearing one — it has
 * to land as reassurance, and a warning-shaped box would undo that on its own.
 */
export function Alert({
  tone = "info",
  title,
  action,
  onDismiss,
  className,
  children,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <EditorialRow tone={tone} onDismiss={onDismiss} className={className}>
      {title ? <p className="text-h3 text-ink">{title}</p> : null}
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-2.5",
          title && (children || action) && "mt-1",
        )}
      >
        {children ? (
          <span className="text-body-sm text-ink-secondary min-w-0">
            {children}
          </span>
        ) : null}
        {action}
      </div>
    </EditorialRow>
  );
}

/**
 * Several alerts in a column, separated by hairlines. Without this they would
 * run together; with a container each, they would read as four boxes.
 */
export function AlertStack({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("divide-border divide-y", className)}>{children}</div>
  );
}

/**
 * M-11 · Toast
 *
 * The badge, grown up: white capsule, coloured glyph, dark label. Confirms
 * that something the agent did actually landed. Auto-dismisses, and the same
 * fact always lands in the activity timeline, so a missed toast loses nothing.
 */

export interface ToastMessage {
  id: string;
  tone?: AlertTone;
  message: ReactNode;
}

export function Toast({
  toast,
  onDismiss,
  duration = 4000,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  duration?: number;
}) {
  const copy = useCopy();

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  return (
    <div className="bg-surface shadow-e3 motion-rise flex items-center gap-2.5 rounded-full py-2 pr-2 pl-3">
      <ToneDisc tone={toast.tone ?? "success"} />
      <span className="text-body-sm text-ink pr-1 font-medium">
        {toast.message}
      </span>
      <IconButton
        label={copy.a11y.dismiss}
        size="sm"
        onClick={() => onDismiss(toast.id)}
        className="-my-1 size-7"
      >
        <X size={icon.xs} strokeWidth={icon.strokeWidth} />
      </IconButton>
    </div>
  );
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

/**
 * Minimal toast queue for screens that need one.
 *
 * The counter is a ref, not state: two toasts pushed in the same tick would
 * both read the same value off a state variable and collide on their key. And
 * `dismiss` is stable, because `Toast` holds it in an effect dependency — a new
 * identity every render would restart the auto-dismiss timer forever.
 */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const seq = useRef(0);

  const push = useCallback(
    (message: ReactNode, tone: AlertTone = "success") => {
      seq.current += 1;
      setToasts((current) => [
        ...current,
        { id: `toast-${seq.current}`, message, tone },
      ]);
    },
    [],
  );

  const dismiss = useCallback(
    (id: string) => setToasts((current) => current.filter((t) => t.id !== id)),
    [],
  );

  return { toasts, push, dismiss };
}

/**
 * M-12 · Empty state
 *
 * The mark is a lattice with one dot missing — the product's own way of saying
 * "nothing here yet" instead of a generic outline icon. Says what is absent and
 * what to do about it; never a shrug.
 *
 * The lattice is exported on its own too: the agent panel's empty findings and
 * empty timeline both want it, and it is the same motif as the activity pulse
 * and the canvas grid (design-language.md, rule 8).
 */
export function EmptyLattice({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative block size-8", className)}>
      {[0, 1, 2].map((y) =>
        [0, 1, 2].map((x) => {
          const centre = x === 1 && y === 1;
          return (
            <span
              key={`${x}-${y}`}
              className={cn(
                "absolute size-1.5 rounded-full",
                centre
                  ? "border-border-strong border border-dashed bg-transparent"
                  : "bg-border-strong",
              )}
              style={{ left: `${x * 12}px`, top: `${y * 12}px` }}
            />
          );
        }),
      )}
    </span>
  );
}

export function EmptyState({
  icon: glyph,
  title,
  description,
  action,
  className,
}: {
  /** Overrides the lattice mark. */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-10 text-center",
        className,
      )}
    >
      <span className="text-ink-disabled mb-4">
        {glyph ?? <EmptyLattice />}
      </span>
      <p className="text-body-sm text-ink font-medium">{title}</p>
      {description ? (
        <p className="text-body-sm text-ink-secondary mt-1 max-w-xs">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/**
 * M-16 · Live region
 *
 * Status changes the agent causes — step verified, finding found, test failed —
 * are announced here, so a screen-reader user learns about them at the moment
 * they happen rather than by re-reading the panel.
 */
export function LiveRegion({
  message,
  assertive = false,
}: {
  message: string;
  /** Use for failures only; everything else is polite. */
  assertive?: boolean;
}) {
  return (
    <p
      role="status"
      aria-live={assertive ? "assertive" : "polite"}
      className="sr-only"
    >
      {message}
    </p>
  );
}

/**
 * M-17 · Skeleton
 *
 * The same highlight that passes through a running tool's name, applied to a
 * block. Only for the brief moment a simulated tool call is in flight.
 */
export function Skeleton({
  className,
  lines = 1,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "bg-surface-sunken h-3 rounded-full motion-safe:surface-shimmer",
            index === lines - 1 && lines > 1 ? "w-2/3" : "w-full",
            className,
          )}
        />
      ))}
    </div>
  );
}
