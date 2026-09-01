"use client";

import { useEffect, useRef } from "react";
import { useBuildSession } from "@/components/build/build-provider";
import type { AgentSession } from "@/components/agent/use-agent-session";
import { useCopy, useLocale } from "@/content/copy-provider";
import {
  asToolResult,
  findMcpHost,
  isWebMcpAvailable,
  librarySchemas,
  registerTool,
  workbenchSchemasFor,
  type McpRegistration,
} from "@/lib/agent/webmcp";
import { say } from "@/lib/agent/line";
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
 *   caller passes its own list. The wide workbench registers all seven; the
 *   narrow one registers the four that still have a surface to move; the
 *   library registers the two that can narrow a grid. A `show_correction`
 *   reachable from the dashboard would point at a canvas that is not mounted,
 *   and the effect would land silently on the floor — which is the one failure
 *   mode `BuildProvider`'s ref handover cannot see.
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
            if (!failed) return asToolResult(outcome.result, false);

            /**
             * A refusal, with everything that makes it actionable.
             *
             * This used to be the key alone — `{"error":"unknownCheck"}` — and
             * the key is the one part of a refusal that helps nobody.
             * `unknownCheck` carries the list of checks this build runs;
             * `holeTaken` carries the pin; the four validated arguments carry
             * what arrived and what would have been accepted. All of it was
             * composed, shown to the person in a toast, and then dropped on
             * the way to the one caller that could act on it.
             *
             * Three fields, because they answer three different questions and
             * no client reads all three: `error` is the stable key to branch
             * on, `message` is the sentence the person is looking at (same
             * dictionary, same words — the agent and the reader cannot be told
             * different things), and `result` is the structured refusal where
             * there is one. `result` is spread rather than nested so a caller
             * reads `refused` / `argument` / `valid` at the top level — and it
             * is genuinely absent on the refusals that have never carried one
             * (`notFound`, `noPlacement`), which is why this reads it
             * defensively instead of assuming it is there.
             */
            const detail = outcome.result;
            return asToolResult(
              {
                /* Spread first, so a payload can never shadow the three
                   fields this bridge is contractually responsible for. */
                ...(detail && typeof detail === "object" ? detail : {}),
                error: outcome.errorMessage?.k ?? "failed",
                ...(outcome.errorMessage
                  ? { message: say(live.current.copy, outcome.errorMessage) }
                  : {}),
                tool: name,
              },
              true,
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

    /**
     * The badge, told by the strongest evidence there is — and only by it.
     *
     * Two things were wrong with the line this replaces. It ran *before* the
     * registrations, so its own justification ("nothing is more certain that a
     * host exists than having successfully registered with it") described code
     * that had not happened yet. And `registerTool` swallows a throwing host
     * and hands back a no-op that was byte-for-byte indistinguishable from a
     * success — so a present-but-broken host (permission denied, a quota, an
     * extension mid-crash) left the panel printing `Connected via WebMCP · 7
     * tools available` beside a host holding nothing at all. `findMcpHost`
     * measures API *presence*; this measures a handshake, which is the thing
     * the badge claims.
     *
     * `useAgentSession`'s mount probe sets the same flag from presence alone,
     * so this has to be able to move it in both directions: a host that took
     * none of our tools is not a host, whatever `navigator.modelContext` says.
     */
    const shookHands = registrations.length
      ? registrations.some((r) => r.ok)
      : /* Asked for nothing, so nothing was refused. A caller with an empty
           list has learned nothing about the host beyond finding it. */
        isWebMcpAvailable();
    live.current.session.setWebMcpAvailable(shookHands);

    return () => {
      registrations.forEach((r) => r.unregister());
      /**
       * And taken back when the tools are.
       *
       * The flag only ever moved one way — once true, true for the rest of the
       * session — so a bench that had registered left `AGENT ONLINE` lit on
       * every screen after it, and an extension the reader switched off
       * mid-session could never be reported as gone. Restored to what the
       * browser says *now* rather than blindly to `false`: on a working host
       * this teardown changes nothing, which is the point.
       */
      live.current.session.setWebMcpAvailable(isWebMcpAvailable());
    };
  }, [key]);
}
