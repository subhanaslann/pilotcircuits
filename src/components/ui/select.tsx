"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { icon } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * A-10 · Select
 *
 * A real listbox rather than a native `<select>`. The native control renders
 * the operating system's menu, which cannot be styled and lands in the middle
 * of a carefully built interface looking like it came from somewhere else.
 *
 * Everything the native element gave us is rebuilt here rather than dropped:
 * arrow keys and Home/End move the highlight, Enter and Space commit, Escape
 * closes without changing the value, Tab closes and moves on, and typing
 * jumps to the first option starting with those letters. The trigger is a
 * `combobox`, the menu a `listbox`, and the highlighted row is announced
 * through `aria-activedescendant`.
 */

export interface SelectOption {
  value: string;
  label: string;
  /** Optional second line — used for filters that need a unit or a count. */
  hint?: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (next: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Matches the trigger width; menus never grow past their field. */
  className?: string;
  id?: string;
}

export function Select({
  options,
  value,
  onValueChange,
  label,
  hint,
  error,
  placeholder = "Select",
  disabled,
  className,
  id,
}: SelectProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  const listId = `${fieldId}-listbox`;

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value),
    ),
  );

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ query: "", at: 0 });

  const selected = options.find((o) => o.value === value);

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  const commit = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      onValueChange(option.value);
      close();
    },
    [options, onValueChange, close],
  );

  /* Outside click closes without returning focus — the user is elsewhere. */
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  /* Keep the highlighted row in view when arrowing through a long list. */
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${highlight}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  const openMenu = (startAt = options.findIndex((o) => o.value === value)) => {
    setHighlight(Math.max(0, startAt));
    setOpen(true);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        setOpen(false);
        break;
      case "ArrowDown":
        event.preventDefault();
        setHighlight((h) => (h + 1) % options.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlight((h) => (h - 1 + options.length) % options.length);
        break;
      case "Home":
        event.preventDefault();
        setHighlight(0);
        break;
      case "End":
        event.preventDefault();
        setHighlight(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(highlight);
        break;
      default: {
        /* Type-ahead: letters jump to the first matching label. */
        if (event.key.length !== 1 || event.metaKey || event.ctrlKey) return;
        const now = Date.now();
        const state = typeahead.current;
        state.query =
          now - state.at > 700 ? event.key : state.query + event.key;
        state.at = now;

        const match = options.findIndex((o) =>
          o.label.toLowerCase().startsWith(state.query.toLowerCase()),
        );
        if (match >= 0) setHighlight(match);
      }
    }
  };

  return (
    <div className={cn("w-full", className)} ref={wrapRef}>
      {label ? (
        <label
          htmlFor={fieldId}
          className="text-body-sm text-ink mb-1.5 block font-medium"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        <button
          ref={triggerRef}
          id={fieldId}
          type="button"
          role="combobox"
          aria-controls={listId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-activedescendant={
            open ? `${fieldId}-option-${highlight}` : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
          }
          disabled={disabled}
          onClick={() => (open ? close() : openMenu())}
          onKeyDown={onKeyDown}
          className={cn(
            "bg-surface border-border text-body-sm h-11 w-full rounded-xl border pr-10 pl-4 text-left transition-[border-color,box-shadow] duration-instant ease-out-soft",
            "hover:border-border-strong",
            "disabled:bg-surface-sunken disabled:text-ink-tertiary disabled:pointer-events-none",
            open && "border-accent shadow-chip-selected",
            error && "border-error hover:border-error",
            selected ? "text-ink" : "text-ink-tertiary",
          )}
        >
          {selected?.label ?? placeholder}
          <ChevronDown
            size={icon.sm}
            strokeWidth={icon.strokeWidth}
            aria-hidden="true"
            className={cn(
              "text-ink-tertiary pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 transition-transform duration-instant ease-out-soft",
              open && "rotate-180",
            )}
          />
        </button>

        {open ? (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label ?? placeholder}
            tabIndex={-1}
            className="bg-surface border-border shadow-e3 motion-pop absolute top-[calc(100%+6px)] left-0 z-40 max-h-64 w-full origin-top overflow-y-auto rounded-xl border p-1.5"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlight;
              return (
                <li
                  key={option.value}
                  id={`${fieldId}-option-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(event) => {
                    /* mousedown, not click: the outside-click listener would
                       close the menu before a click ever lands. */
                    event.preventDefault();
                    commit(index);
                  }}
                  className={cn(
                    "text-body-sm flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition-colors duration-instant",
                    isHighlighted && !isSelected && "bg-surface-hover",
                    isSelected
                      ? "bg-accent-soft text-accent-active font-medium"
                      : "text-ink",
                  )}
                >
                  <span className="min-w-0">
                    {option.label}
                    {option.hint ? (
                      <span className="text-caption text-ink-tertiary mt-0.5 block leading-snug">
                        {option.hint}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? (
                    <Check
                      size={icon.sm}
                      strokeWidth={2.5}
                      aria-hidden="true"
                      className="shrink-0"
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p id={`${fieldId}-error`} className="text-caption text-error mt-1.5">
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${fieldId}-hint`}
          className="text-caption text-ink-tertiary mt-1.5"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
