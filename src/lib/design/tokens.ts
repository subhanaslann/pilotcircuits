/**
 * Batch 0 · Foundations — TypeScript mirror of the CSS custom properties
 * declared in `src/app/globals.css`.
 *
 * Tailwind classes cover the DOM. SVG geometry (the circuit canvas) needs the
 * raw values at runtime for stroke colours, dash patterns and animated
 * attributes, so both sides read from `var(--…)` wherever possible and from
 * these literals only where a computed value is unavoidable.
 */

/* --- F-01 · Colour ------------------------------------------------------- */

export const color = {
  app: "var(--color-app)",
  surface: "var(--color-surface)",
  surfaceSunken: "var(--color-surface-sunken)",
  ink: "var(--color-ink)",
  inkSecondary: "var(--color-ink-secondary)",
  inkTertiary: "var(--color-ink-tertiary)",
  inkDisabled: "var(--color-ink-disabled)",
  border: "var(--color-border)",
  borderStrong: "var(--color-border-strong)",
  grid: "var(--color-grid)",
  accent: "var(--color-accent)",
  teal: "var(--color-teal)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
} as const;

/** Literal hexes, for the few places a CSS variable cannot be used
 *  (canvas gradients built in JS, `<meta name="theme-color">`, exports). */
export const hex = {
  app: "#f5f7f8",
  surface: "#ffffff",
  ink: "#111827",
  inkSecondary: "#5b6576",
  inkTertiary: "#667085",
  border: "#e4e9ed",
  grid: "#dce3e8",
  accent: "#1677ff",
  teal: "#14b8a6",
  success: "#16a36a",
  warning: "#f59e0b",
  error: "#e5484d",
} as const;

/* --- F-02 · Semantic wire palette ---------------------------------------- */

export type WireRole =
  | "power"
  | "ground"
  | "signal"
  | "signalAlt"
  | "servoSignal"
  | "servoGround"
  | "error"
  | "target"
  | "idle";

/**
 * The visual spec only. What a role is *called* — its label, its meaning, the
 * colour you would ask for it by — lives in `copy.wire`, keyed by the same id:
 * those are words a person reads, and they change with the language.
 */
export interface WireRoleSpec {
  id: WireRole;
  stroke: string;
  hex: string;
  /** The same hue at 75% lightness, stroked a shade wider than the cable so
   *  it shows as a dark rim down both sides. A flat stroke reads as a round
   *  tube because of this, which is why no wire needs a blur to look like a
   *  wire. Run down the centre instead it reads as a groove — the cable looks
   *  hollow. Tried on the canvas, rejected. */
  edge: string;
  edgeHex: string;
  /**
   * SVG `stroke-dasharray`; `undefined` means a solid stroke.
   *
   * A dash means **there is no cable here** — an expected route not yet wired,
   * a hole with nothing in it. It never means "something is wrong": a real
   * jumper is always drawn solid, however badly it is connected. Breaking a
   * mismatched wire into dashes made it read as a row of coarse capsules and
   * said the same thing the callout already says.
   */
  dash?: string;
  /** Lucide icon name paired with the role in legends and labels. */
  icon: string;
  /** Typical stroke width at 1× canvas zoom. */
  width: number;
}

/**
 * What a cable turns into while another wire is the subject. Dimming by
 * opacity leaves eight faint coloured wires still competing for attention;
 * draining them to one neutral grey leaves exactly one coloured thing on the
 * board, and the eye goes there without being told.
 */
export const wireNeutral = {
  stroke: "var(--color-wire-neutral)",
  hex: "#6b757e",
  edge: "var(--color-wire-neutral-edge)",
  edgeHex: "#50585f",
} as const;

/** The moulded housing on a jumper end — see `Connector` in `wire.tsx`. */
/**
 * The agent's own colour, on the bench.
 *
 * The accent, and deliberately not lifted: the ring used to carry `#4D94FF`
 * so it would read over the board's blue, and the coach figure arrived in
 * the accent — two blues for one agent. What carries the legibility over the
 * board is the dark halo under the ring, not the tint, so the halo stays and
 * the tint is the accent everywhere the agent is drawn: the flying ring, the
 * mark it leaves behind (`overlays/spotlight.tsx`) and the ring around a
 * shelf tile. Not in the material palette: a part is a thing you could hold,
 * and the agent is not one of them.
 */
export const agent = {
  mark: "#1677FF",
  halo: "#08131F",
} as const;

export const connector = {
  body: "var(--color-connector)",
  bodyMuted: "var(--color-connector-muted)",
  /** Latch rib, catching the light across the housing. */
  rib: "rgba(255,255,255,0.24)",
} as const;

export const wireRoles: Record<WireRole, WireRoleSpec> = {
  power: {
    id: "power",
    stroke: "var(--color-wire-power)",
    hex: "#e0393e",
    edge: "var(--color-wire-power-edge)",
    edgeHex: "#a82b2f",
    icon: "Plus",
    width: 3,
  },
  ground: {
    id: "ground",
    stroke: "var(--color-wire-ground)",
    hex: "#3a4450",
    edge: "var(--color-wire-ground-edge)",
    edgeHex: "#2c333c",
    icon: "Minus",
    width: 3,
  },
  signal: {
    id: "signal",
    stroke: "var(--color-wire-signal)",
    hex: "#d99114",
    edge: "var(--color-wire-signal-edge)",
    edgeHex: "#a36d0f",
    icon: "Activity",
    width: 3,
  },
  signalAlt: {
    id: "signalAlt",
    stroke: "var(--color-wire-signal-alt)",
    hex: "#2d7ff9",
    edge: "var(--color-wire-signal-alt-edge)",
    edgeHex: "#225fbb",
    icon: "Activity",
    width: 3,
  },
  /**
   * A hobby servo's cable is the one place on the bench where the colours are
   * fixed by the hardware rather than chosen by the sketch: red, brown and
   * orange are what the thing in your hand is, and chapter five's steps name
   * them. `power` is already the red. These two are the brown and the orange —
   * a ground that is not slate and a signal that is not blue — so a person who
   * reads "its orange lead to D9" watches an orange lead go to D9. Used by
   * nothing else: every jumper keeps the semantic roles above.
   *
   * The strokes carry a fallback because the CSS variables are not declared in
   * `globals.css` yet; the literal keeps the strand the right colour until they
   * are, and the variable takes over the moment they exist.
   */
  servoSignal: {
    id: "servoSignal",
    stroke: "var(--color-wire-servo-signal, #f5850f)",
    hex: "#f5850f",
    edge: "var(--color-wire-servo-signal-edge, #b8640b)",
    edgeHex: "#b8640b",
    icon: "Activity",
    width: 3,
  },
  servoGround: {
    id: "servoGround",
    stroke: "var(--color-wire-servo-ground, #8b4a1d)",
    hex: "#8b4a1d",
    edge: "var(--color-wire-servo-ground-edge, #683816)",
    edgeHex: "#683816",
    icon: "Minus",
    width: 3,
  },
  error: {
    id: "error",
    stroke: "var(--color-wire-error)",
    hex: "#f0742a",
    edge: "var(--color-wire-error-edge)",
    edgeHex: "#b45720",
    icon: "TriangleAlert",
    width: 3.5,
  },
  target: {
    id: "target",
    stroke: "var(--color-wire-target)",
    hex: "#0fa98f",
    edge: "var(--color-wire-target-edge)",
    edgeHex: "#0b7f6b",
    dash: "3 4",
    icon: "Target",
    width: 2.5,
  },
  idle: {
    id: "idle",
    stroke: "var(--color-wire-idle)",
    hex: "#a9b4c0",
    edge: "var(--color-wire-idle-edge)",
    edgeHex: "#7f8790",
    dash: "2 5",
    icon: "Circle",
    width: 2,
  },
};

/* --- F-03 · Mono value tones --------------------------------------------- */

/**
 * How a hardware value is tinted when it appears inside a sentence. Lives with
 * the tokens rather than with `MonoValue`, because the agent layer decides that
 * `D6` is the wrong pin and `D7` is the right one long before anything renders.
 */
export type MonoTone = "default" | "accent" | "error" | "target" | "quiet";

/* --- F-04 · Layout frames ------------------------------------------------ */

export const layout = {
  topbar: 64,
  stepRail: 252,
  agentPanel: 360,
  dockCollapsed: 44,
  dockOpen: 224,
  /** Widest content frame outside the workbench. */
  shell: 1360,
  /** Below this the workbench folds into the stacked layout. */
  workbenchMin: 1120,
} as const;

/* --- F-05 · Radius & elevation ------------------------------------------- */

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 12,
  xl: 14,
  "2xl": 18,
} as const;

export const elevation = ["e1", "e2", "e3"] as const;
export type Elevation = (typeof elevation)[number];

/* --- F-08 · Icons -------------------------------------------------------- */

export const icon = {
  /** Inline with caption/mono-sm text. */
  xs: 14,
  /** Default: buttons, list rows, tabs. */
  sm: 16,
  /** Panel headers, toolbar actions. */
  md: 18,
  /** Empty states, feature blocks. */
  lg: 20,
  /** Every Lucide icon in the product uses this weight — 2 reads too heavy
   *  against Geist at 13–14px. */
  strokeWidth: 1.75,
} as const;
