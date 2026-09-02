"use client";

import { useEffect, useRef, useState } from "react";
import { CoachCorner } from "@/components/agent/coach-corner";
import { AgentMascotLayer } from "@/components/canvas/agent-mascot";
import {
  CanvasViewport,
  type CanvasHandle,
} from "@/components/canvas/canvas-viewport";
import { LampSceneView } from "@/components/canvas/lamp-scene";
import { LabBlock } from "@/components/lab/lab-primitives";
import { Button } from "@/components/ui/button";
import { optionsFrom } from "@/components/workbench/use-agent-mascot";
import { fly, land, type Anchor, type MascotJob } from "@/lib/agent/mascot";
import {
  lampComplete,
  lampFitBox,
  lampSceneFrom,
} from "@/lib/circuit/breathing-lamp";
import { zoom as zoomLimits } from "@/lib/circuit/geometry";
import { node, type NodeId } from "@/lib/circuit/graph";

/**
 * C-24 · The ring, replayed without a host.
 *
 * The coach has a lab section and the ring did not: the only way to watch it
 * was to drive a real WebMCP host at the bench. The model is a pure function
 * of a job and a clock, so replaying its three jobs is cheap — and this is
 * where the size at zoom, the departure from the lamp and the return to it
 * can be looked at on their own, with the wheel, before a host is involved.
 *
 * Chapter one's finished build, because every one of its four leads has a
 * node to anchor to. The coach stands in the corner as the ring's home,
 * exactly as it does on the product's bench; the carry has no shelf to start
 * from here, so it is the `from: null` case — the ring arrives already
 * carrying, which is what the bench does when the tile is not on screen.
 */

const scene = lampSceneFrom(lampComplete);

const at = (id: NodeId): Anchor => {
  const found = node(scene, id);
  return { kind: "scene", x: found.x, y: found.y };
};

const JOBS = {
  read: {
    kind: "read",
    over: [at("board.D9"), at("res.out"), at("led.cathode"), at("board.GND")],
  },
  point: { kind: "point", at: at("board.D9") },
  carry: { kind: "carry", from: null, to: at("board.GND") },
} as const satisfies Record<string, MascotJob>;

export function RingSpecimen() {
  const canvas = useRef<CanvasHandle>(null);
  const [scale, setScale] = useState(1);

  /* The store is a singleton; a specimen that unmounts mid-flight must not
     leave it ticking against a viewport that has gone. */
  useEffect(() => () => land(), []);

  const play = (job: MascotJob) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    fly(job, optionsFrom(canvas.current?.getBounds() ?? null), reduced);
  };

  return (
    <LabBlock
      title="Read, point, carry"
      note="Each button is one of the ring's three jobs. Press one while another is playing: the ring continues from where it is rather than restarting. Zoom with the wheel first to see that it keeps its size."
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="secondary" size="sm" onClick={() => play(JOBS.read)}>
            Read
          </Button>
          <Button variant="secondary" size="sm" onClick={() => play(JOBS.point)}>
            Point
          </Button>
          <Button variant="secondary" size="sm" onClick={() => play(JOBS.carry)}>
            Carry
          </Button>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => canvas.current?.fitView()}
          >
            Fit
          </Button>
        </div>

        <div className="relative h-[460px]">
          <CanvasViewport
            ref={canvas}
            ariaLabel="Breathing Lamp circuit, with the agent's ring"
            fitBox={lampFitBox}
            onScaleChange={setScale}
          >
            <LampSceneView
              scene={scene}
              showLabels={scale >= zoomLimits.labelThreshold}
            />
          </CanvasViewport>
          {/* The corner the product puts it in, on the mat plate it brings
              when there is no shelf. `z-10` as the workspace's furniture is,
              so the ring's layer (`z-[15]`) crosses it on the way out. */}
          <div className="absolute top-3 right-3 z-10">
            <CoachCorner ground="mat" mood="idle" line="Listening" />
          </div>
          <AgentMascotLayer canvas={canvas} primary />
        </div>
      </div>
    </LabBlock>
  );
}
