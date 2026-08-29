/**
 * Batch 0 · Foundations — lab prose.
 *
 * The design lab argues its own decisions, so these are not labels: most of
 * them are a sentence explaining why a value is what it is. They live apart
 * from the product dictionary because nobody using the product ever reads
 * them, and mixing review notes into `en.ts` would make the shipped namespace
 * look twice its real size.
 *
 * `en` is deliberately not `as const` — literal types would oblige the Turkish
 * file to repeat the English strings verbatim. `tr` is annotated with `Section`
 * so a missing or misspelled key is a compile error rather than a gap on the
 * page.
 *
 * Nothing the hardware or the stylesheet says is translated: `D7`, `5V`,
 * `#1677ff`, `text-body-sm`, `cp-trace`, `outline-color`, `prefers-reduced-
 * motion` and every Lucide icon name stay exactly as they are on the board or
 * in the source.
 */

const en = {
  page: {
    overline: "Batch 0",
    title: "Foundations",
    intro:
      "Ten decisions that constrain everything after them. Colour, wire semantics, type, rhythm, surface craft, motion, icons, focus and the copy layer. Every later batch composes from these and adds no new raw values.",
    sectionsNav: "Sections on this page",
  },

  colour: {
    title: "Colour and surfaces",
    description:
      "A near-neutral interface so the circuit can be the only colourful thing on screen. Contrast is stated for every ink against the worst-case background.",
    /* Shown instead of a WCAG grade for a colour that is never allowed to
       carry a word. */
    nonText: "non-text",

    surfaces: {
      title: "Surfaces",
      note: "Three depths only. Sunken carries the canvas and the device dock; raised is surface plus elevation, never a different colour.",
      app: "Page background behind every panel",
      surface: "Cards, panels, topbar",
      surfaceSunken: "Circuit canvas, dock, inset wells",
      surfaceHover: "Row and ghost-button hover",
      surfaceActive: "Pressed state on quiet controls",
      surfaceInverse: "Tooltips, mono overlays on the canvas",
    },

    ink: {
      title: "Ink",
      note: "Measured against app background #F5F7F8 — the worst case in the product. Every ink that carries a word clears WCAG AA at 12px; ink-disabled is deliberately below it and is never allowed to hold text.",
      ink: "Headings and primary body text",
      inkSecondary: "Supporting copy, descriptions",
      inkTertiary: "Metadata, evidence lines, timestamps",
      inkDisabled: "Non-text only: disabled glyphs, empty-state art",
    },

    lines: {
      title: "Lines",
      border: "Hairline on cards, panels, inputs",
      borderStrong: "Dividers that must survive a busy canvas",
      grid: "Technical dot grid behind the circuit",
    },

    accent: {
      title: "Primary accent",
      note: "Electric blue is the agent's colour: actions it offers, tools it registers, targets it points at.",
      accent: "Primary buttons, active state",
      accentHover: "Hover",
      accentActive: "Pressed",
      accentSoft: "Selected row, active tab wash",
      accentBorder: "Inner layer on active surfaces",
    },

    teal: {
      title: "Secondary accent",
      note: "Teal always means expected — the correct pin, the reference view, the position the servo should reach.",
      teal: "Target rings, expected routes",
      tealHover: "Hover",
      tealSoft: "Expected-state background",
      tealBorder: "Expected-state edge",
    },

    status: {
      title: "Status",
      note: "Each status is always paired with an icon and a word. Colour never carries the meaning alone.",
      success: "Step verified, test passed",
      warning: "Recoverable finding",
      error: "Failed test, blocking mismatch",
      successSoft: "Passed row background",
      warningSoft: "Finding card background",
      errorSoft: "Failed row background",
    },

    stack: {
      title: "Surface stack in context",
      note: "The whole product is built from these four layers. Anything that looks like a fifth layer is elevation, not a new colour.",
      canvasWell: "canvas well",
      floatingPanel: "a floating panel over the canvas",
    },
  },

  wire: {
    title: "Semantic wire palette",
    description:
      "Seven wire roles, each with a colour, an icon and a word. A cable is solid and plugged in at both ends; a dash means nothing is physically there. This is the only palette allowed to be saturated.",

    roles: {
      title: "Roles",
      note: "A cable is always solid, however badly it is connected — a dash means there is nothing physically there. So a mismatch is never told by the stroke: the wire keeps its colour while every other one drains to grey, and the callout and pin marks say the rest.",
      caption: "Semantic wire roles",
    },

    desaturated: {
      title: "Desaturated check",
      note: "The same specimens with all colour removed. Cables stay separable from annotations — solid with a plug on each end against a bare dashed line — and power stays separable from ground by weight. Which cable is wrong is not a stroke property and never was: it is carried by the callout, the two pin marks, and the grey every other wire falls to.",
    },

    columns: {
      sample: "Sample",
      label: "Label",
      meaning: "Meaning",
      stroke: "Stroke",
      token: "Token",
    },

    /* How the stroke column describes the specimen next to it. */
    strokeSolid: "solid + rim",
    strokeDash: "dash",
  },

  typography: {
    title: "Typography",
    description:
      "Geist for the interface, IBM Plex Mono for anything the hardware reports or the sketch defines.",

    sans: {
      title: "Geist — interface",
      note: "Headings stop at 30px. This is a working tool: a headline that fills the viewport would push the actual product below the fold.",
    },

    mono: {
      title: "IBM Plex Mono — technical values",
      note: "Anything the board reports or the sketch defines renders in mono with tabular figures, so a changing distance readout never shifts its neighbours.",
    },

    /* The specimen sentence is split around the `D7` chip, because the pin
       does not sit in the same place in every language. */
    mixed: {
      title: "Mixed in context",
      note: "The pairing exists so a pin reference is recognisable mid-sentence without bold, colour or quotes.",
      instructionBefore: "Connect the sensor's Echo pin to digital pin ",
      instructionAfter:
        ". Echo measures how long the reflected pulse takes to return.",
    },

    usage: {
      display: "Completion screen headline. Used once per screen at most.",
      h1: "Dashboard and project detail headings.",
      h2: "Section headings, modal titles, project card titles.",
      h3: "Panel headers, finding titles, step names.",
      bodyLg: "Lead paragraph under a heading. Never inside dense panels.",
      body: "Default. Instructions, explanations, card copy.",
      bodySm: "Dense panels: step rail, findings list, activity timeline.",
      caption: "Metadata under a title. Evidence lines, timestamps.",
      overline: "Group labels above lists. Sparingly.",
      monoLg: "Live telemetry readout in the device dock.",
      mono: "Serial monitor lines, tool names, pin references.",
      monoSm: "Inline technical values inside body copy: D7, 5V, 94%.",
    },
  },

  layout: {
    title: "Layout rhythm",
    description:
      "A 4px scale for everything inside a panel, and fixed frames for the workbench's four zones.",

    scale: {
      title: "4px scale",
      note: "Everything in the product snaps to this scale. Values above 48px only appear as page-level separation, never inside a panel.",
      px2: "Icon optical nudges only",
      px4: "Icon-to-label gap in dense chips",
      px6: "Icon-to-label gap in buttons",
      px8: "Inside chips, badges, tight rows",
      px10: "List row padding",
      px12: "Card padding (dense), panel row gap",
      px16: "Card padding (default), panel padding",
      px20: "Card padding (roomy), section gap",
      px24: "Between cards in a grid",
      px32: "Between sections on a page",
      px48: "Between major page regions",
    },

    frames: {
      title: "Fixed frames",
      note: "The workbench is a four-zone instrument panel, so its regions are fixed rather than fluid. Only the canvas absorbs the remaining width.",
      topbar: "Workbench control bar height",
      rail: "Left step panel width",
      agent: "Right agent workspace",
      dock: "Device dock, collapsed",
      dockOpen: "Device dock, expanded",
      shell: "Max content width off-workbench",
    },

    workbench: {
      title: "Workbench frame at 1440×900",
      note: "Scaled proxy of Batch 7's four-zone layout, drawn from the same tokens. The canvas keeps 764px at 1440 and 604px at 1280 — enough for the board, breadboard and servo without scrolling.",
      topbar: "Top control bar",
      rail: "Step rail",
      canvas: "Circuit canvas",
      canvasWidth: "fluid",
      agent: "Agent workspace",
      dock: "Device dock",
    },

    breakpoints: {
      title: "Breakpoints",
      width: "Width",
      behaviour: "Behaviour",
      target: "Target layout. All four zones visible, dock expandable.",
      absorb:
        "Same structure, canvas absorbs the difference. No horizontal scroll.",
      drawer: "Agent workspace becomes a drawer over the canvas.",
      stacked:
        "Stacked flow: instruction, canvas, steps, findings. Small-screen notice shown, nothing hidden.",
    },
  },

  surface: {
    title: "Radius and elevation",
    description:
      "Restrained corners, three shadow levels, and inner layers instead of colour swaps for active states.",

    radius: {
      title: "Radius",
      note: "Surfaces sit at 10–14px. Interactive controls — buttons, badges, chips, segments — are full capsules, so shape alone separates “something to press” from “something to read”.",
      xs: "Inline code, focus ring",
      sm: "Badges, chips, pills",
      md: "List rows, small wells",
      lg: "Cards, findings, stages",
      xl: "Fields, panels, dock, modals",
      xl2: "Full-bleed feature block",
      full: "Every button, badge, chip and segment",
    },

    elevation: {
      title: "Elevation",
      note: "Three levels, all cool-grey and low-opacity. No glow, no coloured shadow except under the primary button.",
      e1: "Resting cards. Barely there — the border does the work.",
      e2: "Hovered cards, floating canvas controls.",
      e3: "Popovers, dropdowns, modals. The only real lift in the product.",
    },

    layers: {
      title: "Inner layers",
      note: "Active states add a second layer inside the surface instead of changing its colour wholesale. This keeps a selected row readable when it sits next to a coloured wire.",
      restingRow: "Resting row",
      restingCaption: "Default",
      activeRow: "Active row",
      activeCaption: "Selected step, active tab",
      sunkenWell: "Sunken well",
      sunkenCaption: "Canvas, serial monitor",
    },

    raised: {
      title: "Raised primary",
      note: "The primary action lifts off the surface with a tinted shadow rather than a gradient — the one place the product allows a coloured shadow. Buttons are capsules (direction A).",
      staticNote: "Static specimens — the live capsule buttons are in Batch 1.",
    },
  },

  motion: {
    title: "Motion",
    description:
      "Motion confirms that something happened. Four durations, three curves, five named behaviours, and a full collapse under reduced motion.",

    preference: {
      title: "Preference",
      note: "Every animated component reads this. When reduced motion is on, states still change — they just change immediately.",
      reducedDetail:
        "Animation is collapsed globally. Specimens below hold their end state.",
      fullDetail: "Full motion vocabulary active.",
    },

    durations: {
      title: "Durations",
      note: "150–350ms. Nothing in the product animates longer than the time it takes to read the label that changed.",
      replay: "Replay",
      instant: "Hover, focus, colour change",
      quick: "Tooltip, chip, finding card enter",
      settle: "Tab switch, step content swap, dock",
      deliberate: "Canvas highlight, servo preview, guidance arrow",
    },

    easing: {
      title: "Easing",
      outSoft: "Default. Anything entering or settling.",
      inOutSoft: "Symmetric moves: pan, dock open and close.",
      overshoot:
        "Success confirmation only. One small bounce, never decorative.",
    },

    vocabulary: {
      title: "Motion vocabulary",
      note: "Five behaviours, defined once as keyframes. Components compose them; they never invent new ones.",
      pulseRing:
        "Agent is connected and listening. The only infinite loop allowed.",
      trace: "Light travelling along the wire the agent is talking about.",
      attention: "Error ring around a wrong pin. Fades, never flashes.",
      sweep: "A test stage is running with no known duration.",
    },
  },

  icons: {
    title: "Icon system",
    description:
      "Lucide at 1.75 stroke weight, four sizes, and a small working vocabulary.",

    stroke: {
      title: "Stroke weight",
      note: "Lucide ships at stroke-width 2. Against Geist at 13–14px that reads heavy and slightly toy-like, so the product standardises on 1.75.",
      heavy: "heavy",
      standard: "product standard",
      faint: "too faint at 14px",
    },

    sizes: {
      title: "Sizes",
      note: "Icons sit on the text baseline with a 6px gap and never shrink below 14px. Icon-only controls always carry an aria-label.",
      sample: "Distance",
      xs: "Inline with caption and mono-sm",
      sm: "Buttons, list rows, tabs — default",
      md: "Panel headers, toolbar actions",
      lg: "Empty states, feature blocks",
    },

    set: {
      title: "Working set",
      note: "A deliberately small vocabulary. New icons get added only when an existing one would mislead.",
      navigation: "Navigation & shell",
      status: "Status",
      canvas: "Canvas",
      build: "Build domain",
    },
  },

  focus: {
    title: "Focus",
    description:
      "One visible ring on every interactive element, and hit areas that stay reachable in dense panels.",

    ring: {
      title: "One ring",
      note: "Press Tab through this row. Every interactive element in the product uses the same 2px accent ring at 2px offset — no per-component variation, no ring suppressed for aesthetics.",
      primary: "Primary",
      secondary: "Secondary",
      tertiary: "Tertiary",
    },

    coloured: {
      title: "On coloured ground",
      note: "The ring keeps a white inner halo when it lands on an accent or status surface, so it never disappears into its own background.",
      button: "Focus me on blue",
      caption:
        "outline-color switches to white; width and offset stay identical.",
    },

    hit: {
      title: "Hit area",
      note: "Minimum 40px for dense panel controls, 44px for anything primary. Small glyphs get padding, not a smaller target.",
      markComplete: "Mark step complete",
      tall: "44 tall",
    },
  },

  content: {
    title: "Content layer",
    description:
      "Brand and copy live in data, not in components — the working name can change without touching a screen.",

    brand: {
      title: "Brand record",
      note: "Rename the product by editing one object. Nothing downstream hardcodes the name.",
    },

    namespaces: {
      title: "Copy namespaces",
      note: "Screens import one namespace each. Strings that appear in more than one place — status labels, agent actions — live in a shared group so they can never drift.",
    },

    voice: {
      title: "Voice",
      note: "Short, factual, second person. The product states what it observed and what it expects; it never congratulates the user for existing, and never claims a capability it does not have.",
      good: "Good",
      avoid: "Avoid",
      goodExample: "“Echo is connected to D6. This build expects D7.”",
      /* Kept exclamatory on purpose — it is the specimen of the voice the
         product does not use. */
      avoidExample: "“Oops! Something went wrong with your wiring! 😅”",
      simulatedNote:
        "The interface always says when it is showing simulated data.",
    },
  },
};

type Section = typeof en;

const tr: Section = {
  page: {
    overline: "Batch 0",
    title: "Temeller",
    intro:
      "Kendinden sonraki her şeyi kısıtlayan on karar. Renk, kablo semantiği, tipografi, ritim, yüzey işçiliği, hareket, ikonlar, odak ve metin katmanı. Sonraki her batch bunlardan bileşir, yeni bir ham değer eklemez.",
    sectionsNav: "Bu sayfadaki bölümler",
  },

  colour: {
    title: "Renk ve yüzeyler",
    description:
      "Neredeyse nötr bir arayüz — ekrandaki tek renkli şey devre olsun diye. Her mürekkebin kontrastı, en kötü durumdaki arka plana karşı yazılı.",
    nonText: "metin dışı",

    surfaces: {
      title: "Yüzeyler",
      note: "Yalnızca üç derinlik. Sunken kanvası ve cihaz dokunu taşır; raised, yüzey artı yükseklik demektir — asla farklı bir renk değil.",
      app: "Her panelin arkasındaki sayfa zemini",
      surface: "Kartlar, paneller, üst çubuk",
      surfaceSunken: "Devre kanvası, dok, gömme kuyular",
      surfaceHover: "Satır ve hayalet buton hover'ı",
      surfaceActive: "Sessiz kontrollerde basılı durum",
      surfaceInverse: "İpuçları, kanvasın üstündeki mono katmanlar",
    },

    ink: {
      title: "Mürekkep",
      note: "Uygulama zemini #F5F7F8'e karşı ölçüldü — üründeki en kötü durum. Kelime taşıyan her mürekkep 12px'te WCAG AA'yı geçiyor; ink-disabled bilerek onun altında ve metin tutmasına asla izin verilmiyor.",
      ink: "Başlıklar ve birincil gövde metni",
      inkSecondary: "Destekleyici metin, açıklamalar",
      inkTertiary: "Üst veri, kanıt satırları, zaman damgaları",
      inkDisabled: "Yalnızca metin dışı: pasif glifler, boş durum görselleri",
    },

    lines: {
      title: "Çizgiler",
      border: "Kartlarda, panellerde, alanlarda saç teli çizgi",
      borderStrong: "Kalabalık bir kanvasta ayakta kalması gereken ayraçlar",
      grid: "Devrenin arkasındaki teknik nokta ızgarası",
    },

    accent: {
      title: "Birincil vurgu",
      note: "Elektrik mavisi ajanın rengi: önerdiği eylemler, kaydettiği araçlar, işaret ettiği hedefler.",
      accent: "Birincil butonlar, aktif durum",
      accentHover: "Üzerine gelme",
      accentActive: "Basılı",
      accentSoft: "Seçili satır, aktif sekme zemini",
      accentBorder: "Aktif yüzeylerde iç katman",
    },

    teal: {
      title: "İkincil vurgu",
      note: "Teal her zaman beklenen demek — doğru pin, referans görünümü, servonun ulaşması gereken konum.",
      teal: "Hedef halkaları, beklenen güzergâhlar",
      tealHover: "Üzerine gelme",
      tealSoft: "Beklenen durum zemini",
      tealBorder: "Beklenen durum kenarı",
    },

    status: {
      title: "Durum",
      note: "Her durum her zaman bir ikon ve bir kelimeyle birlikte gelir. Anlamı asla tek başına renk taşımaz.",
      success: "Adım doğrulandı, test geçti",
      warning: "Düzeltilebilir bulgu",
      error: "Başarısız test, engelleyen uyuşmazlık",
      successSoft: "Geçen satırın zemini",
      warningSoft: "Bulgu kartının zemini",
      errorSoft: "Başarısız satırın zemini",
    },

    stack: {
      title: "Bağlam içinde yüzey yığını",
      note: "Ürünün tamamı bu dört katmandan kuruluyor. Beşinci bir katman gibi görünen her şey yükseklik, yeni bir renk değil.",
      canvasWell: "kanvas kuyusu",
      floatingPanel: "kanvasın üstünde yüzen bir panel",
    },
  },

  wire: {
    title: "Anlamsal kablo paleti",
    description:
      "Yedi kablo rolü; her birinde bir renk, bir ikon ve bir kelime. Kablo düz çizilir ve iki ucundan da takılıdır; kesik çizgi orada fiziksel olarak hiçbir şey olmadığı anlamına gelir. Doygun olmasına izin verilen tek palet bu.",

    roles: {
      title: "Roller",
      note: "Kablo ne kadar kötü bağlanmış olursa olsun her zaman düz çizilir — kesik çizgi orada fiziksel olarak hiçbir şey olmadığı demektir. Bu yüzden uyuşmazlığı asla çizgi anlatmaz: kablo rengini korur, diğerlerinin hepsi griye çekilir, gerisini de açıklama baloncuğu ile pin işaretleri söyler.",
      caption: "Anlamsal kablo rolleri",
    },

    desaturated: {
      title: "Renksiz kontrol",
      note: "Aynı örnekler, bütün renk çıkarılmış hâlde. Kablolar ek açıklamalardan ayrılabilir kalıyor — iki ucunda da fiş olan düz çizgiye karşı çıplak bir kesik çizgi — ve güç, kalınlıkla topraktan ayrılmaya devam ediyor. Hangi kablonun yanlış olduğu bir çizgi özelliği değil, hiç olmadı: bunu açıklama baloncuğu, iki pin işareti ve diğer bütün kabloların düştüğü gri taşıyor.",
    },

    columns: {
      sample: "Örnek",
      label: "Etiket",
      meaning: "Anlam",
      stroke: "Çizgi",
      token: "Token",
    },

    strokeSolid: "düz + kenar",
    strokeDash: "kesik",
  },

  typography: {
    title: "Tipografi",
    description:
      "Arayüz için Geist, donanımın bildirdiği ya da programın tanımladığı her şey için IBM Plex Mono.",

    sans: {
      title: "Geist — arayüz",
      note: "Başlıklar 30px'te duruyor. Bu bir çalışma aracı: ekranı dolduran bir başlık, asıl ürünü görünür alanın dışına iter.",
    },

    mono: {
      title: "IBM Plex Mono — teknik değerler",
      note: "Kartın bildirdiği ya da programın tanımladığı her şey, tablo rakamlarıyla mono çizilir; böylece değişen bir mesafe okuması komşularını asla kaydırmaz.",
    },

    mixed: {
      title: "Bağlam içinde karışık",
      note: "Bu eşleşme var, çünkü bir pin referansı cümlenin ortasında kalın, renk ya da tırnak olmadan tanınabilmeli.",
      instructionBefore: "Sensörün Echo pinini ",
      instructionAfter:
        " dijital pinine bağla. Echo, yansıyan darbenin dönüş süresini ölçer.",
    },

    usage: {
      display: "Tamamlama ekranı başlığı. Ekran başına en fazla bir kez.",
      h1: "Panel ve proje detayı başlıkları.",
      h2: "Bölüm başlıkları, modal başlıkları, proje kartı başlıkları.",
      h3: "Panel başlıkları, bulgu başlıkları, adım adları.",
      bodyLg:
        "Başlığın altındaki giriş paragrafı. Yoğun panellerin içinde asla.",
      body: "Varsayılan. Yönergeler, açıklamalar, kart metni.",
      bodySm: "Yoğun paneller: adım rayı, bulgu listesi, etkinlik akışı.",
      caption: "Başlığın altındaki üst veri. Kanıt satırları, zaman damgaları.",
      overline: "Listelerin üstündeki grup etiketleri. İdareli.",
      monoLg: "Cihaz dokundaki canlı telemetri okuması.",
      mono: "Seri monitör satırları, araç adları, pin referansları.",
      monoSm: "Gövde metni içindeki satır içi teknik değerler: D7, 5V, %94.",
    },
  },

  layout: {
    title: "Yerleşim ritmi",
    description:
      "Panel içindeki her şey için 4px'lik bir ölçek, atölyenin dört bölgesi için sabit çerçeveler.",

    scale: {
      title: "4px ölçek",
      note: "Üründeki her şey bu ölçeğe oturur. 48px üstü değerler yalnızca sayfa düzeyinde ayrım olarak görünür, panel içinde asla.",
      px2: "Yalnızca ikonların optik kaydırmaları",
      px4: "Yoğun çiplerde ikon-etiket aralığı",
      px6: "Butonlarda ikon-etiket aralığı",
      px8: "Çiplerin, rozetlerin, sıkışık satırların içi",
      px10: "Liste satırı dolgusu",
      px12: "Kart dolgusu (yoğun), panel satır aralığı",
      px16: "Kart dolgusu (varsayılan), panel dolgusu",
      px20: "Kart dolgusu (ferah), bölüm aralığı",
      px24: "Izgaradaki kartların arası",
      px32: "Sayfadaki bölümlerin arası",
      px48: "Ana sayfa bölgelerinin arası",
    },

    frames: {
      title: "Sabit çerçeveler",
      note: "Atölye dört bölgeli bir gösterge paneli, bu yüzden bölgeleri akışkan değil sabit. Kalan genişliği yalnızca kanvas emer.",
      topbar: "Atölye kontrol çubuğunun yüksekliği",
      rail: "Sol adım panelinin genişliği",
      agent: "Sağdaki ajan çalışma alanı",
      dock: "Cihaz doku, kapalı",
      dockOpen: "Cihaz doku, açık",
      shell: "Atölye dışında maksimum içerik genişliği",
    },

    workbench: {
      title: "1440×900'de atölye çerçevesi",
      note: "Batch 7'nin dört bölgeli yerleşiminin ölçekli temsili, aynı tokenlardan çizildi. Tuval 1440'ta 764px, 1280'de 604px koruyor — kart, breadboard ve servo için kaydırmaya gerek kalmadan yeter.",
      topbar: "Üst kontrol çubuğu",
      rail: "Adım rayı",
      canvas: "Devre kanvası",
      canvasWidth: "akışkan",
      agent: "Ajan çalışma alanı",
      dock: "Cihaz doku",
    },

    breakpoints: {
      title: "Kırılma noktaları",
      width: "Genişlik",
      behaviour: "Davranış",
      target: "Hedef yerleşim. Dört bölge de görünür, dok açılabilir.",
      absorb: "Aynı yapı, farkı kanvas emer. Yatay kaydırma yok.",
      drawer: "Ajan çalışma alanı, kanvasın üstünde bir çekmeceye dönüşür.",
      stacked:
        "Üst üste akış: yönerge, kanvas, adımlar, bulgular. Küçük ekran uyarısı gösterilir, hiçbir şey gizlenmez.",
    },
  },

  surface: {
    title: "Köşe yarıçapı ve yükseklik",
    description:
      "Ölçülü köşeler, üç gölge seviyesi ve aktif durumlarda rengi değiştirmek yerine iç katmanlar.",

    radius: {
      title: "Yarıçap",
      note: "Yüzeyler 10–14px'te oturur. Etkileşimli kontroller — butonlar, rozetler, çipler, segmentler — tam kapsüldür; böylece “basılacak bir şey” ile “okunacak bir şey” yalnızca biçimle ayrılır.",
      xs: "Satır içi kod, odak halkası",
      sm: "Rozetler, çipler, haplar",
      md: "Liste satırları, küçük kuyular",
      lg: "Kartlar, bulgular, sahneler",
      xl: "Alanlar, paneller, dok, modallar",
      xl2: "Taşmalı öne çıkan blok",
      full: "Her buton, rozet, çip ve segment",
    },

    elevation: {
      title: "Yükseklik",
      note: "Üç seviye, hepsi soğuk gri ve düşük opaklıkta. Parlama yok; birincil butonun altı dışında renkli gölge yok.",
      e1: "Duran kartlar. Neredeyse yok — işi kenarlık yapıyor.",
      e2: "Üzerine gelinen kartlar, kanvasta yüzen kontroller.",
      e3: "Açılır kutular, açılır listeler, modallar. Üründeki tek gerçek yükselme.",
    },

    layers: {
      title: "İç katmanlar",
      note: "Aktif durumlar yüzeyin rengini toptan değiştirmek yerine içine ikinci bir katman ekler. Böylece seçili bir satır, renkli bir kablonun yanında dururken okunabilir kalır.",
      restingRow: "Duran satır",
      restingCaption: "Varsayılan",
      activeRow: "Aktif satır",
      activeCaption: "Seçili adım, aktif sekme",
      sunkenWell: "Gömme kuyu",
      sunkenCaption: "Tuval, seri monitör",
    },

    raised: {
      title: "Yükseltilmiş birincil",
      note: "Birincil eylem yüzeyden gradyanla değil, renk tonlu bir gölgeyle kalkar — ürünün renkli gölgeye izin verdiği tek yer. Butonlar kapsüldür (yön A).",
      staticNote: "Statik örnekler — canlı kapsül butonlar Batch 1'de.",
    },
  },

  motion: {
    title: "Hareket",
    description:
      "Hareket, bir şeyin olduğunu doğrular. Dört süre, üç eğri, beş adlandırılmış davranış ve azaltılmış hareket açıkken hepsinin tamamen kapanması.",

    preference: {
      title: "Tercih",
      note: "Animasyonlu her bileşen bunu okur. Azaltılmış hareket açıkken durumlar yine değişir — sadece anında değişir.",
      reducedDetail:
        "Animasyon her yerde kapatıldı. Aşağıdaki örnekler bitiş durumlarında duruyor.",
      fullDetail: "Tam hareket sözlüğü etkin.",
    },

    durations: {
      title: "Süreler",
      note: "150–350ms. Üründe hiçbir şey, değişen etiketi okumak için gereken süreden uzun animasyon yapmaz.",
      replay: "Tekrar oynat",
      instant: "Hover, odak, renk değişimi",
      quick: "İpucu, çip, bulgu kartı girişi",
      settle: "Sekme değişimi, adım içeriği değişimi, dok",
      deliberate: "Tuval vurgusu, servo önizlemesi, rehberlik oku",
    },

    easing: {
      title: "Yumuşatma",
      outSoft: "Varsayılan. Giren ya da yerine oturan her şey.",
      inOutSoft: "Simetrik hareketler: kaydırma, dokun açılıp kapanması.",
      overshoot:
        "Yalnızca başarı onayı. Bir küçük zıplama, asla dekoratif değil.",
    },

    vocabulary: {
      title: "Hareket sözlüğü",
      note: "Beş davranış, keyframe olarak bir kez tanımlandı. Bileşenler bunları birleştirir; asla yenisini uydurmaz.",
      pulseRing: "Ajan bağlı ve dinliyor. İzin verilen tek sonsuz döngü.",
      trace: "Ajanın bahsettiği kablo boyunca ilerleyen ışık.",
      attention:
        "Yanlış pinin çevresindeki hata halkası. Solar, asla yanıp sönmez.",
      sweep: "Süresi bilinmeyen bir test aşaması çalışıyor.",
    },
  },

  icons: {
    title: "İkon sistemi",
    description:
      "1.75 çizgi kalınlığında Lucide, dört boyut ve küçük bir çalışma sözlüğü.",

    stroke: {
      title: "Çizgi kalınlığı",
      note: "Lucide 2 çizgi kalınlığıyla geliyor. 13–14px Geist'in yanında bu ağır ve biraz oyuncaksı duruyor, bu yüzden ürün 1.75'te standartlaştı.",
      heavy: "ağır",
      standard: "ürün standardı",
      faint: "14px'te fazla soluk",
    },

    sizes: {
      title: "Boyutlar",
      note: "İkonlar metin taban çizgisine 6px aralıkla oturur ve asla 14px'in altına inmez. Yalnızca ikondan oluşan kontroller her zaman bir aria-label taşır.",
      sample: "Mesafe",
      xs: "caption ve mono-sm ile satır içi",
      sm: "Butonlar, liste satırları, sekmeler — varsayılan",
      md: "Panel başlıkları, araç çubuğu eylemleri",
      lg: "Boş durumlar, öne çıkan bloklar",
    },

    set: {
      title: "Çalışma kümesi",
      note: "Bilerek küçük tutulmuş bir sözlük. Yeni ikon yalnızca mevcut biri yanıltacaksa eklenir.",
      navigation: "Gezinme ve kabuk",
      status: "Durum",
      canvas: "Tuval",
      build: "Yapım alanı",
    },
  },

  focus: {
    title: "Odak",
    description:
      "Etkileşimli her öğede tek bir görünür halka ve yoğun panellerde ulaşılabilir kalan tıklama alanları.",

    ring: {
      title: "Tek halka",
      note: "Bu satırda Tab'a bas. Üründeki her etkileşimli öğe aynı 2px vurgu halkasını 2px boşlukla kullanır — bileşene göre değişeni yok, estetik için bastırılmışı yok.",
      primary: "Birincil",
      secondary: "İkincil",
      tertiary: "Üçüncül",
    },

    coloured: {
      title: "Renkli zemin üstünde",
      note: "Halka bir vurgu ya da durum yüzeyine düştüğünde beyaz bir iç hâle korur, böylece kendi zeminine hiç karışmaz.",
      button: "Mavi zeminde odaklan",
      caption: "outline-color beyaza döner; kalınlık ve boşluk aynı kalır.",
    },

    hit: {
      title: "Tıklama alanı",
      note: "Yoğun panel kontrolleri için en az 40px, birincil olan her şey için 44px. Küçük glifler dolgu alır, daha küçük bir hedef değil.",
      markComplete: "Adımı tamamlandı olarak işaretle",
      tall: "44 yükseklik",
    },
  },

  content: {
    title: "İçerik katmanı",
    description:
      "Marka ve metin bileşenlerde değil veride yaşıyor — çalışma adı, tek bir ekrana dokunmadan değişebilir.",

    brand: {
      title: "Marka kaydı",
      note: "Ürünü tek bir nesneyi düzenleyerek yeniden adlandır. Aşağıdaki hiçbir yer adı sabit yazmıyor.",
    },

    namespaces: {
      title: "Metin ad alanları",
      note: "Her ekran bir ad alanı içe aktarır. Birden fazla yerde görünen metinler — durum etiketleri, ajan eylemleri — birbirinden ayrı düşmesin diye ortak bir grupta durur.",
    },

    voice: {
      title: "Ses",
      note: "Kısa, olgusal, ikinci tekil şahıs. Ürün ne gözlemlediğini ve ne beklediğini söyler; kullanıcıyı var olduğu için tebrik etmez ve sahip olmadığı bir yeteneği asla iddia etmez.",
      good: "İyi",
      avoid: "Kaçın",
      goodExample: "“Echo D6'ya bağlı. Bu yapım D7 bekliyor.”",
      avoidExample: "“Hay aksi! Kablolamanda bir şeyler ters gitti! 😅”",
      simulatedNote: "Arayüz, simüle veri gösterdiğini her zaman söyler.",
    },
  },
};

export const foundations = { en, tr };
