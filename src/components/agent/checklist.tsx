"use client";

import { TracePad } from "@/components/ui/feedback";
import { MonoValue } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import type { Checklist } from "@/lib/agent/checklist";
import type { CircuitScene } from "@/lib/circuit/graph";
import { cn } from "@/lib/utils/cn";

/**
 * G-16 · What the sketch is still waiting for.
 *
 * One line per connection, ticked off the graph — not off the findings list, so
 * it is true before the agent has looked and stays true after a lead moves.
 * `checklistFor` decides *which* connections; this decides only how they read.
 *
 * **Not a card, and not a table.** A pad, a name and where it goes, in the
 * panel's own register (rule 4). The pad is the same one the teaching ladder
 * uses, which is deliberate: a filled disc means *this is done* in both places.
 *
 * ## The two names in a row are different kinds of thing
 *
 * The left is a lead — a thing you pick up, and the product's own word for it
 * (`LED'in kısa bacağı`). The right is where it goes, and it is only in mono
 * when it is a **hole**, because that is what is printed on the board (rule
 * 13). A join between two parts' legs has no silkscreen to quote, so it is set
 * as plain text like the lead it names.
 */
export function StepChecklist({
  checklist,
  scene,
  className,
}: {
  checklist: Checklist;
  /** Where the names come from: the graph the canvas is drawing. */
  scene: CircuitScene;
  className?: string;
}) {
  const copy = useCopy();
  const { items, done, scope } = checklist;

  if (!items.length) return null;

  /**
   * A lead is a lead because the product has a **name** for it, not because the
   * scene has a node for it.
   *
   * Asking the graph (`node.kind !== "terminal"`) looks right and is wrong in
   * the one case this list exists for: a part still in the kit has no node at
   * all, so every unplaced lead answered "hole" and the row printed `res.in` in
   * mono, as though the board had a socket by that name. The names table is
   * the build's own vocabulary and is there whether the part is on the bench or
   * in the box.
   */
  const leadName = (id: string): string | undefined => copy.build.leads[id];
  const nameOf = (id: string) => leadName(id) ?? scene.nodes[id]?.label ?? id;

  return (
    <div className={cn("py-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-overline text-ink-tertiary uppercase">
          {scope === "step"
            ? copy.agentPanel.checklist.inThisStep
            : copy.agentPanel.checklist.wholeCircuit}
        </p>
        <MonoValue tone="quiet">
          {copy.agentPanel.context.countOf(done, items.length)}
        </MonoValue>
      </div>

      <ul className="mt-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 py-1">
            <TracePad
              className="mt-[3px]"
              mark={item.done ? "passed" : item.wrong ? "found" : "pending"}
            />
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "text-body-sm",
                  item.done ? "text-ink-tertiary" : "text-ink",
                )}
              >
                {nameOf(item.from)}
              </span>
              <span aria-hidden="true" className="text-ink-disabled px-1">
                →
              </span>
              {leadName(item.to) ? (
                <span className="text-body-sm text-ink-secondary">
                  {leadName(item.to)}
                </span>
              ) : (
                <MonoValue tone={item.done ? "quiet" : "target"}>
                  {scene.nodes[item.to]?.label ?? item.to}
                </MonoValue>
              )}
              {/* Attached, but not here. A different sentence from *not yet*:
                  one is work outstanding, the other is work to take back. */}
              {item.wrong ? (
                <span className="text-caption text-warning ml-1.5">
                  {copy.agentPanel.checklist.elsewhere}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
