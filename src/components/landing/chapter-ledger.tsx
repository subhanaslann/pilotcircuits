import { CircleCheck, Eye, LoaderCircle } from "lucide-react";
import { getServerCopy } from "@/content/copy-server";
import { icon } from "@/lib/design/tokens";
import {
  featuredProjectId,
  projects,
  type ProjectStatus,
} from "@/lib/projects/catalog";
import { cn } from "@/lib/utils/cn";

/**
 * S-01 · The ladder, under the bench.
 *
 * ## Why a ledger and not six cards
 *
 * The screens above this one are a bench, a build sheet and a terminal, and the
 * whole argument of the entry screen is that it is **one surface** rather than a
 * collection of panels. Six white cards under it would have taken that back on
 * the last scroll of the page — so the catalogue is printed in the register the
 * page already speaks: banded rows, condensed names, mono values, exactly like
 * the diagnostics strip at the top (`diagnostics-strip.tsx`, same two grounds,
 * same figures).
 *
 * The drawings are not lost, they are simply not *here*: `project-scenes.tsx`
 * is what the library screen is for, where a person is choosing rather than
 * being introduced.
 *
 * ## What it is allowed to say
 *
 * Every column is read from `catalog.ts` — the chapter, the minutes, the size
 * of the parts list, the status — so the ladder on this page cannot disagree
 * with the ladder the product walks you up. The one column that is not a number
 * is `adds`, which is the chapter's single new idea in the dictionary's own
 * words; it exists because a ladder whose rungs are not named is just a list.
 *
 * A real `<table>`, because this is a table: six rows against six columns,
 * compared down as much as read across. `dl` was right for the strip (pairs)
 * and would be a lie here.
 */

/**
 * The glyph for each status, following `statusPresets` in `badge.tsx`.
 *
 * The same pairing, one size down and without the capsule: a badge is a raised
 * white pill and six of them in a table would be six competing highlights
 * (rule 3). The word carries the state, the glyph confirms it (rule 7).
 */
const statusGlyphs: Record<
  ProjectStatus,
  { icon: typeof CircleCheck; tone: string; spin?: boolean }
> = {
  ready: { icon: CircleCheck, tone: "text-success" },
  preview: { icon: Eye, tone: "text-ink-tertiary" },
  inProgress: { icon: LoaderCircle, tone: "text-accent", spin: true },
};

export async function ChapterLedger({ className }: { className?: string }) {
  const copy = await getServerCopy();

  return (
    <div className={className}>
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">{copy.landing.ledgerCaption}</caption>
        {/* Six columns on a desk, three on a phone. A column is dropped by
            giving it no width *and* hiding its cells: `table-fixed` keeps a
            column's width even when every cell in it is `display: none`, so
            hiding alone would leave a gap where the column used to be. */}
        <colgroup>
          <col className="w-[68px] sm:w-[76px]" />
          <col className="w-auto sm:w-[30%]" />
          <col className="w-0 sm:w-auto" />
          <col className="w-0 sm:w-[68px]" />
          <col className="w-0 sm:w-[84px]" />
          <col className="w-[104px] sm:w-[108px]" />
        </colgroup>

        <thead>
          <tr className="text-overline text-ink-tertiary uppercase">
            <th scope="col" className="px-3 pb-2 text-left font-semibold">
              {copy.landing.ledgerChapter}
            </th>
            <th scope="col" className="pb-2 text-left font-semibold">
              {copy.landing.ledgerBuild}
            </th>
            {/* What goes when the measure narrows: the sentence first, then the
                two figures — which do not disappear, they move under the name
                (below). Chapter, build and status stay, because those three are
                the ladder. */}
            <th
              scope="col"
              className="hidden pb-2 text-left font-semibold sm:table-cell"
            >
              {copy.landing.ledgerAdds}
            </th>
            <th
              scope="col"
              className="hidden pb-2 text-left font-semibold sm:table-cell"
            >
              {copy.landing.ledgerTime}
            </th>
            <th
              scope="col"
              className="hidden pb-2 text-left font-semibold sm:table-cell"
            >
              {copy.landing.ledgerParts}
            </th>
            <th scope="col" className="pr-3 pb-2 text-left font-semibold">
              {copy.landing.ledgerStatus}
            </th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project, index) => {
            const words = copy.projects[project.id];
            const status = statusGlyphs[project.status];
            const Glyph = status.icon;
            /* The build the bench above is running. Read from the catalogue
               rather than named here, so moving the featured build moves the
               marked row with it. */
            const onTheBench = project.id === featuredProjectId;

            return (
              <tr
                key={project.id}
                className={cn(
                  "[&>td]:h-12 sm:[&>td]:h-10",
                  /* Two grounds, alternating — the strip's own banding, which
                     is what makes six dense rows scannable without a rule
                     between each of them. */
                  index % 2 === 0 ? "bg-paper-row" : "bg-paper-row-alt",
                )}
              >
                <td
                  className={cn(
                    "tnum px-3 font-mono text-[12.5px] leading-none",
                    onTheBench
                      ? "text-accent shadow-[inset_3px_0_0_0_var(--color-accent)]"
                      : "text-ink-tertiary",
                  )}
                >
                  {String(project.chapter).padStart(2, "0")}
                </td>
                <td className="text-ink truncate pr-3">
                  <span className="font-condensed block truncate text-[15px] leading-none font-semibold uppercase sm:text-[17px]">
                    {words.name}
                  </span>
                  {/* The two figures, back under the name once their columns
                      are gone. Same values, same faces — a phone loses the
                      table, never a fact. */}
                  <span className="text-ink-tertiary tnum mt-1 block truncate font-mono text-[11px] leading-none sm:hidden">
                    {copy.library.minutes(project.minutes)} ·{" "}
                    {copy.library.partsCount(project.components.length)}
                  </span>
                </td>
                <td className="text-caption text-ink-secondary hidden truncate pr-3 sm:table-cell">
                  {words.adds}
                </td>
                <td className="text-ink tnum hidden font-mono text-[12.5px] leading-none sm:table-cell">
                  {copy.library.minutes(project.minutes)}
                </td>
                <td className="text-ink tnum hidden font-mono text-[12.5px] leading-none sm:table-cell">
                  {copy.library.partsCount(project.components.length)}
                </td>
                <td className="text-caption text-ink pr-3">
                  <span className="flex items-center gap-1.5">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-caption text-ink-tertiary mt-2.5 px-3">
        {copy.landing.ledgerBench}
      </p>
    </div>
  );
}
