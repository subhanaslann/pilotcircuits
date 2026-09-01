"use client";

import { AgentMark } from "@/components/ui/brand-marks";
import { Panel } from "@/components/ui/card";
import { Divider } from "@/components/ui/text";
import { brand } from "@/content/brand";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * W-03 · The third column.
 *
 * What the agent *is*, on the screen where you are choosing what to build. Not
 * what it can call — what it can do.
 *
 * ## Why there are no tool names here
 *
 * The panel this replaces showed the agent's step state from a build on another
 * route, and the draft after it printed all ten tool names with their purposes.
 * Both were answering a question nobody standing here is asking. Somebody
 * picking a kit has not met the agent yet; the first thing to say is not *which
 * six functions the workbench registers*, it is **that a web page can hand an
 * AI its own buttons at all**. The vocabulary belongs at the bench, where it is
 * about to be used, and it is already there.
 *
 * ## Why the last line is the best line
 *
 * `limit` is not a disclaimer bolted on at the end. The whole reason WebMCP is
 * worth explaining is that the capability is *granted*: the agent has exactly
 * the reach the page decided to give it and no more. Said plainly, that is the
 * most reassuring sentence on the screen, so it gets the pinned foot rather
 * than being buried as small print.
 */
export function CoachWebMcp({ className }: { className?: string }) {
  const copy = useCopy();

  const can = [
    copy.coach.canLook,
    copy.coach.canFind,
    copy.coach.canShow,
    copy.coach.canCheck,
  ];

  return (
    <Panel
      ariaLabel={brand.agentName}
      className={cn("rounded-xl", className)}
      bodyClassName="px-5 py-4"
      header={
        <div className="flex items-center gap-2.5">
          <AgentMark size={26} />
          <h2 className="text-h3 text-ink min-w-0 truncate">
            {brand.agentName}
          </h2>
        </div>
      }
      footer={
        <p className="text-body-sm text-ink-tertiary">{copy.coach.limit}</p>
      }
    >
      <h3 className="font-condensed text-ink text-[23px] leading-[1.1] font-bold tracking-[0.01em] uppercase">
        {copy.coach.title}
      </h3>

      <p className="text-body text-ink-secondary mt-3.5">{copy.coach.lead}</p>
      <p className="text-body text-ink-secondary mt-2.5">{copy.coach.body}</p>

      <Divider className="mt-6" />

      <p className="text-overline text-ink-tertiary mt-5 uppercase">
        {copy.coach.canTitle}
      </p>

      {/* Four short sentences, one mark each. The mark is the same dot the
          activity log uses for a step the agent took, which is the only place
          this panel touches the agent's own vocabulary — and it does it in
          shapes rather than in words. */}
      <ul className="mt-3.5 space-y-3">
        {can.map((line) => (
          <li key={line} className="flex items-baseline gap-3">
            <span
              aria-hidden="true"
              className="bg-accent mt-1.5 block size-2 shrink-0 rounded-full"
            />
            <span className="text-body text-ink">{line}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
