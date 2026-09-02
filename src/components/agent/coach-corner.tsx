"use client";

import {
  CoachFigure,
  defaultSilhouette,
  type CoachSilhouette,
} from "@/components/agent/coach-figure";
import type { CoachMood } from "@/lib/agent/coach";
import { cn } from "@/lib/utils/cn";

/**
 * G-16 · The coach in its corner: the figure, and the word for its mood.
 *
 * The figure alone would break rule 7 — a face is one signal, and an
 * expression read wrong is a person told the wrong thing about their build.
 * So the mood is also *said*, in the reader's language, beside the face, and
 * under it the phase the handler is in (`Comparing against the sketch`) while
 * a call runs. Those are the same phase sentences the activity timeline
 * prints under a running row; this is the first time they are on the bench
 * rather than in a tab.
 *
 * Two grounds, because it stands in two places. On a chapter with a kit it is
 * the last thing on the shelf, and the shelf is its plate. On the capstone
 * there is no shelf, so it brings the shelf's own colours with it as a plate
 * of its own — the same dark, the same hairline — rather than standing bare
 * on the mat where the ring works.
 */
/** The mat plate's height: a 56px figure, 8px of padding above and below, and the hairline. */
export const COACH_PLATE_HEIGHT = 74;

export function CoachCorner({
  mood,
  silhouette = defaultSilhouette,
  line,
  detail,
  ground = "shelf",
  className,
}: {
  mood: CoachMood;
  silhouette?: CoachSilhouette;
  /** The mood, as a sentence. `copy.agentPanel.coach[mood]`. */
  line: string;
  /** The phase or the tool under it, while a call runs. */
  detail?: string;
  ground?: "shelf" | "mat";
  className?: string;
}) {
  return (
    <div
      data-mood={mood}
      className={cn(
        "flex items-center gap-3",
        ground === "mat" &&
          "shadow-e2 rounded-xl border border-[#4E5C66] bg-[#333E46]/95 py-2 pr-4 pl-3",
        className,
      )}
    >
      {/* The ring's home. `use-agent-mascot.ts` measures this box to send the
          ring out from the figure and back to it, so the figure on the shelf
          and the ring on the bench are one agent rather than two. On a
          wrapper of its own because it is the figure the ring leaves from,
          not the words beside it. */}
      <span data-coach-figure className="flex shrink-0">
        <CoachFigure mood={mood} silhouette={silhouette} size={56} />
      </span>
      <div className="min-w-0 max-w-[168px]">
        {/* Keyed on the mood so the sentence is seen to change (rule 6) — the
            same device the panel's pinned action uses for its label. */}
        <p
          key={mood}
          className="text-body-sm motion-expand leading-tight font-medium text-[#E6ECF0]"
        >
          {line}
        </p>
        {detail ? (
          <p className="text-caption mt-0.5 line-clamp-2 text-[#B4C0C9]">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}
