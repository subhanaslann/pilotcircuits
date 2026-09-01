import { describe, expect, it } from "vitest";
import {
  KIT_SHELF_GAP,
  shelfRowWidth,
} from "@/components/workbench/kit-strip";
import { declaredBodyAt } from "@/components/canvas/build-scene";
import { builds } from "@/lib/agent/builds";
import type { ProjectId } from "@/lib/projects/catalog";

/**
 * How much of the kit is on screen at the width the product promises.
 *
 * §16 names 1280 as the width everything has to work at, and `frame.tsx` does
 * the arithmetic: 1280 − 252 step rail − 360 agent panel leaves the workshop
 * column 668. The shelf spends 32 of that on its own padding, 19 on the `KIT`
 * caption and 20 on the gap after it, so the row of parts has **597**.
 *
 * Measured in the browser before this test existed, the shelf ran to 917 CSS
 * pixels on chapter two, 710 on chapter five and 600 on chapter three: six of
 * ten tiles visible on the worst, five of seven on the next. Nothing said so —
 * the fade at the edge is a signal that something continues, not a way to
 * reach it — and on chapter five the three rows off the edge were the LED, the
 * resistor and a jumper, which is to say steps five and six.
 *
 * Two levers closed four of the five chapters: `MAX_ROW_PX` caps a tile's
 * width, which is entirely about the two modules (an HC-SR04 is 45×25 mm, so
 * filling the row's height ran it 119px long), and the gap between tiles came
 * down from 28 to 16.
 *
 * Chapter two is arithmetic rather than an oversight and this test pins that
 * too: ten tiles carry 120px of their own padding and nine gaps another 144, so
 * 264 of the 597 are spent before a single part is drawn. Fitting the rest
 * would put every drawing under 34px wide, and a 220 Ω resistor 34px long is a
 * dash. It keeps the measured fade and the shelf's own scrollbar.
 */

/** The `<ul>`'s width in the workshop column at 1280. See the header. */
const SHELF_WIDTH = 597;

/** Every chapter the person assembles, and the kit it opens with. */
const KITS = Object.entries(builds)
  .filter(([, build]) => build?.placement)
  .map(([id, build]) => ({
    id: id as ProjectId,
    parts: build!.placement!.parts,
    componentOf: build!.placement!.componentOf,
  }));

const shelfWidth = (kit: (typeof KITS)[number]) =>
  kit.parts.reduce(
    (total, part) => total + shelfRowWidth(kit.componentOf[part]),
    0,
  ) +
  KIT_SHELF_GAP * (kit.parts.length - 1);

describe("the kit shelf at 1280", () => {
  it("has every assembled chapter to measure", () => {
    expect(KITS.map((k) => k.id).sort()).toEqual([
      "breathingLamp",
      "motionNightLight",
      "plantGuardian",
      "touchlessSoapDispenser",
      "trafficLight",
    ]);
  });

  it("shows every part of every chapter but the ten-part one", () => {
    for (const kit of KITS) {
      if (kit.id === "trafficLight") continue;
      expect(shelfWidth(kit), kit.id).toBeLessThanOrEqual(SHELF_WIDTH);
    }
  });

  it("caps a module so it cannot be three tiles wide", () => {
    /* The two that ran long, and the through-hole part they are measured
       against. Uncapped, `sensor` drew 130.8 and `servo` 105.9 against the
       resistor's 90.1. */
    const resistor = shelfRowWidth("resistor");
    for (const cased of ["sensor", "servo", "sensorMotion"] as const) {
      expect(shelfRowWidth(cased), cased).toBeLessThanOrEqual(resistor + 2);
    }
    /* And the cap does not shrink anything that already fitted: the row is a
       drawing before it is a box, and a part is drawn at the same size
       wherever it appears. */
    expect(resistor).toBeGreaterThan(80);
    expect(shelfRowWidth("led")).toBeGreaterThan(60);
  });

  it("records what chapter two costs, so a fix cannot be imagined", () => {
    const two = KITS.find((k) => k.id === "trafficLight")!;
    expect(two.parts.length).toBe(10);
    /* It still overflows, and by enough that no tile size closes it: the
       padding and the gaps alone are 264 of the 597. */
    expect(shelfWidth(two)).toBeGreaterThan(SHELF_WIDTH);
    const furniture = 12 * two.parts.length + KIT_SHELF_GAP * 9;
    expect(furniture).toBe(264);
    expect((SHELF_WIDTH - furniture) / two.parts.length).toBeLessThan(34);
  });
});

/**
 * A module's case does not travel, and the ghost has to know.
 *
 * `breadboard-bench.tsx`'s `carriedTo` has always said so — *a module's case is
 * a constant. It is on the bench or it is not; it is never in the air* — and
 * the shelf did not: `carriedAt` hung the whole part box off the anchor mark at
 * the cursor for every part alike, so the case jumped to the point the build
 * declares the moment the lead was released. Measured from the ghost's top-left
 * to the declared one, dropping each module's anchor lead into its finished
 * hole: PIR 97.7 scene units against a 94.5-unit-wide body, micro servo 124.8
 * against a 124.5-unit-tall one, soil probe 225, HC-SR04 20.7.
 *
 * The field that closes it is only correct while it is answered for exactly the
 * parts whose bodies are constants — a rigid part answering here would pin an
 * LED to one hole for the whole drag.
 */
describe("which parts declare a body the ghost must not carry", () => {
  const MODULES: Record<string, readonly string[]> = {
    motionNightLight: ["pir"],
    plantGuardian: ["probe"],
    touchlessSoapDispenser: ["sensor", "servo"],
  };

  it("answers for every module and for nothing else", () => {
    const found: string[] = [];
    for (const kit of KITS) {
      for (const part of kit.parts) {
        const at = declaredBodyAt(kit.id, part);
        if (at) found.push(`${kit.id}/${part}`);
        /* And the point is a point, not a half-answer. */
        if (at) expect(Number.isFinite(at.x) && Number.isFinite(at.y)).toBe(true);
      }
    }
    expect(found.sort()).toEqual(
      Object.entries(MODULES)
        .flatMap(([id, parts]) => parts.map((p) => `${id}/${p}`))
        .sort(),
    );
  });

  it("gives the same answer whatever the live bench looks like", () => {
    /* The case is a constant; the accessor reads the build's finished scene, so
       two calls a whole gesture apart cannot disagree. */
    expect(declaredBodyAt("touchlessSoapDispenser", "servo")).toEqual(
      declaredBodyAt("touchlessSoapDispenser", "servo"),
    );
  });
});
