"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusChip } from "@/components/ui/badge";
import { Wordmark } from "@/components/ui/brand-marks";
import { LocaleSelect } from "@/components/ui/locale-select";
import { useBuildSession } from "@/components/build/build-provider";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * Batch 8 · The product's top bar.
 *
 * ## Why there is one link and not three
 *
 * `frontend-plan.md` §5 asks for `Projects` · `My builds` · `Components`. §18
 * asks that no main control be dead. In this release only the first of the
 * three has anywhere to go: `My builds` needs a build history the product does
 * not keep (§2 rules out a database), and `Components` needs a parts catalogue
 * that is not a screen in this batch.
 *
 * Two rules, one of which has to give. §18 wins, because a nav that offers a
 * destination it cannot reach is a worse first impression than a nav with one
 * item — and because the alternative on the table, greying two of the three
 * out, decorates the bar with the product's unfinished parts. They come back
 * the day their routes do. (`design-language.md`: a rule broken on purpose gets
 * its reason written at the top of the file. This is that.)
 *
 * ## Why the WebMCP badge is not a decoration
 *
 * §5 lists a small `WebMCP ready` badge. Printed unconditionally, that badge is
 * the interface asserting a capability it never checked — and this is the
 * product whose entire claim is that the agent really does drive the page. So
 * it reads the same detection the workbench panel reads: found, or not found,
 * with its own glyph either way (rule 7). On a browser without the API the bar
 * says so and the demo controls carry the build, which is exactly the behaviour
 * §9 specifies.
 *
 * The language switcher lives here too. Until this batch it existed only in the
 * design lab's sidebar, so the product was multilingual with no way for a
 * reader to say which language they wanted.
 *
 * The workbench does not render this bar: §6.1 gives it a control bar of its
 * own, and two bars stacked would cost the canvas 64px it cannot spare.
 */
export function ProductNav({ className }: { className?: string }) {
  const copy = useCopy();
  const pathname = usePathname();
  const { state } = useBuildSession();

  const onProjects = pathname.startsWith("/projects");

  return (
    <header
      className={cn(
        "bg-surface border-border sticky top-0 z-30 border-b",
        className,
      )}
    >
      <div className="mx-auto flex h-topbar max-w-shell items-center gap-6 px-6">
        <Link
          href="/"
          aria-label={copy.nav.home}
          className="focus-visible:ring-focus shrink-0 rounded-sm"
        >
          <Wordmark />
        </Link>

        <nav aria-label={copy.nav.projects} className="min-w-0">
          <Link
            href="/projects"
            aria-current={onProjects ? "page" : undefined}
            className={cn(
              "text-body-sm rounded-full px-3 py-1.5 font-medium transition-colors duration-instant",
              onProjects
                ? "bg-accent-soft text-accent-active"
                : "text-ink-secondary hover:bg-surface-hover hover:text-ink",
            )}
          >
            {copy.nav.projects}
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {state.webMcpAvailable ? (
            <StatusChip status="webMcpReady">
              {copy.nav.webMcpReady}
            </StatusChip>
          ) : (
            <StatusChip status="webMcpUnavailable">
              {copy.nav.webMcpUnavailable}
            </StatusChip>
          )}
          <LocaleSelect />
        </div>
      </div>
    </header>
  );
}
