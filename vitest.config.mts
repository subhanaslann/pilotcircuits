import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * The safety net this repo did not have.
 *
 * Every way the placement model can be wrong renders as a plausible-looking
 * picture rather than a crash, and `Placement` is keyed by `string`, so a
 * misspelled terminal typechecks. Until now the only guard was the dev-only
 * assertion block at the bottom of `builds.ts`, which exercises six of a
 * `PlacementSpec`'s ten members and has never called `satisfying`, `clearing`
 * or `grabPoint`.
 *
 * Node environment only: everything asserted here is the model and the pure
 * gesture arithmetic, neither of which needs a DOM.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
