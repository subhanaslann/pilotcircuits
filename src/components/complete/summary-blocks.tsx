"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy as CopyIcon } from "lucide-react";
import { KnowledgeCheck } from "@/components/agent/guidance";
import { ProjectScene } from "@/components/illustration/project-scenes";
import { LearningGoals } from "@/components/library/project-blocks";
import { Button, ButtonLink } from "@/components/ui/button";
import { TestStatusChip } from "@/components/device/test-status";
import { Alert } from "@/components/ui/status";
import { Divider } from "@/components/ui/text";
import { useBuildSession } from "@/components/build/build-provider";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";
import type { ProjectDef } from "@/lib/projects/catalog";

/**
 * S-05 · What the build left behind.
 *
 * Four figures, and not four cards. Rule 4 asks the question before any
 * container goes down — *can I say this without a box?* — and these are the
 * interface reporting on itself, which is the case the rule answers with a flat
 * ground every time. So: a label above, a value below, a hairline between them,
 * and nothing drawn around any of it. The numbers are mono because they are
 * measurements (rule 13); the words around them are not.
 *
 * Where each figure comes from matters more than how it looks:
 *
 *   **Time spent** — `completedAt − startedAt`, two stamps taken when those
 *   things happened. Never a clock read during render, which would disagree
 *   between the server's paint and the browser's.
 *
 *   **Issues fixed** — a counter incremented the moment a person puts something
 *   right. It cannot be derived after the fact: `verify_current_step` drops a
 *   step's findings on its way out, so by the time the build is finished there
 *   is nothing left to count.
 *
 *   **Concepts** — the project's own list, so this one is true whether or not
 *   there is a session behind the page.
 *
 *   **Test result** — D-07's chip, unchanged. The dock's verdict survives the
 *   walk from the workbench because the session that holds it never unmounted.
 *
 * Opened without a build — a bookmark, a reload, a reviewer typing the URL —
 * the page still renders and says so. The alternative was a redirect, which
 * hides a whole screen from anyone who has not just finished a build, or
 * invented figures, which is worse than either.
 */

function Figure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-overline text-ink-tertiary uppercase">{label}</p>
      <div className="mt-1.5 flex h-9 items-center">{children}</div>
    </div>
  );
}

/** A measurement, at the size A-15 uses for the one number that matters. */
function Value({ children }: { children: ReactNode }) {
  return (
    <span className="text-ink tnum font-mono text-[28px] leading-none font-medium">
      {children}
    </span>
  );
}

export function BuildSummary({ project }: { project: ProjectDef }) {
  const copy = useCopy();
  const session = useBuildSession();
  const { state } = session;
  const [copied, setCopied] = useState(false);

  const ran = state.startedAt !== null && state.completedAt !== null;
  /* Rounded up, and never to zero: a build that took forty seconds took a
     minute as far as a summary is concerned, and `0 dk` reads as a bug. */
  const minutes = ran
    ? Math.max(1, Math.round((state.completedAt! - state.startedAt!) / 60000))
    : project.minutes;

  const share = () => {
    const lines = [
      copy.complete.shareHeading(copy.projects[project.id].name),
      `${copy.complete.timeSpent}: ${copy.library.minutes(minutes)}`,
      `${copy.complete.issuesFixed}: ${copy.complete.issuesCount(state.repairs)}`,
      `${copy.complete.conceptsLearned}: ${copy.complete.conceptsCount(project.concepts.length)}`,
      `${copy.complete.testResult}: ${copy.device.states[session.testRun.status]}`,
    ].join("\n");

    void navigator.clipboard?.writeText(lines).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div className="bg-surface-sunken border-border mt-8 grid place-items-center overflow-hidden rounded-xl border py-8">
        <ProjectScene id={project.id} width={480} />
      </div>

      {!ran ? <Alert tone="info" title={copy.complete.noSession} className="mt-8">
        {copy.complete.noSessionDetail}
      </Alert> : null}

      {/* Who made this build.

          The agent can place a lead now, and on this screen that matters more
          than anywhere else: it is the page that says you finished. Shown only
          when it happened, and counted rather than judged — one lead when you
          were stuck and a whole chapter built for you are different things, and
          the number is the only honest way to tell them apart. */}
      {state.assistedEdits > 0 ? (
        <Alert
          tone="info"
          title={copy.complete.assisted(state.assistedEdits)}
          className="mt-8"
        >
          {copy.complete.assistedDetail}
        </Alert>
      ) : null}

      <Divider className="mt-8" />
      <div className="grid grid-cols-2 gap-6 py-6 sm:grid-cols-4">
        <Figure label={copy.complete.timeSpent}>
          <Value>{copy.library.minutes(minutes)}</Value>
        </Figure>
        <Figure label={copy.complete.issuesFixed}>
          <Value>{state.repairs}</Value>
        </Figure>
        <Figure label={copy.complete.conceptsLearned}>
          <Value>{project.concepts.length}</Value>
        </Figure>
        <Figure label={copy.complete.testResult}>
          <TestStatusChip status={session.testRun.status} />
        </Figure>
      </div>
      <Divider />

      <LearningGoals
        className="mt-10"
        concepts={project.concepts.map((id) => copy.concepts[id])}
      />

      {/* G-12, unchanged — only given a measure. It was drawn full-bleed for a
          360px panel; left to itself on a 1360px page it would be a band across
          the whole window rather than a change of ground for one passage. */}
      <div className="mt-10 max-w-[560px]">
        <KnowledgeCheck projectId={project.id} />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <ButtonLink href="/projects" variant="primary" size="lg">
          {copy.complete.tryAnother}
        </ButtonLink>
        <ButtonLink href={`/workbench/${project.slug}`} variant="secondary">
          {copy.complete.reopen}
        </ButtonLink>
        <Button
          variant="tertiary"
          onClick={share}
          iconLeft={
            copied ? (
              <Check
                size={icon.sm}
                strokeWidth={icon.strokeWidth}
                aria-hidden="true"
              />
            ) : (
              <CopyIcon
                size={icon.sm}
                strokeWidth={icon.strokeWidth}
                aria-hidden="true"
              />
            )
          }
        >
          {copied ? copy.complete.shareCopied : copy.complete.share}
        </Button>
      </div>
    </>
  );
}
