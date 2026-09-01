import { material as m } from "@/components/illustration/spec";
import { AT, BREADBOARD, RAIL } from "@/components/landing/scene/bench-layout";

/**
 * S-01 · The breadboard, placeable.
 *
 * `canvas/parts/breadboard.tsx` draws the same object, but it is nailed to
 * `layout.breadboard` and it takes a list of holes because on the canvas every
 * hole is an addressable node — a wire end has to be able to name `bb.e12` and
 * the agent has to be able to point at it. Neither is true here: nothing on
 * this screen addresses a hole, so the holes are a grid rather than a graph.
 *
 * Same materials, same 0.1" pitch, same proportions. Wokwi has no breadboard
 * element — this is one of the two parts the product draws itself.
 */
export function BenchBreadboard() {
  const { x, y } = AT.breadboard;
  const { width, height, channel, pitch, columns } = BREADBOARD;
  const top = y - pitch * 2;
  const full = height + pitch * 4;

  return (
    <g aria-hidden="true">
      <rect x={x + 3} y={top + 5} width={width} height={full} rx={7} fill="#0C1318" opacity={0.34} />
      <rect
        x={x}
        y={top}
        width={width}
        height={full}
        rx={pitch * 0.6}
        fill={m.plasticWhite}
        stroke="#C4CBD2"
        strokeWidth={1}
      />

      {/* The printed rails: a red line outside the plus row, a blue one
          outside the minus row, top and bottom. */}
      <RailLine y={RAIL.topPos - pitch * 0.6} colour="#C1272D" x={x} width={width} />
      <RailLine y={RAIL.topNeg + pitch * 0.6} colour="#2E5AA8" x={x} width={width} />
      <RailLine y={RAIL.botNeg - pitch * 0.6} colour="#2E5AA8" x={x} width={width} />
      <RailLine y={RAIL.botPos + pitch * 0.6} colour="#C1272D" x={x} width={width} />

      {/* The trough down the middle a chip straddles. */}
      <rect
        x={x + 6}
        y={y + height / 2 - channel / 2}
        width={width - 12}
        height={channel}
        rx={2}
        fill="#D5DADE"
      />
      <line
        x1={x + 6}
        y1={y + height / 2 - channel / 2 + 1}
        x2={x + width - 6}
        y2={y + height / 2 - channel / 2 + 1}
        stroke="#BFC6CC"
        strokeWidth={1.4}
      />

      {/* Holes. Two banks of five rows, and the two rails. */}
      <g>
        {rows(y, height, channel, pitch).map((rowY) =>
          Array.from({ length: columns }, (_, col) => (
            <Hole key={`${rowY}-${col}`} x={RAIL.first + col * pitch} y={rowY} />
          )),
        )}
        {[RAIL.topPos, RAIL.topNeg, RAIL.botNeg, RAIL.botPos].map((railY) =>
          Array.from({ length: columns }, (_, col) => (
            <Hole key={`r${railY}-${col}`} x={RAIL.first + col * pitch} y={railY} />
          )),
        )}
      </g>
    </g>
  );
}

/** Five rows either side of the channel, at the board's real pitch. */
function rows(y: number, height: number, channel: number, pitch: number) {
  const gap = (height - channel) / 2;
  const out: number[] = [];
  for (let i = 0; i < 5; i++) out.push(y + gap - (4 - i) * pitch - pitch * 0.5);
  for (let i = 0; i < 5; i++) out.push(y + gap + channel + i * pitch + pitch * 0.5);
  return out;
}

function Hole({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 1.7} y={y - 1.7} width={3.4} height={3.4} rx={0.7} fill="#8E979F" />
      <rect x={x - 1.7} y={y - 1.7} width={3.4} height={1.5} rx={0.7} fill="#AFB7BE" />
    </g>
  );
}

function RailLine({
  x,
  y,
  width,
  colour,
}: {
  x: number;
  y: number;
  width: number;
  colour: string;
}) {
  return (
    <line
      x1={x + 10}
      y1={y}
      x2={x + width - 10}
      y2={y}
      stroke={colour}
      strokeWidth={1.1}
      opacity={0.7}
    />
  );
}
