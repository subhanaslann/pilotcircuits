import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * The bench a workbench URL serves, before anything has run.
 *
 * This is the one defect in the WebMCP layer that a green test suite could
 * never have caught, because the wrong state was corrected by an effect one
 * frame after hydration: `initialSession()` falls back to the capstone, and
 * `openBuild` used to run in a `useEffect` inside `WorkbenchRoute`. Effects do
 * not run on the server, so the whole document of `/workbench/traffic-light`
 * was the parking barrier — its name in the top bar, its seven-stop rail with
 * two steps already ticked, its instruction, and `Akıllı Otopark Bariyeri
 * devresi` as the canvas region's accessible name. Every assertion in the repo
 * ran against state that had already been fixed up.
 *
 * So this asserts on the **server-rendered markup**: `renderToStaticMarkup`
 * runs no effects, which is exactly the position a screen reader and a slow
 * connection are in. A test that mounted and flushed would pass on the broken
 * code.
 *
 * `next/navigation` is the only thing stubbed. The provider reads the URL
 * because a layout sits above every page and cannot be handed a page's params
 * — that indirection is the mechanism under test, so the pathname is the input
 * and the session's `projectId` is the output.
 */

const nav = vi.hoisted(() => ({ path: "/" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {} }),
  usePathname: () => nav.path,
}));

const { BuildProvider, benchOnPath, useBuildSession } = await import(
  "@/components/build/build-provider"
);

/** The one fact this file is about, printed where markup can be read. */
function Probe() {
  return createElement("i", null, useBuildSession().state.projectId);
}

function serve(path: string): string {
  nav.path = path;
  return renderToStaticMarkup(
    createElement(BuildProvider, null, createElement(Probe) as ReactNode),
  );
}

describe("the server render carries the route's own build", () => {
  it.each([
    ["/workbench/breathing-lamp", "breathingLamp"],
    ["/workbench/traffic-light", "trafficLight"],
    ["/workbench/motion-night-light", "motionNightLight"],
    ["/workbench/plant-guardian", "plantGuardian"],
    ["/workbench/touchless-soap-dispenser", "touchlessSoapDispenser"],
    ["/workbench/smart-parking-barrier", "smartParkingBarrier"],
  ])("%s serves %s", (path, projectId) => {
    expect(serve(path)).toBe(`<i>${projectId}</i>`);
  });

  it("does not fall back to the capstone on five of the six", () => {
    const served = [
      "/workbench/breathing-lamp",
      "/workbench/traffic-light",
      "/workbench/motion-night-light",
      "/workbench/plant-guardian",
      "/workbench/touchless-soap-dispenser",
    ].map(serve);

    expect(served).not.toContain("<i>smartParkingBarrier</i>");
  });
});

describe("only a workbench URL opens a build", () => {
  it("leaves the session alone everywhere else", () => {
    /* The reading screens carry whatever build the session already had. With
       none opened that is `defaultBuild`, and this asserts the default is
       reached by falling back rather than by matching. */
    for (const path of ["/", "/projects", "/workspace", "/projects/traffic-light"]) {
      expect(serve(path)).toBe("<i>smartParkingBarrier</i>");
    }
  });

  it("does not re-open a build from the completion screen", () => {
    /* `/complete/traffic-light` carries the same slug. Matching it would rebuild
       the session from scratch and throw away the finished state the summary is
       a report about. */
    expect(benchOnPath("/complete/traffic-light")).toBeUndefined();
    expect(benchOnPath("/projects/traffic-light")).toBeUndefined();
  });

  it("answers undefined for a slug with no bench, rather than inventing one", () => {
    expect(benchOnPath("/workbench/not-a-chapter")).toBeUndefined();
    expect(benchOnPath("/workbench")).toBeUndefined();
    expect(benchOnPath("/workbench/traffic-light/extra")).toBeUndefined();
    expect(benchOnPath(null)).toBeUndefined();
  });

  it("reads a workbench slug whatever the trailing slash", () => {
    expect(benchOnPath("/workbench/traffic-light/")?.projectId).toBe(
      "trafficLight",
    );
  });
});
