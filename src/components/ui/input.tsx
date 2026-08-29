"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { Search, X } from "lucide-react";
import { icon } from "@/lib/design/tokens";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

const fieldShell =
  "bg-surface border-border text-body-sm text-ink placeholder:text-ink-tertiary " +
  "h-11 w-full rounded-xl border px-4 transition-[border-color,box-shadow] " +
  "duration-instant ease-out-soft hover:border-border-strong " +
  "disabled:bg-surface-sunken disabled:text-ink-tertiary disabled:pointer-events-none";

function FieldFrame({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label
          htmlFor={id}
          className="text-body-sm text-ink mb-1.5 block font-medium"
        >
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="text-caption text-error mt-1.5 flex items-center gap-1"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-ink-tertiary mt-1.5">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A-08 · Text input
 */
export interface TextInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: ReactNode;
}

export function TextInput({
  label,
  hint,
  error,
  iconLeft,
  className,
  id,
  ...props
}: TextInputProps) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <FieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <div className="relative">
        {iconLeft ? (
          <span className="text-ink-tertiary pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2">
            {iconLeft}
          </span>
        ) : null}
        <input
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
          }
          className={cn(
            fieldShell,
            iconLeft && "pl-10",
            error && "border-error hover:border-error",
          )}
          {...props}
        />
      </div>
    </FieldFrame>
  );
}

/**
 * A-09 · Search input
 *
 * Controlled, so the library toolbar owns the query and the clear affordance
 * only appears once there is something to clear.
 */
export function SearchInput({
  value,
  onValueChange,
  placeholder,
  label,
  className,
  id,
  ...props
}: Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "size"
> & {
  value: string;
  onValueChange: (next: string) => void;
  /** Visually hidden when omitted — the field always has an accessible name. */
  label?: string;
}) {
  const copy = useCopy();
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={fieldId} className="sr-only">
        {label ?? placeholder}
      </label>
      <Search
        size={icon.sm}
        strokeWidth={icon.strokeWidth}
        aria-hidden="true"
        className="text-ink-tertiary pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
      />
      <input
        id={fieldId}
        type="search"
        value={value}
        placeholder={placeholder ?? copy.library.search}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(
          fieldShell,
          "rounded-full pr-10 pl-10",
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label={copy.a11y.clearSearch}
          className="text-ink-tertiary hover:text-ink hover:bg-surface-active absolute top-1/2 right-2.5 grid size-6 -translate-y-1/2 place-items-center rounded-full transition-colors"
        >
          <X size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
