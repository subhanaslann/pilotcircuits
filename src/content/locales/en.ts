/**
 * F-10 · Copy layer — English.
 *
 * The source of truth for the dictionary's *shape*. Every other locale is typed
 * against `Copy`, so a missing key is a compile error rather than a blank space
 * someone finds in production.
 *
 * Deliberately not `as const`: literal types would oblige the Turkish file to
 * repeat the English strings verbatim, which is the opposite of the point.
 * Widened strings still give full key checking.
 */

import { foundations } from "@/content/locales/lab/foundations";
import { atoms } from "@/content/locales/lab/atoms";
import { molecules } from "@/content/locales/lab/molecules";
import { agentLab } from "@/content/locales/lab/agentLab";
import { device as deviceLab } from "@/content/locales/lab/device";
import { library as libraryLab } from "@/content/locales/lab/library";
import { workbench as workbenchLab } from "@/content/locales/lab/workbench";
import { shell } from "@/content/locales/lab/shell";
import { decisions } from "@/content/locales/lab/decisions";

/**
 * Every lead a chapter hands a person, by terminal id.
 *
 * Chapter one's four carry no colour because it has one LED and one resistor;
 * chapter two's twenty have to say which of three lamps they belong to, and a
 * finding that named none of them would read the same on all three.
 *
 * The four jumpers took the longest to get right, and the wrong answer was on
 * screen for a while: every end was named by which board it reaches and by
 * nothing else, so the step list drew four rows reading `Jumper's board end`,
 * `Jumper's board end`, `Jumper's breadboard end`, `Jumper's board end` — four
 * different cables under two labels, in the one list whose whole job is to say
 * which lead is still outstanding. The kit shelf had already been fixed and
 * this had not, which is how it survived: `partNameOf` reads `parts` and every
 * one of these readers reads this table.
 *
 * So an end names its cable first and itself second. Which of the four cables
 * a person picks up is still not something the model has an opinion about —
 * somebody who wires the red lamp with the cable this file calls green has
 * built a correct circuit and is told so — and that is exactly why the name is
 * the JOB the sketch has for a cable rather than a property of the plastic.
 * What the model does insist on is that a cable's two ends stay together, and
 * a name per role is what makes that rule something a person can follow.
 *
 * The cable comes first in the phrase for a second reason: the row truncates at
 * about 180px, so whatever is at the front is what survives. It used to be the
 * half the four rows had in common.
 */
type LeadKey =
  /* Chapter one. */
  | "led.cathode"
  | "led.anode"
  | "res.in"
  | "res.out"
  /* Chapter two, in the order the steps ask for them. */
  | "wire.gnd.rail"
  | "wire.gnd.pin"
  | "led.red.cathode"
  | "led.red.anode"
  | "res.red.in"
  | "res.red.out"
  | "wire.red.row"
  | "wire.red.pin"
  | "led.yellow.cathode"
  | "led.yellow.anode"
  | "res.yellow.in"
  | "res.yellow.out"
  | "wire.yellow.row"
  | "wire.yellow.pin"
  | "led.green.cathode"
  | "led.green.anode"
  | "res.green.in"
  | "res.green.out"
  | "wire.green.row"
  | "wire.green.pin"
  /* Chapter three, in the order the steps ask for them. Its LED and its
     resistor carry a middle segment where chapter one's do not: the tables
     below are global across every chapter, so `res.out` is already spoken for
     and already means "the lead in the header hole" — which is not where this
     chapter's resistor goes. */
  | "wire.power.rail"
  | "wire.power.pin"
  | "wire.ground.rail"
  | "wire.ground.pin"
  | "pir.vcc"
  | "pir.out"
  | "pir.gnd"
  | "wire.signal.row"
  | "wire.signal.pin"
  | "led.night.cathode"
  | "led.night.anode"
  | "res.night.in"
  | "res.night.out"
  | "wire.lamp.row"
  | "wire.lamp.pin"
  /* Chapter four. Its four cables are chapter three's, verbatim — a power
     jumper's board end means exactly the same thing in both, and two entries
     that have to be kept identical by hand are one entry too many. What is its
     own is the probe, and the lamp and resistor a reader should be able to tell
     from chapter three's at a glance. */
  | "soil.vcc"
  | "soil.gnd"
  | "soil.aout"
  | "led.plant.cathode"
  | "led.plant.anode"
  | "res.plant.in"
  | "res.plant.out"
  /* Chapter five. `sensor.*` and `servo.*` are the capstone's own ids: the
     ultrasonic sensor and the micro servo are the same two objects, and every
     prefix ladder in the product has answered for them since Batch 3. What is
     new is that somebody picks them up, which is what a lead NAME is for. */
  | "sensor.vcc"
  | "sensor.gnd"
  | "sensor.trig"
  | "sensor.echo"
  | "servo.power"
  | "servo.ground"
  | "servo.signal"
  | "led.soap.cathode"
  | "led.soap.anode"
  | "res.soap.in"
  | "res.soap.out";

/**
 * A lead's name, in one grammatical case.
 *
 * Spelled out here rather than imported from the circuit layer — the
 * dictionary is the one module in the product that depends on nothing, and a
 * key set that arrived from somewhere else would stop being the thing a
 * translator reads. The four keys are required, so a locale that forgets one
 * fails the build; the string index is what lets a caller hand this table a
 * terminal id, which is a plain string by the time it gets here.
 */
type LeadNames = Record<LeadKey, string> & Record<string, string>;

export const en = {
  /**
   * The design lab's own prose. Not product copy — it is the record of why
   * each material looks the way it does, and it is read by exactly one person.
   * Split per area so several translators never touch one file.
   */
  lab: {
    shell: shell.en,
    foundations: foundations.en,
    atoms: atoms.en,
    molecules: molecules.en,
    agentLab: agentLab.en,
    deviceLab: deviceLab.en,
    libraryLab: libraryLab.en,
    workbenchLab: workbenchLab.en,
    decisions: decisions.en,
  },

  /**
   * F-02 · What each wire role is called.
   *
   * These live here rather than in `tokens.ts` because they are words a person
   * reads — the canvas prints the label beside the wire, and the exact-fix
   * sentence says the colour out loud. `tokens.ts` keeps the part that does not
   * change with language: stroke, rim, dash, width, icon.
   *
   * `5V` and `GND` are not translated. That is what is silkscreened on the board.
   */
  wire: {
    label: {
      power: "5V",
      ground: "GND",
      signal: "Signal A",
      signalAlt: "Signal B",
      error: "Mismatch",
      target: "Expected",
      idle: "Not wired",
    },
    meaning: {
      power: "Power",
      ground: "Ground",
      signal: "Digital signal",
      signalAlt: "Second digital signal",
      error: "Connected to the wrong point",
      target: "Where this wire belongs",
      idle: "Nothing connected yet",
    },
    /** How you would ask for the wire out loud, reaching into a tangle. */
    colour: {
      power: "red",
      ground: "black",
      signal: "yellow",
      signalAlt: "blue",
      error: "amber",
      target: "teal",
      idle: "grey",
    },
  },

  brand: {
    tagline: "Build it. See it. Understand it.",
    category: "AI-guided physical computing workshop",
    description:
      "Build real electronics with an agent beside you. Follow a real project, recover from wiring mistakes, and understand why every connection matters.",
  },

  nav: {
    projects: "Projects",
    myBuilds: "My builds",
    components: "Components",
    webMcpReady: "WebMCP ready",
    /* The other half of the same badge. `WebMCP ready` is a claim about the
       browser, and a claim that is printed whether or not it is true is the
       kind of thing §18 exists to forbid — so the nav says which of the two it
       actually found. */
    webMcpUnavailable: "WebMCP unavailable",
    home: "Home",
    /* S-01 · The same detection, said the way the workshop says it. The bar
       reports whether the agent has a way into this page, not whether a
       specification exists — so the capsule names the agent and the browser
       probe stays the thing that decides which of the two is printed. */
    agentOnline: "AGENT ONLINE • LIVE",
    agentOffline: "AGENT OFFLINE",
  },

  /**
   * S-01 · The entry screen.
   *
   * Written in the register of an instrument rather than a marketing site: the
   * page states what the build is, what the board reports, and what the agent
   * can do, and then offers exactly one action. Nothing here promises anything
   * the product does not do — the board is simulated and the readout says so.
   */


  dashboard: {
    heading: "Build real electronics with an agent beside you.",
    sub: "Follow a real project, recover from wiring mistakes, and understand why every connection matters.",
    primaryCta: "Continue smart barrier",
    secondaryCta: "Browse projects",
    continueTitle: "Continue build",
    /* Said only when there is nothing to continue. `Continue` on a build that
       has not started is the interface claiming to remember something it does
       not. */
    startCta: "Start the smart barrier",
    suggested: "Suggested projects",
    howItWorks: "How it works",
    steps: [
      "Pick a real build",
      "Assemble with visual guidance",
      "Let your agent inspect and verify",
    ],
  },

  /**
   * Batch 6 · What each project is called and what it is for.
   *
   * One sentence each, written to be read in a card: what the build does, not
   * what it teaches — the concepts are listed separately and keyed by id, so a
   * card can show three of them and a detail page all of them.
   */
  /* The six chapters, in ladder order. The names are objects, not lessons: a
     child builds a night light, not "an introduction to digital input". */


  /* P-06 · The component vocabulary. `Sensor` is generic on purpose — four
     different sensors across the six chapters share one word and one mark. */
  landing: {
    designation: "BUILD 01 — SMART PARKING BARRIER",
    /* S-01 · One line, and a technical one. The entry screen states the parts
       list and what the agent is currently watching; the paragraph that used to
       stand here says the same thing at four times the length and now opens the
       section below the fold, where there is room to read it. */
    sub: (board: string, sensor: string, servo: string, pin: string) =>
      `${board} + ${sensor} + ${servo} servo. The agent is tracing the signal path on pin ${pin}.`,
    cta: "START THE TRAINING",
    /* Said only when there is a build to come back to. */
    ctaContinue: "CONTINUE THE BUILD",
    /* S-01 · The control is physically on the build, so it says which step of
       the build it opens rather than offering a generic "continue". */
    ctaNextStep: (step: string) => `NEXT STEP: ${step}`,

    /* S-01 · The diagnostics strip. */
    stripRegion: "Build diagnostics",
    logRegion: "Agent log",
    status: "Status",
    statusGreen: "GREEN",
    statusOpen: (count: number) =>
      count === 1 ? "1 OPEN" : `${count} OPEN`,
    stepsValue: (done: number, total: number) => `${done} of ${total}`,

    sceneLabel: "CURRENT BUILD — OVERHEAD VIEW",

    /* S-01 · The panel's one control, and the sentence under the bench that
       says whose hand this is. The label is what the agent is about to do,
       never what the button is — a control says exactly what happens. */

    /* S-01 · The ask on the bench. `show_correction` is registered with the
       browser on this route, so the plate names what is true of it. */
    /* S-01 · The ask. The panel that used to stand here answered eight
       questions; this screen has one. */
    helpTitle: "THE GATE WON'T OPEN",
    helpBody:
      "The car is at the line and the sensor is pinging, but the sketch never gets the reading: the Echo wire is one hole out. Ask the agent to move it.",
    helpTools: "Registered here:",
    helpAction: "Fix the wire",
    helpBusy: "Agent working",
    helpHost: "An agent can call these",
    helpNoHost: "No WebMCP in this browser",
    helpAfter:
      "The demo puts the fault back a few seconds later, so you can watch it again.",


    /* S-01 · What the agent has done, printed the way a diagnostic terminal
       prints it. Every value in these lines — the pins, the distance — comes
       from the circuit graph and the test run, so the transcript cannot claim a
       pin the build does not use. */
    log: {
      attach: (pin: string) => `AGENT: servo attached on ${pin}`,
      trigger: (cm: number) => `TRIGGER: ${cm} cm → OK`,
      mistake: (found: string, expected: string) =>
        `MISTAKE: Echo on ${found}, expected ${expected}`,
      fixed: (pin: string) => `FIXED: moved to ${pin}`,
      sweep: "BARRIER SWEEP ACTIVE",
    },

    steps: "Steps",
    tools: "Tools",

    /* S-01 · The ladder, under the bench.
       Four bands of prose used to stand here, and every one of them said again
       — in words — something the bench above had just shown. What the bench
       cannot show is that this build is the *last* of six, so that is what the
       section below it is now: the catalogue, in the register of the strip at
       the top of the page. */
    ladderTitle: "Six chapters, one ladder",
    ladderBody:
      "Each chapter adds exactly one idea to the one before it, and the parts list grows with it: three at the start, six at the end. The bench above is chapter six.",

    /* The ledger's column heads. Short by necessity — six columns share the
       reading measure — and printed in the same overline as the rest. */
    ledgerCaption: "Project catalogue — six chapters",
    ledgerChapter: "Chapter",
    ledgerBuild: "Build",
    ledgerAdds: "What it adds",
    ledgerTime: "Time",
    ledgerParts: "Parts",
    ledgerStatus: "Status",
    ledgerBench: "Blue edge: the build standing on the bench above.",

    closingTitle: "The board is simulated, the mistake is real.",
    closingBody:
      "No camera, no serial port, no upload. What is real is the circuit graph, the two mistakes in it, and the reasoning that gets you out of them.",
  },

  projects: {
    breathingLamp: {
      name: "Breathing Lamp",
      adds: "First pin, first LED, timing",
      summary:
        "One LED that swells and fades. It goes straight into the board — you do not even need the breadboard yet.",
    },
    trafficLight: {
      name: "Traffic Light",
      adds: "The breadboard, and a sequence",
      summary:
        "Three LEDs on a breadboard: red, amber, green, in an order that never slips.",
    },
    motionNightLight: {
      name: "Motion Night Light",
      adds: "A sensor: waiting for an event",
      summary:
        "A lamp that wakes when somebody walks past and settles back down when the hallway is quiet again.",
    },
    plantGuardian: {
      name: "Plant Guardian",
      adds: "Analog reading and a threshold",
      summary:
        "A soil probe that watches how dry the pot is getting and lights up when the plant wants water.",
    },
    touchlessSoapDispenser: {
      name: "Touchless Soap Dispenser",
      adds: "Distance, and a servo",
      summary:
        "A pump that runs when a hand comes near, so nothing has to be touched to use it.",
    },
    smartParkingBarrier: {
      name: "Smart Parking Barrier",
      adds: "Calibration, testing, judgement",
      summary:
        "A barrier that notices the car coming, lifts to let it through and closes again behind it.",
    },
  },

  components: {
    board: "Microcontroller board",
    breadboard: "Breadboard",
    sensor: "Sensor",
    servo: "Micro servo",
    led: "LEDs",
    resistor: "Resistors",
  },

  /* What a build teaches, as labels rather than sentences: they sit in chips on
     a card and in a list on the detail page, and both want the same words. */
  concepts: {
    digitalPins: "Digital pins",
    analogReading: "Analogue readings",
    triggerEcho: "Trigger and echo",
    pwmServo: "PWM and servo control",
    ledPolarity: "LED polarity",
    distanceMeasurement: "Distance measurement",
    conditionalLogic: "Conditional logic",
    mechanicalCalibration: "Mechanical calibration",
    testing: "Testing and debugging",
    thresholds: "Thresholds",
    serialOutput: "Serial output",
    timing: "Timing and reaction",
  },

  library: {
    title: "Projects",
    /* One line under the heading. Says what the list is for, not what the
       product is — the dashboard already did that. */
    intro:
      "Six chapters, each one a finished object. They go in order — three parts in the first, six in the last — but you can start anywhere.",
    search: "Search projects",
    filters: {
      difficulty: "Difficulty",
      duration: "Duration",
      components: "Components",
      learningGoal: "Learning goal",
      readyNow: "Ready now",
    },
    clear: "Clear filters",
    /* `Chapter 01`. Two digits: on a ladder of six, one digit reads as an
       arbitrary number rather than as a place in an order. */
    chapter: (n: number) => `Chapter ${String(n).padStart(2, "0")}`,
    /* Difficulty and duration are prose, not hardware: they translate. The
       number inside stays mono and tabular, the way rule 13 splits `94%` from
       `%94` — the unit belongs to the language, the figure to the build. */
    difficulty: {
      beginner: "Beginner",
      intermediate: "Intermediate",
    },
    minutes: (n: number) => `${n} min`,
    stepsCount: (n: number) => `${n} steps`,
    partsCount: (n: number) => (n === 1 ? "1 part" : `${n} parts`),
    results: (n: number) => (n === 1 ? "1 project" : `${n} projects`),
    viewProject: "View project",
    /* P-04 · The words the toolbar itself needs. The filter *names* were
       already in the dictionary; these are the values and the controls. */
    filterBy: "Filter projects",
    upTo: (n: number) => `Up to ${n} min`,
    anyDuration: "Any length",
    readyNow: "Ready now",
    readyNowHint: "Only builds with a guided workbench",
    empty: "No projects match these filters.",
    emptyHint: "Try removing a filter or clearing the search.",
  },

  status: {
    ready: "Ready",
    preview: "Preview",
    inProgress: "In progress",
    previewProject: "Preview project",
    demoFeed: "Demo feed",
    boardSimulated: "Board simulated",
    agentConnected: "Agent connected",
    agentOffline: "Agent not connected",
    connectedViaWebMcp: "Connected via WebMCP",
    toolsAvailable: (n: number) => `${n} tools available`,
    /* The same list, with nothing holding it. `7 tools available` beside
       `Agent not connected` is the header contradicting itself in one line. */
    toolsOnThisPage: (n: number) => `${n} tools on this page`,
  },

  projectDetail: {
    learningGoals: "What you'll learn",
    required: "What you need",
    checklistHint: "Check off what you already have.",
    haveThis: "I have this",
    haveIt: "Have it",
    addIt: "Add",
    someOf: "Some",
    missingOne: "1 part missing",
    missingMany: (n: number) => `${n} parts missing`,
    allPresent: "All parts checked",
    demoModeNotice: "You can continue in guided demo mode",
    demoModeDetail:
      "Nothing is blocked. The workbench runs on a simulated board, so you can follow the whole build without the physical kit.",
    stepPreview: "Build steps",
    start: "Start build",
    askAgent: "Ask agent to check my kit",
    /* What the agent answers with. The counts themselves reuse the checklist's
       own words above — two ways of saying `3 parts missing` on one screen is
       one too many. */
    kitReport: "Agent checked your kit",
    kitReportHint: "Read from the project's component list.",
    /* Says what is true of the project in front of you, and counts nothing.
       It used to name the capstone as the only guided build, which stopped
       being true the moment chapter one shipped and would go stale again with
       every chapter after this one. */
    previewNotice:
      "This project is a preview. Its parts and its steps are real — what it does not have yet is a guided workbench of its own.",
    /* A preview has no step definitions to show, and inventing seven would be
       exactly the placeholder §17 rules out. */
    previewNoSteps: "Build steps are written when a project gets its workbench.",
  },

  /* The seven steps of the Smart Parking Barrier build. The structure — which
     connections each step owns — lives in `@/lib/agent/steps`; only the words
     are here. */
  build: {
    project: "Smart Parking Barrier",
    /* What a node's owner is called out loud. `board.D7` reads as
       `Board → D7`; `sensor.echo` as `Distance sensor → Echo`. */
    parts: {
      board: "Board",
      breadboard: "Breadboard",
      /**
       * One name, and it is the one the rest of the product already uses.
       *
       * This said `Ultrasonic sensor` while chapter five's briefing screen, its
       * step three, its kit line and the capstone's step two all said "the
       * distance sensor" — so the kit shelf and the findings named a part one
       * way and every sentence around them named it another, on one screen.
       * `Distance sensor` is also the family the two below are in: what the
       * part senses, not how it does it.
       */
      sensor: "Distance sensor",
      /* The counted vocabulary says `sensor` three times over; a person holding
         one says which. Chapter three's is the module that watches the hallway
         and chapter four's is the thing that goes in the pot, and neither of
         them is the distance one above. */
      sensorMotion: "Motion sensor",
      sensorMoisture: "Soil probe",
      servo: "Micro servo",
      ledGreen: "Green LED",
      ledRed: "Red LED",
      ledYellow: "Amber LED",
      led: "LED",
      resistor: "Resistor",
      /* Chapter two has three of them and a finding names the one it means, so
         they are told apart by the lamp they belong to rather than by which
         hole the sentence happens to point at.

         No article, and that is the whole of the fix: these were the only three
         entries in the table that carried one, and every reader of this table
         supplies its own — `This step wires the ${part}`, `Pick up the ${part}`
         — so chapter two's opening bench printed "the The red lamp's resistor"
         four times in each of three rows. The capital stays: the kit shelf and
         the step rail draw this as a row label standing on its own, beside
         `Red LED` and `Breadboard`. */
      resistorRed: "Red lamp's resistor",
      resistorYellow: "Amber lamp's resistor",
      resistorGreen: "Green lamp's resistor",
      /* Uncounted by the catalogue (`ComponentId`), held by the bench
         (`KitId`): chapter two hands the person four of these. */
      jumper: "Jumper wire",
      /**
       * The four cables, by the job the sketch has for each.
       *
       * Chapters two to five put four of these in the kit shelf and in the step
       * list, and all four rows drew the same picture under the same word —
       * `Jumper wire`, `Jumper wire`, `Jumper wire`, `Jumper wire` — with the
       * same `aria-label`. The resistors had already been given a name each for
       * exactly this reason ("On a bench holding three of a kind, a kind is not
       * a name", `parts.ts`); the cables had not.
       *
       * What is honest about naming them and what is not, said out loud: which
       * of the four cables a person picks up is not something the model has an
       * opinion about, so somebody who wires the red lamp with the cable this
       * file calls green has built the right circuit and is told so. These names
       * are therefore the sketch's INTENTION for a cable, not a property of the
       * plastic. What the model does insist on is that a cable's two ends stay
       * together, and a name per role is what makes that rule something a
       * person can follow rather than guess at.
       *
       * These are the shelf's words. The LEAD names in `leads` below open with
       * the same phrase, because a shelf row and a step-list row about the same
       * cable that disagreed would be this defect again one level down.
       */
      jumperGround: "Ground jumper",
      jumperPower: "Power jumper",
      jumperSignal: "Signal jumper",
      jumperLamp: "Lamp jumper",
      jumperRed: "Red lamp's jumper",
      jumperYellow: "Amber lamp's jumper",
      jumperGreen: "Green lamp's jumper",
      cardboard: "Cardboard",
    },

    /**
     * The individual legs, once a chapter asks for one rather than for the
     * part. A lead is named by what a person can see about it — its length,
     * or which way it points — never by `anode` and `cathode`, which are the
     * words the rationale teaches and not the words an instruction uses.
     *
     * Three tables of the same names, because Turkish inflects them and
     * English does not. The caller says which case it needs; the alternative
     * is every sentence appending a template-owned noun to dodge the suffix,
     * which is how `${part} parçasını` happened.
     *
     * Kept in one place per case rather than one per chapter: `line.ts` reaches
     * these tables with a bare `TerminalId` and no idea which build it came
     * from, and a table split by chapter would need the caller to know.
     */
    /**
     * The naming form, and its one reader is the rail row — a label standing
     * on its own, not a phrase inside a sentence. So it is capitalised and
     * drops the article: the column above it holds `LED` and `Resistor`, and
     * a row reading `the LED's long leg` under `LED` is the only lowercase
     * thing in an aligned list. A lead named mid-sentence wants `leadObject`
     * or `leadTarget`; the `nom` case in `line.ts` has no call site.
     */
    leads: {
      "led.cathode": "LED's short leg",
      "led.anode": "LED's long leg",
      "res.in": "Resistor's LED-side lead",
      "res.out": "Resistor's board-side lead",

      /* Chapter two. A resistor is named by the lamp it serves rather than by
         a colour it does not have — the three are the same beige 220Ω part,
         and `parts.resistorRed` says it the same way. `of` rather than a
         second possessive: `the red lamp's resistor's LED-side lead` is two
         apostrophes in one phrase and nobody reads it twice.

         The cables follow both rules. The four job-named ones take the
         possessive (`Ground jumper's board end`); the three named after a lamp
         take `of`, because `the red lamp's jumper's board end` is the two
         apostrophes again. */
      "wire.gnd.rail": "Ground jumper's rail end",
      "wire.gnd.pin": "Ground jumper's board end",
      "led.red.cathode": "Red LED's short leg",
      "led.red.anode": "Red LED's long leg",
      "res.red.in": "LED-side lead of the red lamp's resistor",
      "res.red.out": "Rail-side lead of the red lamp's resistor",
      "wire.red.row": "Breadboard end of the red lamp's jumper",
      "wire.red.pin": "Board end of the red lamp's jumper",
      "led.yellow.cathode": "Amber LED's short leg",
      "led.yellow.anode": "Amber LED's long leg",
      "res.yellow.in": "LED-side lead of the amber lamp's resistor",
      "res.yellow.out": "Rail-side lead of the amber lamp's resistor",
      "wire.yellow.row": "Breadboard end of the amber lamp's jumper",
      "wire.yellow.pin": "Board end of the amber lamp's jumper",
      "led.green.cathode": "Green LED's short leg",
      "led.green.anode": "Green LED's long leg",
      "res.green.in": "LED-side lead of the green lamp's resistor",
      "res.green.out": "Rail-side lead of the green lamp's resistor",
      "wire.green.row": "Breadboard end of the green lamp's jumper",
      "wire.green.pin": "Board end of the green lamp's jumper",

      /* Chapter three. One lamp, so no colour to carry; one sensor, whose
         three leads ARE told apart, because the part prints `+`, `D` and `−`
         beside them and a person can see which is which. The four cables keep
         chapter two's rule: each names the job the sketch has for it, then the
         board its end reaches. Step two hands over two of them at once, and
         with the old shared name that step's rail listed four rows carrying two
         labels between them. */
      "wire.power.rail": "Power jumper's rail end",
      "wire.power.pin": "Power jumper's board end",
      "wire.ground.rail": "Ground jumper's rail end",
      "wire.ground.pin": "Ground jumper's board end",
      "pir.vcc": "Sensor's power lead",
      "pir.out": "Sensor's signal lead",
      "pir.gnd": "Sensor's ground lead",
      "wire.signal.row": "Signal jumper's breadboard end",
      "wire.signal.pin": "Signal jumper's board end",
      "led.night.cathode": "LED's short leg",
      "led.night.anode": "LED's long leg",
      "res.night.in": "Resistor's LED-side lead",
      "res.night.out": "Resistor's rail-side lead",
      "wire.lamp.row": "Lamp jumper's breadboard end",
      "wire.lamp.pin": "Lamp jumper's board end",

      /* Chapter four. The probe's third lead is named by what it carries
         rather than by the four characters printed beside it: `AOUT` is the
         board's word and it is on the board, and "the probe's reading" is what
         a person would say out loud. */
      "soil.vcc": "Probe's power lead",
      "soil.gnd": "Probe's ground lead",
      "soil.aout": "Probe's reading lead",
      "led.plant.cathode": "LED's short leg",
      "led.plant.anode": "LED's long leg",
      "res.plant.in": "Resistor's LED-side lead",
      "res.plant.out": "Resistor's rail-side lead",

      /* Chapter five. Its two modules are the capstone's two objects, so the
         ids are the capstone's; what is new is that somebody picks them up.
         The servo's three leads are named by their colours because that is
         what a servo cable is — every one in the world is red, brown and
         orange, and the drawing says so too. */
      "sensor.vcc": "Sensor's power lead",
      "sensor.gnd": "Sensor's ground lead",
      "sensor.trig": "Sensor's Trig lead",
      "sensor.echo": "Sensor's Echo lead",
      "servo.power": "Servo's red lead",
      "servo.ground": "Servo's brown lead",
      "servo.signal": "Servo's orange lead",
      "led.soap.cathode": "LED's short leg",
      "led.soap.anode": "LED's long leg",
      "res.soap.in": "Resistor's LED-side lead",
      "res.soap.out": "Resistor's rail-side lead",
    } satisfies Record<LeadKey, string> as LeadNames,
    /** What the sentence acts on: `Pick up …`, `You pulled … loose`. */
    leadObject: {
      "led.cathode": "the LED's short leg",
      "led.anode": "the LED's long leg",
      "res.in": "the resistor's LED-side lead",
      "res.out": "the resistor's board-side lead",

      "wire.gnd.rail": "the ground jumper's rail end",
      "wire.gnd.pin": "the ground jumper's board end",
      "led.red.cathode": "the red LED's short leg",
      "led.red.anode": "the red LED's long leg",
      "res.red.in": "the LED-side lead of the red lamp's resistor",
      "res.red.out": "the rail-side lead of the red lamp's resistor",
      "wire.red.row": "the breadboard end of the red lamp's jumper",
      "wire.red.pin": "the board end of the red lamp's jumper",
      "led.yellow.cathode": "the amber LED's short leg",
      "led.yellow.anode": "the amber LED's long leg",
      "res.yellow.in": "the LED-side lead of the amber lamp's resistor",
      "res.yellow.out": "the rail-side lead of the amber lamp's resistor",
      "wire.yellow.row": "the breadboard end of the amber lamp's jumper",
      "wire.yellow.pin": "the board end of the amber lamp's jumper",
      "led.green.cathode": "the green LED's short leg",
      "led.green.anode": "the green LED's long leg",
      "res.green.in": "the LED-side lead of the green lamp's resistor",
      "res.green.out": "the rail-side lead of the green lamp's resistor",
      "wire.green.row": "the breadboard end of the green lamp's jumper",
      "wire.green.pin": "the board end of the green lamp's jumper",

      "wire.power.rail": "the power jumper's rail end",
      "wire.power.pin": "the power jumper's board end",
      "wire.ground.rail": "the ground jumper's rail end",
      "wire.ground.pin": "the ground jumper's board end",
      "pir.vcc": "the sensor's power lead",
      "pir.out": "the sensor's signal lead",
      "pir.gnd": "the sensor's ground lead",
      "wire.signal.row": "the signal jumper's breadboard end",
      "wire.signal.pin": "the signal jumper's board end",
      "led.night.cathode": "the LED's short leg",
      "led.night.anode": "the LED's long leg",
      "res.night.in": "the resistor's LED-side lead",
      "res.night.out": "the resistor's rail-side lead",
      "wire.lamp.row": "the lamp jumper's breadboard end",
      "wire.lamp.pin": "the lamp jumper's board end",

      "soil.vcc": "the probe's power lead",
      "soil.gnd": "the probe's ground lead",
      "soil.aout": "the probe's reading lead",
      "led.plant.cathode": "the LED's short leg",
      "led.plant.anode": "the LED's long leg",
      "res.plant.in": "the resistor's LED-side lead",
      "res.plant.out": "the resistor's rail-side lead",

      /* Chapter five. Its two modules are the capstone's two objects, so the
         ids are the capstone's; what is new is that somebody picks them up.
         The servo's three leads are named by their colours because that is
         what a servo cable is — every one in the world is red, brown and
         orange, and the drawing says so too. */
      "sensor.vcc": "the sensor's power lead",
      "sensor.gnd": "the sensor's ground lead",
      "sensor.trig": "the sensor's Trig lead",
      "sensor.echo": "the sensor's Echo lead",
      "servo.power": "the servo's red lead",
      "servo.ground": "the servo's brown lead",
      "servo.signal": "the servo's orange lead",
      "led.soap.cathode": "the LED's short leg",
      "led.soap.anode": "the LED's long leg",
      "res.soap.in": "the resistor's LED-side lead",
      "res.soap.out": "the resistor's rail-side lead",
    } satisfies Record<LeadKey, string> as LeadNames,
    /** What the sentence points at: `Join … to ___`. */
    leadTarget: {
      "led.cathode": "the LED's short leg",
      "led.anode": "the LED's long leg",
      "res.in": "the resistor's LED-side lead",
      "res.out": "the resistor's board-side lead",

      /* Identical to `leadObject` here, and only here: English marks the
         accusative and the dative with word order and a preposition the
         template already owns, so the noun phrase itself does not move.
         Turkish spells two different suffixes, which is why the tables are
         two tables. */
      "wire.gnd.rail": "the ground jumper's rail end",
      "wire.gnd.pin": "the ground jumper's board end",
      "led.red.cathode": "the red LED's short leg",
      "led.red.anode": "the red LED's long leg",
      "res.red.in": "the LED-side lead of the red lamp's resistor",
      "res.red.out": "the rail-side lead of the red lamp's resistor",
      "wire.red.row": "the breadboard end of the red lamp's jumper",
      "wire.red.pin": "the board end of the red lamp's jumper",
      "led.yellow.cathode": "the amber LED's short leg",
      "led.yellow.anode": "the amber LED's long leg",
      "res.yellow.in": "the LED-side lead of the amber lamp's resistor",
      "res.yellow.out": "the rail-side lead of the amber lamp's resistor",
      "wire.yellow.row": "the breadboard end of the amber lamp's jumper",
      "wire.yellow.pin": "the board end of the amber lamp's jumper",
      "led.green.cathode": "the green LED's short leg",
      "led.green.anode": "the green LED's long leg",
      "res.green.in": "the LED-side lead of the green lamp's resistor",
      "res.green.out": "the rail-side lead of the green lamp's resistor",
      "wire.green.row": "the breadboard end of the green lamp's jumper",
      "wire.green.pin": "the board end of the green lamp's jumper",

      "wire.power.rail": "the power jumper's rail end",
      "wire.power.pin": "the power jumper's board end",
      "wire.ground.rail": "the ground jumper's rail end",
      "wire.ground.pin": "the ground jumper's board end",
      "pir.vcc": "the sensor's power lead",
      "pir.out": "the sensor's signal lead",
      "pir.gnd": "the sensor's ground lead",
      "wire.signal.row": "the signal jumper's breadboard end",
      "wire.signal.pin": "the signal jumper's board end",
      "led.night.cathode": "the LED's short leg",
      "led.night.anode": "the LED's long leg",
      "res.night.in": "the resistor's LED-side lead",
      "res.night.out": "the resistor's rail-side lead",
      "wire.lamp.row": "the lamp jumper's breadboard end",
      "wire.lamp.pin": "the lamp jumper's board end",

      "soil.vcc": "the probe's power lead",
      "soil.gnd": "the probe's ground lead",
      "soil.aout": "the probe's reading lead",
      "led.plant.cathode": "the LED's short leg",
      "led.plant.anode": "the LED's long leg",
      "res.plant.in": "the resistor's LED-side lead",
      "res.plant.out": "the resistor's rail-side lead",

      /* Chapter five. Its two modules are the capstone's two objects, so the
         ids are the capstone's; what is new is that somebody picks them up.
         The servo's three leads are named by their colours because that is
         what a servo cable is — every one in the world is red, brown and
         orange, and the drawing says so too. */
      "sensor.vcc": "the sensor's power lead",
      "sensor.gnd": "the sensor's ground lead",
      "sensor.trig": "the sensor's Trig lead",
      "sensor.echo": "the sensor's Echo lead",
      "servo.power": "the servo's red lead",
      "servo.ground": "the servo's brown lead",
      "servo.signal": "the servo's orange lead",
      "led.soap.cathode": "the LED's short leg",
      "led.soap.anode": "the LED's long leg",
      "res.soap.in": "the resistor's LED-side lead",
      "res.soap.out": "the resistor's rail-side lead",
    } satisfies Record<LeadKey, string> as LeadNames,
    steps: {
      /* --- Chapter one · Breathing Lamp ---------------------------------
         Four steps, and the third is where the fault is. Prefixed ids, because
         a step id is unique across every build in the product — that is what
         lets `stepById` stay a plain lookup. */
      lampKit: {
        name: "Check your kit",
        instruction: "Three parts: the board, one LED, one 220Ω resistor.",
        rationale:
          "No breadboard in this chapter — the circuit still fits on the board's own header.",
      },
      lampSeat: {
        name: "Seat the LED",
        /* The second sentence exists because the first one now finishes only
           half the part: with the placement keyed by lead, an LED with one leg
           in a hole and one leg in the air is a finished step, and without
           being told so a person reads the loose leg as unfinished work. */
        instruction:
          "Put the LED's short leg into the GND hole on the top row. Leave the long leg loose.",
        rationale:
          "The short leg is the cathode. It is the leg that goes to ground, on every LED you will ever use.",
      },
      lampResistor: {
        name: "Bridge the gap with the resistor",
        /* Two acts, named in the order the sketch reads them. `Run the
           resistor across to D9` described one gesture and got two joins,
           because the middle one was made for you. */
        instruction:
          "Put one resistor lead into D9, then join the other to the LED's long leg.",
        rationale:
          "Two joins, and you make both: the resistor is what reaches the pin and what keeps the LED alive.",
        asideSummary: "Why D9?",
        asideBody:
          "Only some pins can fade — the ones marked with a ~. D9 is one of them; D8 is not. A lead one hole over does not break the lamp, it just makes it blink instead of breathe.",
      },
      lampUpload: {
        name: "Upload and watch it breathe",
        instruction: "Upload the sketch and watch a full swell and fade.",
        rationale:
          "One slow breath is the whole build. If it blinks, the lead is on the wrong pin.",
      },

      /* --- Chapter two · Traffic Light -----------------------------------
         Five steps, and the third is the chapter: it is where a person first
         joins two legs without a wire between them. The hole addresses — `F7`,
         `J7`, `H8`, `D13` — are printed on the plastic and never translated
         (rule 13); `INSTRUCTION_MONO` sets them. */
      tlKit: {
        name: "Check your kit",
        instruction:
          "Twelve parts: the board, the breadboard, three LEDs, three 220Ω resistors and four jumper wires.",
        /* Said against chapter one's own kit line, which ends `no breadboard in
           this chapter`. The person is meant to notice the same sentence
           arriving with the opposite answer. */
        rationale:
          "The breadboard is the new part. Three lamps will not fit on the board's own header, and this is where they go instead.",
      },
      tlGround: {
        name: "Bring ground to the breadboard",
        /* `anywhere` is not a hedge — the whole rail is one node, so any hole
           in it verifies, and an instruction naming a single one would teach a
           precision the board does not have. */
        instruction:
          "Put one jumper's board end in GND and its other end anywhere in the − rail.",
        rationale:
          "That rail is one long strip of metal. One wire makes the whole length of it ground, and all three lamps come back to it.",
      },
      tlRed: {
        name: "Build the red lamp",
        instruction:
          "Put the red LED's short leg in F7 and its long leg in F8. Run its resistor from J7 down to the − rail, then a jumper from H8 to D13.",
        rationale:
          "This is the whole lamp: the board drives D13, the current crosses the LED and leaves through the resistor into the ground rail.",
        asideSummary: "Why does the resistor go in a different row?",
        asideBody:
          "Look down a column: five holes, and under the plastic they are one strip of metal. So the LED's short leg in F7 and the resistor's lead in J7 are already joined — you did not wire them together, the breadboard did. Which row you use does not matter. Which column does.",
      },
      tlOthers: {
        name: "Repeat it twice",
        instruction:
          "Build the same three parts again on columns 18 and 19 for amber, then on 27 and 28 for green. Their jumpers go to D12 and D11.",
        /* The chapter's second lesson, and it belongs here rather than in the
           upload step: the order is decided by which pin each jumper reached,
           and this is the step where the last two are chosen. */
        rationale:
          "The order is decided here. The sketch drives D13, then D12, then D11 — which lamp lights is which pin its jumper reached.",
      },
      tlUpload: {
        name: "Upload and watch the order",
        instruction:
          "Upload the sketch and watch a full cycle: red, green, amber, and back to red.",
        rationale:
          "One lamp at a time, always in the same order. If one stays dark, its jumper is on the wrong pin.",
      },

      /* --- Chapter three · Motion Night Light ----------------------------
         Five steps, and the second and third are what is new. `mnlPower` is
         the first time anything in this product is FED rather than driven, and
         `mnlSensor` is the first pin the board reads — which is why the aside
         hangs there. The hole addresses are printed on the plastic and never
         translated (rule 13); `INSTRUCTION_MONO` sets them. */
      mnlKit: {
        name: "Check your kit",
        instruction:
          "Nine parts: the board, the breadboard, the motion sensor, one LED, one 220Ω resistor and four jumper wires.",
        rationale:
          "The sensor is the new part, and it is the first one that has to be fed. Everything before it only had to be driven.",
      },
      mnlPower: {
        name: "Bring power to both rails",
        /* `anywhere` for the same reason chapter two says it: a rail is one
           node, so every hole in it verifies, and naming one would teach a
           precision the board does not have. */
        instruction:
          "Run one jumper from 5V to anywhere in the + rail, and one from GND to anywhere in the − rail.",
        rationale:
          "Two long strips, dead until now. The sensor needs five volts to work at all and the same ground the board is on — one wire each, and both rails are live for the rest of the build.",
      },
      mnlSensor: {
        name: "Wire the sensor",
        instruction:
          "Put the sensor's + lead anywhere in the + rail and its − lead anywhere in the − rail. Its D lead goes in A29; then run a jumper from E29 to D2.",
        rationale:
          "The sensor answers on one wire: high while something is moving, low once the hallway settles. D2 is where the sketch listens for it.",
        asideSummary: "What is different about D2?",
        asideBody:
          "Every pin you have used so far is one the board writes to — the sketch decides, and the pin does it. D2 is one the board reads. Nothing in the program decides what is on it; the sensor does, and the sketch's whole job is to keep asking.",
      },
      mnlLamp: {
        name: "Build the lamp",
        instruction:
          "Put the LED's short leg in F9 and its long leg in F10. Run its resistor from J9 down to the − rail, then a jumper from H10 to D13.",
        rationale:
          "Last chapter's lamp, once instead of three times. The board drives D13, the current crosses the LED and leaves through the resistor into the ground rail.",
      },
      mnlUpload: {
        name: "Upload and walk past",
        instruction:
          "Upload the sketch, then move a hand across the sensor and watch the lamp come on.",
        rationale:
          "The lamp is not on a timer. It comes on because the sensor said so, and goes out again when the hallway is quiet.",
      },

      /* --- Chapter four · Plant Guardian ---------------------------------
         Six steps, and the fifth owns no connection: choosing a threshold is a
         decision rather than a join, and it is the whole of what this chapter
         adds. The aside hangs on `pgProbe`, where a person first puts a lead
         into a hole marked `A`. */
      pgKit: {
        name: "Check your kit",
        instruction:
          "Nine parts: the board, the breadboard, the soil probe, one LED, one 220Ω resistor and four jumper wires.",
        rationale:
          "The probe is the new part, and the board turns over to meet it: three of the four holes this build uses are on the header along the bottom edge.",
      },
      pgPower: {
        name: "Bring power to both rails",
        instruction:
          "Run one jumper from 5V to anywhere in the + rail, and one from GND to anywhere in the − rail.",
        rationale:
          "The same two wires as last chapter, coming down instead of up. The probe needs five volts and the board's own ground before it can say anything at all.",
      },
      pgProbe: {
        name: "Wire the probe",
        instruction:
          "Put the probe's + lead anywhere in the + rail and its − lead anywhere in the − rail. Its A lead goes in B28; then run a jumper from A28 to A0.",
        rationale:
          "The probe answers with a voltage, and A0 is one of six holes that can turn a voltage into a number between 0 and 1023.",
        asideSummary: "Why A0 and not D2?",
        asideBody:
          "A digital pin has two answers and the board picks the nearer one: above about 2.5 V it reads a 1, below it a 0. The six holes marked A go through a converter instead and come back with a number between 0 and 1023. Wet soil and dry soil are not two states — they are a slow slide between them, and only the A holes can see the slide.",
      },
      pgLamp: {
        name: "Build the lamp",
        instruction:
          "Put the LED's short leg in F9 and its long leg in F10. Run its resistor from J9 down to the − rail, then a jumper from H10 to D9.",
        rationale:
          "The lamp you have built twice already, on the pin the sketch drives. Nothing about it is new; what is new is what decides when it comes on.",
      },
      pgSketch: {
        name: "Choose the threshold",
        instruction:
          "Read the monitor with the probe dry, then again with it in wet soil, and set the sketch's threshold between the two numbers.",
        rationale:
          "The board cannot tell you the plant is thirsty. It can tell you the reading is 618, and you are the one who decides that 618 is dry.",
      },
      pgUpload: {
        name: "Upload and let it dry out",
        instruction:
          "Upload the sketch and watch the reading climb until it crosses your number and the lamp comes on.",
        rationale:
          "Nothing switched. A number crossed a line you drew, and the sketch did what you told it to do about that.",
      },

      /* --- Chapter five · Touchless Soap Dispenser -----------------------
         Six steps, and two new kinds of thing: a measurement spread across two
         pins, and a part that is told a position rather than a state. The aside
         hangs on `tsdSensor`, which is where the chapter's name comes from. */
      tsdKit: {
        name: "Check your kit",
        instruction:
          "Nine parts: the board, the breadboard, the distance sensor, the servo, one LED, one 220Ω resistor and three jumper wires.",
        rationale:
          "Two new parts, and the servo is the first thing in this product that moves. It draws more than a lamp does, which is why it is fed from the rails rather than from a pin.",
      },
      tsdPower: {
        name: "Bring power to both rails",
        instruction:
          "Run one jumper from 5V to anywhere in the + rail, and one from GND to anywhere in the − rail.",
        rationale:
          "Both new parts are fed from the rails. From here on the only things going to the header are the board's own signals.",
      },
      tsdSensor: {
        name: "Wire the distance sensor",
        instruction:
          "Put the sensor's + lead anywhere in the + rail and its − lead anywhere in the − rail. Its Trig lead goes to D8 and its Echo lead to D7.",
        rationale:
          "Trig and Echo are one measurement across two pins: the board sends a pulse out of D8 and times how long it takes to come back on D7.",
        asideSummary: "How do two pins measure a distance?",
        asideBody:
          "The board puts a short pulse on Trig. The sensor turns it into a chirp far above anything you can hear, waits for the echo, and holds Echo high for exactly as long as the sound was in the air. Sound travels about 343 metres a second, so the board halves that time — out and back — and multiplies. The distance is a stopwatch reading, not something the sensor works out.",
      },
      tsdServo: {
        name: "Wire the servo",
        instruction:
          "Its red lead goes anywhere in the + rail, its brown lead anywhere in the − rail, and its orange lead to D9.",
        rationale:
          "D9 is marked ~, and that is not a preference: a servo is told an angle, and only the pins that can hold a value between on and off can say one.",
      },
      tsdLamp: {
        name: "Build the lamp",
        instruction:
          "Put the LED's short leg in F8 and its long leg in F9. Run its resistor from J8 down to the − rail, then a jumper from H9 to D13.",
        rationale:
          "The fourth time you have built this, and the last. Here its job is to say that the pump ran.",
      },
      tsdUpload: {
        name: "Upload and hold out a hand",
        instruction:
          "Upload the sketch, then move a hand towards the sensor and watch the horn turn and come back.",
        rationale:
          "One reading, one decision, one movement — and then it waits for the next hand.",
      },

      /* --- Chapter six · Smart Parking Barrier -------------------------- */
      kit: {
        name: "Check your kit",
        instruction: "Lay out every part before you wire anything.",
        rationale:
          "A missing resistor is easier to find now than after the LEDs are in.",
      },
      place: {
        name: "Place the components",
        instruction:
          "Seat the board, the breadboard and the sensor where they will stay.",
        rationale: "Wire lengths are decided by where the parts sit.",
      },
      sensor: {
        name: "Wire the distance sensor",
        instruction: "Connect the sensor's Echo pin to digital pin D7.",
        rationale:
          "Echo measures how long the reflected pulse takes to return.",
        asideSummary: "Why D7?",
        asideBody:
          "The sketch reads the return pulse from D7. A wire on D6 leaves that read empty, so the barrier never sees a car.",
      },
      servo: {
        name: "Connect and mount the servo",
        instruction:
          "Wire the servo to D9 and fit the horn at the OPEN position.",
        rationale:
          "The horn's starting angle decides which way the gate swings.",
        asideSummary: "Why does the angle matter?",
        asideBody:
          "The sketch sends one angle for OPEN and another for CLOSED. If the horn is fitted a quarter turn out, both commands do the opposite of what they say.",
      },
      leds: {
        name: "Add status LEDs",
        instruction:
          "Wire the green LED to D3 and the red to D2, each through its resistor.",
        rationale: "The LEDs are how the build tells you what it decided.",
      },
      upload: {
        name: "Upload and calibrate",
        instruction: "Upload the sketch and check the distance readout.",
        rationale: "Calibration is where the numbers on screen meet the room.",
      },
      test: {
        name: "Run the full system test",
        instruction: "Move an object towards the sensor and watch the gate.",
        rationale:
          "The whole build is one behaviour: approach, measure, decide, move.",
      },
    },
  },

  /**
   * The chapter briefing — what happens before the bench is handed over.
   *
   * `chapters` deliberately holds only the chapters that have one. A
   * `Partial<Record<ProjectId, …>>` would make every chapter optional in every
   * language, and a Turkish file missing one would compile; a plain object
   * makes `Copy` say exactly which keys exist, so adding chapter two here
   * fails the build until it is translated. That is §17 doing its job.
   */
  briefing: {
    /** The region's heading. Says what the window is, and that it will end. */
    title: "Before you start",
    next: "Next",
    back: "Back",
    start: "Start",
    replay: "Play again",
    /** The mono fraction, said out loud. Nobody hears "two slash five". */
    screenOf: (current: number, total: number) =>
      `Screen ${current} of ${total}`,
    purposeHeading: "What you are building",
    assemblyHeading: "How it goes together",

    /**
     * The three acts, listed down the side of the window.
     *
     * Named as groups rather than as screens: the parts are introduced one at
     * a time, but "the parts" is one act of the briefing and a list that grew
     * a row per component would be counting screens twice — the fraction in
     * the footer already does that.
     */
    steps: {
      label: "Briefing steps",
      purpose: "The project",
      parts: "The parts",
      assembly: "Assembly",
    },

    chapters: {
      breathingLamp: {
        parts: {
          board: {
            name: "The board",
            note: "The part that runs the program. The code you upload lives here, and it switches the holes along its top edge on and off.",
          },
          led: {
            name: "The LED",
            note: "The part that gives the light. Its two legs are different lengths, and that is not decoration: current goes in the long leg and out the short one. Put it in backwards and it simply does not light.",
          },
          resistor: {
            name: "The resistor",
            /* The last clause names the person on purpose: the join it is
               talking about is the one act of the chapter, and the briefing is
               where it stops being something that happens to the build. */
            note: "The part that holds the current back. An LED wired straight to the board draws more than it can take and dies after a while; the resistor keeps what passes through at a safe level. In this chapter it has a second job: the LED's leg does not reach D9, and you are the one who closes the gap.",
          },
        },
        purpose:
          "One LED, swelling and fading. Not blinking — stopping in between. For that to happen the board's pin has to do more than be on or off; it has to hold a value somewhere between, and only some pins can. The whole chapter stands on that difference.",
        /* Six beats, because the middle join is now its own act. `reach` and
           `bridge` used to land together, which taught the elision the bench
           then asks a person not to make: the parts arriving and the circuit
           closing are two different things and one of them is theirs.
           `GND` and `D9` are spelled exactly — `AssemblyAct` sets them in
           mono by matching the token. */
        assembly: {
          /* Says only what is on the bench, the way chapters two to five's
             opening captions do. It used to add "the sketch is loaded" — and
             the `upload` beat four lines down loads it, with both captions on
             screen together for the whole act. */
          board: "The board is on the bench. Nothing is wired.",
          seat: "The LED's short leg goes into the GND hole on the top row. The long leg waits.",
          reach: "The resistor drops into D9, reaching back towards the LED.",
          bridge: "Its other lead meets the LED's long leg. The circuit is closed.",
          upload: "The sketch goes to the board. D9 is driven now.",
          breathe: "The lamp swells and fades — it does not blink.",
        },
      },

      trafficLight: {
        parts: {
          board: {
            name: "The board",
            note: "The same board as last chapter, with more to do. The program still decides which of the holes along its edge is switched on; this time it works through three of them in turn, and the order it uses is the whole point of the build.",
          },
          breadboard: {
            name: "The breadboard",
            /* The one fact the chapter is built on, said before anything is
               placed. The bench cannot draw it — a strip under the plastic is
               invisible — so the briefing is the only place it can be shown at
               all. */
            note: "A block of holes with metal strips hidden underneath. Every column of five holes is one strip, so two legs pushed into the same column are joined without a wire between them. The two long lines down the edges are rails, joined from end to end — that is where ground goes.",
          },
          led: {
            name: "The LEDs",
            note: "Three of them now, and each one is the part you already know: current goes in the long leg and out the short one. Put one in backwards and that lamp stays dark while the other two carry on, which makes it the easiest fault in this chapter to miss.",
          },
          /* What it DOES, not where its second leg is drawn. The frame on
             this screen is the resistor's own box, so the ground rail is not
             in it at all — and the note asserted a bend down into a rail the
             picture cannot contain. The rail is the film's to show, on the
             beat that frames the whole build. */
          resistor: {
            name: "The resistors",
            note: "One for each lamp, and the same 220Ω part in all three. Each one stands in its own lamp's column and carries that lamp's current back to ground, so every lamp has its own way back and none of them draws more than it can take.",
          },
        },
        purpose:
          "Three lights, in an order they never break. Three lamps do not fit on the board's own header, so this chapter puts them on a breadboard — a block whose holes are already wired together in strips. Most of the joining is done for you before you touch it; knowing which holes are joined is the skill.",
        /* Six beats. `ground` comes first because the rail is dead metal until
           a cable reaches GND and every lamp after it hangs off that rail — and
           because the jumper gets no part screen of its own, this beat is the
           whole of its introduction. `GND`, `D13`, `D12` and `D11` are spelled
           exactly: `AssemblyAct` sets them in mono by matching the token. */
        assembly: {
          bench: "The board and the breadboard are on the bench. Nothing is wired.",
          ground:
            "The first jumper goes in: GND at one end, the − rail at the other. The whole length of that rail is ground now.",
          red: "The red lamp arrives whole — LED, resistor, jumper — standing across two columns.",
          others:
            "Amber and green repeat it, one group of columns each. Nothing new is added.",
          upload:
            "The sketch goes to the board. D13, D12 and D11 are driven now.",
          cycle: "Red. Then green, then amber, then red again — and it never slips.",
        },
      },

      motionNightLight: {
        parts: {
          board: {
            name: "The board",
            note: "The same board again, and this time both of its edges are in play. The holes along the top are the ones it drives; the ones along the bottom are where power leaves it, and this is the first chapter that needs them.",
          },
          breadboard: {
            name: "The breadboard",
            note: "The same block of holes, with both rails used at last. The columns are still five holes of one metal strip; the two long lines down the edges are joined end to end, and once a wire reaches each of them everything on the board can be fed and grounded without another trip to the Uno.",
          },
          sensor: {
            name: "The motion sensor",
            /* What the bench cannot draw: the dome is opaque, the lens is
               inside it, and nothing on screen can show what it is for. The
               briefing is the only place this can be said at all. */
            note: "The part that watches the room. Under the white dome is a lens that notices heat moving across it; when it does, the module holds its middle pin high for a few seconds and then lets it fall. It has no idea what a hallway is — it only knows that something warm changed position.",
          },
          led: {
            name: "The LED",
            note: "One lamp this time, and the same rule as always: current goes in the long leg and out the short one. In backwards it simply does not light.",
          },
          resistor: {
            name: "The resistor",
            note: "One 220Ω, doing exactly what it did last chapter. It stands in the lamp's own column and carries the lamp's current back to ground, so the LED never draws more than it can take.",
          },
        },
        purpose:
          "A lamp that waits. Everything you have built so far did what the sketch said, on a clock; this one does what the room says. The board still drives the lamp — what is new is a pin it reads instead of writes, and a part on the other end of that pin deciding what is there.",
        /* Six beats, chapter two's rhythm. `power` comes first because both
           rails are dead until it happens and everything after hangs off them,
           and because a cable leaving the board's other header is new. `5V`,
           `GND`, `D2` and `D13` are spelled exactly — `AssemblyAct` sets them
           in mono by matching the token. */
        assembly: {
          bench: "The board and the breadboard are on the bench. Both rails are dead.",
          power:
            "Two jumpers go in: 5V to the + rail, GND to the − rail. Everything on the board can be fed now.",
          sense:
            "The sensor arrives on its three leads, and a jumper carries its answer across to D2.",
          lamp: "The lamp goes in the way you already know — LED, resistor, and a jumper up to D13.",
          upload:
            "The sketch goes to the board. D2 is being read now, over and over.",
          /* Ends where the frame ends. `wake` is the last beat, it holds at
             `lit: true`, and the film stops there — so "and goes out again on
             its own" was a state change no frame plays. The lamp going out is
             `nightRun`'s, where it can actually be watched. */
          wake: "Something moves. The lamp comes on, and stays on while the sensor holds its pin up.",
        },
      },

      plantGuardian: {
        parts: {
          board: {
            name: "The board",
            note: "The same board, turned over. Its top edge is the header you have driven lamps from since the first chapter; the bottom one carries the power, and at its right-hand end six holes marked A. Those six are the reason the board is this way up.",
          },
          breadboard: {
            name: "The breadboard",
            note: "The same block of holes and the same two rails, still made live by one wire each. Nothing about it has changed — which is the point: by now it is furniture, and the chapter is free to be about something else.",
          },
          sensor: {
            name: "The soil probe",
            /* What the bench cannot draw: the blade looks like bare board
               because it IS bare board, and the reason that matters is
               invisible. The briefing is the only place it can be said. */
            note: "The part that goes in the pot. There is no metal on the blade — the electronics sit in the head and read the soil through the coating, which is what stops the probe corroding away in a fortnight. It answers with a voltage, and that voltage rises as the soil dries.",
          },
          led: {
            name: "The LED",
            note: "One lamp, and the same rule as always: current goes in the long leg and out the short one.",
          },
          resistor: {
            name: "The resistor",
            note: "One 220Ω, standing in the lamp's own column and carrying its current back to ground, exactly as it has for two chapters.",
          },
        },
        purpose:
          "A pot that says when it is thirsty. The board still reads a pin and still drives a lamp — but this pin answers with a number rather than a yes, and nothing on the bench knows what that number means. Deciding which number counts as dry is the chapter.",
        /* Six beats, chapter three's rhythm. `5V`, `GND`, `A0` and `D9` are
           spelled exactly — `AssemblyAct` sets them in mono by matching the
           token. */
        assembly: {
          bench:
            "The board and the breadboard are on the bench — the board above, this time. Both rails are dead.",
          power: "Two jumpers come down: 5V to the + rail, GND to the − rail.",
          probe:
            "The probe arrives on its three leads, and a jumper carries its reading across to A0.",
          lamp: "The lamp goes in the way you already know — LED, resistor, and a jumper to D9.",
          upload:
            "The sketch goes to the board. A0 is being read now, and turned into a number.",
          dry: "The soil dries. The number climbs past yours, and the lamp comes on.",
        },
      },

      touchlessSoapDispenser: {
        parts: {
          board: {
            name: "The board",
            note: "The same board again, the right way up. Everything this build reads or drives is on the top edge; the only thing that comes from the other one is the five volts the sensor and the servo run on.",
          },
          breadboard: {
            name: "The breadboard",
            note: "The same block, and by now the rails are the whole of what you use it for: two parts to feed, and one wire each to make that possible.",
          },
          sensor: {
            name: "The distance sensor",
            note: "The part that measures. Two cans face forward — one speaks, one listens — and the board times the gap between them. It cannot see; it can only tell you how long a sound took to come back, which over the first two metres is the same thing.",
          },
          servo: {
            name: "The servo",
            /* What the bench cannot draw: three identical wires leave the case
               and the whole of what tells them apart is their colour. */
            note: "The part that moves. Three wires leave it: red and brown are its supply, and the orange one carries a position — not a voltage to pass through, but an instruction it holds until it is told another.",
          },
          led: {
            name: "The LED",
            note: "One lamp, green this time, and the same rule as always: current goes in the long leg and out the short one.",
          },
          resistor: {
            name: "The resistor",
            note: "One 220Ω, standing in the lamp's own column and carrying the lamp's current back to ground.",
          },
        },
        purpose:
          "A pump that runs when a hand comes near. Everything you have built so far ends in a light; this one ends in something that moves — and moving means telling a part where to go rather than whether to be on. What decides is a distance the board works out for itself, from a pulse it sent and the time it took to come back.",
        /* Six beats. `5V`, `GND`, `D8`, `D7`, `D9` and `D13` are spelled
           exactly — `AssemblyAct` sets them in mono by matching the token. */
        assembly: {
          bench: "The board and the breadboard are on the bench. Both rails are dead.",
          power:
            "Two jumpers go in: 5V to the + rail, GND to the − rail. Both new parts can be fed now.",
          sense:
            "The sensor arrives. Its supply goes to the rails; Trig and Echo go straight to D8 and D7 on their own wire.",
          pump: "The servo joins it — red and brown to the rails, orange to D9 — and the lamp goes in beside them.",
          upload:
            "The sketch goes to the board. A pulse leaves D8, and the wait for D7 begins.",
          wave:
            "A hand comes near. The lamp comes on, and the servo is told where to go.",
        },
      },
    },
  },

  workbench: {
    back: "Back to the workspace",
    stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
    resetDemo: "Reset demo",
    demoControls: "Demo controls",
    /**
     * The box, and lifting a whole part out of it.
     *
     * What is left after `lead` took the bench: four words, and every one of
     * them is about a part rather than a leg, because that is the reading the
     * shelf still has — you do not pick a leg off a shelf. The words for
     * choosing a hole and landing in one moved to `lead` and were deleted
     * here rather than kept as a second way to say the same gesture.
     *
     * The state word rides in a capsule at the end of the kit row: capsule
     * says *pressable* (rule 1) and the word says *which state* (rule 9), so
     * a row that is suddenly a control does not have to be discovered.
     */
    kit: {
      inKit: "In the kit",
      /** Printed on the tray in the scene, the way the board prints its own
          pin names. One word, uppercase, never a sentence. */
      tray: "KIT",
      picking: "In hand",
      pickUp: (part: string) => `Pick up the ${part}`,
    },

    /**
     * The same gestures, one leg at a time.
     *
     * A sibling of `kit` rather than a rewrite of it: the shelf still lifts a
     * whole part — you do not pick a leg off a shelf — and the bench moves the
     * lead the person actually took hold of. Every one of these names what it
     * commits, because they are read out by a screen reader as the button's
     * name and the difference between moving a part and moving one of its legs
     * is the whole model change.
     */
    lead: {
      pickUp: (lead: string) => `Pick up ${lead}`,
      move: (lead: string) => `Move ${lead}`,
      choose: (lead: string) => `Choose where ${lead} goes.`,
      /* Asked first, on a part with more than one lead. Placing is two
         questions — which end, then where — and the bench used to answer the
         first one on the person's behalf. */
      whichLead: (part: string) => `Which lead of the ${part} are you moving?`,
      whichLeadWhy:
        "Pick the end you want to move. Escape leaves the part where it is.",
      /* The second target is what the old sentence could not say. A lead can
         land on another part's free lead, and a person who is not told that
         will look for a hole and find only wrong ones. */
      chooseWhy:
        "It can go into a hole on the board, or onto a free lead of another part. Escape puts it back.",
      /* The same sentence, minus the half that is not true right now.
         `chooseWhy` promises a free lead to clip onto, and when every lead on
         the bench is in a hole there is none — so the person aims at the part
         they need to reach, finds nothing there, and the header is the thing
         that told them to look. A leg has to be out of its hole before another
         can be twisted onto it, which is a fact about the desk and worth
         saying rather than leaving as an absence. */
      chooseWhyNoLead:
        "It can go into a hole on the board. No lead is free to clip onto — a leg has to be out of its hole first. Escape puts it back.",
      /* The same, with the blockers named.
         Saying *no lead is free* answers the wrong question: the person can
         see there is a leg right there and is asking why they cannot reach it.
         The answer is which hole it is in — a fact the bench cannot draw,
         because a leg standing in a hole and a leg hanging beside one are the
         same picture, and the whole chapter turns on that difference. */
      blockedLead: (lead: string, hole: string) => `The ${lead} is in ${hole}.`,
      chooseWhyBlocked: (blocked: string) =>
        `It can go into a hole on the board. ${blocked} A leg has to be out of its hole before another one can be clipped onto it. Escape puts it back.`,
      seatIn: (lead: string, pin: string) => `Put ${lead} in ${pin}`,
      joinTo: (lead: string, other: string) => `Join ${lead} to ${other}`,
      /* Delete on a picked-up lead. It leaves the leg in the air; the part
         goes back in the box only if that was its last hold on the board, and
         saying `Remove` here would promise the second thing. */
      release: (lead: string) => `Leave ${lead} loose`,
      /* The three states a lead can be in once it is out of the kit. The rail
         prints one of them in the capsule at the end of the row. */
      loose: "Loose",
      seated: "In a hole",
      joined: "Joined",
    },
    componentsInStep: "Components in this step",
    inspect: "Inspect my build",
    verify: "Verify step",
    runFullTest: "Run full test",
    showMe: "Show me",
    /**
     * The learner's button under a finding.
     *
     * It used to say `I fixed it`, and it used to be true in the wrong
     * direction: the panel wrote the correct placement itself and then
     * recorded the person's claim over the top of its own work. A button that
     * asserts on the reader's behalf cannot be wrong, which is exactly what
     * made it useless — so it asks instead, and the agent answers by reading
     * the build. One label for all three finding kinds, because the act is the
     * same one whatever is wrong: look again and say what is there.
     */
    checkThis: "Check this",
    /**
     * The other button, and only where a person genuinely cannot do it.
     *
     * Chapter six is laid out by the author: there is nothing to drag, so once
     * the panel stopped performing repairs behind `I fixed it` the build had no
     * route to a fix at all. Rather than put the dishonest button back, the
     * honest one says who is moving the wire — and it appears **only** on a
     * bench the person cannot assemble, which is exactly the case where letting
     * the app do it is not a lie.
     */
    moveItForMe: "Move it for me",
    /**
     * The two things you can do with a lead in your hand, besides put it
     * somewhere — named on screen for the first time.
     *
     * Both already existed as keys on the seat picker, announced in a `<desc>`
     * and an `aria-keyshortcuts` and drawn nowhere. So a screen reader was told
     * how to take a part off the bench and a person looking at it was not: the
     * only route anybody could find was dragging it far enough away that the
     * gesture gave up, which is a removal by accident rather than by intent.
     */
    leaveLoose: "Leave it loose",
    backToKit: "Back in the kit",
    undo: "Undo",
    redo: "Redo",
    previewAngle: "Preview correct angle",
    correctionHighlighted: "Correction highlighted",
    stepVerified: "Step verified",
    whyThisPin: "Why D7?",
    /* G-14's foot, once every step is closed. The build does not throw the
       person out of the workbench when the last tick lands — it offers the
       door. */
    finish: "Finish build",

    /* W-02 · The four states a step can be in. Rule 9 keeps the word: a rail
       that left the glyph to carry it alone would have to be read twice. */
    stepStatus: {
      completed: "Completed",
      active: "Active",
      issue: "Issue",
      /* `Upcoming` is what the state is called; `Not started` is what it can
         honestly say. A step is only ever *ahead* of you by convention — the
         agent can move the build to step 4 with step 3 still unverified, and
         the rail then has a row behind the active one that would be claiming
         to be in the future. It says the one thing that is true in both
         positions, and matches the word a test row already uses. */
      upcoming: "Not started",
    },

    /* W-03 · What a step touches. Derived from the connections the step owns,
       never listed by hand — a hand-written list is one that stops matching
       the graph the moment a wire moves. */
    jumpers: (n: number) => (n === 1 ? "1 jumper wire" : `${n} jumper wires`),
    pins: "Pins",

    /* W-04 · The regions name themselves, because a screen-reader user moving
       by landmark has to know which one they have landed in. */
    region: {
      steps: "Build steps",
      workspace: "Circuit workspace",
      circuit: (project: string) => `${project} circuit`,
    },
    /* W-11 · Below the fold width the agent panel becomes a drawer, so it
       needs an opener the wide layout never shows. */
    openAgentPanel: "Open agent panel",

    views: {
      /* The control's own name. Without it the switch was announcing itself as
         `Current` — the name of one of its options. */
      label: "Canvas view",
      reference: "Reference",
      current: "Current",
      compare: "Compare",
    },
    canvas: {
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      fitView: "Fit view",
      layers: "Layers",
    },
  },

  /* W-10 · §10 — the nine scenarios a filmed demo has to be able to reach.
     None of them is a second code path: every one runs the tools the agent
     runs, against the one store. */
  demo: {
    controls: "Demo controls",
    reset: "Reset complete demo",
    jumpWiring: "Jump to wiring issue",
    injectEcho: "Inject wrong Echo connection",
    markWiringFixed: "Mark wiring as fixed",
    /* Batch 9 · the only way to watch `attach_lead` without an MCP client
       attached. Same call, same arguments, same ring. */
    agentAttach: "Let the agent attach the next lead",
    jumpServo: "Jump to servo issue",
    injectServo: "Inject servo orientation error",
    markServoRemounted: "Mark servo as remounted",
    jumpTest: "Jump to full-system test",
    complete: "Complete project",
    groups: {
      wiring: "Wiring",
      servo: "Servo",
      system: "Full system",
    },
    note: "Each of these runs the tools the agent runs.",
  },

  agentPanel: {
    tabs: {
      guidance: "Guidance",
      findings: "Findings",
      activity: "Activity",
    },
    coaching: {
      label: "Coaching level",
      hint: "Hint first",
      explain: "Explain",
      exact: "Show exact fix",
    },
    ladder: {
      notice: "Notice",
      explain: "Explain",
      exactFix: "Exact fix",
    },
    noFindings: "No open findings for this step.",
    noFindingsHint: "Run an inspection when you think the wiring is done.",
    noActivity: "No agent activity yet.",
    noActivityHint: "Every tool the agent runs is recorded here.",
    developerDetails: "Developer details",
    rawResult: "Raw result",
    /* Split into title and body because the alert renders them differently —
       and because the second sentence is the one doing the reassuring. */
    webMcpUnavailable: "WebMCP is unavailable in this browser",
    webMcpUnavailableDetail: "Manual demo controls are still active.",
    noGuidance: "Nothing to report for this step yet.",
    noGuidanceHint: "Ask the agent to inspect the build when you are ready.",
    suggestedNext: "Suggested next",
    correction: "Correction",
    /* G-16 · what the sketch is still waiting for. Two headings, because a
       step that owns no connections is shown the whole build's instead. */
    checklist: {
      inThisStep: "In this step",
      wholeCircuit: "The whole circuit",
      elsewhere: "elsewhere",
    },
    /* What the panel knows about the step, as opposed to what the canvas tells
       you to do. The imperative lives above the canvas and is never repeated
       here — saying it twice halves its authority. */
    context: {
      notInspected: "The agent has not inspected this step yet.",
      allMatch: "Every expected connection for this step matches.",
      someMatch: (matched: number, expected: number) =>
        `${matched} of ${expected} expected connections match.`,
      nothingToCheck: "This step has no connections to compare.",
      blocked: "Blocked",
      connections: "Connections",
      countOf: (matched: number, expected: number) =>
        `${matched} of ${expected}`,
    },
    resolved: "Resolved",
    demoData: "Demo data",

    /* Named phases of a running tool call. A call that says nothing for a
       second reads as a hang; each phase is its own short sentence. */
    phases: {
      readingContext: "Reading the build context",
      readingWiring: "Reading the wiring graph",
      comparingSketch: "Comparing against the sketch",
      checkingAlignment: "Checking the mechanical alignment",
      locating: "Locating the connection",
      /* Batch 9 · the two beats of a carry, and they are the ring's own: the
         wait is what the animation is made of, not padding in front of it. */
      reaching: "Reaching for the lead",
      carrying: "Carrying the lead across",
      rereading: "Re-reading the observed connections",
      comparingExpected: "Comparing with the expected graph",
      loadingStep: "Loading the step",
      runningTest: "Running the test sequence",
      /* Batch 8 · the library's two. A tool that lands instantly gives the
         reader nothing to read, and these run against local data. */
      searchingProjects: "Searching the project library",
      readingProject: "Reading the project",
    },

    /* Timeline sentences. Human language first; the tool name lives in the
       developer details underneath. */
    activity: {
      readContext: "Agent read the current build context",
      contextRead: "Build context read",
      inspecting: (step: number) => `Agent inspected wiring for Step ${step}`,
      inspectingMechanical: (step: number) =>
        `Agent checked the mechanical alignment for Step ${step}`,
      inspectingAll: "Agent inspected the whole build",
      /* Only for wiring. A servo mounted a quarter turn out is not a
         connection mismatch, and saying so would be the interface telling the
         user something it knows to be untrue. */
      mismatchFound: (n: number) =>
        n === 1
          ? "1 connection mismatch found"
          : `${n} connection mismatches found`,
      /* The inverse of a mismatch, and it needs its own sentence: a join
         nobody asked for is not a wire in the wrong place, so counting it as
         a mismatch would tell the person to go looking for the sketch's line
         about it. There is no such line — that is the finding. */
      extrasFound: (n: number) =>
        n === 1
          ? "1 connection the sketch does not ask for"
          : `${n} connections the sketch does not ask for`,
      /* Batch 9 · and a part that is not on the bench at all, which is not a
         wire in the wrong hole and must not be counted as one. */
      partsMissing: (n: number) =>
        n === 1 ? "1 part still in the kit" : `${n} parts still in the kit`,
      issuesFound: (n: number) =>
        n === 1 ? "1 issue found" : `${n} issues found`,
      nothingFound: "Nothing to correct in this step",
      showingCorrection: "Agent pointed at the connection",

      /* The one thing the agent does with hands. Same shape as the person's
         own four sentences, in the agent's voice — the timeline has to say
         which of them moved it. */
      attachingLead: (lead: string) => `Agent moved ${lead}`,
      leadSeated: (lead: string, pin: string) => `Put ${lead} in ${pin}.`,
      leadJoined: (a: string, b: string) => `Joined ${a} to ${b}.`,
      leadLoosened: (lead: string) => `Left ${lead} loose.`,
      correctionHighlighted: "Correction highlighted on the workbench",
      correctionAlreadyShown: "Correction was already on screen",
      verifying: (step: number) => `Agent verified Step ${step}`,
      stepVerified: "Step verified successfully",
      stepNotVerified: (n: number) =>
        n === 1 ? "1 issue still open" : `${n} issues still open`,
      navigating: (step: number) => `Agent moved to Step ${step}`,
      movedToStep: (step: number, name: string) => `Step ${step} · ${name}`,
      alreadyOnStep: (step: number) => `Already on Step ${step}`,
      /* Steps a jump went past unfinished. Saying nothing is how an
         agent-built chapter comes to look like one somebody worked through. */
      skippedSteps: (n: number) =>
        n === 1 ? "1 step passed unfinished" : `${n} steps passed unfinished`,
      testing: (test: string) => `Agent ran the ${test} test`,
      testPassed: "All checks passed",
      testFailed: (n: number) =>
        n === 1 ? "1 check failed" : `${n} checks failed`,
      reset: "Demo reset",

      /* Batch 8 · the four tools the library and the detail page register.
         They land in the same timeline as the workbench's six, because the
         record is of one collaboration rather than one screen. */
      searchedProjects: "Agent searched the project library",
      projectsFound: (n: number) =>
        n === 1 ? "1 project matches" : `${n} projects match`,
      openedProject: "Agent opened a project",
      readRequirements: "Agent read what the project needs",
      startedProject: "Agent started the build",
      buildStarted: "Build started",

      /* `Check this`. The agent re-reads the build and says what it found —
         which is the whole of the button now. It used to write the repair
         itself and then log the person's voice over it ("You moved the 220Ω
         lead to D9") for a lead they had not touched. These are the agent's
         own sentences, because reading is the only thing it did. */
      checking: "Agent re-checked that connection",
      checkedMatches: (subject: string, pin: string) =>
        `Checked: ${subject} is in ${pin}. That matches the sketch.`,
      checkedStillOpen: (subject: string, observed: string, expected: string) =>
        `Still not matching — ${subject} is in ${observed}, and the sketch writes to ${expected}.`,
      checkedStillJoined: "That join is still there.",
      checkedUnreachable: (part: string) =>
        `I can't check that — the ${part} is back in the kit.`,
      checkedAligned: "Checked: the horn is round the right way now.",
      checkedPartPlaced: (part: string) =>
        `Checked: the ${part} is on the bench now.`,
      checkedStillTurned: "The horn is still a quarter turn out.",
    },

    errors: {
      unknownFinding: "That finding is no longer open.",

      /* What the model said no to, said out loud.

         A refused write used to be indistinguishable from a write that
         happened: `attach` returned the same record either way, so the part
         sprang back under a sentence claiming it had been seated. These are
         the five ways a release can legitimately do nothing, each named. */
      holeTaken: (pin: string) => `${pin} already has a lead in it.`,
      leadNotFree: "That lead already has something clipped to it.",
      sameCircuitPart: "Both ends of one part cannot meet.",
      noTarget: "Nothing there — that is not a hole.",
      /* Chapter two's own refusal. A jumper has no rigid body, so its ends are
         positioned from the holes they sit in and from nothing else: a cable
         end clipped onto a leg would be a point the drawing has no way to
         answer for. Said as a fact about cables rather than as a rule about
         this build, because that is what it is. */
      wireEnd: "A jumper's end goes in a hole, not onto a lead.",
      /* Batch 9 · what a browser can hand `attach_lead` that no button could,
         plus the write that was not needed. Four sentences, not four
         silences. */
      noPlacement: "This build has no parts to place.",
      unknownLead: "This build has no such lead.",
      unknownTarget: "That is neither a hole nor another part's lead.",
      leadAlreadyThere: "That lead is already there.",
      /* Batch 9 · the run is per build now, so "which check" has a per-build
         answer and the error carries it rather than making the agent guess. */
      noBench: "This project has no workbench.",
      unknownCheck: (checks: string) =>
        `No such check. This build runs: ${checks}.`,
      /* Two candidates within a hair of each other. Rather than pick one by
         rounding, the choice stays open and the picker keeps it. */
      tooClose: "Two holes are that close — choose one.",
      /* Batch 8 · the backstop. A tool reached through the browser can be
         handed arguments no button would produce; §9 asks for an
         understandable error result, not an exception crossing the bridge. */
      toolFailed: "That call could not be completed.",
      stepNotReady: "This step has nothing to verify yet.",
      barrierDirection: "Barrier moved the wrong way at the OPEN position.",
      /* Batch 8 · the library tools answer for projects that do not exist, and
         refuse to start one that has no workbench — honestly, rather than by
         opening a route that would 404. */
      unknownProject: "There is no project with that id.",
      projectNotReady: "That project is a preview and has no workbench yet.",
    },

    /* The other half of the timeline: what the person did. The agent can read,
       compare and explain, but it cannot pick up a jumper wire. */
    user: {
      /* Named for what it says rather than for the happy outcome: the demo
         controls move the wire the other way and want the same sentence. */
      movedWire: (subject: string, pin: string) =>
        `You moved the ${subject} wire to ${pin}`,
      /** A person putting a part in a hole, and taking one back out. */
      placedPart: (part: string, pin: string) =>
        `You placed the ${part} in ${pin}.`,
      removedPart: (part: string) => `You took the ${part} back off the board.`,
      /** Chapter one joins are the parts' own legs; there is no cable to move. */
      movedLead: (subject: string, pin: string) =>
        `You moved the ${subject} lead to ${pin}`,

      /* Chapter one's four gestures, said at the granularity they happen at.
         `placedPart` stays for the whole-part reading the shelf still has —
         and for chapter six, which has no leads at all. */
      /** A lead going into a hole in the header. */
      seatedLead: (lead: string, pin: string) => `You put ${lead} in ${pin}.`,
      /** A lead clipped onto another part's lead: the one join in the chapter. */
      joinedLeads: (a: string, b: string) => `You joined ${a} to ${b}.`,
      /** A lead pulled out and left in the air, its part still on the bench. */
      looseLead: (lead: string) => `You pulled ${lead} loose.`,
      /* The join is stored once, on the lead that made it, so moving the other
         end pulls it apart without the person naming it. That is the detach
         they did not ask for, and it is the one the timeline has to say. */
      releasedJoin: (lead: string) =>
        `You pulled ${lead} out of the join.`,
      /** `I removed it`, once it has been done. */
      removedJoin: "You took that join out.",
      /* A part that lost its last path to a board hole because a DIFFERENT
         part moved. Not `removedPart`, which is the gesture; this is the
         consequence, and until it existed a second part could leave the bench
         in silence. */
      cameWithIt: (part: string) => `The ${part} came with it.`,
      /* Undo and redo, both said as *what came back* — the sentence names the
         bench you are now looking at, and the prefix says which way you went.
         One prefix for both was a redo announcing itself as an undo. */
      undone: (sentence: string) => `Undone: ${sentence}`,
      redone: (sentence: string) => `Redone: ${sentence}`,
      nothingToUndo: "There is nothing to undo.",
      remountedServo: "You remounted the servo horn",
      refittedHorn: "You refitted the servo horn a quarter turn out",
      changedCoaching: (level: string) => `You set coaching to ${level}`,
    },

    details: {
      /* Twelve disclosures all called `Developer details` are unusable in a
         screen reader's control list, so each carries its own entry's name. */
      detailsFor: (headline: string) => `for ${headline}`,
      toolLabel: "Tool",
      argumentsLabel: "Arguments",
      resultLabel: "Result",
      durationLabel: "Duration",
      ms: (n: number) => `${n} ms`,
      noArguments: "none",
      failed: "Failed",
    },

    /* G-15 · What each of the workbench's tools is for — seven since
       `attach_lead` arrived. The header counts `workbenchTools` rather than
       printing a number, and this list is what makes that count checkable
       rather than decorative. */
    tools: {
      title: "Tools on this page",
      note: "Registered with the browser while the workbench is open.",
      get_build_context:
        "Read the project, the active step and every connection.",
      inspect_build:
        "Compare the build against the sketch and report findings.",
      show_correction: "Points at a finding on the workbench.",
      attach_lead:
        "Puts a part's lead in a hole or onto another lead. The only tool that changes the build.",
      verify_current_step: "Check the current step and mark it complete.",
      navigate_build_step: "Move to another step.",
      /* The tool description is handed to the browser verbatim for every
         build, so it cannot name one build's checks. It listed the capstone's
         three — sensor, servo, LEDs — to an agent standing at a bench with one
         LED on it. */
      run_functional_test: "Run this build's own checks, in order.",
      /* Batch 8 · registered on the library and the detail screen rather than
         here. §9 keeps a tool on the page it can actually act on. */
      find_projects:
        "Find builds by difficulty, length, component or learning goal.",
      open_project: "Open a project's detail screen.",
      get_project_requirements:
        "Read a project's parts, length, level and learning goals.",
      start_project: "Start a build and open its workbench.",
    },

    knowledge: {
      title: "Quick check",
      tryAgain: "Try again",
      /* The state said in a word, next to the glyph that carries the colour. */
      correctMark: "Correct",

      /**
       * Batch 9 · one question per chapter.
       *
       * There used to be one for the product, and it was the capstone's: a
       * learner who had just finished the breathing lamp — three parts, no
       * sensor, no Echo pin — was asked why the Echo wire has to match the
       * sketch. The check that exists to prove the chapter landed was about a
       * different chapter. A chapter with no entry here simply asks nothing.
       */
      chapters: {
        breathingLamp: {
          question: "Why must the resistor's board end be in D9?",
          options: [
            {
              id: "pwm",
              label: "Only some pins can hold a value between on and off.",
            },
            { id: "current", label: "D9 supplies more current than the rest." },
            { id: "ground", label: "D9 sits closer to the ground pin." },
          ],
          correctId: "pwm",
          correct:
            "Right. Breathing is the pin resting somewhere between on and off, and only the pins marked ~ can do it.",
          incorrect:
            "Not quite. The lead does the same job in any hole; what changes is whether that pin can be anything but on or off.",
        },
        trafficLight: {
          /* Aimed at the breadboard rather than at the sequence: the catalogue
             says this chapter adds `The breadboard, and a sequence`, and the
             sequence is the thing the person watched happen. What they were
             asked to believe, and cannot see, is that two holes in one column
             are already touching. */
          question:
            "The LED's short leg is in F7 and the resistor's lead is in J7. Why does that work?",
          options: [
            {
              id: "column",
              label: "The five holes down a column are one strip of metal.",
            },
            { id: "row", label: "The holes across a row are joined together." },
            {
              id: "rail",
              label: "The long rails down the edges join everything up.",
            },
          ],
          correctId: "column",
          correct:
            "Right. Each column of five holes is one strip under the plastic, so a leg in F7 and a leg in J7 are already touching — there was never a wire to add.",
          incorrect:
            "Not quite. It is the columns that are joined, not the rows: the five holes in column 7 are one strip of metal, and F7 and J7 are two of them.",
        },
        motionNightLight: {
          /* Aimed at the pin rather than at the sensor. What the person watched
             happen is a lamp coming on; what they were asked to believe, and
             cannot see, is that one of the two pins in this build is being read
             rather than written. */
          question:
            "The lamp is on D13 and the sensor is on D2. What is different about D2?",
          options: [
            {
              id: "reads",
              label: "The sketch reads it — the sensor decides what is on it.",
            },
            { id: "faster", label: "D2 switches faster than the pins above it." },
            { id: "power", label: "D2 is what supplies the sensor with power." },
          ],
          correctId: "reads",
          correct:
            "Right. Every pin before this one was written to. D2 is read, and the whole sketch is a loop asking what is on it.",
          incorrect:
            "Not quite. The sensor is fed from the + rail, not from D2 — what D2 carries is the sensor's answer, and the sketch's job is to keep reading it.",
        },
        plantGuardian: {
          /* Aimed at the difference between the two headers, which is the one
             thing in this chapter a person cannot see: `A0` and `D2` are the
             same brass, the same size and the same distance apart. */
          question:
            "The probe is on A0. What would change if it were on D2 instead?",
          options: [
            {
              id: "number",
              label: "The board would only ever see 0 or 1, never a number in between.",
            },
            {
              id: "nothing",
              label: "Nothing — the sketch reads whichever pin it names.",
            },
            { id: "power", label: "The probe would lose its power and stop answering." },
          ],
          correctId: "number",
          correct:
            "Right. Only the six holes marked A go through a converter. A digital pin rounds the probe's voltage to one of two answers, and a threshold you can cross has nowhere left to live.",
          incorrect:
            "Not quite. The probe is fed from the + rail either way — what changes is what the board can make of its answer. A digital pin has two values; A0 has 1024.",
        },
        touchlessSoapDispenser: {
          /* Aimed at the `~`, which is the one mark on the board that this
             chapter turns on and that nothing on screen can make louder.

             `D4` rather than `D8`: this chapter's Trig lead is IN D8, so the
             question used to ask a person to imagine moving the servo onto a
             pin they had just filled. `D4` is unused here and carries no ~,
             which is the only property the question needs of it. */
          question:
            "The servo's orange lead is on D9, which is marked ~. What would change on D4?",
          options: [
            {
              id: "angle",
              label: "The board could no longer tell the horn an angle — only on or off.",
            },
            { id: "power", label: "The servo would not get enough current." },
            { id: "speed", label: "The horn would turn more slowly." },
          ],
          correctId: "angle",
          correct:
            "Right. A servo is told a position, and a position is a value between two ends. Only the pins marked ~ can hold one; on any other the wiring is perfect and the horn does not move at all.",
          incorrect:
            "Not quite. The servo draws its current from the rails, not from the signal pin — what that pin carries is an instruction, and only some pins can say anything other than on or off.",
        },
        smartParkingBarrier: {
          question:
            "Why must the Echo wire match the pin defined in the sketch?",
          options: [
            { id: "pin", label: "The sketch reads a specific input pin." },
            { id: "voltage", label: "It changes the board voltage." },
            { id: "range", label: "It increases the sensor range." },
          ],
          correctId: "pin",
          correct:
            "Right. The pin number is part of the program, not a preference — the sketch listens on D7 and nowhere else.",
          incorrect:
            "Not quite. The wire carries the same signal either way; what changes is whether the sketch is listening on that pin.",
        },
      },
    },
  },

  /* What an inspection reports. Every sentence is generated from the graph, so
     there is never a stale one left behind after a correction. */
  findings: {
    connectionMismatch: "Connection mismatch",
    missingConnection: "Connection missing",
    servoOff: "Servo horn is 90° off",
    /* The `observed` half of a join that is not made. "Not wired" was the
       capstone's word for it; chapter one has no wire, and the sentence beside
       this one now says the lead is joined to nothing. */
    notWired: "Not joined",
    /* The third kind of finding: not a wire in the wrong place and not a wire
       that is missing, but one the sketch never asked for. It reads as a
       statement about the sketch rather than an accusation, because the join
       is often a reasonable-looking thing to have done. */
    unexpectedConnection: "Connection the sketch does not ask for",
    /** Stands where the expected terminal would be. There isn't one. */
    notAsked: "Not in the sketch",

    wrongPin: (subject: string, observed: string, expected: string) =>
      `${subject} is connected to ${observed}. This build expects ${expected}.`,
    /* Not `has no wire yet`. Chapter one is wired with the parts' own legs and
       contains no wire at all, and the model calls chapter two's four cables
       legs as well. What is true of every chapter is that the lead is joined to
       nothing. */
    missingWire: (subject: string, expected: string) =>
      `${subject} is not joined to anything yet. This build expects ${expected}.`,

    /**
     * The near end, when the part prints something beside it.
     *
     * `Echo`, `−`, `220Ω` — what is silkscreened on the thing in your hand, and
     * never replaced by a dictionary name (rule 13). What a glyph cannot say is
     * what KIND of thing it is printed on, and the sentences need that: `Move
     * the black − wire` named an object chapter one does not contain. A lead
     * its part prints nothing beside — every jumper cable end in the product —
     * is named from `build.leadObject` instead and never reaches this table.
     *
     * Two cases, for the same reason `build.leads` and `build.leadObject` are
     * two tables: one opens a sentence, the other stands inside one.
     */
    subjectNominative: {
      leg: (printed: string) => `The ${printed} leg`,
      lead: (printed: string) => `The ${printed} lead`,
      "cable-end": (printed: string) => `The ${printed} end`,
    },
    subjectObject: {
      leg: (printed: string) => `the ${printed} leg`,
      lead: (printed: string) => `the ${printed} lead`,
      "cable-end": (printed: string) => `the ${printed} end`,
    },
    /* `other` is whatever the lead reached — a hole label like `D13` or
       another lead's label like `220Ω` — so the sentence is built to read
       either way round and never claims it is a pin. */
    unexpectedDetail: (subject: string, other: string) =>
      `${subject} is joined to ${other}. The sketch does not ask for that join.`,
    servoExplanation:
      "The gate will close when the sketch sends the OPEN position.",

    /**
     * The first rung, one per kind of target.
     *
     * There is no such thing as a general "highlighted row". This was one
     * sentence — *"Compare the ${subject} wire with the highlighted digital-pin
     * row"* — printed on all 81 joins in the six chapters, of which 16 are
     * digital pins. The other 65 are breadboard columns, rails, supply pins,
     * another part's leg, and chapter four's `A0`: the analog hole that
     * chapter's whole lesson is about, which the first rung of the ladder was
     * steering the reader away from.
     *
     * `hint` itself is the digital-header arm — the capstone's geometry, and
     * the one the correction specimen in `/lab/molecules` renders.
     */
    hint: (subject: string) =>
      `Compare where ${subject} sits with the highlighted pin on the board's header.`,
    hintAnalog: (subject: string) =>
      `Compare where ${subject} sits with the highlighted hole among the six marked A.`,
    hintPower: (subject: string) =>
      `Compare where ${subject} sits with the highlighted supply pin on the board.`,
    hintRow: (subject: string) =>
      `Compare where ${subject} sits with the highlighted column.`,
    hintRail: (subject: string) =>
      `Compare where ${subject} sits with the highlighted hole on the rail.`,
    hintLead: (subject: string) =>
      `Compare where ${subject} sits with the lead it is highlighted against.`,

    /**
     * The middle rung: one true thing about this kind of join.
     *
     * It used to be the capstone's Echo sentence — *"the ${subject} pin sends
     * the return pulse timing back to the board"* — composed for every wiring
     * finding in every chapter, in both languages. It is true of exactly one of
     * the product's 81 joins; chapters one to four contain no ultrasonic sensor
     * of any kind, so it described a component that is not in the box.
     *
     * Each of these takes the subject and does not print it, the way
     * `unexpectedExplain` already does: the middle rung is the general rule,
     * and naming the lead here would make it sound like a fact about one leg
     * rather than about every join of its kind.
     */
    explain: (subject: string, expected: string) =>
      `A pin number is part of the program, not a preference: the sketch names ${expected} and no other hole along that header.`,
    explainAnalog: (subject: string, expected: string) =>
      `Only the six holes marked A can answer with a number instead of a yes or a no, and ${expected} is the one the sketch reads.`,
    explainPower: (subject: string, expected: string) =>
      `${expected} is one of the board's supply pins. It carries no signal and the sketch never names it — what runs through it is the current everything else on the bench needs.`,
    explainRow: (subject: string, expected: string) =>
      `The five holes down one column of a breadboard are a single strip of metal, so a lead in ${expected} is joined to everything else in that column — and to nothing in the column beside it.`,
    explainRail: (subject: string, expected: string) =>
      `A rail runs the whole length of the breadboard as one piece of metal, and ${expected} is on it. What matters is that the lead reaches the rail, not which of its holes it uses.`,
    explainLead: (subject: string, expected: string) =>
      `Nothing on the board makes this join. The metal has to meet the metal: this lead has to be touching ${expected} itself.`,

    /**
     * The bottom rung, and two sentences rather than one.
     *
     * `exact` was a single template handed `observed ?? ""`, so a lead that is
     * in no hole at all read *"Move the black − wire from  to F9."* — a double
     * space in English and, in Turkish, a case suffix stranded on nothing. A
     * missing connection is a **placement**; only a misplaced one is a move.
     *
     * The colour went with it. `wire.colour` is "how you would ask for the wire
     * out loud, reaching into a tangle" — the capstone's loose jumper — and it
     * matched nothing on screen: chapter one has no cable, the kit shelf draws
     * all four of chapter two's in one colour on purpose, and a lead in a
     * mismatch is stroked in the error orange rather than its role.
     */
    exactMove: (subject: string, from: string, to: string) =>
      `Move ${subject} from ${from} to ${to}.`,
    exactMoveHole: (subject: string, from: string, to: string) =>
      `Move ${subject} out of ${from} and into ${to}.`,
    exactPut: (subject: string, to: string) => `Put ${subject} into ${to}.`,
    exactPutHole: (subject: string, to: string) => `Push ${subject} into ${to}.`,
    /* The one target that is not an address: another part's own lead. There is
       no move and no put — the two pieces of metal have to meet. */
    exactJoin: (subject: string, to: string) => `Clip ${subject} onto ${to}.`,

    /* The same three rungs the wiring ladder has. The hint sends the person
       back to the object; the explanation says why an extra join is a fault
       at all, which is the part nobody arrives knowing; the exact fix is a
       removal, and says so in the words the button under it uses. */
    unexpectedHint: (subject: string) =>
      `Look at everything ${subject} is touching, then read the sketch again.`,
    /* Takes the subject and does not print it: the middle rung is the general
       rule, and naming the lead here would make it sound like a fact about
       this one leg rather than about every join in the build. The argument
       stays so the three rungs are called the same way. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    unexpectedExplain: (subject: string) =>
      "Every join this build needs is named in the sketch, and this one is not among them. A join nobody asked for is still a path the current can take.",
    unexpectedExact: (subject: string) =>
      `Pull ${subject} off and leave it loose.`,

    servoHint: "Watch which way the arm swings when the gate should open.",
    servoExplain:
      "The sketch drives the horn to 90° for OPEN. Mounted a quarter turn out, that same command closes the gate.",
    servoExact:
      "Pull the horn off the spline and refit it a quarter turn anticlockwise.",

    evidence: {
      camera: "Camera frame",
      alignment: "Visual alignment check",
      graph: "Graph comparison",
    },
    /* Split so the number can render in mono while the word around it stays
       in prose — and so a locale that puts the sign first can do that. */
    confidenceValue: (percent: number) => `${percent}%`,
    confidence: (value: string) => `${value} confidence`,
    /* A resolved finding stays on screen and changes state. Removing the row
       silently would be a change the user never saw happen. */
    resolvedConnection: "Connection matches now",
    /* Not `Connection matches now`: nothing matches, the join is gone. The
       resolved row says what actually happened or it is the interface
       congratulating the person for the opposite of what they did. */
    resolvedExtra: "That join is gone",

    /**
     * The finding the panel could not make until now.
     *
     * A step whose connections name a part that is still in the box used to
     * produce *nothing* — the derivation skipped the mismatch because the lead
     * had no node to be wrong about — so `inspect_build` reported "Nothing to
     * correct in this step" on an empty bench, and the verify that followed
     * refused it without naming anything. This is what it should have said.
     */
    partNotPlaced: "A part is still in the kit",
    partNotPlacedDetail: (part: string) =>
      `This step wires the ${part}, and it is not on the bench yet.`,
    partNotPlacedHint: (part: string) =>
      `Take the ${part} out of the kit strip at the top of the bench.`,
    partNotPlacedExplain: (part: string) =>
      `Nothing can be checked about the ${part} until it is on the board — a part in the box has no pins to be right or wrong about.`,
    partNotPlacedExact: (part: string) =>
      `Drag the ${part} from the kit strip onto the board, or press Enter on it and choose a hole with the arrow keys.`,
    resolvedPart: "That part is on the bench now",
    onTheBench: "On the bench",
    inTheKit: "Still in the kit",
    resolvedServo: "Horn is aligned now",
    /* True now, and only now. While `I fixed it` performed the repair, this
       word was the interface certifying its own write as the reader's work. */
    resolvedMeta: "Verified",
    /* The other outcomes of a check. A row that re-rendered identically after
       the button was pressed is a button that appears not to work — which is
       how an honest answer got read as a broken control. */
    checkedStillOpen: "Checked · still open",
    checkedUnreachable: "Can't check yet · the part is in the kit",
    severity: {
      critical: "Critical",
      warning: "Warning",
      info: "Info",
    },
    openCount: (n: number) =>
      n === 1 ? "1 open finding" : `${n} open findings`,
  },

  /**
   * W-01…W-03 · The workshop entry.
   *
   * Pick a build on the left, look in its kit in the middle, ask the agent on
   * the right. Everything the case *claims* — which parts, how many — is read
   * from the catalogue and printed as text beside it, because a drawing of an
   * open toolbox is atmosphere and an inventory is a fact.
   */
  /* W-03 · The third column.

     It sells the mechanism, not the mechanism's parts list. An earlier draft
     printed all ten tool names here and it was the wrong screen for them: a
     person choosing a kit does not need the agent's vocabulary, they need to
     know that the agent has hands at all. Written for a twelve-year-old, and
     short enough that the whole thing is read rather than skimmed. */
  coach: {
    title: "This page can talk to the agent",
    lead: "Almost everywhere else, an AI can only write back at you. Not here.",
    body: "Through WebMCP the page hands the agent its own buttons. The agent presses them.",
    canTitle: "So the agent can",
    canLook: "Look at the circuit you built.",
    canFind: "Find the wire in the wrong place.",
    canShow: "Point at it on the screen.",
    canCheck: "Check your fix once you have made it.",
    limit: "It can do nothing the page has not handed it. The page decides what it gets to see.",
  },
  workspace: {
    projects: "PROJECTS",
    kit: "KIT",
    /* The case is a control, so it says what pressing it does rather than what
       it is. Both halves exist because the control is a toggle (rule 7). */
    openCase: "Open the kit case",
    closeCase: "Close the kit case",
    caseHint: "Press the case to look inside",
    /* The rail is a window, not a list that runs off the screen. The notch says
       which way it moves, and says the other thing once it has run out. */
    moreProjects: "Next projects",
    firstProjects: "Back to the start",
    caseCaption: (project: string) => `${project} — kit case`,
    inventory: "What is in the box",
    /* The call to action names the build it opens rather than the one that is
       selected, because those are not always the same thing and the button is
       the last place that should be vague about it. */
    startTitle: "Start building",
    /* Said under the button, not on it: the button's job is to name where it
       goes, and this is why it goes somewhere else. */
    noBenchYet: (project: string) => `${project} has no guided bench yet.`,
    /* Five of the six chapters have no guided bench yet, and the rail must not
       offer one. Said here rather than implied by a disabled button (§18).
       Which bench opens instead is no longer said here — that fact moved to
       the button that does it. */
    previewNote:
      "This build has no guided workshop yet. Its kit and its steps are real.",
  },

  device: {
    /* D-01 · The dock names itself, because it is a region of the workbench a
       screen-reader user has to be able to jump to and leave. */
    dockRegion: "Device dock",
    expand: "Open device dock",
    collapse: "Close device dock",
    tabs: {
      device: "Device",
      serial: "Serial monitor",
      test: "Test output",
    },
    board: "Board",
    boardValue: "Simulated UNO-compatible board",
    /* S-01 · The same claim in a column half as wide. It keeps the word
       `simulated`, because that is the part of the sentence §18 is about. */
    boardValueShort: "UNO R3 · simulated",
    port: "Port",
    portValue: "Demo",
    voltage: "Voltage",
    voltageValue: "5V",
    lastSerial: "Last serial output",
    testStatus: "Test status",
    states: {
      idle: "Idle",
      running: "Running",
      passed: "Passed",
      failed: "Failed",
    },
    /* D-03 · Everything *around* the serial log is translated; the lines
       inside it never are — see rule 13 and `serial-monitor.tsx`. */
    serialRegion: "Serial output",
    serialEmpty: "The board has not said anything yet",
    serialEmptyHint: "Run the functional test and its output appears here.",
    /* D-04 · Telemetry. */
    telemetry: "Telemetry",
    distance: "Distance",
    noReading: "No reading",
    recentReadings: "Recent readings",
  },

  test: {
    /* D-05 · What the runner is doing, while it does it. */
    sensor: "Reading distance sensor",
    servo: "Moving barrier servo",
    leds: "Checking status LEDs",
    /* Chapter one's two. A row is named by the build's own check id, and an id
       with no word here prints as itself rather than as a blank. */
    wiring: "Reading the connections",
    breathing: "Can the lamp breathe",
    /* Chapter two's. Named for what the check reads rather than for the
       outcome: it compares which pin each drive cable actually reached against
       the three the sketch names, and a cable one hole over leaves that lamp
       dark for the whole run. */
    sequence: "Reading the light order",
    /* Chapter three's, and named the same way: it reads which pin the sensor's
       answer actually reaches and which one the lamp's cable reaches, against
       the two the sketch names. Both joins can be made and the build still be
       a lamp that never notices anything. */
    senses: "Reading the two pins",
    /* Chapter four's, and named for the distinction it is about: the row does
       not ask whether the probe is wired, it asks whether the hole it reached
       can report a number at all. A digital pin passes every connection test
       there is and answers 0 or 1023 and nothing between. */
    reads: "Reading a number, not a yes",
    /* Chapter five's two. `distance` asks whether the board is reading the echo
       it triggered; `sweep` asks whether it can tell the pump an angle at all,
       which is a different question from whether the servo is wired. */
    distance: "Reading the distance",
    sweep: "Can the pump be told an angle",
    /* `barrierDirection` used to sit here. `copy.test` is one entry per check
       id (`run-spec.ts`) and it was no build's — the only live one of that name
       is `agentPanel.errors.barrierDirection`, which a lab specimen reads. It
       was the one row in this table a translator could not place. */
    /* A-17 · the word a test row shows when it has no measurement to show. */
    states: {
      idle: "Not started",
      running: "Running",
      passed: "Passed",
      failed: "Failed",
      skipped: "Skipped",
    },
    summary: {
      idle: "No test has run yet",
      idleDetail: "The full test drives the finished build, end to end.",
      running: "Running the functional test",
      passed: (n: number) =>
        n === 1 ? "The one check passed" : `All ${n} checks passed`,
      passedDetail: "Every check on this build answered the way it should.",
      failed: (n: number) =>
        n === 1 ? "1 check failed" : `${n} checks failed`,
      failedDetail:
        "The rest of the build behaves. Fix the failing check and run the test again.",
    },
  },

  inspection: {
    title: "Build inspection",
    cameraFrame: "Camera frame",
    referenceView: "Reference view",
    findingsSummary: "Findings summary",
    demoVisionResult: "Demo vision result",
    close: "Close inspection",
    /* The way out of the window when something is still open against the step.
       Not "Close": the person is being sent somewhere, and it is where the fix
       is — the bench behind this window. */
    backToBench: "Back to the bench",
    /* W-06 · When the frame was taken. A reading, so it renders in mono. */
    capturedAt: "Captured",
    /* W-08 · The horn, twice: where it is and where the sketch wants it. */
    hornAngle: "Horn angle",
    observed: "Observed",
    expected: "Expected",
  },

  complete: {
    title: "Your build is working",
    sub: "You didn't just finish it. You learned how it works.",
    timeSpent: "Time spent",
    issuesFixed: "Issues fixed",
    /* Batch 9 · the agent can place a lead now, and the screen that says you
       finished is the one place that has to say who did. */
    assisted: (n: number) =>
      n === 1
        ? "The agent made 1 of this build's moves"
        : `The agent made ${n} of this build's moves`,
    assistedDetail:
      "The agent can place a lead for you. What it placed is part of the build, which is why it is named here.",
    conceptsLearned: "Concepts learned",
    testResult: "Test result",
    knowledgeCheck: "Quick check",
    tryAnother: "Try another project",
    reopen: "Reopen workbench",
    share: "Share build",
    /* §5 asks for a share action and rules out real sharing; §18 rules out a
       dead button. Copying the summary is a real thing that happens entirely
       on this machine. */
    shareCopied: "Build summary copied",
    shareHeading: (project: string) => `${project} — built with CircuitPilot`,
    /* Countable, so it is a count and not a bar (rule 5). */
    conceptsCount: (n: number) =>
      n === 1 ? "1 concept" : `${n} concepts`,
    issuesCount: (n: number) => (n === 1 ? "1 issue" : `${n} issues`),
    /* When the page is opened without a session behind it, the numbers fall
       back to the project's own facts rather than inventing a history. */
    noSession: "Opened without a build in progress",
    noSessionDetail:
      "The figures below are the project's own, not a run of yours. Open the workbench to make them yours.",
  },

  a11y: {
    breadcrumb: "Breadcrumb",
    close: "Close",
    dismiss: "Dismiss",
    progress: "Progress",
    buildSteps: "All build steps",
    /* A-15's control is a button that opens the step list, so it needs a name
       a screen reader can read. It carried an English sentence baked into the
       component until Batch 7 — invisible to the language sweep, because the
       sweep strips tags and this lives in an attribute. */
    buildProgress: (current: number, total: number) =>
      `Build progress: step ${current} of ${total}. Show all steps.`,
    buildProgressBlocked: (current: number, total: number) =>
      `Build progress: step ${current} of ${total}, blocked. Show all steps.`,
    clearSearch: "Clear search",
    removeFilter: (name: string) => `Remove ${name}`,
    showOnWorkbench: (part: string, terminal: string) =>
      `Show ${part}, ${terminal} on the workbench`,
    smallScreen: "Best experienced on a larger screen",
    smallScreenDetail:
      "The workbench canvas needs room to stay readable. The build steps, findings and agent activity are still available here.",
  },
};

/** The shape every locale must fill. */
export type Copy = typeof en;
