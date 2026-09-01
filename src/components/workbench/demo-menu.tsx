"use client";

import { SlidersHorizontal } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import {
  MenuItem,
  MenuLabel,
  MenuSeparator,
  Popover,
} from "@/components/ui/overlay";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";
import type { DemoGroup, DemoScenario } from "./demo-scenarios";

/**
 * W-10 · Demo controls menu
 *
 * §10 asks for this to be reachable without looking like part of the product,
 * and the two requirements pull against each other: a menu nobody can find is
 * not a demo control, and a bar of nine buttons is a second product. So it is
 * one recessive icon button in the topbar — the same `IconButton` every other
 * control uses, in `quiet`, with no label beside it — opening M-05's popover.
 *
 * Nine items in a flat list is a wall. They come in the three groups the
 * demo itself has — the wiring fault, the servo fault, the whole system — each
 * one reading *jump to it · put it back · fix it*, which is the shape of a
 * take. `Reset complete demo` sits above them all, on its own, because it is
 * the only one that throws away everything the others set up.
 *
 * Every item closes the menu before it runs. Several of these take seconds and
 * play out on the canvas behind, and a popover left standing over the thing it
 * just started is a popover in the way of the shot.
 */

/** Every group except the reset, which is not one of the three faults. */
type FaultGroup = Exclude<DemoGroup, "reset">;

const groupOrder: FaultGroup[] = ["wiring", "servo", "system"];

export function DemoControls({
  scenarios,
  busy = false,
  className,
}: {
  scenarios: DemoScenario[];
  /** A tool is in flight; the store takes one caller at a time. */
  busy?: boolean;
  className?: string;
}) {
  const copy = useCopy();
  const reset = scenarios.find((scenario) => scenario.group === "reset");
  const groupLabel: Record<FaultGroup, string> = {
    wiring: copy.demo.groups.wiring,
    servo: copy.demo.groups.servo,
    system: copy.demo.groups.system,
  };

  return (
    <Popover
      align="end"
      width="md"
      label={copy.demo.controls}
      className={className}
      trigger={({ open, toggle }) => (
        <IconButton
          label={copy.demo.controls}
          size="sm"
          aria-expanded={open}
          onClick={toggle}
        >
          <SlidersHorizontal size={icon.sm} strokeWidth={icon.strokeWidth} />
        </IconButton>
      )}
    >
      {({ close }) => {
        const item = (scenario: DemoScenario) => (
          <MenuItem
            key={scenario.id}
            disabled={busy}
            onClick={() => {
              close();
              void scenario.run();
            }}
          >
            {scenario.label}
          </MenuItem>
        );

        return (
          <>
            {reset ? (
              <>
                {item(reset)}
                <MenuSeparator />
              </>
            ) : null}

            {/* A heading over nothing is a control that has gone missing.
                Chapter two has no servo, so its menu carried an empty `SERVO`
                label under which the person kept looking for the two rows the
                capstone has — the same fault as an inspection scope a build
                cannot honour, one screen out. */}
            {groupOrder.map((group) => {
              const rows = scenarios.filter(
                (scenario) => scenario.group === group,
              );
              if (!rows.length) return null;
              return (
                <div key={group}>
                  <MenuLabel>{groupLabel[group]}</MenuLabel>
                  {rows.map(item)}
                </div>
              );
            })}

            <p className="text-caption text-ink-tertiary border-border mt-1.5 border-t px-2.5 pt-2">
              {copy.demo.note}
            </p>
          </>
        );
      }}
    </Popover>
  );
}
