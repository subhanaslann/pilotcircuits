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
 *   · Fiil `kablola-`: `kablo` adından türeyen standart biçim. `kabla` diye
 *     bir fiil yok, ve 3–5. bölümler zaten `kablola` diyor — 6. bölüm üç yerde
 *     `kabla` diyordu ve bu satırın altına düşüyordu.
 *   · Adım adları emir kipinde: `Mesafe sensörünü kablola`. Burada bir zamanlar
 *     isim öbeği yazıyordu (`Mesafe sensörünün kablolaması`); 33 adım adının
 *     hiçbiri öyle değil ve hiçbiri öyle olmamalı — ray satırı bir başlık değil,
 *     kişiye verilen iş.
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
    agentOnline: "AJAN ÇEVRİMİÇİ • CANLI",
    agentOffline: "AJAN ÇEVRİMDIŞI",
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

  /* The six chapters, in ladder order. The names are objects, not lessons: a
     child builds a night light, not "an introduction to digital input". */


  landing: {
    designation: "YAPIM 01 — AKILLI OTOPARK BARİYERİ",
    sub: (board: string, sensor: string, servo: string, pin: string) =>
      `${board} + ${sensor} + ${servo} servo. Ajan ${pin} pinindeki sinyal yolunu izliyor.`,
    cta: "EĞİTİME BAŞLA",
    ctaContinue: "YAPIMA DEVAM ET",
    ctaNextStep: (step: string) => `SONRAKİ ADIM: ${step.toLocaleUpperCase("tr")}`,

    stripRegion: "Yapım teşhisi",
    logRegion: "Ajan günlüğü",
    status: "Durum",
    statusGreen: "YEŞİL",
    statusOpen: (count: number) => `${count} AÇIK`,
    stepsValue: (done: number, total: number) => `${done} / ${total}`,

    sceneLabel: "MEVCUT YAPIM — ÜSTTEN GÖRÜNÜŞ",


    helpTitle: "BARİYER AÇILMIYOR",
    helpBody:
      "Araç çizgide ve sensör atıyor, ama program okumayı hiç alamıyor: Echo kablosu bir delik yanlışta. Ajandan taşımasını iste.",
    helpTools: "Burada kayıtlı:",
    helpAction: "Kabloyu düzelt",
    helpBusy: "Ajan çalışıyor",
    helpHost: "Bir ajan bunları çağırabilir",
    helpNoHost: "Bu tarayıcıda WebMCP yok",
    helpAfter:
      "Demo birkaç saniye sonra arızayı geri koyuyor, tekrar izleyebilesin diye.",


    log: {
      attach: (pin: string) => `AJAN: servo ${pin} pinine bağlandı`,
      trigger: (cm: number) => `TETİK: ${cm} cm → TAMAM`,
      mistake: (found: string, expected: string) =>
        `HATA: Echo ${found} pininde, ${expected} bekleniyor`,
      fixed: (pin: string) => `DÜZELTME: ${pin} pinine taşındı`,
      sweep: "BARİYER TARAMASI AKTİF",
    },

    steps: "Adım",
    tools: "Araç",

    ladderTitle: "Altı bölüm, bir merdiven",
    ladderBody:
      "Her bölüm bir öncekine tam olarak bir fikir ekliyor, ve parça listesi onunla birlikte büyüyor: üçle başlıyor, altıyla bitiyor. Yukarıdaki tezgah altıncı bölüm.",

    ledgerCaption: "Proje kataloğu — altı bölüm",
    ledgerChapter: "Bölüm",
    ledgerBuild: "Yapım",
    ledgerAdds: "Ne ekliyor",
    ledgerTime: "Süre",
    ledgerParts: "Parça",
    ledgerStatus: "Durum",
    ledgerBench: "Mavi kenar: yukarıdaki tezgahta duran yapım.",

    closingTitle: "Kart simüle, hata gerçek.",
    closingBody:
      "Kamera yok, seri port yok, yükleme yok. Gerçek olan devre grafiği, içindeki iki hata ve seni onlardan çıkaran akıl yürütme.",
  },

  projects: {
    breathingLamp: {
      name: "Nefes Alan Lamba",
      adds: "İlk pin, ilk LED, zamanlama",
      summary:
        "Yavaşça parlayıp yavaşça sönen tek bir LED. Karta doğrudan takılıyor, breadboard bile gerekmiyor.",
    },
    trafficLight: {
      name: "Trafik Lambası",
      adds: "Breadboard ve şaşmayan sıra",
      summary:
        "Breadboard üzerinde üç LED; kırmızı, sarı, yeşil sırayla yanıyor ve sıra hiç şaşmıyor.",
    },
    motionNightLight: {
      name: "Hareketli Gece Lambası",
      adds: "Sensör: bir olayı beklemek",
      summary:
        "Biri geçince uyanan, koridor sakinleşince yeniden sönen bir lamba.",
    },
    plantGuardian: {
      name: "Bitki Bekçisi",
      adds: "Analog okuma ve eşik değeri",
      summary:
        "Saksının ne kadar kuruduğunu izleyen ve bitki su isteyince yanan bir toprak probu.",
    },
    touchlessSoapDispenser: {
      name: "Temassız Sabunluk",
      adds: "Mesafe ölçümü ve servo",
      summary:
        "El yaklaşınca çalışan bir pompa; kullanmak için hiçbir yere dokunmak gerekmiyor.",
    },
    smartParkingBarrier: {
      name: "Akıllı Otopark Bariyeri",
      adds: "Kalibrasyon, test, yargı",
      summary:
        "Yaklaşan arabayı fark eden, geçmesi için kalkan ve arkasından kapanan bir bariyer.",
    },
  },

  components: {
    board: "Mikrodenetleyici kartı",
    breadboard: "Breadboard",
    sensor: "Sensör",
    servo: "Mikro servo",
    led: "LED'ler",
    resistor: "Dirençler",
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
      "Altı bölüm, her biri bitmiş bir nesne. Sırayla gidiyorlar — ilkinde üç parça, sonuncusunda altı — ama istediğin yerden başlayabilirsin.",
    search: "Projelerde ara",
    filters: {
      difficulty: "Zorluk",
      duration: "Süre",
      components: "Parçalar",
      learningGoal: "Öğrenme hedefi",
      readyNow: "Şimdi hazır",
    },
    clear: "Filtreleri temizle",
    /* `Bölüm 01`. İki haneli, çünkü altı bölümlük bir merdivende tek hane
       sıralı bir liste gibi değil, gelişigüzel bir numara gibi okunuyor. */
    chapter: (n: number) => `Bölüm ${String(n).padStart(2, "0")}`,
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
    toolsOnThisPage: (n: number) => `Bu sayfada ${n} araç tanımlı`,
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
    /* Önündeki projenin kendisi için doğru olanı söylüyor, hiçbir şey saymıyor.
       Eskiden rehberli tek yapım olarak capstone'u adlandırıyordu; 1. bölüm
       çıktığı anda yanlış oldu, ve bundan sonraki her bölümde yeniden
       yanlış olurdu. */
    previewNotice:
      "Bu proje bir önizleme. Parçaları ve adımları gerçek — henüz olmayan tek şey kendi rehberli atölyesi.",
    previewNoSteps:
      "Yapım adımları, bir proje atölyesine kavuştuğunda yazılıyor.",
  },

  build: {
    project: "Akıllı Otopark Bariyeri",
    parts: {
      board: "Kart",
      breadboard: "Breadboard",
      /* Tek ad, ve o ad ürünün geri kalanının zaten kullandığı ad.
         Burada `Ultrasonik sensör` yazıyordu; oysa 5. bölümün tanıtım ekranı,
         3. adımı, kit satırı ve capstone'un 2. adımı "mesafe sensörü" diyor —
         yani kit rafı ve bulgular parçayı bir türlü, etrafındaki her cümle
         başka türlü adlandırıyordu, hem de aynı ekranda. */
      sensor: "Mesafe sensörü",
      sensorMotion: "Hareket sensörü",
      sensorMoisture: "Toprak probu",
      servo: "Mikro servo",
      ledGreen: "Yeşil LED",
      ledRed: "Kırmızı LED",
      ledYellow: "Sarı LED",
      led: "LED",
      resistor: "Direnç",
      resistorRed: "Kırmızı lambanın direnci",
      resistorYellow: "Sarı lambanın direnci",
      resistorGreen: "Yeşil lambanın direnci",
      jumper: "Jumper kablo",
      /**
       * Dört kablo, her birine programın verdiği işle.
       *
       * 2–5. bölümlerde kit rafında ve adım listesinde dört satır vardı ve
       * dördü de aynı çizimi aynı kelimeyle sunuyordu — `Jumper kablo`, dört
       * kez, aynı `aria-label` ile. Dirençlere bu sebeple çoktan birer ad
       * verilmişti ("üç tanesi olan bir tezgahta tür, ad değildir"); kablolara
       * verilmemişti.
       *
       * Dürüst olan ve olmayan, açıkça: dört kablodan hangisini eline aldığın
       * konusunda modelin bir fikri yok — yeşil diye aldığı kabloyla kırmızı
       * lambayı kablolayan biri doğru devreyi kurmuş oluyor ve ona öyle
       * deniyor. Bu adlar o yüzden plastiğin bir özelliği değil, programın o
       * kablodan beklediği İŞ. Modelin ısrar ettiği tek şey, bir kablonun iki
       * ucunun birlikte kalması — ve role göre verilen bir ad, o kuralı tahmin
       * edilir olmaktan çıkarıp izlenir hâle getiriyor.
       *
       * Bunlar rafın kelimeleri. Aşağıdaki `leads` tablosundaki UÇ adları da
       * aynı öbekle başlıyor: aynı kablo hakkında raf satırıyla adım satırının
       * farklı konuşması, bu kusurun bir kat aşağıdaki hâli olurdu.
       */
      jumperGround: "Toprak kablosu",
      jumperPower: "Güç kablosu",
      jumperSignal: "Sinyal kablosu",
      jumperLamp: "Lamba kablosu",
      jumperRed: "Kırmızı lambanın kablosu",
      jumperYellow: "Sarı lambanın kablosu",
      jumperGreen: "Yeşil lambanın kablosu",
      cardboard: "Karton",
    },

    /**
     * Bacaklar, tek tek. Bir ucun adı zaten bir tamlama — `LED'in uzun bacağı`
     * — ve tamlamanın sonu cümleye göre değişiyor. Üç tablo bunun için var:
     * çağıran hangi hâli istediğini söylüyor, cümle de sonuna `parçasını`
     * gibi bir kelime ekleyip ekten kaçmak zorunda kalmıyor.
     */
    /* Yalın hâl, ve tek okuyucusu ray satırı: cümlenin içinde değil, kendi
       başına duran bir etiket. O yüzden büyük harfle başlıyor — aynı sütunda
       `LED` ve `Direnç` de var, ve üçü alt alta hizalı duruyor. Cümle ortasına
       bir uç adı gerekirse `leadObject` ya da `leadTarget` doğru tablo. */
    leads: {
      "led.cathode": "LED'in kısa bacağı",
      "led.anode": "LED'in uzun bacağı",
      "res.in": "Direncin LED tarafındaki ucu",
      "res.out": "Direncin kart tarafındaki ucu",

      /* 2. bölüm. Üç direnç de aynı bej 220Ω parça — "kırmızı direnç" diye bir
         şey yok — o yüzden her biri hizmet ettiği lambayla anılıyor;
         `parts.resistorRed` de aynı şeyi aynı şekilde söylüyor. Zincir uzun
         ama Türkçe onu taşıyor: lamba-nın direnc-i-nin uc-u.

         Jumper uçları da aynı zinciri taşıyor, ve bir süre taşımıyordu: her
         uç yalnızca hangi karta gittiğiyle anılıyordu, yani adım listesi dört
         satır çiziyor ve aralarında iki etiket paylaştırıyordu — `Jumper
         kablonun kart ucu` iki kez, `Jumper kablonun ray ucu` iki kez. Kit
         rafı düzeltilmiş, burası düzeltilmemişti; `partNameOf` `parts`'ı
         okuyor, adım listesi ve kontrol listesi ise bu tabloyu.

         Artık uç önce kablosunu, sonra kendini söylüyor. Kablo başta duruyor,
         çünkü satır ~180 pikselde kesiliyor: önde ne varsa o kalıyor, ve
         eskiden önde duran şey dört satırın ORTAK yarısıydı. */
      "wire.gnd.rail": "Toprak kablosunun ray ucu",
      "wire.gnd.pin": "Toprak kablosunun kart ucu",
      "led.red.cathode": "Kırmızı LED'in kısa bacağı",
      "led.red.anode": "Kırmızı LED'in uzun bacağı",
      "res.red.in": "Kırmızı lambanın direncinin LED tarafındaki ucu",
      "res.red.out": "Kırmızı lambanın direncinin ray tarafındaki ucu",
      "wire.red.row": "Kırmızı lambanın kablosunun breadboard ucu",
      "wire.red.pin": "Kırmızı lambanın kablosunun kart ucu",
      "led.yellow.cathode": "Sarı LED'in kısa bacağı",
      "led.yellow.anode": "Sarı LED'in uzun bacağı",
      "res.yellow.in": "Sarı lambanın direncinin LED tarafındaki ucu",
      "res.yellow.out": "Sarı lambanın direncinin ray tarafındaki ucu",
      "wire.yellow.row": "Sarı lambanın kablosunun breadboard ucu",
      "wire.yellow.pin": "Sarı lambanın kablosunun kart ucu",
      "led.green.cathode": "Yeşil LED'in kısa bacağı",
      "led.green.anode": "Yeşil LED'in uzun bacağı",
      "res.green.in": "Yeşil lambanın direncinin LED tarafındaki ucu",
      "res.green.out": "Yeşil lambanın direncinin ray tarafındaki ucu",
      "wire.green.row": "Yeşil lambanın kablosunun breadboard ucu",
      "wire.green.pin": "Yeşil lambanın kablosunun kart ucu",

      /* 3. bölüm. Tek lamba, o yüzden taşınacak bir renk yok; tek sensör, ama
         onun üç ucu ayırt EDİLİYOR — parça uçlarının yanına `+`, `D` ve `−`
         basıyor, yani kişi hangisinin hangisi olduğunu görebiliyor. Dört kablo
         2. bölümün kuralını sürdürüyor: önce programın o kabloya verdiği iş,
         sonra ucun ulaştığı kart. 2. adım bunlardan ikisini birden veriyor, ve
         eski ortak adla o adımın rayı dört satır çizip aralarında iki etiket
         paylaştırıyordu. */
      "wire.power.rail": "Güç kablosunun ray ucu",
      "wire.power.pin": "Güç kablosunun kart ucu",
      "wire.ground.rail": "Toprak kablosunun ray ucu",
      "wire.ground.pin": "Toprak kablosunun kart ucu",
      "pir.vcc": "Sensörün güç ucu",
      "pir.out": "Sensörün sinyal ucu",
      "pir.gnd": "Sensörün toprak ucu",
      "wire.signal.row": "Sinyal kablosunun breadboard ucu",
      "wire.signal.pin": "Sinyal kablosunun kart ucu",
      "led.night.cathode": "LED'in kısa bacağı",
      "led.night.anode": "LED'in uzun bacağı",
      "res.night.in": "Direncin LED tarafındaki ucu",
      "res.night.out": "Direncin ray tarafındaki ucu",
      "wire.lamp.row": "Lamba kablosunun breadboard ucu",
      "wire.lamp.pin": "Lamba kablosunun kart ucu",

      /* 4. bölüm. Probun üçüncü ucu, yanına basılmış dört harfle değil,
         taşıdığı şeyle anılıyor: `AOUT` kartın kelimesi ve zaten kartın
         üstünde duruyor; bir insan "probun ölçüm ucu" der. */
      "soil.vcc": "Probun güç ucu",
      "soil.gnd": "Probun toprak ucu",
      "soil.aout": "Probun ölçüm ucu",
      "led.plant.cathode": "LED'in kısa bacağı",
      "led.plant.anode": "LED'in uzun bacağı",
      "res.plant.in": "Direncin LED tarafındaki ucu",
      "res.plant.out": "Direncin ray tarafındaki ucu",

      /* 5. bölüm. İki modülü de 6. bölümün iki nesnesi, o yüzden kimlikleri de
         onun; yeni olan şey artık birinin onları eline alması. Servonun üç ucu
         renkleriyle anılıyor, çünkü bir servo kablosu tam olarak budur:
         dünyadaki her servoda kırmızı, kahverengi ve turuncu, ve çizim de öyle
         diyor. */
      "sensor.vcc": "Sensörün güç ucu",
      "sensor.gnd": "Sensörün toprak ucu",
      "sensor.trig": "Sensörün Trig ucu",
      "sensor.echo": "Sensörün Echo ucu",
      "servo.power": "Servonun kırmızı ucu",
      "servo.ground": "Servonun kahverengi ucu",
      "servo.signal": "Servonun turuncu ucu",
      "led.soap.cathode": "LED'in kısa bacağı",
      "led.soap.anode": "LED'in uzun bacağı",
      "res.soap.in": "Direncin LED tarafındaki ucu",
      "res.soap.out": "Direncin ray tarafındaki ucu",
    },
    /**
     * Belirtme hâli: `… al`, `… boşa çıkardın`.
     *
     * Büyük harfle başlıyor, çünkü Türkçe SOV: nesne cümlenin başına geçiyor,
     * ve bu tablonun bugünkü bütün okuyucuları — `lead.choose` başlığı,
     * picker'ın buton adları, zaman çizelgesinin satırları — cümleyi bu
     * kelimeyle açıyor. İngilizce açmıyor (`Pick up …` fiille başlar), o yüzden
     * `en` tarafı küçük kalıyor; fark tam da bu yüzden sözlükte duruyor.
     *
     * Büyütme burada, `${…}` yerinde değil: `line.ts` tabloda olmayan bir ucu
     * ham `TerminalId` olarak geri veriyor, ve bir kimliği büyütmek onu artık
     * grafikteki adıyla eşleşmeyen bir şeye çevirir (kural 13).
     */
    leadObject: {
      "led.cathode": "LED'in kısa bacağını",
      "led.anode": "LED'in uzun bacağını",
      "res.in": "Direncin LED tarafındaki ucunu",
      "res.out": "Direncin kart tarafındaki ucunu",

      "wire.gnd.rail": "Toprak kablosunun ray ucunu",
      "wire.gnd.pin": "Toprak kablosunun kart ucunu",
      "led.red.cathode": "Kırmızı LED'in kısa bacağını",
      "led.red.anode": "Kırmızı LED'in uzun bacağını",
      "res.red.in": "Kırmızı lambanın direncinin LED tarafındaki ucunu",
      "res.red.out": "Kırmızı lambanın direncinin ray tarafındaki ucunu",
      "wire.red.row": "Kırmızı lambanın kablosunun breadboard ucunu",
      "wire.red.pin": "Kırmızı lambanın kablosunun kart ucunu",
      "led.yellow.cathode": "Sarı LED'in kısa bacağını",
      "led.yellow.anode": "Sarı LED'in uzun bacağını",
      "res.yellow.in": "Sarı lambanın direncinin LED tarafındaki ucunu",
      "res.yellow.out": "Sarı lambanın direncinin ray tarafındaki ucunu",
      "wire.yellow.row": "Sarı lambanın kablosunun breadboard ucunu",
      "wire.yellow.pin": "Sarı lambanın kablosunun kart ucunu",
      "led.green.cathode": "Yeşil LED'in kısa bacağını",
      "led.green.anode": "Yeşil LED'in uzun bacağını",
      "res.green.in": "Yeşil lambanın direncinin LED tarafındaki ucunu",
      "res.green.out": "Yeşil lambanın direncinin ray tarafındaki ucunu",
      "wire.green.row": "Yeşil lambanın kablosunun breadboard ucunu",
      "wire.green.pin": "Yeşil lambanın kablosunun kart ucunu",

      "wire.power.rail": "Güç kablosunun ray ucunu",
      "wire.power.pin": "Güç kablosunun kart ucunu",
      "wire.ground.rail": "Toprak kablosunun ray ucunu",
      "wire.ground.pin": "Toprak kablosunun kart ucunu",
      "pir.vcc": "Sensörün güç ucunu",
      "pir.out": "Sensörün sinyal ucunu",
      "pir.gnd": "Sensörün toprak ucunu",
      "wire.signal.row": "Sinyal kablosunun breadboard ucunu",
      "wire.signal.pin": "Sinyal kablosunun kart ucunu",
      "led.night.cathode": "LED'in kısa bacağını",
      "led.night.anode": "LED'in uzun bacağını",
      "res.night.in": "Direncin LED tarafındaki ucunu",
      "res.night.out": "Direncin ray tarafındaki ucunu",
      "wire.lamp.row": "Lamba kablosunun breadboard ucunu",
      "wire.lamp.pin": "Lamba kablosunun kart ucunu",

      "soil.vcc": "Probun güç ucunu",
      "soil.gnd": "Probun toprak ucunu",
      "soil.aout": "Probun ölçüm ucunu",
      "led.plant.cathode": "LED'in kısa bacağını",
      "led.plant.anode": "LED'in uzun bacağını",
      "res.plant.in": "Direncin LED tarafındaki ucunu",
      "res.plant.out": "Direncin ray tarafındaki ucunu",

      "sensor.vcc": "Sensörün güç ucunu",
      "sensor.gnd": "Sensörün toprak ucunu",
      "sensor.trig": "Sensörün Trig ucunu",
      "sensor.echo": "Sensörün Echo ucunu",
      "servo.power": "Servonun kırmızı ucunu",
      "servo.ground": "Servonun kahverengi ucunu",
      "servo.signal": "Servonun turuncu ucunu",
      "led.soap.cathode": "LED'in kısa bacağını",
      "led.soap.anode": "LED'in uzun bacağını",
      "res.soap.in": "Direncin LED tarafındaki ucunu",
      "res.soap.out": "Direncin ray tarafındaki ucunu",
    },
    /** Yönelme hâli: `… tuttur` cümlesinin varacağı yer. */
    leadTarget: {
      "led.cathode": "LED'in kısa bacağına",
      "led.anode": "LED'in uzun bacağına",
      "res.in": "direncin LED tarafındaki ucuna",
      "res.out": "direncin kart tarafındaki ucuna",

      /* İlk kelime küçük — cümlenin ortasında duruyor. `LED'in …` istisna,
         çünkü orada ilk kelime bir kısaltma ve kısaltmalar cümlenin ortasında
         da büyük yazılır; aynı ayrım yukarıdaki `res.in`/`res.out` satırlarında
         da var. */
      "wire.gnd.rail": "toprak kablosunun ray ucuna",
      "wire.gnd.pin": "toprak kablosunun kart ucuna",
      "led.red.cathode": "kırmızı LED'in kısa bacağına",
      "led.red.anode": "kırmızı LED'in uzun bacağına",
      "res.red.in": "kırmızı lambanın direncinin LED tarafındaki ucuna",
      "res.red.out": "kırmızı lambanın direncinin ray tarafındaki ucuna",
      "wire.red.row": "kırmızı lambanın kablosunun breadboard ucuna",
      "wire.red.pin": "kırmızı lambanın kablosunun kart ucuna",
      "led.yellow.cathode": "sarı LED'in kısa bacağına",
      "led.yellow.anode": "sarı LED'in uzun bacağına",
      "res.yellow.in": "sarı lambanın direncinin LED tarafındaki ucuna",
      "res.yellow.out": "sarı lambanın direncinin ray tarafındaki ucuna",
      "wire.yellow.row": "sarı lambanın kablosunun breadboard ucuna",
      "wire.yellow.pin": "sarı lambanın kablosunun kart ucuna",
      "led.green.cathode": "yeşil LED'in kısa bacağına",
      "led.green.anode": "yeşil LED'in uzun bacağına",
      "res.green.in": "yeşil lambanın direncinin LED tarafındaki ucuna",
      "res.green.out": "yeşil lambanın direncinin ray tarafındaki ucuna",
      "wire.green.row": "yeşil lambanın kablosunun breadboard ucuna",
      "wire.green.pin": "yeşil lambanın kablosunun kart ucuna",

      "wire.power.rail": "güç kablosunun ray ucuna",
      "wire.power.pin": "güç kablosunun kart ucuna",
      "wire.ground.rail": "toprak kablosunun ray ucuna",
      "wire.ground.pin": "toprak kablosunun kart ucuna",
      "pir.vcc": "sensörün güç ucuna",
      "pir.out": "sensörün sinyal ucuna",
      "pir.gnd": "sensörün toprak ucuna",
      "wire.signal.row": "sinyal kablosunun breadboard ucuna",
      "wire.signal.pin": "sinyal kablosunun kart ucuna",
      "led.night.cathode": "LED'in kısa bacağına",
      "led.night.anode": "LED'in uzun bacağına",
      "res.night.in": "direncin LED tarafındaki ucuna",
      "res.night.out": "direncin ray tarafındaki ucuna",
      "wire.lamp.row": "lamba kablosunun breadboard ucuna",
      "wire.lamp.pin": "lamba kablosunun kart ucuna",

      "soil.vcc": "probun güç ucuna",
      "soil.gnd": "probun toprak ucuna",
      "soil.aout": "probun ölçüm ucuna",
      "led.plant.cathode": "LED'in kısa bacağına",
      "led.plant.anode": "LED'in uzun bacağına",
      "res.plant.in": "direncin LED tarafındaki ucuna",
      "res.plant.out": "direncin ray tarafındaki ucuna",

      "sensor.vcc": "sensörün güç ucuna",
      "sensor.gnd": "sensörün toprak ucuna",
      "sensor.trig": "sensörün Trig ucuna",
      "sensor.echo": "sensörün Echo ucuna",
      "servo.power": "servonun kırmızı ucuna",
      "servo.ground": "servonun kahverengi ucuna",
      "servo.signal": "servonun turuncu ucuna",
      "led.soap.cathode": "LED'in kısa bacağına",
      "led.soap.anode": "LED'in uzun bacağına",
      "res.soap.in": "direncin LED tarafındaki ucuna",
      "res.soap.out": "direncin ray tarafındaki ucuna",
    },
    steps: {
      /* --- 1. bölüm · Nefes Alan Lamba ---------------------------------- */
      lampKit: {
        name: "Kitini kontrol et",
        instruction: "Üç parça: kart, bir LED, bir 220Ω direnç.",
        rationale:
          "Bu bölümde breadboard yok — devre hâlâ kartın kendi header'ına sığıyor.",
      },
      lampSeat: {
        name: "LED'i yerine otur",
        instruction:
          "LED'in kısa bacağını üst sıradaki GND deliğine sok. Uzun bacağı şimdilik boşta bırak.",
        rationale:
          "Kısa bacak katot. Kullanacağın her LED'de toprağa giden bacak odur.",
      },
      lampResistor: {
        name: "Aradaki boşluğu dirençle köprüle",
        instruction:
          "Direncin bir ucunu D9'a sok, öbür ucunu LED'in uzun bacağına tuttur.",
        rationale:
          "İki bağlantı var ve ikisini de sen yapıyorsun: pine ulaşan da LED'i hayatta tutan da direnç.",
        asideSummary: "Neden D9?",
        asideBody:
          "Sadece bazı pinler kısılıp açılabilir — üzerinde ~ olanlar. D9 onlardan biri, D8 değil. Bir delik yanlış takmak lambayı bozmaz, sadece nefes almak yerine yanıp sönmesine yol açar.",
      },
      lampUpload: {
        name: "Yükle ve nefesini izle",
        instruction: "Programı yükle ve tam bir dolup boşalmayı izle.",
        rationale:
          "Bir yavaş nefes, yapımın tamamı. Yanıp sönüyorsa uç yanlış pinde.",
      },

      /* --- 2. bölüm · Trafik Lambası -------------------------------------
         Beş adım, ve üçüncüsü bölümün kendisi: aralarında kablo olmadan iki
         bacağın ilk kez birleştiği yer orası. Delik adresleri — `F7`, `J7`,
         `H8`, `D13` — plastiğin üstünde yazıyor, çevrilmiyor (kural 13). */
      tlKit: {
        name: "Kitini kontrol et",
        instruction:
          "On iki parça: kart, breadboard, üç LED, üç 220Ω direnç ve dört jumper kablo.",
        /* 1. bölümün kit cümlesine karşılık veriyor — orada "bu bölümde
           breadboard yok" yazıyor, burada aynı cümle tersini söylüyor. */
        rationale:
          "Yeni parça breadboard. Üç lamba kartın kendi header'ına sığmıyor, onun için buraya geliyorlar.",
      },
      tlGround: {
        name: "Toprağı breadboard'a taşı",
        /* "Herhangi bir delik" bir kaçamak değil: rayın tamamı tek bir düğüm,
           yani hangi deliğe girerse girsin doğrulanıyor. Tek bir deliği
           adreslemek, kartın sahip olmadığı bir hassasiyeti öğretmek olurdu. */
        instruction:
          "Bir jumper kablonun kart ucunu GND'ye, öbür ucunu − rayında herhangi bir deliğe sok.",
        rationale:
          "O ray tek parça uzun bir metal şerit. Tek bir kablo rayın tamamını toprak yapıyor, üç lamba da oraya dönüyor.",
      },
      tlRed: {
        name: "Kırmızı lambayı kur",
        instruction:
          "Kırmızı LED'in kısa bacağını F7'ye, uzun bacağını F8'e sok. Direncini J7'den − rayına indir, sonra H8'den D13'e bir jumper çek.",
        rationale:
          "Lambanın tamamı bu: kart D13'ü sürüyor, akım LED'i geçiyor ve direnç üzerinden toprak rayına çıkıyor.",
        asideSummary: "Direnç neden başka bir satıra giriyor?",
        asideBody:
          "Bir sütuna yukarıdan aşağı bak: beş delik, ve plastiğin altında hepsi tek bir metal şerit. Yani LED'in kısa bacağı F7'de, direncin ucu J7'de — ikisi zaten birbirine değiyor; onları sen bağlamadın, breadboard bağladı. Hangi satırı kullandığın fark etmiyor. Hangi sütunu kullandığın ediyor.",
      },
      tlOthers: {
        name: "Aynısını iki kez tekrarla",
        instruction:
          "Aynı üç parçayı sarı için 18 ve 19. sütunlara, yeşil için 27 ve 28. sütunlara yeniden kur. Jumper kabloları D12 ve D11'e gidiyor.",
        /* Bölümün ikinci dersi, ve yeri yükleme adımı değil burası: sırayı
           belirleyen şey her kablonun hangi pine ulaştığı, ve son iki kablo bu
           adımda seçiliyor. */
        rationale:
          "Sıra burada belirleniyor. Program önce D13'ü, sonra D12'yi, sonra D11'i sürüyor — hangi lambanın yanacağını kablosunun ulaştığı pin belirliyor.",
      },
      tlUpload: {
        name: "Yükle ve sırayı izle",
        instruction:
          "Programı yükle ve tam bir turu izle: kırmızı, yeşil, sarı ve yeniden kırmızı.",
        rationale:
          "Aynı anda tek lamba, ve hep aynı sırayla. Biri hiç yanmıyorsa kablosu yanlış pinde.",
      },

      /* --- 3. bölüm · Hareketli Gece Lambası -----------------------------
         Beş adım, ve yeni olan ikinci ve üçüncüsü. `mnlPower` bu üründe bir
         şeyin ilk kez sürülmek yerine BESLENDİĞİ yer, `mnlSensor` ise kartın
         okuduğu ilk pin — açıklama kutusu bu yüzden orada duruyor. Delik
         adresleri plastiğin üstünde yazıyor ve hiç çevrilmiyor (kural 13);
         `INSTRUCTION_MONO` onları mono'ya alıyor. */
      mnlKit: {
        name: "Kitini kontrol et",
        instruction:
          "Dokuz parça: kart, breadboard, hareket sensörü, bir LED, bir 220Ω direnç ve dört jumper kablo.",
        rationale:
          "Yeni parça hareket sensörü, ve beslenmesi gereken ilk parça. Ondan öncekilerin yalnızca sürülmesi yetiyordu.",
      },
      mnlPower: {
        name: "İki raya da güç getir",
        /* "Herhangi bir delik" 2. bölümdeki gerekçeyle: bir ray tek düğüm,
           yani içindeki her delik doğrulanıyor, ve tek bir deliği adreslemek
           kartın sahip olmadığı bir hassasiyeti öğretmek olurdu. */
        instruction:
          "Bir jumper kabloyu 5V'tan + rayında herhangi bir deliğe, bir tanesini de GND'den − rayında herhangi bir deliğe çek.",
        rationale:
          "İki uzun şerit, şimdiye kadar ölü. Sensörün çalışabilmesi için beş volt ve kartla aynı toprak gerekiyor — her raya bir kablo, ve yapımın geri kalanı boyunca ikisi de canlı.",
      },
      mnlSensor: {
        name: "Sensörü kablola",
        instruction:
          "Sensörün + ucunu + rayında, − ucunu − rayında herhangi bir deliğe sok. D ucu A29'a giriyor; sonra E29'dan D2'ye bir jumper çek.",
        rationale:
          "Sensör tek bir telden cevap veriyor: bir şey kımıldarken yüksek, koridor sakinleşince alçak. Program o cevabı D2'den dinliyor.",
        asideSummary: "D2'nin farkı ne?",
        asideBody:
          "Şimdiye kadar kullandığın her pin kartın yazdığı bir pindi — program karar veriyor, pin uyguluyor. D2 kartın okuduğu bir pin. Üstünde ne olacağına programdaki hiçbir şey karar vermiyor; sensör veriyor, ve programın bütün işi durmadan sormak.",
      },
      mnlLamp: {
        name: "Lambayı kur",
        instruction:
          "LED'in kısa bacağını F9'a, uzun bacağını F10'a sok. Direncini J9'dan − rayına indir, sonra H10'dan D13'e bir jumper çek.",
        rationale:
          "Geçen bölümün lambası, üç kez değil bir kez. Kart D13'ü sürüyor, akım LED'i geçiyor ve direnç üzerinden toprak rayına çıkıyor.",
      },
      mnlUpload: {
        name: "Yükle ve önünden geç",
        instruction:
          "Programı yükle, sonra elini sensörün önünden geçir ve lambanın yanmasını izle.",
        rationale:
          "Lamba bir zamanlayıcıya bağlı değil. Sensör öyle dediği için yanıyor, koridor sakinleşince de yeniden sönüyor.",
      },

      /* --- 4. bölüm · Bitki Bekçisi --------------------------------------
         Altı adım, ve beşincisi hiçbir bağlantıya sahip değil: bir eşik seçmek
         bir bağlantı değil, bir karar — ve bu bölümün eklediği şeyin tamamı o.
         Açıklama kutusu `pgProbe`'da duruyor: kişinin ilk kez `A` yazan bir
         deliğe uç soktuğu yer orası. */
      pgKit: {
        name: "Kitini kontrol et",
        instruction:
          "Dokuz parça: kart, breadboard, toprak probu, bir LED, bir 220Ω direnç ve dört jumper kablo.",
        rationale:
          "Yeni parça toprak probu, ve kart onu karşılamak için ters dönüyor: bu yapımın kullandığı dört deliğin üçü alt kenardaki header'da.",
      },
      pgPower: {
        name: "İki raya da güç getir",
        instruction:
          "Bir jumper kabloyu 5V'tan + rayında herhangi bir deliğe, bir tanesini de GND'den − rayında herhangi bir deliğe çek.",
        rationale:
          "Geçen bölümdeki iki kablonun aynısı, yukarı değil aşağı iniyor. Prob bir şey söyleyebilmek için önce beş volta ve kartın kendi toprağına ihtiyaç duyuyor.",
      },
      pgProbe: {
        name: "Probu kablola",
        instruction:
          "Probun + ucunu + rayında, − ucunu − rayında herhangi bir deliğe sok. A ucu B28'e giriyor; sonra A28'den A0'a bir jumper çek.",
        rationale:
          "Prob bir gerilimle cevap veriyor, ve A0 o gerilimi 0 ile 1023 arasında bir sayıya çevirebilen altı delikten biri.",
        asideSummary: "Neden A0, D2 değil?",
        asideBody:
          "Dijital bir pinin iki cevabı var ve kart hangisine yakınsa onu seçiyor: yaklaşık 2,5 V'un üstünü 1, altını 0 okuyor. A yazan altı delik ise bir çeviriciden geçiyor ve 0 ile 1023 arasında bir sayı getiriyor. Islak toprakla kuru toprak iki ayrı durum değil — aralarında yavaş bir geçiş var, ve o geçişi yalnızca A delikleri görebiliyor.",
      },
      pgLamp: {
        name: "Lambayı kur",
        instruction:
          "LED'in kısa bacağını F9'a, uzun bacağını F10'a sok. Direncini J9'dan − rayına indir, sonra H10'dan D9'a bir jumper çek.",
        rationale:
          "İki kez kurduğun lamba, programın sürdüğü pinde. Onda yeni bir şey yok; yeni olan, ne zaman yanacağına neyin karar verdiği.",
      },
      pgSketch: {
        name: "Eşiği seç",
        instruction:
          "Prob kuruyken bir, ıslak toprağa batırılmışken bir monitörü oku; sonra programın eşiğini iki sayının arasına ayarla.",
        rationale:
          "Kart sana bitkinin susadığını söyleyemez. Ölçümün 618 olduğunu söyleyebilir; 618'in kuru olduğuna karar veren sensin.",
      },
      pgUpload: {
        name: "Yükle ve kurumasını bekle",
        instruction:
          "Programı yükle ve ölçümün senin sayını geçip lambayı yakmasını izle.",
        rationale:
          "Hiçbir şey anahtarlanmadı. Bir sayı senin çizdiğin çizgiyi geçti, ve program o konuda ona söylediğini yaptı.",
      },

      /* --- 5. bölüm · Temassız Sabunluk -----------------------------------
         Altı adım, ve ikisi yeni bir tür şey: iki pine yayılmış bir ölçüm, ve
         açık-kapalı değil bir konum söylenen bir parça. Açıklama kutusu
         `tsdSensor`'da, çünkü bölümün adı oradan geliyor. */
      tsdKit: {
        name: "Kitini kontrol et",
        instruction:
          "Dokuz parça: kart, breadboard, mesafe sensörü, servo, bir LED, bir 220Ω direnç ve üç jumper kablo.",
        rationale:
          "İki yeni parça, ve servo bu üründe hareket eden ilk şey. Bir lambadan daha fazla akım çekiyor; raylardan beslenmesinin sebebi de bu.",
      },
      tsdPower: {
        name: "İki raya da güç getir",
        instruction:
          "Bir jumper kabloyu 5V'tan + rayında herhangi bir deliğe, bir tanesini de GND'den − rayında herhangi bir deliğe çek.",
        rationale:
          "İki yeni parça da raylardan besleniyor. Buradan sonra header'a giden tek şey kartın kendi sinyalleri.",
      },
      tsdSensor: {
        name: "Mesafe sensörünü kablola",
        instruction:
          "Sensörün + ucunu + rayında, − ucunu − rayında herhangi bir deliğe sok. Trig ucu D8'e, Echo ucu D7'ye gidiyor.",
        rationale:
          "Trig ile Echo iki pine yayılmış tek bir ölçüm: kart D8'den kısa bir darbe gönderiyor ve onun D7'ye dönmesinin ne kadar sürdüğünü ölçüyor.",
        asideSummary: "İki pin bir mesafeyi nasıl ölçer?",
        asideBody:
          "Kart Trig'e kısa bir darbe koyuyor. Sensör onu duyabileceğin her şeyin çok üstünde bir cıvıltıya çeviriyor, yankıyı bekliyor, ve Echo'yu sesin havada kaldığı süre kadar yüksekte tutuyor. Ses saniyede yaklaşık 343 metre gidiyor; kart bu süreyi ikiye bölüyor — gidiş ve dönüş — ve çarpıyor. Mesafe, sensörün hesapladığı bir şey değil, kartın tuttuğu bir kronometre.",
      },
      tsdServo: {
        name: "Servoyu kablola",
        instruction:
          "Kırmızı ucu + rayında, kahverengi ucu − rayında herhangi bir deliğe sok; turuncu ucu D9'a gidiyor.",
        rationale:
          "D9'un yanında ~ işareti var, ve bu bir tercih değil: servoya bir açı söyleniyor, ve bir açıyı ancak açık ile kapalı arasında bir değerde durabilen pinler söyleyebiliyor.",
      },
      tsdLamp: {
        name: "Lambayı kur",
        instruction:
          "LED'in kısa bacağını F8'e, uzun bacağını F9'a sok. Direncini J8'den − rayına indir, sonra H9'dan D13'e bir jumper çek.",
        rationale:
          "Bunu dördüncü kez kuruyorsun, ve sonuncusu. Buradaki işi, pompanın çalıştığını söylemek.",
      },
      tsdUpload: {
        name: "Yükle ve elini uzat",
        instruction:
          "Programı yükle, sonra elini sensöre doğru yaklaştır ve kolun dönüp geri gelmesini izle.",
        rationale:
          "Bir ölçüm, bir karar, bir hareket — ve sonra bir sonraki eli bekliyor.",
      },

      /* --- 6. bölüm · Akıllı Otopark Bariyeri ---------------------------- */
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
        name: "Mesafe sensörünü kablola",
        instruction: "Sensörün Echo pinini D7 dijital pinine bağla.",
        rationale: "Echo, yansıyan darbenin dönüş süresini ölçer.",
        asideSummary: "Neden D7?",
        asideBody:
          "Program dönüş darbesini D7'den okuyor. D6'daki bir kablo o okumayı boş bırakır, bariyer de arabayı hiç görmez.",
      },
      servo: {
        name: "Servoyu bağla ve tak",
        instruction: "Servoyu D9'a kablola ve kolu AÇIK konumda tak.",
        rationale:
          "Kolun başlangıç açısı bariyerin hangi yöne açılacağını belirler.",
        asideSummary: "Açı neden önemli?",
        asideBody:
          "Program AÇIK için bir açı, KAPALI için başka bir açı gönderiyor. Kol çeyrek tur yanlış takılırsa iki komut da söylediğinin tersini yapar.",
      },
      leds: {
        name: "Durum LED'lerini ekle",
        instruction:
          "Yeşil LED'i D3'e, kırmızıyı D2'ye, her birini kendi direnci üzerinden kablola.",
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

  briefing: {
    title: "Başlamadan önce",
    next: "İleri",
    back: "Geri",
    start: "Başla",
    replay: "Tekrar oynat",
    screenOf: (current: number, total: number) =>
      `${total} perdeden ${current}.`,
    purposeHeading: "Ne yapıyorsun",
    assemblyHeading: "Nasıl kuruluyor",

    steps: {
      label: "Tanıtım adımları",
      purpose: "Proje",
      parts: "Parçalar",
      assembly: "Kurulum",
    },

    chapters: {
      breathingLamp: {
        parts: {
          board: {
            name: "Kart",
            note: "Programı çalıştıran parça. Yüklediğin kod burada durur ve üst kenarındaki delikleri sırayla açıp kapatır.",
          },
          led: {
            name: "LED",
            note: "Işığı veren parça. İki bacağı farklı uzunlukta ve bu bir süs değil: akım uzun bacaktan girer, kısa bacaktan çıkar. Ters takarsan hiç yanmaz.",
          },
          resistor: {
            name: "Direnç",
            note: "Akımı kısan parça. LED doğrudan karta takılırsa taşıyabileceğinden fazlasını çeker ve bir süre sonra ölür; direnç geçen akımı güvenli bir seviyede tutar. Bu bölümde ikinci bir işi daha var: LED'in bacağı D9'a yetişmiyor ve o boşluğu kapatan sensin.",
          },
        },
        purpose:
          "Tek bir LED, yavaşça parlayıp yavaşça sönüyor. Yanıp sönmüyor — arada duruyor. Bunun olabilmesi için kartın pini yalnızca açık ya da kapalı olmakla kalmayıp arada bir yerde durabilmeli, ve bunu sadece bazı pinler yapabiliyor. Bu bölümün tamamı o farkın üstünde duruyor.",
        assembly: {
          /* Yalnızca tezgahta olanı söylüyor — 2–5. bölümlerin açılış
             cümleleri gibi. Eskiden "Program yüklü" diyordu, ve dört beat
             sonraki `upload` programı yüklüyordu; ikisi de perdenin tamamı
             boyunca aynı anda ekranda duruyor. */
          board: "Kart tezgâhta. Hiçbir şey bağlı değil.",
          seat: "LED'in kısa bacağı üst sıradaki GND deliğine giriyor. Uzun bacak bekliyor.",
          reach: "Direnç D9'a iniyor ve LED'e doğru uzanıyor.",
          bridge: "Öbür ucu LED'in uzun bacağına değiyor. Devre kapanıyor.",
          upload: "Program karta gidiyor. D9 artık sürülüyor.",
          breathe: "Lamba yavaşça parlıyor ve sönüyor — yanıp sönmüyor.",
        },
      },

      trafficLight: {
        parts: {
          board: {
            name: "Kart",
            note: "Geçen bölümdeki kartın aynısı, ama işi arttı. Kenarındaki deliklerden hangisinin açılacağına yine program karar veriyor; bu sefer sırayla üçünü birden kullanıyor, ve kullandığı sıra bu yapımın bütün meselesi.",
          },
          breadboard: {
            name: "Breadboard",
            /* Bölümün üstünde durduğu tek gerçek, daha hiçbir şey
               yerleştirilmeden söyleniyor. Tezgah bunu çizemiyor — plastiğin
               altındaki şerit görünmüyor — o yüzden tanıtım, onun
               gösterilebileceği tek yer. */
            note: "Altında metal şeritler saklı bir delik bloğu. Beş delikten oluşan her sütun tek bir şerit, yani aynı sütuna sokulmuş iki bacak aralarında hiç kablo olmadan birbirine bağlanıyor. Kenarlardaki iki uzun hat ise ray: baştan sona bağlılar, ve toprak oraya gidiyor.",
          },
          led: {
            name: "LED'ler",
            note: "Artık üç tane var, ve her biri zaten tanıdığın parça: akım uzun bacaktan girer, kısa bacaktan çıkar. Birini ters takarsan o lamba karanlıkta kalır, diğer ikisi çalışmaya devam eder — bu bölümde gözden kaçması en kolay hata da bu.",
          },
          /* Ne YAPTIĞI, ikinci bacağının nereye çizildiği değil. Bu ekranın
             çerçevesi direncin kendi kutusu, yani toprak rayı karede hiç yok —
             not ise resmin içeremeyeceği bir inişi anlatıyordu. Rayı, yapımın
             tamamını çerçeveleyen beat gösteriyor. */
          resistor: {
            name: "Dirençler",
            note: "Her lambaya bir tane, ve üçü de aynı 220Ω parça. Her biri kendi lambasının sütununda durup o lambanın akımını toprağa geri taşıyor; böylece her lambanın kendi dönüş yolu oluyor ve hiçbiri taşıyabileceğinden fazlasını çekmiyor.",
          },
        },
        purpose:
          "Üç ışık, ve hiç şaşmayan bir sıra. Üç lamba kartın kendi header'ına sığmıyor, o yüzden bu bölüm onları breadboard'a taşıyor — delikleri şeritler hâlinde zaten birbirine bağlanmış bir blok. Bağlantıların çoğu sen dokunmadan yapılmış durumda; iş, hangi deliklerin bağlı olduğunu bilmekte.",
        /* Altı perde. `ground` en başta, çünkü bir kablo GND'ye ulaşana kadar
           ray ölü metal ve ondan sonraki her lamba o raya asılıyor — ayrıca
           jumperın kendine ait bir parça perdesi yok, yani bu perde onun
           tanıtımının tamamı. `GND`, `D13`, `D12` ve `D11` tam olarak böyle
           yazılıyor: `AssemblyAct` onları eşleştirerek mono'ya alıyor. */
        assembly: {
          bench: "Kart ve breadboard tezgâhta. Hiçbir şey bağlı değil.",
          ground:
            "İlk jumper takılıyor: bir ucu GND'de, öbür ucu − rayında. Rayın tamamı artık toprak.",
          red: "Kırmızı lamba bir bütün hâlinde geliyor — LED, direnç, jumper — iki sütuna yayılmış durumda.",
          others:
            "Sarı ve yeşil aynısını tekrarlıyor, her biri kendi sütun grubunda. Yeni hiçbir şey eklenmiyor.",
          upload: "Program karta gidiyor. D13, D12 ve D11 artık sürülüyor.",
          cycle:
            "Kırmızı. Sonra yeşil, sonra sarı, sonra yine kırmızı — ve sıra hiç şaşmıyor.",
        },
      },

      motionNightLight: {
        parts: {
          board: {
            name: "Kart",
            note: "Yine aynı kart, ama bu sefer iki kenarı da işin içinde. Üst kenardaki delikler kartın sürdüğü delikler; alt kenardakiler gücün karttan çıktığı yer, ve onlara ihtiyaç duyan ilk bölüm bu.",
          },
          breadboard: {
            name: "Breadboard",
            note: "Aynı delik bloğu, ve nihayet iki rayı da kullanılıyor. Sütunlar hâlâ tek metal şeritten beş delik; kenarlardaki iki uzun hat baştan sona bağlı, ve her birine bir kablo ulaştığı anda tahtadaki her şey karta bir kez daha gitmeden beslenip topraklanabiliyor.",
          },
          sensor: {
            name: "Hareket sensörü",
            /* Tezgahın çizemediği şey: kubbe donuk, mercek onun içinde, ve
               ekranda hiçbir şey neye yaradığını gösteremiyor. Bunun
               söylenebileceği tek yer tanıtım. */
            note: "Odayı izleyen parça. Beyaz kubbenin altında, önünden geçen ısıyı fark eden bir mercek var; fark ettiğinde modül ortadaki pinini birkaç saniye yüksekte tutuyor, sonra bırakıyor. Koridorun ne olduğunu bilmiyor — yalnızca sıcak bir şeyin yer değiştirdiğini biliyor.",
          },
          led: {
            name: "LED",
            note: "Bu sefer tek lamba, ve her zamanki kural: akım uzun bacaktan girer, kısa bacaktan çıkar. Ters takılırsa hiç yanmaz.",
          },
          resistor: {
            name: "Direnç",
            note: "Bir tane 220Ω, geçen bölümde yaptığı işin aynısını yapıyor. Lambanın kendi sütununda durup lambanın akımını toprağa geri taşıyor, böylece LED taşıyabileceğinden fazlasını hiç çekmiyor.",
          },
        },
        purpose:
          "Bekleyen bir lamba. Şimdiye kadar kurduğun her şey programın dediğini, saate göre yapıyordu; bu, odanın dediğini yapıyor. Lambayı yine kart sürüyor — yeni olan şey, kartın yazdığı değil okuduğu bir pin, ve o pinin öbür ucunda üstünde ne olacağına karar veren bir parça.",
        /* Altı perde, 2. bölümün ritmiyle. `power` en başta, çünkü o olana
           kadar iki ray da ölü ve sonraki her şey onlara asılıyor — ayrıca
           kartın öbür header'ından çıkan bir kablo burada ilk kez görülüyor.
           `5V`, `GND`, `D2` ve `D13` tam olarak böyle yazılıyor:
           `AssemblyAct` onları eşleştirerek mono'ya alıyor. */
        assembly: {
          bench: "Kart ve breadboard tezgâhta. İki ray da ölü.",
          power:
            "İki jumper takılıyor: 5V'tan + rayına, GND'den − rayına. Artık tahtadaki her şey beslenebilir.",
          sense:
            "Sensör üç ucuyla geliyor, ve bir jumper onun cevabını D2'ye taşıyor.",
          lamp: "Lamba zaten bildiğin gibi kuruluyor — LED, direnç, ve D13'e bir jumper.",
          upload: "Program karta gidiyor. D2 artık okunuyor, durmadan.",
          /* Kare nerede bitiyorsa cümle de orada bitiyor. `wake` son beat,
             `lit: true` ile duruyor ve film orada donuyor — yani "yeniden
             sönüyor" hiçbir karenin oynamadığı bir değişimdi. Sönmeyi
             `nightRun` gösteriyor, orada gerçekten izlenebiliyor. */
          wake: "Bir şey kımıldıyor. Lamba yanıyor, ve sensör pinini yukarıda tuttuğu sürece yanık kalıyor.",
        },
      },

      plantGuardian: {
        parts: {
          board: {
            name: "Kart",
            note: "Aynı kart, ters çevrilmiş. Üst kenarı ilk bölümden beri lamba sürdüğün header; alttaki gücü taşıyor, ve sağ ucunda A yazan altı delik var. Kartın bu şekilde durmasının sebebi o altı delik.",
          },
          breadboard: {
            name: "Breadboard",
            note: "Aynı delik bloğu, aynı iki ray, yine her birini birer kablo canlandırıyor. Onda hiçbir şey değişmedi — mesele de bu: artık mobilya, ve bölüm başka bir şeyi anlatmakta serbest.",
          },
          sensor: {
            name: "Toprak probu",
            /* Tezgahın çizemediği şey: bıçak çıplak plaka gibi görünüyor çünkü
               öyle, ve bunun neden önemli olduğu görünmüyor. Söylenebileceği
               tek yer tanıtım. */
            note: "Saksıya giren parça. Bıçağın üstünde metal yok — elektronik baş kısımda duruyor ve toprağı kaplamanın altından okuyor; probun iki haftada çürüyüp gitmesini engelleyen şey de bu. Bir gerilimle cevap veriyor, ve o gerilim toprak kurudukça yükseliyor.",
          },
          led: {
            name: "LED",
            note: "Tek lamba, ve her zamanki kural: akım uzun bacaktan girer, kısa bacaktan çıkar.",
          },
          resistor: {
            name: "Direnç",
            note: "Bir tane 220Ω, lambanın kendi sütununda durup akımı toprağa geri taşıyor — iki bölümdür yaptığı işin aynısı.",
          },
        },
        purpose:
          "Susadığını söyleyen bir saksı. Kart yine bir pin okuyor ve yine bir lamba sürüyor — ama bu pin bir evetle değil bir sayıyla cevap veriyor, ve tezgahtaki hiçbir şey o sayının ne anlama geldiğini bilmiyor. Hangi sayının kuru sayılacağına karar vermek, bölümün kendisi.",
        /* Altı perde, 3. bölümün ritmiyle. `5V`, `GND`, `A0` ve `D9` tam olarak
           böyle yazılıyor: `AssemblyAct` onları eşleştirerek mono'ya alıyor. */
        assembly: {
          bench:
            "Kart ve breadboard tezgâhta — bu sefer kart üstte. İki ray da ölü.",
          power: "İki jumper aşağı iniyor: 5V'tan + rayına, GND'den − rayına.",
          probe:
            "Prob üç ucuyla geliyor, ve bir jumper onun ölçümünü A0'a taşıyor.",
          lamp: "Lamba zaten bildiğin gibi kuruluyor — LED, direnç, ve D9'a bir jumper.",
          upload:
            "Program karta gidiyor. A0 artık okunuyor, ve bir sayıya çevriliyor.",
          dry: "Toprak kuruyor. Sayı seninkini geçiyor, ve lamba yanıyor.",
        },
      },

      touchlessSoapDispenser: {
        parts: {
          board: {
            name: "Kart",
            note: "Yine aynı kart, düz duruyor. Bu yapımın okuduğu ve sürdüğü her şey üst kenarda; öbür kenardan gelen tek şey, sensörle servonun çalıştığı beş volt.",
          },
          breadboard: {
            name: "Breadboard",
            note: "Aynı blok, ve artık onu kullanmanın tamamı raylar: beslenecek iki parça, ve bunu mümkün kılan birer kablo.",
          },
          sensor: {
            name: "Mesafe sensörü",
            note: "Ölçen parça. Öne bakan iki kutu var — biri konuşuyor, biri dinliyor — ve kart aradaki süreyi tutuyor. Görmüyor; sana yalnızca bir sesin geri dönmesinin ne kadar sürdüğünü söyleyebiliyor, ki ilk iki metrede bu aynı şey.",
          },
          servo: {
            name: "Servo",
            /* Tezgahın çizemediği şey: kutudan üç aynı tel çıkıyor ve onları
               birbirinden ayıran tek şey renkleri. */
            note: "Hareket eden parça. Üç tel çıkıyor: kırmızı ile kahverengi beslemesi, turuncu olan ise bir konum taşıyor — içinden geçecek bir gerilim değil, kendisine başka bir şey söylenene kadar tuttuğu bir talimat.",
          },
          led: {
            name: "LED",
            note: "Tek lamba, bu sefer yeşil, ve her zamanki kural: akım uzun bacaktan girer, kısa bacaktan çıkar.",
          },
          resistor: {
            name: "Direnç",
            note: "Bir tane 220Ω, lambanın kendi sütununda durup lambanın akımını toprağa geri taşıyor.",
          },
        },
        purpose:
          "El yaklaşınca çalışan bir pompa. Şimdiye kadar kurduğun her şey bir ışıkla bitiyordu; bu, hareket eden bir şeyle bitiyor — ve hareket ettirmek, bir parçaya açık mı kapalı mı olacağını değil, nereye gideceğini söylemek demek. Kararı veren şey, kartın kendi gönderdiği bir darbeden ve o darbenin dönme süresinden kendi hesapladığı bir mesafe.",
        /* Altı perde. `5V`, `GND`, `D8`, `D7`, `D9` ve `D13` tam olarak böyle
           yazılıyor: `AssemblyAct` onları eşleştirerek mono'ya alıyor. */
        assembly: {
          bench: "Kart ve breadboard tezgâhta. İki ray da ölü.",
          power:
            "İki jumper takılıyor: 5V'tan + rayına, GND'den − rayına. Artık iki yeni parça da beslenebilir.",
          sense:
            "Sensör geliyor. Beslemesi raylara gidiyor; Trig ile Echo kendi telleriyle doğrudan D8 ve D7'ye.",
          pump: "Servo ona katılıyor — kırmızı ve kahverengi raylara, turuncu D9'a — ve lamba da yanlarına giriyor.",
          upload:
            "Program karta gidiyor. D8'den bir darbe çıkıyor, ve D7'nin beklenmesi başlıyor.",
          wave:
            "Bir el yaklaşıyor. Lamba yanıyor, ve servoya nereye gideceği söyleniyor.",
        },
      },
    },
  },

  workbench: {
    back: "Çalışma alanına dön",
    stepOf: (current: number, total: number) => `Adım ${current} / ${total}`,
    resetDemo: "Demoyu sıfırla",
    demoControls: "Demo kontrolleri",
    kit: {
      inKit: "Kitte",
      /** Printed on the tray in the scene, the way the board prints its own
          pin names. One word, uppercase, never a sentence. */
      tray: "KİT",
      picking: "Elinde",
      pickUp: (part: string) => `${part} parçasını al`,
    },

    /* Aynı hareketler, bacak bacak. `kit` kutuyu anlatır — raftan bacak
       alınmaz, parça alınır — burası tezgâhta elle tutulan ucu anlatıyor.
       `lead` argümanları belirtme hâlinde geliyor, `other` yönelme hâlinde. */
    lead: {
      /* Hepsi ucun adıyla açılıyor — Türkçede nesne cümlenin başına geçiyor —
         o yüzden ad büyük harfiyle `build.leadObject`ten hazır geliyor; burada
         büyütme yapılmıyor. Nedeni `leadObject`in kendi notunda yazıyor. */
      pickUp: (lead: string) => `${lead} al`,
      move: (lead: string) => `${lead} taşı`,
      choose: (lead: string) => `${lead} nereye tutturacağını seç.`,
      whichLead: (part: string) => `${part} parçasının hangi ucunu taşıyorsun?`,
      whichLeadWhy:
        "Taşımak istediğin ucu seç. Escape parçayı olduğu yerde bırakır.",
      blockedLead: (lead: string, hole: string) =>
        `${lead} ${hole} deliğinde.`,
      chooseWhyBlocked: (blocked: string) =>
        `Kartta bir deliğe girebilir. ${blocked} Bir bacağa başka bir uç tutturabilmen için o bacağın delikten çıkmış olması gerekir. Escape geri koyar.`,
      chooseWhyNoLead:
        "Kartta bir deliğe girebilir. Tutturulacak boşta uç yok — bir bacağın önce deliğinden çıkmış olması gerekir. Escape geri koyar.",
      chooseWhy:
        "Karttaki bir deliğe girebilir ya da başka bir parçanın boştaki ucuna tutunabilir. Escape geri bırakır.",
      seatIn: (lead: string, pin: string) => `${lead} ${pin} deliğine sok`,
      /* `other` cümlenin ortasında, yönelme hâlinde: büyütülmüyor. */
      joinTo: (lead: string, other: string) => `${lead} ${other} tuttur`,
      release: (lead: string) => `${lead} boşta bırak`,
      loose: "Boşta",
      seated: "Delikte",
      joined: "Bağlı",
    },
    componentsInStep: "Bu adımdaki parçalar",
    inspect: "Yapımımı incele",
    verify: "Adımı doğrula",
    runFullTest: "Tam testi çalıştır",
    showMe: "Göster",
    checkThis: "Kontrol et",
    moveItForMe: "Benim yerime taşı",
    leaveLoose: "Boşta bırak",
    backToKit: "Kite geri koy",
    undo: "Geri al",
    redo: "İleri al",
    previewAngle: "Doğru açıyı önizle",
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
    agentAttach: "Ajan sıradaki ucu taksın",
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
    note: "Hepsi ajanın çağırdığı araçları çağırır.",
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
    checklist: {
      inThisStep: "Bu adımda",
      wholeCircuit: "Devrenin tamamı",
      elsewhere: "başka yerde",
    },
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
      reaching: "Uca uzanılıyor",
      carrying: "Uç taşınıyor",
      rereading: "Gözlenen bağlantılar yeniden okunuyor",
      comparingExpected: "Beklenen grafikle karşılaştırılıyor",
      loadingStep: "Adım yükleniyor",
      runningTest: "Test dizisi çalışıyor",
      searchingProjects: "Proje kütüphanesinde aranıyor",
      readingProject: "Proje okunuyor",
    },

    activity: {
      /* Kendi cümlesi kurulamayan bir çağrının başlığı. `attach_lead` ve
         `run_functional_test` özneyi zorunlu bir argümanda taşıyor, tarayıcı
         ise ikisini de o argüman olmadan çağırabiliyor — ekrana "Ajan taşıdı"
         ve "Ajan şu kontrolü çalıştırdı: " düşüyordu, özne yok, noktalama
         yerinde. İçinde boşluk olan bir cümle zaman çizelgesinin hatası gibi
         okunuyor; bu, olan şey gibi okunuyor. */
      calledTool: "Ajan bir araç çağırdı",
      readContext: "Ajan mevcut yapım bağlamını okudu",
      contextRead: "Yapım bağlamı okundu",
      inspecting: (step: number) =>
        `Ajan ${step}. adımın kablolamasını inceledi`,
      inspectingMechanical: (step: number) =>
        `Ajan ${step}. adımın mekanik hizalamasını kontrol etti`,
      inspectingAll: "Ajan yapımın tamamını inceledi",
      /* Dördüncü kapsam. Kendi cümlesi olmayınca bir `placement` incelemesi
         "3. adımın kablolamasını inceledi" diye duyuruluyordu — bakmadığı tek
         şey oyken. */
      inspectingPlacement: (step: number) =>
        `Ajan ${step}. adım için tezgahtaki parçaları kontrol etti`,
      mismatchFound: (n: number) => `${n} bağlantı uyuşmazlığı bulundu`,
      extrasFound: (n: number) => `Programda olmayan ${n} bağlantı`,
      partsMissing: (n: number) => `${n} parça hâlâ kitte`,
      issuesFound: (n: number) => `${n} sorun bulundu`,
      nothingFound: "Bu adımda düzeltilecek bir şey yok",
      /* Aynı cevap, daha geniş bir soruya. Üstünde durulan adıma daralan tek
         kapsam `current_step`; diğer dördü yapımın tamamını okuyor, ve onlar
         için "bu adımda" demek temiz bir incelemeyi olduğundan çok daha küçük
         bir iddiaya indiriyor. */
      nothingFoundInBuild: "Bu yapımda düzeltilecek bir şey yok",
      showingCorrection: "Ajan bağlantıyı işaret etti",
      /* İki bulgunun işaret edeceği bir bağlantı yok. Kutudaki bir parçanın
         onu bekleyen bir deliği var, o delikte hiçbir şey yok; çeyrek tur
         kaymış bir kol ise zaten bir bağlantı değil. İkisine de "bağlantıyı
         işaret etti" demek, zaman çizelgesinin başka bir eylemi anlatması. */
      showingCorrectionPart: "Ajan parçanın gireceği yeri işaret etti",
      showingCorrectionAlignment: "Ajan servo kolunu işaret etti",

      /* Ajanın elleriyle yaptığı tek şey. Cümleler kişinin kendi
         hareketlerininkiyle aynı yapıda ama ajanın ağzından — kim yaptıysa
         zaman çizelgesinde o yazıyor. */
      attachingLead: (lead: string) => `Ajan ${lead} taşıdı`,
      leadSeated: (lead: string, pin: string) =>
        `${lead} ${pin} deliğine taktı.`,
      leadJoined: (a: string, b: string) => `${a} ${b} tutturdu.`,
      leadLoosened: (lead: string) => `${lead} boşa çıkardı.`,
      correctionHighlighted: "Düzeltme atölyede vurgulandı",
      correctionAlreadyShown: "Düzeltme zaten ekrandaydı",
      verifying: (step: number) => `Ajan ${step}. adımı doğruladı`,
      stepVerified: "Adım başarıyla doğrulandı",
      stepNotVerified: (n: number) => `${n} sorun hâlâ açık`,
      navigating: (step: number) => `Ajan ${step}. adıma geçti`,
      movedToStep: (step: number, name: string) => `Adım ${step} · ${name}`,
      alreadyOnStep: (step: number) => `Zaten ${step}. adımdayız`,
      /* İleri atlanan ve bitmemiş adımlar. Sessiz kalmak, ajanın kurduğu bir
         yapımın kendiliğinden bitmiş görünmesi demek. */
      skippedSteps: (n: number) => `${n} adım tamamlanmadan geçildi`,
      /**
       * Ad, cümlenin içinde değil, iki nokta üst üsteden sonra.
       *
       * `copy.test` bir kontrolün NE YAPTIĞINI tutuyor — "Lamba nefes alıyor
       * mu", "Bağlantılar okunuyor" — çünkü o kelimeler cihaz panelindeki
       * satır etiketleri. `${test} testini` kalıbına konunca "Ajan Lamba nefes
       * alıyor mu testini çalıştırdı" çıkıyordu. Ek yerine apozisyon, soru
       * biçiminde olanlar dahil hepsini taşıyor — ve argümanın ham id yerine
       * çevrilmiş bir `{ ref: "check" }` olabilmesini de bu sağlıyor.
       */
      testing: (test: string) => `Ajan şu kontrolü çalıştırdı: ${test}`,
      testPassed: "Bütün kontroller geçti",
      testFailed: (n: number) => `${n} kontrol başarısız`,
      reset: "Demo sıfırlandı",

      searchedProjects: "Ajan proje kütüphanesinde arama yaptı",
      projectsFound: (n: number) => `${n} proje eşleşiyor`,
      openedProject: "Ajan bir proje açtı",
      readRequirements: "Ajan projenin neye ihtiyaç duyduğunu okudu",
      startedProject: "Ajan yapımı başlattı",
      buildStarted: "Yapım başladı",

      /* `Kontrol et`. Ajan yapımı yeniden okuyor ve ne bulduğunu söylüyor —
         düğmenin tamamı artık bu. Eskiden onarımı kendi yazıyor, sonra
         üstüne kişinin ağzından bir cümle koyuyordu ("220Ω ucunu D9'a
         taşıdın") — dokunulmamış bir uç için. Bunlar ajanın kendi cümleleri,
         çünkü yaptığı tek şey okumak. */
      checking: "Ajan o bağlantıyı yeniden kontrol etti",
      checkedMatches: (subject: string, pin: string) =>
        `Kontrol ettim: ${subject} ${pin} içinde. Çizimle eşleşiyor.`,
      checkedStillOpen: (subject: string, observed: string, expected: string) =>
        `Hâlâ eşleşmiyor — ${subject} ${observed} içinde, çizim ${expected} diyor.`,
      checkedStillJoined: "O bağlantı hâlâ duruyor.",
      checkedUnreachable: (part: string) =>
        `Bunu kontrol edemem — ${part} kite geri döndü.`,
      checkedAligned: "Kontrol ettim: kol artık doğru yönde.",
      checkedPartPlaced: (part: string) =>
        `Kontrol ettim: ${part} artık tezgahta.`,
      checkedStillTurned: "Kol hâlâ çeyrek tur kaymış durumda.",
    },

    errors: {
      unknownFinding: "O bulgu artık açık değil.",

      /**
       * Modelin kabul edemediği beş argüman, her birine bir cümle.
       *
       * Beşi de `toolFailed` gösteriyordu — doğru, ve o anahtar zaten bunun
       * için var; ama o son çare, cevap değil. §9 bir araçtan ya başarı ya da
       * ANLAŞILIR bir hata istiyor, "bu çağrı tamamlanamadı" ise yalnızca
       * çağrı hakkında bir bilgi.
       *
       * Hangisi ne yazabilir: kapsam, ayrıntı seviyesi ve filtre adı aracın
       * KENDİ argüman sözcükleri — araç listesinde `inspect_build` yanında
       * duran, çevrilmeyen kelimelerin aynısı — yani cümle onları anabilir.
       * Adım id'si öyle değil: rayda ad ve numara yazıyor, `mnlPower` kişinin
       * göreceği hiçbir yerde geçmiyor, ve burada geçmesi bu partinin
       * temizlemekle uğraştığı graf adresi sızıntısı olurdu. O yüzden adım
       * reddi saymakla yetiniyor; id'ler `result.valid` içinde, onlara
       * ihtiyacı olan çağıranın elinde kalıyor.
       *
       * Adları birleştirip yazmak yerine sayı olmasının ikinci sebebi: adım
       * adı çevrilmiş bir metin, ve `line.ts` çevrilmiş bir argümanın metin
       * olarak geçirilirse yazıldığı dilde donacağını açıkça söylüyor. Sayı
       * donmaz.
       */
      unknownStep: (count: number) =>
        `Bu yapımda öyle bir adım yok — burada ${count} adım var.`,
      unknownScope: (scopes: string) =>
        `Öyle bir inceleme kapsamı yok. Geçerli kapsamlar: ${scopes}.`,
      unknownDetailLevel: (levels: string) =>
        `Öyle bir ayrıntı seviyesi yok. Merdiven şu: ${levels}.`,
      /* Hemen yukarıdaki `unknownFinding`den ayrı, ve ayrım tam da mesele:
         o, panelin gerçekten ürettiği bir id'nin artık düzeltilmiş olduğunu
         söylüyor; bu ise öyle bir id'yi hiçbir şeyin taşımadığını. Eskiden
         ikisi tek cümleydi — hem de anlatmadığı duruma iliştirilmiş. */
      noSuchFinding: "Bu id'de bir bulgu yok — id'leri inspect_build veriyor.",
      unknownFilter: (filter: string) =>
        `Bu, ${filter} filtresinin kabul ettiği bir değer değil.`,
      toolFailed: "Bu çağrı tamamlanamadı.",
      stepNotReady: "Bu adımda henüz doğrulanacak bir şey yok.",
      barrierDirection: "Bariyer AÇIK konumunda ters yöne hareket etti.",
      /* İki tutamağın ikisi de geçerli: `open_project` ve kardeşleri hem
         katalog id'sini hem URL slug'ını kabul ediyor, yani yalnızca birini
         anmak çağıranı yapmadığı bir hatayı aramaya yolluyordu. İkisi de şema
         kelimesi, ikisi de çevrilmiyor. */
      unknownProject: "Bu id ya da slug ile eşleşen bir proje yok.",
      projectNotReady: "O proje bir önizleme, henüz atölyesi yok.",

      /* Modelin neye hayır dediği, sesli olarak. Reddedilen bir yazma
         işlemi eskiden gerçekleşen bir yazmadan ayırt edilemiyordu:
         `attach` her iki durumda da aynı kaydı döndürüyordu. */
      holeTaken: (pin: string) => `${pin} deliğinde zaten bir uç var.`,
      leadNotFree: "O ucun üzerinde zaten bir şey var.",
      sameCircuitPart: "Bir parçanın iki ucu birbirine değemez.",
      noTarget: "Orada bir şey yok — burası delik değil.",
      /* 2. bölümün kendi reddi. Jumperın sert bir gövdesi yok; uçları yalnızca
         girdikleri delikten konumlanıyor, yani bir bacağa tutturulmuş bir kablo
         ucu çizimin yerini söyleyemeyeceği bir nokta olurdu. Bu yapıma özel bir
         kural gibi değil, kablonun kendisi hakkında bir gerçek gibi söyleniyor —
         öyle çünkü. */
      wireEnd: "Jumper'ın ucu bir deliğe girer, bir bacağa değil.",

      /* `attach_lead`e tarayıcıdan gelebilecek üç yanlış argüman, artı
         yazmanın gerekmediği durum. Dördü de sessizlik değil, cümle. */
      noPlacement: "Bu yapımda yerleştirilecek parça yok.",
      unknownLead: "Bu yapımda öyle bir uç yok.",
      unknownTarget: "Orası ne bir delik ne de başka bir parçanın ucu.",
      leadAlreadyThere: "O uç zaten orada.",
      noBench: "Bu projenin atölyesi yok.",
      unknownCheck: (checks: string) =>
        `Böyle bir kontrol yok. Bu yapımdakiler: ${checks}.`,
      tooClose: "İki delik birbirine çok yakın — birini seç.",
    },

    user: {
      movedWire: (subject: string, pin: string) =>
        `${subject} kablosunu ${pin} pinine taşıdın`,
      placedPart: (part: string, pin: string) =>
        `${part} parçasını ${pin} pinine koydun.`,
      removedPart: (part: string) => `${part} parçasını karttan geri aldın.`,
      movedLead: (subject: string, pin: string) =>
        `${subject} ucunu ${pin} pinine taşıdın`,

      /* 1. bölümün dört hareketi. `lead` argümanları belirtme hâlinde,
         `joinedLeads`in ikincisi yönelme hâlinde geliyor — cümlenin kendisi
         hiçbir ek eklemiyor, çünkü ekleyeceği ek her ada uymuyor. */
      seatedLead: (lead: string, pin: string) =>
        `${lead} ${pin} deliğine soktun.`,
      joinedLeads: (a: string, b: string) => `${a} ${b} tutturdun.`,
      looseLead: (lead: string) => `${lead} boşa çıkardın.`,
      releasedJoin: (lead: string) => `${lead} bağlantıdan çıkardın.`,
      removedJoin: "O bağlantıyı kaldırdın.",
      /* Başka bir parça kımıldadığı için karta tutunacak yeri kalmayan
         parça. `removedPart` hareketin kendisi; bu onun sonucu. */
      cameWithIt: (part: string) => `${part} da onunla birlikte geldi.`,
      undone: (sentence: string) => `Geri alındı: ${sentence}`,
      redone: (sentence: string) => `Yeniden yapıldı: ${sentence}`,
      nothingToUndo: "Geri alınacak bir şey yok.",
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
      /* `focused` dizisinin sırası çağıranın bilmesi gereken ama hiçbir yerden
         öğrenemediği bir gerçek: [olması gereken yer, şu anki yer]. Ters
         okuyan bir ajan doğru ucu zaten içinde olduğu deliğe yolluyor. */
      show_correction:
        "Bir bulguyu atölyede işaret eder. focused bakılacak pinleri sıralar — önce olması gereken yer, sonra şu anki yeri.",
      /* İki yarı da, ve her birinin bedeli.

         Bu cümle yalnızca takan yarıyı anıyordu, oysa aracın varsayılanı söken
         yarı: `target` verilmediğinde uç boşa çıkıyor, ve ölçülen tek bir çağrı
         kite iki parça geri gönderip adını hiç anmadığı bir uçtaki bağlantıyı
         kopardı. `name` ve `description`dan kurulan bir araç listesi — bugün
         bir host'un kurabileceği tek liste, çünkü WebMCP tanımlayıcısında sonuç
         şeklini taşıyacak bir `outputSchema` yok — modele bunun izini bile
         göstermiyordu.

         Zararı bildiren üç alan bu yüzden burada anılıyor: host'a ulaşan tek
         kanal bu metin. `Yapımı değiştiren tek araç` kalıyor — §9'un kendi
         nitelemesi, ve `toolKind`a değil yapım grafiğine bakınca doğru: bir
         bağlantıyı yerinden oynatan başka araç yok. */
      attach_lead:
        "Bir parçanın ucunu bir deliğe ya da başka bir uca takar; hedef verilmezse ucu geri boşa çıkarır ve bu, o parçayı — bazen başkalarını da — kite geri gönderebilir. Yapımı değiştiren tek araç; bunun bedelini sonuçtaki loosened, brokeJoins ve leftBench alanları söyler.",
      /* Bütün bağlantılar eşleşse bile bir adım doğrulanmayabilir, ve nedenini
         nereden öğreneceğini şimdiye kadar hiçbir yer söylemiyordu: çeyrek tur
         kaymış bir kol da, programın istemediği bir bağlantı da `matched ===
         expected` bırakıyor. */
      verify_current_step:
        "Mevcut adımı kontrol eder ve tamamlandı işaretler. Bütün bağlantılar eşleşse bile bir adım doğrulanmayabilir: mechanicalOk servo kolunu, strays ise programın istemediği bağlantıları sayar.",
      navigate_build_step: "Başka bir adıma geçer.",
      /* Araç açıklaması her yapım için tarayıcıya olduğu gibi veriliyor, yani
         tek bir yapımın kontrollerini adlandıramaz. Eskiden capstone'un
         üçünü — sensör, servo, LED — tek bir LED'in başında duran bir ajana
         sayıyordu. */
      run_functional_test: "Bu yapımın kendi kontrollerini sırayla çalıştırır.",
      find_projects:
        "Zorluğa, süreye, parçaya veya öğrenme hedefine göre yapım bulur.",
      open_project: "Bir projenin detay ekranını açar.",
      get_project_requirements:
        "Bir projenin parçalarını, süresini, seviyesini ve hedeflerini okur.",
      start_project: "Bir yapımı başlatır ve atölyesini açar.",
    },

    /* Aracın id'si yerine host'un ekrana bastığı ad. Araç adlarının kendisi
       çevrilmiyor (kural 13) — `attach_lead` her iki dilde de `attach_lead`;
       ama `title` alanı okunmak için var, ve okuyan kişi Türkçe okuyor. İkişer
       kelime, ürünün kendi isimleriyle: zaman çizelgesi zaten "Yapım bağlamı
       okundu" ve "Ajan ${lead} taşıdı" diyor, yanındaki araç listesinin başka
       kelimeler kullanması öğrenilecek ikinci bir sözlük olurdu.

       `tools` tablosunun kısası değil. O tablo aracın NE İŞE YARADIĞINI
       söylüyor ve bir cümle; bu, aracın ADININ ne olduğunu söylüyor ve bir
       etiket. İkisinin aynı şeyi söyleyeceği yerde etiket bilerek daha az
       söylüyor.

       `attach_lead` bilerek `Uç yerleştirme` değil `Uç taşıma`: bu araç ucu
       taktığı kadar geri de çıkarıyor, ve yalnızca ekleyen yarısını anan bir
       başlık, açıklamasında düzeltilen eksiği bir alan yukarıda tekrarlardı. */
    toolTitles: {
      get_build_context: "Yapım bağlamı",
      inspect_build: "Yapım incelemesi",
      show_correction: "Düzeltme",
      attach_lead: "Uç taşıma",
      verify_current_step: "Adım kontrolü",
      navigate_build_step: "Adım geçişi",
      run_functional_test: "Yapım testi",
      find_projects: "Proje arama",
      open_project: "Proje ekranı",
      get_project_requirements: "Proje ihtiyaçları",
      start_project: "Yapım başlatma",
    },

    knowledge: {
      title: "Kısa kontrol",
      tryAgain: "Tekrar dene",
      correctMark: "Doğru",

      /* Soru bölümün kendisine ait. Tek bir soru varken — capstone'un Echo
         sorusu — nefes alan lambayı yeni bitirmiş birine, sensörü bile olmayan
         bir devrenin sensör sorusu soruluyordu. */
      chapters: {
        breathingLamp: {
          question: "Direncin kart tarafındaki ucu neden D9'da olmak zorunda?",
          options: [
            {
              id: "pwm",
              label:
                "Sadece bazı pinler açık ile kapalı arasında durabiliyor.",
            },
            { id: "current", label: "D9 diğerlerinden daha çok akım veriyor." },
            { id: "ground", label: "D9 toprak pinine daha yakın." },
          ],
          correctId: "pwm",
          correct:
            "Doğru. Nefes almak dediğimiz şey pinin açıkla kapalı arasında bir yerde durabilmesi, ve bunu sadece ~ işaretli pinler yapabiliyor.",
          incorrect:
            "Tam değil. Uç hangi delikte olursa olsun aynı işi görür; değişen şey, o pinin yalnızca açık ya da kapalı olup olmadığı.",
        },
        trafficLight: {
          /* Soru sıraya değil breadboard'a bakıyor: katalog bu bölümün
             eklediği şeye "breadboard ve şaşmayan sıra" diyor, ve sırayı kişi
             zaten gözüyle gördü. Göremediği, ama inanması istenen şey aynı
             sütundaki iki deliğin birbirine zaten değdiği. */
          question:
            "LED'in kısa bacağı F7'de, direncin ucu J7'de. Bu neden çalışıyor?",
          options: [
            { id: "column", label: "Bir sütundaki beş delik tek bir metal şerit." },
            { id: "row", label: "Bir satırdaki delikler birbirine bağlı." },
            {
              id: "rail",
              label: "Kenarlardaki uzun raylar her şeyi birbirine bağlıyor.",
            },
          ],
          correctId: "column",
          correct:
            "Doğru. Beş delikten oluşan her sütun plastiğin altında tek bir şerit, yani F7'deki bacakla J7'deki bacak zaten birbirine değiyor — eklenecek bir kablo hiç yoktu.",
          incorrect:
            "Tam değil. Bağlı olan sütunlar, satırlar değil: 7. sütundaki beş delik tek bir metal şerit, F7 ile J7 de onlardan ikisi.",
        },
        motionNightLight: {
          /* Sensöre değil pine nişan alıyor. Kişinin gördüğü şey yanan bir
             lamba; inanması istenen ve göremediği şey, bu yapımdaki iki
             pinden birinin yazılmak yerine okunduğu. */
          question: "Lamba D13'te, sensör D2'de. D2'nin farkı ne?",
          options: [
            {
              id: "reads",
              label: "Program onu okuyor — üstünde ne olduğuna sensör karar veriyor.",
            },
            { id: "faster", label: "D2 üstündeki pinlerden daha hızlı anahtarlıyor." },
            { id: "power", label: "Sensöre gücü D2 veriyor." },
          ],
          correctId: "reads",
          correct:
            "Doğru. Bundan öncekilerin hepsi yazılan pinlerdi. D2 okunuyor, ve programın tamamı üstünde ne olduğunu soran bir döngü.",
          incorrect:
            "Tam değil. Sensör + rayından besleniyor, D2'den değil — D2'nin taşıdığı şey sensörün cevabı, ve programın işi onu okumaya devam etmek.",
        },
        plantGuardian: {
          /* İki header arasındaki farka nişan alıyor — bu bölümde kişinin
             göremediği tek şey o: `A0` ile `D2` aynı pirinç, aynı boyut, aynı
             aralık. */
          question: "Prob A0'da. Onun yerine D2'de olsaydı ne değişirdi?",
          options: [
            {
              id: "number",
              label: "Kart yalnızca 0 ya da 1 görürdü, aradaki bir sayıyı hiç görmezdi.",
            },
            {
              id: "nothing",
              label: "Hiçbir şey — program hangi pini adlandırıyorsa onu okur.",
            },
            { id: "power", label: "Prob gücünü kaybeder ve cevap vermeyi bırakırdı." },
          ],
          correctId: "number",
          correct:
            "Doğru. Yalnızca A yazan altı delik bir çeviriciden geçiyor. Dijital bir pin probun gerilimini iki cevaptan birine yuvarlıyor, ve geçebileceğin bir eşiğin duracak yeri kalmıyor.",
          incorrect:
            "Tam değil. Prob her hâlükârda + rayından besleniyor — değişen şey, kartın onun cevabından ne çıkarabildiği. Dijital bir pinin iki değeri var; A0'ın 1024.",
        },
        touchlessSoapDispenser: {
          /* Kartın üstündeki tek bir işarete — `~` — nişan alıyor; bu bölüm
             onun üstünde dönüyor ve ekranda onu daha görünür kılacak hiçbir şey
             yok. */
          question:
            "Servonun turuncu ucu D9'da, ve D9'un yanında ~ var. D4'te olsaydı ne değişirdi?",
          options: [
            {
              id: "angle",
              label: "Kart kola bir açı söyleyemezdi — yalnızca açık ya da kapalı.",
            },
            { id: "power", label: "Servo yeterli akımı alamazdı." },
            { id: "speed", label: "Kol daha yavaş dönerdi." },
          ],
          correctId: "angle",
          correct:
            "Doğru. Servoya bir konum söyleniyor, ve konum iki uç arasında bir değer. Onu ancak ~ işaretli pinler tutabiliyor; başka bir pinde kablolama kusursuz oluyor ve kol hiç kımıldamıyor.",
          incorrect:
            "Tam değil. Servo akımını raylardan çekiyor, sinyal pininden değil — o pinin taşıdığı şey bir talimat, ve açık-kapalı dışında bir şey söyleyebilen pinler yalnızca bazıları.",
        },
        smartParkingBarrier: {
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
        },
      },
    },
  },

  findings: {
    connectionMismatch: "Bağlantı uyuşmazlığı",
    missingConnection: "Bağlantı eksik",
    servoOff: "Servo kolu 90° yanlış",
    notWired: "Bağlı değil",
    unexpectedConnection: "Programda olmayan bir bağlantı",
    notAsked: "Programda yok",

    /* `${observed}` bir pin adı da olabilir bir delik adı da — ikisine birden
       uyan tek bir ek yok, o yüzden cümle onu iki nokta üst üsteden sonra yalın
       bırakıyor; `unexpectedDetail` de aynı sebeple öyle yazılmıştı. Eskiden
       "pinine" diyordu, ve 2–5. bölümde hedeflerin çoğu delik. */
    wrongPin: (subject: string, observed: string, expected: string) =>
      `${subject} şuraya bağlı: ${observed}. Bu yapım ${expected} bekliyor.`,
    /* "Kablo yok" değil: 1. bölümde hiç kablo yok, joinler parçaların kendi
       bacakları. Her bölümde doğru olan şey, ucun hiçbir yere bağlı olmaması. */
    missingWire: (subject: string, expected: string) =>
      `${subject} henüz hiçbir yere bağlı değil. Bu yapım ${expected} bekliyor.`,

    /**
     * Parçanın ucunun yanına bastığı şey — `Echo`, `−`, `220Ω`. Donanımın
     * yazdığı hiçbir şey çevrilmez (kural 13); eksik olan, o işaretin NE
     * üstünde olduğu. `siyah − kablosu` 1. bölümde olmayan bir nesneyi
     * adlandırıyordu. Parçanın hiçbir şey basmadığı uçlar — üründeki bütün
     * jumper uçları — `build.leadObject`'ten adlandırılıyor ve bu tabloya hiç
     * uğramıyor.
     *
     * İki hâl, `leads`/`leadObject` neden iki tabloysa o sebeple: biri cümleyi
     * açıyor, öbürü cümlenin içinde duruyor.
     */
    subjectNominative: {
      leg: (printed: string) => `${printed} bacağı`,
      lead: (printed: string) => `${printed} ucu`,
      "cable-end": (printed: string) => `${printed} ucu`,
    },
    subjectObject: {
      leg: (printed: string) => `${printed} bacağını`,
      lead: (printed: string) => `${printed} ucunu`,
      "cable-end": (printed: string) => `${printed} ucunu`,
    },
    /* `other` bir delik adı (`D13`) da olabilir bir uç adı (`+`, `220Ω`) da —
       ikisine birden uyan tek bir ek yok, o yüzden cümle onu iki nokta
       üst üsteden sonra yalın bırakıyor. */
    unexpectedDetail: (subject: string, other: string) =>
      `${subject} şuraya bağlanmış: ${other}. Program böyle bir bağlantı istemiyor.`,
    servoExplanation: "Program AÇIK konumunu gönderdiğinde bariyer kapanacak.",

    /**
     * İlk basamak, hedefin türü başına bir cümle.
     *
     * Eskiden tek bir cümleydi — "vurgulanan dijital pin sırasıyla karşılaştır"
     * — ve altı bölümün 81 bağlantısının hepsinde basılıyordu; oysa bunların
     * yalnızca 16'sı dijital pin. Kalan 65'i breadboard sütunları, raylar,
     * besleme pinleri, başka bir parçanın bacağı, ve 4. bölümün `A0`'ı: o
     * bölümün bütün dersi olan analog delik, ki merdivenin ilk basamağı okuru
     * ondan uzağa yolluyordu.
     */
    hint: (subject: string) =>
      `${subject} kartın üstünde vurgulanan pinle karşılaştır.`,
    hintAnalog: (subject: string) =>
      `${subject} A harfiyle işaretli altı delikten vurgulananla karşılaştır.`,
    hintPower: (subject: string) =>
      `${subject} kartta vurgulanan besleme piniyle karşılaştır.`,
    hintRow: (subject: string) => `${subject} vurgulanan sütunla karşılaştır.`,
    hintRail: (subject: string) =>
      `${subject} rayda vurgulanan delikle karşılaştır.`,
    hintLead: (subject: string) =>
      `${subject} karşısında vurgulanan uçla karşılaştır.`,

    /**
     * Orta basamak: bu TÜR bağlantı hakkında doğru olan tek şey.
     *
     * Eskiden capstone'un echo cümlesiydi ve altı bölümün her kablolama
     * bulgusunda, iki dilde de basılıyordu. Ürünün 81 bağlantısından tam olarak
     * birinde doğru; 1–4. bölümlerde ultrasonik sensör diye bir şey yok, yani
     * cümle kutuda olmayan bir parçayı anlatıyordu.
     *
     * Altısı da `subject` alıyor ve yazmıyor — `unexpectedExplain` gibi: orta
     * basamak genel kural, tek bir bacağın hikâyesi değil.
     */
    explain: (subject: string, expected: string) =>
      `Pin numarası bir tercih değil, programın parçası: program ${expected} diyor, o sıradaki başka hiçbir deliği değil.`,
    explainAnalog: (subject: string, expected: string) =>
      `Evet-hayır yerine bir sayı verebilen tek yer, A harfiyle işaretli altı delik; programın okuduğu da ${expected}.`,
    explainPower: (subject: string, expected: string) =>
      `${expected} kartın besleme pinlerinden biri. Sinyal taşımaz ve program adını hiç anmaz — oradan geçen şey, tezgahtaki her parçanın ihtiyaç duyduğu akım.`,
    explainRow: (subject: string, expected: string) =>
      `Breadboard'da bir sütunun beş deliği tek parça metaldir. ${expected} deliğindeki bir uç, o sütundaki her şeye bağlıdır — yanındaki sütundaki hiçbir şeye değil.`,
    explainRail: (subject: string, expected: string) =>
      `Bir ray, breadboard boyunca baştan sona tek parça metaldir ve ${expected} onun üstünde. Önemli olan ucun raya ulaşması, hangi deliğini kullandığı değil.`,
    explainLead: (subject: string, expected: string) =>
      `Bu bağlantıyı kart kurmuyor. Metal metale değecek: bu ucun ${expected} değmesi gerekiyor.`,

    /**
     * Son basamak, ve tek cümle değil iki cümle.
     *
     * `exact` tek şablondu ve `observed ?? ""` alıyordu, yani hiçbir deliğe
     * takılmamış bir uç için "… pininden … pinine taşı" cümlesi boş bir
     * kaynakla, havada kalmış bir ekle basılıyordu. Eksik bağlantı bir
     * TAKMA'dır; yalnızca yanlış yerdeki bağlantı bir taşımadır.
     *
     * Renk de gitti: `wire.colour` "kabloyu sesli isterken kullanacağın renk" —
     * capstone'un boştaki jumperı — ve ekranda hiçbir şeye karşılık gelmiyordu.
     */
    exactMove: (subject: string, from: string, to: string) =>
      `${subject} ${from} pininden ${to} pinine taşı.`,
    exactMoveHole: (subject: string, from: string, to: string) =>
      `${subject} ${from} deliğinden çıkar ve ${to} deliğine tak.`,
    exactPut: (subject: string, to: string) => `${subject} ${to} pinine tak.`,
    exactPutHole: (subject: string, to: string) => `${subject} ${to} deliğine tak.`,
    /* Adres olmayan tek hedef: başka bir parçanın kendi ucu. Ne taşıma var ne
       takma — iki metalin birbirine değmesi gerekiyor. */
    exactJoin: (subject: string, to: string) => `${subject} ${to} tuttur.`,

    /* Kablolama merdiveninin aynı üç basamağı. Orta basamak `subject` alıyor
       ama yazmıyor: oradaki cümle genel kural, tek bir bacağın hikâyesi
       değil. Argüman, üç basamağın aynı şekilde çağrılabilmesi için duruyor. */
    /* Artık ekli isim yok: `subject` sözlükten çekilmiş hâlde geliyor
       ("Jumper kablonun kart ucunu", "− bacağını"), ve şablonun sonuna bir isim
       ekleyip ekten kaçması gerekmiyor. */
    unexpectedHint: (subject: string) =>
      `${subject} tek tek izle: nereye değiyor?`,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    unexpectedExplain: (subject: string) =>
      "Bu yapımın ihtiyacı olan her bağlantı programda yazıyor; bu onlardan biri değil. Kimsenin istemediği bir bağlantı da akımın bulacağı bir yoldur.",
    unexpectedExact: (subject: string) => `${subject} çöz ve boşta bırak.`,

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
    resolvedExtra: "O bağlantı kalktı",

    partNotPlaced: "Bir parça hâlâ kitte",
    partNotPlacedDetail: (part: string) =>
      `Bu adım ${part} parçasını kabloluyor, ve o henüz tezgahta değil.`,
    partNotPlacedHint: (part: string) =>
      `${part} parçasını tezgahın üstündeki kit şeridinden al.`,
    partNotPlacedExplain: (part: string) =>
      `${part} karta oturmadan onun hakkında hiçbir şey kontrol edilemez — kutudaki bir parçanın doğru ya da yanlış olacak pini yoktur.`,
    partNotPlacedExact: (part: string) =>
      `${part} parçasını kit şeridinden karta sürükle, ya da üzerinde Enter'a basıp ok tuşlarıyla bir delik seç.`,
    resolvedPart: "O parça artık tezgahta",
    onTheBench: "Tezgahta",
    inTheKit: "Hâlâ kitte",
    resolvedServo: "Kol artık hizalı",
    resolvedMeta: "Doğrulandı",
    checkedStillOpen: "Kontrol edildi · hâlâ açık",
    checkedUnreachable: "Henüz kontrol edilemez · parça kitte",
    severity: {
      critical: "Kritik",
      warning: "Uyarı",
      info: "Bilgi",
    },
    openCount: (n: number) => `${n} açık bulgu`,
  },

  /* W-03 · The third column.

     It sells the mechanism, not the mechanism's parts list. An earlier draft
     printed all ten tool names here and it was the wrong screen for them: a
     person choosing a kit does not need the agent's vocabulary, they need to
     know that the agent has hands at all. Written for a twelve-year-old, and
     short enough that the whole thing is read rather than skimmed. */
  coach: {
    title: "Bu sayfa ajanla konuşabiliyor",
    lead: "Yapay zekâ çoğu yerde sadece yazı yazar. Burada öyle değil.",
    body: "WebMCP sayesinde sayfa, ajana kendi düğmelerini veriyor. Ajan da o düğmelere basıyor.",
    canTitle: "Yani ajan şunları yapabiliyor",
    canLook: "Kurduğun devreye bakar.",
    canFind: "Yanlış takılan kabloyu bulur.",
    canShow: "Nerede olduğunu ekranda gösterir.",
    canCheck: "Sen düzeltince kontrol eder.",
    limit: "Sayfanın vermediği hiçbir şeyi yapamaz. Neyi görebileceğine sayfa karar verir.",
  },
  workspace: {
    projects: "PROJELER",
    kit: "KİT",
    openCase: "Kit çantasını aç",
    closeCase: "Kit çantasını kapat",
    caseHint: "İçine bakmak için çantaya bas",
    moreProjects: "Sonraki projeler",
    firstProjects: "Başa dön",
    caseCaption: (project: string) => `${project} — kit çantası`,
    inventory: "Kutuda ne var",
    startTitle: "Çalışmaya başla",
    noBenchYet: (project: string) =>
      `${project} için rehberli tezgah henüz yok.`,
    previewNote:
      "Bu yapımın rehberli atölyesi henüz yok. Kiti ve adımları gerçek.",
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
    boardValueShort: "UNO R3 · simüle",
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
    /* The capstone's whole-build run. See the English twin: an id with no word
       here reaches the screen as itself. */
    full_system: "Yapımın tamamı",
    /* 1. bölümün iki kontrolü. Satır adları yapımın kendi kontrol
       kimliklerinden geliyor; sözlükte karşılığı olmayan bir kimlik ham hâliyle
       yazılır. */
    wiring: "Bağlantılar okunuyor",
    breathing: "Lamba nefes alıyor mu",
    /* 2. bölümünki. Adı sonucu değil okuduğu şeyi söylüyor: her sürücü
       kablonun gerçekte hangi pine ulaştığını programın adlandırdığı üçüyle
       karşılaştırıyor, ve bir delik yanlıştaki kablo o lambayı tur boyunca
       karanlıkta bırakıyor. */
    sequence: "Işık sırası okunuyor",
    /* 3. bölümünki, ve aynı biçimde adlandırılmış: sensörün cevabının hangi
       pine, lambanın kablosunun hangi pine ulaştığını programın adlandırdığı
       ikisine karşı okuyor. İki bağlantı da yapılmış olabilir ve yapım yine de
       hiçbir şeyi fark etmeyen bir lamba olabilir. */
    senses: "İki pin okunuyor",
    /* 4. bölümünki, ve adı tam da ayırdığı şey: satır probun kablolanıp
       kablolanmadığını sormuyor, ulaştığı deliğin bir sayı bildirip
       bildiremediğini soruyor. Dijital bir pin her bağlantı testini geçer ve
       0 ya da 1023 der, arada hiçbir şey demez. */
    reads: "Sayı mı okunuyor, evet mi",
    /* 5. bölümün ikisi. `distance` kartın tetiklediği yankıyı okuyup
       okumadığını soruyor; `sweep` ise pompaya bir açı söyleyip
       söyleyemediğini — ki bu, servonun kablolanıp kablolanmadığından farklı
       bir soru. */
    distance: "Mesafe okunuyor",
    sweep: "Pompaya açı söylenebiliyor mu",
    states: {
      idle: "Başlamadı",
      running: "Çalışıyor",
      passed: "Geçti",
      failed: "Başarısız",
      skipped: "Atlandı",
    },
    summary: {
      idle: "Henüz test çalışmadı",
      idleDetail: "Tam test, bitmiş yapımı baştan sona çalıştırır.",
      running: "Fonksiyonel test çalışıyor",
      passed: (n: number) => `${n} kontrolün hepsi geçti`,
      passedDetail: "Yapımın her kontrolü beklendiği gibi cevap verdi.",
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
    backToBench: "Tezgaha dön",
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
    assisted: (n: number) => `Bu yapımın ${n} hareketini ajan yaptı`,
    assistedDetail:
      "Ajan senin için parça takabiliyor. Yaptıkları da yapımın bir parçası — bu yüzden burada yazıyor.",
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
