"use client";

import { useSyncExternalStore } from "react";
import {
  getFrame,
  getServerFrame,
  subscribe,
  type Ring,
} from "@/lib/agent/mascot";

/**
 * C-24 · The agent, on the bench.
 *
 * The ring the entry screen's repair sequence settled on, and nothing else: no
 * body, no face, no callout. It arrives **wide** and closes onto the hole it is
 * working over — two sockets a tenth of an inch apart cannot announce
 * themselves, so the ring announces them on the way down and then gets out of
 * the way. The index dot running its circumference stops at the top and hands
 * over to the crosshair arms it turns into.
 *
 * Hollow, because anything filled would cover the very hole it came for.
 *
 * ## Why it is its own subscriber
 *
 * It reads the store directly rather than being handed a frame, and that is the
 * one thing about this component that is not decoration: the store ticks every
 * frame, and a prop threaded down from the workbench would re-render the board,
 * the breadboard, every part and every wire sixty times a second while the
 * agent crosses the bench. Subscribing here keeps the repaint to the ring.
 *
 * It is drawn as the last child of the viewport's transform layer, so it is in
 * **scene units** — which is what lets it land on a hole rather than near one —
 * and it sits over everything, which is right for a thing that is standing on
 * the bench rather than lying on it.
 */

/**
 * The agent's own colour, on this ground.
 *
 * `--color-accent` is tuned to read on the app's white paper; on the canvas's
 * cutting mat it goes muddy, and over the board's own blue — which is exactly
 * where the ring does its work — it nearly vanishes. So it is lifted here, the
 * same exception `bench.label` takes in `illustration/spec.ts` for text printed
 * on the mat.
 *
 * Deliberately not in the material palette: every colour in that file is a
 * thing you could hold, and the agent is not one of them.
 */
const MARK = "#4D94FF";

export function AgentMascot() {
  const frame = useSyncExternalStore(subscribe, getFrame, getServerFrame);
  if (!frame) return null;

  return (
    <g aria-hidden="true">
      {frame.trail.map((ghost, index) => (
        <MascotRing
          key={index}
          ring={{ ...ghost, opacity: ghost.opacity * (0.26 - index * 0.07) }}
        />
      ))}
      <MascotRing ring={frame.now} />
    </g>
  );
}

export function MascotRing({ ring }: { ring: Ring }) {
  const { x, y, r, dock, spin, opacity } = ring;
  const arms = Math.max(0, Math.min(1, (dock - 0.3) / 0.7));
  const dot = Math.max(0, Math.min(1, 1 - dock * 1.7));
  const reach = 4.5 * arms;

  return (
    <g
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
      opacity={opacity}
    >
      {/* A dark halo under the ring, not a deeper blue. The agent's accent over
          the board's own blue is one blue on another, and the ring vanished
          exactly where it matters most — on the header it came to work on. */}
      <circle r={r} fill="none" stroke="#08131F" strokeWidth={7} opacity={0.5} />
      <circle r={r} fill="none" stroke={MARK} strokeWidth={3} />

      {arms > 0.02
        ? [
            [0, -1],
            [0, 1],
            [-1, 0],
            [1, 0],
          ].map(([ux, uy]) => (
            <line
              key={`${ux}-${uy}`}
              x1={ux * (r + 2)}
              y1={uy * (r + 2)}
              x2={ux * (r + 2 + reach)}
              y2={uy * (r + 2 + reach)}
              stroke={MARK}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={arms}
            />
          ))
        : null}

      {dot > 0.02 ? (
        <circle
          cx={Math.cos(spin) * r}
          cy={Math.sin(spin) * r}
          r={3}
          fill={MARK}
          opacity={dot}
        />
      ) : null}
    </g>
  );
}
