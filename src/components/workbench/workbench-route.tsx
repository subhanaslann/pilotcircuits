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
import type { AgentTool } from "@/lib/agent/model";
import type { ProjectId } from "@/lib/projects/catalog";

/**
 * The subset a narrow bench can honour.
 *
 * Not a taste call: each of these four still moves something the reader can
 * see when the workspace region is unmounted. `get_build_context` reads and
 * moves nothing by design; `navigate_build_step` and `verify_current_step`
 * both redraw the step rail, which is rendered on narrow; `run_functional_test`
 * plays into the device dock, which is too.
 *
 * The three left out are the three that need the canvas or the panel:
 * `inspect_build` fills a Findings tab inside a closed drawer, `show_correction`
 * points a camera that is not mounted, and `attach_lead` writes a build nobody
 * can look at. Rule 6 — a change nobody sees did not happen — is the whole
 * reason they are absent rather than merely quiet.
 */
const narrowTools: readonly AgentTool[] = [
  "get_build_context",
  "verify_current_step",
  "navigate_build_step",
  "run_functional_test",
];

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
 * **And nothing inside it can lengthen the page.** `relative overflow-hidden`,
 * so this box is the containing block of every absolutely positioned
 * descendant and clips whatever it does not scroll itself. Measured: the
 * panel's `LiveRegion` is `sr-only` — absolute, no offsets —
 * and with no positioned ancestor it was laid out against the document, at
 * the static position of a guidance list taller than the panel: y = 1210 in
 * a 1009 px window. The page grew 202 px of nothing under the bench and the
 * whole workbench could be wheeled up off the top of the screen. The live
 * region now pins itself to the corner; this is the guarantee that the next
 * `sr-only`, or the next tooltip, cannot do it again.
 *
 * **It starts the clock.** A person who types this URL has started the build
 * just as much as one who pressed `Start build` on the project page. The action
 * is idempotent, so arriving from either direction is one start.
 *
 * **It hands the browser the tools that can act here.** §9 keeps a tool on the
 * page that can honour it — and *this* page is two pages. All seven move
 * something on the wide bench. Below `WIDE` there is no workspace region at
 * all: `WorkbenchFrame` renders the topbar, the notice, the rail and the dock,
 * and puts the panel inside a drawer that is `null` while it is closed. So the
 * canvas ref is empty, every `focus` / `fitView` / `trace` effect lands on the
 * floor, a correction card opens inside something that is not mounted, and the
 * panel's live region is not there to announce any of it. The four that still
 * have a surface to move — the read, the two that move the rail, and the run
 * the dock prints — are the four that get registered there. See `narrowTools`.
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
   * the session's — which is now the same answer, since the provider puts the
   * URL's build on the bench during render, but this is the one that is true
   * by construction rather than by another file's arithmetic. Deciding once is
   * also what stops widening the window past 1120px mid-session from opening a
   * briefing over a bench somebody is using.
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

  useWebMcpTools(wide ? workbenchTools : narrowTools);

  /**
   * Which build this bench is for — the backstop, not the mechanism.
   *
   * `BuildProvider` now chooses the bench from the URL during render, so by
   * the time this component exists the session is already carrying the right
   * chapter, on the server as well as in the browser. This stays because it is
   * free (the reducer returns the same object for the build already on the
   * bench) and because it is the one path that does not depend on the shape of
   * a pathname: a `basePath`, a rewrite or a locale prefix would blind the
   * provider's match, and this route is handed its `projectId` by the server.
   */
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
    <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden">
      <Workbench
        session={session}
        canvas={canvasRef}
        camera={cameraRef}
        /* The same ternary as `useWebMcpTools` above, and it has to be: the
           panel's `N tools available` is a claim about THIS page, and the
           narrow bench registers four because the canvas is not mounted and
           the panel is inside a closed drawer. Counting seven there would
           print a number for tools no host was ever handed. */
        panelTools={wide ? workbenchTools : narrowTools}
        /**
         * Back goes to the picker, not to the chapter's page.
         *
         * `/workspace` is where a chapter is chosen and its kit opened, and
         * this link is its only way in: the entry screen's doors go straight
         * to `/workbench/[slug]` and the nav carries `/` and `/projects`, so
         * nobody reaches the bench *from* the picker unless they went back to
         * it first. (This comment used to say the entry screen sent people
         * there; it never did.) Sending the one way back to `/projects/[slug]`
         * instead dropped people on a page they had never seen, with a `Start
         * building` button for the build they were already standing at. The
         * chapter's page is still reachable from `/projects`, which is the
         * list it belongs to.
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
