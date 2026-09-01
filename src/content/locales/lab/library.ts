/**
 * F-10 · Copy layer — Batch 6 · Project library (design lab).
 *
 * Lab prose only. Everything the widgets themselves say comes from
 * `copy.projects.*`, `copy.components.*`, `copy.concepts.*` and
 * `copy.library.*`, so a missing translation shows up on this page rather than
 * in the product.
 *
 * Same contract as the other section files: `const en` without `as const`,
 * `const tr: Section` so a missing key is a compile error.
 */

const en = {
  page: {
    overline: "Batch 6",
    title: "Project library",
    intro:
      "Everything a person sees before the workbench opens: the cards that describe a build, the toolbar that narrows seven down to one, and the checklist that gets a kit ready. Half of this batch is not composition at all — it is the data that did not exist yet, and sixteen drawings.",
    ruleLead: "The question the batch turns on is how much a card can ",
    ruleEmphasis: "say",
    ruleRest:
      ". The brief asks for nine fields and, in the same paragraph, for no bulky cards. Rule 3 asks that seven badges side by side read as one calm system rather than seven separate emphases. Seven cards in a grid is where those two sentences collide.",
    sectionsNav: "Sections on this page",
  },

  model: {
    title: "The seven projects",
    description:
      "The data the rest of the batch is built on — which did not exist in the repository until now.",
    note: "Same contract as the seven build steps: structure in lib/, words in the dictionary, both keyed by the same id. How long a build takes and which parts it needs are the same in every language; what it is called is not. Only Smart Parking Barrier is ready — the other six are honestly labelled preview, which is a product fact rather than a placeholder.",
    tableCaption: "Project catalogue",
    colProject: "Project",
    colStatus: "Status",
    colTime: "Time",
    colLevel: "Level",
    colSteps: "Steps",
    colParts: "Parts",
    colConcepts: "Concepts",
    vocabularyTitle: "The component vocabulary",
    vocabularyNote:
      "Sensor is generic on purpose: distance, soil moisture, motion and temperature share one word and one mark, which keeps seven builds inside one small set instead of growing an icon per part. Push button is the one addition to the nine the inventory names — the reaction game is a person pressing a button when a light comes on, and calling that a sensor would be the kind of small lie that makes a legend untrustworthy.",
    conceptsTitle: "What the builds teach",
    conceptsNote:
      "Labels rather than sentences, because they sit in chips on a card and in a list on a detail page and both want the same words. A card shows the first three; the detail page shows all of them.",
  },

  icons: {
    title: "The component marks",
    description:
      "Ten drawings for the ten things a build asks you to have — the vocabulary every other material in this batch is built out of.",
    setTitle: "The set",
    setNote:
      "Seen from above, like the canvas: the product has one point of view of a workbench and this is it. The colours are not a new palette — they are lifted verbatim from canvas/parts/, so the servo mark is the blue of the servo on the board and the resistor mark is the beige of the resistor beside it. A mark that used a different green from the board on the canvas would be a second opinion about the same object.",
    scaleTitle: "At every size it is used",
    scaleNote:
      "24px inside a chip, 32 in a component strip, 40 in a checklist row, 48 on a detail page. The stroke is written in box units rather than pixels, so it stays a hairline at all four rather than thinning out at the bottom of the range.",
    groundTitle: "On both grounds",
    groundNote:
      "A mark appears on white in a card and on sunken ground in a checklist row. Neither may swallow it — which is why the silhouettes carry a slightly heavier contour than the details inside them.",
    notPartsTitle: "Why not the canvas parts",
    notPartsNote:
      "canvas/parts/ cannot be reused here and the reverse is also true. Those are scene parts on a real measuring system — a breadboard pitch is 2.54 mm, which is 10 scene units — and a drawing scaled down from there is unreadable at 44px. These are marks: fewer details, thicker relative strokes, no pin-level accuracy. Same hand, different distance.",
  },

  scenes: {
    title: "The seven scenes",
    description:
      "One drawing per project — and the reason they are shown together rather than one at a time.",
    setTitle: "All seven, side by side",
    setNote:
      "Bespoke scenes were chosen over composing each one out of the component marks, so the risk that they end up as seven separate styles is real and had to be closed by hand. Three decisions do it, all taken before any of them was drawn. One ground: every scene is parts laid out on the workbench's own cutting mat, the same mat the canvas draws. One point of view: from above, always, so a pot is a circle and a bottle is a rounded rectangle with a cap. One level of detail: two to four recognisable parts and at most one mark for what the build does — an arc, a pool of light, a drop.",
    reviewNote:
      "This is why they are reviewed as a set and never one at a time. Approving them individually is how seven drawings become seven styles: each one looks fine on its own, and only the row shows the drift.",
    heroTitle: "The hero is the same drawing",
    heroNote:
      "P-09 is not an eighth illustration. The detail page shows the barrier scene larger, so there is no second drawing that could one day disagree with the card about what this build looks like.",
  },

  cards: {
    title: "How much can a card say?",
    description:
      "The question this batch turns on, built both ways with the same seven projects and left side by side.",
    fullTitle: "A · The full inventory",
    fullNote:
      "All nine fields the brief asks for: the scene, the name, duration, level, step count, the component strip, the concepts it teaches, the status and the action. It answers what is in the box — you can tell at a glance whether a build needs a servo you do not own.",
    calmTitle: "B · The calm grid",
    calmNote:
      "The same frame with the components and the concepts taken out, and one sentence put in. It answers what the build does. The bet is that seven of these read as one library while seven of the other read as seven dashboards.",
    verdictNote:
      "The sharper way to put the choice is not more against less: A spends the space on what is in it, B on what it does. Both keep the fields no reasonable card drops — scene, name, duration, level, status, action. Look at the grids, not the single cards; every card looks fine on its own, and only the seven together answer the question.",
    linkNote:
      "In both directions the whole card is the link. Rule 1 reserves capsules for things you press, and a card is a surface you read, so it stays at 14px and never becomes one — but it is still clickable, so the action renders as text rather than as a button inside it. Two controls in one card is how a keyboard user ends up tabbing twice to reach one destination.",
  },

  blocks: {
    title: "The rest of the library",
    description:
      "The toolbar that narrows seven to one, the card for a build already under way, and the blocks a project detail page is made of.",
    toolbarTitle: "Search and five filters",
    toolbarNote:
      "It filters for real. The narrowing lives in lib/projects/filter.ts as pure functions with no React in them, because an agent asked to find a build that uses a servo I already own calls the same code this toolbar calls. Nothing here is a new control either: the field is A-09, the popovers M-05, the checkboxes A-11's compact sibling, the ready toggle A-14. A filter button turns secondary once it is holding something back — the count alone would be one signal, and rule 7 asks for two.",
    unfilteredNote:
      "Try it: narrow by a component you do not own, or ask for something under 30 minutes. The count in the toolbar is the answer to the toolbar, so it sits inside it.",
    filteredNote:
      "The count updated, the buttons holding something back went secondary, and Clear appeared. Empty results get the empty state rather than a blank grid — a filter that finds nothing has still worked.",
    continueTitle: "The build already under way",
    continueNote:
      "The project card turned on its side, because this one answers a different question: not what is this but where was I. The progress indicator is A-15's compact variant, unchanged — a dashboard that invented a second way of saying 3/7 would have two of them to keep in step the first time the step count moved.",
    prepTitle: "Getting a kit ready",
    prepNote:
      "The checklist is A-11 fed, and the direction it uses — CB3 · Inventory row — was settled in Batch 1 for exactly this: a list you run down once before starting, counting stock rather than agreeing to terms. Nothing blocks. The line underneath reports and never warns, even at zero, because an unticked list still starts the build. The steps come from steps.ts — the same seven the workbench rail renders, so a preview cannot promise a build the workbench does not deliver.",
    noticeTitle: "Preview project",
    noticeNote:
      "A sentence, not a box. This is the trap You can continue in guided demo mode set in Batch 2: the message's job is to set expectations calmly, and a warning-shaped container undoes that whatever the words say. Info rather than warning, too — a preview project is not a problem with the build, it is a fact about this release.",
    howTitle: "How it works",
    howNote:
      "Three numbered discs and a sentence each. No cards: this is the product talking about itself, and rule 4 gives surfaces to the user's input and to countable objects, never to output.",
  },
};

type Section = typeof en;

const tr: Section = {
  page: {
    overline: "Batch 6",
    title: "Proje kütüphanesi",
    intro:
      "Atölye açılmadan önce görülen her şey: bir yapımı anlatan kartlar, yediyi bire indiren araç çubuğu, ve kiti hazırlayan liste. Bu batch'in yarısı kompozisyon değil — henüz var olmayan veri ve on altı çizim.",
    ruleLead: "Batch'in döndüğü soru, bir kartın ne kadar şey ",
    ruleEmphasis: "söyleyebileceği",
    ruleRest:
      ". Brief dokuz alan istiyor ve aynı paragrafta hantal kart istemiyor. Kural 3 ise yedi rozetin yan yana yedi ayrı vurgu değil tek bir sakin sistem olarak okunmasını istiyor. Izgaradaki yedi kart, bu iki cümlenin çarpıştığı yer.",
    sectionsNav: "Bu sayfadaki bölümler",
  },

  model: {
    title: "Yedi proje",
    description:
      "Batch'in geri kalanının üzerine kurulduğu veri — ki bugüne kadar repoda yoktu.",
    note: "Yedi yapım adımıyla aynı sözleşme: yapı lib/'de, kelimeler sözlükte, ikisi aynı id ile eşleşiyor. Bir yapımın ne kadar sürdüğü ve hangi parçaları istediği her dilde aynı; adı değil. Yalnızca Akıllı Otopark Bariyeri hazır — diğer altısı dürüstçe önizleme olarak işaretli, ki bu bir yer tutucu değil ürün gerçeği.",
    tableCaption: "Proje kataloğu",
    colProject: "Proje",
    colStatus: "Durum",
    colTime: "Süre",
    colLevel: "Seviye",
    colSteps: "Adım",
    colParts: "Parça",
    colConcepts: "Kavram",
    vocabularyTitle: "Komponent kelime dağarcığı",
    vocabularyNote:
      "Sensör bilerek jenerik: mesafe, toprak nemi, hareket ve sıcaklık tek bir kelimeyi ve tek bir işareti paylaşıyor; yedi yapımı parça başına ikon üretmeden küçük bir sette tutan şey bu. Buton, envanterin saydığı dokuza yapılan tek ekleme — refleks oyunu, ışık yanınca butona basan bir insan, ve buna sensör demek bir lejandı güvenilmez kılan türden küçük bir yalan olurdu.",
    conceptsTitle: "Yapımların öğrettiği",
    conceptsNote:
      "Cümle değil etiket, çünkü hem kartta çip olarak hem detay sayfasında liste olarak duruyorlar ve ikisi de aynı kelimeleri istiyor. Kart ilk üçünü gösteriyor, detay sayfası hepsini.",
  },

  icons: {
    title: "Komponent işaretleri",
    description:
      "Bir yapımın istediği on şey için on çizim — bu batch'teki diğer her materyalin kurulduğu kelime dağarcığı.",
    setTitle: "Set",
    setNote:
      "Kanvas gibi üstten: ürünün bir tezgâha tek bir bakış açısı var ve bu o. Renkler yeni bir palet değil — canvas/parts/'tan birebir alındı, yani servo işareti karttaki servonun mavisi, direnç işareti de yanındaki direncin beji. Kanvastaki karttan farklı bir yeşil kullanan bir işaret, aynı nesne hakkında ikinci bir görüş olurdu.",
    scaleTitle: "Kullanıldığı her boyutta",
    scaleNote:
      "Çipin içinde 24px, komponent şeridinde 32, liste satırında 40, detay sayfasında 48. Stroke piksel değil kutu birimiyle yazıldı; böylece dördünde de ince bir çizgi kalıyor, alt uçta incelip kaybolmuyor.",
    groundTitle: "İki zeminde de",
    groundNote:
      "Bir işaret kartta beyazın, liste satırında çökük zeminin üstünde duruyor. İkisi de onu yutmamalı — siluetlerin içindeki detaylardan biraz daha kalın bir kontur taşımasının sebebi bu.",
    notPartsTitle: "Kanvas parçaları neden olmadı",
    notPartsNote:
      "canvas/parts/ burada yeniden kullanılamaz, tersi de doğru. Onlar gerçek bir ölçü sistemi üzerindeki sahne parçaları — breadboard adımı 2.54 mm, yani 10 sahne birimi — ve oradan küçültülmüş bir çizim 44px'te okunmuyor. Bunlar işaret: daha az detay, orantısal olarak daha kalın çizgi, pin seviyesinde doğruluk yok. Aynı el, farklı mesafe.",
  },

  scenes: {
    title: "Yedi sahne",
    description:
      "Proje başına bir çizim — ve neden teker teker değil, birlikte gösterildikleri.",
    setTitle: "Yedisi yan yana",
    setNote:
      "Her sahneyi komponent işaretlerinden kurmak yerine özgün çizim seçildi; yani yedi ayrı üsluba dönüşme riski gerçek ve elle kapatılması gerekiyordu. Bunu üç karar yapıyor, üçü de hiçbiri çizilmeden önce alındı. Tek zemin: her sahne, kanvasın da çizdiği tezgâh kesim matının üstüne dizilmiş parçalar. Tek bakış açısı: her zaman üstten, yani saksı bir daire, şişe de kapaklı bir yuvarlak dikdörtgen. Tek detay seviyesi: iki ile dört tanınabilir parça, ve yapımın ne yaptığına dair en fazla bir işaret — bir yay, bir ışık havuzu, bir damla.",
    reviewNote:
      "Set olarak, asla teker teker gözden geçirilmemelerinin sebebi bu. Tek tek onaylamak, yedi çizimi yedi üsluba çeviren şeydir: her biri kendi başına iyi görünür, sapmayı ancak sıra gösterir.",
    heroTitle: "Hero aynı çizim",
    heroNote:
      "P-09 sekizinci bir illüstrasyon değil. Detay sayfası bariyer sahnesini büyük gösteriyor; böylece bu yapımın neye benzediği konusunda kartla bir gün ters düşebilecek ikinci bir çizim yok.",
  },

  cards: {
    title: "Bir kart ne kadar şey söyleyebilir?",
    description:
      "Bu batch'in döndüğü soru; aynı yedi projeyle iki türlü de kuruldu ve yan yana bırakıldı.",
    fullTitle: "A · Tam envanter",
    fullNote:
      "Brief'in istediği dokuz alanın hepsi: sahne, ad, süre, seviye, adım sayısı, komponent şeridi, öğrettiği kavramlar, durum ve aksiyon. İçinde ne var sorusunu cevaplıyor — bir yapımın sende olmayan bir servo istediğini tek bakışta görüyorsun.",
    calmTitle: "B · Sakin ızgara",
    calmNote:
      "Aynı çerçeve; komponentler ve kavramlar çıkarılmış, yerine tek cümle konmuş. Yapımın ne yaptığını cevaplıyor. İddia şu: bunun yedisi tek bir kütüphane gibi okunur, ötekinin yedisi yedi gösterge paneli gibi.",
    verdictNote:
      "Seçimi daha keskin koymanın yolu çok-az değil: A alanı içinde ne olduğuna harcıyor, B ne yaptığına. İkisi de hiçbir makul kartın atmayacağı alanları koruyor — sahne, ad, süre, seviye, durum, aksiyon. Tek kartlara değil ızgaralara bak; her kart kendi başına iyi görünüyor, soruyu ancak yedisi birlikte cevaplıyor.",
    linkNote:
      "İki yönde de kartın tamamı bağlantı. Kural 1 kapsülü bastığın şeylere ayırıyor, kart ise okunan bir yüzey; o yüzden 14px'te kalıyor ve hiçbir zaman kapsül olmuyor — ama yine de tıklanabilir, bu yüzden aksiyon içine buton değil metin olarak yazılıyor. Tek kartta iki kontrol, klavye kullanıcısının tek bir hedefe iki kez tab'layarak varması demektir.",
  },

  blocks: {
    title: "Kütüphanenin geri kalanı",
    description:
      "Yediyi bire indiren araç çubuğu, süregelen bir yapımın kartı, ve bir proje detay sayfasını oluşturan bloklar.",
    toolbarTitle: "Arama ve beş filtre",
    toolbarNote:
      "Gerçekten filtreliyor. Daraltma, içinde React olmayan saf fonksiyonlar olarak lib/projects/filter.ts'te yaşıyor; çünkü sende zaten olan bir servoyu kullanan bir yapım bul denen bir ajan, bu araç çubuğunun çağırdığı kodun aynısını çağırıyor. Burada yeni bir kontrol de yok: alan A-09, popover'lar M-05, kutucuklar A-11'in kompakt kardeşi, hazır anahtarı A-14. Bir filtre düğmesi bir şeyi tuttuğu anda secondary'ye geçiyor — sayaç tek başına tek sinyal olurdu, kural 7 iki istiyor.",
    unfilteredNote:
      "Dene: sende olmayan bir komponente göre daralt, ya da 30 dakikanın altını iste. Araç çubuğundaki sayaç, araç çubuğunun kendi cevabı; o yüzden onun içinde duruyor.",
    filteredNote:
      "Sayaç güncellendi, bir şeyi tutan düğmeler secondary'ye geçti, ve Temizle belirdi. Boş sonuç boş bir ızgara değil boş durum alıyor — hiçbir şey bulamayan bir filtre de çalışmıştır.",
    continueTitle: "Süregelen yapım",
    continueNote:
      "Yan çevrilmiş proje kartı, çünkü bu kart başka bir soruyu cevaplıyor: bu ne değil, nerede kalmıştım. İlerleme göstergesi A-15'in kompakt varyantı, değişmemiş — 3/7 demenin ikinci bir yolunu icat eden bir panelin, adım sayısı ilk değiştiğinde senkron tutması gereken iki göstergesi olurdu.",
    prepTitle: "Kiti hazırlamak",
    prepNote:
      "Liste A-11 beslenmiş hâli, ve kullandığı yön — CB3 · Envanter satırı — Batch 1'de tam bunun için verilmişti: başlamadan önce bir kez göz gezdirilen, sözleşme onaylamak değil stok saymak olan bir liste. Hiçbir şey engellenmiyor. Alttaki satır sıfırda bile bildiriyor, uyarmıyor; çünkü işaretlenmemiş bir liste de yapımı başlatıyor. Adımlar steps.ts'ten geliyor — atölye rayının çizdiği aynı yedi adım, yani önizleme atölyenin veremeyeceği bir yapım vaat edemiyor.",
    noticeTitle: "Önizleme projesi",
    noticeNote:
      "Cümle, kutu değil. Batch 2'de Rehberli demo modunda devam edebilirsin'in kurduğu tuzağın aynısı: mesajın işi beklentiyi sakin biçimde ayarlamak, ve uyarı biçimli bir kap içinde ne yazarsa yazsın bunu bozuyor. Ayrıca warning değil info — önizleme projesi yapımla ilgili bir sorun değil, bu sürümle ilgili bir gerçek.",
    howTitle: "Nasıl çalışır",
    howNote:
      "Üç numaralı disk ve birer cümle. Kart yok: burada ürün kendinden bahsediyor, ve kural 4 yüzeyleri kullanıcının girdisine ve sayılabilir nesnelere ayırıyor, çıktıya asla.",
  },
};

export const library = { en, tr };
