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
  },

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
  projects: {
    smartParkingBarrier: {
      name: "Smart Parking Barrier",
      summary:
        "A gate that senses a car approaching, lifts to let it through, and closes behind it.",
    },
    plantGuardian: {
      name: "Plant Guardian",
      summary:
        "A soil probe that watches how dry the pot is and lights up when the plant needs water.",
    },
    motionNightLight: {
      name: "Motion Night Light",
      summary:
        "A light that wakes when someone walks past and fades out again once the hallway is still.",
    },
    miniRadar: {
      name: "Mini Radar",
      summary:
        "A distance sensor riding a servo, sweeping the room and reporting what it finds.",
    },
    roomClimateStation: {
      name: "Room Climate Station",
      summary:
        "A desk instrument that reads the room's temperature and humidity and says when it drifts.",
    },
    touchlessSoapDispenser: {
      name: "Touchless Soap Dispenser",
      summary:
        "A pump that runs when a hand comes close, so nothing has to be touched to use it.",
    },
    digitalReactionGame: {
      name: "Digital Reaction Game",
      summary:
        "A light comes on at a moment you cannot predict, and the board times how fast you press.",
    },
  },

  /* P-06 · The component vocabulary. `Sensor` is generic on purpose — four
     different sensors across the seven builds share one word and one mark. */
  components: {
    board: "Microcontroller board",
    breadboard: "Breadboard",
    sensor: "Sensor",
    servo: "Micro servo",
    led: "LEDs",
    resistor: "Resistors",
    jumper: "Jumper wires",
    usb: "USB cable",
    cardboard: "Cardboard arm",
    button: "Push button",
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
      "Seven builds, each one a finished object. Pick by what you own, what you have time for, or what you want to learn.",
    search: "Search projects",
    filters: {
      difficulty: "Difficulty",
      duration: "Duration",
      components: "Components",
      learningGoal: "Learning goal",
      readyNow: "Ready now",
    },
    clear: "Clear filters",
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
    previewNotice:
      "This project is a preview. Only Smart Parking Barrier has a full guided workbench in this release.",
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
       `Board → D7`; `sensor.echo` as `Ultrasonic sensor → Echo`. */
    parts: {
      board: "Board",
      breadboard: "Breadboard",
      sensor: "Ultrasonic sensor",
      servo: "Micro servo",
      ledGreen: "Green LED",
      ledRed: "Red LED",
    },
    steps: {
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

  workbench: {
    back: "Back to project",
    stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
    resetDemo: "Reset demo",
    demoControls: "Demo controls",
    componentsInStep: "Components in this step",
    inspect: "Inspect my build",
    verify: "Verify step",
    runFullTest: "Run full test",
    showMe: "Show me",
    iFixedIt: "I fixed it",
    previewAngle: "Preview correct angle",
    iRemounted: "I remounted it",
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
      issuesFound: (n: number) =>
        n === 1 ? "1 issue found" : `${n} issues found`,
      nothingFound: "Nothing to correct in this step",
      showingCorrection: "Agent pointed at the connection",
      correctionHighlighted: "Correction highlighted on the workbench",
      correctionAlreadyShown: "Correction was already on screen",
      verifying: (step: number) => `Agent verified Step ${step}`,
      stepVerified: "Step verified successfully",
      stepNotVerified: (n: number) =>
        n === 1 ? "1 issue still open" : `${n} issues still open`,
      navigating: (step: number) => `Agent moved to Step ${step}`,
      movedToStep: (step: number, name: string) => `Step ${step} · ${name}`,
      alreadyOnStep: (step: number) => `Already on Step ${step}`,
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
    },

    errors: {
      unknownFinding: "That finding is no longer open.",
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

    /* G-15 · What each of the six tools is for. The header claims `6 tools
       available`; this is what makes the claim checkable rather than decorative. */
    tools: {
      title: "Tools on this page",
      note: "Registered with the browser while the workbench is open.",
      get_build_context:
        "Read the project, the active step and every connection.",
      inspect_build:
        "Compare the build against the sketch and report findings.",
      show_correction: "Point at a finding on the workbench.",
      verify_current_step: "Check the current step and mark it complete.",
      navigate_build_step: "Move to another step.",
      run_functional_test: "Run the sensor, servo and LED checks.",
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
      question: "Why must the Echo wire match the pin defined in the sketch?",
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
      tryAgain: "Try again",
      /* The state said in a word, next to the glyph that carries the colour. */
      correctMark: "Correct",
    },
  },

  /* What an inspection reports. Every sentence is generated from the graph, so
     there is never a stale one left behind after a correction. */
  findings: {
    connectionMismatch: "Connection mismatch",
    missingConnection: "Connection missing",
    servoOff: "Servo horn is 90° off",
    notWired: "Not wired",

    wrongPin: (subject: string, observed: string, expected: string) =>
      `${subject} is connected to ${observed}. This build expects ${expected}.`,
    missingWire: (subject: string, expected: string) =>
      `${subject} has no wire yet. This build expects ${expected}.`,
    servoExplanation:
      "The gate will close when the sketch sends the OPEN position.",

    hint: (subject: string) =>
      `Compare the ${subject} wire with the highlighted digital-pin row.`,
    explain: (subject: string, expected: string) =>
      `The ${subject} pin sends the return pulse timing back to the board. The sketch reads that signal from ${expected}.`,
    exact: (colour: string, subject: string, from: string, to: string) =>
      `Move the ${colour} ${subject} wire from ${from} to ${to}.`,

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
    resolvedServo: "Horn is aligned now",
    resolvedMeta: "Verified",
    severity: {
      critical: "Critical",
      warning: "Warning",
      info: "Info",
    },
    openCount: (n: number) =>
      n === 1 ? "1 open finding" : `${n} open findings`,
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
    barrierDirection: "Barrier direction",
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
      idleDetail:
        "The full test drives the finished build: something approaches, the sensor reads it, the barrier answers.",
      running: "Running the functional test",
      passed: "All three checks passed",
      passedDetail:
        "The barrier opens for what comes within range, and closes again behind it.",
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
