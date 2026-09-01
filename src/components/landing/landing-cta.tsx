"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useBuildSession } from "@/components/build/build-provider";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";
import { featuredProjectId, projectById } from "@/lib/projects/catalog";
import { cn } from "@/lib/utils/cn";

/**
 * S-01 · The door at the bottom of the page.
 *
 * There is exactly one action on this screen and it is the plate screwed to the
 * bench (`scene/next-step-control.tsx`). This is the same destination met again
 * after the reading half — a person who scrolled past the bench should not have
 * to scroll back — so it is deliberately **not** a second capsule: rule 1 keeps
 * capsules for the thing you press, and two of them on one page is two primary
 * actions whatever the second one is labelled.
 *
 * It is set in the condensed face rather than in body type because it closes a
 * run of condensed section headings and reads as the last line of the page
 * rather than as a link inside a sentence — which is what `TextLink` is for.
 *
 * The word still follows the build, the way it did on the old dashboard.
 * Offering to *continue* something nobody has opened is the interface claiming
 * to remember a session it does not have.
 */
export function LandingCta({ className }: { className?: string }) {
  const copy = useCopy();
  const session = useBuildSession();
  const project = projectById(featuredProjectId);

  const started = session.state.startedAt !== null;

  return (
    <Link
      href={`/workbench/${project.slug}`}
      className={cn(
        "group font-condensed text-accent hover:text-accent-hover focus-visible:ring-focus",
        "duration-instant inline-flex items-center gap-2 rounded-xs text-[20px]",
        "leading-none font-bold tracking-[0.02em] uppercase transition-colors",
        className,
      )}
    >
      {started ? copy.landing.ctaContinue : copy.landing.cta}
      <ArrowRight
        size={icon.lg}
        strokeWidth={2}
        aria-hidden="true"
        className="duration-instant transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
