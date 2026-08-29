"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { LabBlock } from "@/components/lab/lab-primitives";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * Five readings of the kit checklist control.
 *
 * Context matters here: this is not a consent box or a settings toggle. It is
 * an inventory mark — "I have this part" — on a list the user runs down once
 * before starting a build. Nothing is blocked by leaving one unticked, so the
 * control should feel like counting stock rather than agreeing to terms.
 */

interface Part {
  id: string;
  label: string;
  detail?: string;
  indeterminate?: boolean;
  disabled?: boolean;
}

/** The same five parts the atoms gallery lists, read from the dictionary. */
function useParts(): Part[] {
  const kit = useCopy().lab.atoms.kit;
  return [
    { id: "board", label: kit.board.label, detail: kit.board.detail },
    { id: "sensor", label: kit.sensor.label },
    { id: "servo", label: kit.servo.label },
    {
      id: "resistors",
      label: kit.resistors.label,
      detail: kit.resistors.detail,
      indeterminate: true,
    },
    {
      id: "arm",
      label: kit.arm.label,
      detail: kit.arm.detail,
      disabled: true,
    },
  ];
}

function useKit() {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    board: true,
    sensor: true,
    servo: true,
  });
  const toggle = (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] }));
  return { checked, toggle };
}

/* ------------------------------------------------------------------ CB1 */

function RoundFilled() {
  const parts = useParts();
  const { checked, toggle } = useKit();

  return (
    <div className="space-y-1">
      {parts.map((part) => {
        const on = !!checked[part.id];
        const mid = part.indeterminate && !on;
        return (
          <label
            key={part.id}
            className={cn(
              "flex items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-instant",
              part.disabled
                ? "cursor-default opacity-50"
                : "hover:bg-surface-hover cursor-pointer",
            )}
          >
            <span className="relative flex size-5 shrink-0 items-center pt-px">
              <input
                type="checkbox"
                checked={on}
                disabled={part.disabled}
                onChange={() => toggle(part.id)}
                className="peer absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <span
                className={cn(
                  "peer-focus-visible:ring-focus grid size-5 place-items-center rounded-full border-2 transition-all duration-instant ease-out-soft",
                  on || mid
                    ? "bg-accent border-accent text-white"
                    : "border-border-strong bg-surface peer-hover:border-accent",
                )}
              >
                {mid ? (
                  <Minus size={12} strokeWidth={3.5} className="motion-pop" />
                ) : on ? (
                  <Check size={12} strokeWidth={3.5} className="motion-pop" />
                ) : null}
              </span>
            </span>
            <span className="min-w-0">
              <span className="text-body-sm text-ink block">{part.label}</span>
              {part.detail ? (
                <span className="text-caption text-ink-tertiary block leading-snug">
                  {part.detail}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ CB2 */

function RoundOutline() {
  const parts = useParts();
  const { checked, toggle } = useKit();

  return (
    <div className="space-y-1">
      {parts.map((part) => {
        const on = !!checked[part.id];
        const mid = part.indeterminate && !on;
        return (
          <label
            key={part.id}
            className={cn(
              "flex items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-instant",
              part.disabled
                ? "cursor-default opacity-50"
                : "hover:bg-surface-hover cursor-pointer",
            )}
          >
            <span className="relative flex size-5 shrink-0 items-center pt-px">
              <input
                type="checkbox"
                checked={on}
                disabled={part.disabled}
                onChange={() => toggle(part.id)}
                className="peer absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <span
                className={cn(
                  "peer-focus-visible:ring-focus bg-surface grid size-5 place-items-center rounded-full border-2 transition-all duration-instant ease-out-soft",
                  on || mid
                    ? "border-accent text-accent"
                    : "border-border-strong peer-hover:border-accent",
                )}
              >
                {mid ? (
                  <Minus size={12} strokeWidth={3.5} className="motion-pop" />
                ) : on ? (
                  <Check size={13} strokeWidth={3.5} className="motion-pop" />
                ) : null}
              </span>
            </span>
            <span className="min-w-0">
              <span className="text-body-sm text-ink block">{part.label}</span>
              {part.detail ? (
                <span className="text-caption text-ink-tertiary block leading-snug">
                  {part.detail}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ CB3 */

function InventoryRow() {
  const copy = useCopy();
  const parts = useParts();
  const { checked, toggle } = useKit();

  return (
    <div className="space-y-2">
      {parts.map((part) => {
        const on = !!checked[part.id];
        const mid = part.indeterminate && !on;
        return (
          <button
            key={part.id}
            type="button"
            disabled={part.disabled}
            onClick={() => toggle(part.id)}
            aria-pressed={on}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-instant ease-out-soft",
              part.disabled && "cursor-default opacity-50",
              on
                ? "bg-success-soft/70 shadow-badge"
                : "bg-surface-sunken hover:bg-surface hover:shadow-badge",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full transition-all duration-instant ease-out-soft",
                on
                  ? "bg-success text-white"
                  : mid
                    ? "bg-warning text-white"
                    : "border-border-strong text-ink-tertiary border-2 border-dashed",
              )}
            >
              {on ? (
                <Check size={14} strokeWidth={3} className="motion-pop" />
              ) : mid ? (
                <Minus size={14} strokeWidth={3} className="motion-pop" />
              ) : (
                <Plus size={13} strokeWidth={2.5} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-body-sm text-ink block font-medium">
                {part.label}
              </span>
              {part.detail ? (
                <span className="text-caption text-ink-tertiary block leading-snug">
                  {part.detail}
                </span>
              ) : null}
            </span>
            <span
              className={cn(
                "text-caption shrink-0 font-medium",
                on ? "text-success" : "text-ink-tertiary",
              )}
            >
              {on
                ? copy.projectDetail.haveIt
                : mid
                  ? copy.projectDetail.someOf
                  : copy.projectDetail.addIt}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ CB4 */

function SoftSquare() {
  const parts = useParts();
  const { checked, toggle } = useKit();

  return (
    <div className="space-y-1">
      {parts.map((part) => {
        const on = !!checked[part.id];
        const mid = part.indeterminate && !on;
        return (
          <label
            key={part.id}
            className={cn(
              "flex items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-instant",
              part.disabled
                ? "cursor-default opacity-50"
                : "hover:bg-surface-hover cursor-pointer",
            )}
          >
            <span className="relative flex size-5 shrink-0 items-center pt-px">
              <input
                type="checkbox"
                checked={on}
                disabled={part.disabled}
                onChange={() => toggle(part.id)}
                className="peer absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <span
                className={cn(
                  "peer-focus-visible:ring-focus grid size-5 place-items-center rounded-[7px] transition-all duration-instant ease-out-soft",
                  on || mid
                    ? "bg-accent shadow-btn-accent text-white"
                    : "bg-surface shadow-badge peer-hover:shadow-btn-surface-lift",
                )}
              >
                {mid ? (
                  <Minus size={12} strokeWidth={3.5} className="motion-pop" />
                ) : on ? (
                  <Check size={12} strokeWidth={3.5} className="motion-pop" />
                ) : null}
              </span>
            </span>
            <span className="min-w-0">
              <span className="text-body-sm text-ink block">{part.label}</span>
              {part.detail ? (
                <span className="text-caption text-ink-tertiary block leading-snug">
                  {part.detail}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ CB5 */

function CapsuleToggle() {
  const copy = useCopy();
  const parts = useParts();
  const { checked, toggle } = useKit();

  return (
    <div className="space-y-1.5">
      {parts.map((part) => {
        const on = !!checked[part.id];
        const mid = part.indeterminate && !on;
        return (
          <div
            key={part.id}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-1.5",
              part.disabled && "opacity-50",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="text-body-sm text-ink block">{part.label}</span>
              {part.detail ? (
                <span className="text-caption text-ink-tertiary block leading-snug">
                  {part.detail}
                </span>
              ) : null}
            </span>
            <button
              type="button"
              disabled={part.disabled}
              aria-pressed={on}
              onClick={() => toggle(part.id)}
              className={cn(
                "text-caption inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 font-medium transition-all duration-instant ease-out-soft",
                on
                  ? "bg-accent-soft text-accent-active shadow-chip-selected"
                  : "bg-surface text-ink-secondary shadow-badge hover:text-ink hover:shadow-btn-surface-lift",
              )}
            >
              {on ? (
                <Check size={13} strokeWidth={3} className="motion-pop" />
              ) : mid ? (
                <Minus size={13} strokeWidth={3} />
              ) : (
                <Plus size={13} strokeWidth={2.5} />
              )}
              {on
                ? copy.projectDetail.haveIt
                : mid
                  ? copy.projectDetail.someOf
                  : copy.projectDetail.addIt}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------------ */

export function CheckboxOptions() {
  const t = useCopy().lab.atoms.buttonsLab.checkbox;

  const options = [
    { id: "CB1", name: t.cb1.name, note: t.cb1.note, Render: RoundFilled },
    { id: "CB2", name: t.cb2.name, note: t.cb2.note, Render: RoundOutline },
    { id: "CB3", name: t.cb3.name, note: t.cb3.note, Render: InventoryRow },
    { id: "CB4", name: t.cb4.name, note: t.cb4.note, Render: SoftSquare },
    { id: "CB5", name: t.cb5.name, note: t.cb5.note, Render: CapsuleToggle },
  ];

  return (
    <>
      {options.map((option) => (
        <LabBlock key={option.id}>
          <div className="border-border bg-surface shadow-e1 rounded-xl border p-5">
            <div className="mb-4">
              <h3 className="text-h3 text-ink flex items-center gap-2">
                <span className="text-mono-sm bg-surface-sunken text-ink-secondary rounded-full px-2 py-0.5 font-mono">
                  {option.id}
                </span>
                {option.name}
              </h3>
              <p className="text-body-sm text-ink-secondary mt-1 max-w-prose">
                {option.note}
              </p>
            </div>
            <div className="bg-app max-w-md rounded-lg p-4">
              <option.Render />
            </div>
          </div>
        </LabBlock>
      ))}
    </>
  );
}
