"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkshopWordmark } from "@/components/ui/brand-marks";
import { LocaleSelect } from "@/components/ui/locale-select";
import { useBuildSession } from "@/components/build/build-provider";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * Batch 8 · The product's top bar.   ·   S-01 · Rebuilt as a workshop nameplate.
 *
 * ## What changed, and why it is not a restyle
 *
 * The bar used to be a white SaaS header: a small logo, a pill-shaped nav item,
 * two raised white chips. It was the single loudest reason the entry screen read
 * as a dashboard, because a header is the first thing on the page and it sets
 * the register for everything under it. So it is now the plate on the front of
 * an instrument: 60px tall, a hairline under it, an off-white ground one step
 * lighter than the bench paper, and a wide condensed nameplate on the left.
 *
 * Everything on the right had to survive that, and all of it did.
 *
 * ## Why there is one link and not three
 *
 * §5 asks for `Projects` · `My builds` · `Components`. §18
 * asks that no main control be dead. In this release only the first of the
 * three has anywhere to go: `My builds` needs a build history the product does
 * not keep (§2 rules out a database), and `Components` needs a parts catalogue
 * that is not a screen in this batch.
 *
 * Two rules, one of which has to give. §18 wins, because a nav that offers a
 * destination it cannot reach is a worse first impression than a nav with one
 * item — and because the alternative on the table, greying two of the three
 * out, decorates the bar with the product's unfinished parts. They come back
 * the day their routes do. (A rule broken on purpose gets its reason written
 * at the top of the file. This is that.)
 *
 * **The same rule decides what the one link is called.** The reference the
 * screen was rebuilt against reads `WORKSHOP LOG` here. There is no workshop
 * log route, and a header item that goes nowhere is exactly what the paragraph
 * above refuses. So the slot keeps its shape — one condensed uppercase item,
 * left of the capsule — and keeps the word for the place it actually opens.
 *
 * ## Why the status capsule is not a decoration
 *
 * §5 lists a small `WebMCP ready` badge. Printed unconditionally, that badge is
 * the interface asserting a capability it never checked — and this is the
 * product whose entire claim is that the agent really does drive the page. So
 * it reads the same detection the workbench panel reads: found, or not found.
 *
 * It now says so in the workshop's own words — `AGENT ONLINE • LIVE` against
 * `AGENT OFFLINE` — because on this surface the reader cares whether the agent
 * has a way in, not whether a specification is implemented. The claim behind
 * the two labels is unchanged, and so is the rule: the capsule keeps its exact
 * geometry in both states and swaps its fill, rather than one state being a
 * capsule and the other a white card (rule 7).
 *
 * The language switcher lives here too, in its bare form: two letters at the
 * end of the row, so the bar reads as a nameplate and a status light with a
 * setting tucked behind them rather than as three competing chips.
 *
 * The workbench does not render this bar: §6.1 gives it a control bar of its
 * own, and two bars stacked would cost the canvas 64px it cannot spare.
 */
export function ProductNav({ className }: { className?: string }) {
  const copy = useCopy();
  const pathname = usePathname();
  const { state } = useBuildSession();

  const onProjects = pathname.startsWith("/projects");
  /**
   * S-01 · the plate is as wide as the screen under it.
   *
   * The entry screen is composed on a narrow measure — 864 for the bar, 760 for
   * the text — and a full-width nav over it would put the wordmark 180px away
   * from the headline it names. The library and the summary are documents on
   * the shell's own measure and want the opposite. One bar, two widths, decided
   * from the route rather than by rendering a second header.
   */
  const onEntry = pathname === "/";

  return (
    <header
      className={cn(
        "bg-paper-soft border-paper-line sticky top-0 z-30 border-b",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-15 items-center gap-3 px-4 sm:gap-6 sm:px-6",
          onEntry ? "max-w-[912px]" : "max-w-shell",
        )}
      >
        <Link
          href="/"
          aria-label={copy.nav.home}
          className="focus-visible:ring-focus shrink-0 rounded-sm"
        >
          <WorkshopWordmark />
        </Link>

        <nav
          aria-label={copy.nav.projects}
          className="ml-auto flex min-w-0 shrink-0 items-center gap-3 sm:gap-4"
        >
          <Link
            href="/projects"
            aria-current={onProjects ? "page" : undefined}
            className={cn(
              "font-condensed duration-instant text-[14px] leading-none font-semibold tracking-[0.045em] uppercase transition-colors",
              onProjects ? "text-accent-active" : "text-ink hover:text-accent",
            )}
          >
            {copy.nav.projects}
          </Link>
          <LocaleSelect tone="bare" />
        </nav>

        <AgentCapsule online={state.webMcpAvailable}>
          {state.webMcpAvailable ? copy.nav.agentOnline : copy.nav.agentOffline}
        </AgentCapsule>
      </div>
    </header>
  );
}

/**
 * The status light on the plate.
 *
 * Small, high-contrast, and the same capsule either way. Cyan is not one of the
 * interface's accents on purpose — it belongs to the workshop's own palette, so
 * a live agent reads as an indicator lit on the instrument rather than as
 * another blue control among the blue controls.
 */
function AgentCapsule({
  online,
  children,
}: {
  online: boolean;
  children: string;
}) {
  return (
    <span
      className={cn(
        "font-condensed inline-flex h-[23px] shrink-0 items-center rounded-full border px-2 text-[11px] leading-none font-semibold tracking-[0.04em] whitespace-nowrap uppercase sm:px-2.5 sm:text-[12.5px] sm:tracking-[0.055em]",
        online
          ? "bg-status-cyan border-[#1e9aa1] text-[#062a2c]"
          : "border-border-strong bg-surface-sunken text-ink-secondary",
      )}
    >
      {children}
    </span>
  );
}
