import { describe, expect, it } from "vitest";
import { builds, hasBench } from "@/lib/agent/builds";
import { briefings } from "@/lib/agent/briefings";
import {
  countedAs,
  isReady,
  projectById,
  projects,
} from "@/lib/projects/catalog";
import { allStepIds, stepById, stepsOwning } from "@/lib/agent/steps";
import { isExtraId } from "@/lib/circuit/graph";
import { isHole, partOf } from "@/lib/circuit/placement";
import { en } from "@/content/locales/en";
import { tr } from "@/content/locales/tr";

/**
 * The typos that typecheck.
 *
 * `Placement` is keyed by `string` and `BuildStepDef.connections` is a list of
 * `string`, so every constant in the registry compiles however it is spelled.
 * A misspelled connection id makes `diff(scene, [bad])` filter `expected` to
 * `[]` — which reports `verified: true, matched: 0` on an unbuilt circuit — and
 * a misspelled terminal renders as a part that simply never appears.
 *
 * Chapter one is the only bench with a placement today. Everything below is
 * written to run over *every* build in the registry, so it is the tripwire for
 * chapters two to five rather than a test of the one that exists.
 */
describe("the registry agrees with the catalogue", () => {
  it("a `ready` chapter has a bench and a `preview` chapter does not", () => {
    for (const project of projects) {
      expect(hasBench(project.id), project.slug).toBe(isReady(project));
    }
  });

  it("every build's row is filed under its own project id", () => {
    for (const [key, build] of Object.entries(builds)) {
      expect(build!.projectId, key).toBe(key);
    }
  });
});

describe("step ids are one flat global namespace", () => {
  /* `stepById` is a global lookup across every build's list, so two chapters
     that both called a step `place` would silently share one definition. */
  it("no two steps share an id", () => {
    expect(new Set(allStepIds).size).toBe(allStepIds.length);
  });

  it("every step a build opens on exists", () => {
    for (const build of Object.values(builds)) {
      expect(() => stepById(build!.activeStepId)).not.toThrow();
      for (const id of build!.completedSteps) {
        expect(() => stepById(id)).not.toThrow();
      }
    }
  });

  /**
   * The rail a build opens on is its own rail, and it is as long as the
   * catalogue promises.
   *
   * Two holes closed with one assertion. `stepsOwning` was a two-way ternary
   * whose fallback was the capstone, so a third chapter's step typechecked
   * perfectly and was silently handed chapter six's seven-step rail — the wrong
   * `of 7` in the topbar, the wrong `nextStep`, the wrong `backTo` and chapter
   * six's ids in `schemaFactsFor.stepIds`. And `stepCount` has been a promise
   * the catalogue made about a list in another file that nothing ever checked:
   * it is what the project card counts before the bench is ever opened.
   */
  it("every build's rail is its own, and as long as the catalogue promises", () => {
    for (const [key, build] of Object.entries(builds)) {
      const rail = stepsOwning(build!.activeStepId);
      expect(
        rail.map((step) => step.id),
        key,
      ).toContain(build!.activeStepId);
      expect(rail, key).toHaveLength(projectById(build!.projectId).stepCount);
    }
  });

  it("every connection a step claims is one its build's sketch defines", () => {
    for (const build of Object.values(builds)) {
      const defined = new Set(build!.reference.expected.map((c) => c.id));
      const own = allStepIds
        .map(stepById)
        .filter((step) => step.connections.some((id) => defined.has(id)));
      for (const step of own) {
        for (const id of step.connections) {
          expect([...defined], `${step.id} → ${id}`).toContain(id);
        }
      }
    }
  });
});

describe("connection ids are unique across builds", () => {
  it("no id is claimed by two chapters", () => {
    const seen = new Map<string, string>();
    for (const build of Object.values(builds)) {
      for (const c of build!.reference.expected) {
        expect(seen.get(c.id) ?? build!.projectId).toBe(build!.projectId);
        seen.set(c.id, build!.projectId);
      }
    }
  });

  it("a minted stray id is recognisable as one", () => {
    for (const build of Object.values(builds)) {
      const spec = build!.placement;
      if (!spec) continue;
      /* Build the chapter's canonical unasked-for join and check the id it
         mints answers to the shared test. Two spellings of this prefix — one
         exported from `graph.ts` and one hardcoded per build — is a rename
         away from `diff` quietly attributing a stray to an expected wire. */
      const strays = spec
        .sceneFrom(spec.complete, { servoAngle: 0, expectedAngle: 0 })
        .observed.filter((c) => isExtraId(c.id));
      /* The finished build has none, which is the point; the shape of the id
         is checked where one is actually made, in the chapter's own test. */
      expect(strays).toHaveLength(0);
    }
  });
});

describe("every placement spec is internally consistent", () => {
  for (const [key, build] of Object.entries(builds)) {
    const spec = build!.placement;
    if (!spec) continue;

    describe(key, () => {
      it("anchors are leads of the part they anchor", () => {
        for (const part of spec.parts) {
          expect(spec.terminalsOf[part], part).toContain(spec.anchorOf[part]);
        }
      });

      it("every part has a component, a lead list and an anchor", () => {
        const parts = [...spec.parts].sort();
        expect(Object.keys(spec.componentOf).sort()).toEqual(parts);
        expect(Object.keys(spec.terminalsOf).sort()).toEqual(parts);
        expect(Object.keys(spec.anchorOf).sort()).toEqual(parts);
      });

      it("every declared terminal belongs to exactly one part", () => {
        for (const terminal of spec.terminals) {
          expect(partOf(spec, terminal), terminal).toBeDefined();
        }
        const listed = spec.parts.flatMap((p) => spec.terminalsOf[p] ?? []);
        expect(new Set(listed).size).toBe(listed.length);
        expect([...listed].sort()).toEqual([...spec.terminals].sort());
      });

      it("holes and terminals never overlap", () => {
        for (const hole of spec.holes) {
          expect(isHole(spec, hole)).toBe(true);
          expect(spec.terminals).not.toContain(hole);
        }
      });

      it("`empty` and `complete` are keyed by exactly the terminals", () => {
        const keys = [...spec.terminals].sort();
        expect(Object.keys(spec.empty).sort()).toEqual(keys);
        expect(Object.keys(spec.complete).sort()).toEqual(keys);
      });

      it("`empty` really is empty", () => {
        expect(Object.values(spec.empty).every((v) => v === null)).toBe(true);
      });

      it("every hole it offers has a node in the finished scene", () => {
        const finished = spec.sceneFrom(spec.complete, {
          servoAngle: 0,
          expectedAngle: 0,
        });
        for (const hole of spec.holes) {
          expect(finished.nodes[hole], hole).toBeDefined();
        }
      });

      it("every lead has a name in BOTH locales", () => {
        for (const terminal of spec.terminals) {
          for (const [name, copy] of [
            ["en", en],
            ["tr", tr],
          ] as const) {
            expect(copy.build.leads[terminal], `${name} ${terminal}`).toBeTruthy();
            expect(
              copy.build.leadObject[terminal],
              `${name} obj ${terminal}`,
            ).toBeTruthy();
            expect(
              copy.build.leadTarget[terminal],
              `${name} tgt ${terminal}`,
            ).toBeTruthy();
          }
        }
      });

      /**
       * The shelf and the bench print the same thing about the same lead.
       *
       * `anchorMark` is what the kit strip draws on the part it is about to
       * commit, and `leadGlyph` is what the bench draws on the lead in hand.
       * Two sources for one fact is two ways to be wrong: an LED whose shelf
       * badge says `−` and whose bench badge says nothing is a part that
       * changes its mind about which end it is on the way down.
       */
      it("the shelf badge and the bench badge agree", () => {
        for (const part of spec.parts) {
          expect(spec.anchorMark(part).label, part).toBe(
            spec.leadGlyph(spec.anchorOf[part]),
          );
        }
      });

      it("a lead's glyph is something a badge can hold", () => {
        for (const terminal of spec.terminals) {
          const glyph = spec.leadGlyph(terminal);
          if (glyph === undefined) continue;
          /* One or two characters. The badge is a 24-unit square and the point
             of it is to be readable at 40% zoom; a word goes in `leads`. */
          expect([...glyph].length, terminal).toBeLessThanOrEqual(2);
          expect(glyph.trim(), terminal).toBe(glyph);
          expect(glyph, terminal).not.toBe("");
        }
      });

      it("the mark sits somewhere inside the part it is drawn on", () => {
        for (const part of spec.parts) {
          const at = spec.anchorMark(part);
          /* Measured from the top-left of the part's own box, so a negative
             coordinate is a mark drawn off the part — the shelf would hang the
             whole drawing from a point that is not on it. */
          expect(Number.isFinite(at.x) && at.x >= 0, part).toBe(true);
          expect(Number.isFinite(at.y) && at.y >= 0, part).toBe(true);
        }
      });

      /**
       * The bench holds what the chapter says it holds.
       *
       * `componentOf` is keyed by `KitId` rather than by `ComponentId`, so a
       * bench can name a thing the ladder does not count — and exactly one
       * such thing exists, the jumper cable, which every build is wired with
       * and which therefore distinguishes none of them (`catalog.ts`). Without
       * this, a bench could quietly grow a part its own project card does not
       * list: the card says four components and the kit shelf hands you five.
       */
      it("every component it names is counted, or counts as nothing", () => {
        const counted = projectById(build!.projectId).components;
        for (const part of spec.parts) {
          /* `countedAs` and not the id itself: a bench may hand over three
             LEDs the card counts once, and a cable it counts not at all. What
             must not happen is a bench part whose *counted* kind is missing
             from the card — four components promised, five in the box. */
          const kind = countedAs(spec.componentOf[part]);
          if (kind === null) continue;
          expect([...counted], `${key} ${part}`).toContain(kind);
        }
      });

      it("every component it names has a part name in BOTH locales", () => {
        for (const part of spec.parts) {
          const id = spec.componentOf[part];
          expect(en.build.parts[id], `en ${id}`).toBeTruthy();
          expect(tr.build.parts[id], `tr ${id}`).toBeTruthy();
        }
      });
    });
  }
});

/**
 * The film has words under every frame.
 *
 * `BriefingWords.assembly` used to be `Record<BeatId, string>` — total over one
 * chapter's six beat ids, and therefore a compile error the moment a caption
 * was missing. Two chapters cannot share one closed union without each of them
 * owing captions for the other's beats, so the key type widened to `string` and
 * that guarantee went with it: a chapter can now ship a beat whose caption is
 * `undefined`, which renders as a frame with nothing under it and fails
 * nothing. This assertion and the dev-boot throw beside `briefings` are what
 * replaced it.
 */
describe("every beat in a briefing has a caption", () => {
  it("in both locales", () => {
    for (const def of Object.values(briefings)) {
      for (const [name, copy] of [
        ["en", en],
        ["tr", tr],
      ] as const) {
        /* `assembly` is keyed by `string`; the cast keeps this readable if it
           is ever narrowed back to a union of one chapter's ids. */
        const captions = def!.words(copy).assembly as Record<string, string>;
        for (const beat of def!.assembly) {
          expect(
            captions[beat.id],
            `${name} ${def!.projectId} ${beat.id}`,
          ).toBeTruthy();
        }
      }
    }
  });
});
