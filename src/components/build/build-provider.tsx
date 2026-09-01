"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  useAgentSession,
  type AgentSession,
} from "@/components/agent/use-agent-session";
import type { CanvasHandle } from "@/components/canvas/canvas-viewport";
import { buildBySlug, type BuildDef } from "@/lib/agent/builds";
import { noFilters, type ProjectFilters } from "@/lib/projects/filter";
import type { ProjectId } from "@/lib/projects/catalog";

/**
 * Batch 8 · §14 · One build, several screens.
 *
 * Until now the session was per mount: `useAgentSession` was called by whatever
 * component happened to need it, and it started over every time that component
 * did. That was fine while the only assembly was a lab page. It stops being
 * fine the moment the product has routes — the dashboard offers to *continue* a
 * build and the completion screen reports how many mistakes you *fixed*, and
 * both of those are claims about something that happened on a different URL.
 *
 * So the session is hoisted to a provider that wraps every product route and
 * outlives all of them. What that buys, beyond the two sentences above: the
 * dock's log and the test verdict survive the walk from the workbench to the
 * summary, because the hook holding them never unmounts.
 *
 * **The lab is deliberately not under this provider.** Playing with the live
 * workbench at `/lab/workbench` must not move the build the product is
 * carrying. The lab keeps calling `useAgentSession` itself; the shared
 * components take a session as a prop and do not care which one they got.
 *
 * ## The canvas handles
 *
 * `useAgentSession` focuses and fits the canvas through refs it is handed. The
 * provider owns those refs and the workbench fills them in, rather than the
 * other way round, and that inversion is the whole trick: when the workbench
 * unmounts React writes `null` back into the ref, the hook's `views()` filter
 * drops it, and `focus`/`fitView` become no-ops on the routes where there is
 * nothing to focus.
 *
 * A no-op is only acceptable because it cannot be reached by accident: the
 * tools that emit those effects are registered with the browser **only on a
 * screen that can honour them** (see `use-webmcp.ts` — the wide workbench, and
 * the two the entry screen's bench answers), so nothing can ask for a camera
 * move on the dashboard. If that ever stops being true, this is the place that
 * goes quiet first, and rule 6 is the rule it breaks.
 *
 * ## The build is on the bench before the first paint
 *
 * `initialSession()` falls back to `defaultBuild`, which is the capstone. That
 * used to be the state every route served: `openBuild` ran in an effect inside
 * `WorkbenchRoute`, and effects do not run on the server — so the whole
 * document of `/workbench/traffic-light` was the parking barrier. The topbar's
 * name, the seven-stop rail with two steps already ticked, the instruction, the
 * progress bar's label and the canvas region's accessible name
 * (`Akıllı Otopark Bariyeri devresi`) all named a chapter the reader had not
 * opened. It corrected itself one frame after hydration, which is exactly the
 * frame a screen reader has already announced and a slow connection is still
 * showing.
 *
 * So the bench is chosen from the URL, here, during render — the documented
 * React shape for "adjust state when the thing it is derived from changes",
 * and the only place it can happen early enough, because a layout is above
 * every page and cannot be handed a page's params. `openBuild` is idempotent
 * for the build already on the bench, so this settles in one extra render pass
 * and then never fires again while the reader stays on that chapter.
 *
 * Two consequences worth naming:
 *
 *   *Walking between chapters is covered too.* `usePathname` re-renders this
 *   provider on the navigation itself, before the new page's children render,
 *   so the schemas `use-webmcp.ts` hands the browser are the arriving
 *   chapter's from the first commit rather than the one you left's.
 *
 *   *Only `/workbench/…` counts.* `/complete/traffic-light` carries the same
 *   slug and must NOT re-open the build — that would throw away the finished
 *   state the summary is about.
 */

/**
 * The build this URL is a bench for, or `undefined` everywhere else.
 *
 * Exact shape rather than a prefix test: two segments, the first `workbench`,
 * and a slug the registry knows. A slug it does not know is a 404 on that
 * route, and answering `undefined` here leaves whatever build the session was
 * already carrying rather than inventing one.
 */
export function benchOnPath(pathname: string | null): BuildDef | undefined {
  const segments = (pathname ?? "").split("/").filter(Boolean);
  if (segments.length !== 2 || segments[0] !== "workbench") return undefined;
  return buildBySlug(segments[1]!);
}

export interface BuildValue {
  session: AgentSession;
  /** Filled by the workbench, `null` everywhere else. */
  canvasRef: RefObject<CanvasHandle | null>;
  /** Filled by the inspection modal while it is open. */
  cameraRef: RefObject<CanvasHandle | null>;
  /**
   * P-04's state, hoisted for one reason: `find_projects` has to narrow the
   * toolbar the person can see, not answer past it (rule 6).
   */
  filters: ProjectFilters;
  setFilters: (next: ProjectFilters) => void;
  /**
   * Whether this chapter's briefing has already played.
   *
   * A project id rather than a boolean, and here rather than in the session
   * reducer, for three reasons that all point the same way:
   *
   *   *Reset must not re-open it.* `sessionReducer`'s `reset` rebuilds from
   *   `initialSession()` and preserves exactly one field, with a written
   *   justification; a briefing flag would have to become the second, because
   *   somebody standing at the bench pressing `Reset demo` must not have the
   *   canvas covered again. Keyed by chapter here, that falls out for free.
   *
   *   *Changing chapter must re-open it.* Also free: a different id simply
   *   does not match.
   *
   *   *No tool may read it.* `get_build_context` answers from the session, and
   *   a fact about a *view* has no business in the answer — there is
   *   deliberately no `show_briefing`, because an agent that could re-open this
   *   would be an agent hiding the bench it is pointing at.
   */
  briefedProjectId: ProjectId | null;
  markBriefed: (id: ProjectId) => void;
}

const BuildContext = createContext<BuildValue | null>(null);

export function BuildProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const canvasRef = useRef<CanvasHandle | null>(null);
  const cameraRef = useRef<CanvasHandle | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>(noFilters);
  const [briefedProjectId, setBriefed] = useState<ProjectId | null>(null);

  const session = useAgentSession({
    canvas: canvasRef,
    camera: cameraRef,
    navigate: (href) => router.push(href),
    onFilters: setFilters,
  });

  /* The first paint, on the right bench. See the block above — this is a
     render-phase adjustment on this component's own reducer, not an effect,
     because the server render is the half that never got one. */
  const opening = benchOnPath(pathname);
  if (opening && session.state.projectId !== opening.projectId) {
    session.openBuild(opening);
  }

  return (
    <BuildContext.Provider
      value={{
        session,
        canvasRef,
        cameraRef,
        filters,
        setFilters,
        briefedProjectId,
        markBriefed: setBriefed,
      }}
    >
      {children}
    </BuildContext.Provider>
  );
}

/**
 * Throws without a provider above it, unlike `useCopy`.
 *
 * The dictionary has a sensible default — `getCopy(defaultLocale)`, which is
 * the Turkish the product ships in, and not the English this sentence used to
 * claim — so a component dropped into a story on its own still renders. A build
 * does not: a second, silently created session would look like it worked and
 * would quietly be the wrong one. Failing loudly is the smaller bug.
 */
export function useBuild(): BuildValue {
  const value = useContext(BuildContext);
  if (!value) {
    throw new Error("useBuild must be used inside <BuildProvider>");
  }
  return value;
}

/** The session on its own, which is what most callers want. */
export function useBuildSession(): AgentSession {
  return useBuild().session;
}

/**
 * The same session, for the one caller that may legitimately not have one.
 *
 * The throw above is right for a component that *draws* a build: it cannot do
 * its job without one, and a silently invented session would be the wrong build
 * rather than no build. `useWebMcpTools` is the exception, because a session is
 * an argument it already takes — the entry screen hands in its own — so "there
 * is no provider" is a question it can answer instead of a failure it dies on.
 *
 * The design lab is why this exists. It is deliberately outside the provider —
 * `app/(product)/layout.tsx` says so in writing and points here — and it is
 * also the one page whose whole argument is that a tool count nobody can open
 * is exactly a badge. Without an optional read it could not register the tools
 * it was printing a number for, so it printed zero: honest, and useless.
 *
 * Deliberately the session and not the whole `BuildValue`. Everything else in
 * there — the canvas handles, the filters — is something a component draws
 * with, and for those the throw is still the right answer.
 */
export function useBuildSessionIfAny(): AgentSession | null {
  return useContext(BuildContext)?.session ?? null;
}
