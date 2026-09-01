"use client";

import { useEffect, useRef } from "react";
import { useBuildSession } from "@/components/build/build-provider";
import type { AgentSession } from "@/components/agent/use-agent-session";
import { useCopy, useLocale } from "@/content/copy-provider";
import {
  asToolResult,
  findMcpHost,
  librarySchemas,
  registerTool,
  workbenchSchemasFor,
  type McpRegistration,
} from "@/lib/agent/webmcp";
import { schemaFactsFor } from "@/lib/agent/builds";
import type { AgentTool } from "@/lib/agent/model";
import type { AllToolInputs } from "@/lib/agent/tools";
import type { ProjectId } from "@/lib/projects/catalog";

/**
 * Batch 8 · §9 · Handing this route's tools to the browser.
 *
 * §9 is specific about the shape of this, and every clause of it is
 * load-bearing:
 *
 *   *"Tools are registered inside the React lifecycle and cleaned up when the
 *   page changes."* — an effect with a teardown, which is what this is.
 *
 *   *"Tools are only registered on the pages where they can be used."* — the
 *   caller passes its own list. The workbench registers the six that can move a
 *   canvas; the library registers the two that can narrow a grid. A
 *   `show_correction` reachable from the dashboard would point at a canvas that
 *   is not mounted, and the effect would land silently on the floor — which is
 *   the one failure mode `BuildProvider`'s ref handover cannot see.
 *
 *   *"No conflicting tools doing the same job."* — one registration per name
 *   per route, and the names are the same union the runner dispatches on.
 *
 * Every call goes through `session.run`, so a tool the browser invokes is the
 * same call the button beside it makes: one queue, one activity entry, one
 * generation guard. There is no second path into this product.
 *
 * Detection is not here. `useAgentSession` probes on mount so that every
 * session — the design lab's included — knows what the browser can do; this
 * hook only registers, and does nothing at all when there is no host.
 */
export function useWebMcpTools(
  tools: readonly AgentTool[],
  /**
   * Whose session the browser's calls land in.
   *
   * The workbench and the library want the build the product is carrying, and
   * that is the default. The entry screen wants its own — pressing a button on
   * a marketing page, or an agent calling into it, must not move the build
   * waiting at `/workbench`. See `landing/landing-session.tsx`.
   */
  given?: AgentSession,
) {
  /* Called unconditionally and then discarded when a session was handed in:
     a hook cannot be skipped, and every caller is inside the provider. */
  const carried = useBuildSession();
  const session = given ?? carried;
  const copy = useCopy();
  const { locale } = useLocale();

  /**
   * The live session and dictionary, readable from inside a registration that
   * was made several renders ago.
   *
   * `session.run` is a new function on every render (no `useCallback`, React
   * Compiler), and the one the browser holds would otherwise be the one from
   * the render that registered it — carrying, among other things, the
   * dictionary the page was in at the time. A ref refreshed after every commit
   * is the cheapest way for a long-lived callback to reach the current one.
   */
  const live = useRef({ session, copy });
  useEffect(() => {
    live.current = { session, copy };
  });

  /**
   * What decides whether the browser's list has to be rebuilt.
   *
   * The tools this route offers, the language their descriptions are in — and,
   * since Batch 9, **which build is on the bench**: the schemas enumerate that
   * build's steps, checks, leads and holes, so walking from chapter one to
   * chapter six has to hand the host a different set. Left out, an agent on the
   * second bench would be reading the first one's vocabulary.
   */
  const projectId = session.state.projectId;
  const key = `${locale}:${projectId}:${tools.join(",")}`;

  useEffect(() => {
    const host = findMcpHost();
    if (!host) return;

    /**
     * The badge, told by the strongest evidence there is.
     *
     * `useAgentSession` probes once, when the session mounts. A host that
     * arrives after that — an extension enabling itself, a client attaching
     * to a page already open — left the panel printing `Agent not connected`
     * beside a list of tools it had just handed over. Nothing is more certain
     * that a host exists than having successfully registered with it.
     */
    live.current.session.setWebMcpAvailable(true);

    const [, build, list] = key.split(":");
    const names = list.split(",").filter(Boolean) as AgentTool[];
    /* Built once per registration, from the build named in the key — never
       from a render-time read, so the schemas a host holds and the key that
       decided to give them to it cannot disagree. */
    const schemas = workbenchSchemasFor(schemaFactsFor(build as ProjectId));

    const registrations: McpRegistration[] = names.map((name) =>
      registerTool(host, {
        name,
        description: live.current.copy.agentPanel.tools[name],
        inputSchema: schemas[name] ?? librarySchemas[name] ?? {},
        /**
         * Nothing thrown crosses this line.
         *
         * The runner already turns a throwing handler into an error outcome,
         * but the throw can happen before it — `navigate_build_step` with a
         * step id that does not exist fails while the entry's own headline is
         * being composed. A host that does not enforce the schema would get an
         * exception where the protocol promises a result.
         */
        execute: async (args) => {
          try {
            const outcome = await live.current.session.run(
              name as keyof AllToolInputs,
              (args ?? {}) as never,
            );
            const failed = outcome.status === "error";
            return asToolResult(
              failed
                ? { error: outcome.errorMessage?.k ?? "failed", tool: name }
                : outcome.result,
              failed,
            );
          } catch (error) {
            return asToolResult(
              {
                error: error instanceof Error ? error.message : "failed",
                tool: name,
              },
              true,
            );
          }
        },
      }),
    );

    return () => registrations.forEach((r) => r.unregister());
  }, [key]);
}
