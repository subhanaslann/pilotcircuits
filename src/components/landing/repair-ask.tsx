"use client";

import { useSyncExternalStore } from "react";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonoValue } from "@/components/ui/text";
import { useLandingSession } from "@/components/landing/landing-session";
import { useRepair } from "@/components/landing/use-repair";
import { getPhase, subscribe } from "@/components/landing/scene/repair-demo";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * S-01 · The ask.
 *
 * What stood here was the workbench's whole agent panel — header, tabs,
 * findings, timeline, a coaching ladder — beside a bench that needed exactly
 * one thing done to it. A panel is the right surface when you are *in* a build
 * and there are eight things to look at. On the entry screen it was eight
 * surfaces answering a question nobody had asked yet, and the one control that
 * mattered was at the bottom of it.
 *
 * So the panel is gone and this is what is left: the fault in one sentence, and
 * the call that clears it.
 *
 * ## Rule 4
 *
 * No card, no frame, no fill. *Kutu değil, cümle.* The measure carries it, the
 * hairline separates the button from the words, and the one raised thing on the
 * whole column is the button — which is the only thing here you can press.
 *
 * ## The line about WebMCP measures something
 *
 * `inspect_build` and `show_correction` are handed to the browser on this route
 * (`use-repair.ts`). The line above the button says which of the two states the
 * probe actually found, and never the other one — the same rule the nav badge
 * had to learn: a badge that does not measure is not a badge.
 */
export function RepairAsk({ className }: { className?: string }) {
  const copy = useCopy();
  const { state } = useLandingSession();
  const phase = useSyncExternalStore(subscribe, getPhase, () => "stuck" as const);
  const { busy, repair } = useRepair();

  const live = state.webMcpAvailable;
  const working = busy || phase === "run";
  /* The rest: the fixed build stands for a moment before the fault goes back.
     The button offers to start over now rather than pretending to be busy. */
  const again = !working && phase === "rest";

  return (
    <div className={cn("flex min-w-0 flex-col gap-4", className)}>
      {/* What the browser can do, said out loud. The glyph is the panel pulse's
          two states: filled when something answered the probe, hollow when
          nothing did (rule 7 — never colour alone). */}
      <p className="text-caption text-ink-tertiary flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            "size-2.5 shrink-0 rounded-full border-2",
            live ? "border-accent bg-accent" : "border-ink-disabled",
          )}
        />
        {live ? copy.landing.helpHost : copy.landing.helpNoHost}
      </p>

      {/* §9's unavailable sentence is two clauses, and this route printed one.
          "No WebMCP in this browser" says what is missing and stops, leaving a
          person on the landing page with no answer to *so can I still do
          anything here* — while the demo controls beside it are working. The
          second clause is the panel's own (`panel.tsx`'s `Alert` prints exactly
          this pair), so the two routes say the same thing in the same words
          rather than one of them saying half of it.

          A line of its own rather than a sentence glued to the first: neither
          key carries the punctuation that would join them, and inventing it in
          code is writing copy. */}
      {live ? null : (
        <p className="text-caption text-ink-tertiary -mt-2">
          {copy.agentPanel.webMcpUnavailableDetail}
        </p>
      )}

      <div>
        <h2 className="font-condensed text-ink text-[26px] leading-none font-bold uppercase">
          {copy.landing.helpTitle}
        </h2>
        <p className="text-body-sm text-ink-secondary mt-3">
          {copy.landing.helpBody}
        </p>
      </div>

      {/* The two tools this route registers, named. `6 tools available` is only
          worth saying if the list is right there to be checked — the same
          argument, two tools smaller. */}
      <div className="border-border flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-4">
        <span className="text-caption text-ink-tertiary">
          {copy.landing.helpTools}
        </span>
        <MonoValue tone="quiet">inspect_build</MonoValue>
        <MonoValue tone="quiet">show_correction</MonoValue>
      </div>

      <Button
        variant="primary"
        size="lg"
        block
        loading={working}
        iconLeft={<Wrench size={icon.sm} aria-hidden="true" />}
        onClick={repair}
      >
        {working
          ? copy.landing.helpBusy
          : again
            ? copy.landing.helpAgain
            : copy.landing.helpAction}
      </Button>

      <p className="text-caption text-ink-tertiary">
        {copy.landing.helpAfter}
      </p>
    </div>
  );
}
