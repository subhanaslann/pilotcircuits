/**
 * F-10 · Copy layer — Batch 7 · Workbench and inspection (design lab).
 *
 * Lab prose only. Everything the materials themselves say comes from
 * `copy.workbench.*`, `copy.inspection.*`, `copy.demo.*` and `copy.a11y.*`, so
 * a missing translation shows up on this page rather than in the product.
 *
 * Same contract as the other section files: `const en` without `as const`,
 * `const tr: Section` so a missing key is a compile error.
 */

const en = {
  page: {
    overline: "Batch 7",
    title: "Workbench and inspection",
    intro:
      "The batch with the least new drawing in it and the most risk. The canvas, the agent panel and the device dock were each approved on their own; this is the first time all three are on one screen, inside a frame that has to hold at 1280 as well as at 1440.",
    ruleLead: "The question it turns on is how much the camera should ",
    ruleEmphasis: "look like a camera",
    ruleRest:
      ". The product's hardest promise is that it never behaves as though real hardware were attached. §7 then asks for an image of the physical circuit on the desk — which is exactly where that promise comes under load.",
    sectionsNav: "Sections on this page",
  },

  topbar: {
    title: "The control bar",
    description:
      "One way back, the build's identity, where you are in it, and the three things the session is honest about.",
    stateTitle: "Both states",
    stateNote:
      "The fraction is said twice on purpose, and it is the only thing here that is: Step 3 of 7 is the sentence, the seven ticks beside it are the instrument. They cannot disagree, because both are derived from one BuildStep list. Demo feed and Board simulated stay for the whole session — they are §6.1's requirement, not decoration. Agent connected is the one badge that can change, and when it does it changes glyph as well as word: absence gets its own mark rather than the connected one greyed out.",
    demoNote:
      "The demo menu is the recessive icon on the right. §10 wants it reachable without looking like part of the product, and those two pull against each other — a menu nobody can find is not a demo control, and a bar of nine buttons is a second product.",
  },

  rail: {
    title: "The step rail",
    description:
      "Seven steps in the order they happen, and — pinned at the foot — what the step you are standing on actually touches.",
    statesTitle: "Four states, four words",
    statesNote:
      "Position carries three of the four states on its own: behind you, here, ahead. It does not carry the one that matters. A step you have already walked past can still be Issue, and keeping that visible is most of why the rail exists — so all four are written out, quietly, in the line where the estimate already lives. Writing them down is what caught the fourth: upcoming reads Not started, because the agent can move the build to step 4 with step 3 still unverified, and a row above the active one calling itself upcoming is the rail saying something untrue. The disc is the same StepMark the topbar's expanded list draws, exported rather than redrawn: two pictures of one state is how the rail and the topbar end up disagreeing about which step is blocked.",
    navigationNote:
      "The rail does not navigate. Three things already move the build between steps — the agent through navigate_build_step, the demo menu, and the topbar's progress control, whose expanded list has been a step picker since Batch 1. A fourth would be a fourth thing to keep in step with the other three, and the rail's job here is orientation.",
    partsTitle: "Components in this step",
    partsNote:
      "Derived from the connections the step owns, never listed by hand — a written list stops matching the graph the moment a wire moves. The board and the breadboard are deliberately not in it: they are the substrate, seated in step 2 and never fetched again. What the derivation cannot see is the two resistors in the LED step; they have no node in the graph because they sit in series inside a leg, and the step's own instruction names them one line above the canvas.",
  },

  layout: {
    title: "Four regions, one screen",
    description:
      "The riskiest step in the batch. Nothing here is new — it is Batch 3, 4 and 5 standing beside each other for the first time.",
    stageTitle: "The workbench, live",
    stageNote:
      "Everything works: inspect, show, fix, verify, run the test, open the dock, switch the view, open the inspection. Every button runs the same tool a WebMCP callback will call — there is no second path on this page.",
    widthLabel: "Stage width",
    pressureNote:
      "The pressure is vertical, not horizontal. At 1280 the canvas has 1280 − 252 − 360 = 668px across and, with the dock open, 900 − 64 − 224 = 612 down — and the instruction takes another 70 of that. Which is why the canvas controls float over the well instead of sitting in a bar above it: horizontally there is room to spare, and that is where the controls take their space.",
    refitNote:
      "Open and close the dock while the agent is pointing at a pin. The canvas does not move. It fits itself once, when it first has a size, and never again — Batch 4's note: refitting on every resize looks tidy and throws away the focus the agent just asked for, which is a change the user did see undone by one they did not.",
  },

  camera: {
    title: "How much should the camera look like a camera?",
    description:
      "The question the batch turned on, built both ways against the same content. Settled: B. The frame is evidence rather than a photograph, and the direction it was chosen over is still here.",
    captureTitle: "A · The capture",
    captureNote:
      "The frame is a photograph. Viewfinder corners, the label burned into the top left, the time in its corner, a scan you feel rather than see. It says this is what the camera saw, and the vision result is drawn on top of an image. The cost is exactly the product's hardest promise: the more it reads as a real frame, the more work Demo vision result has to do on its own.",
    plateTitle: "B · The plate",
    plateNote:
      "The frame is evidence, not a photograph. Nothing is printed on the image; the label and the time move underneath it, into the interface's own voice. What keeps it from being a second canvas is that it is fixed — no controls, no view switch — and that it carries annotations the canvas never draws. The cost is the other one: if it is only a still canvas with boxes on it, the modal has to justify itself some other way.",
    contentNote:
      "What is not in question, and is identical in both: the picture inside is CircuitSceneView. There is no second drawing of this circuit and there will not be one — a camera pane that redrew the build would be a second opinion about it, and the first time a wire moved one of the two would be wrong.",
    overlayNote:
      "The detection boxes are neutral in both directions. A box says the vision found this part here; it does not say whether the part is right. Colouring it would put a third amber-against-teal signal on top of the error ring and the target ring the canvas already draws for the same finding — one fact in three shapes. Corners rather than a closed rectangle for a related reason: a full outline reads as a border belonging to the part.",
  },

  inspection: {
    title: "The inspection",
    description:
      "Camera on the left, the correct build beside it, the findings underneath — and the angle comparison, when there is an angle to compare.",
    openLabel: "Open it",
    modalNote:
      "M-07 fed, not rewritten: focus trap, Escape, scroll lock and focus return are already paid for. Open it, press Show me, close it — the workbench behind is looking at what you were just shown, because the modal's Show me is the same show_correction call the panel makes.",
    findingsNote:
      "The findings are FindingRow — the actual G-05 component, reading the actual Finding objects the panel behind the modal is reading. §7 says the detections in here use the same central state; the strongest way to keep that true is for there to be one component, so a change to how a finding reads cannot land in one place and not the other.",
    transformNote:
      "Two transforms, not three. The camera pane is a real viewport with its own handle, because the agent has to be able to take it to a pin. The reference beside it is a fixed viewBox — a reference view is something you compare against, not something you fly around in. It is cropped to the same focus box the agent uses, because the whole board at 380px is a picture of nothing: the correct answer has to be drawn beside the wrong one at the same magnification.",
    angleTitle: "The horn, twice",
    angleNote:
      "The second fault is not a wire and cannot be shown as one. This is the canvas cropped — same MicroServo, same 1:1 scene units, same mat underneath — rather than a diagram drawn for this panel, which would have been a fourth drawing scale in a product that has decided it has three. The ghost is C-18 unchanged, so the expected horn is green here and green on the workbench. The arc is the only addition, and it earns its place by carrying the quantity: you can see two horns without being able to say how far apart they are.",
  },

  demo: {
    title: "The nine scenarios",
    description:
      "Everything a filmed take needs to be able to reach, and not one line of separate flow behind any of it.",
    liveTitle: "Press one and watch the timeline",
    liveNote:
      "Every entry that appears is a real tool call against the real store. §10: the demo buttons do not run a second flow. That is also why Complete project takes several seconds rather than being a state assignment — it repairs both faults through inspect_build and then verifies each remaining step, which is what completing the project is.",
    injectNote:
      "The two inject actions are the only thing here that is not a tool call, and they cannot be one: no tool in this product breaks a build. They go through the same act() as I fixed it, which is the right neighbourhood — in the fiction they are the same gesture in the other direction, and they land in the timeline as the person's own line.",
    groupNote:
      "Nine items in a flat list is a wall. They come in the three groups the demo itself has, each reading jump to it · put it back · fix it, which is the shape of a take. Reset sits above them on its own, because it is the only one that throws away what the others set up.",
  },

  small: {
    title: "Below the fold width",
    description:
      "What happens under 1120px, which is where layout.workbenchMin has said the workbench folds since Batch 0.",
    note: "The canvas is not hidden — it is not rendered. §16 says the circuit is never shrunk to the point of meaninglessness, and a viewport mounted inside a 380px column would fit itself to that width once and keep the result. The steps, the findings and the agent are all still reachable, which is the other half of what §16 asks for, and the agent panel becomes the right drawer Batch 5 declined to spend on the dock — precisely so that it would still be here.",
    noticeNote:
      "A sentence, not a box (rule 4). Same job as You can continue in guided demo mode: nothing is broken and nothing is blocked, so a warning-shaped container would say the opposite of the words inside it. Info rather than warning, for the same reason — a narrow window is not a fault in the build.",
  },
};

type Section = typeof en;

const tr: Section = {
  page: {
    overline: "Batch 7",
    title: "Atölye ve inceleme",
    intro:
      "En az yeni çizim, en çok risk taşıyan batch. Kanvas, ajan paneli ve cihaz dock'u tek tek onaylandı; üçü ilk kez tek ekranda, hem 1440'ta hem 1280'de ayakta kalması gereken bir çerçevenin içinde.",
    ruleLead: "Batch'in döndüğü soru, kameranın ne kadar ",
    ruleEmphasis: "kamera gibi görünmesi",
    ruleRest:
      " gerektiği. Ürünün en sert sözü, gerçek donanım bağlıymış gibi davranmamak. §7 ise masadaki fiziksel devrenin görüntüsünü istiyor — o söz tam da burada zorlanıyor.",
    sectionsNav: "Bu sayfadaki bölümler",
  },

  topbar: {
    title: "Kontrol çubuğu",
    description:
      "Tek bir geri yolu, yapımın kimliği, nerede olduğun, ve oturumun dürüst olduğu üç şey.",
    stateTitle: "İki durum",
    stateNote:
      "Kesir bilerek iki kez söyleniyor ve burada iki kez söylenen tek şey o: Adım 3 / 7 cümle, yanındaki yedi tick ise alet. Anlaşmazlığa düşemezler, çünkü ikisi de tek bir BuildStep listesinden türüyor. Demo akışı ve Kart simüle oturum boyunca duruyor — süs değil, §6.1'in şartı. Değişebilen tek rozet Ajan bağlı, ve değişince renkle birlikte glifi de değişiyor: yokluk kendi işaretini alıyor, bağlı olanın grileştirilmiş hâlini değil.",
    demoNote:
      "Demo menüsü sağdaki geri çekilmiş ikon. §10 bunun ürünün parçası gibi görünmeden erişilebilir olmasını istiyor, ve bu ikisi birbirini çekiştiriyor — kimsenin bulamadığı bir menü demo kontrolü değildir, dokuz butonluk bir çubuk ise ikinci bir üründür.",
  },

  rail: {
    title: "Adım rayı",
    description:
      "Yedi adım, gerçekleştikleri sırayla — ve altta sabitlenmiş hâlde, üstünde durduğun adımın gerçekten neye dokunduğu.",
    statesTitle: "Dört durum, dört kelime",
    statesNote:
      "Konum dört durumun üçünü tek başına taşıyor: arkanda, buradasın, ileride. Taşımadığı tek şey önemli olan. Geçtiğin bir adım hâlâ Sorunlu olabilir, ve bunu görünür tutmak rayın var oluş sebebinin büyük kısmı — o yüzden dördü de, sessizce, sürenin zaten durduğu satıra yazıldı. Dördüncüsünü yakalayan şey de bunları yazmak oldu: upcoming, Sırada değil Başlanmadı diye okunuyor — çünkü ajan, 3. adım doğrulanmamışken yapımı 4. adıma taşıyabiliyor, ve aktif satırın üstünde kendine sırada diyen bir satır, rayın söylediği yanlış bir şeydir. Disk, üst çubuğun açılan listesinin çizdiği StepMark'ın aynısı; yeniden çizilmedi, dışa aktarıldı: tek bir durumun iki resmi, rayla üst çubuğun hangi adımın bloke olduğu konusunda ters düşmesinin yolu.",
    navigationNote:
      "Ray gezinmiyor. Yapımı adımlar arasında taşıyan üç şey zaten var — navigate_build_step ile ajan, demo menüsü, ve Batch 1'den beri adım seçici olan üst çubuk ilerleme kontrolü. Dördüncüsü, diğer üçüyle senkron tutulacak dördüncü şey olurdu; buradaki rayın işi ise yön bulmak.",
    partsTitle: "Bu adımdaki parçalar",
    partsNote:
      "Adımın sahip olduğu bağlantılardan türetiliyor, elle yazılmıyor — elle yazılmış bir liste, bir kablo kımıldadığı anda grafikle uyuşmayı bırakır. Kart ve breadboard bilerek listede yok: onlar zemin, 2. adımda yerleştirildiler ve bir daha alınmıyorlar. Türetmenin göremediği şey LED adımındaki iki direnç; grafikte düğümleri yok çünkü iki adreslenebilir nokta arasında değil bir bacağın içinde seri duruyorlar, ve adımın kendi yönergesi onları kanvasın bir satır üstünde zaten söylüyor.",
  },

  layout: {
    title: "Dört bölge, tek ekran",
    description:
      "Batch'in en riskli adımı. Burada yeni hiçbir şey yok — Batch 3, 4 ve 5 ilk kez yan yana duruyor.",
    stageTitle: "Atölye, canlı",
    stageNote:
      "Her şey çalışıyor: incele, göster, düzelt, doğrula, testi koştur, dock'u aç, görünümü değiştir, incelemeyi aç. Her düğme, bir WebMCP callback'inin çağıracağı aracın aynısını çağırıyor — bu sayfada ikinci bir yol yok.",
    widthLabel: "Sahne genişliği",
    pressureNote:
      "Basınç yatayda değil dikeyde. 1280'de kanvasa yatayda 1280 − 252 − 360 = 668px kalıyor, dock açıkken dikeyde ise 900 − 64 − 224 = 612 — ve yönerge bunun 70'ini daha alıyor. Kanvas kontrollerinin üstte bir çubukta değil kuyunun üzerinde yüzmesinin sebebi bu: yatayda yer bol, kontroller de yerini oradan alıyor.",
    refitNote:
      "Ajan bir pini gösterirken dock'u aç ve kapat. Kanvas kımıldamıyor. Bir kez, ilk boyutunu aldığında sığdırıyor ve bir daha asla — Batch 4'ün notu: her ölçümde yeniden sığdırmak düzenli görünür ve ajanın az önce istediği odağı çöpe atar, yani kullanıcının gördüğü bir değişimi görmediği bir değişimle geri alır.",
  },

  camera: {
    title: "Kamera ne kadar kamera gibi görünmeli?",
    description:
      "Batch'in döndüğü soru; aynı içeriğe karşı iki türlü de kuruldu. Karara bağlandı: B. Kare fotoğraf değil kanıt — ve neye karşı seçildiği hâlâ burada.",
    captureTitle: "A · Kare",
    captureNote:
      "Çerçeve bir fotoğraf. Vizör köşeleri, sol üste basılmış etiket, köşedeki saat, görülmekten çok hissedilen bir tarama. Kameranın gördüğü bu diyor, ve görüntü sonucu bir fotoğrafın üstüne çiziliyor. Bedeli tam da ürünün en sert sözü: gerçek bir kare gibi okundukça, Demo görüntü sonucu etiketinin tek başına taşıması gereken yük artıyor.",
    plateTitle: "B · Levha",
    plateNote:
      "Çerçeve fotoğraf değil, kanıt. Görüntünün üstünde hiçbir şey yazmıyor; etiket ve saat altına, arayüzün kendi sesine iniyor. Onu ikinci bir kanvas olmaktan kurtaran şey sabit olması — kontrol yok, görünüm anahtarı yok — ve kanvasın hiç çizmediği açıklamaları taşıması. Bedeli de öteki: eğer sadece üstünde kutular olan durağan bir kanvassa, modalın kendini başka bir şeyle haklı çıkarması gerekiyor.",
    contentNote:
      "Tartışmalı olmayan ve ikisinde de aynı olan şey: içerideki resim CircuitSceneView. Bu devrenin ikinci bir çizimi yok ve olmayacak — devreyi yeniden çizen bir kamera bölmesi, aynı nesne hakkında ikinci bir görüş olurdu ve bir kablo ilk kımıldadığında ikisinden biri yanlış olurdu.",
    overlayNote:
      "Tespit kutuları iki yönde de nötr. Kutu görüntü bu parçayı burada buldu diyor; parçanın doğru olup olmadığını söylemiyor. Onu renklendirmek, kanvasın aynı bulgu için zaten çizdiği hata halkasıyla hedef halkasının üstüne üçüncü bir kehribar-turkuaz sinyali koyardı — tek bir olgu, üç şekilde. Kapalı dikdörtgen yerine köşeler de benzer bir sebeple: tam bir kontur, parçaya ait bir kenarlık gibi okunuyor.",
  },

  inspection: {
    title: "İnceleme",
    description:
      "Solda kamera, yanında doğru yapım, altta bulgular — ve karşılaştırılacak bir açı olduğunda açı karşılaştırması.",
    openLabel: "Aç",
    modalNote:
      "M-07 beslendi, yeniden yazılmadı: focus trap, Escape, kaydırma kilidi ve odağın geri dönmesi zaten ödenmişti. Aç, Göster'e bas, kapat — arkadaki atölye az önce sana gösterilen şeye bakıyor, çünkü modaldaki Göster, panelin çağırdığı show_correction'ın aynısı.",
    findingsNote:
      "Bulgular FindingRow — modalın arkasındaki panelin okuduğu Finding nesnelerinin aynısını okuyan, gerçek G-05 bileşeni. §7 buradaki tespitlerin aynı merkezi state'i kullandığını söylüyor; bunu doğru tutmanın en güçlü yolu tek bir bileşen olması, böylece bir bulgunun nasıl okunduğuna dair bir değişiklik bir yere inip ötekine inemiyor.",
    transformNote:
      "Üç değil, iki transform. Kamera bölmesi kendi tutamağı olan gerçek bir viewport, çünkü ajanın onu bir pine götürebilmesi gerekiyor. Yanındaki referans ise sabit bir viewBox — referans görünüm karşılaştırdığın bir şeydir, içinde uçtuğun değil. Ajanın kullandığı odak kutusuna kırpılıyor, çünkü 380px'te bütün kart hiçbir şeyin resmidir: doğru cevabın yanlışın yanında, aynı büyütmede çizilmesi gerekiyor.",
    angleTitle: "Kol, iki kez",
    angleNote:
      "İkinci arıza bir kablo değil ve kablo gibi gösterilemez. Bu, kanvasın kırpılmış hâli — aynı MicroServo, aynı 1:1 sahne birimi, altında aynı mat — bu panel için çizilmiş bir diyagram değil; o, üç ölçeğe karar vermiş bir üründe dördüncü çizim ölçeği olurdu. Hayalet C-18'in aynısı, yani beklenen kol burada da atölyede de yeşil. Tek ekleme yay, ve yerini miktarı taşıyarak hak ediyor: iki kolu, aralarındaki farkı söyleyemeden de görebilirsin.",
  },

  demo: {
    title: "Dokuz senaryo",
    description:
      "Kayıt alınan bir çekimin ulaşması gereken her şey — ve hiçbirinin arkasında tek satır ayrı akış yok.",
    liveTitle: "Birine bas, çizelgeyi izle",
    liveNote:
      "Beliren her kayıt, gerçek store'a karşı gerçek bir araç çağrısı. §10: demo butonları ayrı sahte akış çalıştırmaz. Projeyi tamamla'nın bir state ataması olmak yerine birkaç saniye sürmesinin sebebi de bu — iki arızayı da inspect_build üzerinden onarıyor, sonra kalan her adımı doğruluyor; projeyi tamamlamak zaten bu.",
    injectNote:
      "İki uygula aksiyonu buradaki araç çağrısı olmayan tek şey, ve olamaz da: bu üründe hiçbir araç bir yapımı bozmaz. Düzelttim ile aynı act() üzerinden geçiyorlar, ki doğru mahalle — kurguda bunlar aynı hareketin ters yönü, ve çizelgeye kişinin kendi satırı olarak düşüyorlar.",
    groupNote:
      "Düz bir listede dokuz madde bir duvardır. Demonun kendi üç grubuyla geliyorlar; her biri ona atla · geri koy · düzelt diye okunuyor, ki bu bir çekimin şekli. Sıfırla hepsinin üstünde tek başına duruyor, çünkü diğerlerinin kurduğu şeyi atan tek madde o.",
  },

  small: {
    title: "Katlanma genişliğinin altında",
    description:
      "1120px'in altında ne oluyor — layout.workbenchMin Batch 0'dan beri atölyenin orada katlandığını söylüyor.",
    note: "Kanvas gizlenmiyor — hiç render edilmiyor. §16 devrenin anlamsızlaşacak kadar küçültülmediğini söylüyor, ve 380px'lik bir sütunun içine monte edilen bir viewport kendini bir kez o genişliğe sığdırır ve sonucu saklar. Adımlar, bulgular ve ajan hâlâ erişilebilir — §16'nın istediğinin öteki yarısı bu — ve ajan paneli, Batch 5'in dock'a harcamayı reddettiği sağ drawer'a dönüşüyor; tam da burada durabilsin diye.",
    noticeNote:
      "Cümle, kutu değil (kural 4). Rehberli demo modunda devam edebilirsin ile aynı iş: hiçbir şey bozuk değil, hiçbir şey engellenmiyor, yani uyarı biçimli bir kap içindeki kelimelerin tersini söylerdi. Aynı sebeple warning değil info — dar bir pencere yapımdaki bir arıza değil.",
  },
};

export const workbench = { en, tr };
