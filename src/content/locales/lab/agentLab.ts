/**
 * F-10 · Copy layer — Batch 4 · Agent workspace (design lab).
 *
 * Lab prose only: section headers, block notes and the specimen labels around
 * them. Everything the product itself says still comes from `copy.*` — the
 * specimens render the shipping strings so a wrong translation shows up here
 * before it ships.
 *
 * Same contract as the product dictionary: `const en` without `as const` so the
 * Turkish file is not forced to repeat the English literals, and `const tr:
 * Section` so a missing or misspelled key is a compile error rather than a gap
 * on the page.
 *
 * What stays in English on both sides: material codes (`G-01`), hardware values
 * (`D7`, `5V`), tool and argument names (`inspect_build`, `detail_level`), and
 * the batch identifiers the inventory uses (`Batch 2`, `Batch 7`).
 */

const en = {
  page: {
    overline: "Batch 4",
    title: "Agent workspace",
    intro:
      "The right column of the workbench, where the agent's work becomes legible: what it knows about the build, what it found, what it did, and the tool call underneath each sentence. Not a chatbot — the conversation happens elsewhere. This panel shows the context the page shares with the agent, and the effect of every action it takes.",
    /* Split around the one emphasised word: the sentence argues that the ground
       moves *down*, and the italic is the argument. */
    ruleLead:
      "Five of these fifteen materials are named “card” in the inventory. None of them is one. The rule the batch settled on: a surface contains the user's input or a countable object, never the agent's output. The one ground change in the whole panel is the knowledge check — and it goes ",
    ruleEmphasis: "down",
    ruleRest:
      ", into a sunken band, because that region belongs to the person answering it.",
    sectionsNav: "Sections on this page",
  },

  live: {
    title: "Drive the agent",
    description:
      "Every material in its real place, with the agent actually working. The same run(tool, input) a WebMCP callback calls — same payload, same commit, same canvas move.",
    /* The closing sentence used to read `…and that is the one thing the agent
       cannot do`. It is true of the bench above — chapter six is laid out by
       its author, and `attach_lead` refuses all eleven calls there — and it
       was written as a fact about the agent, which measured four tools and 27
       calls building chapter two end to end with every check green. A page
       whose whole argument is that a count nobody can check is a badge cannot
       close on a claim nobody checked. */
    note: "Press Inspect my build and watch: the pulse goes to its lattice, the tool name shimmers, each phase names itself, the timeline fills in order, the tab slides to Findings and the canvas glides to the two pins. Then it stops — because the next thing that has to happen is you moving a wire, and on this bench the agent cannot: chapter six is laid out by its author, so attach_lead refuses every call here. On the five chapters you assemble yourself it does not refuse; it moves the lead. What keeps that honest is not that the agent has no hands — it is that the move lands as a commit Ctrl+Z takes back, that the timeline says the agent made it rather than you, and that the finished build counts how many it made.",
    canvasLabel: "Smart Parking Barrier circuit",
  },

  panel: {
    title: "The panel",
    description:
      "The frame the agent writes into: header with the live pulse, three tabs that never scroll away, one pinned action, and a tool count you can open.",
    note: "360px, exactly as it will sit in the workbench. Sticky header, one scrolling body, a pinned action that never scrolls out of reach. The tabs live in the header so the agent can switch them without the navigation moving, and the underline slides — an agent that changes the view without you seeing it move has, as far as the user is concerned, done nothing.",
    assembled: "Assembled",
    drive: "Drive it",
    agentState: "Agent state",
    idle: "Idle",
    working: "Working",
    offline: "Offline",
    forget: "Forget findings",
    noticedLead: "Findings are what the agent ",
    noticedEmphasis: "noticed",
    noticedRest:
      ", not what is true. Move the wire and the row changes state in place rather than vanishing; forget the findings and the panel goes back to never having looked.",
    headerTitle: "Header, tools and the offline notice",
    headerNote:
      "The tool count in the header below opens the case: WebMCP is meant to be the structure of this product rather than a badge on it, and a count nobody can check is exactly a badge. That count is read off the list this page hands the browser — the note quoted a literal `6` for a while, above a header that had said 7 since `attach_lead`, which is the failure it is arguing against. When the API is missing the pulse goes to its hollow ring — absence drawn as absence — and the notice reassures rather than warns, because every manual control still works.",
    toolInventory: "Tool inventory",
    webMcpUnavailable: "WebMCP unavailable",
  },

  guidance: {
    title: "Guidance and teaching",
    description:
      "What the agent knows about the step, the three-rung ladder from a nudge to the exact fix, the correction that opens inside its finding, and the one question the interface asks back.",
    summaryTitle: "Guidance and coaching level",
    summaryNote:
      "The panel carries what the agent knows; the canvas carries what to do. Saying `Connect the sensor's Echo pin to D7.` in both places would halve its authority, so the instruction stays above the board and this stays a report. Four connections are countable, so they get four ticks rather than a bar — and finishing is a state change, not a bar reaching its end.",
    blocked: "Blocked",
    clear: "Clear",
    notInspected: "Not yet inspected",
    /* Wraps the two mono tokens, which are argument names and stay as they are. */
    thumbLead: "The agent moves this control too, through ",
    thumbMid: "'s ",
    thumbRest: ". The thumb slides, so you see it happen.",
    ladderTitle: "Teaching ladder",
    ladderNote:
      "Always three rungs tall. A closed rung keeps its label and its dashed pad instead of collapsing to nothing: two filled pads and one dashed circle say there is another level of help available without a word being read. Collapse them and the product's headline claim — three levels of teaching, you pick how much — becomes an invisible feature.",
    correctionTitle: "Correction",
    correctionNote:
      "What `Show me` opens, and where it opens: inside the finding it explains, not in another tab. An indent and one accent rule down the left — the quotation device — rather than a box. A box would say separate object; the correction is not a separate object, it is the finding, elaborated. Raising a rung here raises the coaching level in the header, so one state change is confirmed in two places.",
    correctionColumn: "Finding with its correction open",
    knowledgeTitle: "Knowledge check",
    knowledgeNote:
      "The one place in the panel where the ground changes — and it changes down, into a sunken band with a hairline top and bottom, no radius and no side edges. Everywhere else the agent is telling you something; here the interface is asking, and the region belongs to you. Real radios inside a real fieldset, so arrow keys and grouping cost nothing.",
    knowledgeColumn: "Before and after answering",
  },

  findings: {
    title: "Findings",
    description:
      "What an inspection reports: severity in the disc, the evidence understated beneath the title, and the affected pins as chips that take the canvas there. The rejected card direction stays on the page.",
    registerTitle: "Open decision · finding register",
    registerNote:
      "Both directions carry the same two findings, derived from the same graph, in a column exactly as wide as the shipping panel. The left one is built on the alert's shell: one filled disc holds all the colour, and a hairline separates the two. The right one is the Batch 2 card draft. The question is not which looks better on its own — it is which one still reads as one calm account of one build when the agent adds a third.",
    editorial: "A · Editorial",
    card: "B · Card",
    statesTitle: "States",
    statesNote:
      "A resolved finding does not vanish — it changes state in place. A row that disappears on click is a change the user never saw happen, and the whole panel exists to make the agent's work visible.",
    openResolved: "Open → resolved",
    nothingOpen: "Nothing open",
  },

  activity: {
    title: "Activity and tool details",
    description:
      "Every tool call, in human language, on a copper trace — with the machinery folded underneath each sentence and the raw result shut until asked for.",
    spineTitle: "The spine",
    /* `— the half of the work the agent cannot do` used to close the pad
       sentence, one clause after `blue where it changed the workbench`, which
       is the same claim the live note above was corrected for and it sat
       beside its own counter-example. What the three colours are actually for
       is the distinction, so that is what the clause says now. */
    spineNote:
      "Not a generic dot-and-line timeline. The spine is a copper trace and every entry is a plated pad: hollow where the agent only looked, blue where it changed the workbench, dark where you did — the record says which of you moved it, at a glance. The running entry's marker is the activity pulse itself, so there is no second in-progress animation to invent; above it the trace runs blue because that is the segment being laid, and below it there is none, because that route does not exist yet.",
    timelineColumn: "Reading, finding, fixing, verifying",
    failedColumn: "A call that failed",
    detailsTitle: "Developer details",
    detailsNote:
      "The human sentence first, the machinery underneath it, and raw JSON shut until asked for — the product's teaching contract applied to its own plumbing. Each disclosure carries its entry's headline in an sr-only suffix, because twelve controls all named Developer details are unusable in a screen-reader rotor.",
    detailsColumn: "Open",
    badgeTitle: "Tool call badge",
    badgeNote:
      "Mono, 4px radius, never a capsule: rule 1 keeps the capsule for things you press, and rule 13 files a tool name with D7 and 94% — a reading, not a control. The leading mark says whether the call only looks at the build or changes it.",

    /* Demo data for the timeline specimen. Only the sentences a person reads
       live here; the tool names, argument summaries, clocks and durations stay
       in the component, because those are what the machine says. */  },
};

type Section = typeof en;

const tr: Section = {
  page: {
    overline: "Batch 4",
    title: "Ajan çalışma alanı",
    intro:
      "Atölyenin sağ sütunu: ajanın yaptığı işin okunur hâle geldiği yer. Yapım hakkında ne biliyor, ne buldu, ne yaptı, ve her cümlenin altındaki araç çağrısı. Sohbet botu değil — konuşma başka yerde geçiyor. Bu panel, sayfanın ajanla paylaştığı bağlamı ve ajanın attığı her adımın sonucunu gösterir.",
    ruleLead:
      "Bu on beş materyalin beşi envanterde “kart” diye geçiyor. Hiçbiri kart değil. Batch'in vardığı kural: bir yüzey kullanıcının girdisini ya da sayılabilir bir nesneyi taşır, ajanın çıktısını asla. Panelin tamamındaki tek zemin değişikliği kısa kontrol — ve zemin ",
    ruleEmphasis: "aşağı",
    ruleRest:
      " iner: çukur bir banda, çünkü orası soruyu cevaplayan kişinin alanı.",
    sectionsNav: "Bu sayfadaki bölümler",
  },

  live: {
    title: "Ajanı çalıştır",
    description:
      "Her materyal gerçek yerinde, ajan da gerçekten çalışıyor. Bir WebMCP geri çağrısının çağırdığı run(tool, input) ile aynı — aynı payload, aynı commit, aynı kanvas hareketi.",
    /* Kapanış cümlesi eskiden `…ve ajanın yapamadığı tek şey bu` diyordu.
       Yukarıdaki tezgah için doğru — altıncı bölümü yazarı yerleştirdi ve
       `attach_lead` orada on bir çağrının on birini de geri çeviriyor — ama
       ajan hakkında bir gerçek gibi yazılmıştı; oysa ölçüm, dört araç ve 27
       çağrıyla ikinci bölümün baştan sona kurulduğunu, bütün kontrollerin
       yeşile döndüğünü gösteriyor. Bütün derdi "kimsenin kontrol edemediği bir
       sayı rozettir" olan bir sayfa, kimsenin kontrol etmediği bir iddiayla
       kapanamaz. */
    note: "Yapımımı incele'ye bas ve izle: nabız kafes desenine geçer, araç adı parlar, her evre kendi adını söyler, zaman çizelgesi sırayla dolar, sekme Bulgular'a kayar, kanvas iki pine süzülür. Sonra durur — çünkü sırada senin bir kabloyu taşıman var ve bu tezgahta ajan bunu yapamıyor: altıncı bölümün tezgahını yazarı kurdu, burada yerleştirilecek parça yok, attach_lead her çağrıyı geri çeviriyor. Kendi kurduğun beş bölümde geri çevirmiyor; ucu gerçekten taşıyor. Bunu dürüst tutan şey ajanın eli olmaması değil — hareketin Ctrl+Z'nin geri alabileceği bir commit olarak düşmesi, zaman çizelgesinin onu senin değil ajanın yaptığını yazması, ve biten yapımın ajanın kaç tane yaptığını sayması.",
    canvasLabel: "Akıllı Otopark Bariyeri devresi",
  },

  panel: {
    title: "Panel",
    description:
      "Ajanın içine yazdığı çerçeve: canlı nabzın durduğu başlık, kaydırınca kaybolmayan üç sekme, sabitlenmiş tek bir eylem, ve açılabilen bir araç sayısı.",
    note: "360px, atölyede duracağı genişliğin aynısı. Yapışkan başlık, tek kaydırılan gövde, kaydırınca elden kaçmayan sabitlenmiş bir eylem. Sekmeler başlıkta duruyor, böylece ajan sekme değiştirdiğinde navigasyon yerinden oynamıyor; alt çizgi de kayarak geçiyor — görünümü sen hareketi görmeden değiştiren bir ajan, kullanıcı açısından hiçbir şey yapmamıştır.",
    assembled: "Birleşik",
    drive: "Kendin çalıştır",
    agentState: "Ajan durumu",
    idle: "Boşta",
    working: "Çalışıyor",
    offline: "Bağlı değil",
    forget: "Bulguları unut",
    noticedLead: "Bulgular ajanın ",
    noticedEmphasis: "fark ettiği",
    noticedRest:
      " şeydir, doğru olan şey değil. Kabloyu taşı, satır kaybolmaz, yerinde durum değiştirir; bulguları unut, panel hiç bakmamış hâline döner.",
    headerTitle: "Başlık, araçlar ve çevrimdışı notu",
    headerNote:
      "Aşağıdaki başlıkta duran araç sayısı meseleyi açar: WebMCP bu ürünün üstüne takılmış bir rozet değil, yapısı olmalı; kimsenin kontrol edemediği bir sayı ise tam olarak rozettir. O sayı, bu sayfanın tarayıcıya verdiği listeden okunuyor — bu not bir süre `6` sabitini yazdı, `attach_lead`'den beri 7 diyen bir başlığın hemen üstünde; yani tam da karşı çıktığı hatayı yaptı. API yoksa nabız içi boş halkasına geçer — yokluk, yokluk olarak çizilir — ve not uyarmaz, içini rahatlatır, çünkü bütün manuel kontroller çalışmaya devam eder.",
    toolInventory: "Araç envanteri",
    webMcpUnavailable: "WebMCP kullanılamıyor",
  },

  guidance: {
    title: "Rehberlik ve öğretme",
    description:
      "Ajanın adım hakkında bildikleri, küçük bir dürtmeden tam çözüme uzanan üç basamaklı merdiven, kendi bulgusunun içinde açılan düzeltme, ve arayüzün geri sorduğu tek soru.",
    summaryTitle: "Rehberlik ve yardım düzeyi",
    summaryNote:
      "Panel ajanın bildiklerini taşır; kanvas ne yapılacağını. `Sensörün Echo pinini D7 dijital pinine bağla.` cümlesini iki yerde birden söylemek ağırlığını yarıya indirir, o yüzden talimat kartın üstünde kalır, burası da rapor olarak kalır. Dört bağlantı sayılabilir, o yüzden çubuk değil dört işaret alırlar — ve bitmek bir durum değişikliğidir, çubuğun sonuna varması değil.",
    blocked: "Bloke",
    clear: "Temiz",
    notInspected: "Henüz incelenmedi",
    thumbLead: "Ajan bu kontrolü de hareket ettirir: ",
    thumbMid: " çağrısının ",
    thumbRest:
      " argümanıyla. Başparmak kayar, böylece olup bittiğini görürsün.",
    ladderTitle: "Öğretme merdiveni",
    ladderNote:
      "Her zaman üç basamak. Kapalı bir basamak hiçliğe çökmez, etiketini ve kesik çizgili pedini korur: iki dolu ped ve bir kesik çizgili daire, tek kelime okunmadan bir yardım düzeyi daha olduğunu söyler. Onları çökert, ürünün ana iddiası — üç öğretme düzeyi, ne kadarını istediğini sen seç — görünmez bir özelliğe döner.",
    correctionTitle: "Düzeltme",
    correctionNote:
      "`Göster`'in neyi açtığı ve nerede açtığı: başka bir sekmede değil, açıkladığı bulgunun içinde. Kutu değil, bir girinti ve solda tek bir vurgu çizgisi — alıntı düzeneği. Kutu, ayrı bir nesne der; düzeltme ayrı bir nesne değil, bulgunun kendisidir, açılmış hâli. Burada bir basamak yükseltmek başlıktaki yardım düzeyini de yükseltir, yani tek bir durum değişikliği iki yerde onaylanır.",
    correctionColumn: "Düzeltmesi açık bir bulgu",
    knowledgeTitle: "Kısa kontrol",
    knowledgeNote:
      "Panelde zeminin değiştiği tek yer — ve aşağı doğru değişir: üstünde ve altında birer ince çizgi olan, köşe yarıçapı ve yan kenarları olmayan çukur bir bant. Başka her yerde ajan sana bir şey anlatıyor; burada arayüz soruyor, ve bölge sana ait. Gerçek bir fieldset içinde gerçek radio butonları, böylece ok tuşları ve gruplama bedavaya geliyor.",
    knowledgeColumn: "Cevaplamadan önce ve sonra",
  },

  findings: {
    title: "Bulgular",
    description:
      "Bir incelemenin bildirdikleri: diskin içinde önem derecesi, başlığın altında sessizce duran kanıt, ve etkilenen pinler — kanvası oraya götüren birer chip olarak. Reddedilen kart yönü sayfada kalıyor.",
    registerTitle: "Açık karar · bulgu kaydı",
    registerNote:
      "İki yön de aynı iki bulguyu taşıyor, aynı grafikten türetilmiş, ürüne girecek panelle tam olarak aynı genişlikteki bir sütunda. Soldaki, uyarının kabuğu üzerine kurulu: bütün rengi tek bir dolu disk taşıyor, ikisini bir ince çizgi ayırıyor. Sağdaki, Batch 2'nin kart taslağı. Soru hangisinin tek başına daha iyi göründüğü değil — ajan üçüncüyü eklediğinde hangisinin hâlâ tek bir yapımın sakin bir dökümü gibi okunduğu.",
    editorial: "A · Editoryal",
    card: "B · Kart",
    statesTitle: "Durumlar",
    statesNote:
      "Çözülen bir bulgu yok olmaz — yerinde durum değiştirir. Tıklayınca kaybolan bir satır, kullanıcının olduğunu hiç görmediği bir değişikliktir; oysa bu panel ajanın yaptığı işi görünür kılmak için var.",
    openResolved: "Açık → çözüldü",
    nothingOpen: "Açık bulgu yok",
  },

  activity: {
    title: "Etkinlik ve araç ayrıntıları",
    description:
      "Her araç çağrısı, insan dilinde, bir bakır yol üzerinde — makine tarafı her cümlenin altına katlanmış, ham sonuç ise istenene kadar kapalı.",
    spineTitle: "Omurga",
    spineNote:
      "Sıradan bir nokta-ve-çizgi zaman çizelgesi değil. Omurga bir bakır yol, her kayıt da kaplanmış bir ped: ajan yalnızca baktıysa içi boş, atölyede bir şey değiştirdiyse mavi, değiştiren sensen koyu — kayıt, hangisinin taşıdığını tek bakışta söylüyor. Çalışan kaydın işareti etkinlik nabzının kendisi, yani uydurulacak ikinci bir 'devam ediyor' animasyonu yok; üstünde yol mavi akar, çünkü döşenmekte olan parça odur, altında ise yol yoktur, çünkü o güzergâh henüz mevcut değil.",
    timelineColumn: "Okuma, bulma, düzeltme, doğrulama",
    failedColumn: "Başarısız olan bir çağrı",
    detailsTitle: "Geliştirici ayrıntıları",
    detailsNote:
      "Önce insan cümlesi, altında makine tarafı, ham JSON ise istenene kadar kapalı — ürünün öğretme sözleşmesinin kendi tesisatına uygulanmış hâli. Her açılır başlık kendi kaydının başlığını sr-only bir ek olarak taşır, çünkü hepsinin adı Geliştirici ayrıntıları olan on iki kontrol, ekran okuyucu listesinde kullanılamaz.",
    detailsColumn: "Açık",
    badgeTitle: "Araç çağrısı rozeti",
    badgeNote:
      "Mono, 4px yarıçap, asla kapsül değil: 1. kural kapsülü bastığın şeylere ayırır, 13. kural da bir araç adını D7 ve %94 ile aynı rafa koyar — bir okuma, bir kontrol değil. Baştaki işaret, çağrının yapıma yalnızca baktığını mı yoksa onu değiştirdiğini mi söyler.",
  },
};

export const agentLab = { en, tr };
