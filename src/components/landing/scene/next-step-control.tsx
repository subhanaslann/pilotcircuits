"use client";

import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * S-01 · The one action, under the bench.
 *
 * It used to be a blue capsule in the middle of a white card under the build
 * sheet — a dashboard's idea of a call to action. Then it was a moulded plate
 * of its own at the bench's front-right corner, with a rectangular button
 * screwed to it: the one control in the product not drawn as A-01, on the
 * argument that a capsule floating over a cutting mat reads as an interface
 * pasted onto a photograph.
 *
 * Looked at beside the capsule that asks for the repair, it did not hold. The
 * plate was a second button language — a different radius, a different face,
 * a different plate — a hand's width from the first, and the screen read as
 * two products. So this is A-01 now, exactly as `Fix the wire` is: the same
 * capsule on the same raised plate.
 *
 * And it stands *under* the bench rather than on it, at the mat's right edge.
 * Tried on the mat first, in the corner the plate had: A-01's `lg` is wider
 * than that corner at every width the column actually takes, and the capsule
 * sat on the Uno's power header — a control covering a part of the very build
 * it is about. Under the mat it is the bench's caption line, the way the ask
 * beside it ends in its own capsule under its own words, and the drawing is
 * a drawing again with nothing pasted onto it.
 *
 * ## Where it goes
 *
 * `/workspace` — the picker: six builds, the selected kit in its case, the
 * agent beside it, and the door into the bench at the foot of the third
 * column. Until this pass it went straight to chapter six's bench, on the
 * reasoning that the bench above *is* chapter six. But *start the training*
 * is a promise about a course, not about one chapter, and a stranger sent
 * from the entry screen onto the capstone bench — fourteen wires, no idea
 * which of the six this is — had been thrown into the deep end by the one
 * button that said it would not. The workspace is where the choice is made,
 * and it is the screen the bench's own Back button returns to, so the two
 * doors now meet in one place.
 *
 * A real link, so it can be opened in a new tab and read by a screen reader
 * as a destination. It no longer names a step: a build in progress is offered
 * again on the workspace, by the control that knows which bench is waiting.
 */
export function NextStepControl({ className }: { className?: string }) {
  const copy = useCopy();

  return (
    <div
      className={cn(
        /* Under the mat's right edge; centred on a phone, where the bench is
           the width of the screen and a right-aligned button is a button in
           the gutter. */
        "mt-4 flex justify-center md:justify-end",
        className,
      )}
    >
      <ButtonLink
        href="/workspace"
        variant="primary"
        size="lg"
        iconRight={
          <ArrowRight
            size={icon.sm}
            strokeWidth={icon.strokeWidth}
            aria-hidden="true"
          />
        }
      >
        {copy.landing.cta}
      </ButtonLink>
    </div>
  );
}
