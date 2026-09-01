import { PITCH, layout, part } from "@/lib/circuit/geometry";
import type { CircuitNode } from "@/lib/circuit/graph";
import { bench, material as m } from "@/components/illustration/spec";

/**
 * C-06 · Breadboard
 *
 * Half-size board at its real proportions. Every hole is an addressable node
 * rather than a repeating `<pattern>`, because a wire end has to be able to
 * name the hole it sits in — `bb.e12` — and the agent has to be able to point
 * at it.
 *
 * The holes arrive from outside and the plastic is drawn around `at`. Those two
 * have to agree and nothing in here can check it — this file has no idea which
 * grid produced the nodes it was handed — so `at` exists to stop a build that
 * lays out its own bench from getting the plastic in one place and its holes in
 * another, silently.
 */

/**
 * The plastic is a picture, not a control.
 *
 * Same rule `wire.tsx` states as `NOT_A_CONTROL`, and this part has the same
 * claim to it: there is no gesture here even in principle. A hole is taken by
 * the seat picker, a part by its own grab rect, and both of those are drawn
 * above this — so nothing painted below ever needs to be hit.
 *
 * What it buys is hit-testing. A build with a full board hands this 360 painted
 * hole marks on top of a body rect 320 units wide, and every one of them is a
 * candidate the browser walks on every pointer move of a pan across it. Taken
 * out of hit-testing they cost nothing, and the press lands where it was always
 * going to land: on the viewport.
 */
const NOT_A_CONTROL = { pointerEvents: "none" } as const;

/** Row letters and column numbers, at the size the rails' own marks are drawn. */
const ADDRESS_SIZE = PITCH * 0.7;

export function Breadboard({
  holes,
  showLabels,
  at = layout.breadboard,
  addresses = false,
}: {
  holes: CircuitNode[];
  showLabels: boolean;
  /**
   * Where the board's own grid starts, the way `UnoBoard` takes it.
   *
   * `x` is the plastic's left edge. `y` is only a fallback: the top and bottom
   * of the body are read off the rail holes below, because a build may centre
   * its bank rows in the board rather than hang them off this y.
   *
   * Defaults to the capstone's slot. A chapter that lays out its own bench
   * passes its own — without that this reads `layout.breadboard` whatever the
   * holes say, and a board 235 units from its own holes draws with no error
   * anywhere, because the two facts never meet in one expression.
   */
  at?: { x: number; y: number };
  /**
   * Print the addresses a person is told out loud: `F7`, `−1`.
   *
   * Off by default because a build that names pins rather than holes has no use
   * for them, and sixteen strings around a board nobody is being addressed
   * about is decoration. On for the chapter whose every correction is a hole.
   */
  addresses?: boolean;
}) {
  const { x, y } = at;
  const { width, height, channel } = part.breadboard;

  const rails = holes.filter((h) => h.row === "+" || h.row === "-");
  const banks = holes.filter((h) => h.row !== "+" && h.row !== "-");

  /**
   * Where the two rails actually are, read off the holes rather than assumed.
   *
   * The plastic used to be drawn from `at.y` plus `part.breadboard.height`, on
   * the assumption that a rail sits half a pitch outside that span. Chapter six
   * satisfies it, and chapter two — whose ten bank rows are centred in the
   * board the way a real half-size one's are — does not: the body was drawn
   * with the whole grid pushed into its top half and nine pitches of blank
   * plastic under row J, with the ground rail floating at the very edge. That
   * is the same class of fault as `at` itself, one layer down — the drawing
   * held an opinion about where the holes were instead of asking them.
   *
   * The fallbacks reproduce the old expressions exactly, so a build that hands
   * over no rail holes (or none at all, mid-assembly) draws what it always did.
   */
  const railYs = rails.map((h) => h.y);
  const posY = railYs.length ? Math.min(...railYs) : y - PITCH * 0.5;
  const negY = railYs.length ? Math.max(...railYs) : y + height + PITCH * 0.5;

  /* Fifteen units of plastic outside each rail — a real board's edge plus the
     second rail row we do not model. Chapter six's numbers to the unit. */
  const bodyTop = posY - PITCH * 1.5;
  const bodyBottom = negY + PITCH * 1.5;

  /* The channel sits under the top bank, not centred between the banks: that
     is where chapter six draws it and moving it would edit a finished picture
     for five units. */
  const bankYs = banks.map((h) => h.y);
  const channelTop = bankYs.length
    ? Math.min(...bankYs) + 5 * PITCH
    : y + PITCH * 7;

  /* Tied to `showLabels`, which is the zoom gate (`zoom.labelThreshold`).
     Thirty column numbers on a ten-unit pitch, seen from far enough back to
     fit the whole board, is the `3V3 5V GND GND VIN` smear `pin-rings.tsx` was
     written to avoid — and printing every fifth one is what keeps the gutter a
     ruler rather than a texture at the zooms where it does show. */
  const gutter = showLabels && addresses;

  /* Both gutters are read off the holes themselves, never off a private a…j /
     1…30 list kept here. The address the model hands out and the address
     printed on the plastic have to be one fact: a second, independent copy of
     it goes wrong quietly the day a build offers a different bank, and then the
     agent says "row f, column seven" while the silkscreen says something else.
     Rails are excluded — they carry a column too, and they are labelled at
     their ends by the `+`/`−` marks below. */
  const rowsAt = new Map<string, number>();
  const colsAt = new Map<number, number>();
  if (gutter) {
    for (const hole of banks) {
      if (hole.row) rowsAt.set(hole.row, hole.y);
      if (hole.col !== undefined && hole.col % 5 === 0) {
        colsAt.set(hole.col, hole.x);
      }
    }
  }

  return (
    /* `aria-hidden` for the same reason as `NOT_A_CONTROL`, one sense over.
       The address gutter is 26 <text> and 38 <tspan> nodes of silkscreen — A
       through J, 5 to 30 — and it is a picture of a breadboard, not a list of
       things. A screen reader reading it aloud reads the furniture; what the
       leads are actually joined to is said in the step rail and the findings,
       in sentences. */
    <g style={NOT_A_CONTROL} aria-hidden="true">
      <rect
        x={x}
        y={bodyTop}
        width={width}
        height={bodyBottom - bodyTop}
        rx={PITCH * 0.6}
        fill={m.plasticWhite}
        stroke="var(--color-border-strong)"
        strokeWidth={1}
      />

      {/* Centre channel. */}
      <rect
        x={x + PITCH * 0.5}
        y={channelTop}
        width={width - PITCH}
        height={channel}
        rx={2}
        fill={m.cream}
      />

      {/* Rail guide lines: red for +, dark for −. Colour is not the only cue —
          the rail is also labelled at both ends. */}
      <line
        x1={x + PITCH * 0.6}
        y1={posY - PITCH * 0.8}
        x2={x + width - PITCH * 0.6}
        y2={posY - PITCH * 0.8}
        stroke="var(--color-wire-power)"
        strokeWidth={0.8}
        opacity={0.55}
      />
      <line
        x1={x + PITCH * 0.6}
        y1={negY + PITCH * 0.8}
        x2={x + width - PITCH * 0.6}
        y2={negY + PITCH * 0.8}
        stroke="var(--color-wire-ground)"
        strokeWidth={0.8}
        opacity={0.55}
      />

      {banks.map((hole) => (
        <rect
          key={hole.id}
          x={hole.x - PITCH * 0.2}
          y={hole.y - PITCH * 0.2}
          width={PITCH * 0.4}
          height={PITCH * 0.4}
          rx={0.8}
          fill={m.creamEdge}
        />
      ))}

      {rails.map((hole) => (
        <circle
          key={hole.id}
          cx={hole.x}
          cy={hole.y}
          r={PITCH * 0.2}
          fill={m.creamEdge}
        />
      ))}

      {showLabels ? (
        <>
          <text
            x={x - PITCH * 0.8}
            y={posY - PITCH * 0.6}
            textAnchor="end"
            className="fill-[var(--color-wire-power)] font-mono"
            style={{ fontSize: PITCH * 0.7 }}
          >
            +
          </text>
          <text
            x={x - PITCH * 0.8}
            y={negY + PITCH * 1.1}
            textAnchor="end"
            className="fill-[var(--color-wire-ground)] font-mono"
            style={{ fontSize: PITCH * 0.7 }}
          >
            −
          </text>
        </>
      ) : null}

      {/* The address gutter, printed on the mat rather than on the plastic.
          A silkscreen grey dark enough to read on cream would be a colour this
          product has no other use for, and every other word standing in this
          scene — a pin name, a part label — is already `bench.label` on the
          mat. The letters are upper-case because the hole's own label is
          (`F7`), and a gutter that disagreed with the address it indexes would
          be the same two-copies problem one step further out. */}
      {gutter ? (
        <g fill={bench.label} className="font-mono">
          {[...rowsAt].map(([row, rowY]) => (
            <text
              key={row}
              x={x - PITCH * 0.8}
              /* A quarter pitch is half the cap height at this size, so the
                 letter sits on its row rather than above it. */
              y={rowY + PITCH * 0.25}
              textAnchor="end"
              style={{ fontSize: ADDRESS_SIZE }}
            >
              {row.toUpperCase()}
            </text>
          ))}
          {[...colsAt].map(([col, colX]) => (
            <text
              key={col}
              x={colX}
              /* Clear of the plastic's top edge rather than printed inside it,
                 where the `+` rail's holes already are. */
              y={posY - PITCH * 2.1}
              textAnchor="middle"
              style={{ fontSize: ADDRESS_SIZE }}
            >
              {col}
            </text>
          ))}
        </g>
      ) : null}
    </g>
  );
}
