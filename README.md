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
3. Kafatası, beyin, yüz kasları, gözler ve boyun omurları göz aralığınıza göre ölçeklenir, başınızın dönüş ve eğimine göre yumuşatılmış biçimde döner.
4. Anatomi, gerçek görüntünüzün üzerine röntgen gibi ekran karışımıyla çizilir.

Kamera olmadan da çalışır: "Kamera olmadan dene" modeli sürükleyip döndürebileceğiniz bir 3B görüntüleyiciye çevirir.

## Özellikler

- **Gerçek anatomi:** 34 adlandırılmış yapı, 64 ayrı mesh, **175.918 üçgen / 88.130 tepe noktası** — prosedürel bir kafa değil, taranmış yüzeyler.
- **Beş katman:** kafatası (25 parça), beyin (3), yüz kasları (27), gözler (2), boyun (7). Tek tek açılıp kapatılabilir, hazır ön ayarlar var.
- **Üç görünüm:** X-ray (ekran karışımı, kenar parlaması), katı (ışıklı), çizgi (wireframe).
- **Açılan bölge:** tüm kafa · sol yarı · sağ yarı · üst kısım · alt yüz · **X-ray merceği** (imlecin/parmağın altındaki daire). Kesim düzlemi model uzayında çalışır, yani kafayla birlikte döner.
- **Otomatik hizalama:** göz aralığı (IOD) ölçülür; boyut, sağ-sol, yukarı-aşağı, öne-arkaya ince ayarı elle de yapılabilir.
- **Karma gerçeklik:** "Gerçek benlik" kaydırıcısı videonun yoğunluğunu ayarlar; anatomi onun üzerinde okunur.
- **Anatomi kütüphanesi:** aranabilir 34 yapı listesi (TR + Latince), katman filtresi, seçilen yapı 3B sahnede vurgulanır.
- **Etiketler:** 2D katman üzerinde lider çizgili, çakışmasız yerleşim.
- **Kare al:** video + WebGL + etiketler tek PNG'de birleştirilir (indirme).
- **Türkçe / İngilizce**, tercihler `localStorage`'da, klavye kısayolları, tam ekran, erişilebilirlik (skip link, ARIA, `prefers-reduced-motion`).
- **Bağımlılık yok, CDN yok:** three.js ve face-api.js depo içinde (`vendor/`), çevrimdışı da açılır.

## Kontroller

| Girdi | Etki |
| --- | --- |
| `1` … `5` | Kafatası / beyin / kaslar / gözler / boyun katmanını aç-kapat |
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
| Dosya | `models/anatomy.bin` (1,85 MB) + `models/anatomy.json` (16 KB, meta) |
| İçerik | 64 mesh, 88.130 köşe, 175.918 üçgen, 34 yapı |
| Konum | `int16`, parça başına min + ext ile çözülür (`min + (q + 32767) / 65534 × ext`) |
| Normal | `int8` (`n / 127`) |
| İndeks | parça başına `uint16` (65.535'ten az köşe) |
| Çerçeve | orijin = göz bebekleri ortası, 1 birim = göz bebekleri arası, +Y yukarı, +Z öne |

Katmanlar: **kafatası 25** (dişler dahil), **beyin 3** (cerebrum, cerebellum, beyin sapı), **yüz kasları 27**, **gözler 2**, **boyun 7** (atlas, axis + 5 servikal omur).

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
python tools/build_geometry.py models            # STL/GLB → anatomy.bin + anatomy.json
python tools/make_assets.py models assets        # og.png + uygulama ikonları
```

`tools/README.md` hattın adımlarını ve kaynak dosyaların nereden geldiğini anlatır. Derleme betiği, ürettiği sayıları (`counts`) ve yapı eşlemelerini doğrular; aynı girdilerle aynı çıktıyı verir.

## Yayınlama

GitHub Pages, `main` dalının kökünden yayınlanır (build adımı yok, `.nojekyll` var):

```bash
git push origin main
gh api -X POST repos/:owner/:repo/pages -f 'source[branch]=main' -f 'source[path]=/'
```

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

**X-Ray Mirror** is a browser-only "anatomy mirror": turn on your camera and a real 3D skull, brain, facial muscles, eyes and cervical spine are aligned to your face in real time.

**Live:** <https://keykavus324-svg.github.io/X-RAY-ANATOMY-TUGRUL/>

- Real scanned meshes — 34 named structures, 64 parts, **175,918 triangles / 88,130 vertices** — not a procedural head.
- Five layers (skull 25, brain 3, muscles 27, eyes 2, neck 7), three looks (X-ray / solid / wire), six reveal modes including a cursor-following **X-ray lens**.
- Face alignment from 68 in-browser landmarks (`face-api.js` + TensorFlow.js), low-pass filtered, with a slowly adapting neutral pose; model units are normalised so the inter-ocular distance is exactly 1.
- Everything runs on device: no server, no uploads, no analytics, no CDN. Preferences live in `localStorage`.
- Turkish and English UI, keyboard shortcuts, fullscreen, snapshot to PNG, reduced-motion support.

**Run locally:** `python3 -m http.server 8000` → <http://localhost:8000> (camera needs HTTPS or localhost).

**Rebuild the data:** `python tools/build_geometry.py models` (see `tools/README.md`).

**Licences:** code MIT; Z-Anatomy surfaces CC BY-SA 4.0; BodyParts3D-derived muscles/eyes/vertebrae CC BY-SA 2.1 Japan (attribution required, see above); three.js and face-api.js MIT. **Not a medical device.**
