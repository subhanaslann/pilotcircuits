import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Next's own dev badge, off.
   *
   * It floats over the bottom-left corner of every screen, which is where the
   * workbench keeps its dock handle — and in a demo it reads as part of the
   * product: somebody driving this through an agent reported "a development
   * error badge is visible" as a defect of PilotCircuits. Build errors still
   * appear as the full-screen overlay; this only removes the permanent badge.
   */
  devIndicators: false,
  /**
   * Batch 8 · somewhere else to build.
   *
   * `next dev` holds `.next` for the whole session, and a production build into
   * the same directory fights it: the dev server serves half-written chunks
   * while the build serves itself a stale manifest. Verifying a change means
   * building while the browser it was checked in is still open, so the build
   * gets its own directory and the dev server keeps hers.
   */
  distDir: process.env.CP_DIST_DIR ?? ".next",

  /**
   * The invariant this codebase was already written against.
   *
   * Five source files say, in comments, that the React Compiler is on and
   * choose plain functions over `useCallback` on that basis — and it was not
   * enabled: `next.config.ts` had only `distDir`, `babel-plugin-react-compiler`
   * was not installed, and a production build contained exactly one
   * `memo_cache_sentinel`, in `react-dom`. Nothing was visibly broken, because
   * every hot path happens to be hand-memoised; what was broken is that the
   * rule the code is written to was false, and had propagated into every
   * later comment that quoted it.
   *
   * Made true rather than retracted. The alternative — deleting the comments
   * and adding the dependency arrays they refused — is a larger change to more
   * files in the direction the authors deliberately chose against.
   */
  reactCompiler: true,

  /**
   * Origin-keying, asked for rather than assumed.
   *
   * **This is hardening, not a fix for anything observed.** The claim behind it
   * was that `navigator.modelContext` would be behind a `SecurityError`
   * gate on an origin that is not origin-keyed; measured in the browser on this
   * dev server, with no header sent at all, `window.originAgentCluster` is
   * already `true`, so nothing in the product reaches that gate today and
   * nothing about registration changes when this ships.
   *
   * What survives is narrower and worth a line of config: origin-keying is the
   * *default* a user agent chose for us, and a deployed origin may be grouped
   * with same-site siblings instead. `?1` asks for the keying explicitly rather
   * than inheriting whichever answer the host happens to give. It is a
   * structured-field boolean — `?1`, not `true` — and it is per-origin and
   * sticky for the browsing-context group's lifetime, so it goes on every
   * response rather than on a route.
   *
   * No `Permissions-Policy` beside it, and not because there is nothing to
   * name. The spec gates its API behind the policy-controlled feature
   * `tools`, whose default allowlist is `'self'` (`index.bs`: *"gated behind
   * the policy-controlled feature "tools", which has a default allowlist of
   * 'self'"*) — which is exactly what a top-level page needs, so the default
   * already says what a header would. Sending `Permissions-Policy:
   * tools=(self)` would buy nothing and cost one thing: a Chrome without the
   * WebMCP flag does not recognise the feature name and prints a console
   * warning for it on every response. (This comment used to say the spec
   * defined no such feature. It does — the sentence was written before that
   * part of `index.bs` was read.)
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Origin-Agent-Cluster", value: "?1" }],
      },
    ];
  },
};

export default nextConfig;
