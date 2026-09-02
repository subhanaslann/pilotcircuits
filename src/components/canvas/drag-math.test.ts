import { describe, expect, it } from "vitest";
import {
  AMBIGUOUS,
  CATCH_PX,
  snapRadius,
  carriedFrom,
  carriedTo,
  gridSpacing,
  handlePoint,
  hitRadius,
  minSpacing,
  MIN_TARGET_PX,
  nearestTarget,
  race,
  slopFor,
  travelled,
  zoomToAim,
  type AimTarget,
} from "@/components/canvas/drag-math";
import { PITCH, zoom } from "@/lib/circuit/geometry";
import { HEADER_PITCH } from "@/lib/circuit/wokwi";
import {
  breathingLamp,
  lampCandidates,
  lampEmpty,
  lampGrabPoint,
  lampPlacement,
  lampSceneFrom,
} from "@/lib/circuit/breathing-lamp";
import {
  lightEmpty,
  lightGrabPoint,
  lightPlacement,
  lightSceneFrom,
} from "@/lib/circuit/traffic-light";
import {
  candidatesFor,
  tryAttach,
  type Placement,
} from "@/lib/circuit/placement";
import { diff, extras } from "@/lib/circuit/graph";

/**
 * The gesture, at four zooms.
 *
 * Chapter one's real numbers, not a fixture: the header row out of the finished
 * lamp, aimed at through the same `grabPoint` the picker draws its marks at.
 * A change to a pin table or a threshold breaks this file, which is the point —
 * the tighter catch below is only safe because the tables are pinned.
 */
const header: AimTarget[] = lampCandidates.map((id) => ({
  id,
  at: lampGrabPoint(breathingLamp.nodes[id]),
}));

const at = (id: string) => header.find((t) => t.id === id)!.at;
/** The measured opening fit of `/workbench/breathing-lamp` at 1440 wide. */
const ZOOMS = [0.4, 1, 2.264, 3];

describe("the numbers this rests on", () => {
  it("the Uno's header pitch is 9.8958 scene units", () => {
    expect(HEADER_PITCH).toBeCloseTo(9.895833, 5);
  });

  it("the breadboard pitch is exactly 10", () => {
    expect(PITCH).toBe(10);
  });

  it("the candidates are one header pitch apart", () => {
    expect(minSpacing(header)).toBeCloseTo(HEADER_PITCH, 4);
  });

  it("D9 and D8 are 10.4167 apart — the split in the header is real", () => {
    expect(Math.abs(at("board.D8").x - at("board.D9").x)).toBeCloseTo(
      10.416667,
      4,
    );
  });
});

describe("snapRadius", () => {
  /**
   * The defect this replaces, stated as arithmetic.
   *
   * `PITCH * 4` is 40 scene units — 4.04 header holes in every direction. It
   * did not choose a wrong neighbour, but it did mean a release four holes
   * clear of the board still landed in one, so a nudge that missed could not be
   * told from a deliberate removal.
   */
  it("is a fraction of the 4-pitch disc it replaces, at working zooms", () => {
    const spacing = minSpacing(header);
    for (const k of [1, 2.264, 3]) {
      expect(snapRadius(k, spacing), `k=${k}`).toBeLessThan(PITCH * 4 * 0.35);
    }
  });

  it("stays magnetic at 40% zoom, where a hole is four pixels wide", () => {
    const spacing = minSpacing(header);
    expect(snapRadius(0.4, spacing)).toBeGreaterThan(spacing * 0.5);
  });

  it("never drops below the width of a fingertip's worth of board", () => {
    const spacing = minSpacing(header);
    for (const k of ZOOMS) {
      expect(snapRadius(k, spacing), `k=${k}`).toBeGreaterThanOrEqual(
        Math.min(spacing, PITCH * 0.6) - 1e-9,
      );
    }
  });

  /* Marks are controls and paint order decides which of two overlapping ones
     gets the click, so these DO have to be capped. */
  it("hit marks never overlap, at any zoom", () => {
    const spacing = minSpacing(header);
    for (const k of ZOOMS) {
      expect(hitRadius(k, spacing) * 2, `k=${k}`).toBeLessThan(spacing);
    }
  });
});

describe("race", () => {
  const spacing = minSpacing(header);

  it("lands on the hole the lead is drawn over, at every zoom", () => {
    for (const k of ZOOMS) {
      const r = snapRadius(k, spacing);
      for (const target of header) {
        expect(race(target.at, header, r), `${target.id} at k=${k}`).toEqual({
          kind: "target",
          id: target.id,
        });
      }
    }
  });

  /**
   * The user's symptom 5, as a test: aiming at GND must not land in D13.
   *
   * With a 40-unit catch and the pointer-as-aim-point, a drop meant for `GND`
   * resolved against nine candidates and the winner depended on where inside
   * the LED's body the person had grabbed it.
   */
  it("aiming at GND commits GND and never its neighbours", () => {
    const spacingNow = minSpacing(header);
    for (const k of ZOOMS) {
      const r = snapRadius(k, spacingNow);
      expect(race(at("board.GND"), header, r)).toEqual({
        kind: "target",
        id: "board.GND",
      });
    }
  });

  it("splits the gap between two holes at 50%, not at 29%", () => {
    const r = snapRadius(1, spacing);
    const a = at("board.D9");
    const b = at("board.D10");
    /* D10 is to the LEFT of D9: the Uno's header counts down as it goes right.
       Just past the midpoint towards each must be that one, and array order
       must decide neither. */
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const eps = 1;
    expect(race({ x: mid.x - eps, y: mid.y }, header, r)).toEqual({
      kind: "target",
      id: "board.D10",
    });
    expect(race({ x: mid.x + eps, y: mid.y }, header, r)).toEqual({
      kind: "target",
      id: "board.D9",
    });
  });

  it("calls a dead heat ambiguous rather than picking one by rounding", () => {
    const r = snapRadius(1, spacing);
    const a = at("board.D9");
    const b = at("board.D10");
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    expect(race(mid, header, r).kind).toBe("ambiguous");
  });

  it("keeps a target until a rival is clearly nearer", () => {
    const r = snapRadius(3, spacing);
    const a = at("board.D9");
    /* A hair towards D10, well inside the sticky band. */
    const nudged = { x: a.x - 0.6, y: a.y };
    expect(race(nudged, header, r, "board.D9")).toEqual({
      kind: "target",
      id: "board.D9",
    });
  });

  /**
   * The three intentions a release can carry, told apart by distance.
   *
   * A drop on nothing used to mean *let this lead go*, unconditionally — so
   * the failure mode of a mis-aim was silent destruction with no undo. Nudge a
   * seated resistor one hole sideways, miss, and the part went back in the box.
   */
  it("a release near the header but on no hole is a miss, not a removal", () => {
    const r = snapRadius(1, spacing);
    const a = at("board.D9");
    expect(race({ x: a.x, y: a.y - r * 2 }, header, r).kind).toBe("miss");
  });

  it("a release out on the desk is a removal", () => {
    const r = snapRadius(1, spacing);
    const a = at("board.D9");
    expect(race({ x: a.x, y: a.y - 400 }, header, r).kind).toBe("away");
  });

  it("an empty candidate list is never a target", () => {
    expect(race({ x: 0, y: 0 }, [], 5).kind).toBe("away");
  });

  /**
   * The reachability case the chapter is built on.
   *
   * A seated LED's free long leg sits 0.5208 units from `board.D13`. Offered at
   * its own node, the two are one target; offered at `grabPoint` — a pitch and
   * a half up the leg — they are two, and both are reachable.
   */
  it("a free lead and the hole beneath it are two separate targets", () => {
    const scene = breathingLamp;
    const anode = scene.nodes["led.anode"];
    const withLead: AimTarget[] = [
      ...header,
      { id: "led.anode", at: lampGrabPoint(anode) },
    ];
    const spacingWithLead = minSpacing(withLead);
    const r = snapRadius(2.264, spacingWithLead);
    expect(race(lampGrabPoint(anode), withLead, r)).toEqual({
      kind: "target",
      id: "led.anode",
    });
    expect(race(at("board.D13"), withLead, r)).toEqual({
      kind: "target",
      id: "board.D13",
    });
  });
});

describe("zoomToAim", () => {
  const spacing = minSpacing(header);

  it("asks for a closer look when the holes are 9 px apart", () => {
    /* The opening fit of `/workbench/breathing-lamp`, measured in the browser:
       the whole board in view puts the header row at about 9 CSS px per hole. */
    const needed = zoomToAim(0.93, spacing);
    expect(needed).not.toBeNull();
    expect(needed! * spacing).toBeCloseTo(MIN_TARGET_PX, 6);
  });

  it("leaves a view that is already close enough exactly where it is", () => {
    expect(zoomToAim(3, spacing)).toBeNull();
  });

  it("never zooms out", () => {
    for (const k of ZOOMS) {
      const needed = zoomToAim(k, spacing);
      if (needed !== null) expect(needed).toBeGreaterThan(k);
    }
  });
});

/**
 * The whole gesture, end to end, on chapter one's real geometry.
 *
 * `race` is exercised above on the header row alone. This runs the arithmetic
 * the hook actually performs — aim from the carried lead's tip, plus the
 * pointer's travel, against the candidate set the model offers — for each of
 * the three joins the chapter asks for, at four zooms.
 */
describe("chapter one, built by hand", () => {
  const candidates = (placement: Placement, terminal: string): AimTarget[] =>
    candidatesFor(lampPlacement, placement, terminal)
      .map((id) => lampSceneFrom(placement).nodes[id])
      .filter((n) => n !== undefined)
      .map((n) => ({ id: n.id, at: lampGrabPoint(n) }));

  /** What `usePartDrag` computes: the lead's tip, moved by the pointer. */
  const commit = (
    placement: Placement,
    terminal: string,
    to: { x: number; y: number },
    k: number,
  ) => {
    const scene = lampSceneFrom(placement);
    const tip = scene.nodes[terminal];
    const offered = candidates(placement, terminal);
    /* The person lands the carried tip on the target's mark, which is what the
       drawing shows them doing: the part translates with the pointer, so the
       tip they can see going into the header is the point that is measured. */
    const aim = tip ? { x: to.x, y: to.y } : to;
    return race(aim, offered, snapRadius(k, minSpacing(offered)));
  };

  const seat = (p: Placement, terminal: string, target: string | null) => {
    const r = tryAttach(lampPlacement, p, terminal, target);
    return r.kind === "attached" ? r.placement : p;
  };

  it("seats the LED's short leg in GND", () => {
    for (const k of ZOOMS) {
      const target = candidates(lampEmpty, "led.cathode").find(
        (t) => t.id === "board.GND",
      )!;
      expect(commit(lampEmpty, "led.cathode", target.at, k), `k=${k}`).toEqual({
        kind: "target",
        id: "board.GND",
      });
    }
  });

  it("seats the resistor's board-side lead in D9 without disturbing GND", () => {
    const p = seat(lampEmpty, "led.cathode", "board.GND");
    const offered = candidates(p, "res.out");
    /* GND is taken, so it is not even on offer. */
    expect(offered.map((t) => t.id)).not.toContain("board.GND");
    const d9 = offered.find((t) => t.id === "board.D9")!;
    for (const k of ZOOMS) {
      expect(commit(p, "res.out", d9.at, k), `k=${k}`).toEqual({
        kind: "target",
        id: "board.D9",
      });
    }
  });

  /**
   * The chapter's central join, and the one the geometry is hardest on.
   *
   * With the cathode in GND the LED's free long leg sits 0.52 scene units from
   * `board.D13` — one twentieth of a hole. Offered at its own node the two are
   * one target; offered a pitch and a half up the leg, where a second lead is
   * physically clipped on, they are two, and both are reachable.
   */
  it("joins the resistor's free lead onto the LED's long leg", () => {
    let p = seat(lampEmpty, "led.cathode", "board.GND");
    p = seat(p, "res.out", "board.D9");
    const offered = candidates(p, "res.in");
    expect(offered.map((t) => t.id)).toContain("led.anode");
    const anode = offered.find((t) => t.id === "led.anode")!;
    for (const k of ZOOMS) {
      expect(commit(p, "res.in", anode.at, k), `k=${k}`).toEqual({
        kind: "target",
        id: "led.anode",
      });
    }
    /* And the hole 0.52 units under it stays reachable. */
    const d13 = offered.find((t) => t.id === "board.D13")!;
    for (const k of ZOOMS) {
      expect(commit(p, "res.in", d13.at, k), `k=${k}`).toEqual({
        kind: "target",
        id: "board.D13",
      });
    }
  });

  it("the finished build is what the sketch asks for", () => {
    let p = seat(lampEmpty, "led.cathode", "board.GND");
    p = seat(p, "res.out", "board.D9");
    p = seat(p, "res.in", "led.anode");
    const scene = lampSceneFrom(p);
    expect(diff(scene).mismatches).toHaveLength(0);
    expect(extras(scene)).toHaveLength(0);
  });
});

describe("travel and slop", () => {
  it("measures the hand in CSS px, so zoom cannot change what a click is", () => {
    expect(travelled({ x: 0, y: 0 }, { x: 3, y: 0 }, slopFor("mouse"))).toBe(
      false,
    );
    expect(travelled({ x: 0, y: 0 }, { x: 7, y: 0 }, slopFor("mouse"))).toBe(
      true,
    );
  });

  it("gives a finger more room than a mouse", () => {
    expect(slopFor("touch")).toBeGreaterThan(slopFor("mouse"));
    expect(travelled({ x: 0, y: 0 }, { x: 7, y: 0 }, slopFor("touch"))).toBe(
      false,
    );
  });
});

describe("carriedTo", () => {
  it("moves the lead by exactly what the pointer moved", () => {
    expect(
      carriedTo({ x: 100, y: 50 }, { x: 10, y: 10 }, { x: 30, y: 4 }),
    ).toEqual({ x: 120, y: 44 });
  });

  it("a pointer that has not moved leaves the lead where it is", () => {
    const origin = { x: 7, y: 9 };
    expect(carriedTo(origin, { x: 3, y: 3 }, { x: 3, y: 3 })).toEqual(origin);
  });
});

describe("AMBIGUOUS is a narrow band", () => {
  it("a runner-up comfortably outside it is a clean win", () => {
    const targets: AimTarget[] = [
      { id: "near", at: { x: 0, y: 0 } },
      { id: "far", at: { x: 5 + 5 * AMBIGUOUS + 1, y: 0 } },
    ];
    expect(race({ x: 5, y: 0 }, targets, 100)).toEqual({
      kind: "target",
      id: "near",
    });
  });

  it("a runner-up inside it is a coin flip and is handed back", () => {
    const targets: AimTarget[] = [
      { id: "near", at: { x: 0, y: 0 } },
      { id: "far", at: { x: 5 + 5 * (AMBIGUOUS - 0.02), y: 0 } },
    ];
    expect(race({ x: 5, y: 0 }, targets, 100)).toEqual({
      kind: "ambiguous",
      near: "near",
    });
  });
});

/**
 * The bug that made every wire on the bench unmovable.
 *
 * Picking a lead up grows the sentence above the canvas by a row of buttons, so
 * the region under it is pushed down the page and shortened **while the gesture
 * is in flight**. The travel used to be measured across that seam — the press
 * converted to scene units once at pointer-down, every later event converted
 * against a frame 48 CSS px lower — and the difference read as scene travel the
 * hand never made.
 *
 * At the opening fit that is 28 units, nearly three header holes and well past
 * `RELEASE_FACTOR`. So nudging a seated lead one hole sideways answered `away`,
 * which is the removal: the part went back in the kit, every time.
 */
describe("the aim survives the canvas moving under the gesture", () => {
  const k = 1.698;
  /** The region's top edge, in CSS px, before and after the header grows. */
  const frameAt = (top: number) => (clientX: number, clientY: number) => ({
    x: (clientX - 252) / k,
    y: (clientY - top) / k,
  });

  const origin = { x: 510.208, y: 439.375 };
  const press = { x: 884, y: 449 };
  /** One hole to the left, and not one pixel up. */
  const release = { x: press.x - HEADER_PITCH * k, y: press.y };

  it("reads both ends of the travel in the frame that is current", () => {
    const settled = carriedFrom(origin, press, release, frameAt(139));
    const shifted = carriedFrom(origin, press, release, frameAt(139 + 48));
    expect(shifted).toEqual(settled);
  });

  it("lands on the neighbouring hole either way", () => {
    const radius = snapRadius(k, minSpacing(header));
    for (const top of [139, 187]) {
      const aim = carriedFrom(origin, press, release, frameAt(top));
      expect(race(aim, header, radius)).toEqual({
        kind: "target",
        id: "board.GND",
      });
    }
  });

  it("a snapshotted frame is what `away` looked like", () => {
    /* The old arithmetic, spelled out: the press converted once, against the
       frame it was pressed in, and the release against the one it was released
       in. Kept as a test so nobody reintroduces it believing it is equivalent. */
    const stale = carriedTo(
      origin,
      frameAt(139)(press.x, press.y),
      frameAt(187)(release.x, release.y),
    );
    expect(race(stale, header, snapRadius(k, minSpacing(header)))).toEqual({
      kind: "away",
    });
  });
});

/**
 * What the diagonal lift really costs, on a breadboard — and what it no longer
 * costs.
 *
 * Chapter two lifts a free lead half a pitch up and half a pitch right, and the
 * paragraph beside that constant says the mark then sits 7.071 = hypot(5, 5)
 * from every neighbouring hole. That is the number for a lead sitting ON the
 * grid, and a free lead never is: `candidatesFor` offers only free leads, and a
 * free lead stands one pin span from its seated sibling's hole. The LED's two
 * pins are 10 art px apart, which is 10.4167 scene units at `PX = 25/24`, so
 * the free anode is 0.4167 off the lattice and its mark lands 6.783 from the
 * nearest hole — not 7.071. The catch radius still comes out of that number
 * (3.052 rather than 3.18), because a click resolves by the catcher it lands
 * in, and two catchers that overlapped would misdeliver it.
 *
 * The pick-up zoom does not. It used to be asked for 3.538 here — over
 * `zoom.max`, so every click pick-up beside a free lead went to 3.0 — and it
 * now reads the grid alone: 2.425 at the header's pitch.
 */
describe("the mark a free lead offers on a breadboard", () => {
  const seated = (() => {
    const r = tryAttach(lightPlacement, lightEmpty, "led.red.cathode", "bb.f7");
    return r.kind === "attached" ? r.placement : lightEmpty;
  })();

  /** Carrying the red resistor's first lead, with the red LED half seated. */
  const offered: AimTarget[] = candidatesFor(
    lightPlacement,
    seated,
    "res.red.in",
  )
    .map((id) => lightSceneFrom(seated).nodes[id])
    .filter((n) => n !== undefined)
    .map((n) => ({ id: n.id, at: lightGrabPoint(n), kind: n.kind }));

  const spacing = minSpacing(offered);

  it("stands 6.783 from its nearest hole, not the lattice's 7.071", () => {
    expect(offered.some((t) => t.id === "led.red.anode")).toBe(true);
    expect(spacing).toBeCloseTo(6.783, 3);
  });

  it("which is what the catch radius comes out of", () => {
    expect(hitRadius(1, spacing)).toBeCloseTo(3.052, 3);
  });

  it("and the catchers still cannot touch, which is the point of the cap", () => {
    for (const k of ZOOMS) {
      expect(hitRadius(k, spacing) * 2, `k=${k}`).toBeLessThan(spacing);
    }
  });

  it("but the pick-up zoom reads the grid, and stays under zoom.max", () => {
    expect(gridSpacing(offered)).toBeCloseTo(HEADER_PITCH, 4);
    expect(zoomToAim(1, gridSpacing(offered))).toBeCloseTo(
      MIN_TARGET_PX / HEADER_PITCH,
      3,
    );
    expect(zoomToAim(1, gridSpacing(offered))!).toBeLessThan(zoom.max);
    /* What it was asked for before: the mark's spacing, past the ceiling. */
    expect(zoomToAim(1, spacing)!).toBeGreaterThan(zoom.max);
  });

  /**
   * The case the old note called hypothetical, and the kit reaches today.
   *
   * A resistor standing in the Uno header — `res.red.in` in `D3` — puts the
   * mark of its free lead exactly half a pitch above `D8`: an odd multiple of
   * half a pitch, the worst case the arithmetic has. The catchers on the board
   * shrink to 2.25 while it is on offer, as they must; the zoom no longer
   * follows it to 4.8.
   */
  it("a resistor in the header puts a mark exactly 5 units from D8", () => {
    const r = tryAttach(lightPlacement, lightEmpty, "res.red.in", "board.D3");
    const placement = r.kind === "attached" ? r.placement : lightEmpty;
    const scene = lightSceneFrom(placement);
    const offer: AimTarget[] = candidatesFor(
      lightPlacement,
      placement,
      "led.red.cathode",
    )
      .map((id) => scene.nodes[id])
      .filter((n) => n !== undefined)
      .map((n) => ({ id: n.id, at: lightGrabPoint(n), kind: n.kind }));
    expect(offer.some((t) => t.id === "res.red.out")).toBe(true);
    expect(minSpacing(offer)).toBeCloseTo(5, 2);
    expect(hitRadius(1, minSpacing(offer))).toBeCloseTo(2.25, 2);
    expect(gridSpacing(offer)).toBeCloseTo(HEADER_PITCH, 4);
    expect(zoomToAim(1, gridSpacing(offer))!).toBeLessThan(zoom.max);
  });
});

/**
 * Where the keyboard walk starts once a lead is in hand.
 *
 * The picker opened on index 0 whenever the lead was attached to nothing, and
 * index 0 is the board's top-left hole — `bb.f1` on chapter two, eighteen
 * columns from a leg standing over `F8`. It opens beside the leg now, and
 * "beside the leg" is the hole under the leg's own node: the diagonal lift
 * that `grabPoint` gives a free lead's mark pushes the mark nearer the next
 * column, so asking from the mark would start the walk one hole to the right
 * of where the leg is.
 */
describe("where the walk starts", () => {
  const seated = (() => {
    const r = tryAttach(lightPlacement, lightEmpty, "led.red.cathode", "bb.f7");
    return r.kind === "attached" ? r.placement : lightEmpty;
  })();
  const scene = lightSceneFrom(seated);
  const anode = scene.nodes["led.red.anode"]!;
  /** The list as `live-workbench.tsx` hands it over: sorted by mark. */
  const offered: AimTarget[] = candidatesFor(
    lightPlacement,
    seated,
    "led.red.anode",
  )
    .map((id) => scene.nodes[id])
    .filter((n) => n !== undefined)
    .map((n) => ({ id: n.id, at: lightGrabPoint(n) }))
    .sort((a, b) => a.at.x - b.at.x || a.at.y - b.at.y);

  it("is the hole the free leg stands over, not the top-left corner", () => {
    expect(offered[0].id).toBe("bb.f1");
    expect(nearestTarget({ x: anode.x, y: anode.y }, offered)).toBe("bb.f8");
  });

  it("and not the hole nearest the lifted mark, which is one column over", () => {
    expect(nearestTarget(lightGrabPoint(anode), offered)).toBe("bb.f9");
  });

  it("on chapter one it is the hole index 0 already was, so the flat walk is unchanged", () => {
    const r = tryAttach(lampPlacement, lampEmpty, "led.cathode", "board.GND");
    const placement = r.kind === "attached" ? r.placement : lampEmpty;
    const lamp = lampSceneFrom(placement);
    const node = lamp.nodes["led.anode"]!;
    const targets: AimTarget[] = candidatesFor(lampPlacement, placement, "led.anode")
      .map((id) => lamp.nodes[id])
      .filter((n) => n !== undefined)
      .map((n) => ({ id: n.id, at: lampGrabPoint(n) }))
      .sort((a, b) => a.at.x - b.at.x || a.at.y - b.at.y);
    expect(nearestTarget({ x: node.x, y: node.y }, targets)).toBe("board.D13");
    expect(targets[0].id).toBe("board.D13");
  });

  it("answers nothing for an empty list, and the earlier of two equals", () => {
    expect(nearestTarget({ x: 0, y: 0 }, [])).toBeUndefined();
    const tied: AimTarget[] = [
      { id: "left", at: { x: -5, y: 0 } },
      { id: "right", at: { x: 5, y: 0 } },
    ];
    expect(nearestTarget({ x: 0, y: 0 }, tied)).toBe("left");
  });
});

/**
 * The handle is on the lead, not on the mark.
 *
 * Both benches drew a lead's handle at `grabPoint` — the lifted point the
 * picker's marks and the drag's aim use — so a seated lead's handle was never
 * where the lead was drawn. Inside `CATCH_PX` at the opening fit; at `zoom.max`,
 * which `closer()` jumps to on every click pick-up, 21 CSS px off against a
 * 12 px catcher. A press on a seated cable end reached the canvas and panned
 * it, and a cable has no body to move it by instead.
 */
describe("handlePoint", () => {
  const seated = lightSceneFrom(lightPlacement.complete).nodes["led.red.cathode"]!;
  const pin = breathingLamp.nodes["led.cathode"]!;

  it("a seated lead's handle is on the lead itself", () => {
    expect(handlePoint(seated, false, lightGrabPoint)).toEqual({
      x: seated.x,
      y: seated.y,
    });
    expect(handlePoint(pin, false, lampGrabPoint)).toEqual({ x: pin.x, y: pin.y });
  });

  it("a loose lead's handle is its ring, at the lifted mark", () => {
    expect(handlePoint(seated, true, lightGrabPoint)).toEqual(
      lightGrabPoint(seated),
    );
    expect(handlePoint(pin, true, lampGrabPoint)).toEqual(lampGrabPoint(pin));
  });

  /* The measurement the fix rests on: at the zoom every click pick-up lands
     on, the lifted mark is farther from the lead than the catcher reaches. */
  it("the lifted mark is outside the catcher at zoom.max, on both benches", () => {
    const off = (n: { x: number; y: number }, at: { x: number; y: number }) =>
      Math.hypot(at.x - n.x, at.y - n.y) * zoom.max;
    expect(off(seated, lightGrabPoint(seated))).toBeGreaterThan(CATCH_PX);
    expect(off(pin, lampGrabPoint(pin))).toBeGreaterThan(CATCH_PX);
  });
});
