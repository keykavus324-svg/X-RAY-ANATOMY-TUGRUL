/**
 * Structure catalogue — names, Latin terms and short descriptions.
 * Anchor coordinates live in models/anatomy.json; this file carries the words.
 * Layers: skull | brain | muscles | eyes | neck
 */
export const LAYERS = {
  skull:   { tr: 'Kemik',  en: 'Bone',   color: '#cfe6ff' },
  brain:   { tr: 'Beyin',  en: 'Brain',  color: '#ff9ec4' },
  muscles: { tr: 'Kas',    en: 'Muscle', color: '#ff6a5a' },
  eyes:    { tr: 'Göz',    en: 'Eye',    color: '#ffe9a8' },
  neck:    { tr: 'Boyun',  en: 'Neck',   color: '#a8c8ea' },
};

export const STRUCTURES = [
  { id: 'frontal', layer: 'skull', latin: 'Os frontale',
    tr: { name: 'Alın kemiği', desc: 'Kafatasının ön üst bölümünü tek parça hâlinde kaplayan kemik. Alın kavisi, kaş çıkıntıları ve göz çukurlarının üst duvarı buradan yapılır; içinde alın sinüsü adı verilen hava boşluğu bulunur.' },
    en: { name: 'Frontal bone', desc: 'One plate of bone forms the forehead and the roof of both eye sockets. It carries the brow ridges and, inside it, the frontal sinus — one reason the eyebrows look brighter on a radiograph.' } },

  { id: 'parietal', layer: 'skull', latin: 'Os parietale',
    tr: { name: 'Duvar kemiği (parietal)', desc: 'Kafatası kubbesinin üst ve yan duvarlarını yapan iki kemik. Orta hatta birbirine sagittal dikişle, önde alın kemiğine koronal dikişle bağlanır. Bebeklerde bu dikişler açıktır, bıngıldak adını alır.' },
    en: { name: 'Parietal bone', desc: 'The paired bones that build the roof and sides of the skull. They meet each other at the sagittal suture and the frontal bone at the coronal suture — in a newborn those seams are still open as the fontanelles.' } },

  { id: 'temporal', layer: 'skull', latin: 'Os temporale',
    tr: { name: 'Şakak kemiği', desc: 'Kulak kepçesinin arkasında yer alan, biçimi en karmaşık kafatası kemiği. İşitme ve denge organlarını barındıran kemik labirent, çene eklemi çukuru ve şakak kasının geçtiği yelpaze biçimli yüzey buradadır.' },
    en: { name: 'Temporal bone', desc: 'The most intricate bone of the skull, sitting behind the ear. It houses the bony labyrinth of hearing and balance, the socket of the jaw joint, and the fan-shaped surface the temporalis muscle slides under.' } },

  { id: 'occipital', layer: 'skull', latin: 'Os occipitale',
    tr: { name: 'Artkafa kemiği', desc: 'Kafatasının arkasını ve tabanının bir kısmını oluşturur. Omurilik soğanının omuriliğe dönüştüğü büyük delik (foramen magnum) bu kemiğin ortasındadır.' },
    en: { name: 'Occipital bone', desc: 'Forms the back and base of the cranium. The foramen magnum in its centre is the doorway where the brainstem turns into the spinal cord.' } },

  { id: 'sphenoid', layer: 'skull', latin: 'Os sphenoidale',
    tr: { name: 'Sfenoid kemik', desc: 'Kafatasının ortasına yerleşmiş, kelebek biçiminde karmaşık bir kemik. Neredeyse bütün kafatası kemikleriyle eklem yapar; hipofiz bezi, ortasındaki “Türk eğeri” (sella turcica) çukurunda oturur.' },
    en: { name: 'Sphenoid bone', desc: 'A butterfly-shaped bone in the middle of the skull that touches almost every other cranial bone. The pituitary gland sits in its central saddle, the sella turcica.' } },

  { id: 'ethmoid', layer: 'skull', latin: 'Os ethmoidale',
    tr: { name: 'Etmoid kemik', desc: 'Burun köprüsünün arkasındaki süngerimsi kemik. Koku sinirinin lifleri, delikli bir elek gibi olan lamina cribrosa’dan geçerek beyne ulaşır.' },
    en: { name: 'Ethmoid bone', desc: 'A light, spongy bone behind the bridge of the nose. The fibres of the smell nerve pass through its sieve-like cribriform plate on their way to the brain.' } },

  { id: 'nasal', layer: 'skull', latin: 'Os nasale',
    tr: { name: 'Burun kemiği', desc: 'Burun sırtının üst kısmını yapan küçük ikiz kemikler. Alt kısmı kıkırdaktan oluştuğu için röntgende sadece üst bölümü görünür.' },
    en: { name: 'Nasal bone', desc: 'The small paired bones at the top of the bridge of the nose. The lower half of the nose is cartilage, which is why only this upper part shows on a radiograph.' } },

  { id: 'maxilla', layer: 'skull', latin: 'Maxilla',
    tr: { name: 'Üst çene kemiği', desc: 'Üst dişleri taşıyan, göz çukurunun tabanını ve burun boşluğunun yan duvarını oluşturan kemik. İçindeki maksiller sinüs, kafatasının en büyük hava boşluklarındandır.' },
    en: { name: 'Maxilla', desc: 'Carries the upper teeth and forms the floor of the eye socket and the side wall of the nasal cavity. Its maxillary sinus is one of the largest air spaces in the skull.' } },

  { id: 'zygomatic', layer: 'skull', latin: 'Os zygomaticum',
    tr: { name: 'Elmacık kemiği', desc: 'Yanağın çıkıntısını yapan kemik. Şakak ve üst çene kemiğiyle birleşerek elmacık kemerini oluşturur; yüzün en sert darbe alan noktalarından biridir.' },
    en: { name: 'Zygomatic bone', desc: 'The cheekbone. Together with the temporal bone and maxilla it arches into the zygomatic arch — one of the strongest struts of the face and a common fracture site.' } },

  { id: 'lacrimal', layer: 'skull', latin: 'Os lacrimale',
    tr: { name: 'Gözyaşı kemiği', desc: 'Göz çukurunun iç duvarındaki en küçük kemik. Gözyaşının burun boşluğuna aktığı kanalın başlangıcını oluşturur.' },
    en: { name: 'Lacrimal bone', desc: 'The smallest bone of the face, on the inner wall of the eye socket. It begins the channel that drains tears into the nose.' } },

  { id: 'palatine', layer: 'skull', latin: 'Os palatinum',
    tr: { name: 'Damak kemiği', desc: 'Sert damağın arka bölümünü ve burun boşluğunun yan duvarını tamamlayan çift kemik.' },
    en: { name: 'Palatine bone', desc: 'Completes the back of the hard palate and the side wall of the nasal cavity.' } },

  { id: 'concha', layer: 'skull', latin: 'Concha nasalis inferior',
    tr: { name: 'Alt burun konkası', desc: 'Burun boşluğunun yan duvarındaki kıvrık kemik. Soluk alınan havayı ısıtıp nemlendirir ve tozu tutar.' },
    en: { name: 'Inferior nasal concha', desc: 'A curled shelf of bone on the side wall of the nose that warms, humidifies and filters the air you breathe in.' } },

  { id: 'vomer', layer: 'skull', latin: 'Vomer',
    tr: { name: 'Saban kemiği', desc: 'Burun bölmesinin alt-arka kısmını oluşturan ince, tek kemik. Adı “saban demiri” anlamına gelir.' },
    en: { name: 'Vomer', desc: 'A thin, single bone forming the lower back part of the nasal septum. Its name means “ploughshare”.' } },

  { id: 'mandible', layer: 'skull', latin: 'Mandibula',
    tr: { name: 'Alt çene kemiği', desc: 'Yüzün en büyük ve en hareketli kemiği. Çene eklemiyle şakak kemiğine bağlanır; çiğneme kasları onu kaldırır, öne ve yana çeker.' },
    en: { name: 'Mandible', desc: 'The largest and only mobile bone of the face. It hinges against the temporal bone and is driven by the chewing muscles — the strongest muscles in the body for their size.' } },

  { id: 'teeth', layer: 'skull', latin: 'Dentes',
    tr: { name: 'Dişler', desc: 'Üst ve alt çene kemiklerine gömülü diş sıraları. Mine, dentin ve pulpa katmanlarından oluşur; röntgende en yoğun, yani en parlak dokulardır.' },
    en: { name: 'Teeth', desc: 'Two arches of teeth set into the jaws. Enamel, dentine and pulp make them the densest tissue in the body — which is why they read as the brightest white on a radiograph.' } },

  { id: 'hyoid', layer: 'skull', latin: 'Os hyoideum',
    tr: { name: 'Dil kemiği', desc: 'Başka hiçbir kemiğe eklem yapmayan tek kemik. Dil ve boyun kasları ona asılır; yutkunma sırasında yukarı çekilir.' },
    en: { name: 'Hyoid bone', desc: 'The only bone that meets no other bone. The tongue and neck muscles hang from it, and it is pulled upward with every swallow.' } },

  { id: 'cerebrum', layer: 'brain', latin: 'Cerebrum',
    tr: { name: 'Büyük beyin', desc: 'Beynin en büyük parçası; iki yarım küreden oluşur. Düşünme, duyu, hareket, dil ve bellek işlevleri buradadır. Yüzeydeki kıvrımlar kortekin alanını katlar.' },
    en: { name: 'Cerebrum', desc: 'The largest part of the brain, in two hemispheres. Thought, sensation, movement, language and memory live here; the folded surface multiplies the area of the cortex.' },
    labels: { tr: ['Ön lob (frontal)', 'Yan lob (parietal)', 'Şakak lobu (temporal)', 'Artkafa lobu (oksipital)'],
              en: ['Frontal lobe', 'Parietal lobe', 'Temporal lobe', 'Occipital lobe'] } },

  { id: 'cerebellum', layer: 'brain', latin: 'Cerebellum',
    tr: { name: 'Beyincik', desc: 'Beyin sapının arkasındaki küçük beyin. Duruşu ve dengeyi korur, hareketlerin incelik ayarını yapar; adı “küçük beyin” demektir.' },
    en: { name: 'Cerebellum', desc: 'The “little brain” behind the brainstem. It keeps you balanced and refines movement, comparing what the body planned with what it actually did.' } },

  { id: 'brainstem', layer: 'brain', latin: 'Truncus encephali',
    tr: { name: 'Beyin sapı', desc: 'Beyni omuriliğe bağlayan bölge: orta beyin, pons ve omurilik soğanı. Solunum ve kalp atışı gibi hayati merkezler buradadır.' },
    en: { name: 'Brainstem', desc: 'The stalk that joins brain to spinal cord — midbrain, pons and medulla. Breathing, heart rate and consciousness are switched on here.' } },

  { id: 'eyeball', layer: 'eyes', latin: 'Bulbus oculi',
    tr: { name: 'Göz küresi', desc: 'Yörüngedeki yaklaşık 24 mm çapında küre. Dıştaki sklera tabakası röntgende görülen beyaz kısımdır; ışığı alan retina iç duvardadır.' },
    en: { name: 'Eyeball', desc: 'A globe about 24 mm across, sitting in the orbit. Its outer sclera is the white shell seen on imaging; the light-sensing retina lines the inside.' } },

  { id: 'frontalis', layer: 'muscles', latin: 'Venter frontalis',
    tr: { name: 'Alın kası', desc: 'Alın derisini yukarı kaldıran kas. Kaşları kaldırır, şaşkınlık ve dikkat ifadesini yapar.' },
    en: { name: 'Frontalis', desc: 'Lifts the skin of the forehead and raises the eyebrows — the muscle of surprise and attention.' } },

  { id: 'occipitalis', layer: 'muscles', latin: 'Venter occipitalis',
    tr: { name: 'Artkafa kası', desc: 'Kafa derisini arkaya doğru çeken kas; alın kasıyla birlikte tek bir kasık gibi çalışır.' },
    en: { name: 'Occipitalis', desc: 'Pulls the scalp backwards and works as one unit with the frontalis.' } },

  { id: 'temporalis', layer: 'muscles', latin: 'Musculus temporalis',
    tr: { name: 'Şakak kası', desc: 'Şakakta yelpaze gibi açılan geniş çiğneme kası. Alt çeneyi kaldırır ve arkaya çeker; diş sıkarken şakakta hissettiğiniz kas budur.' },
    en: { name: 'Temporalis', desc: 'A broad, fan-shaped chewing muscle that fills the temple. It lifts and retracts the jaw — the one you feel working when you clench your teeth.' } },

  { id: 'orbicularis_oculi', layer: 'muscles', latin: 'Musculus orbicularis oculi',
    tr: { name: 'Göz çevresi kası', desc: 'Gözü çevreleyen halka kas. Göz kapağını kapatır, göz kırpmayı ve gözyaşının yayılmasını sağlar.' },
    en: { name: 'Orbicularis oculi', desc: 'A ring of muscle around the eye that closes the lid and spreads tears with every blink.' } },

  { id: 'zygomaticus_major', layer: 'muscles', latin: 'Musculus zygomaticus major',
    tr: { name: 'Büyük elmacık kası', desc: 'Ağız köşesini yukarı ve dışa çeken kas — gülümsemenin baş mimarı.' },
    en: { name: 'Zygomaticus major', desc: 'Pulls the corner of the mouth up and out; the main author of a smile.' } },

  { id: 'zygomaticus_minor', layer: 'muscles', latin: 'Musculus zygomaticus minor',
    tr: { name: 'Küçük elmacık kası', desc: 'Üst dudağı ve ağız köşesini yukarı kaldıran ince kas.' },
    en: { name: 'Zygomaticus minor', desc: 'A slender muscle that lifts the upper lip and the corner of the mouth.' } },

  { id: 'orbicularis_oris', layer: 'muscles', latin: 'Musculus orbicularis oris',
    tr: { name: 'Ağız çevresi kası', desc: 'Ağzı çevreleyen halka kas. Dudakları kapatır; öpücük, ıslık ve üfleme hareketlerini yapar.' },
    en: { name: 'Orbicularis oris', desc: 'The ring muscle of the mouth: closes the lips and shapes whistling, kissing and blowing.' } },

  { id: 'masseter', layer: 'muscles', latin: 'Musculus masseter',
    tr: { name: 'Çiğneme kası', desc: 'Elmacık kemiğinden alt çeneye uzanan kalın kas. Kütlesine göre vücudun en güçlü kası sayılır; alt çeneyi kaldırır.' },
    en: { name: 'Masseter', desc: 'A thick muscle from the cheekbone down to the jaw. Pound for pound the strongest muscle in the body and the main lifter of the jaw.' } },

  { id: 'pterygoid_lat', layer: 'muscles', latin: 'Musculus pterygoideus lateralis',
    tr: { name: 'Dış kanat kası', desc: 'Kafatası tabanının derininde yer alan çiğneme kası. Alt çeneyi öne ve yana hareket ettirir; ağzı açmanın ilk hareketini başlatır.' },
    en: { name: 'Lateral pterygoid', desc: 'A deep chewing muscle under the skull base that pulls the jaw forward and sideways, and starts the opening of the mouth.' } },

  { id: 'nasalis', layer: 'muscles', latin: 'Musculus nasalis',
    tr: { name: 'Burun kası', desc: 'Burun deliklerini genişleten küçük kas; derin nefes alırken burun kanatlarını açar.' },
    en: { name: 'Nasalis', desc: 'A small muscle that flares the nostrils when you take a deep breath.' } },

  { id: 'platysma', layer: 'muscles', latin: 'Platysma',
    tr: { name: 'Boyun deri kası', desc: 'Yüzün alt kısmından göğse uzanan ince, yüzeysel kas. Cildi aşağı çekerek gerginlik ifadesini oluşturur.' },
    en: { name: 'Platysma', desc: 'A thin sheet from the lower face to the chest that pulls the skin of the neck into the look of tension.' } },

  { id: 'atlas', layer: 'neck', latin: 'Atlas (C1)',
    tr: { name: 'Atlas omuru (C1)', desc: 'İlk boyun omuru. Gövdesi yoktur, halka biçimindedir ve kafatasını taşır; başın öne-arkaya sallanma hareketi burada olur.' },
    en: { name: 'Atlas (C1)', desc: 'The first cervical vertebra: a ring without a body that carries the skull. Nodding yes happens here.' } },

  { id: 'axis', layer: 'neck', latin: 'Axis (C2)',
    tr: { name: 'Axis omuru (C2)', desc: 'İkinci boyun omuru. Yukarı uzanan dişi (dens) atlasın içinde döner; başın sağa sola “hayır” hareketi burada gerçekleşir.' },
    en: { name: 'Axis (C2)', desc: 'The second vertebra. Its upward peg, the dens, is the pivot the atlas turns around — shaking your head no happens here.' } },

  { id: 'cervical', layer: 'neck', latin: 'Vertebrae cervicales',
    tr: { name: 'Boyun omurları (C3–C7)', desc: 'Boynun alt bölümündeki beş omur. Omurilik kanalını korur, başı dengede tutar ve boyna geniş bir hareket açısı verir.' },
    en: { name: 'Cervical vertebrae (C3–C7)', desc: 'The five lower neck vertebrae. They guard the spinal cord, balance the head and give the neck its wide range of motion.' } },
];

export const BY_ID = Object.fromEntries(STRUCTURES.map((s) => [s.id, s]));
