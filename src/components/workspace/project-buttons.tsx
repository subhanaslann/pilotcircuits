"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, CircleCheck, Eye, LoaderCircle } from "lucide-react";
import { ComponentIcon } from "@/components/illustration/component-icons";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";
import { projects, type ProjectStatus, type ProjectId } from "@/lib/projects/catalog";
import { cn } from "@/lib/utils/cn";

/**
 * W-02 · The project rail.
 *
 * These are the product's buttons in card form, and that is a literal claim
 * rather than a description of the mood. A-01 builds a control out of three
 * layers: a filled face, a ledge showing under it, and a soft shadow cast from
 * the ledge onto the page — and pressing takes the ledge away rather than
 * changing the colour.
 *
 * ## The bezel is a piece of equipment
 *
 * The band is a real element rather than a `box-shadow` ring, because a ring is
 * a hairline and this card wants a **band**: a thick frame with a panel set
 * inside it, the way a instrument has a bezel around its display. A shadow
 * cannot hold a corner radius of its own, so the band is an element and the
 * panel is its child.
 *
 * Four things make it read as machined rather than as a coloured rectangle, and
 * they are the whole of the direction:
 *
 *   1. **A face with light on it.** The band is a vertical gradient — lighter
 *      at the top, darker at the bottom — with `inset 0 1px 0` white along its
 *      top edge. That single lit line is what says *moulded* rather than
 *      *filled*.
 *   2. **A deep ledge.** `0 10px 0 -1px` in the band's own shadow tone. Ten
 *      pixels is a lot and it is meant to be: this card is 284 wide, and a
 *      4px ledge at that size reads as a printing error rather than as depth.
 *   3. **The panel is sunk into it.** `inset 0 2px 3px` inside the white panel,
 *      so the display sits *in* the bezel instead of floating on it.
 *   4. **The travel is the ledge.** Pressed, the card drops 5px and the ledge
 *      halves to 5px, so the object meets the bench. Nothing recolours.
 *
 * Selection turns the *band* blue and leaves the panel white — one blue thing
 * on the screen at a time, exactly as the primary button does, and the card's
 * contents keep their own contrast instead of being re-coloured.
 *
 * The proportion is fixed rather than left to the contents (`aspect-[1.62]`):
 * the rail is a row of identical objects and identical is the point, so a build
 * with a longer name cannot make its card taller than its neighbour's.
 *
 * ## What the panel says
 *
 * The screen this rail belongs to is a kit picker — the middle column is a case
 * you open to see what is in it — so the card is the same question answered
 * small: **what is in this box, and can I open it yet.**
 *
 *   · the chapter, in mono, because the six are a ladder and the rung is a fact
 *   · the status, glyph and word, which the card did not carry before at all:
 *     five of the six chapters have no bench, and until now you only learned
 *     that after selecting one (rule 7 — the glyph, not the colour, carries it)
 *   · the name, and the two figures that say how big a job it is
 *   · **the kit, as a tray**: every part's own mark on sunken ground, with the
 *     count beside them. Six cards stacked make the ladder visible — three
 *     marks in chapter one, six in chapter six — which is the thing the
 *     catalogue is built around and no other surface on this screen shows.
 *
 * The marks are the same drawings the inventory beside the case uses, so the
 * rail and the case cannot disagree about what a servo looks like. They are
 * decorative (§18): the count carries the fact in words.
 *
 * ## The rail is a window
 *
 * The screen does not scroll, so the rail cannot run off the bottom of it. It is
 * a fixed window with the list inside, and a notch under it moves the window on
 * by exactly one screenful. The window is a real scroll container (`overflow
 * hidden` still scrolls under program control, it just refuses the wheel), which
 * is worth more than a `translateY` would be: it clamps at both ends by itself,
 * and tabbing to a card below the fold brings that card into view rather than
 * scrolling the page out from under everything.
 *
 * The notch only exists when there is somewhere to go, and once the list has run
 * out it turns over and says so, because a control pointing down that takes you
 * up is a control that lies.
 */

/**
 * The bezel, and the thickness under it. Two states, no more.
 *
 * The gradient stops and the ledge tones are written out rather than taken from
 * `--color-*`: this is a moulded material, and the interface palette has no
 * opinion about what plastic looks like — the same exception `illustration/
 * spec.ts` takes for the parts.
 *
 * Every shadow is written out in full, twice, rather than composed from a
 * shared `inset 0 1px 0 …` constant: Tailwind reads class names out of the
 * source text, so a class assembled at runtime is a class that never gets
 * generated. The repetition is the price of the scanner seeing them.
 */
const BAND = {
  selected:
    "bg-[linear-gradient(180deg,#3D92FF_0%,#1677FF_55%,#0F6AE6_100%)] " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_0_-1px_#0A4CAB,0_22px_26px_-12px_rgba(10,60,140,0.52)] " +
    "active:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_5px_0_-1px_#0A4CAB,0_13px_17px_-10px_rgba(10,60,140,0.46)]",
  resting:
    "bg-[linear-gradient(180deg,#AEB5BC_0%,#9BA2AA_55%,#8E959C_100%)] " +
    "hover:bg-[linear-gradient(180deg,#B7BEC5_0%,#A4ABB3_55%,#979EA5_100%)] " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_0_-1px_#6F767E,0_22px_26px_-12px_rgba(16,24,40,0.34)] " +
    "active:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_5px_0_-1px_#6F767E,0_13px_17px_-10px_rgba(16,24,40,0.3)]",
} as const;

/**
 * The glyph for each status, following `statusPresets` in `badge.tsx`.
 *
 * The same pairing, one size down and without the capsule: a badge is a raised
 * white pill, and six of them stacked in a rail would be six competing
 * highlights (rule 3) on top of six bezels that are already objects.
 */
const statusGlyphs: Record<
  ProjectStatus,
  { icon: typeof CircleCheck; tone: string; spin?: boolean }
> = {
  ready: { icon: CircleCheck, tone: "text-success" },
  preview: { icon: Eye, tone: "text-ink-tertiary" },
  inProgress: { icon: LoaderCircle, tone: "text-accent", spin: true },
};

export function ProjectButtons({
  selected,
  onSelect,
  className,
}: {
  selected: ProjectId;
  onSelect: (id: ProjectId) => void;
  className?: string;
}) {
  const copy = useCopy();
  const windowRef = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState({ more: false, atEnd: false });

  /**
   * What the notch should say, read off the window rather than counted.
   *
   * How many cards fit is a function of the viewport, so it is not a number this
   * component is allowed to know. The window measures itself — on mount, on
   * resize, and after every move — and the notch follows.
   */
  useEffect(() => {
    const el = windowRef.current;
    if (!el) return;

    const read = () => {
      const room = el.scrollHeight - el.clientHeight;
      setTravel({ more: room > 2, atEnd: el.scrollTop >= room - 2 });
    };

    read();
    el.addEventListener("scroll", read, { passive: true });
    const observer = new ResizeObserver(read);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => {
      el.removeEventListener("scroll", read);
      observer.disconnect();
    };
  }, []);

  const advance = useCallback(() => {
    const el = windowRef.current;
    if (!el) return;
    if (travel.atEnd) el.scrollTo({ top: 0, behavior: "smooth" });
    else el.scrollBy({ top: el.clientHeight, behavior: "smooth" });
  }, [travel.atEnd]);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      {/* The window.

          `overflow-y: auto` with the bar taken away rather than `overflow:
          hidden`. Hidden would also work — the notch drives this by script and a
          hidden box still scrolls under program control — but it would take the
          wheel away from the rail as well, and the wheel is the one gesture a
          list this shape invites. What the page must not do is scroll; the rail
          is welcome to.

          The horizontal padding is not decoration: the cards cast their shadow
          sideways and a scroll container clips on every side, so the room the
          shadow needs has to be inside the box. The bottom padding carries the
          deepest ledge on the screen — ten pixels of it — plus its cast. */}
      <div
        ref={windowRef}
        id="ws-project-window"
        className="scroll-quiet min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pt-1 pb-3"
      >
        <ul className="flex flex-col gap-5">
          {projects.map((project) => {
            const isSelected = project.id === selected;
            const words = copy.projects[project.id];
            const status = statusGlyphs[project.status];
            const Glyph = status.icon;

            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => onSelect(project.id)}
                  aria-current={isSelected ? "true" : undefined}
                  className={cn(
                    "focus-visible:ring-focus duration-instant ease-out-soft block w-full text-left transition-transform",
                    /* Half the ledge, so the card lands on it. */
                    "active:translate-y-[5px]",
                  )}
                >
                  <span
                    className={cn(
                      "duration-instant ease-out-soft block aspect-[1.62] rounded-[22px] p-[12px] transition-all",
                      isSelected ? BAND.selected : BAND.resting,
                    )}
                  >
                    {/* The panel, sunk into the bezel. Whatever a card comes to
                        say, it says it here — the band never carries content. */}
                    <span className="bg-surface flex h-full w-full flex-col justify-between rounded-[10px] px-3.5 py-3 shadow-[inset_0_2px_3px_rgba(16,24,40,0.14)]">
                      {/* Where it sits in the ladder, and whether it opens. */}
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-ink-tertiary tnum font-mono text-[11px] leading-none tracking-[0.02em] uppercase">
                          {copy.library.chapter(project.chapter)}
                        </span>
                        <span className="text-caption text-ink flex shrink-0 items-center gap-1.5">
                          <Glyph
                            size={icon.xs}
                            strokeWidth={icon.strokeWidth}
                            aria-hidden="true"
                            className={cn(
                              "shrink-0",
                              status.tone,
                              status.spin && "motion-safe:animate-spin",
                            )}
                          />
                          {copy.status[project.status]}
                        </span>
                      </span>

                      <span className="min-w-0">
                        <span className="font-condensed text-ink block text-[19px] leading-[1.08] font-bold tracking-[0.01em] uppercase">
                          {words.name}
                        </span>
                        <span className="text-ink-tertiary tnum mt-[7px] block truncate font-mono text-[11px] leading-none">
                          {copy.library.minutes(project.minutes)} ·{" "}
                          {copy.library.stepsCount(project.stepCount)}
                        </span>
                      </span>

                      {/* The kit, as a tray. Three marks in chapter one, six in
                          chapter six: the ladder, visible without reading. */}
                      <span className="bg-surface-sunken flex h-[38px] items-center gap-0.5 rounded-md px-2.5">
                        {project.components.map((id) => (
                          <ComponentIcon key={id} id={id} size={24} />
                        ))}
                        <span className="text-ink-tertiary tnum ml-auto pl-2 font-mono text-[11px] leading-none">
                          {copy.library.partsCount(project.components.length)}
                        </span>
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The notch. Short, wide and cut into the bottom of the rail, so it reads
          as part of the rail's furniture rather than as a seventh card. */}
      {travel.more ? (
        <button
          type="button"
          onClick={advance}
          aria-controls="ws-project-window"
          aria-label={
            travel.atEnd ? copy.workspace.firstProjects : copy.workspace.moreProjects
          }
          className={cn(
            "focus-visible:ring-focus duration-instant ease-out-soft mx-2 mt-1.5 grid h-8 shrink-0 cursor-pointer place-items-center rounded-t-[6px] rounded-b-[16px] transition-all",
            "bg-[#C4CBD2] hover:bg-[#B2BAC2] active:translate-y-[2px]",
            "shadow-[0_3px_0_-1px_#A3ACB5] active:shadow-[0_1px_0_-1px_#A3ACB5]",
          )}
        >
          <ChevronDown
            size={icon.sm}
            strokeWidth={icon.strokeWidth}
            aria-hidden="true"
            className={cn(
              "text-ink-secondary duration-deliberate ease-out-soft transition-transform",
              travel.atEnd && "rotate-180",
            )}
          />
        </button>
      ) : null}
    </div>
  );
}
