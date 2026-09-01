"use client";

import Link from "next/link";
import { useBuildSession } from "@/components/build/build-provider";
import { useCopy } from "@/content/copy-provider";
import { stepById, stepWords } from "@/lib/agent/steps";
import { featuredProjectId, projectById } from "@/lib/projects/catalog";
import { cn } from "@/lib/utils/cn";

/**
 * S-01 · The one action, as a control on the bench.
 *
 * It used to be a blue capsule in the middle of a white card under the build
 * sheet — a dashboard's idea of a call to action, and the last thing on the
 * screen that still looked like one. Here it is a moulded plate sitting on the
 * front-right corner of the breadboard, with the button screwed to it: the
 * control belongs to the *object*, not to the page.
 *
 * Nothing about its behaviour changed. It is still a real link to the same
 * workbench route, so it can be opened in a new tab and read by a screen reader
 * as a destination, and it still says what it is going to do rather than
 * offering to "continue" a build nobody has opened — the difference being that
 * a build in progress can now name the step it is going back to, which it reads
 * off the live session rather than guessing.
 *
 * The deliberate exception to A-01: this is the only control in the product not
 * drawn as a capsule on a plate. Written down here because
 * `design-language.md` asks that a broken rule carry its reason — the reason is
 * that a rounded pill floating over a cutting mat reads as an interface pasted
 * on top of a photograph, and the entire point of the screen is that it is not.
 */
export function NextStepControl({ className }: { className?: string }) {
  const copy = useCopy();
  const { state } = useBuildSession();
  const project = projectById(featuredProjectId);

  const started = state.startedAt !== null;
  const step = stepById(state.activeStepId);

  const label = started
    ? copy.landing.ctaNextStep(stepWords(copy, step.id).name)
    : copy.landing.cta;

  return (
    <div
      className={cn(
        /* Below the scene on a narrow screen, screwed onto it above that.
           One element in both cases — a second copy would be a second link to
           the same place in the accessibility tree. */
        /* Against `bench-layout.ts`'s 1180 × 700 frame: the plate rests on the
           mat clear of the board and of the boom's sweep — x 916..1156,
           y 600..678. */
        "mx-auto mt-5 w-[272px] max-w-full md:absolute md:mt-0 md:h-[11.8%] md:w-[20.4%]",
        "md:top-[84%] md:left-[77.6%]",
        className,
      )}
    >
      <Link
        href={`/workbench/${project.slug}`}
        className={cn(
          "group focus-visible:ring-focus grid h-full w-full place-items-center rounded-[8px] border p-[5.5%]",
          "border-[#A8ADB3] bg-[linear-gradient(180deg,#FBFAF7_0%,#EDEBE5_100%)]",
          "shadow-[0_3px_0_0_#A2A7AD,0_9px_16px_-4px_rgba(12,20,26,0.45)]",
          "duration-instant ease-out-soft transition-transform active:translate-y-[2px]",
        )}
      >
        <span
          className={cn(
            "flex w-full items-center justify-center gap-[0.5em] rounded-[6px] border border-[#0B54BE]",
            "bg-[linear-gradient(180deg,#3D95FF_0%,#1372EE_52%,#0E66DA_100%)] text-white",
            "shadow-[0_2px_0_0_#0A4CAB,inset_0_1px_0_rgba(255,255,255,0.34)]",
            "font-condensed leading-none font-bold tracking-[0.03em] uppercase",
            "px-[0.7em] py-[0.72em]",
            "duration-instant ease-out-soft transition-colors",
            "group-hover:bg-[linear-gradient(180deg,#4EA0FF_0%,#1E7BF5_52%,#1069E4_100%)]",
          )}
          style={{ fontSize: "clamp(12px, 1.96cqw, 18px)" }}
        >
          <span className="truncate">{label}</span>
          <svg
            viewBox="0 0 20 12"
            aria-hidden="true"
            className="h-[0.62em] w-[1.05em] shrink-0"
            fill="none"
          >
            <path
              d="M1 6 H17 M12.5 1.5 L18 6 L12.5 10.5"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Link>
    </div>
  );
}
