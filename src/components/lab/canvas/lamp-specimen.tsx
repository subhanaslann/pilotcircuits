"use client";

import { useRef, useState } from "react";
import {
  CanvasViewport,
  type CanvasHandle,
} from "@/components/canvas/canvas-viewport";
import { LampSceneView } from "@/components/canvas/lamp-scene";
import { LabBlock } from "@/components/lab/lab-primitives";
import { Button } from "@/components/ui/button";
import {
  lampComplete,
  lampPlacement,
  lampSceneFrom,
} from "@/lib/circuit/breathing-lamp";
import { zoom as zoomLimits } from "@/lib/circuit/geometry";
import { node } from "@/lib/circuit/graph";
import { attach } from "@/lib/circuit/placement";
import { boundsOf } from "@/lib/circuit/routing";

/**
 * Chapter one on the bench, before it has a bench.
 *
 * The capstone's specimen above proves the canvas; this one proves it is not
 * the capstone's canvas. Three parts, no breadboard, and the same correction
 * vocabulary pointed at a different hole.
 *
 * Two blocks, because there are now two ways to be wrong. A lead in the wrong
 * hole is a connection the sketch asks for that landed somewhere else, and it
 * draws the error/target pair with the callout between them. A join the sketch
 * never named has no target — there is nowhere for it to go — so it draws the
 * error mark alone, and the fix is a removal rather than a move. This page is
 * the only reference rendering of either, which is the whole reason the second
 * one is here.
 */
export function LampSpecimen() {
  return (
    <div>
      <MisplacedLead />
      <UnexpectedJoin />
    </div>
  );
}

/**
 * The lead in the wrong hole — C-13's original subject.
 *
 * The placement spreads `lampComplete` and moves exactly one lead, which is
 * the fiction: a fully assembled build with one thing in the wrong place. The
 * middle join comes along in the spread and should, or this would be a picture
 * of two mistakes with a callout about one of them.
 */
function MisplacedLead() {
  const canvas = useRef<CanvasHandle>(null);
  const [scale, setScale] = useState(1);
  const [fixed, setFixed] = useState(false);
  const [showingCorrection, setShowingCorrection] = useState(false);
  const [lit, setLit] = useState(false);

  /* The specimen keeps the misplaced lead the product no longer stages: this
     page is the record of the C-13 vocabulary, and the mistake it draws is
     the one a person can now make for themselves. */
  const scene = lampSceneFrom(
    fixed ? lampComplete : { ...lampComplete, "res.out": "board.D8" },
  );

  const highlight =
    showingCorrection && !fixed
      ? {
          connectionId: "bl.c.pin",
          errorPin: "board.D8",
          targetPin: "board.D9",
          /* Read off the scene, exactly as `wiringFinding` does, rather than
             written here. It used to be the English word `Lead`, which is both
             untranslated and not what the bench renders — the callout sets its
             subject in mono beside `D8 → D9` because a finding only ever stores
             words the hardware prints (rule 13), and this lead's is `220Ω`. A
             lead name out of the dictionary would be the right register for a
             sentence and the wrong one for this capsule, which is 20 pitches
             wide and already spending half of them on the pin pair. */
          subject: node(scene, "res.out").label ?? "res.out",
        }
      : undefined;

  return (
    <LabBlock
      title="A lead in the wrong hole"
      note="The connection the sketch asks for, landed one hole over. Both pins are marked and the callout names the move, because there is somewhere for the lead to go."
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setShowingCorrection(true);
              const box = boundsOf(
                [node(scene, "board.D8"), node(scene, "board.D9")],
                110,
              );
              if (box) canvas.current?.focusOn(box, { scale: 2.9 });
            }}
          >
            Show me
          </Button>
          <Button
            variant={fixed ? "tertiary" : "primary"}
            size="sm"
            onClick={() => {
              setFixed((was) => !was);
              setShowingCorrection(false);
            }}
          >
            {fixed ? "Put it back" : "I moved it"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setLit((was) => !was)}
          >
            {lit ? "Sketch stopped" : "Sketch running"}
          </Button>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => canvas.current?.fitView()}
          >
            Fit
          </Button>
        </div>

        <div className="h-[460px]">
          <CanvasViewport
            ref={canvas}
            ariaLabel="Breathing Lamp circuit"
            onScaleChange={setScale}
          >
            <LampSceneView
              scene={scene}
              showLabels={scale >= zoomLimits.labelThreshold}
              highlight={highlight}
              lit={lit}
            />
          </CanvasViewport>
        </div>
      </div>
    </LabBlock>
  );
}

/**
 * The join the sketch does not ask for — the unasked-for-join vocabulary,
 * with nowhere to go.
 *
 * Built by `attach` rather than written as a literal, and that is the whole
 * argument: a hand-written `{ ...lampComplete, "res.in": "board.D13" }` also
 * typechecks and also draws, but it is a bench nobody can reach — putting a
 * lead into a hole releases whatever was joined onto it, so `led.anode -> res.in`
 * cannot survive `res.in` going into D13. A specimen of a state the product
 * cannot produce is a reference rendering of nothing. Going through the same
 * write the bench uses makes the claim structural instead of a comment.
 *
 * What that write costs is the point of the frame: in this chapter a stray join
 * always displaces an expected one. Four leads and three joins leave nothing
 * free, so `bl.c.anode` is gone here, and `I removed it` gets the stray off
 * without finishing the build.
 */
function UnexpectedJoin() {
  const canvas = useRef<CanvasHandle>(null);
  const [scale, setScale] = useState(1);
  const [removed, setRemoved] = useState(false);
  const [showing, setShowing] = useState(false);

  const strayed = attach(lampPlacement, lampComplete, "res.in", "board.D13");
  const scene = lampSceneFrom(
    removed ? attach(lampPlacement, strayed, "res.in", null) : strayed,
  );

  /* `extraFinding`'s highlight, term for term: the minted id, the mark on the
     hole rather than on the lead — the lead's drawn position is half a unit
     from the hole one along and a disc there would accuse the wrong pin — and
     no `targetPin`, which is what keeps `CorrectionCallout` off. There is no
     move to name. */
  const highlight =
    showing && !removed
      ? {
          connectionId: "bl.x.res.in",
          errorPin: "board.D13",
          subject: node(scene, "res.in").label ?? "res.in",
        }
      : undefined;

  return (
    <LabBlock
      title="A join the sketch does not ask for"
      note="One mark, no target and no callout — the sketch names nowhere for this lead to go, so the only fix is to take it off. Removing it does not finish the build: the join it displaced still has to be made."
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setShowing(true);
              const box = boundsOf(
                [node(scene, "res.in"), node(scene, "board.D13")],
                110,
              );
              if (box) canvas.current?.focusOn(box, { scale: 2.9 });
            }}
          >
            Show me
          </Button>
          <Button
            variant={removed ? "tertiary" : "primary"}
            size="sm"
            onClick={() => {
              setRemoved((was) => !was);
              setShowing(false);
            }}
          >
            {removed ? "Put it back" : "I removed it"}
          </Button>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => canvas.current?.fitView()}
          >
            Fit
          </Button>
        </div>

        <div className="h-[460px]">
          <CanvasViewport
            ref={canvas}
            ariaLabel="Breathing Lamp circuit with an unexpected join"
            onScaleChange={setScale}
          >
            <LampSceneView
              scene={scene}
              showLabels={scale >= zoomLimits.labelThreshold}
              highlight={highlight}
            />
          </CanvasViewport>
        </div>
      </div>
    </LabBlock>
  );
}
