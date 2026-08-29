/**
 * F-10 · Copy layer — the decisions desk.
 *
 * Deliberately thin. Every direction on that page already carries its own name
 * and its own argument, written where the direction was built — `deviceLab`,
 * `libraryLab`, `workbenchLab` — and this page reads them from there. What is
 * here is only what the desk itself adds: the question each decision answered,
 * and where the answer landed.
 *
 * Re-stating the arguments here would be the finding-card mistake at the scale
 * of a page: one rationale in two places, drifting.
 */

const en = {
  page: {
    overline: "Decisions",
    title: "Three directions, settled",
    intro:
      "Every batch that ended with a question left both answers standing in the lab rather than picking one. These three were answered together, on one screen — which mattered, because two of them are the same question at different distances: how much a surface should say.",
    note: "The losing direction is not deleted. It stays built, and it stays here, because a decision you cannot see the alternative to is not a decision anyone can revisit — the same reason eight button directions are still live at /lab/buttons.",
    sectionsNav: "Decisions on this page",
    seeFull: "The full comparison",
    chosen: "Chosen",
  },

  /* Where each answer landed. Short on purpose: the argument lives on the page
     the direction was built on. */
  settled: {
    telemetry:
      "The device dock now opens on the measurement, above the board's static particulars. `Last serial output` stays below it — after a run that line reads `Barrier: closed`, not a distance.",
    card:
      "S-02 and S-03 are both grids of these, and both get the full inventory. The card answers what is in the box.",
    camera:
      "The inspection frame carries no camera furniture. `Demo vision result` and the capture time sit under the image, in the interface's own voice.",
  },

  telemetry: {
    code: "D-04",
    title: "Telemetry readout",
    question: "Is a live distance a number, or a shape?",
  },

  card: {
    code: "P-01",
    title: "Project card",
    question: "How much can a card say?",
    hint: "Read the grids, not the cards. Every card looks fine on its own.",
  },

  camera: {
    code: "W-06",
    title: "Mock camera frame",
    question: "How much should the camera look like a camera?",
  },
};

type Section = typeof en;

const tr: Section = {
  page: {
    overline: "Kararlar",
    title: "Üç yön, karara bağlandı",
    intro:
      "Soruyla biten her batch, birini seçmek yerine iki cevabı da lab'da canlı bıraktı. Bu üçü birlikte, tek ekranda cevaplandı — ki bu önemliydi, çünkü ikisi aynı soruyu farklı mesafeden soruyor: bir yüzey ne kadar şey söylemeli.",
    note: "Kaybeden yön silinmiyor. Kurulu kalıyor ve burada duruyor; çünkü alternatifini göremediğin bir karar, kimsenin sonradan tartabileceği bir karar değildir — sekiz buton yönünün hâlâ /lab/buttons'ta canlı durmasının sebebi de bu.",
    sectionsNav: "Bu sayfadaki kararlar",
    seeFull: "Tam karşılaştırma",
    chosen: "Seçildi",
  },

  settled: {
    telemetry:
      "Cihaz dock'u artık ölçümle açılıyor, kartın değişmeyen künyesinin üstünde. `Son seri çıktı` altında kalıyor — bir koşudan sonra o satırda mesafe değil `Barrier: closed` yazıyor.",
    card:
      "S-02 de S-03 de bunların ızgarası, ve ikisi de tam envanteri alıyor. Kart, kutuda ne olduğunu cevaplıyor.",
    camera:
      "İnceleme karesinde kamera mobilyası yok. `Demo görüntü sonucu` ve alınma saati görüntünün altında, arayüzün kendi sesinde duruyor.",
  },

  telemetry: {
    code: "D-04",
    title: "Telemetri okuması",
    question: "Canlı bir mesafe bir sayı mı, bir şekil mi?",
  },

  card: {
    code: "P-01",
    title: "Proje kartı",
    question: "Bir kart ne kadar şey söyleyebilir?",
    hint: "Kartlara değil ızgaralara bak. Her kart kendi başına iyi görünüyor.",
  },

  camera: {
    code: "W-06",
    title: "Kamera karesi",
    question: "Kamera ne kadar kamera gibi görünmeli?",
  },
};

export const decisions = { en, tr };
