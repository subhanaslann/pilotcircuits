/**
 * The lab's own chrome: the batch list in the navigation, the index, the
 * and the way back to the product.
 *
 * The batch titles live here rather than in `lab-manifest.ts` because the
 * manifest is structure — ids, counts, statuses, routes — and structure does
 * not change with language. Looked up by the same batch id.
 */

const en = {
  batches: {
    foundations: {
      title: "Foundations",
      summary:
        "Colour, wire palette, type, spacing, radius, motion, focus, copy",
    },
    atoms: {
      title: "Atoms",
      summary: "Buttons, badges, chips, inputs, segmented control, progress",
    },
    molecules: {
      title: "Molecules",
      summary: "Cards, panels, tabs, toolbars, popovers, modals, alerts",
    },
    canvas: {
      title: "Circuit canvas",
      summary: "Board, breadboard, sensor, servo, LEDs, wires, rings, overlays",
    },
    agent: {
      title: "Agent workspace",
      summary:
        "Guidance, findings, corrections, activity timeline, tool details",
    },
    device: {
      title: "Device & test",
      summary: "Dock, serial monitor, telemetry, test runner rows",
    },
    library: {
      title: "Project library",
      summary: "Project cards, illustrations, filters, kit checklist, icons",
    },
    workbench: {
      title: "Workbench & inspection",
      summary:
        "Topbar, step rail, four-zone layout, vision overlays, demo menu",
    },
    screens: {
      title: "Screens",
      summary: "Dashboard, library, detail, workbench, completion",
    },
  },

  nav: {
    labSuffix: "Lab",
    /* Browser tab for every /lab route; the page's own title sits in front. */
    labTitle: "Design lab",
    ariaLabel: "Design lab batches",
    approvedOf: (approved: number, total: number) =>
      `${approved}/${total} batches approved`,
    materials: (n: number) => `${n} materials`,
    notDesignedYet: "Not designed yet",
    status: {
      approved: "Approved",
      inProgress: "In design",
      pending: "Pending",
    },
    openDecisions: "Decisions",
    /* Answered together on one screen, and kept there afterwards — a choice
       whose alternative has been deleted is one nobody can revisit. */
    threeDirections: "Three directions",
    threeDirectionsHint: "D-04 · P-01 · W-06 · settled",
    buttonDirections: "Button directions",
    buttonDirectionsHint: "8 live options · pick one",
    footer: "Internal design surface. Not part of the shipped product.",
    /* Batch 8 · the product now has screens of its own, so the lab needs a way
       out of itself. Until this batch `/` was a placeholder that linked here;
       the link runs the other way round now. */
    backToProduct: "Back to the product",
  },
};

type Section = typeof en;

const tr: Section = {
  batches: {
    foundations: {
      title: "Temeller",
      summary:
        "Renk, kablo paleti, tipografi, boşluk, köşe, hareket, odak, metin",
    },
    atoms: {
      title: "Atomlar",
      summary:
        "Butonlar, rozetler, çipler, alanlar, segment kontrolü, ilerleme",
    },
    molecules: {
      title: "Moleküller",
      summary:
        "Kartlar, paneller, sekmeler, araç çubukları, popover, modal, uyarı",
    },
    canvas: {
      title: "Devre kanvası",
      summary:
        "Kart, breadboard, sensör, servo, LED'ler, kablolar, halkalar, katmanlar",
    },
    agent: {
      title: "Ajan çalışma alanı",
      summary:
        "Rehberlik, bulgular, düzeltmeler, etkinlik çizelgesi, araç ayrıntıları",
    },
    device: {
      title: "Cihaz ve test",
      summary: "Dock, seri monitör, telemetri, test koşucusu satırları",
    },
    library: {
      title: "Proje kütüphanesi",
      summary: "Proje kartları, çizimler, filtreler, kit listesi, ikonlar",
    },
    workbench: {
      title: "Atölye ve inceleme",
      summary:
        "Üst çubuk, adım rayı, dört bölgeli düzen, görüntü katmanları, demo menüsü",
    },
    screens: {
      title: "Ekranlar",
      summary: "Panel, kütüphane, detay, atölye, tamamlama",
    },
  },

  nav: {
    labSuffix: "Lab",
    labTitle: "Tasarım lab'ı",
    ariaLabel: "Tasarım lab'ı batch'leri",
    approvedOf: (approved: number, total: number) =>
      `${total} batch'ten ${approved} tanesi onaylı`,
    materials: (n: number) => `${n} materyal`,
    notDesignedYet: "Henüz tasarlanmadı",
    status: {
      approved: "Onaylandı",
      inProgress: "Tasarımda",
      pending: "Bekliyor",
    },
    openDecisions: "Kararlar",
    threeDirections: "Üç yön",
    threeDirectionsHint: "D-04 · P-01 · W-06 · karara bağlandı",
    buttonDirections: "Buton yönleri",
    buttonDirectionsHint: "8 canlı seçenek · birini seç",
    footer: "İç tasarım yüzeyi. Ürünün parçası değil.",
    backToProduct: "Ürüne dön",
  },
};

export const shell = { en, tr };
