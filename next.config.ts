import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Next's own dev badge, off.
   *
   * It floats over the bottom-left corner of every screen, which is where the
   * workbench keeps its dock handle — and in a demo it reads as part of the
   * product: somebody driving this through an agent reported "a development
   * error badge is visible" as a defect of CircuitPilot. Build errors still
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
   * rule the code is written to was false, and self-propagating into every
   * session brief that quoted it.
   *
   * Made true rather than retracted. The alternative — deleting the comments
   * and adding the dependency arrays they refused — is a larger change to more
   * files in the direction the authors deliberately chose against.
   */
  reactCompiler: true,
};

export default nextConfig;
