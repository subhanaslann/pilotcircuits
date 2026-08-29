import { foundations } from "@/content/locales/lab/foundations";
import { atoms } from "@/content/locales/lab/atoms";
import { molecules } from "@/content/locales/lab/molecules";
import { agentLab } from "@/content/locales/lab/agentLab";
import { device as deviceLab } from "@/content/locales/lab/device";
import { library as libraryLab } from "@/content/locales/lab/library";
import { workbench as workbenchLab } from "@/content/locales/lab/workbench";
import { shell } from "@/content/locales/lab/shell";
import { decisions } from "@/content/locales/lab/decisions";
import type { Copy } from "@/content/locales/en";

/**
 * F-10 · Copy layer — Türkçe.
 *
 * `Copy` ile tiplenmiş: eksik ya da yanlış yazılmış bir anahtar ekranda boşluk
 * değil, derleme hatası verir.
 *
 * Çeviri kuralları:
 *
 *   · Donanımın söylediği hiçbir şey çevrilmez. `D7`, `5V`, `18 cm`,
 *     `inspect_build` — bunlar kartın üstünde ne yazıyorsa odur (kural 13).
 *   · Ajan kullanıcıya "sen" der. Ürün bir öğretmen, bir form değil.
 *   · Fiiller yalın: `Doğrula`, `Göster`, `Düzelttim`. Türkçede buton
 *     etiketlerinde emir kipi İngilizcedeki mastardan daha doğal durur.
 *   · Adım adları isim öbeği: `Mesafe sensörünü kabla` değil
 *     `Mesafe sensörünün kablolaması` — listede yan yana dururlar.
 */
export const tr: Copy = {
  /**
   * The design lab's own prose. Not product copy — it is the record of why
   * each material looks the way it does, and it is read by exactly one person.
   * Split per area so several translators never touch one file.
   */
  lab: {
    shell: shell.tr,
    foundations: foundations.tr,
    atoms: atoms.tr,
    molecules: molecules.tr,
    agentLab: agentLab.tr,
    deviceLab: deviceLab.tr,
    libraryLab: libraryLab.tr,
    workbenchLab: workbenchLab.tr,
    decisions: decisions.tr,
  },

  wire: {
    label: {
      power: "5V",
      ground: "GND",
      signal: "Sinyal A",
      signalAlt: "Sinyal B",
      error: "Uyuşmazlık",
      target: "Beklenen",
      idle: "Kablolanmamış",
    },
    meaning: {
      power: "Güç",
      ground: "Toprak",
      signal: "Dijital sinyal",
      signalAlt: "İkinci dijital sinyal",
      error: "Yanlış noktaya bağlı",
      target: "Bu kablonun ait olduğu yer",
      idle: "Henüz bir şey bağlı değil",
    },
    colour: {
      power: "kırmızı",
      ground: "siyah",
      signal: "sarı",
      signalAlt: "mavi",
      error: "kehribar",
      target: "turkuaz",
      idle: "gri",
    },
  },

  brand: {
    tagline: "Kur. Gör. Anla.",
    category: "Ajan rehberliğinde fiziksel bilişim atölyesi",
    description:
      "Gerçek elektronik kur, yanında bir ajanla. Gerçek bir projeyi izle, kablo hatalarından dön, ve her bağlantının neden önemli olduğunu anla.",
  },

  nav: {
    projects: "Projeler",
    myBuilds: "Yapımlarım",
    components: "Parçalar",
    webMcpReady: "WebMCP hazır",
    webMcpUnavailable: "WebMCP yok",
    home: "Ana sayfa",
  },

  dashboard: {
    heading: "Gerçek elektronik kur, yanında bir ajanla.",
    sub: "Gerçek bir projeyi izle, kablo hatalarından dön, ve her bağlantının neden önemli olduğunu anla.",
    primaryCta: "Akıllı bariyere devam et",
    secondaryCta: "Projelere göz at",
    continueTitle: "Yapıma devam et",
    startCta: "Akıllı bariyeri kurmaya başla",
    suggested: "Önerilen projeler",
    howItWorks: "Nasıl çalışır",
    steps: [
      "Gerçek bir yapım seç",
      "Görsel rehberlikle kur",
      "Ajanın incelemesine ve doğrulamasına izin ver",
    ],
  },

  projects: {
    smartParkingBarrier: {
      name: "Akıllı Otopark Bariyeri",
      summary:
        "Yaklaşan arabayı fark eden, geçmesi için kalkan ve arkasından kapanan bir bariyer.",
    },
    plantGuardian: {
      name: "Bitki Bekçisi",
      summary:
        "Saksının ne kadar kuruduğunu izleyen ve bitki su isteyince yanan bir toprak probu.",
    },
    motionNightLight: {
      name: "Hareketli Gece Lambası",
      summary:
        "Biri geçince uyanan, koridor sakinleşince yeniden sönen bir lamba.",
    },
    miniRadar: {
      name: "Mini Radar",
      summary:
        "Servonun üstünde dönen bir mesafe sensörü; odayı tarar ve bulduğunu bildirir.",
    },
    roomClimateStation: {
      name: "Oda İklim İstasyonu",
      summary:
        "Odanın sıcaklığını ve nemini okuyan, saptığında haber veren bir masa aleti.",
    },
    touchlessSoapDispenser: {
      name: "Temassız Sabunluk",
      summary:
        "El yaklaşınca çalışan bir pompa; kullanmak için hiçbir yere dokunmak gerekmiyor.",
    },
    digitalReactionGame: {
      name: "Dijital Refleks Oyunu",
      summary:
        "Tahmin edemeyeceğin bir anda ışık yanar, kart da ne kadar hızlı bastığını ölçer.",
    },
  },

  components: {
    board: "Mikrodenetleyici kartı",
    breadboard: "Breadboard",
    sensor: "Sensör",
    servo: "Mikro servo",
    led: "LED'ler",
    resistor: "Dirençler",
    jumper: "Jumper kabloları",
    usb: "USB kablosu",
    cardboard: "Karton kol",
    button: "Buton",
  },

  concepts: {
    digitalPins: "Dijital pinler",
    analogReading: "Analog okuma",
    triggerEcho: "Trigger ve echo",
    pwmServo: "PWM ve servo kontrolü",
    ledPolarity: "LED polaritesi",
    distanceMeasurement: "Mesafe ölçümü",
    conditionalLogic: "Koşullu mantık",
    mechanicalCalibration: "Mekanik kalibrasyon",
    testing: "Test ve hata ayıklama",
    thresholds: "Eşik değerleri",
    serialOutput: "Seri çıktı",
    timing: "Zamanlama ve refleks",
  },

  library: {
    title: "Projeler",
    intro:
      "Yedi yapım, her biri bitmiş bir nesne. Elindekine, ayırabildiğin zamana ya da öğrenmek istediğin şeye göre seç.",
    search: "Projelerde ara",
    filters: {
      difficulty: "Zorluk",
      duration: "Süre",
      components: "Parçalar",
      learningGoal: "Öğrenme hedefi",
      readyNow: "Şimdi hazır",
    },
    clear: "Filtreleri temizle",
    difficulty: {
      beginner: "Başlangıç",
      intermediate: "Orta",
    },
    minutes: (n: number) => `${n} dk`,
    stepsCount: (n: number) => `${n} adım`,
    partsCount: (n: number) => `${n} parça`,
    results: (n: number) => `${n} proje`,
    viewProject: "Projeyi gör",
    filterBy: "Projeleri filtrele",
    upTo: (n: number) => `En çok ${n} dk`,
    anyDuration: "Fark etmez",
    readyNow: "Şimdi hazır",
    readyNowHint: "Yalnızca rehberli atölyesi olan yapımlar",
    empty: "Bu filtrelere uyan proje yok.",
    emptyHint: "Bir filtreyi kaldırmayı ya da aramayı temizlemeyi dene.",
  },

  status: {
    ready: "Hazır",
    preview: "Önizleme",
    inProgress: "Devam ediyor",
    previewProject: "Projeyi önizle",
    demoFeed: "Demo akışı",
    boardSimulated: "Kart simüle",
    agentConnected: "Ajan bağlı",
    agentOffline: "Ajan bağlı değil",
    connectedViaWebMcp: "WebMCP ile bağlı",
    toolsAvailable: (n: number) => `${n} araç kullanılabilir`,
  },

  projectDetail: {
    learningGoals: "Neler öğreneceksin",
    required: "Neye ihtiyacın var",
    checklistHint: "Elinde olanları işaretle.",
    haveThis: "Bu bende var",
    haveIt: "Var",
    addIt: "Ekle",
    someOf: "Bir kısmı",
    missingOne: "1 parça eksik",
    missingMany: (n: number) => `${n} parça eksik`,
    allPresent: "Bütün parçalar işaretlendi",
    demoModeNotice: "Rehberli demo modunda devam edebilirsin",
    demoModeDetail:
      "Hiçbir şey engellenmiyor. Atölye simüle bir kart üzerinde çalışıyor, yani fiziksel kit olmadan da yapımın tamamını takip edebilirsin.",
    stepPreview: "Yapım adımları",
    start: "Yapıma başla",
    askAgent: "Ajandan kitimi kontrol etmesini iste",
    kitReport: "Ajan kitini kontrol etti",
    kitReportHint: "Projenin parça listesinden okundu.",
    previewNotice:
      "Bu proje bir önizleme. Bu sürümde yalnızca Akıllı Otopark Bariyeri'nin tam rehberli atölyesi var.",
    previewNoSteps:
      "Yapım adımları, bir proje atölyesine kavuştuğunda yazılıyor.",
  },

  build: {
    project: "Akıllı Otopark Bariyeri",
    parts: {
      board: "Kart",
      breadboard: "Breadboard",
      sensor: "Ultrasonik sensör",
      servo: "Mikro servo",
      ledGreen: "Yeşil LED",
      ledRed: "Kırmızı LED",
    },
    steps: {
      kit: {
        name: "Kitini kontrol et",
        instruction: "Hiçbir şey kablolamadan önce bütün parçaları önüne diz.",
        rationale:
          "Eksik bir direnci şimdi bulmak, LED'ler takıldıktan sonra bulmaktan kolay.",
      },
      place: {
        name: "Parçaları yerleştir",
        instruction: "Kartı, breadboard'u ve sensörü kalacakları yere oturt.",
        rationale: "Kablo boylarını parçaların durduğu yer belirler.",
      },
      sensor: {
        name: "Mesafe sensörünü kabla",
        instruction: "Sensörün Echo pinini D7 dijital pinine bağla.",
        rationale: "Echo, yansıyan darbenin dönüş süresini ölçer.",
        asideSummary: "Neden D7?",
        asideBody:
          "Program dönüş darbesini D7'den okuyor. D6'daki bir kablo o okumayı boş bırakır, bariyer de arabayı hiç görmez.",
      },
      servo: {
        name: "Servoyu bağla ve tak",
        instruction: "Servoyu D9'a kabla ve kolu AÇIK konumda tak.",
        rationale:
          "Kolun başlangıç açısı bariyerin hangi yöne açılacağını belirler.",
        asideSummary: "Açı neden önemli?",
        asideBody:
          "Program AÇIK için bir açı, KAPALI için başka bir açı gönderiyor. Kol çeyrek tur yanlış takılırsa iki komut da söylediğinin tersini yapar.",
      },
      leds: {
        name: "Durum LED'lerini ekle",
        instruction:
          "Yeşil LED'i D3'e, kırmızıyı D2'ye, her birini kendi direnci üzerinden kabla.",
        rationale: "Yapımın ne karar verdiğini sana LED'ler söyler.",
      },
      upload: {
        name: "Yükle ve kalibre et",
        instruction: "Programı yükle ve mesafe okumasını kontrol et.",
        rationale: "Kalibrasyon, ekrandaki sayıların odayla buluştuğu yerdir.",
      },
      test: {
        name: "Tam sistem testini çalıştır",
        instruction: "Sensöre doğru bir cisim yaklaştır ve bariyeri izle.",
        rationale:
          "Bütün yapım tek bir davranış: yaklaş, ölç, karar ver, hareket et.",
      },
    },
  },

  workbench: {
    back: "Projeye dön",
    stepOf: (current: number, total: number) => `Adım ${current} / ${total}`,
    resetDemo: "Demoyu sıfırla",
    demoControls: "Demo kontrolleri",
    componentsInStep: "Bu adımdaki parçalar",
    inspect: "Yapımımı incele",
    verify: "Adımı doğrula",
    runFullTest: "Tam testi çalıştır",
    showMe: "Göster",
    iFixedIt: "Düzelttim",
    previewAngle: "Doğru açıyı önizle",
    iRemounted: "Yeniden taktım",
    correctionHighlighted: "Düzeltme vurgulandı",
    stepVerified: "Adım doğrulandı",
    finish: "Yapımı bitir",
    whyThisPin: "Neden D7?",

    stepStatus: {
      completed: "Tamamlandı",
      active: "Aktif",
      issue: "Sorunlu",
      upcoming: "Başlanmadı",
    },

    jumpers: (n: number) => `${n} jumper kablo`,
    pins: "Pinler",

    region: {
      steps: "Yapım adımları",
      workspace: "Devre çalışma alanı",
      circuit: (project: string) => `${project} devresi`,
    },
    openAgentPanel: "Ajan panelini aç",

    views: {
      label: "Kanvas görünümü",
      reference: "Referans",
      current: "Mevcut",
      compare: "Karşılaştır",
    },
    canvas: {
      zoomIn: "Yakınlaştır",
      zoomOut: "Uzaklaştır",
      fitView: "Ekrana sığdır",
      layers: "Katmanlar",
    },
  },

  demo: {
    controls: "Demo kontrolleri",
    reset: "Demoyu tamamen sıfırla",
    jumpWiring: "Kablo sorununa atla",
    injectEcho: "Yanlış Echo bağlantısını uygula",
    markWiringFixed: "Kabloyu düzeltilmiş say",
    jumpServo: "Servo sorununa atla",
    injectServo: "Servo yönü hatasını uygula",
    markServoRemounted: "Servoyu yeniden takılmış say",
    jumpTest: "Tam sistem testine atla",
    complete: "Projeyi tamamla",
    groups: {
      wiring: "Kablolama",
      servo: "Servo",
      system: "Tam sistem",
    },
    note: "Dokuzu da ajanın çağırdığı araçları çağırır.",
  },

  agentPanel: {
    tabs: {
      guidance: "Rehberlik",
      findings: "Bulgular",
      activity: "Etkinlik",
    },
    coaching: {
      label: "Yardım düzeyi",
      hint: "Önce ipucu",
      explain: "Açıkla",
      exact: "Tam çözümü göster",
    },
    ladder: {
      notice: "Fark et",
      explain: "Açıklama",
      exactFix: "Tam çözüm",
    },
    noFindings: "Bu adımda açık bulgu yok.",
    noFindingsHint:
      "Kablolamayı bitirdiğini düşündüğünde bir inceleme çalıştır.",
    noActivity: "Henüz ajan etkinliği yok.",
    noActivityHint: "Ajanın çalıştırdığı her araç buraya kaydedilir.",
    developerDetails: "Geliştirici ayrıntıları",
    rawResult: "Ham sonuç",
    webMcpUnavailable: "Bu tarayıcıda WebMCP kullanılamıyor",
    webMcpUnavailableDetail: "Manuel demo kontrolleri çalışmaya devam ediyor.",
    noGuidance: "Bu adım için söylenecek bir şey yok.",
    noGuidanceHint: "Hazır olduğunda ajandan yapımı incelemesini iste.",
    suggestedNext: "Önerilen sonraki",
    correction: "Düzeltme",
    context: {
      notInspected: "Ajan bu adıma henüz bakmadı.",
      allMatch: "Bu adımda beklenen bütün bağlantılar eşleşiyor.",
      someMatch: (matched: number, expected: number) =>
        `Beklenen ${expected} bağlantıdan ${matched} tanesi eşleşiyor.`,
      nothingToCheck: "Bu adımda karşılaştırılacak bağlantı yok.",
      blocked: "Bloke",
      connections: "Bağlantılar",
      countOf: (matched: number, expected: number) =>
        `${matched} / ${expected}`,
    },
    resolved: "Çözüldü",
    demoData: "Demo verisi",

    phases: {
      readingContext: "Yapım bağlamı okunuyor",
      readingWiring: "Kablolama grafiği okunuyor",
      comparingSketch: "Programla karşılaştırılıyor",
      checkingAlignment: "Mekanik hizalama kontrol ediliyor",
      locating: "Bağlantı bulunuyor",
      rereading: "Gözlenen bağlantılar yeniden okunuyor",
      comparingExpected: "Beklenen grafikle karşılaştırılıyor",
      loadingStep: "Adım yükleniyor",
      runningTest: "Test dizisi çalışıyor",
      searchingProjects: "Proje kütüphanesinde aranıyor",
      readingProject: "Proje okunuyor",
    },

    activity: {
      readContext: "Ajan mevcut yapım bağlamını okudu",
      contextRead: "Yapım bağlamı okundu",
      inspecting: (step: number) =>
        `Ajan ${step}. adımın kablolamasını inceledi`,
      inspectingMechanical: (step: number) =>
        `Ajan ${step}. adımın mekanik hizalamasını kontrol etti`,
      inspectingAll: "Ajan yapımın tamamını inceledi",
      mismatchFound: (n: number) => `${n} bağlantı uyuşmazlığı bulundu`,
      issuesFound: (n: number) => `${n} sorun bulundu`,
      nothingFound: "Bu adımda düzeltilecek bir şey yok",
      showingCorrection: "Ajan bağlantıyı işaret etti",
      correctionHighlighted: "Düzeltme atölyede vurgulandı",
      correctionAlreadyShown: "Düzeltme zaten ekrandaydı",
      verifying: (step: number) => `Ajan ${step}. adımı doğruladı`,
      stepVerified: "Adım başarıyla doğrulandı",
      stepNotVerified: (n: number) => `${n} sorun hâlâ açık`,
      navigating: (step: number) => `Ajan ${step}. adıma geçti`,
      movedToStep: (step: number, name: string) => `Adım ${step} · ${name}`,
      alreadyOnStep: (step: number) => `Zaten ${step}. adımdayız`,
      testing: (test: string) => `Ajan ${test} testini çalıştırdı`,
      testPassed: "Bütün kontroller geçti",
      testFailed: (n: number) => `${n} kontrol başarısız`,
      reset: "Demo sıfırlandı",

      searchedProjects: "Ajan proje kütüphanesinde arama yaptı",
      projectsFound: (n: number) => `${n} proje eşleşiyor`,
      openedProject: "Ajan bir proje açtı",
      readRequirements: "Ajan projenin neye ihtiyaç duyduğunu okudu",
      startedProject: "Ajan yapımı başlattı",
      buildStarted: "Yapım başladı",
    },

    errors: {
      unknownFinding: "O bulgu artık açık değil.",
      toolFailed: "Bu çağrı tamamlanamadı.",
      stepNotReady: "Bu adımda henüz doğrulanacak bir şey yok.",
      barrierDirection: "Bariyer AÇIK konumunda ters yöne hareket etti.",
      unknownProject: "Bu id'ye sahip bir proje yok.",
      projectNotReady: "O proje bir önizleme, henüz atölyesi yok.",
    },

    user: {
      movedWire: (subject: string, pin: string) =>
        `${subject} kablosunu ${pin} pinine taşıdın`,
      remountedServo: "Servo kolunu yeniden taktın",
      refittedHorn: "Servo kolunu çeyrek tur kaydırarak taktın",
      changedCoaching: (level: string) => `Yardım düzeyini ${level} yaptın`,
    },

    details: {
      detailsFor: (headline: string) => `— ${headline}`,
      toolLabel: "Araç",
      argumentsLabel: "Argümanlar",
      resultLabel: "Sonuç",
      durationLabel: "Süre",
      ms: (n: number) => `${n} ms`,
      noArguments: "yok",
      failed: "Başarısız",
    },

    tools: {
      title: "Bu sayfadaki araçlar",
      note: "Atölye açıkken tarayıcıya kaydediliyor.",
      get_build_context: "Projeyi, aktif adımı ve her bağlantıyı okur.",
      inspect_build: "Yapımı programla karşılaştırır ve bulguları bildirir.",
      show_correction: "Bir bulguyu atölyede işaret eder.",
      verify_current_step: "Mevcut adımı kontrol eder ve tamamlandı işaretler.",
      navigate_build_step: "Başka bir adıma geçer.",
      run_functional_test: "Sensör, servo ve LED kontrollerini çalıştırır.",
      find_projects:
        "Zorluğa, süreye, parçaya veya öğrenme hedefine göre yapım bulur.",
      open_project: "Bir projenin detay ekranını açar.",
      get_project_requirements:
        "Bir projenin parçalarını, süresini, seviyesini ve hedeflerini okur.",
      start_project: "Bir yapımı başlatır ve atölyesini açar.",
    },

    knowledge: {
      title: "Kısa kontrol",
      question:
        "Echo kablosu neden programda tanımlı pinle aynı olmak zorunda?",
      options: [
        { id: "pin", label: "Program belirli bir giriş pinini okuyor." },
        { id: "voltage", label: "Kartın voltajını değiştiriyor." },
        { id: "range", label: "Sensörün menzilini artırıyor." },
      ],
      correctId: "pin",
      correct:
        "Doğru. Pin numarası bir tercih değil, programın parçası — program D7'yi dinliyor, başka hiçbir yeri değil.",
      incorrect:
        "Tam değil. Kablo her iki durumda da aynı sinyali taşır; değişen şey, programın o pini dinleyip dinlemediği.",
      tryAgain: "Tekrar dene",
      correctMark: "Doğru",
    },
  },

  findings: {
    connectionMismatch: "Bağlantı uyuşmazlığı",
    missingConnection: "Bağlantı eksik",
    servoOff: "Servo kolu 90° yanlış",
    notWired: "Kablolanmamış",

    wrongPin: (subject: string, observed: string, expected: string) =>
      `${subject} ${observed} pinine bağlı. Bu yapım ${expected} bekliyor.`,
    missingWire: (subject: string, expected: string) =>
      `${subject} için henüz kablo yok. Bu yapım ${expected} bekliyor.`,
    servoExplanation: "Program AÇIK konumunu gönderdiğinde bariyer kapanacak.",

    hint: (subject: string) =>
      `${subject} kablosunu vurgulanan dijital pin sırasıyla karşılaştır.`,
    explain: (subject: string, expected: string) =>
      `${subject} pini yansıyan darbenin süresini karta geri gönderir. Program bu sinyali ${expected} pininden okuyor.`,
    exact: (colour: string, subject: string, from: string, to: string) =>
      `${colour} ${subject} kablosunu ${from} pininden ${to} pinine taşı.`,

    servoHint: "Bariyer açılması gerekirken kolun hangi yöne döndüğüne bak.",
    servoExplain:
      "Program AÇIK için kolu 90°'ye sürüyor. Kol çeyrek tur yanlış takılıysa aynı komut bariyeri kapatır.",
    servoExact:
      "Kolu milden çıkar ve çeyrek tur saat yönünün tersine çevirerek tekrar tak.",

    evidence: {
      camera: "Kamera karesi",
      alignment: "Görsel hizalama kontrolü",
      graph: "Grafik karşılaştırması",
    },
    /* Split so the number can render in mono while the word around it stays
       in prose — and so a locale that puts the sign first can do that. */
    confidenceValue: (percent: number) => `%${percent}`,
    confidence: (value: string) => `${value} güven`,
    resolvedConnection: "Bağlantı artık eşleşiyor",
    resolvedServo: "Kol artık hizalı",
    resolvedMeta: "Doğrulandı",
    severity: {
      critical: "Kritik",
      warning: "Uyarı",
      info: "Bilgi",
    },
    openCount: (n: number) => `${n} açık bulgu`,
  },

  device: {
    dockRegion: "Cihaz paneli",
    expand: "Cihaz panelini aç",
    collapse: "Cihaz panelini kapat",
    tabs: {
      device: "Cihaz",
      serial: "Seri monitör",
      test: "Test çıktısı",
    },
    board: "Kart",
    boardValue: "Simüle UNO uyumlu kart",
    port: "Port",
    portValue: "Demo",
    voltage: "Voltaj",
    voltageValue: "5V",
    lastSerial: "Son seri çıktı",
    testStatus: "Test durumu",
    states: {
      idle: "Boşta",
      running: "Çalışıyor",
      passed: "Geçti",
      failed: "Başarısız",
    },
    serialRegion: "Seri çıktı",
    serialEmpty: "Kart henüz bir şey söylemedi",
    serialEmptyHint: "Fonksiyonel testi çalıştır, çıktısı buraya düşsün.",
    telemetry: "Telemetri",
    distance: "Mesafe",
    noReading: "Okuma yok",
    recentReadings: "Son okumalar",
  },

  test: {
    sensor: "Mesafe sensörü okunuyor",
    servo: "Bariyer servosu hareket ediyor",
    leds: "Durum LED'leri kontrol ediliyor",
    barrierDirection: "Bariyer yönü",
    states: {
      idle: "Başlamadı",
      running: "Çalışıyor",
      passed: "Geçti",
      failed: "Başarısız",
      skipped: "Atlandı",
    },
    summary: {
      idle: "Henüz test çalışmadı",
      idleDetail:
        "Tam test bitmiş yapımı sürüyor: bir şey yaklaşır, sensör onu okur, bariyer cevap verir.",
      running: "Fonksiyonel test çalışıyor",
      passed: "Üç kontrol de geçti",
      passedDetail:
        "Bariyer menzile giren için açılıyor, arkasından yeniden kapanıyor.",
      failed: (n: number) => `${n} kontrol başarısız`,
      failedDetail:
        "Yapımın geri kalanı çalışıyor. Başarısız kontrolü düzelt ve testi yeniden çalıştır.",
    },
  },

  inspection: {
    title: "Yapım incelemesi",
    cameraFrame: "Kamera karesi",
    referenceView: "Referans görünüm",
    findingsSummary: "Bulgu özeti",
    demoVisionResult: "Demo görüntü sonucu",
    close: "İncelemeyi kapat",
    capturedAt: "Alındı",
    hornAngle: "Kol açısı",
    observed: "Gözlenen",
    expected: "Beklenen",
  },

  complete: {
    title: "Yapımın çalışıyor",
    sub: "Sadece bitirmedin. Nasıl çalıştığını da öğrendin.",
    timeSpent: "Harcanan süre",
    issuesFixed: "Düzeltilen sorunlar",
    conceptsLearned: "Öğrenilen kavramlar",
    testResult: "Test sonucu",
    knowledgeCheck: "Kısa kontrol",
    tryAnother: "Başka bir proje dene",
    reopen: "Atölyeyi yeniden aç",
    share: "Yapımı paylaş",
    shareCopied: "Yapım özeti kopyalandı",
    shareHeading: (project: string) =>
      `${project} — CircuitPilot ile kuruldu`,
    conceptsCount: (n: number) => `${n} kavram`,
    issuesCount: (n: number) => `${n} sorun`,
    noSession: "Devam eden bir yapım olmadan açıldı",
    noSessionDetail:
      "Aşağıdaki değerler projenin kendi künyesi, senin bir koşunun değil. Kendinin olması için atölyeyi aç.",
  },

  a11y: {
    breadcrumb: "Kırıntı yolu",
    close: "Kapat",
    dismiss: "Kapat",
    progress: "İlerleme",
    buildSteps: "Bütün yapım adımları",
    buildProgress: (current: number, total: number) =>
      `Yapım ilerlemesi: ${total} adımdan ${current}. adım. Bütün adımları göster.`,
    buildProgressBlocked: (current: number, total: number) =>
      `Yapım ilerlemesi: ${total} adımdan ${current}. adım, bloke. Bütün adımları göster.`,
    clearSearch: "Aramayı temizle",
    removeFilter: (name: string) => `${name} filtresini kaldır`,
    showOnWorkbench: (part: string, terminal: string) =>
      `${part} ${terminal} ucunu atölyede göster`,
    smallScreen: "Daha geniş bir ekranda daha iyi çalışır",
    smallScreenDetail:
      "Atölye kanvasının okunabilir kalması için yere ihtiyacı var. Yapım adımları, bulgular ve ajan etkinliği burada da açık.",
  },
};
