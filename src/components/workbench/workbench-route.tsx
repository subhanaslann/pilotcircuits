"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBuild } from "@/components/build/build-provider";
import { useWebMcpTools } from "@/components/agent/use-webmcp";
import { workbenchTools } from "@/lib/agent/model";
import { Workbench } from "@/components/workbench/live-workbench";
import { useWideEnough } from "@/components/workbench/frame";
import { briefingFor } from "@/lib/agent/briefings";
import { buildFor } from "@/lib/agent/builds";
import type { ProjectId } from "@/lib/projects/catalog";

/**
 * S-04 · The workbench, mounted against the build the product is carrying.
 *
 * Three things this does that the component below it must not:
 *
 * **It fills the viewport.** `h-dvh` rather than `h-screen`, because on a
 * phone the browser chrome moves and `100vh` is the height the page had before
 * it did — and the whole frame below depends on knowing exactly how tall it is.
 * `min-h-0` because the body is a flex column: without it this child would
 * refuse to shrink below its content and the page would grow a second
 * scrollbar behind a screen that already scrolls in four places.
 *
 * **It starts the clock.** A person who types this URL has started the build
 * just as much as one who pressed `Start build` on the project page. The action
 * is idempotent, so arriving from either direction is one start.
 *
 * **It hands the browser the six tools that can act here.** §9 keeps a tool on
 * the page that can honour it, and every one of these moves something on this
 * screen.
 *
 * **It hands over the canvas handles.** They belong to the provider, so the
 * agent's focus outlives this mount — and when the person walks to the summary,
 * React writes `null` back into them and the effects that would have moved a
 * camera quietly find nothing to move.
 */
export function WorkbenchRoute({
  slug,
  projectId,
}: {
  slug: string;
  projectId: ProjectId;
}) {
  const router = useRouter();
  const { session, canvasRef, cameraRef, briefedProjectId, markBriefed } =
    useBuild();
  const wide = useWideEnough();

  /**
   * Whether this arrival opens with the briefing.
   *
   * Decided **once, at mount**, and off the *route's* `projectId` rather than
   * the session's: `openBuild` runs in an effect, so on the first render after
   * walking in from another chapter the session still names the one you left.
   * Deciding once is also what stops widening the window past 1120px
   * mid-session from opening a briefing over a bench somebody is using.
   *
   * Not constructed at all on a narrow screen. `WorkbenchFrame` does not render
   * the workspace region there, and `useWideEnough`'s server snapshot is
   * `true` — so a narrow client renders the wide tree for one commit, and a
   * briefing built inside it would mount, move focus to a heading, and unmount,
   * dropping the caret on `<body>`.
   */
  const [opensWithBriefing] = useState(
    () => briefedProjectId !== projectId && Boolean(briefingFor(projectId)),
  );

  /* Two facts, not one. `opensWithBriefing` is decided once and answers "did
     this arrival open with a briefing"; `briefedProjectId` is live and answers
     "is it still up". Only the first may be frozen — freezing both would leave
     `Başla` with nothing to close. */
  const briefing =
    wide && opensWithBriefing && briefedProjectId !== projectId
      ? briefingFor(projectId)
      : undefined;

  useWebMcpTools(workbenchTools);

  /* Which build this bench is for. Idempotent when it is the one already on
     the bench, so arriving here twice is one build; walking into a different
     chapter starts that chapter over. */
  const build = buildFor(projectId);
  useEffect(() => {
    if (build) session.openBuild(build);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  /* Once per arrival. `start` is a plain function rather than a `useCallback`
     (this project compiles with the React Compiler), so listing it as a
     dependency would run this on every render; the action is idempotent, but a
     dispatch per frame is not something to lean on. */
  useEffect(() => {
    session.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-dvh min-h-0 flex-col">
      <Workbench
        session={session}
        canvas={canvasRef}
        camera={cameraRef}
        /**
         * Back goes to the picker, not to the chapter's page.
         *
         * The bench is reached from `/workspace` — that is where the chapter
         * was chosen and its kit opened, and it is where the entry screen now
         * sends anybody starting out. Sending the one way back to
         * `/projects/[slug]` dropped people on a page they had never seen, with
         * a `Start building` button for the build they were already standing
         * at. The chapter's page is still reachable from `/projects`, which is
         * the list it belongs to.
         */
        backHref="/workspace"
        briefing={briefing}
        onBriefed={() => markBriefed(projectId)}
        onFinish={() => router.push(`/complete/${slug}`)}
        className="min-h-0 flex-1"
      />
    </div>
  );
}
