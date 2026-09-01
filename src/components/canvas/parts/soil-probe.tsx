import { artTransform, frame } from "@/lib/circuit/wokwi";
import { useSvgPrefix } from "@/components/canvas/svg-ids";
import { bench, material as m } from "@/components/illustration/spec";

/**
 * Capacitive soil moisture probe — the "v1.2" board
 *
 * Ours, not a Wokwi port: upstream has no soil sensor, so this is drawn the way
 * `breadboard.tsx` is, off the real part's measurements rather than off a
 * photograph of it. The board is 23 × 98 mm, which at 96dpi is the 86.93 ×
 * 370.39 viewBox every number in this file is written in. `frame.soil` restates
 * those two millimetre figures, and the pin table hangs off the same box — if
 * the two ever disagree the leads land beside the artwork instead of on it,
 * which is the one failure `wokwi.ts` exists to prevent.
 *
 * It stands upright, header at the top and blade pointing down, because that is
 * the only way the part is ever used: the blade goes into the pot and the three
 * pins have to stay out of the wet.
 *
 * No component-register number yet — `docs/design-system-inventory.md` has no
 * row for it, and inventing one here would be a second opinion about a fact
 * that lives in the register.
 */

/**
 * The board is a picture, not a control.
 *
 * The same rule `breadboard.tsx` and `wire.tsx` state, and this part has the
 * same claim to it: there is no gesture on a part body. The seat picker owns
 * the holes, the part's own grab rect owns the part, and both are drawn above
 * this — so nothing painted below ever needs to be hit, and the eighty-odd
 * shapes here cost nothing on a pan across them.
 */
const NOT_A_CONTROL = { pointerEvents: "none" } as const;

/** 23 × 98 mm at 96dpi. Every coordinate below is relative to these two. */
const W = 86.93;
const H = 370.39;

/** The board's own centreline — the header, the chip and the seam all sit on it. */
const MID = W / 2;

/**
 * A 0.1" header pitch in this viewBox's units — 2.54 mm at 96dpi.
 *
 * Not `wokwi.ts`'s `HEADER_PITCH`, which is the Uno artwork's own 9.5 px turned
 * into scene units. This board is ours, so it is drawn on the true pitch and
 * nothing has to reconcile the two: a lead only needs its two ends.
 */
const PITCH_PX = 9.6;

/**
 * The three names the board carries, on their real 0.1" columns.
 *
 * Sitting in the board's LEFT third rather than on its centreline, and that is
 * a drawing decision with a reason on the bench. This part stands to the right
 * of everything it is wired to, so all three of its leads run LEFT — and a lead
 * cannot clear the board until it has travelled the distance from its own post
 * to the left edge. Centred, that is 34 to 53 units of wire drawn across the
 * face of the probe, up to 28 units deep. Pushed left it is 14 to 34, and the
 * deepest strand grazes the corner beside the header, which is where a jumper's
 * boot sits on a real one anyway.
 *
 * The board's own silkscreen is what the offsets have to agree with, so the
 * names move with the posts.
 */
const PINS = [
  { name: "VCC", x: 14.4 },
  { name: "GND", x: 24.0 },
  { name: "AOUT", x: 33.6 },
] as const;

/**
 * Where a lead attaches, 4.5 px down from the tip of the pin.
 *
 * The pin table in `wokwi.ts` names y = 6 for all three, so the post has to
 * start above that and run well below it: a tip drawn *under* the attachment
 * point would put every lead in this build in mid-air, and nothing at runtime
 * would say so.
 */
const PIN_TIP = 1.5;
/** A 0.64 mm square post — what a 2.54 mm header is actually made of. */
const PIN_W = 2.42;
/** 6 mm of pin stands proud of the block; the block itself is 2.5 mm. */
const HEADER_TOP = PIN_TIP + 22.68;
const HEADER_H = 9.45;

/**
 * Silkscreen, at about 1.4 mm of cap height.
 *
 * That is what a real board prints its pin names at, and it is also the size
 * the breadboard's address gutter settled on for the same reason: any smaller
 * and three words on a 9.6 px pitch are a texture rather than a label at the
 * zoom where the whole board is on screen.
 */
const SILK = 7.2;
/** The names start clear of the header block and read down the board. */
const SILK_TOP = 40;

/** A routed corner, a shade over 1 mm. */
const CORNER = 4;
/** Where the sides stop running straight and cut in toward the nose. */
const SHOULDER = 315;
/** The nose is a true half circle, so its radius is half the tip's width. */
const NOSE_R = 22;

/**
 * The outline: a routed rectangle that tapers into a rounded nose.
 *
 * The shoulder is a real corner on the real board rather than something the
 * drawing smooths over — the sides run straight for 83 mm and then cut in to an
 * 11.6 mm nose, which is what lets the blade go into packed soil without the
 * whole 23 mm width having to open a slot for it.
 *
 * Written out of `W` and `H` rather than typed as sixteen literals, because the
 * bottom of the nose has to land on 98 mm exactly: it is the one point of the
 * outline that `frame.soil`'s box also names, and a rounding drifting into it
 * would put the blade's tip a hair outside the box the pins are measured in.
 */
const OUTLINE = [
  `M ${CORNER} 0 H ${W - CORNER} A ${CORNER} ${CORNER} 0 0 1 ${W} ${CORNER}`,
  `V ${SHOULDER} L ${MID + NOSE_R} ${H - NOSE_R}`,
  `A ${NOSE_R} ${NOSE_R} 0 0 1 ${MID - NOSE_R} ${H - NOSE_R}`,
  `L 0 ${SHOULDER} V ${CORNER} A ${CORNER} ${CORNER} 0 0 1 ${CORNER} 0 Z`,
].join(" ");

/**
 * The NE555's eight pads, on the 1.27 mm pitch a SOIC-8 is built to.
 *
 * The body is 3.9 × 4.9 mm, so the leads leave the two long sides — which on an
 * upright board means left and right, and four pads of 4.8 px pitch centred in
 * 18.52 px of package.
 */
const TIMER = { x: 36.1, y: 68, w: 14.74, h: 18.52 } as const;
const TIMER_PITCH = 4.8;
const TIMER_PAD_H = 1.9;
const TIMER_PADS = [0, 1, 2, 3].map(
  (i) =>
    TIMER.y +
    (TIMER.h - (3 * TIMER_PITCH + TIMER_PAD_H)) / 2 +
    i * TIMER_PITCH,
);

/**
 * 0805 chip parts: 2.0 × 1.25 mm, which is 7.56 × 4.72 here.
 *
 * The ceramic one is beige because a multilayer capacitor's body is — the same
 * fired ceramic the palette already names for the resistor — and the two others
 * are the black of a chip resistor. Nobody reads the values at this size; what
 * has to read is that the top of the board is populated and the blade is not.
 */
const PASSIVE_W = 7.56;
const PASSIVE_H = 4.72;
const PASSIVES = [
  { x: 12, y: 68, body: m.beige },
  { x: 12, y: 80, body: m.chip },
  { x: 62, y: 74, body: m.chip },
];

/**
 * The maximum-insertion mark.
 *
 * A real capacitive probe prints this line and every tutorial repeats it: soil
 * up to here, no further, because above it is the electronics and not the
 * sealed electrode. It is drawn as a bare line with no caption, because that is
 * what the board prints — the same rule the Uno and the HC-SR04 follow, where
 * the part carries its own words and we add none.
 */
const WATER_LINE = 113;

export function SoilProbeArtwork() {
  /* Chapter four draws this probe twice — once on the bench and once on the
     kit shelf, at a fifth of the size — and a clip path is resolved by id
     across the whole document, not inside the <svg> it is written in. */
  const uid = useSvgPrefix();

  return (
    <g style={NOT_A_CONTROL} fontFamily="monospace">
      <defs>
        <clipPath id={`${uid}-soil-outline`}>
          <path d={OUTLINE} />
        </clipPath>
      </defs>

      {/* Flat, the way the breadboard's plastic is flat, and the first draft of
          this was not: a gradient down the length looked like a photograph and
          cost the drawing everything else. Every mark on a black board is a
          near-black on a near-black — the packages, the seam — and a fill that
          slides two steps between the top of the board and the tip takes those
          differences away exactly where each mark happens to sit. Flat, the
          values stack once and hold the whole way down. */}
      <path d={OUTLINE} fill={m.shell} stroke={m.shellDeep} strokeWidth={1} />

      {/* The posts run the whole way, tip to the far side of the moulding, and
          the moulding is painted over their lower halves — which is the order
          the real thing is assembled in and the only one that leaves no seam
          where the two meet. */}
      {PINS.map((p) => (
        <g key={p.name}>
          <rect
            x={p.x - PIN_W / 2}
            y={PIN_TIP}
            width={PIN_W}
            height={HEADER_TOP + HEADER_H - PIN_TIP}
            rx={0.6}
            fill={m.metal}
          />
          {/* A post is square and lit from one side; without the shaded face
              three bright bars read as printed lines rather than as metal. */}
          <rect
            x={p.x + PIN_W / 2 - 0.8}
            y={PIN_TIP}
            width={0.8}
            height={HEADER_TOP + HEADER_H - PIN_TIP}
            fill={m.metalEdge}
          />
        </g>
      ))}

      {/* The moulding: three pitches wide, because that is how a 3-pin header
          is cut off the strip. `shellSoft` rather than the board's own black —
          the same moulded body the barrel jack is drawn in, and one step off
          the mask so the block reads as sitting on the board. */}
      <rect
        x={PINS[0].x - PITCH_PX / 2}
        y={HEADER_TOP}
        width={3 * PITCH_PX}
        height={HEADER_H}
        rx={0.8}
        fill={m.shellSoft}
        stroke={m.shellDeep}
        strokeWidth={0.6}
      />

      {/* Rotated a quarter turn, the way the HC-SR04 prints its four: the names
          run down the board on their own pin's column, which is the only
          arrangement that survives the header's pitch — `AOUT` alone is nearly
          two pitches wide set flat. */}
      <text transform="rotate(90)" fontSize={SILK} fill={bench.labelStrong}>
        {PINS.map((p) => (
          <tspan
            key={p.name}
            x={SILK_TOP}
            /* A third of the size is half the cap height, so the name straddles
               its pin's column instead of hanging off one side of it. */
            y={-(p.x - SILK * 0.36)}
          >
            {p.name}
          </tspan>
        ))}
      </text>

      {/* The regulator, a three-pin SOT-23: 2.9 × 1.3 mm of package with two
          leads on one long side and one on the other. */}
      <rect x={11} y={44} width={11} height={4.9} rx={0.5} fill={m.chip} />
      <rect x={15.3} y={41.6} width={2.4} height={2.4} fill={m.metal} />
      <rect x={13.5} y={48.9} width={2.4} height={2.4} fill={m.metal} />
      <rect x={17.1} y={48.9} width={2.4} height={2.4} fill={m.metal} />

      {/* The 555. It is what makes this sensor capacitive: the timer drives the
          buried electrode and the board measures what the soil does to it. */}
      {TIMER_PADS.map((y) => (
        <g key={y} fill={m.metal}>
          <rect x={TIMER.x - 3.2} y={y} width={3.2} height={1.9} />
          <rect x={TIMER.x + TIMER.w} y={y} width={3.2} height={1.9} />
        </g>
      ))}
      <rect
        x={TIMER.x}
        y={TIMER.y}
        width={TIMER.w}
        height={TIMER.h}
        rx={0.8}
        fill={m.chip}
      />
      {/* The pin-1 dimple. One dot, and the package stops being a rectangle. */}
      <circle cx={TIMER.x + 2.5} cy={TIMER.y + 2.6} r={1.2} fill={m.shellDeep} />

      {PASSIVES.map((c) => (
        <g key={`${c.x}-${c.y}`}>
          <rect
            x={c.x}
            y={c.y}
            width={PASSIVE_W}
            height={PASSIVE_H}
            fill={c.body}
          />
          <rect x={c.x} y={c.y} width={1.6} height={PASSIVE_H} fill={m.metal} />
          <rect
            x={c.x + PASSIVE_W - 1.6}
            y={c.y}
            width={1.6}
            height={PASSIVE_H}
            fill={m.metal}
          />
        </g>
      ))}

      {/* Clipped to the board, so the two blade marks cannot creep past the
          taper the day either of their ends is nudged. */}
      <g clipPath={`url(#${uid}-soil-outline)`}>
        <line
          x1={7}
          y1={WATER_LINE}
          x2={W - 7}
          y2={WATER_LINE}
          stroke={bench.label}
          strokeWidth={1.4}
        />
        {/* The blade carries no pads — that is what capacitive means, the
            electrode is buried in the substrate — but the two halves of it meet
            down the middle, and the mask shows that seam as a change of shade
            rather than as a printed line. So it is drawn as a shade: a hair of
            the board's own deepest black, and nothing else. */}
        <line
          x1={MID}
          y1={WATER_LINE + 12}
          x2={MID}
          y2={H - NOSE_R - 4}
          stroke={m.shellDeep}
          strokeWidth={1.4}
        />
      </g>
    </g>
  );
}

/**
 * The probe, placed the way every other part is.
 *
 * `frame.soil` is declared in `lib/circuit/wokwi.ts` — it states the same 23 ×
 * 98 mm this drawing is measured in, and `artTransform` puts the top-left of
 * the rendered box on `at`, which is the corner the pin table is measured from.
 * That is what lets a lead's coordinate be a plain addition rather than a fudge
 * factor read off the artwork by eye.
 *
 * There is no default `at`: this part is only ever placed by a build that has
 * already decided where its pot is, and a default would be a second opinion
 * about that — the failure `breadboard.tsx`'s `at` comment describes, where the
 * plastic lands in one place and its holes in another with nothing to catch it.
 */
export function SoilProbe({ at }: { at: { x: number; y: number } }) {
  return (
    <g transform={artTransform(frame.soil, at)}>
      <SoilProbeArtwork />
    </g>
  );
}
