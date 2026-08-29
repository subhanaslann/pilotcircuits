/**
 * F-10 · Copy layer — Batch 5 · Device dock & test (design lab).
 *
 * Lab prose only: section headers, block notes and the specimen labels around
 * them. Everything the dock itself says still comes from `copy.device.*` and
 * `copy.test.*`, so a wrong translation shows up on this page before it ships.
 *
 * Same contract as the other section files: `const en` without `as const` so
 * the Turkish side is not forced to repeat the English literals, and
 * `const tr: Section` so a missing key is a compile error rather than a gap on
 * the page.
 *
 * What stays in English on both sides: material codes (`D-01`), hardware
 * values (`5V`, `18 cm`), CSS token names (`surface-sunken`, `cp-sweep`) and
 * the serial lines themselves — those are the board talking, not the product.
 */

const en = {
  page: {
    overline: "Batch 5",
    title: "Device & test",
    intro:
      "The strip under the canvas, and what happens in it when the build is asked to prove itself. Batch 3 gave the functional test a stage — a car rolls up, the sensor pings, the gate answers. Nobody could see the numbers. This is the same sequence read the other way: one timeline, two readings, one of them countable.",
    ruleLead: "Nothing here is invented. Six of the seven materials are ",
    ruleEmphasis: "assembly",
    ruleRest:
      " — the tab bar, the key-value row, the status badge, the step loader and both dictionaries were all approved in earlier batches. What is new is the shell that holds them and the wiring that makes them move at the same moment the canvas does.",
    sectionsNav: "Sections on this page",
  },

  dock: {
    title: "The dock",
    description:
      "A narrow strip that opens to 224px and folds back to 44px, without ever taking the canvas away.",
    shellTitle: "Open and shut",
    shellNote:
      "Not a Drawer. The bottom drawer in overlay.tsx is a modal — portal, scrim, focus trap, Escape — and every one of those is wrong for a region that is part of the workbench permanently. This is an ordinary section whose height animates between two tokens. Ground is surface-sunken, the same footing as the canvas well, because a dock represents a device: a real object, not something the agent said (rule 4).",
    railNote:
      "The rail never changes shape. Collapsed or open it is the same three tabs and the same status chip; only the body below grows. Choosing a tab while shut opens the dock on it — asking to see something is asking for it to be visible. Folded, the body is inert, because content clipped out of view is still tabbable and that is how a shut dock steals focus into things nobody can see.",
    stateTitle: "Test status",
    stateNote:
      "D-07 is not a new badge variant. It is A-03's capsule with the four words the dock already owns, and each state changes glyph as well as colour (rule 7): dashed ring, lattice, tick, triangle. The triangle is the top of the severity scale everywhere in this product, and a failed functional test is the top of it. Running borrows the activity pulse rather than inventing a second in-progress animation — same organism, same drawing.",
    infoTitle: "Device info",
    infoNote:
      "Labels are prose and translate; values are what the board says and do not. Simulated UNO-compatible board is the exception that proves the rule — that is the product describing the board, not the board describing itself. Test status is not a row here even though the brief lists it: the rail already carries it, on every tab, with the dock shut.",
    toggleOpen: "Open",
    toggleShut: "Shut",
  },

  serial: {
    title: "Serial monitor and telemetry",
    description:
      "What the board says while something approaches it, and the open question of how one live number should be drawn.",
    monitorTitle: "The log",
    monitorNote:
      "Nothing in this list is ever translated. Rule 13 says mono is what the hardware said, and a serial log is that rule at its purest — the words are the sketch's output, not the product's. It is also the one legitimate exception to the rule Batch 4 settled, that no sentence is kept in state: a reading is not a sentence, so it has no translation to go stale. Everything around the log — the region name, the empty state, the tab — comes from the dictionary as usual.",
    barrierNote:
      "The two Barrier lines are identical whether the test passes or fails, and that is the point. This build's servo fault is mechanical — the horn is fitted a quarter turn out — so the sketch commands OPEN and the board reports that it opened. The opposite happens in the room, and only the canvas and the inspection can see it. A board that printed Barrier: wrong direction would be a board that already knew, and if it knew, the agent would have nothing to find.",
    telemetryTitle: "Number or shape?",
    telemetryNote:
      "Both directions, same readings, side by side — the project's way of deciding. Rule 5 wants countable things counted, and a distance is not countable, so neither direction can be a row of ticks. Rule 12 allows two gradients in the whole product and neither is a chart, so a filled sparkline is out; a hairline stroke is not a gradient, which is the only reason B is admissible. Teal rather than accent, because the canvas already prints this same reading in teal beside the sensor, and accent belongs to the agent.",
    directionA: "A · The number, large",
    directionANote:
      "Borrows A-15's big mono verbatim rather than inventing a size. The cost is honest: at this weight a continuous reading starts to look like a gauge, and this is not an instrument panel.",
    directionB: "B · The reading, in the dock's rhythm",
    directionBNote:
      "The same shape as a key-value row, so it belongs to the Device tab's family instead of arriving as a widget. The trace carries no fact the number does not, which is what lets it be hidden from assistive tech without losing anything.",
    play: "Run the approach",
    replay: "Again",
  },

  test: {
    title: "Test rows and the verdict",
    description:
      "Three named checks and one sentence about how it went — the numeric half of the sequence the canvas plays as theatre.",
    rowsTitle: "The three rows",
    rowsNote:
      "A-17 fed, not rewritten. The label is the activity, because that is what the row is doing while you watch it; the detail slot is whatever the board measured, so it is mono and untranslated. A detail replaces the state word, which is why a failed row never carries one — rule 9 wants the outcome said in a word, and Failed is the word.",
    sweepTitle: "The correction to A-17",
    sweepNote:
      "Batch 1 wrote sweeps rather than spins into this component's comment and then shipped a spinning Loader2 — a generic spinner, which rule 8 forbids outright. One row hid it; three rows in a dock made it three competing cogs. The running glyph is now a bar crossing the ring, reusing cp-sweep from globals.css rather than writing a keyframe here. Under reduced motion the bar is hidden and the accent ring stands beside the word, so the state never rides on motion alone. Corrected the same way Batch 4 corrected Alert's severity glyphs after Batch 2 was approved.",
    verdictTitle: "The verdict",
    verdictNote:
      "One sentence, no box — the editorial register, because this is the interface telling you how it went. It does not repeat the three subjects: the rows above already name which check failed, and a summary listing them again would be Batch 4's finding-card mistake, one fact in two places. No percentage either — three checks are countable, so they are counted.",
    runPassing: "Run a passing test",
    runFailing: "Run with the servo still wrong",
    statesLabel: "Every row state",
  },

  live: {
    title: "One run, read twice",
    description:
      "The dock and the canvas driven by the same run_functional_test call — the same tool a WebMCP callback invokes in Batch 7, with no second demo path behind it.",
    note: "Press Run full test and watch both halves at once: the car rolls up, the readings fall in the monitor as the sonar pings, the three rows settle in order. Then the contradiction — the light goes green, the log says Barrier: opening, and the arm does not move. The horn is fitted a quarter turn out, so the sketch is obeyed and the room disagrees. Fix the servo and run it again: the same clock, the same list of readings, a gate that answers.",
    canvasLabel: "Smart Parking Barrier circuit",
    fixWiring: "Fix the Echo wire",
    wiringFixed: "Echo on D7",
    fixServo: "Fix the servo",
    servoFixed: "Servo aligned",
    persistNote:
      "When the car has gone, the canvas clears and the dock does not. The theatre was a scene; the log and the verdict are a record, and a record is what you turn to afterwards.",
  },
};

type Section = typeof en;

const tr: Section = {
  page: {
    overline: "Batch 5",
    title: "Cihaz ve test",
    intro:
      "Kanvasın altındaki şerit ve yapımdan kendini kanıtlaması istendiğinde orada olan biten. Batch 3 fonksiyonel teste bir sahne verdi — araba yaklaşır, sensör ses gönderir, bariyer cevap verir. Sayıları kimse göremiyordu. Burası aynı sekansın öteki okuması: tek zaman çizelgesi, iki okuma, biri sayılabilir.",
    ruleLead: "Burada hiçbir şey icat edilmedi. Yedi materyalin altısı ",
    ruleEmphasis: "birleştirme",
    ruleRest:
      " — sekme çubuğu, anahtar-değer satırı, durum rozeti, adım yükleyicisi ve iki sözlük de önceki batch'lerde onaylandı. Yeni olan, onları tutan kabuk ve hepsini kanvasla aynı anda hareket ettiren tesisat.",
    sectionsNav: "Bu sayfadaki bölümler",
  },

  dock: {
    title: "Panel",
    description:
      "224px'e açılan, 44px'e katlanan dar bir şerit — kanvası hiçbir zaman elinden almadan.",
    shellTitle: "Açık ve kapalı",
    shellNote:
      "Drawer değil. overlay.tsx'teki alt drawer bir modal — portal, scrim, focus trap, Escape — ve bunların hepsi, atölyenin kalıcı bir parçası olan bir bölge için yanlış. Bu, yüksekliği iki token arasında animasyonlanan sıradan bir section. Zemin surface-sunken, yani kanvas kuyusuyla aynı: bir dock bir cihazı temsil eder, yani gerçek bir nesneyi — ajanın söylediği bir şeyi değil (kural 4).",
    railNote:
      "Şerit hiç şekil değiştirmez. Kapalı da olsa açık da olsa aynı üç sekme ve aynı durum çipidir; yalnızca altındaki gövde büyür. Kapalıyken bir sekme seçmek dock'u o sekmede açar — bir şeyi görmek istemek, onun görünür olmasını istemektir. Katlıyken gövde inert, çünkü görüntü dışına kırpılmış içerik hâlâ tab'lanabilir ve kapalı bir dock odağı tam böyle çalar.",
    stateTitle: "Test durumu",
    stateNote:
      "D-07 yeni bir rozet varyantı değil. A-03'ün kapsülü, dock'un zaten sahip olduğu dört kelimeyle; her durum renkle birlikte glif de değiştiriyor (kural 7): kesik halka, kafes, tik, üçgen. Üçgen bu üründe her yerde severity ölçeğinin en üstü, ve başarısız bir fonksiyonel test de öyle. Çalışıyor durumu ikinci bir devam ediyor animasyonu icat etmek yerine etkinlik nabzını ödünç alıyor — aynı organizma, aynı çizim.",
    infoTitle: "Cihaz bilgisi",
    infoNote:
      "Etiketler düzyazıdır ve çevrilir; değerler kartın söyledikleridir ve çevrilmez. Simüle UNO uyumlu kart kuralı doğrulayan istisna — orada kartı anlatan ürün, kendini anlatan kart değil. Test durumu, brief listelese de burada bir satır değil: şerit onu zaten taşıyor, her sekmede ve dock kapalıyken.",
    toggleOpen: "Açık",
    toggleShut: "Kapalı",
  },

  serial: {
    title: "Seri monitör ve telemetri",
    description:
      "Bir şey yaklaşırken kartın söyledikleri, ve tek bir canlı sayının nasıl çizilmesi gerektiğine dair açık soru.",
    monitorTitle: "Kayıt",
    monitorNote:
      "Bu listedeki hiçbir şey çevrilmez. Kural 13 mono olanın donanımın söylediği olduğunu söyler; seri kayıt bu kuralın en saf hâli — oradaki kelimeler programın çıktısı, ürünün değil. Aynı zamanda Batch 4'te kurulan state'te cümle durmaz kuralının tek meşru istisnası: bir okuma cümle değildir, yani bayatlayacak bir çevirisi de yoktur. Kaydın etrafındaki her şey — bölge adı, boş durum, sekme — her zamanki gibi sözlükten gelir.",
    barrierNote:
      "İki Barrier satırı, test geçse de kalsa da aynıdır; asıl mesele bu. Bu yapımdaki servo hatası mekanik — kol çeyrek tur yanlış takılmış — yani program AÇIK komutunu veriyor ve kart da açtığını bildiriyor. Odada tam tersi oluyor ve bunu yalnızca kanvas ile inceleme görebiliyor. Barrier: wrong direction yazan bir kart, zaten bilen bir kart olurdu; bilseydi de ajanın bulacağı bir şey kalmazdı.",
    telemetryTitle: "Sayı mı, şekil mi?",
    telemetryNote:
      "İki yön, aynı okumalar, yan yana — projenin karar verme biçimi. Kural 5 sayılabilir şeyin sayılmasını ister, mesafe sayılabilir değildir; yani hiçbir yön tick dizisi olamaz. Kural 12 ürünün tamamında iki gradient'e izin veriyor ve ikisi de grafik değil, yani dolgulu sparkline eleniyor; ince bir çizgi gradient değildir, B'nin kabul edilebilir olmasının tek sebebi bu. Accent değil turkuaz, çünkü kanvas bu aynı okumayı sensörün yanında zaten turkuaz yazıyor, ve accent ajanın rengi.",
    directionA: "A · Sayı, büyük",
    directionANote:
      "Bir boyut icat etmek yerine A-15'in büyük monosunu birebir ödünç alıyor. Bedeli açık: bu ağırlıkta sürekli bir okuma gösterge paneline benzemeye başlıyor, oysa burası bir alet panosu değil.",
    directionB: "B · Okuma, dock'un ritminde",
    directionBNote:
      "Anahtar-değer satırıyla aynı şekil, yani bir widget olarak gelmek yerine Cihaz sekmesinin ailesine ait. İz, sayının taşımadığı hiçbir bilgiyi taşımıyor; ekran okuyucudan gizlenebilmesinin sebebi de bu.",
    play: "Yaklaşmayı çalıştır",
    replay: "Tekrar",
  },

  test: {
    title: "Test satırları ve karar",
    description:
      "Üç adlandırılmış kontrol ve nasıl gittiğine dair tek cümle — kanvasın tiyatro olarak oynadığı sekansın sayısal yarısı.",
    rowsTitle: "Üç satır",
    rowsNote:
      "A-17 besleniyor, yeniden yazılmıyor. Etiket eylemin kendisi, çünkü sen bakarken satırın yaptığı şey o; detay yuvası ise kartın ölçtüğü şey, yani mono ve çevrilmemiş. Detay, durum kelimesinin yerine geçiyor; başarısız bir satırın hiç detay taşımamasının sebebi de bu — kural 9 sonucun bir kelimeyle söylenmesini istiyor, ve o kelime Başarısız.",
    sweepTitle: "A-17'ye yapılan düzeltme",
    sweepNote:
      "Batch 1 bu bileşenin yorumuna dönmez, süpürür yazdı ve sonra dönen bir Loader2 gönderdi — kural 8'in doğrudan yasakladığı jenerik spinner. Tek satırken saklıydı; dock'ta üç satır olunca üç ayrı çarka dönüştü. Çalışan glif artık halkayı kat eden bir çubuk, ve burada keyframe yazmak yerine globals.css'teki cp-sweep'i kullanıyor. Azaltılmış harekette çubuk gizleniyor, accent halka kelimenin yanında duruyor; yani durum hiçbir zaman yalnızca harekete binmiyor. Batch 4'ün, Batch 2 onaylandıktan sonra Alert'in severity gliflerini düzelttiği gibi düzeltildi.",
    verdictTitle: "Karar",
    verdictNote:
      "Tek cümle, kutu yok — editoryal kayıt, çünkü burada nasıl gittiğini sana arayüz söylüyor. Üç konuyu tekrarlamıyor: yukarıdaki satırlar hangi kontrolün kaldığını zaten söylüyor, ve onları yeniden listeleyen bir özet Batch 4'ün bulgu kartı hatası olurdu — tek olgu, iki yerde. Yüzde de yok: üç kontrol sayılabilir, o yüzden sayılıyor.",
    runPassing: "Geçen bir test çalıştır",
    runFailing: "Servo hâlâ yanlışken çalıştır",
    statesLabel: "Bütün satır durumları",
  },

  live: {
    title: "Tek koşu, iki okuma",
    description:
      "Dock ve kanvas aynı run_functional_test çağrısıyla sürülüyor — Batch 7'de bir WebMCP geri çağrısının çağıracağı araçla aynısı, arkasında ikinci bir demo yolu olmadan.",
    note: "Tam testi çalıştır'a bas ve iki yarıyı aynı anda izle: araba yaklaşır, sonar ses gönderirken okumalar monitöre düşer, üç satır sırayla oturur. Sonra çelişki — ışık yeşile döner, kayıt Barrier: opening yazar, ve kol kıpırdamaz. Kol çeyrek tur yanlış takılı, yani programa uyuluyor ve oda aynı fikirde değil. Servoyu düzelt ve yeniden çalıştır: aynı saat, aynı okuma listesi, cevap veren bir bariyer.",
    canvasLabel: "Akıllı Otopark Bariyeri devresi",
    fixWiring: "Echo kablosunu düzelt",
    wiringFixed: "Echo D7'de",
    fixServo: "Servoyu düzelt",
    servoFixed: "Servo hizalı",
    persistNote:
      "Araba gidince kanvas temizleniyor, dock temizlenmiyor. Tiyatro bir sahneydi; kayıt ile karar ise bir tutanak, ve sonrasında dönüp bakılan şey tutanaktır.",
  },
};

export const device = { en, tr };
