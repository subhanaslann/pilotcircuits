"use client";

import { ArrowRight } from "lucide-react";
import { ContinueCard } from "@/components/library/project-blocks";
import { ProjectCard } from "@/components/library/project-card";
import { ButtonLink } from "@/components/ui/button";
import { useBuildSession } from "@/components/build/build-provider";
import { useCopy } from "@/content/copy-provider";
import { projectById, featuredProjectId } from "@/lib/projects/catalog";
import { icon } from "@/lib/design/tokens";

/**
 * S-01 · The dashboard's two calls to action, and the card behind them.
 *
 * The only client island on this screen, and it exists for one sentence.
 * §5 asks the primary action to read `Continue smart barrier` — but a build
 * nobody has opened is not something to continue, and an interface that offers
 * to resume a session it does not have is the same class of untruth as a
 * `WebMCP ready` badge nobody checked. So the wording follows the build:
 * `Continue` once there is one, `Start` before that.
 *
 * The continue card (P-03) follows the same rule and simply is not there yet.
 * That is also why it is not a placeholder: an empty "you have no builds" panel
 * would take the space the suggested projects want, to say nothing.
 *
 * The session lives in memory only, so a reload puts this back to `Start`.
 * §2 rules out a database in this phase, and the honest consequence of that is
 * a dashboard that forgets — which is better than one that pretends to
 * remember.
 */
export function ContinueSection() {
  const copy = useCopy();
  const session = useBuildSession();
  const project = projectById(featuredProjectId);

  const started = session.state.startedAt !== null;
  const href = `/workbench/${project.slug}`;

  return (
    <>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <ButtonLink
          href={started ? href : `/projects/${project.slug}`}
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
          {started ? copy.dashboard.primaryCta : copy.dashboard.startCta}
        </ButtonLink>
        <ButtonLink href="/projects" variant="secondary" size="lg">
          {copy.dashboard.secondaryCta}
        </ButtonLink>
      </div>

      {/* The one ready build always has a card here, and which card it is says
          where you stand: P-03's continue card once there is progress to show,
          P-01's plain card before that. The suggested grid below is the other
          six either way, so the barrier is never on this page twice. */}
      <div className="mt-10 max-w-[640px]">
        {started ? (
          <ContinueCard project={project} steps={session.steps} href={href} />
        ) : (
          <ProjectCard
            project={project}
            copy={copy}
            href={`/projects/${project.slug}`}
          />
        )}
      </div>
    </>
  );
}
