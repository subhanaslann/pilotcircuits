"use client";

import { useSyncExternalStore, type Ref } from "react";
import { Led } from "@/components/canvas/parts/led";
import { Resistor } from "@/components/canvas/parts/resistor";
import { UnoBoard } from "@/components/canvas/parts/uno-board";
import { Hcsr04Artwork } from "@/components/canvas/parts/wokwi/hc-sr04-artwork";
import { ServoArtwork } from "@/components/canvas/parts/wokwi/servo-artwork";
import { material } from "@/components/illustration/spec";
import { BenchBreadboard } from "@/components/landing/scene/bench-breadboard";
import {
  AT,
  CABLES,
  ECHO,
  FRAME,
  cablePath,
  type Cable,
} from "@/components/landing/scene/bench-layout";
import { Mat, RigBoom, RigGround } from "@/components/landing/scene/rig";
import {
  getFrame,
  getServerFrame,
  subscribe,
} from "@/components/landing/scene/repair-demo";
import { useCopy } from "@/content/copy-provider";
import { artTransform, frame } from "@/lib/circuit/wokwi";
import { wireRoles } from "@/lib/design/tokens";

/**
 * S-01 · The bench.
 *
 * Two bands on one cutting mat. Above: a strip of road cut from cardboard, a
 * barrier on its kerb, the sensor watching the approach. Below: the breadboard,
 * the board, the two LEDs and their resistors, with eleven jumpers running
 * between the two.
 *
 * The parts are the workbench's own — the Wokwi elements (MIT), placed through
 * `wokwi.ts`'s unit bridge at their real sizes, with every wire end taken from
 * the part's own `pinInfo`. What this screen decides is only *where* they sit,
 * and it decides differently from the workbench on purpose: there the job is
 * wiring, here it is answering the question a stranger asks first.
 *
 * ## Why the rig
 *
 * Without a road the servo turns a stick, the sensor pings an empty room and
 * two LEDs change colour for nobody — six parts, none of them acting on
 * anything. The rig is what makes each of them legible, and it is cardboard
 * because that is what the catalogue says it is: *the barrier's arm, which you
 * cut yourself*.
 *
 * ## Drawing order is stacking order
 *
 * mat → card and road → sensor → cabinet → boom → breadboard, board, LEDs →
 * cables. The boom lands between the cabinet and the wires: it is bolted to
 * the horn and it passes over the road, not under it. The agent is not in
 * this list any more: its ring is drawn by `AgentMascotLayer` over the whole
 * frame, in screen pixels, the way the workbench draws it — see
 * `workshop-scene.tsx`. The `ref` is how that layer measures this drawing.
 */
export function BenchView({ ref }: { ref?: Ref<SVGSVGElement> }) {
  const f = useSyncExternalStore(subscribe, getFrame, getServerFrame);
  /* For the drawing's accessible name only. It was a Turkish literal here,
     which is the one string on the landing page the locale switch could not
     reach — a screen reader in English heard one sentence of Turkish. */
  const copy = useCopy();
  const echo: Cable = { ...ECHO, id: "c.sensor.echo", to: f.echo };

  /* Saturation, not opacity. Dropping the bench's opacity would drop it toward
     the mat and lose the parts; draining its colour keeps every edge exactly
     where it was and takes away only the thing the ring is competing for. */
  const drained =
    f.drain > 0.01
      ? { filter: `saturate(${(1 - f.drain * 0.86).toFixed(3)}) brightness(${(1 - f.drain * 0.3).toFixed(3)})` }
      : undefined;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={copy.landing.sceneImageLabel}
      className="block h-auto w-full"
    >
      {/* The mat stays: it is the bench, not the build, and dipping it too
          would flash the page's own ground through the drawing. */}
      <Mat />
      <g opacity={1 - f.dip}>

      <g style={drained}>
      <RigGround car={f.car} sonar={f.sonar} />

      {/* The sensor, set into the verge and looking up across the road. */}
      <g transform={artTransform(frame.sensor, AT.sensor)} aria-hidden="true">
        <Hcsr04Artwork />
      </g>

      {/* The cabinet. Its horn turns with the boom, so both are handed the same
          angle — Wokwi draws the horn pointing up at 0, and the rig means 0 to
          be the boom lying along the kerb. */}
      <g transform={artTransform(frame.servo, AT.servo)} aria-hidden="true">
        <ServoArtwork angle={f.boom + 90} hornColor={material.hornWhite} />
      </g>
      <RigBoom angle={f.boom} />

      <BenchBreadboard />
      <UnoBoard at={AT.board} />

      <Led x={AT.ledGreen.x} y={AT.ledGreen.y} colour="green" lit={f.green > 0.5} />
      <Led x={AT.ledRed.x} y={AT.ledRed.y} colour="red" lit={f.red > 0.5} />
      <Resistor x={AT.resistorGreen.x} y={AT.resistorGreen.y} />
      <Resistor x={AT.resistorRed.x} y={AT.resistorRed.y} />

      {/* Ten fixed cables and the one that moves. Rims first, all of them, so
          one cable's rim never draws over another's face where two touch. */}
      <g aria-hidden="true">
        {[...CABLES, echo].map((c) => (
          <CableRim key={`${c.id}-rim`} cable={c} />
        ))}
        {CABLES.map((c) => (
          <CableFace key={c.id} cable={c} pulse={f.pulses[c.id]} />
        ))}
      </g>
      </g>

      {/* The subject cable stays outside the drain, as the ring over it does:
          the two things the eye is meant to find are the two that keep their
          colour. */}
      <g aria-hidden="true">
        <CableFace cable={echo} pulse={f.pulses["c.sensor.echo"]} lifted={f.echo.lifted} />
      </g>
      </g>
    </svg>
  );
}

/* --- Cables --------------------------------------------------------------
   A cable is drawn three times — a dark rim, the colour, a highlight down the
   top — which is what turns a flat stroke into a round tube. Same device as
   `wire.tsx` on the canvas, same colours from the same tokens; only the
   routing is this screen's own, because these runs are the length of the bench
   and the canvas's sag was written for hops between neighbouring holes.      */

function CableRim({ cable }: { cable: Cable }) {
  const role = wireRoles[cable.role];
  return (
    <path
      d={cablePath(cable.from, cable.to, cable.bow)}
      fill="none"
      stroke={role.edge}
      strokeWidth={role.width + 2.6}
      strokeLinecap="round"
    />
  );
}

function CableFace({
  cable,
  pulse,
  lifted = 0,
}: {
  cable: Cable;
  pulse?: number;
  lifted?: number;
}) {
  const role = wireRoles[cable.role];
  const d = cablePath(cable.from, cable.to, cable.bow);

  return (
    <g>
      {lifted > 0.02 ? (
        <path
          d={d}
          fill="none"
          stroke="#0C1318"
          strokeWidth={role.width + 5}
          strokeLinecap="round"
          opacity={0.3 * lifted}
          transform={`translate(${(3 * lifted).toFixed(2)} ${(4.5 * lifted).toFixed(2)})`}
        />
      ) : null}
      <path d={d} fill="none" stroke={role.stroke} strokeWidth={role.width} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={1} strokeLinecap="round" opacity={0.2} />

      {/* Current, one cable at a time. `pathLength` rescales each path to 100,
          so the dash is a *fraction* of the cable rather than an absolute
          length nobody measured: a short jumper and a long one take the same
          beat, which is what a chain filling up looks like. */}
      {pulse !== undefined ? (
        <path
          d={d}
          pathLength={100}
          fill="none"
          stroke="#EAF7FF"
          strokeWidth={role.width}
          strokeLinecap="round"
          strokeDasharray="8 100"
          strokeDashoffset={-pulse * 108}
          opacity={0.95}
        />
      ) : null}

      <Boot at={cable.from} />
      {lifted > 0.06 ? null : <Boot at={cable.to} />}
    </g>
  );
}

/** A moulded jumper housing: what says the cable is seated, not floating. */
function Boot({ at }: { at: { x: number; y: number } }) {
  return (
    <g>
      <rect x={at.x - 3} y={at.y - 4} width={6} height={8.6} rx={1.8} fill={material.shell} />
      <rect x={at.x - 1.7} y={at.y - 3} width={3.4} height={2.8} rx={0.9} fill={material.metal} />
    </g>
  );
}

/* --- The agent ---------------------------------------------------------
   Not drawn here. `canvas/agent-mascot.tsx`'s layer draws the ring over this
   frame, and `lib/agent/mascot.ts` flies it — the same shape and the same
   choreography the workbench uses when a tool call comes in. This file kept
   a choreography of its own for a while (in scene units, out of the old
   plate), which is exactly how a mascot ends up being two slightly different
   mascots. What this screen still owns is the cable the ring moves and the
   board that runs afterwards: `repair-demo.ts`.                             */
