/**
 * Tiny i18n layer. Turkish is the source language; English mirrors it.
 * Keys are flat strings (dots are literal, not a path).
 */
export const DICT = {
  tr: {
    'skip': 'İçeriğe geç',
    'nav.mirror': 'Ayna', 'nav.anatomy': 'Anatomi', 'nav.how': 'Nasıl çalışır', 'nav.faq': 'SSS',

    'hero.eyebrow': 'Canlı anatomi aynası',
    'hero.title': 'Kendi röntgeninize<br>aynadan bakın.',
    'hero.lede': 'Kameranızı açın: gerçek 3B anatomi verisinden gelen kafatası, beyin, yüz kasları ve baştan ayağa iskelet yüzünüze oturur, siz hareket ettikçe sizinle birlikte hareket eder.',
    'hero.fact1': 'üçgen, gerçek anatomi', 'hero.fact2': 'cihaz üzerinde', 'hero.fact3': 'katman, baştan ayağa iskelet',

    'btn.start': 'Kamerayı başlat', 'btn.demo': 'Kamera olmadan dene',
    'btn.startCam': 'Kamerayı başlat', 'btn.orbit': 'Sadece 3B’yi göster',

    'intro.kicker': 'Hazır olduğunuzda',
    'intro.title': 'X-RAY MIRROR',
    'intro.text': 'Kamerayı başlatın, izin verin. Yüzünüz ekranda belirdiğinde kafatası ve beyin otomatik olarak hizalanır. Modeli parmağınızla sürükleyerek döndürebilirsiniz.',
    'intro.privacy': 'Görüntü cihazınızdan çıkmaz. Sunucu yok, kayıt yok.',

    'tool.cam': 'Kamera', 'tool.snap': 'Kare al', 'tool.full': 'Tam ekran', 'tool.reset': 'Sıfırla', 'tool.keys': 'Kısayollar',
    'key.skull': 'Kafatası', 'key.brain': 'Beyin', 'key.muscles': 'Kaslar', 'key.eyes': 'Gözler', 'key.neck': 'Boyun',
    'key.skeleton': 'İskelet', 'key.body': 'Tam boy / ayna',
    'key.xray': 'X-ray / Katı', 'key.labels': 'Etiketler', 'key.reveal': 'Görünüm modu', 'key.full': 'Tam ekran',
    'key.reset': 'Sıfırla', 'key.help': 'Bu liste',

    'status.idle': 'Hazır. Kamerayı başlatın.',
    'status.requesting': 'Kamera izni isteniyor…',
    'status.loading': 'Yüz takibi modeli yükleniyor…',
    'status.live': 'Canlı. Kafanızı çevirin, anatomi sizinle döner.',
    'status.noface': 'Canlı, ama yüz bulunamadı. Işığa bakın ve kameraya yaklaşın.',
    'status.denied': 'Kamera izni verilmedi. Tarayıcı ayarlarından izin verin ya da 3B modu kullanın.',
    'status.nocam': 'Kamera bulunamadı. 3B modu kullanabilirsiniz.',
    'status.insecure': 'Kamera için güvenli bağlantı (https) gerekir.',
    'status.unsupported': 'Bu tarayıcı kamera erişimini desteklemiyor.',
    'status.stopped': 'Kamera kapalı. 3B model gösteriliyor.',
    'status.error': 'Yüz takibi başlatılamadı. 3B modu kullanılıyor.',
    'status.demo': '3B modu. Modeli sürükleyerek döndürün.',
    'status.loading3d': 'Anatomi yükleniyor…',

    'meter.face': 'yüz', 'meter.tris': 'üçgen',

    'panel.layers': 'Katmanlar', 'panel.look': 'Görünüm', 'panel.mr': 'Karma gerçeklik',
    'panel.view': 'Gövde görünümü',
    'view.mirror': 'Ayna', 'view.full': 'Tam boy',
    'view.hint': 'Ayna: iskelet göz aralığınıza 1:1 oturur — kafatası yüzünüzde, omurga ve kaburgalar gövdenizde; kameradan uzaklaştıkça daha çoğu görünür. Tam boy: iskelet ayrı bir figür olarak ayakta durur (B).',
    'panel.fit': 'Yüzüme otur', 'panel.note': 'Anatomi tek bir yetişkinin gerçek 3B verisinden gelir ve yüzünüze ölçeklenir. Sizin tomografiniz değildir, tıbbi bir araç değildir.',
    'preset.head': 'Kafam',
    'preset.chest': 'Göğsüm',
    'preset.all': 'Hepsi', 'preset.skeleton': 'İskelet', 'preset.skull': 'Kafatası', 'preset.brain': 'Beyin', 'preset.muscles': 'Kaslar',
    'layer.skull': 'Kafatası', 'layer.brain': 'Beyin', 'layer.muscles': 'Yüz kasları', 'layer.eyes': 'Gözler',
    'layer.neck': 'Boyun', 'layer.labels': 'Etiketler', 'layer.skeleton': 'İskelet',
    'filter.skeleton': 'İskelet', 'f7.title': 'Baştan ayağa iskelet',
    'f7.text': 'Kafatasının altında boyun, göğüs ve bel omurları, 24 kaburga, leğen kemiği, kol ve bacak kemikleri; el ve ayak parmaklarına kadar. Tek bir vücudun gerçek kemik verisi.',
    'f7.tag': 'kemik grubu',
    'style.xray': 'X-ray', 'style.solid': 'Katı', 'style.wire': 'Çizgi',
    'ctrl.bright': 'Parlaklık', 'ctrl.real': 'Gerçek benlik', 'ctrl.feather': 'Kenar yumuşatma',
    'ctrl.reveal': 'Açılan bölge', 'ctrl.cut': 'Kesim', 'ctrl.autofit': 'Otomatik hizala',
    'ctrl.size': 'Boyut', 'ctrl.dx': 'Sağ / sol', 'ctrl.dy': 'Yukarı / aşağı', 'ctrl.dz': 'Öne / arkaya',
    'ctrl.fitreset': 'Hizalamayı sıfırla', 'ctrl.data': 'Takip verisini göster',
    'reveal.whole': 'Tüm kafa', 'reveal.left': 'Sol yarı', 'reveal.right': 'Sağ yarı',
    'reveal.top': 'Üst kısım', 'reveal.bottom': 'Alt yüz', 'reveal.lens': 'X-ray merceği',
    'fit.hint': 'Otomatik hizalama göz aralığınızı ölçer. İnce ayar için kaydırıcıları kullanın.',

    'toast.bodyHint': 'Kafanız ve kameradaki tüm bedeniniz x-ray. Sadece kafanız için “Kafam”, sadece göğsünüz için “Göğsüm”.',
    'toast.noFaceTip': 'Yüzünüz algılanamıyor: ışığı önünüze alın, kameraya 50–70 cm yaklaşın.',
    'toast.snapshot': 'Kare indirildi.',
    'toast.noSnap': 'Kare alınamadı.',
    'toast.camOn': 'Kamera açık.',
    'toast.camOff': 'Kamera kapatıldı.',
    'toast.fs': 'Tam ekran için bu tuşu kullanın.',
    'toast.highlight': 'Yapı vurgulandı: {name}',
    'toast.copy': 'Bağlantı kopyalandı.',

    'features.eyebrow': 'Ne görüyorsunuz',
    'features.title': 'İçinizde ne var?',
    'features.lede': 'Altı katman, 51 adlandırılmış yapı, baştan ayağa iskelet. Her katmanı tek tek açın, birlikte gösterin, ışın merceğiyle noktasal inceleyin.',
    'f1.title': 'Kafatası', 'f1.text': 'Alın, şakak, yanak ve çene kemikleri; dişler dahil. Kafatası gerçek tarama verisinden gelir, her kemiğin kendi yüzeyi vardır.', 'f1.tag': 'kemik',
    'f2.title': 'Beyin', 'f2.text': 'Büyük beyin, beyincik ve beyin sapı. Kıvrımlarıyla birlikte kafatasının içine tam oturur.', 'f2.tag': 'bölge',
    'f3.title': 'Yüz kasları', 'f3.text': 'Şakak, çiğneme, göz çevresi ve dudak kasları. Gülümserken hangi kasın çalıştığını hayal edin.', 'f3.tag': 'kas grubu',
    'f4.title': 'Gözler ve boyun', 'f4.text': 'Göz küreleri yörüngelerinde, boyun omurları başınızı taşıyan zincir. Kafanızı çevirdikçe hepsi birlikte döner.', 'f4.tag': 'omur',
    'f5.title': 'Kendi yüzünüz', 'f5.text': 'Gerçek görüntü ile anatomi karışır: “Gerçek benlik” kaydırıcısı ile kendi yüzünüzü anatominin içinden görürsünüz.', 'f5.tag': 'karışım',
    'f6.title': 'Mercek modu', 'f6.text': 'Tüm kafa yerine sadece imlecinizin veya parmağınızın altındaki daireyi açın; kemikler o pencerede görünür.', 'f6.tag': 'etkileşim',

    'anatomy.eyebrow': 'Anatomi kütüphanesi', 'anatomy.title': 'Yapıları tek tek tanıyın',
    'anatomy.lede': '51 yapının adı, yeri ve işlevi. Bir yapıya dokunun: 3B sahnede vurgulanır, açıklaması burada açılır.',
    'anatomy.empty': 'Listeden bir yapı seçin.', 'anatomy.showIn3d': '3B sahnede göster', 'anatomy.layer': 'Katman', 'anatomy.latin': 'Latince',
    'search.ph': 'Ara: kafatası, beyin, masseter…',
    'filter.all': 'Tümü', 'filter.skull': 'Kemik', 'filter.brain': 'Beyin', 'filter.muscles': 'Kas', 'filter.eyes': 'Göz', 'filter.neck': 'Boyun',
    'anatomy.count': '{n} yapı',

    'how.eyebrow': 'Nasıl çalışır', 'how.title': 'Dört adım, hepsi cihazınızda',
    'how.s1t': 'Kamera izni', 'how.s1': 'Tarayıcı kameranızı ister. Görüntü yalnızca bu sekmede, bellekte kalır; hiçbir yere gönderilmez.',
    'how.s2t': 'Yüz takibi', 'how.s2': 'Cihaz içi bir sinir ağı 68 yüz noktası bulur; göz aralığınız, dönüşünüz ve eğiminiz her karede ölçülür.',
    'how.s3t': '3B hizalama', 'how.s3': 'Anatomi modeli göz aralığınıza ölçeklenir, yüzünüzün dönüşüne göre yumuşatılmış bir filtreyle döner.',
    'how.s4t': 'Röntgen karışımı', 'how.s4': 'Kemik ve dokular gerçek görüntünün üzerine ekran karışımıyla çizilir; yoğunluk arttıkça parlarlar — tıpkı bir röntgende olduğu gibi.',

    'privacy.eyebrow': 'Gizlilik', 'privacy.title': 'Kameranız sadece sizin',
    'privacy.lede': 'Bu sayfa statik bir sitedir. Sunucuda çalışan bir kod, veritabanı, çerez veya analitik yoktur.',
    'privacy.p1': 'Video akışı tarayıcıdan dışarı çıkmaz; ağ isteği olarak hiçbir kare gönderilmez.',
    'privacy.p2': 'Yüz takibi ve 3B çizim tamamen WebGL ve WebAssembly ile cihazınızda yapılır.',
    'privacy.p3': 'Hiçbir görüntü kaydedilmez; “Kare al” düğmesi yalnızca sizin indirdiğiniz bir PNG üretir.',
    'privacy.p4': 'Tercihleriniz (katman, dil, parlaklık) yalnızca bu tarayıcının yerel deposunda tutulur.',

    'faq.eyebrow': 'Sık sorulanlar', 'faq.title': 'Merak edilenler',
    'faq.q1': 'Kamera açılmıyor, ne yapmalıyım?',
    'faq.a1': 'Tarayıcı adres çubuğundaki kilit simgesinden kamera iznini kontrol edin. Sayfa HTTPS üzerinden açılmalı (GitHub Pages öyle). Başka bir uygulama kamerayı kullanıyorsa kapatın. Yine olmazsa “Kamera olmadan dene” ile 3B modeli inceleyebilirsiniz.',
    'faq.q2': 'Bu benim tomografim mi?',
    'faq.a2': 'Hayır. Anatomi, açık lisanslı gerçek bir 3B veri kümesinden (yetişkin bir erkek) gelir ve yüzünüzün ölçülerine göre ölçeklenir. Yapıların tipik olarak nerede durduğunu gösterir; kişisel bir görüntüleme değildir.',
    'faq.q3': 'Tıbbi teşhis için kullanılır mı?',
    'faq.a3': 'Kesinlikle hayır. Bu bir eğitim ve deney aracıdır, tıbbi cihaz değildir. Sağlıkla ilgili sorularınız için hekiminize başvurun.',
    'faq.q4': 'Neden kafam tam oturmuyor?',
    'faq.a4': 'Yüz oranları kişiden kişiye değişir. “Yüzüme otur” bölümündeki boyut ve konum kaydırıcılarıyla ince ayar yapın; otomatik hizalama göz aralığınızı esas alır.',
    'faq.q5': 'Telefonda çalışır mı?',
    'faq.a5': 'Evet, WebGL2 destekleyen güncel mobil tarayıcılarda çalışır. Küçük ekranlarda panel sahnenin altına iner; parlaklığı ve katman sayısını azaltarak performansı artırabilirsiniz.',
    'faq.q6': 'Veri nereden geliyor?',
    'faq.a6': 'Kafatası ve beyin Z-Anatomy (CC BY-SA 4.0) atlasından, yüz kasları, gözler ve boyun omurları BodyParts3D (CC BY-SA 2.1 Japonya) veri tabanından. Her ikisi de açık lisanslıdır; krediler bölümünde ayrıntı var.',

    'credits.eyebrow': 'Krediler ve lisans', 'credits.title': 'Kim ne yaptı',
    'credits.zanatomy': 'Kafatası ve beyin yüzeyleri. Açık kaynak 3B anatomi atlası, CC BY-SA 4.0. BodyParts3D üzerine kuruludur.',
    'credits.bpd': 'Yüz kasları, göz küreleri ve boyun omurları. Japonya Veri Tabanı Merkezi (DBCLS) veri tabanı.',
    'credits.three': 'WebGL sahnesi, özel röntgen gölgelendiricileri.',
    'credits.faceapi': 'Cihaz içi yüz algılama ve 68 nokta takibi (TensorFlow.js).',
    'credits.note': 'Bu projenin kodu MIT lisansıyla paylaşılır. 3B anatomi türevleri CC BY-SA koşullarını korur; yeniden yayınlarken kaynak ve lisans bilgisini koruyun.',

    'footer.made': 'Tarayıcıda çalışan açık kaynak bir deney.',
    'footer.medical': 'Tıbbi cihaz değildir. Teşhis amacıyla kullanılamaz.',
    'lang.other': 'EN',
  },

  en: {
    'skip': 'Skip to content',
    'nav.mirror': 'Mirror', 'nav.anatomy': 'Anatomy', 'nav.how': 'How it works', 'nav.faq': 'FAQ',

    'hero.eyebrow': 'A live anatomy mirror',
    'hero.title': 'Look at your own<br>X-ray in the mirror.',
    'hero.lede': 'Open your camera: skull, brain, facial muscles and a full skeleton — all from real 3D anatomical data — land on your face and move with you.',
    'hero.fact1': 'triangles of real anatomy', 'hero.fact2': 'on your device', 'hero.fact3': 'layers, head-to-toe skeleton',

    'btn.start': 'Start camera', 'btn.demo': 'Try without a camera',
    'btn.startCam': 'Start camera', 'btn.orbit': 'Just show me the 3D',

    'intro.kicker': 'When you are ready',
    'intro.title': 'X-RAY MIRROR',
    'intro.text': 'Start the camera and allow access. When your face appears, the skull and brain line up with it automatically. Drag the model to turn it.',
    'intro.privacy': 'The video never leaves your device. No server, no recording.',

    'tool.cam': 'Camera', 'tool.snap': 'Snapshot', 'tool.full': 'Fullscreen', 'tool.reset': 'Reset', 'tool.keys': 'Shortcuts',
    'key.skull': 'Skull', 'key.brain': 'Brain', 'key.muscles': 'Muscles', 'key.eyes': 'Eyes', 'key.neck': 'Neck',
    'key.skeleton': 'Skeleton', 'key.body': 'Full body / mirror',
    'key.xray': 'X-ray / solid', 'key.labels': 'Labels', 'key.reveal': 'Reveal mode', 'key.full': 'Fullscreen',
    'key.reset': 'Reset', 'key.help': 'This list',

    'status.idle': 'Ready. Start the camera.',
    'status.requesting': 'Asking for camera permission…',
    'status.loading': 'Loading the face tracker…',
    'status.live': 'Live. Turn your head and the anatomy turns with it.',
    'status.noface': 'Live, but no face found. Face the light and move closer.',
    'status.denied': 'Camera permission was refused. Allow it in the browser settings, or use 3D mode.',
    'status.nocam': 'No camera found. You can still use 3D mode.',
    'status.insecure': 'The camera needs a secure (https) connection.',
    'status.unsupported': 'This browser does not expose camera access.',
    'status.stopped': 'Camera off. Showing the 3D model.',
    'status.error': 'The face tracker could not start. Falling back to 3D mode.',
    'status.demo': '3D mode. Drag the model to turn it.',
    'status.loading3d': 'Loading anatomy…',

    'meter.face': 'face', 'meter.tris': 'tris',

    'panel.layers': 'Layers', 'panel.look': 'Look', 'panel.mr': 'Mixed reality',
    'panel.view': 'Body view',
    'view.mirror': 'Mirror', 'view.full': 'Full body',
    'view.hint': 'Mirror: the skeleton sits 1:1 on your eye distance — skull on your face, spine and ribs on your torso; step back and more of it shows. Full body: the skeleton stands as a separate figure (B).',
    'panel.fit': 'Fit to my head', 'panel.note': 'The anatomy is a real 3D dataset of one adult, scaled to your face. It is not a scan of you and not a medical tool.',
    'preset.head': 'My head', 'preset.chest': 'My chest', 'preset.all': 'Everything', 'preset.skeleton': 'Skeleton', 'preset.skull': 'Skull', 'preset.brain': 'Brain', 'preset.muscles': 'Muscles',
    'layer.skull': 'Skull', 'layer.brain': 'Brain', 'layer.muscles': 'Face muscles', 'layer.eyes': 'Eyes',
    'layer.neck': 'Neck', 'layer.labels': 'Labels', 'layer.skeleton': 'Skeleton',
    'filter.skeleton': 'Skeleton', 'f7.title': 'Skeleton, head to toe',
    'f7.text': 'Under the skull: neck, thoracic and lumbar spine, 24 ribs, pelvis, arms and legs — down to the finger and toe bones. Real bone geometry of one body.',
    'f7.tag': 'bone groups',
    'style.xray': 'X-ray', 'style.solid': 'Solid', 'style.wire': 'Wire',
    'ctrl.bright': 'Brightness', 'ctrl.real': 'Real me showing', 'ctrl.feather': 'Edge feather',
    'ctrl.reveal': 'Reveal', 'ctrl.cut': 'Cut position', 'ctrl.autofit': 'Auto align',
    'ctrl.size': 'Size', 'ctrl.dx': 'Left / right', 'ctrl.dy': 'Up / down', 'ctrl.dz': 'Forward / back',
    'ctrl.fitreset': 'Reset fit', 'ctrl.data': 'Show tracking data',
    'reveal.whole': 'Whole head', 'reveal.left': 'Left half only', 'reveal.right': 'Right half only',
    'reveal.top': 'Top of the head', 'reveal.bottom': 'Lower face', 'reveal.lens': 'X-ray lens',
    'fit.hint': 'Auto align measures the distance between your eyes. Use the sliders for fine tuning.',

    'toast.bodyHint': 'Your head and everything else the camera sees is x-ray. Tap “My head” or “My chest” to narrow it down.',
    'toast.noFaceTip': 'Cannot see your face: put the light in front of you and move 50–70 cm closer to the camera.',
    'toast.snapshot': 'Snapshot downloaded.',
    'toast.noSnap': 'Could not capture the frame.',
    'toast.camOn': 'Camera on.',
    'toast.camOff': 'Camera off.',
    'toast.fs': 'Use this button for fullscreen.',
    'toast.highlight': 'Structure highlighted: {name}',
    'toast.copy': 'Link copied.',

    'features.eyebrow': 'What you are looking at',
    'features.title': 'What is inside your head?',
    'features.lede': 'Six layers, 51 named structures, a skeleton from head to toe. Show them one at a time, all together, or inspect a spot with the X-ray lens.',
    'f1.title': 'Skull', 'f1.text': 'Frontal, temporal, cheek and jaw bones, teeth included. The skull comes from real scan-derived geometry, with every bone its own surface.', 'f1.tag': 'bones',
    'f2.title': 'Brain', 'f2.text': 'Cerebrum, cerebellum and brainstem, sitting inside the cranial cavity the way they should.', 'f2.tag': 'regions',
    'f3.title': 'Face muscles', 'f3.text': 'Temple, chewing, eye-ring and lip muscles. Imagine which one is working while you smile.', 'f3.tag': 'muscle groups',
    'f4.title': 'Eyes and neck', 'f4.text': 'The globes in their orbits, and the chain of neck vertebrae that carries your head. Turn your head and they all turn with it.', 'f4.tag': 'vertebrae',
    'f5.title': 'Your own face', 'f5.text': 'The live video blends with the anatomy: “Real me showing” lets you see your face through the inside of your skull.', 'f5.tag': 'blend',
    'f6.title': 'Lens mode', 'f6.text': 'Instead of opening the whole head, open only a circle under your cursor or fingertip; the bones appear in that window.', 'f6.tag': 'interaction',

    'anatomy.eyebrow': 'Anatomy library', 'anatomy.title': 'Learn the parts one by one',
    'anatomy.lede': 'The name, place and job of 51 structures. Pick one: it is highlighted in the 3D scene and explained here.',
    'anatomy.empty': 'Pick a structure from the list.', 'anatomy.showIn3d': 'Show in 3D', 'anatomy.layer': 'Layer', 'anatomy.latin': 'Latin',
    'search.ph': 'Search: skull, brain, masseter…',
    'filter.all': 'All', 'filter.skull': 'Bone', 'filter.brain': 'Brain', 'filter.muscles': 'Muscle', 'filter.eyes': 'Eye', 'filter.neck': 'Neck',
    'anatomy.count': '{n} structures',

    'how.eyebrow': 'How it works', 'how.title': 'Four steps, all on your device',
    'how.s1t': 'Camera permission', 'how.s1': 'The browser asks for your camera. The picture stays in this tab, in memory; nothing is uploaded.',
    'how.s2t': 'Face tracking', 'how.s2': 'An on-device neural network finds 68 facial points; your eye distance, turn and tilt are measured every frame.',
    'how.s3t': '3D alignment', 'how.s3': 'The anatomical model is scaled to your eye distance and rotated to your head, with a smoothing filter.',
    'how.s4t': 'X-ray blend', 'how.s4': 'Bone and tissue are drawn additively over the live picture: the more layers a ray crosses, the brighter it gets — like a radiograph.',

    'privacy.eyebrow': 'Privacy', 'privacy.title': 'Your camera stays yours',
    'privacy.lede': 'This is a static site. There is no server-side code, no database, no cookies and no analytics.',
    'privacy.p1': 'The video stream never leaves the browser; not a single frame is sent as a network request.',
    'privacy.p2': 'Face tracking and 3D rendering run entirely on your device with WebGL and WebAssembly.',
    'privacy.p3': 'Nothing is recorded; the Snapshot button only produces a PNG that you download yourself.',
    'privacy.p4': 'Your preferences (layers, language, brightness) live only in this browser’s local storage.',

    'faq.eyebrow': 'FAQ', 'faq.title': 'Good questions',
    'faq.q1': 'The camera will not open — what now?',
    'faq.a1': 'Check the camera permission behind the lock icon in the address bar. The page must be served over HTTPS (GitHub Pages is). Close any other app that is using the camera. If it still fails, use “Try without a camera” to explore the model.',
    'faq.q2': 'Is this a scan of me?',
    'faq.a2': 'No. The anatomy is an open-licensed 3D dataset of one adult male, scaled to your face. It shows where structures typically sit; it is not a personal image.',
    'faq.q3': 'Can it be used for diagnosis?',
    'faq.a3': 'Never. This is an educational toy, not a medical device. Talk to a clinician about anything health related.',
    'faq.q4': 'Why does the skull not fit my head?',
    'faq.a4': 'Facial proportions differ from person to person. Use the size and offset sliders under “Fit to my head”; auto align uses the distance between your eyes as its reference.',
    'faq.q5': 'Does it work on a phone?',
    'faq.a5': 'Yes, in current mobile browsers with WebGL2. On small screens the panel drops below the stage; fewer layers and lower brightness will keep it smooth.',
    'faq.q6': 'Where does the data come from?',
    'faq.a6': 'The skull and brain come from the Z-Anatomy atlas (CC BY-SA 4.0); the facial muscles, eyes and neck vertebrae from BodyParts3D (CC BY-SA 2.1 Japan). Both are openly licensed — see the credits.',

    'credits.eyebrow': 'Credits and licence', 'credits.title': 'Who made what',
    'credits.zanatomy': 'Skull and brain surfaces from the open-source 3D anatomy atlas, CC BY-SA 4.0, built on BodyParts3D.',
    'credits.bpd': 'Facial muscles, eye globes and neck vertebrae from the Database Center for Life Science (DBCLS), Japan.',
    'credits.three': 'WebGL scene and the custom radiograph shaders.',
    'credits.faceapi': 'On-device face detection and 68-point tracking (TensorFlow.js).',
    'credits.note': 'The code of this project is shared under MIT. The 3D anatomical derivatives keep their CC BY-SA terms — keep the attribution when you redistribute them.',

    'footer.made': 'An open-source experiment that runs in your browser.',
    'footer.medical': 'Not a medical device. Not for diagnosis.',
    'lang.other': 'TR',
  },
};

let lang = 'tr';
export const getLang = () => lang;

export function setLang(next) {
  lang = next === 'en' ? 'en' : 'tr';
  document.documentElement.lang = lang;
  return lang;
}

export function t(key, vars) {
  const raw = DICT[lang][key] ?? DICT.tr[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

/** Apply translations to every element carrying a data-i18n / data-i18n-ph attribute. */
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = t(key);
    if (value && value !== key) el.innerHTML = value;
  });
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
  });
}

export function autoLang() {
  const stored = localStorage.getItem('xrm.lang');
  if (stored === 'tr' || stored === 'en') return stored;
  const nav = (navigator.language || 'tr').toLowerCase();
  return nav.startsWith('tr') ? 'tr' : 'en';
}
