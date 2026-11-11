# X-Ray Mirror — Canlı anatomi aynası

> Kameranızı açın; kendi kafanızın içindeki kafatasını, beyni ve yüz kaslarını gerçek zamanlı görün.
> Gerçek 3B anatomi verisi yüzünüze oturur, siz hareket ettikçe sizinle döner. Her şey tarayıcınızda çalışır — görüntü cihazınızdan çıkmaz.

**Canlı site:** <https://keykavus324-svg.github.io/X-RAY-ANATOMY-TUGRUL/>

---

## İçindekiler

- [Ne yapar](#ne-yapar)
- [Özellikler](#özellikler)
- [Kontroller](#kontroller)
- [Nasıl çalışır](#nasıl-çalışır)
- [Anatomi verisi](#anatomi-verisi)
- [Gizlilik](#gizlilik)
- [Yerelde çalıştırma](#yerelde-çalıştırma)
- [Yeniden derleme (model hattı)](#yeniden-derleme-model-hattı)
- [Yayınlama](#yayınlama)
- [Tarayıcı desteği](#tarayıcı-desteği)
- [Lisanslar ve krediler](#lisanslar-ve-krediler)
- [English](#english)

---

## Ne yapar

Sayfa açıldığında 3B anatomi modeli kendi kendine döner. "Kamerayı başlat" dediğinizde:

1. Tarayıcı kamera izni ister (görüntü hiçbir yere gönderilmez).
2. Cihaz içi bir yüz modeli 68 nokta bulur.
3. Kafatası, beyin, yüz kasları, gözler ve boyun omurları göz aralığınıza göre ölçeklenir, başınızın dönüşüne göre yumuşatılmış biçimde döner. Boynun altındaki iskelet dik durur, sadece hafifçe salınır.
4. "Tam boy iskelet" düğmesi bütün vücudu sahaya sığdırır: kafatasından ayak parmaklarına kadar 102 parça.
5. Anatomi, gerçek görüntünüzün üzerine röntgen gibi ekran karışımıyla çizilir.

Kamera olmadan da çalışır: "Kamera olmadan dene" modeli sürükleyip döndürebileceğiniz bir 3B görüntüleyiciye çevirir.

## Özellikler

- **Gerçek anatomi:** 51 adlandırılmış yapı, 102 ayrı mesh, **251.894 üçgen / 126.402 tepe noktası** — prosedürel bir kafa değil, taranmış yüzeyler.
- **Altı katman:** kafatası (25 parça), beyin (3), yüz kasları (27), gözler (2), boyun (7), **iskelet (38 parça: omurga, 24 kaburga, leğen, kol ve bacak kemikleri, el-ayak)**. Tek tek açılıp kapatılabilir, hazır ön ayarlar var.
- **İki gövde görünümü:** varsayılan **Ayna** — iskelet göz aralığınıza 1:1 ölçeklenir, kafatası yüzünüzde, omurga ve kaburgalar göğsünüzde durur (kameradan uzaklaştıkça gövdenin daha çoğu görünür). **Tam boy** ise 102 parçanın tamamını ayakta, ayak parmaklarına kadar sahaya sığdırır; figür sahnenin zemininde durur ve yana kaydığınızda sizi yatay olarak takip eder. Panelden ya da `B` ile geçilir.
- **Üç görünüm:** X-ray (ekran karışımı, kenar parlaması), katı (ışıklı), çizgi (wireframe).
- **Açılan bölge:** tüm kafa · sol yarı · sağ yarı · üst kısım · alt yüz · **X-ray merceği** (imlecin/parmağın altındaki daire). Kesim düzlemi model uzayında çalışır, yani kafayla birlikte döner.
- **Otomatik hizalama:** göz aralığı (IOD) ölçülür; boyut, sağ-sol, yukarı-aşağı, öne-arkaya ince ayarı elle de yapılabilir.
- **Karma gerçeklik:** "Gerçek benlik" kaydırıcısı videonun yoğunluğunu ayarlar; anatomi onun üzerinde okunur.
- **Anatomi kütüphanesi:** aranabilir 51 yapı listesi (TR + Latince), katman filtresi, seçilen yapı 3B sahnede vurgulanır.
- **Etiketler:** 2D katman üzerinde lider çizgili, çakışmasız yerleşim.
- **Kare al:** video + WebGL + etiketler tek PNG'de birleştirilir (indirme).
- **Türkçe / İngilizce**, tercihler `localStorage`'da, klavye kısayolları, tam ekran, erişilebilirlik (skip link, ARIA, `prefers-reduced-motion`).
- **Bağımlılık yok, CDN yok:** three.js ve face-api.js depo içinde (`vendor/`), çevrimdışı da açılır.

## Kontroller

| Girdi | Etki |
| --- | --- |
| `1` … `6` | Kafatası / beyin / kaslar / gözler / boyun / iskelet katmanını aç-kapat |
| `B` | Gövde görünümü: ayna ↔ tam boy |
| `X` | Görünüm: X-ray → katı → çizgi |
| `L` | Etiketler |
| `V` | Açılan bölge modunu döndür |
| `F` | Tam ekran |
| `R` | Sıfırla |
| `?` veya `/` | Kısayol listesi |
| Sürükle (kamera kapalıyken) | Modeli döndür; bıraktığınızda ataletle söner |
| İmleç / parmak (mercek modunda) | X-ray merceğini taşı |

Panelden ayrıca: katman ön ayarları, parlaklık, "Gerçek benlik", kenar yumuşatma, kesim, boyut/konum kaydırıcıları, otomatik hizalama, takip verisi okuması.

## Nasıl çalışır

```
kamera ──► face-api (TinyFaceDetector + 68 landmark, TensorFlow.js/WebGL)
             │  68 nokta  →  ölçüm: göz merkezi, IOD, roll, burun kayması, çene oranı
             ▼
        HeadPose (low-pass + 1€ benzeri yumuşatma, yavaş adapte olan taban çizgisi)
             │  x, y, iod(px), yaw, pitch, roll
             ▼
        Stage (three.js)  ──  dünya birimi = CSS pikseli @ z=0
             │  ölçek = IOD(px) × kullanıcı ayarı → model göz aralığı 1 birim
             ▼
        ShaderMaterial (röntgen)  ──  ekran karışımı, kesim düzlemi / mercek maskesi
```

- **Kare başına iş:** yüz tespiti ~24 fps'e kısılır (arada karelerde son ölçüm yumuşatılarak kullanılır), çizim her karede.
- **Yumuşatma:** ölçümler üstel yumuşatıcıdan geçer; taban çizgisi (dik bakış) çok yavaş adapte olur, böylece "nötr" pozisyon kişiye göre kendini ayarlar.
- **Ölçek:** model uzayında göz bebekleri arası tam **1 birim**dir; bu yüzden hizalama tek bir çarpanla yapılır.
- **Kesim:** kesim düzlemi ve mercek maskesi fragment shader'da **model uzayında** hesaplanır → açılan bölge kafayla birlikte döner.
- **Kamera görüntüsü:** `<video>` aynalanır (`scaleX(-1)`), üstünde iki canvas: WebGL sahne (`#gl`) ve 2D etiket katmanı (`#labelLayer`).

## Anatomi verisi

| | |
| --- | --- |
| Dosya | `models/anatomy.bin` (2,65 MB) + `models/anatomy.json` (25 KB, meta) |
| İçerik | 102 mesh, 126.402 köşe, 251.894 üçgen, 51 yapı |
| Konum | `int16`, parça başına min + ext ile çözülür (`min + (q + 32767) / 65534 × ext`) |
| Normal | `int8` (`n / 127`) |
| İndeks | parça başına `uint16` (65.535'ten az köşe) |
| Çerçeve | orijin = göz bebekleri ortası, 1 birim = göz bebekleri arası, +Y yukarı, +Z öne |

Katmanlar: **kafatası 25** (dişler dahil), **beyin 3** (cerebrum, cerebellum, beyin sapı), **yüz kasları 27**, **gözler 2**, **boyun 7** (atlas, axis + 5 servikal omur), **iskelet 38** (12 göğüs + 5 bel omuru, sakrum, 24 kaburga, sternum, köprücük, kürek, pazı, radius, ulna, leğen, femur, diz kapağı, tibia, fibula, el ve ayak kemikleri).

Tam iskelet gövde yüksekliği 29,4 birimdir (1 birim = göz aralığı ≈ 58 mm), yani model baştan ayağa tek bir yetişkinin kemik verisidir. `models/anatomy.json` içindeki `bounds` bu tam aralığı verir ve "Tam boy" görünümü ölçeklemeyi buradan hesaplar.

## Gizlilik

Statik site; sunucu kodu, veritabanı, çerez, analitik yok. Video akışı ağ isteği olarak hiç gönderilmez; yüz takibi ve çizim tamamen cihazda yapılır. "Kare al" yalnızca sizin indirdiğiniz bir PNG üretir. Tercihler `localStorage`'da tutulur.

## Yerelde çalıştırma

ES modülleri ve `fetch` kullanıldığı için `file://` çalışmaz; küçük bir statik sunucu gerekir:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Kamera yalnızca `https://` veya `localhost` üzerinde açılır.

## Yeniden derleme (model hattı)

`tools/` klasöründe veri hattının kendisi var (Python 3 + numpy, trimesh, fast-simplification):

```bash
pip install -r tools/requirements.txt
python tools/build_geometry.py models            # 1. aşama: kafa (Z-Anatomy + BodyParts3D)
python tools/build_skeleton.py models            # 2. aşama: tam iskeleti ekler
node tools/check_site.mjs                        # tarayıcısız doğrulama
python tools/make_assets.py models assets        # og.png + uygulama ikonları
```

`tools/README.md` hattın adımlarını ve kaynak dosyaların nereden geldiğini anlatır. Derleme betiği, ürettiği sayıları (`counts`) ve yapı eşlemelerini doğrular; aynı girdilerle aynı çıktıyı verir.

## Yayınlama

Site tamamen statiktir; build adımı yoktur. GitHub Pages'ten yayınlamak için:

**Settings → Pages → Build and deployment → Source: _Deploy from a branch_ → Branch: `main`, klasör: `/ (root)` → Save**

Birkaç dakika içinde `https://keykavus324-svg.github.io/X-RAY-ANATOMY-TUGRUL/` adresinde yayında olur. Depoda `.nojekyll` dosyası var, olduğu gibi servis edilir. Kök klasör yerine `main` dalının kökü seçildiği için `vendor/`, `models/` ve `src/` yolları değişmeden çalışır.

## Tarayıcı desteği

WebGL2 + ES modülleri + `getUserMedia` gerektirir: Chrome/Edge 90+, Firefox 90+, Safari 15.4+ (iOS 15.4+). WebGL2 yoksa sayfa bunu söyleyip 3B'siz bir yedek ekran gösterir.

## Lisanslar ve krediler

| Bileşen | Kaynak | Lisans |
| --- | --- | --- |
| Uygulama kodu (`index.html`, `src/`, `assets/css`) | bu depo | MIT |
| Kafatası ve beyin yüzeyleri | [Z-Anatomy](https://www.z-anatomy.com/) atlası (BodyParts3D tabanlı) | CC BY-SA 4.0 |
| Yüz kasları, göz küreleri, boyun omurları | BodyParts3D, © The Database Center for Life Science | CC BY-SA 2.1 Japan |
| [three.js](https://threejs.org/) r181 | `vendor/three/` | MIT |
| [face-api.js](https://github.com/vladmandic/face-api) (TensorFlow.js dahil) | `vendor/face-api/` | MIT |

Zorunlu atıf metni:

> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan

Anatomi türevleri (`models/anatomy.bin`, `models/anatomy.json`) CC BY-SA koşullarını korur: yeniden yayınlarken bu atfı ve lisansı koruyun. Ayrıntı: [`LICENSE-ANATOMY.md`](LICENSE-ANATOMY.md).

> **Tıbbi cihaz değildir.** Eğitim ve deney amaçlıdır; teşhis veya tedavi için kullanılamaz.

---

## English

**X-Ray Mirror** is a browser-only "anatomy mirror": turn on your camera and a real 3D skull, brain, facial muscles, eyes, cervical spine and a **full skeleton down to the toes** are aligned to your face in real time.

**Live:** <https://keykavus324-svg.github.io/X-RAY-ANATOMY-TUGRUL/>

- Real scanned meshes — 51 named structures, 102 parts, **251,894 triangles / 126,402 vertices** — not a procedural head.
- Six layers (skull 25, brain 3, muscles 27, eyes 2, neck 7, skeleton 38), two body views (**mirror** aligned to your face, **full body** fitted to the stage), three looks (X-ray / solid / wire), six reveal modes including a cursor-following **X-ray lens**.
- Face alignment from 68 in-browser landmarks (`face-api.js` + TensorFlow.js), low-pass filtered, with a slowly adapting neutral pose; model units are normalised so the inter-ocular distance is exactly 1.
- Everything runs on device: no server, no uploads, no analytics, no CDN. Preferences live in `localStorage`.
- Turkish and English UI, keyboard shortcuts, fullscreen, snapshot to PNG, reduced-motion support.

**Run locally:** `python3 -m http.server 8000` → <http://localhost:8000> (camera needs HTTPS or localhost).

**Rebuild the data:** `python tools/build_geometry.py models && python tools/build_skeleton.py models` (see `tools/README.md`), then `node tools/check_site.mjs`.

**Licences:** code MIT; Z-Anatomy surfaces CC BY-SA 4.0; BodyParts3D-derived muscles/eyes/vertebrae CC BY-SA 2.1 Japan (attribution required, see above); three.js and face-api.js MIT. **Not a medical device.**
