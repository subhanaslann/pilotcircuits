"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import {
  useAgentSession,
  type AgentSession,
} from "@/components/agent/use-agent-session";
import type { CanvasHandle } from "@/components/canvas/canvas-viewport";
import { noFilters, type ProjectFilters } from "@/lib/projects/filter";

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
 * A no-op is only acceptable because it cannot be reached by accident: the six
 * tools that emit those effects are registered with the browser **only while
 * the workbench is mounted** (see `use-webmcp.ts`), so nothing can ask for a
 * camera move on the dashboard. If that ever stops being true, this is the
 * place that goes quiet first, and rule 6 is the rule it breaks.
 */

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
}

const BuildContext = createContext<BuildValue | null>(null);

export function BuildProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const canvasRef = useRef<CanvasHandle | null>(null);
  const cameraRef = useRef<CanvasHandle | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>(noFilters);

  const session = useAgentSession({
    canvas: canvasRef,
    camera: cameraRef,
    navigate: (href) => router.push(href),
    onFilters: setFilters,
  });

  return (
    <BuildContext.Provider
      value={{ session, canvasRef, cameraRef, filters, setFilters }}
    >
      {children}
    </BuildContext.Provider>
  );
}

/**
 * Throws without a provider above it, unlike `useCopy`.
 *
 * The dictionary has a sensible default — English prose — so a component
 * dropped into a story on its own still renders. A build does not: a second,
 * silently created session would look like it worked and would quietly be the
 * wrong one. Failing loudly is the smaller bug.
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
