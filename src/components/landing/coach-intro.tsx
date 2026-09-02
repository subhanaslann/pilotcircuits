import { CoachFigure } from "@/components/agent/coach-figure";
import { getServerCopy } from "@/content/copy-server";
import type { Copy } from "@/content/i18n";
import type { CoachMood } from "@/lib/agent/coach";
import { toolAct, workbenchTools } from "@/lib/agent/model";
import { cn } from "@/lib/utils/cn";

/**
 * S-01 · The agent, introduced.
 *
 * A stranger has just watched a ring leave a lamp, fix a wire and go back to
 * it. This band says what they watched — and it says it in the product's own
 * register rather than a marketing one: the figure itself, drawn live in each
 * of the five faces a call can give it (`coach-figure.tsx`, the same component
 * that stands on the bench), with the sentence the bench prints beside that
 * face and the tools that put it there.
 *
 * ## Nothing here is written for this band
 *
 * The sentences are `agentPanel.coach`, the tools are read off `toolAct` —
 * the table the bench itself consults to choose a face — and their names are
 * the titles the timeline prints. So this cannot describe a face the agent
 * never makes, or credit a tool that does not exist; the same rule the ledger
 * under it keeps for chapters and minutes.
 *
 * ## Five, not eleven
 *
 * The coach has eleven moods. Five are the *acts* — what the agent is doing
 * while a call runs — and they are the cast. The two rest states are said in
 * a sentence under the row rather than drawn (a row of seven is a chart), and
 * the three reactions are verdicts about a build, which a person without a
 * build has no use for yet. `moving` is an act, but on the bench it is the
 * panel walking to the next step, and a face for "the page is scrolling" is
 * not what a stranger needs to know.
 *
 * ## Rule 4, rule 3
 *
 * No card under any figure, no fill, no frame: five figures on the paper,
 * each over its own words, the hairline above carrying the section. The one
 * colour on the band is the agent's blue in the figures; every word is ink.
 */

/** The faces, in the order a call goes through them. */
const CAST: readonly CoachMood[] = [
  "looking",
  "thinking",
  "showing",
  "touching",
  "testing",
];

export async function CoachIntro({ className }: { className?: string }) {
  const copy = await getServerCopy();

  return (
    <div className={className}>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-5">
        {CAST.map((mood) => (
          <li key={mood} className="flex min-w-0 flex-col items-start gap-3">
            <CoachFigure mood={mood} size={72} />
            <div className="min-w-0">
              <p className="text-body-sm text-ink leading-tight font-medium">
                {copy.agentPanel.coach[mood]}
              </p>
              <p className={cn("text-caption text-ink-tertiary mt-1")}>
                {wearers(mood, copy)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-caption text-ink-tertiary mt-6">
        {copy.landing.coachRest}
      </p>
    </div>
  );
}

/**
 * What puts this face on: the bench tools whose act it is, by the titles the
 * timeline prints — or, for the one mood that is a phase rather than a tool,
 * the phase sentence itself.
 */
function wearers(mood: CoachMood, copy: Copy): string {
  if (mood === "thinking") return copy.agentPanel.phases.comparingSketch;
  return workbenchTools
    .filter((tool) => toolAct[tool] === mood)
    .map((tool) => copy.agentPanel.toolTitles[tool])
    .join(" · ");
}
