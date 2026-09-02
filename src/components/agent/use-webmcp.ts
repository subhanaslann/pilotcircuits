"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useBuildSessionIfAny } from "@/components/build/build-provider";
import type { AgentSession } from "@/components/agent/use-agent-session";
import { useCopy, useLocale } from "@/content/copy-provider";
import {
  executeVia,
  findMcpHost,
  isWebMcpAvailable,
  librarySchemasFor,
  registerTool,
  workbenchSchemasFor,
  type McpRegistration,
} from "@/lib/agent/webmcp";
import { schemaFactsFor } from "@/lib/agent/builds";
import { toolAnnotations, type AgentTool } from "@/lib/agent/model";
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

/* The store behind the gate below: three constants, at module scope so the
   subscription is never torn down and re-made. Nothing ever changes it — the
   only transition it has is the one React performs itself when it compares the
   client's answer with the server's after hydration. */
const noResubscribe = () => () => {};
const onTheClient = () => true;
const onTheServer = () => false;

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
  /**
   * Whose session this is, and why the read is the optional one.
   *
   * Called unconditionally and then discarded when a session was handed in — a
   * hook cannot be skipped. It reads the provider *optionally* because the
   * comment this replaces said "every caller is inside the provider" and that
   * stopped being true: the design lab is deliberately outside `BuildProvider`
   * (`build-provider.tsx` and `app/(product)/layout.tsx` both say so), so
   * `useBuildSession`'s throw made this hook unusable on the one page that
   * exists to demonstrate what it does — even though that page hands in a
   * session of its own and needs nothing from the provider at all.
   *
   * Neither of the two is not a state to render around. A caller outside the
   * provider that also passes nothing has asked the browser to route tool calls
   * into a session that does not exist: there is no build to fall back to, and
   * inventing one would register seven tools against a bench nobody is looking
   * at. That is a wiring mistake in the caller, and it reads like one.
   */
  const carried = useBuildSessionIfAny();
  const session = given ?? carried;
  if (!session) {
    throw new Error(
      "useWebMcpTools needs a session: render it inside <BuildProvider>, " +
        "or pass one as the second argument.",
    );
  }
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

  /**
   * Nothing is registered from a commit the server decided, and the reason is
   * the width.
   *
   * `workbench-route.tsx` picks its list with `wide ? workbenchTools :
   * narrowTools`, and `useWideEnough`'s server snapshot is `true` — *"a narrow
   * client corrects itself on hydration"* (`frame.tsx:52-58`). So a phone
   * renders the wide tree for exactly one commit, and registering inside it
   * hands the browser the three the narrow list leaves out — `inspect_build`,
   * `show_correction` and `attach_lead` — for a canvas that layout never
   * mounts: the tools are real, the surface they act on is not, and the call
   * lands on the floor where `BuildProvider`'s ref handover cannot see it.
   * (`run_functional_test` is *in* `narrowTools`; it needs the board, not the
   * canvas.)
   *
   * The gate is the same mechanism as the thing it is waiting for — a store
   * whose server answer differs from its client one — so both corrections
   * arrive in the same re-render and the effect never sees a half-corrected
   * tree. Deliberately not a `matchMedia` read: the query belongs to the
   * caller, and every caller whose list depends on one gets this for free.
   */
  const decided = useSyncExternalStore(noResubscribe, onTheClient, onTheServer);

  useEffect(() => {
    if (!decided) return;

    const host = findMcpHost();
    if (!host) {
      /**
       * No host: say so, in the one place that can.
       *
       * This branch used to return without touching the flag *and* without a
       * cleanup, so it was silent in both directions. `useAgentSession`'s
       * mount probe can only ever write `true` — it is guarded by
       * `isWebMcpAvailable()` and its own comment says it only moves in the
       * honest direction — and it runs once per session, while `BuildProvider`
       * holds one session across `/`, `/projects`, `/workbench/…` and
       * `/complete/…`. So an arrival that finds no host was the only path that
       * measured presence, got a negative answer, and wrote nothing down: the
       * capsule kept reading `AGENT ONLINE` from whatever had set it earlier.
       *
       * No cleanup, and that is not the same omission: nothing was registered,
       * so there is nothing to take back, and the flag is already at the value
       * the teardown would restore.
       */
      live.current.session.setWebMcpAvailable(false);
      return;
    }

    const [, build, list] = key.split(":");
    const names = list.split(",").filter(Boolean) as AgentTool[];
    /**
     * Built once per registration, from the build named in the key — never
     * from a render-time read, so the schemas a host holds and the key that
     * decided to give them to it cannot disagree.
     *
     * The dictionary reaches them the same way the tool description does, and
     * it has to: the argument sentences are localised now, so a schema is as
     * much a per-locale object as it is a per-build one. `key` starts with the
     * locale, so a language change tears the tools off the host and registers
     * them again — measured, on a spec host, as seven removals and seven
     * re-registrations with the new dictionary in them.
     */
    const words = live.current.copy;
    const schemas = workbenchSchemasFor(schemaFactsFor(build as ProjectId), words);
    const library = librarySchemasFor(words);

    /**
     * One controller per effect run, and the whole teardown.
     *
     * The IDL has no `unregisterTool` and `registerTool` hands back no handle:
     * `ModelContextRegisterToolOptions.signal` is the only removal path it
     * defines. Without one, §9's *"cleaned up when the page changes"* was a
     * sentence about a no-op — the seven names stayed on the host, and every
     * later arrival at a bench was refused as a duplicate, including the second
     * half of StrictMode's own double-invoke.
     *
     * Per run rather than per registration, because that is exactly the unit
     * being torn down: everything registered under this `key` leaves together.
     */
    const controller = new AbortController();

    const registrations: McpRegistration[] = names.map((name) =>
      registerTool(
        host,
        {
          name,
          /* Both read through the ref, like the description beside them: a
             registration made three routes ago must print the language the
             reader is in now, not the one they arrived in. */
          title: live.current.copy.agentPanel.toolTitles[name],
          description: live.current.copy.agentPanel.tools[name],
          inputSchema: schemas[name] ?? library[name] ?? {},
          /* Not through the ref, and not per render: the hints are a property
             of what the tool does, which no locale and no bench changes. */
          annotations: toolAnnotations[name],
          /**
           * The call itself is composed in `webmcp.ts` (`executeVia`): the
           * pre-cancelled return, the refusal composition and the catch that
           * keeps anything thrown from reaching the host all live there, where
           * a test can call them through a spec-shaped host without a React
           * tree. What this hook adds is the ref — `session.run` is a new
           * function on every render and the dictionary changes with the
           * locale, so both are read at call time rather than captured here at
           * registration.
           */
          execute: executeVia(name, {
            run: (tool, args, options) =>
              live.current.session.run(
                tool as keyof AllToolInputs,
                args as never,
                options,
              ),
            copy: () => live.current.copy,
          }),
        },
        /* The teardown, handed over at registration time. Everything this
           effect registers is aborted together. */
        { signal: controller.signal },
      ),
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
     *
     * The evidence now *arrives* rather than being read, because a conforming
     * host answers with a promise, so the flag is lowered first and raised only
     * by the settled answer. That is the deliberate choice: for as long as the
     * handshake is in flight the badge says nothing, rather than repeating the
     * mount probe's `true` — which is a claim about presence sitting under
     * words that promise a handshake. On a host that resolves in a microtask
     * the two writes batch into one render and nothing flickers; on a host that
     * takes long enough to be seen, the reader sees `AGENT OFFLINE` while it is
     * genuinely unknown, which is the honest frame.
     */
    if (registrations.length) {
      live.current.session.setWebMcpAvailable(false);
      void Promise.all(registrations.map((r) => r.ok)).then((taken) => {
        /* The route this belongs to is gone; the teardown has already had the
           last word on the flag, and this answer is about a host that no
           longer holds these tools. */
        if (controller.signal.aborted) return;
        live.current.session.setWebMcpAvailable(taken.some((ok) => ok));
      });
    } else {
      /* Asked for nothing, so nothing was refused. A caller with an empty
         list has learned nothing about the host beyond finding it. */
      live.current.session.setWebMcpAvailable(isWebMcpAvailable());
    }

    return () => {
      /**
       * The removal itself — one abort for everything registered above.
       *
       * `unregister` runs after it for the shim hosts that hand back a
       * disposer; on a conforming host it is a no-op and the abort is the
       * whole teardown. Aborting first means a host that honours the signal
       * has already dropped the tools before anything else is tried.
       */
      controller.abort();
      registrations.forEach((r) => r.unregister());
      /**
       * And the badge taken back when the tools are.
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
  }, [key, decided]);
}
