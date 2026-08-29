"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { icon } from "@/lib/design/tokens";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Traps Tab inside `ref`, restores focus to the opener on close. */
function useFocusTrap(
  active: boolean,
  ref: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) return;

    const opener = document.activeElement as HTMLElement | null;
    const node = ref.current;
    if (!node) return;

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
  }, [active, ref]);
}

/** Closes on Escape at the document level. */
function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, onClose]);
}

const noopSubscribe = () => () => {};

/** Portals into document.body once hydrated; renders nothing on the server. */
function Portal({ children }: { children: ReactNode }) {
  const isServer = useSyncExternalStore(
    noopSubscribe,
    () => false,
    () => true,
  );
  if (isServer) return null;
  return createPortal(children, document.body);
}

/**
 * M-07 · Modal shell
 *
 * Used by the build inspection view, which is wide enough to sit two panes
 * side by side. Escape closes, focus is trapped, the page behind stops
 * scrolling, and the backdrop is a scrim rather than a blur.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** `wide` is the inspection layout. */
  size?: "md" | "lg" | "wide";
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const copy = useCopy();
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEscape(open, onClose);
  useFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const widths = {
    md: "max-w-lg",
    lg: "max-w-2xl",
    wide: "max-w-[1100px]",
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          aria-label={copy.a11y.close}
          tabIndex={-1}
          onClick={onClose}
          className="motion-fade absolute inset-0 cursor-default bg-[#0B1220]/40"
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          aria-describedby={description ? `${id}-desc` : undefined}
          className={cn(
            "bg-surface shadow-e3 motion-rise relative flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-xl",
            widths[size],
            className,
          )}
        >
          <header className="border-border flex items-start justify-between gap-4 border-b px-5 py-4">
            <div className="min-w-0">
              <h2 id={`${id}-title`} className="text-h2 text-ink">
                {title}
              </h2>
              {description ? (
                <p
                  id={`${id}-desc`}
                  className="text-body-sm text-ink-secondary mt-1"
                >
                  {description}
                </p>
              ) : null}
            </div>
            <IconButton label={copy.a11y.close} size="sm" onClick={onClose}>
              <X size={icon.sm} strokeWidth={icon.strokeWidth} />
            </IconButton>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>

          {footer ? (
            <footer className="border-border flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </Portal>
  );
}

/**
 * M-08 · Drawer
 *
 * Below 1280px the agent workspace stops being a column and becomes this.
 * Same content, same state — only the container changes.
 */
export function Drawer({
  open,
  onClose,
  title,
  titleHidden = false,
  side = "right",
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /**
   * Keeps the dialog's accessible name and drops the visible heading.
   *
   * For content that already names itself. Below the fold width the agent
   * panel moves in here, and it arrives with its own header — the mark, the
   * name, the pulse and the tool count — so the drawer printing `Build Coach`
   * 40px above the panel printing `Build Coach` is the same word twice. The
   * name still has to exist for `aria-labelledby`.
   */
  titleHidden?: boolean;
  side?: "right" | "bottom";
  className?: string;
  children: ReactNode;
}) {
  const copy = useCopy();
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEscape(open, onClose);
  useFocusTrap(open, panelRef);

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50">
        <button
          type="button"
          aria-label={copy.a11y.close}
          tabIndex={-1}
          onClick={onClose}
          className="motion-fade absolute inset-0 cursor-default bg-[#0B1220]/35"
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          className={cn(
            "bg-surface shadow-e3 absolute flex flex-col",
            side === "right"
              ? "motion-slide-right inset-y-0 right-0 w-[360px] max-w-[90vw] rounded-l-xl"
              : "motion-rise inset-x-0 bottom-0 max-h-[80vh] rounded-t-xl",
            className,
          )}
        >
          <header
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-3",
              titleHidden ? "pb-0" : "border-border border-b",
            )}
          >
            <h2
              id={`${id}-title`}
              className={cn("text-h3 text-ink", titleHidden && "sr-only")}
            >
              {title}
            </h2>
            <IconButton label={copy.a11y.close} size="sm" onClick={onClose}>
              <X size={icon.sm} strokeWidth={icon.strokeWidth} />
            </IconButton>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    </Portal>
  );
}

/**
 * M-05 / M-06 · Popover and menu
 *
 * One primitive behind the library's filter popovers and the workbench's
 * `Reset demo` / `Demo controls` menus: anchored, closes on Escape and on
 * outside click, and returns focus to its trigger.
 */
export function Popover({
  trigger,
  align = "start",
  width = "auto",
  label,
  className,
  children,
}: {
  /** Receives open state so the trigger can reflect it. */
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  align?: "start" | "end";
  width?: "auto" | "sm" | "md";
  /** Accessible name for the popover surface. */
  label: string;
  className?: string;
  children: ReactNode | ((props: { close: () => void }) => ReactNode);
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useEscape(open, close);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close]);

  const widths = {
    auto: "min-w-max",
    sm: "w-56",
    md: "w-72",
  };

  return (
    <div ref={wrapRef} className="relative inline-flex">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open ? (
        <div
          role="dialog"
          aria-label={label}
          className={cn(
            "bg-surface border-border shadow-e3 motion-pop absolute top-[calc(100%+6px)] z-40 origin-top rounded-xl border p-2",
            align === "start" ? "left-0" : "right-0",
            widths[width],
            className,
          )}
        >
          {typeof children === "function" ? children({ close }) : children}
        </div>
      ) : null}
    </div>
  );
}

/** A single row inside a Popover used as a menu. */
export function MenuItem({
  icon: glyph,
  danger = false,
  disabled = false,
  onClick,
  children,
}: {
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "text-body-sm flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-instant",
        danger
          ? "text-error hover:bg-error-soft"
          : "text-ink hover:bg-surface-hover",
        disabled && "pointer-events-none opacity-45",
      )}
    >
      {glyph ? <span className="shrink-0">{glyph}</span> : null}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-overline text-ink-tertiary px-2.5 pt-2 pb-1 uppercase">
      {children}
    </p>
  );
}

export function MenuSeparator() {
  return <hr className="border-border my-1.5 border-t-0 border-b" />;
}
