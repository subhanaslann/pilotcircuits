"use client";

import { useEffect, useRef } from "react";
import { useBuildSession } from "@/components/build/build-provider";
import { useCopy, useLocale } from "@/content/copy-provider";
import {
  asToolResult,
  findMcpHost,
  librarySchemas,
  registerTool,
  workbenchSchemas,
  type McpRegistration,
} from "@/lib/agent/webmcp";
import type { AgentTool } from "@/lib/agent/model";
import type { AllToolInputs } from "@/lib/agent/tools";

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
export function useWebMcpTools(tools: readonly AgentTool[]) {
  const session = useBuildSession();
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

  /* The dependency is the list flattened, plus the language. The array is
     rebuilt by every caller on every render, so its identity says nothing;
     what actually decides whether the browser's list has to change is which
     tools this route offers and which language their descriptions are in. */
  const key = `${locale}:${tools.join(",")}`;

  useEffect(() => {
    const host = findMcpHost();
    if (!host) return;

    const names = key.split(":")[1].split(",").filter(Boolean) as AgentTool[];
    const registrations: McpRegistration[] = names.map((name) =>
      registerTool(host, {
        name,
        description: live.current.copy.agentPanel.tools[name],
        inputSchema: workbenchSchemas[name] ?? librarySchemas[name] ?? {},
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
