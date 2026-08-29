/**
 * Batch 2 · Molecules and Batch 3 · Circuit canvas, plus the lab index.
 *
 * Design rationale rather than product copy: every note argues why a material
 * looks the way it does, and it is read by one person. The Turkish carries the
 * same argument in the same number of clauses — a note that reasons in English
 * and merely describes in Turkish has lost the thing worth translating.
 *
 * Specimen content that already exists in the product dictionary is not
 * repeated here. The step names, the finding sentences and the hardware values
 * are read from `copy.build`, `copy.findings` and friends at the call site, so
 * a gallery card and the workbench can never say the same thing differently.
 */

const en = {
  page: {
    eyebrow: "Batch 2",
    title: "Molecules",
    intro:
      "Seventeen composites made only from Batch 1 atoms. This is where the workbench starts to be recognisable: the step rail, the agent panel, the canvas toolbar and the inspection modal are all assembled here before they meet real data.",
    sectionsLabel: "Sections on this page",
  },

  /** Anchor pill, section heading, section blurb. The pill is shorter on
      purpose: it is a target, not a sentence. */
  sections: {
    containers: {
      pill: "Cards, panels, rows",
      title: "Cards, panels and rows",
      description:
        "The card shell, the scrolling panel with its pinned action, the shared list row, and the key-value row the device dock is built from.",
    },
    navigation: {
      pill: "Tabs, toolbars, headers",
      title: "Tabs, toolbars and headers",
      description:
        "How the product moves between views: underlined tabs with counts, one toolbar rhythm, and the 64px control bar.",
    },
    overlays: {
      pill: "Overlays and status",
      title: "Overlays and status",
      description:
        "Modal, drawer, popovers, menus, disclosure, alerts, toasts, empty states, live region and skeleton — everything that appears on top of, or instead of, the page.",
    },
  },

  containers: {
    cards: {
      title: "Cards",
      note: "Tone is a hairline, not a wash. A finding card sits beside coloured wires and dense copy, so flooding it with amber would cost contrast on both — the severity pill and the affected-node chips carry the meaning instead.",
    },
    panel: {
      title: "Panel",
      note: "Sticky header, one scrolling body, pinned footer — the panel's primary action never scrolls away. The rows are the same shape as the kit checklist, so every list in a build reads as one family, and the agent panel header carries the live activity indicator.",
    },
    project: {
      duration: "35 min",
      steps: "7 steps",
      body: "A gate that opens when a car approaches and closes once it has passed. You will wire an ultrasonic sensor, drive a servo and read two status LEDs.",
      continueBuild: "Continue build",
      viewProject: "View project",
    },
    hasFinding: "Has an open finding",
    skeletonNote: "Skeleton shown while a simulated tool call runs.",
  },

  navigation: {
    tabs: {
      title: "Tabs",
      note: "Underlined rather than capsule: these switch a view, they do not perform an action. Counts live inside the tab so a new finding is visible from another tab. Arrow keys move between them.",
    },
    toolbars: {
      title: "Toolbars",
      note: "One rhythm for the library filter bar and the canvas controls. Everything inside is a capsule; the toolbar itself is a 14px surface.",
    },
    header: {
      title: "Back header and breadcrumb",
      note: "The workbench control bar is built on the back header — 64px tall, one way back, the build-progress control beside the title, status badges pushed right. Click the progress control to open the full step list.",
    },

    agentWorkspace: "Agent workspace",
    deviceDock: "Device dock",
    panels: {
      findings: "One open finding on this step.",
      activity: "Five tool calls recorded this session.",
    },

    difficulty: {
      filter: "Difficulty filter",
      beginner: "Beginner",
      intermediate: "Intermediate",
    },
    projectCount: (n: number) => `${n} projects`,

    canvasView: "Canvas view",
    layers: {
      pins: "Pin labels",
      wires: "Wire labels",
      grid: "Technical grid",
    },

    workbench: "Workbench",

    demo: {
      jumpTo: "Jump to",
      wiringIssue: "Wiring issue",
      servoIssue: "Servo issue",
      fullSystemTest: "Full-system test",
      inject: "Inject",
      wrongEcho: "Wrong Echo connection",
      servoOrientation: "Servo orientation error",
      resetAll: "Reset complete demo",
    },
  },

  overlays: {
    modal: {
      title: "Modal and drawer",
      note: "Both trap focus, close on Escape, and return focus to whatever opened them. The modal's wide size is the inspection layout; the drawer is what the agent panel becomes under 1280px.",
    },
    openModal: "Open inspection modal",
    openDrawer: "Open agent drawer",
    modalDescription:
      "Nothing here comes from a real camera. The frame below is an illustration of the build state held in the demo store.",
    close: "Close",
    illustrationPending: "Circuit illustration arrives in Batch 3",
    referenceBuild: "Reference build",

    alerts: {
      title: "Alerts",
      note: "No card, no border, no fill. The message sits on the page and all the colour lives in one filled disc — when the agent tells you something it should read as a sentence in the interface, not as a notification bolted onto it. Stacked alerts are separated by a hairline rather than by four competing containers.",
    },
    correctionMarked:
      "The mismatched wire and its target pin are marked on the workbench.",
    barrierFailed: "Barrier direction failed",
    barrierFailedDetail:
      "The gate closed when the sketch sent the open position.",

    toasts: {
      title: "Toasts and live region",
      note: "Every toast also lands in the activity timeline, so a missed one costs nothing. Screen readers hear the same sentence through the live region.",
    },
    pushCorrection: "Push correction toast",
    pushVerified: "Push verified toast",
    pushFailure: "Push failure toast",
    announced: "Announced to assistive tech:",

    disclosure: {
      title: "Disclosure",
      note: "The teaching contract in one component: the explanation is always available, never forced, and raw JSON stays shut until asked for.",
    },
    /* The panel's own longer form: `findings.explain` plus the consequence.
       One sentence, so the mono values can be marked at render. */
    explainFull:
      "The Echo pin sends the return pulse timing back to the board. The sketch reads that signal from D7, so a wire on D6 leaves the reading empty.",
    toolLabel: "Tool",
    scopeLabel: "Scope",

    empty: {
      title: "Empty states",
      note: "The default mark is a lattice with its centre missing — the product's own way of saying “nothing here yet” instead of a borrowed outline icon. A specific icon is only passed when it adds meaning, as in the search case.",
    },
    activityEmpty:
      "Tool calls appear here as soon as the agent reads or changes the build.",
  },

  canvas: {
    page: {
      eyebrow: "Batch 3",
      title: "Circuit canvas",
      intro:
        "The product's own drawing of the build — no photograph, no screenshot. Every part is an SVG component at its real proportion, and every hole and pin has an address the agent can name. The canvas and the agent read the same graph, so there is never a second version of the truth.",
    },
    section: {
      title: "The build, live",
      description:
        "Viewport, grid, board, breadboard, sensor, servo, LEDs, resistors, wires, and the correction overlays. Pan, zoom, and drive the two demo faults.",
    },
    build: {
      title: "The build",
      note: "Drag to pan, scroll to zoom, or use the controls. Every part is drawn at its real proportion — a breadboard hole is exactly 0.1 inch — because the user compares this with what is on their desk.",
    },
    viewLabel: "Canvas view",
    circuitLabel: (project: string) => `${project} circuit`,
    instruction: {
      title: "The instruction",
      note: "Above the canvas, on the page rather than in a box — the product's editorial register.",
    },
    drive: {
      title: "Drive it",
      note: "The same state changes the WebMCP tools will make in Batch 7: show_correction focuses the canvas and marks both pins, verify_current_step compares the observed graph against the expected one.",
    },
    hideAngle: "Hide expected angle",
  },

  index: {
    eyebrow: (name: string) => `${name} design lab`,
    title: "Design materials",
    intro:
      "Every material is designed and approved here before it reaches a product screen. The specimens are the real React components — the lab is a gallery over the shipping code, not a mockup of it.",
    /* Split around the two counts so each renders in tabular figures, and so a
       locale that needs the other order can have it. */
    totalsMid: " materials across ",
    totalsTail: " batches · reviewed in order",
  },
};

type Section = typeof en;

const tr: Section = {
  page: {
    eyebrow: "Batch 2",
    title: "Moleküller",
    intro:
      "Yalnızca Batch 1 atomlarından kurulmuş on yedi bileşik. Atölyenin tanınmaya başladığı yer burası: adım rayı, ajan paneli, kanvas araç çubuğu ve inceleme modalı gerçek veriyle buluşmadan önce burada birleşiyor.",
    sectionsLabel: "Bu sayfadaki bölümler",
  },

  sections: {
    containers: {
      pill: "Kartlar, paneller, satırlar",
      title: "Kartlar, paneller ve satırlar",
      description:
        "Kart kabuğu, sabitlenmiş eylemiyle kayan panel, ortak liste satırı ve cihaz dock'unu kuran anahtar-değer satırı.",
    },
    navigation: {
      pill: "Sekmeler, araç çubukları, başlıklar",
      title: "Sekmeler, araç çubukları ve başlıklar",
      description:
        "Ürünün görünümler arasında nasıl geçtiği: sayaçlı altı çizili sekmeler, tek bir araç çubuğu ritmi ve 64px kontrol çubuğu.",
    },
    overlays: {
      pill: "Katmanlar ve durum",
      title: "Katmanlar ve durum",
      description:
        "Modal, çekmece, popover, menüler, açılır açıklama, uyarılar, bildirimler, boş durumlar, canlı bölge ve iskelet — sayfanın üstünde ya da yerine görünen her şey.",
    },
  },

  containers: {
    cards: {
      title: "Kartlar",
      note: "Ton ince bir çizgidir, renk dolgusu değil. Bulgu kartı renkli kabloların ve yoğun metnin yanında durur; onu kehribara boğmak ikisinden de kontrast götürür — anlamı bunun yerine önem rozeti ve etkilenen düğüm çipleri taşır.",
    },
    panel: {
      title: "Panel",
      note: "Yapışkan başlık, tek bir kayan gövde, sabitlenmiş alt bant — panelin birincil eylemi asla kayıp gitmez. Satırlar kit listesiyle aynı biçimde, böylece bir yapımdaki her liste tek bir aile gibi okunur; ajan paneli başlığı da canlı etkinlik göstergesini taşır.",
    },
    project: {
      duration: "35 dk",
      steps: "7 adım",
      body: "Bir araba yaklaşınca açılan, geçtikten sonra kapanan bir bariyer. Bir ultrasonik sensör kablolayacak, bir servo sürecek ve iki durum LED'i okuyacaksın.",
      continueBuild: "Yapıma devam et",
      viewProject: "Projeyi gör",
    },
    hasFinding: "Açık bulgusu var",
    skeletonNote: "Simüle bir araç çağrısı çalışırken iskelet gösteriliyor.",
  },

  navigation: {
    tabs: {
      title: "Sekmeler",
      note: "Kapsül değil, altı çizili: bunlar bir görünümü değiştirir, bir eylem yapmaz. Sayaçlar sekmenin içinde durur, böylece yeni bir bulgu başka bir sekmeden de görünür. Aralarında ok tuşlarıyla gezilir.",
    },
    toolbars: {
      title: "Araç çubukları",
      note: "Kütüphane filtre çubuğu ile kanvas kontrolleri için tek bir ritim. İçindeki her şey bir kapsül; araç çubuğunun kendisi 14px'lik bir yüzey.",
    },
    header: {
      title: "Geri başlığı ve kırıntı yolu",
      note: "Atölye kontrol çubuğu geri başlığının üzerine kurulu — 64px yüksekliğinde, geriye tek yol, yapım ilerlemesi kontrolü başlığın yanında, durum rozetleri sağa itilmiş. Tam adım listesini açmak için ilerleme kontrolüne tıkla.",
    },

    agentWorkspace: "Ajan çalışma alanı",
    deviceDock: "Cihaz dock'u",
    panels: {
      findings: "Bu adımda bir açık bulgu var.",
      activity: "Bu oturumda beş araç çağrısı kaydedildi.",
    },

    difficulty: {
      filter: "Zorluk filtresi",
      beginner: "Başlangıç",
      intermediate: "Orta",
    },
    projectCount: (n: number) => `${n} proje`,

    canvasView: "Kanvas görünümü",
    layers: {
      pins: "Pin etiketleri",
      wires: "Kablo etiketleri",
      grid: "Teknik ızgara",
    },

    workbench: "Atölye",

    demo: {
      jumpTo: "Şuraya atla",
      wiringIssue: "Kablolama sorunu",
      servoIssue: "Servo sorunu",
      fullSystemTest: "Tam sistem testi",
      inject: "Enjekte et",
      wrongEcho: "Yanlış Echo bağlantısı",
      servoOrientation: "Servo yönü hatası",
      resetAll: "Demonun tamamını sıfırla",
    },
  },

  overlays: {
    modal: {
      title: "Modal ve çekmece",
      note: "İkisi de odağı hapseder, Escape ile kapanır ve odağı kendilerini açan şeye geri verir. Modalın geniş boyu inceleme düzeni; çekmece ise ajan panelinin 1280px altında dönüştüğü şey.",
    },
    openModal: "İnceleme modalını aç",
    openDrawer: "Ajan çekmecesini aç",
    modalDescription:
      "Buradaki hiçbir şey gerçek bir kameradan gelmiyor. Aşağıdaki kare, demo deposunda tutulan yapım durumunun bir çizimi.",
    close: "Kapat",
    illustrationPending: "Devre çizimi Batch 3'te geliyor",
    referenceBuild: "Referans yapım",

    alerts: {
      title: "Uyarılar",
      note: "Kart yok, kenarlık yok, dolgu yok. Mesaj sayfanın üstünde durur ve bütün renk tek bir dolu diskte yaşar — ajan sana bir şey söylediğinde bu, arayüze cıvatalanmış bir bildirim gibi değil, arayüzün içindeki bir cümle gibi okunmalı. Üst üste gelen uyarıları dört yarışan kapsayıcı değil, ince bir çizgi ayırır.",
    },
    correctionMarked: "Uyuşmayan kablo ve hedef pini atölyede işaretlendi.",
    barrierFailed: "Bariyer yönü başarısız",
    barrierFailedDetail: "Program açık konumunu gönderdiğinde bariyer kapandı.",

    toasts: {
      title: "Bildirimler ve canlı bölge",
      note: "Her bildirim etkinlik çizelgesine de düşer, yani kaçırılan birinin bedeli yok. Ekran okuyucular aynı cümleyi canlı bölgeden duyar.",
    },
    pushCorrection: "Düzeltme bildirimi gönder",
    pushVerified: "Doğrulama bildirimi gönder",
    pushFailure: "Hata bildirimi gönder",
    announced: "Yardımcı teknolojiye duyurulan:",

    disclosure: {
      title: "Açılır açıklama",
      note: "Öğretme sözleşmesi tek bir bileşende: açıklama her zaman ulaşılabilir, asla dayatılmaz, ham JSON da istenene kadar kapalı kalır.",
    },
    explainFull:
      "Echo pini yansıyan darbenin süresini karta geri gönderir. Program bu sinyali D7'den okuyor, bu yüzden D6'daki bir kablo okumayı boş bırakır.",
    toolLabel: "Araç",
    scopeLabel: "Kapsam",

    empty: {
      title: "Boş durumlar",
      note: "Varsayılan işaret, ortası eksik bir kafes — ödünç alınmış bir çizgi ikonu yerine ürünün “burada henüz bir şey yok” deme biçimi. Belirli bir ikon yalnızca anlam kattığında veriliyor, aramada olduğu gibi.",
    },
    activityEmpty:
      "Ajan yapımı okuduğu ya da değiştirdiği anda araç çağrıları burada belirir.",
  },

  canvas: {
    page: {
      eyebrow: "Batch 3",
      title: "Devre kanvası",
      intro:
        "Ürünün yapıma dair kendi çizimi — fotoğraf yok, ekran görüntüsü yok. Her parça gerçek oranında bir SVG bileşeni ve her deliğin, her pinin ajanın adını söyleyebileceği bir adresi var. Kanvas ve ajan aynı grafiği okuyor, yani gerçeğin ikinci bir sürümü hiç olmuyor.",
    },
    section: {
      title: "Yapım, canlı",
      description:
        "Görüntü alanı, ızgara, kart, breadboard, sensör, servo, LED'ler, dirençler, kablolar ve düzeltme katmanları. Kaydır, yakınlaştır ve iki demo arızasını çalıştır.",
    },
    build: {
      title: "Yapım",
      note: "Kaydırmak için sürükle, yakınlaştırmak için tekerleği çevir ya da kontrolleri kullan. Her parça gerçek oranında çizildi — bir breadboard deliği tam 0.1 inç — çünkü kullanıcı bunu masasındakiyle karşılaştırıyor.",
    },
    viewLabel: "Kanvas görünümü",
    circuitLabel: (project: string) => `${project} devresi`,
    instruction: {
      title: "Yönerge",
      note: "Kanvasın üstünde, bir kutunun içinde değil sayfanın üzerinde — ürünün editoryal tonu.",
    },
    drive: {
      title: "Çalıştır",
      note: "Batch 7'de WebMCP araçlarının yapacağı durum değişikliklerinin aynısı: show_correction kanvası odaklar ve iki pini de işaretler, verify_current_step gözlenen grafiği beklenenle karşılaştırır.",
    },
    hideAngle: "Beklenen açıyı gizle",
  },

  index: {
    eyebrow: (name: string) => `${name} tasarım lab'ı`,
    title: "Tasarım materyalleri",
    intro:
      "Her materyal bir ürün ekranına ulaşmadan önce burada tasarlanıp onaylanıyor. Numuneler gerçek React bileşenleri — laboratuvar, yayına giden kodun üzerindeki bir galeri, onun bir maketi değil.",
    totalsMid: " materyal, ",
    totalsTail: " batch'e bölünmüş · sırayla inceleniyor",
  },
};

export const molecules = { en, tr };
