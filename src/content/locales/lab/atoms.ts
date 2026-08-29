/**
 * Two lab pages, one file: Batch 1 · Atoms and the open-decisions button lab.
 *
 * They share a vocabulary — the same five kit parts, the same capsule, the same
 * five roles — so splitting them would mean translating the same sentence
 * twice and letting the two copies drift.
 *
 * What is *not* here: token names (`rounded-full`, `--duration-quick`), hex
 * colours, tool names (`inspect_build`), material codes (`A-01`, `CB3`, `L4`)
 * and hardware readings (`D7`, `5V`, `18 cm`). Those are what the machine
 * calls things, and they are the same in every language. The button labels
 * inside the specimens come from the product dictionary — a lab that renamed
 * the buttons would stop being a preview of the product.
 *
 * A few keys are sentence fragments (`…Before` / `…After`) because a mono
 * value or a link sits in the middle of the sentence. Turkish puts the verb
 * last, so the fragments are not a mirror of the English ones — some carry a
 * leading space, some a suffix that attaches to the value in front of them.
 */

const en = {
  page: {
    overline: "Batch 1",
    title: "Atoms",
    intro:
      "Twenty-two parts, all built from Batch 0 tokens and all interactive — click, tab, type. These are the real product components; the screens in later batches import exactly what is on this page.",
    navLabel: "Sections on this page",
    anchors: {
      buttons: "Buttons",
      badges: "Badges, chips, values",
      controls: "Fields and controls",
      feedback: "Feedback and marks",
    },
  },

  sections: {
    buttons: {
      title: "Buttons",
      description:
        "Five intents, three heights, plus the icon-only variant that every toolbar and canvas control is built from.",
    },
    badges: {
      title: "Badges, chips and technical values",
      description:
        "Status, severity, tags, filters, mono readouts, metadata lines, dividers and links.",
    },
    controls: {
      title: "Fields and controls",
      description:
        "Text, search, select, checkbox, radio, segmented control and switch — the input surface of the whole product.",
    },
    feedback: {
      title: "Feedback and marks",
      description:
        "Progress, the agent's activity pulse, functional-test rows, tooltips, and the two brand marks.",
    },
  },

  /* The five parts of the Smart Parking Barrier kit, as the checklist writes
     them. Used by the atoms gallery and by all five checkbox options in the
     button lab, which are five readings of one list. */
  kit: {
    board: {
      label: "UNO-compatible board",
      detail: "Any Arduino-compatible board with 5V logic.",
    },
    sensor: { label: "Ultrasonic distance sensor" },
    servo: { label: "Micro servo" },
    resistors: {
      label: "220Ω resistors",
      detail: "Indeterminate: some checked in a group.",
    },
    arm: { label: "Cardboard barrier arm", detail: "Disabled example." },
  },

  buttons: {
    variants: {
      title: "Variants",
      note: "Every role is a filled capsule — hierarchy comes from fill weight, not from shape. One saturated primary per screen region; white secondary for the recoverable alternative; grey tertiary for acknowledgement; red for irreversible; transparent quiet for dismissal.",
    },
    sizes: {
      title: "Sizes and states",
      note: "Heights are 40 / 44 / 48px, so every size clears the minimum touch target. Medium is the product default; small is for dense toolbar rows.",
      small: "Small · 40",
      medium: "Medium · 44",
      inspecting: "Inspecting",
      disabled: "Disabled",
      loadingHint: (label: string) =>
        `Click “${label}” to see the loading state.`,
    },
    plate: {
      title: "The plate, on both grounds",
      note: "Every button rests on a 6px white plate with its own soft shadow. On the app background the plate is visible as a pale halo; on a white card it disappears and only its shadow separates the control from the surface. Because the plate is painted rather than laid out, button groups need at least 16px of gap.",
      onApp: "App background — plate visible",
      onCard: "White card — only the shadow remains",
    },
    icons: {
      title: "Icon buttons",
      note: "Every one carries an aria-label, which doubles as its tooltip. These are the canvas controls from Batch 3, built early so the toolbar has real parts.",
      focusFinding: "Focus on finding",
      remove: "Delete",
    },
  },

  badges: {
    status: {
      title: "Status badges",
      note: "A raised white capsule with a coloured glyph. Colour lives in the icon, so the label keeps full contrast and a row of seven reads as one system. The three on the right run for the entire workbench session — they are the product's promise that nothing here is pretending to be real hardware.",
    },
    severity: {
      title: "Severity",
      note: "Icon plus word, always. A finding card sits next to coloured wires, so its severity cannot rely on a colour swatch to be read.",
      blocksTest: "Blocks the test",
    },
    chips: {
      title: "Chips",
      note: "Static tags on project cards, toggleable in the library toolbar, removable once applied. Try them — they are wired to real state.",
      staticHeading: "Static tags",
      toggleHeading: "Toggleable filters",
      appliedHeading: "Applied filters",
      empty: "No filters applied.",
      tags: {
        pins: "Digital pins",
        pwm: "PWM & servo control",
        distance: "Distance measurement",
        polarity: "LED polarity",
      },
      filters: {
        beginner: "Beginner",
        intermediate: "Intermediate",
        under40: "Under 40 min",
        readyNow: "Ready now",
      },
      applied: { sensor: "Ultrasonic sensor", servo: "Servo" },
    },
    values: {
      title: "Technical values and metadata",
      note: "Mono values are recognisable inside a sentence without bold or colour. The metadata line inserts its own separators so every card punctuates the same way.",
      connectedBefore: "Echo is connected to",
      connectedAfter: ".",
      expectsBefore: "This build expects",
      expectsAfter: ".",
      powerBefore: "Power stays on",
      powerMiddle: " and the last reading was",
      powerAfter: ".",
      meta: { duration: "35 min", level: "Beginner", steps: "7 steps" },
      confidence: "94% confidence",
      linkBefore: "Read more about pin mapping in the",
      wiringReference: "wiring reference",
      linkAfter: ", or",
      openLab: "open the design lab",
    },
  },

  controls: {
    fields: {
      title: "Fields",
      note: "The select is a real listbox, not a native one — the OS menu cannot be styled and would land in the middle of the interface looking borrowed. Open it and use the arrow keys, Home/End, Escape, or just type the first letters of an option.",
      buildNote: {
        label: "Build note",
        placeholder: "Anything you changed",
        hint: "Saved with this build only.",
      },
      expectedPin: {
        label: "Expected pin",
        error: "This build defines D7 in the sketch.",
      },
      difficulty: {
        any: "Any level",
        beginner: "Beginner",
        beginnerHint: "4 projects",
        intermediate: "Intermediate",
        intermediateHint: "3 projects",
      },
      duration: {
        any: "Any duration",
        under30: "Under 30 min",
        under45: "Under 45 min",
        under60: "Under 60 min",
      },
    },
    segmented: {
      title: "Segmented controls",
      note: "Left is the canvas view switch; right is the coaching level, which defaults to hinting so the product never hands over the answer unasked.",
      canvasView: "Canvas view",
      selected: "Selected:",
    },
    choices: {
      title: "Checkboxes and switches",
      note: "The checklist never blocks the build — an unchecked kit just means the workbench runs in guided demo mode. Unticked reads as a slot to fill; ticked says what you have. A glance down the column is enough to see what is missing.",
      pinLabels: "Pin labels",
      technicalGrid: "Technical grid",
      referenceOverlay: "Reference overlay",
    },
    quiz: {
      title: "Knowledge check",
      note: "The radio option is built for the question that follows a correction. It has an answered state, because the point is understanding the fix rather than clicking through it.",
      question: "Why must the Echo wire match the pin defined in the sketch?",
      answers: {
        pin: "The sketch reads a specific input pin.",
        voltage: "It changes the board voltage.",
        range: "It increases the sensor range.",
      },
      check: "Check answer",
      retry: "Try again",
    },
  },

  feedback: {
    progress: {
      title: "Build progress",
      note: "Progress here is seven named steps, not a percentage — so the fraction is the headline and the ticks let you count what is left. Click it to open the full list; pick a step to jump there. The agent drives both: verify_current_step advances the fraction, inspect_build turns a tick amber.",
      compact: "Compact · workbench topbar",
    },
    percentage: {
      title: "Percentage progress",
      note: "Countable things get counted: five parts render as five ticks, so you read the number off the control instead of estimating it from a bar's length. Only genuinely continuous work keeps the solid track. Completing swaps the tone and ticks the label — the finish is a state change, not a bar that happens to be full.",
      countable: "Countable · one tick per part",
      complete: "Complete",
      continuous: "Continuous · no discrete units",
      partsOf: "3 of 5 parts",
      uploading: "Uploading sketch",
    },
    pulse: {
      title: "Activity pulse",
      note: "Three states, told apart by shape rather than colour: a breathing dot when the agent is attached and idle, a lattice with a trace running its perimeter while a tool executes, and a hollow ring when nothing is connected. The lattice reads as breadboard holes and the trace as the agent walking the circuit — eight dots sharing one animation on staggered delays, so they resolve into a single moving signal.",
      asChip: "As a capsule, for the agent panel header",
    },
    tests: {
      title: "Test rows",
      note: "The three stages of the functional test. Run the failing variant to see the state the servo error produces in Batch 5.",
      runPassing: "Run passing test",
      runFailing: "Run with servo error",
      servoOff: "90° off",
      ledsOk: "R/G ok",
    },
    tooltip: {
      title: "Tooltip",
      note: "Opens on hover after 350ms and instantly on keyboard focus; Escape closes it. Nothing is explained only here.",
      fitView: "Zoom the canvas to fit the whole build",
      confidence:
        "Confidence is how sure the demo vision result is — it is not a hardware measurement.",
    },
    marks: {
      title: "Marks",
      note: "The logo is a signal path that turns a corner and lands on a pad. The agent mark is a context node with three links — not a face, not a sparkle.",
      states: "idle · running",
    },
  },

  buttonsLab: {
    page: {
      overline: "Open decisions",
      title: "Design decisions",
      introBefore:
        "Eight directions, all plump, all oval-cornered, all filled — built in real code with the real typeface, real shadows and working hover, press and focus states. Hover them. Press them. Tab through them. Direction",
      introAfter:
        "was chosen and is now the product's only button. The rest are kept here as the record of what was rejected.",
    },

    /* Rendered in the code pill beside each section title. */
    verdict: { settled: "Settled", open: "Open" },

    sections: {
      progress: {
        title: "Build progress",
        description:
          "Chosen and shipping. Progress here is not a percentage — it is seven named steps, one of which can be blocked by a finding, so the fraction is the headline and the ticks let you count what is left. Drive the state below; the agent drives it the same way.",
      },
      checkbox: {
        title: "Kit checklist control",
        description:
          "This is not a consent box or a settings toggle — it is an inventory mark on a list the user runs down once before starting. Nothing is blocked by leaving one unticked, so it should feel like counting stock rather than agreeing to terms. Five readings, all interactive.",
      },
      surround: {
        title: "Surrounding layer",
        description:
          "A filled pad sitting around the capsule, offset a few pixels from the fill on every side — so the button reads as an object resting on something rather than a shape painted on the page.",
      },
      depth: {
        title: "Depth layer",
        description:
          "Five readings of a layer sitting slightly below the capsule's edge. Every one presses: the ledge collapses and the button sinks by the same distance, so the travel is mechanical rather than decorative.",
      },
      contrast: {
        title: "White-on-fill contrast",
        description:
          "The chosen capsule ships with white labels on saturated fills, and both fills currently sit below the WCAG AA floor for 13px text. Three ways to fix it, rendered side by side.",
      },
      directions: {
        title: "The eight directions",
        description:
          "Kept as the record of what was compared and what was rejected.",
      },
    },

    progress: {
      drive: {
        title: "Drive the state",
        note: "Advance the build the way the agent does when verify_current_step passes, and inject a finding the way inspect_build does. Both changes animate.",
        previous: "Previous step",
        clearFinding: "Clear finding",
        injectFinding: "Inject finding",
        blocked: "blocked",
        jumpedTo: (step: string) => `jumped to ${step}`,
      },
      collapsed: {
        title: "Collapsed",
        note: "The default. Click it — the full step list opens beneath, and picking a step jumps the build there. Escape or an outside click closes it.",
      },
      compact: {
        title: "Compact, in the workbench topbar",
        note: "At 64px the card cannot fit, so the same control collapses to one line: a small fraction, the ticks, and an amber dot when a step is blocked. It opens the same list.",
      },
    },

    checkbox: {
      cb1: {
        name: "Round, filled",
        note: "The square becomes a circle so it matches the capsules everywhere else, and the tick scales in rather than appearing. Closest to today, just in the product's own shape language.",
      },
      cb2: {
        name: "Round, outline",
        note: "The same circle, but ticking it draws a blue ring and a blue tick instead of flooding the box. A checked list stays quiet, which suits a list where most items end up ticked.",
      },
      cb3: {
        name: "Inventory row",
        note: "The whole row is the control. Unticked reads as a slot to fill (dashed outline, plus sign, “Add”); ticked turns green and says “Have it”. Largest target, and the only one that looks like stock-taking rather than consent.",
      },
      cb4: {
        name: "Soft square, raised",
        note: "Keeps the square but rounds it to 7px and puts it on the same plate as the buttons — ticked, it becomes a small blue button. Consistent with the controls, but heavier down a long list.",
      },
      cb5: {
        name: "Capsule action",
        note: "No box at all. Each part carries a small capsule that says what it is for: “Add” before, “Have it” after. Reads as an action rather than a checkbox, and the label states the meaning outright.",
      },
    },

    surround: {
      f1: {
        name: "Neutral pad",
        note: "One pale grey pad behind every role, 6px on all sides. The layer is a surface the controls sit on, not a property of each button — so a row of four reads as one assembly.",
      },
      f2: {
        name: "Colour-matched pad",
        note: "Each pad is a pale version of its own button's fill. Colour extends past the capsule, which makes the primary action noticeably louder than everything beside it.",
      },
      f3: {
        name: "Raised white plate",
        note: "A white pad with its own soft shadow, so the plate floats and the button sits on the plate. Two levels of elevation instead of one.",
      },
      f4: {
        name: "Weighted pad",
        note: "Asymmetric: 5px above and to the sides, 9px below. The pad reads as sitting under the button rather than merely around it — the closest to the sketch.",
      },
      f5: {
        name: "Weighted pad and ledge",
        note: "The asymmetric pad plus the darker ledge under the fill. Three stacked parts: fill, ledge, pad. The most physical of the five, and the heaviest.",
      },
      onWhite: {
        title: "On white",
        note: "Half the product's buttons sit on white cards, not on the app background. A pad that reads well on grey can disappear — or turn into a smudge — on white.",
      },
      density: {
        title: "Density check",
        note: "The pad costs real space on every side. This is F4 at the workbench's actual toolbar gap — judge whether four controls still breathe.",
      },
    },

    depth: {
      today: {
        title: "Today",
        note: "The shipped capsule: a tinted shadow and a 1px sink on press. No ledge.",
      },
      l1: {
        name: "Solid ledge",
        note: "A hard sliver of a deeper tone directly under the fill, inset by 1px so it reads as a shelf rather than a border. The most literal reading, and the one that survives at small sizes.",
      },
      l2: {
        name: "Inner lip",
        note: "The layer lives inside the capsule: a dark band along the bottom edge of the fill itself. Nothing extends past the silhouette, so the shape stays exactly as approved.",
      },
      l3: {
        name: "Offset plate",
        note: "A second full capsule sitting 4px lower and slightly narrower, dimmed. Reads as two stacked physical parts — the most visible layer of the five.",
      },
      l4: {
        name: "Hairline shelf",
        note: "A one-pixel darker outline all the way round, thickening into a 2px shelf underneath. Quiet, precise, closest to how instrument software draws a raised key.",
      },
      l5: {
        name: "Soft shelf",
        note: "The ledge is a translucent black rather than a second colour, so it works on any fill without a matching tone. Two pixels, low opacity, plus a wide soft shadow further out.",
      },
      pressHint: "Press and hold a button to see the layer collapse.",
    },

    contrast: {
      problem: {
        title: "The problem",
        whiteOnBefore: "White on",
        whiteOnAfter: "=",
        floor:
          "13px text needs 4.5:1. Both fills fall short, which is why the labels read as washed out rather than white.",
      },
      keeps: "Keeps",
      costs: "Costs",
      o1: {
        name: "Separate fill tone",
        blurb:
          "Keep #1677FF for links, focus rings, target rings and every thin element. Add one deeper tone used only where white text sits on top of it.",
        keeps:
          "The brand blue stays exactly as it is everywhere it already reads well.",
        costs: "Two blues in the token set — fill tone and accent tone.",
      },
      o2: {
        name: "One darker blue",
        blurb:
          "Move the whole accent down a step. One blue, used everywhere, comfortably above AA on both fills.",
        keeps: "One accent token. Nothing to remember, nothing to mix up.",
        costs: "Slightly less electric than the blue in the brief.",
      },
      o3: {
        name: "Ink primary, blue accent",
        blurb:
          "The primary fill becomes near-black; blue moves to the icon and to everything the agent points at. Highest contrast by a wide margin.",
        keeps:
          "Unmissable hierarchy, and blue is freed up to mean 'the agent is pointing here'.",
        costs: "The main action is no longer blue — a real brand shift.",
      },
    },

    directions: {
      shortlist: "Shortlist",
      shortlisted: "Shortlisted",
      shortlistedPrefix: "Shortlisted:",
      a: {
        name: "Full capsule",
        note: "CHOSEN. Fully round ends, 44px tall, every role filled. Now shipping as the product's Button in src/components/ui/button.tsx.",
      },
      b: {
        name: "Soft oval",
        note: "16px corners instead of a full pill. Reads a little more like software, a little less like a tag.",
      },
      c: {
        name: "Navy command",
        note: "Deep navy primary with a blue icon. The strongest hierarchy in the set — you cannot miss the main action.",
      },
      d: {
        name: "Semantic tint",
        note: "One saturated primary; the rest are soft washes of the colour that carries their meaning. Blue = suggested, red = irreversible.",
      },
      e: {
        name: "Ink primary",
        note: "Vercel-style near-black primary. Very current, but the brand blue drops to a supporting role.",
      },
      f: {
        name: "Grounded edge",
        note: "Each fill sits on a darker sliver of itself. Gives real weight without a bevel — and the press animation actually lands.",
      },
      g: {
        name: "Indigo weight",
        note: "Stripe-adjacent. Slightly deeper indigo, 12px corners, restrained shadow. The most 'financial software' of the set.",
      },
      h: {
        name: "Warm capsule",
        note: "Warmer off-white surfaces and a calmer blue. Editorial rather than technical — softer on the eye over a 35-minute build.",
      },
    },
  },
};

type Section = typeof en;

const tr: Section = {
  page: {
    overline: "Batch 1",
    title: "Atomlar",
    intro:
      "Yirmi iki parça, hepsi Batch 0 token'larından kurulu ve hepsi etkileşimli — tıkla, sekmeyle gez, yaz. Bunlar ürünün gerçek bileşenleri; sonraki batch'lerdeki ekranlar tam olarak bu sayfadakini içe aktarıyor.",
    navLabel: "Bu sayfadaki bölümler",
    anchors: {
      buttons: "Butonlar",
      badges: "Rozetler, çipler, değerler",
      controls: "Alanlar ve kontroller",
      feedback: "Geri bildirim ve işaretler",
    },
  },

  sections: {
    buttons: {
      title: "Butonlar",
      description:
        "Beş niyet, üç yükseklik, bir de her araç çubuğu ve kanvas kontrolünün üstüne kurulduğu yalnızca ikonlu varyant.",
    },
    badges: {
      title: "Rozetler, çipler ve teknik değerler",
      description:
        "Durum, önem, etiketler, filtreler, mono okumalar, meta veri satırları, ayraçlar ve bağlantılar.",
    },
    controls: {
      title: "Alanlar ve kontroller",
      description:
        "Metin, arama, seçim, onay kutusu, radyo, segment kontrolü ve anahtar — ürünün bütün giriş yüzeyi.",
    },
    feedback: {
      title: "Geri bildirim ve işaretler",
      description:
        "İlerleme, ajanın etkinlik nabzı, işlevsel test satırları, ipucu balonları ve iki marka işareti.",
    },
  },

  kit: {
    board: {
      label: "UNO uyumlu kart",
      detail: "5V mantıkla çalışan herhangi bir Arduino uyumlu kart.",
    },
    sensor: { label: "Ultrasonik mesafe sensörü" },
    servo: { label: "Mikro servo" },
    resistors: {
      label: "220Ω dirençler",
      detail: "Belirsiz: gruptaki bazıları işaretli.",
    },
    arm: { label: "Karton bariyer kolu", detail: "Devre dışı örnek." },
  },

  buttons: {
    variants: {
      title: "Varyantlar",
      note: "Her rol dolu bir kapsül — hiyerarşi biçimden değil, dolgunun ağırlığından geliyor. Ekranın her bölgesinde tek bir doygun birincil; geri dönülebilir alternatif için beyaz ikincil; onaylama için gri üçüncül; geri alınamaz olan için kırmızı; kapatma için saydam sessiz.",
    },
    sizes: {
      title: "Boyutlar ve durumlar",
      note: "Yükseklikler 40 / 44 / 48px, yani her boyut asgari dokunma hedefini aşıyor. Orta ürünün varsayılanı; küçük, sıkışık araç çubuğu satırları için.",
      small: "Küçük · 40",
      medium: "Orta · 44",
      inspecting: "İnceleniyor",
      disabled: "Devre dışı",
      loadingHint: (label: string) =>
        `Yükleme durumunu görmek için “${label}” butonuna tıkla.`,
    },
    plate: {
      title: "Plaka, iki zeminde",
      note: "Her buton, kendi yumuşak gölgesi olan 6px'lik beyaz bir plakanın üstünde duruyor. Uygulama zemininde plaka soluk bir hale olarak görünür; beyaz kartta kaybolur ve kontrolü yüzeyden yalnızca gölgesi ayırır. Plaka yerleşimle değil boyayla yapıldığı için buton gruplarının arasında en az 16px boşluk gerekiyor.",
      onApp: "Uygulama zemini — plaka görünür",
      onCard: "Beyaz kart — yalnızca gölge kalır",
    },
    icons: {
      title: "İkon butonları",
      note: "Her birinin bir aria-label'ı var, o da aynı zamanda ipucu balonu oluyor. Bunlar Batch 3'ün kanvas kontrolleri; araç çubuğunun gerçek parçaları olsun diye erken kuruldu.",
      focusFinding: "Bulguya odaklan",
      remove: "Sil",
    },
  },

  badges: {
    status: {
      title: "Durum rozetleri",
      note: "Renkli bir glifi olan, yükseltilmiş beyaz kapsül. Renk ikonda durur, böylece etiket tam kontrastını korur ve yedi rozetlik bir satır tek bir sistem gibi okunur. Sağdaki üçü atölye oturumu boyunca açık kalır — ürünün, buradaki hiçbir şeyin gerçek donanım taklidi yapmadığına dair sözü.",
    },
    severity: {
      title: "Önem",
      note: "Her zaman ikon artı kelime. Bulgu kartı renkli kabloların yanında durur, yani öneminin okunması bir renk lekesine bırakılamaz.",
      blocksTest: "Testi engelliyor",
    },
    chips: {
      title: "Çipler",
      note: "Proje kartlarında sabit etiket, kütüphane araç çubuğunda açılıp kapanır, uygulandıktan sonra kaldırılabilir. Dene — gerçek duruma bağlılar.",
      staticHeading: "Sabit etiketler",
      toggleHeading: "Açılır kapanır filtreler",
      appliedHeading: "Uygulanan filtreler",
      empty: "Uygulanan filtre yok.",
      tags: {
        pins: "Dijital pinler",
        pwm: "PWM ve servo kontrolü",
        distance: "Mesafe ölçümü",
        polarity: "LED kutupları",
      },
      filters: {
        beginner: "Başlangıç",
        intermediate: "Orta",
        under40: "40 dakikanın altı",
        readyNow: "Şimdi hazır",
      },
      applied: { sensor: "Ultrasonik sensör", servo: "Servo" },
    },
    values: {
      title: "Teknik değerler ve meta veri",
      note: "Mono değerler bir cümlenin içinde kalın yazıya ya da renge gerek kalmadan seçilir. Meta veri satırı ayraçlarını kendi koyar, böylece her kart aynı biçimde noktalanır.",
      connectedBefore: "Echo",
      connectedAfter: "'ya bağlı.",
      expectsBefore: "Bu yapım",
      expectsAfter: " bekliyor.",
      powerBefore: "Güç",
      powerMiddle: "'ta kalıyor ve son okuma",
      powerAfter: " oldu.",
      meta: { duration: "35 dk", level: "Başlangıç", steps: "7 adım" },
      confidence: "%94 güven",
      linkBefore: "Pin eşlemesi için",
      wiringReference: "kablolama referansına",
      linkAfter: " bak, ya da",
      openLab: "tasarım lab'ını aç",
    },
  },

  controls: {
    fields: {
      title: "Alanlar",
      note: "Seçim gerçek bir listbox, yerel olan değil — işletim sisteminin menüsü biçimlendirilemez ve arayüzün ortasına ödünç alınmış gibi düşerdi. Aç ve ok tuşlarını, Home/End'i, Escape'i kullan, ya da bir seçeneğin ilk harflerini yaz.",
      buildNote: {
        label: "Yapım notu",
        placeholder: "Değiştirdiğin bir şey",
        hint: "Yalnızca bu yapımla kaydedilir.",
      },
      expectedPin: {
        label: "Beklenen pin",
        error: "Bu yapım programda D7 tanımlıyor.",
      },
      difficulty: {
        any: "Her düzey",
        beginner: "Başlangıç",
        beginnerHint: "4 proje",
        intermediate: "Orta",
        intermediateHint: "3 proje",
      },
      duration: {
        any: "Her süre",
        under30: "30 dakikanın altı",
        under45: "45 dakikanın altı",
        under60: "60 dakikanın altı",
      },
    },
    segmented: {
      title: "Segment kontrolleri",
      note: "Soldaki kanvas görünüm anahtarı; sağdaki yardım düzeyi — varsayılanı ipucu, böylece ürün sorulmadan cevabı eline tutuşturmuyor.",
      canvasView: "Kanvas görünümü",
      selected: "Seçili:",
    },
    choices: {
      title: "Onay kutuları ve anahtarlar",
      note: "Liste yapımı hiçbir zaman engellemiyor — işaretlenmemiş bir kit yalnızca atölyenin rehberli demo modunda çalışacağı anlamına gelir. İşaretsiz olan doldurulacak bir boşluk gibi okunur; işaretli olan elinde ne olduğunu söyler. Neyin eksik olduğunu görmek için sütuna bir göz atmak yeter.",
      pinLabels: "Pin etiketleri",
      technicalGrid: "Teknik ızgara",
      referenceOverlay: "Referans katmanı",
    },
    quiz: {
      title: "Bilgi kontrolü",
      note: "Radyo seçeneği, bir düzeltmenin ardından gelen soru için kuruldu. Cevaplanmış bir durumu var, çünkü mesele düzeltmeyi tıklayıp geçmek değil, anlamak.",
      question:
        "Echo kablosu neden programda tanımlı pinle aynı olmak zorunda?",
      answers: {
        pin: "Program belirli bir giriş pinini okuyor.",
        voltage: "Kartın voltajını değiştiriyor.",
        range: "Sensörün menzilini artırıyor.",
      },
      check: "Cevabı kontrol et",
      retry: "Tekrar dene",
    },
  },

  feedback: {
    progress: {
      title: "Yapım ilerlemesi",
      note: "Buradaki ilerleme bir yüzde değil, adı olan yedi adım — yani başlık kesir, tikler de kalanı saymanı sağlıyor. Tam listeyi açmak için tıkla; bir adım seç, yapım oraya atlasın. İkisini de ajan sürüyor: verify_current_step kesri ilerletir, inspect_build bir tiki ambere çevirir.",
      compact: "Kompakt · atölye üst çubuğu",
    },
    percentage: {
      title: "Yüzdeli ilerleme",
      note: "Sayılabilen şey sayılır: beş parça beş tik olarak çizilir, yani sayıyı çubuğun uzunluğundan tahmin etmek yerine kontrolün üstünden okursun. Yalnızca gerçekten sürekli olan iş dolu şeridi korur. Tamamlanma tonu değiştirir ve etiketi işaretler — bitiş, dolu kalmış bir çubuk değil, bir durum değişikliği.",
      countable: "Sayılabilir · parça başına bir tik",
      complete: "Tamamlandı",
      continuous: "Sürekli · ayrık birim yok",
      partsOf: "5 parçadan 3'ü",
      uploading: "Program yükleniyor",
    },
    pulse: {
      title: "Etkinlik nabzı",
      note: "Üç durum, renkle değil biçimle ayrılıyor: ajan bağlıyken ve boştayken nefes alan bir nokta, bir araç çalışırken çevresinde iz dolaşan bir kafes, hiçbir şey bağlı değilken içi boş bir halka. Kafes breadboard delikleri, iz de ajanın devrede yürüyüşü gibi okunur — sekiz nokta tek bir animasyonu kaydırılmış gecikmelerle paylaşıyor, böylece hareket eden tek bir sinyale dönüşüyorlar.",
      asChip: "Kapsül olarak, ajan paneli başlığı için",
    },
    tests: {
      title: "Test satırları",
      note: "İşlevsel testin üç aşaması. Servo hatasının Batch 5'te ürettiği durumu görmek için başarısız varyantı çalıştır.",
      runPassing: "Geçen testi çalıştır",
      runFailing: "Servo hatasıyla çalıştır",
      servoOff: "90° sapma",
      ledsOk: "R/G tamam",
    },
    tooltip: {
      title: "İpucu balonu",
      note: "Üzerine gelince 350ms sonra, klavye odağında ise anında açılır; Escape kapatır. Hiçbir şey yalnızca burada açıklanmaz.",
      fitView: "Kanvası bütün yapım sığacak kadar ölçekle",
      confidence:
        "Güven, demo görüntü sonucunun ne kadar emin olduğudur — bir donanım ölçümü değildir.",
    },
    marks: {
      title: "İşaretler",
      note: "Logo, bir köşeyi dönüp bir pede inen sinyal yolu. Ajan işareti üç bağı olan bir bağlam düğümü — bir yüz değil, bir parıltı değil.",
      states: "boşta · çalışıyor",
    },
  },

  buttonsLab: {
    page: {
      overline: "Açık kararlar",
      title: "Tasarım kararları",
      introBefore:
        "Sekiz yön, hepsi tombul, hepsi oval köşeli, hepsi dolu — gerçek yazı tipi, gerçek gölgeler ve çalışan üzerine gelme, basma ve odak durumlarıyla gerçek kodda kuruldu. Üzerlerine gel. Bas. Sekmeyle gez. Seçilen yön",
      introAfter:
        "oldu ve artık ürünün tek butonu. Geri kalanlar neyin elendiğinin kaydı olarak burada duruyor.",
    },

    verdict: { settled: "Karar verildi", open: "Açık" },

    sections: {
      progress: {
        title: "Yapım ilerlemesi",
        description:
          "Seçildi ve kullanımda. Buradaki ilerleme bir yüzde değil — adı olan yedi adım, biri bir bulguyla engellenebilir, yani başlık kesir, tikler de kalanı saymanı sağlıyor. Durumu aşağıdan sür; ajan da aynı şekilde sürüyor.",
      },
      checkbox: {
        title: "Kit listesi kontrolü",
        description:
          "Bu bir rıza kutusu ya da ayar anahtarı değil — kullanıcının başlamadan önce bir kez baştan aşağı geçtiği bir listedeki sayım işareti. Birini işaretlemeden bırakmak hiçbir şeyi engellemiyor, yani şartları kabul etmek gibi değil, stok saymak gibi hissettirmeli. Beş okuma, hepsi etkileşimli.",
      },
      surround: {
        title: "Çevreleyen katman",
        description:
          "Kapsülün çevresinde duran, dolgudan her yönde birkaç piksel taşan dolu bir ped — böylece buton, sayfaya boyanmış bir biçim değil, bir şeyin üstünde duran bir nesne gibi okunuyor.",
      },
      depth: {
        title: "Derinlik katmanı",
        description:
          "Kapsülün kenarının biraz altında duran bir katmanın beş okuması. Hepsi basılıyor: çıkıntı çöküyor ve buton aynı mesafe kadar iniyor, yani hareket dekoratif değil mekanik.",
      },
      contrast: {
        title: "Dolgu üstünde beyaz kontrastı",
        description:
          "Seçilen kapsül doygun dolguların üstünde beyaz etiketlerle geliyor ve iki dolgu da şu an 13px metin için WCAG AA eşiğinin altında. Bunu düzeltmenin üç yolu, yan yana çizildi.",
      },
      directions: {
        title: "Sekiz yön",
        description:
          "Neyin karşılaştırıldığının ve neyin elendiğinin kaydı olarak duruyor.",
      },
    },

    progress: {
      drive: {
        title: "Durumu sür",
        note: "Yapımı, verify_current_step geçtiğinde ajanın ilerlettiği gibi ilerlet; bulguyu da inspect_build'in eklediği gibi ekle. İki değişiklik de animasyonlu.",
        previous: "Önceki adım",
        clearFinding: "Bulguyu temizle",
        injectFinding: "Bulgu ekle",
        blocked: "engellendi",
        jumpedTo: (step: string) => `${step} adımına atlandı`,
      },
      collapsed: {
        title: "Kapalı",
        note: "Varsayılan. Tıkla — tam adım listesi altında açılır, bir adım seçmek yapımı oraya atlatır. Escape ya da dışarıya tıklamak kapatır.",
      },
      compact: {
        title: "Kompakt, atölye üst çubuğunda",
        note: "64px'te kart sığmıyor, bu yüzden aynı kontrol tek satıra iniyor: küçük bir kesir, tikler ve bir adım engellendiğinde amber bir nokta. Aynı listeyi açıyor.",
      },
    },

    checkbox: {
      cb1: {
        name: "Yuvarlak, dolu",
        note: "Kare, her yerdeki kapsüllerle eşleşsin diye daireye dönüşüyor ve tik belirmek yerine büyüyerek geliyor. Bugüne en yakını, yalnızca ürünün kendi biçim dilinde.",
      },
      cb2: {
        name: "Yuvarlak, çerçeveli",
        note: "Aynı daire, ama işaretlemek kutuyu doldurmak yerine mavi bir halka ve mavi bir tik çiziyor. İşaretlenmiş liste sessiz kalıyor, bu da çoğu maddesi sonunda işaretlenen bir listeye uygun.",
      },
      cb3: {
        name: "Sayım satırı",
        note: "Kontrolün kendisi bütün satır. İşaretsiz olan doldurulacak bir boşluk gibi okunuyor (kesikli çerçeve, artı işareti, “Ekle”); işaretli olan yeşile dönüyor ve “Var” diyor. En büyük hedef, ve rıza değil stok sayımı gibi görünen tek seçenek.",
      },
      cb4: {
        name: "Yumuşak kare, yükseltilmiş",
        note: "Kareyi koruyor ama köşesini 7px'e yuvarlıyor ve butonlarla aynı plakanın üstüne koyuyor — işaretlendiğinde küçük mavi bir butona dönüşüyor. Kontrollerle tutarlı, ama uzun bir listede daha ağır.",
      },
      cb5: {
        name: "Kapsül eylemi",
        note: "Kutu hiç yok. Her parça ne işe yaradığını söyleyen küçük bir kapsül taşıyor: öncesinde “Ekle”, sonrasında “Var”. Onay kutusu değil eylem gibi okunuyor ve etiket anlamı doğrudan söylüyor.",
      },
    },

    surround: {
      f1: {
        name: "Nötr ped",
        note: "Her rolün arkasında tek bir soluk gri ped, her yönde 6px. Katman, her butonun bir özelliği değil, kontrollerin üstünde durduğu bir yüzey — böylece dörtlü bir satır tek bir bütün gibi okunuyor.",
      },
      f2: {
        name: "Renk eşlenmiş ped",
        note: "Her ped kendi butonunun dolgusunun soluk hâli. Renk kapsülün dışına taşıyor, bu da birincil eylemi yanındaki her şeyden belirgin biçimde yüksek sesli yapıyor.",
      },
      f3: {
        name: "Yükseltilmiş beyaz plaka",
        note: "Kendi yumuşak gölgesi olan beyaz bir ped, böylece plaka havada duruyor ve buton plakanın üstünde oturuyor. Tek yerine iki kademe yükseklik.",
      },
      f4: {
        name: "Ağırlıklı ped",
        note: "Asimetrik: üstte ve yanlarda 5px, altta 9px. Ped butonun yalnızca çevresinde değil, altında duruyormuş gibi okunuyor — eskize en yakın olanı.",
      },
      f5: {
        name: "Ağırlıklı ped ve çıkıntı",
        note: "Asimetrik ped artı dolgunun altındaki koyu çıkıntı. Üst üste üç parça: dolgu, çıkıntı, ped. Beşin en fizikseli, ve en ağırı.",
      },
      onWhite: {
        title: "Beyaz üstünde",
        note: "Ürünün butonlarının yarısı uygulama zemininde değil, beyaz kartların üstünde duruyor. Gride iyi okunan bir ped beyazda kaybolabilir — ya da bir lekeye dönüşebilir.",
      },
      density: {
        title: "Yoğunluk kontrolü",
        note: "Ped her yönde gerçek yer harcıyor. Bu, F4'ün atölyenin gerçek araç çubuğu boşluğundaki hâli — dört kontrol hâlâ nefes alıyor mu, karar ver.",
      },
    },

    depth: {
      today: {
        title: "Bugün",
        note: "Kullanımdaki kapsül: renkli bir gölge ve basınca 1px'lik bir iniş. Çıkıntı yok.",
      },
      l1: {
        name: "Masif çıkıntı",
        note: "Dolgunun hemen altında koyu bir tonun sert bir dilimi, 1px içeri çekilmiş, böylece kenarlık değil raf gibi okunuyor. En düz okuma, ve küçük boyutlarda ayakta kalan tek okuma.",
      },
      l2: {
        name: "İç dudak",
        note: "Katman kapsülün içinde yaşıyor: dolgunun kendi alt kenarı boyunca koyu bir şerit. Siluetin dışına hiçbir şey taşmıyor, yani biçim onaylandığı gibi kalıyor.",
      },
      l3: {
        name: "Kaydırılmış plaka",
        note: "4px daha aşağıda ve biraz daha dar duran, karartılmış ikinci bir tam kapsül. Üst üste konmuş iki fiziksel parça gibi okunuyor — beşin en görünür katmanı.",
      },
      l4: {
        name: "İnce çizgi rafı",
        note: "Çepeçevre bir piksellik koyu bir çerçeve, altta 2px'lik bir rafa kalınlaşıyor. Sessiz, kesin, enstrüman yazılımlarının yükseltilmiş bir tuşu çizme biçimine en yakını.",
      },
      l5: {
        name: "Yumuşak raf",
        note: "Çıkıntı ikinci bir renk değil, yarı saydam siyah, yani eşleşen bir ton olmadan her dolguda çalışıyor. İki piksel, düşük opaklık, bir de daha dışarıda geniş ve yumuşak bir gölge.",
      },
      pressHint: "Katmanın çöküşünü görmek için bir butona basılı tut.",
    },

    contrast: {
      problem: {
        title: "Sorun",
        whiteOnBefore: "Beyaz metin",
        whiteOnAfter: "üzerinde =",
        floor:
          "13px metin 4.5:1 istiyor. İki dolgu da altında kalıyor, etiketlerin beyaz değil solgun görünmesinin sebebi bu.",
      },
      keeps: "Korur",
      costs: "Bedeli",
      o1: {
        name: "Ayrı dolgu tonu",
        blurb:
          "#1677FF bağlantılarda, odak halkalarında, hedef halkalarında ve bütün ince öğelerde kalsın. Yalnızca üstünde beyaz metin duran yerlerde kullanılan tek bir koyu ton eklensin.",
        keeps:
          "Marka mavisi, zaten iyi okunduğu her yerde olduğu gibi tam olarak kalıyor.",
        costs: "Token setinde iki mavi — dolgu tonu ve vurgu tonu.",
      },
      o2: {
        name: "Tek koyu mavi",
        blurb:
          "Bütün vurguyu bir kademe aşağı al. Tek mavi, her yerde kullanılıyor, iki dolguda da AA'nın rahatça üstünde.",
        keeps:
          "Tek vurgu token'ı. Akılda tutulacak, karıştırılacak bir şey yok.",
        costs: "Brifingdeki maviden bir tık daha az elektrikli.",
      },
      o3: {
        name: "Mürekkep birincil, mavi vurgu",
        blurb:
          "Birincil dolgu neredeyse siyaha dönüyor; mavi ikona ve ajanın işaret ettiği her şeye geçiyor. Farkla en yüksek kontrast.",
        keeps:
          "Kaçırılamayacak bir hiyerarşi, ve mavi 'ajan burayı gösteriyor' anlamına gelmek üzere serbest kalıyor.",
        costs: "Ana eylem artık mavi değil — gerçek bir marka kayması.",
      },
    },

    directions: {
      shortlist: "Kısa listeye al",
      shortlisted: "Kısa listede",
      shortlistedPrefix: "Kısa liste:",
      a: {
        name: "Tam kapsül",
        note: "SEÇİLDİ. Tamamen yuvarlak uçlar, 44px yükseklik, her rol dolu. Artık ürünün Button'ı olarak src/components/ui/button.tsx içinde kullanımda.",
      },
      b: {
        name: "Yumuşak oval",
        note: "Tam hap yerine 16px köşeler. Biraz daha yazılım, biraz daha az etiket gibi okunuyor.",
      },
      c: {
        name: "Lacivert komuta",
        note: "Mavi ikonlu koyu lacivert birincil. Setteki en güçlü hiyerarşi — ana eylemi kaçırmak mümkün değil.",
      },
      d: {
        name: "Anlamsal ton",
        note: "Tek doygun birincil; geri kalanlar anlamlarını taşıyan rengin yumuşak yıkamaları. Mavi = önerilen, kırmızı = geri alınamaz.",
      },
      e: {
        name: "Mürekkep birincil",
        note: "Vercel tarzı neredeyse siyah birincil. Çok güncel, ama marka mavisi yardımcı role düşüyor.",
      },
      f: {
        name: "Yere basan kenar",
        note: "Her dolgu kendinin daha koyu bir diliminin üstünde duruyor. Eğim olmadan gerçek ağırlık veriyor — ve basma animasyonu gerçekten oturuyor.",
      },
      g: {
        name: "Çivit ağırlık",
        note: "Stripe'a yakın. Biraz daha koyu çivit, 12px köşeler, ölçülü gölge. Setin en 'finans yazılımı' olanı.",
      },
      h: {
        name: "Sıcak kapsül",
        note: "Daha sıcak kırık beyaz yüzeyler ve daha sakin bir mavi. Teknik değil editoryal — 35 dakikalık bir yapımda göze daha yumuşak geliyor.",
      },
    },
  },
};

export const atoms = { en, tr };
