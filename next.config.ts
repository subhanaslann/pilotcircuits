import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
