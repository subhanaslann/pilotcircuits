"use client";

import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";
import { hasBench } from "@/lib/agent/builds";
import {
  featuredProjectId,
  projectById,
  type ProjectDef,
} from "@/lib/projects/catalog";

/**
 * W-04 · The way out of the picker.
 *
 * One button, and its label is the name of the build it opens.
 *
 * ## Why the name is on the button
 *
 * The rail selects a chapter, the middle column shows that chapter's kit, and
 * until now the only way into a bench was a button that said `ENTER THE
 * WORKSHOP` — buried inside the inventory, so you had to open the case before
 * the product would tell you there was a way in at all. A screen whose entire
 * job is choosing what to build should not hide the door behind an
 * interaction, and the door should say where it leads.
 *
 * ## Why it does not always name the selected chapter
 *
 * Five of the six chapters are `preview`: their kits are real and drawn, but
 * they have no guided bench, and `/workbench/[slug]` returns a `404` for them
 * rather than opening an empty one. So a button that named the selection would
 * be a promise the router refuses to keep.
 *
 * The alternative — greying it out — is ruled out twice over: `ButtonLink` has
 * no disabled state on purpose ("a destination that is not available yet is not
 * a faded link, it is a link that is not there"), and §18 does not let a
 * disabled control be the only place a fact lives.
 *
 * So the button names the bench that actually opens, and when that is not the
 * chapter you picked, the line under it says which chapter is waiting. That
 * sentence used to be the tail of `previewNote` over in the kit column; it
 * belongs here, next to the control it is about.
 */
export function StartBuild({
  selected,
  className,
}: {
  selected: ProjectDef;
  className?: string;
}) {
  const copy = useCopy();

  /* The selection wins whenever it has a bench; the capstone catches the rest.
     One rule, so a chapter starts being offered the moment it gets a bench and
     nothing here has to be edited to notice. */
  const target = hasBench(selected.id)
    ? selected
    : projectById(featuredProjectId);
  const elsewhere = target.id !== selected.id;

  return (
    <section aria-labelledby="ws-start" className={className}>
      <h2 id="ws-start" className="text-overline text-ink-tertiary uppercase">
        {copy.workspace.startTitle}
      </h2>

      <ButtonLink
        href={`/workbench/${target.slug}`}
        variant="primary"
        size="lg"
        block
        iconRight={
          <ArrowRight
            size={icon.sm}
            strokeWidth={icon.strokeWidth}
            aria-hidden="true"
          />
        }
        className="font-condensed mt-3 tracking-[0.04em] uppercase"
      >
        {copy.projects[target.id].name}
      </ButtonLink>

      {elsewhere ? (
        <p className="text-body-sm text-ink-tertiary mt-2.5">
          {copy.workspace.noBenchYet(copy.projects[selected.id].name)}
        </p>
      ) : null}
    </section>
  );
}
