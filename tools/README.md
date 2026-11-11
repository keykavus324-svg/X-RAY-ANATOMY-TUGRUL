# tools — veri hattı

Bu klasör, sitede duran `models/anatomy.bin` + `models/anatomy.json` dosyalarının nasıl üretildiğini gösterir. Kaynak ağlar (STL/GLB) lisans ve boyut nedeniyle depoya konmamıştır.

```
tools/
  build_geometry.py     1. aşama: STL + GLB(JSON) → models/anatomy.bin + anatomy.json (kafa)
  build_skeleton.py     2. aşama: tam iskeleti (gövde) aynı modele ekler
  check_site.mjs        tarayıcısız doğrulama (model + JS bağlantıları)
  make_assets.py        models/ → assets/og.png, icon-192.png, icon-512.png
  fit.py                BodyParts3D → Z-Anatomy benzerlik dönüşümünü hesaplar
  bpd_to_za.json        o dönüşümün katsayıları (s, R, t) — derlemede kullanılır
  decode_glb.mjs        .glb → düz JSON (parça adı, konum, indeks)
  preview.py            anatomi.bin'i yazılım rasterleyici ile PNG'ye çizer (tarayıcısız kontrol)
  requirements.txt      numpy, trimesh, fast-simplification, scipy, networkx, pillow
```

## 1. Kaynakları yerleştir

```
tools/sources/
  stl/FMA<id>.stl              BodyParts3D aynası (CC BY-SA 2.1 JP)
  zanatomy-skull.json          decode_glb.mjs çıktısı (parça listesi)
  zanatomy-cerebrum.json       (tek parça)
  zanatomy-cerebellum.json
  zanatomy-brainstem.json
  glb/zanatomy-*.glb           isteğe bağlı, ham dosyalar
```

Farklı bir klasör kullanmak için: `XRM_WORK=/yol/tools/sources`.

GLB'leri JSON'a çevirmek:

```bash
node tools/decode_glb.mjs tools/sources/glb/zanatomy-skull.glb tools/sources/zanatomy-skull.json
```

## 2. Derle

```bash
python tools/build_geometry.py models          # 1. aşama → kafa modeli
python tools/build_skeleton.py models          # 2. aşama → tam iskelet eklenir
python tools/make_assets.py models assets      # → assets/og.png, icon-192.png, icon-512.png
node tools/check_site.mjs                      # doğrulama
```

2. aşama, 1. aşamanın çıktısını yerinde günceller; yeniden üretmek için önce 1. aşamayı
çalıştırın (ya da `models/anatomy.{bin,json}` dosyalarının bir kopyasını saklayın).

Beklenen çıktı (doğrulama satırları):

```
parts 102  verts 126402  tris 251894
bin 2.65 MB  json 25.5 KB
bounds min [-5.83 -27.45 -3.06]  max [5.77 1.99 1.29]
layers skull, brain, muscles, eyes, neck, skeleton
all checks passed
```

Derleme betiği ayrıca şunları garanti eder: parça kimlikleri benzersiz (`assert`), sıfır alanlı üçgenler atılır, referanssız köşeler temizlenir, normaller birim uzunlukta (`int8` kuantizasyonu sonrası da), indeks türü köşe sayısına göre seçilir.

## 2b. Tam iskelet (`build_skeleton.py`)

Gövde kemikleri BodyParts3D aynasından gelir (`assets/BodyParts3D_data/stl/FMA<id>.stl`,
168 STL ≈ 77 MB). Betik bunları çiftlere ayırır (sol = +X), hedef üçgen sayısına indirger,
aynı kanonik çerçeveye oturtur ve mevcut modele **38 parça** olarak ekler:

| Grup | Parça | Not |
| --- | --- | --- |
| `thoracic`, `lumbar`, `sacrum` | 3 | omurga gövdesi (12 + 5 omur tek parça, sakrum) |
| `ribs_l` / `ribs_r` | 2 | 12 kaburga her yanda tek mesh |
| `sternum` | 1 | manubrium + gövde |
| `clavicle`, `scapula`, `humerus`, `radius`, `ulna` | 10 | omuz ve kol (çift) |
| `hip`, `femur`, `patella`, `tibia`, `fibula` | 10 | leğen ve bacak (çift) |
| `carpals`, `metacarpals`, `hand` | 6 | el iskeleti |
| `tarsals`, `metatarsals`, `foot` | 6 | ayak iskeleti |

Kare çerçeve referansı (göz küresi ortası, 1 birim = göz aralığı) her iki aşamada da
`FMA12513` (göz küresi) mesh'inden yeniden hesaplanır; bu yüzden gövde, 1. aşamada
üretilen boyun omurlarının tam altına oturur.

## 3. Doğrula (tarayıcısız)

```bash
python tools/preview.py models /tmp/preview.png   # anatomy.bin → PNG (kafa + tam gövde)
node tools/check_site.mjs                         # parça/katman/indeks/normal/i18n denetimi
```

Sitedeki kodun aynısını Node'da çalıştırmak için (`fetch` diskten okunur, `three` `vendor/`dan gelir) ayrı bir test koşumu kullanıldı; `src/gl/anatomy.js` ve `src/gl/materials.js` gerçek modüller olarak import edilip parça sayısı, sınırlar, indeks geçerliliği, katman/vurgu anahtarları denetlendi.

## Çerçeve sözleşmesi

| | |
| --- | --- |
| orijin | göz bebekleri orta noktası |
| 1 birim | göz bebekleri arası uzaklık (IOD) |
| eksenler | +Y yukarı, +Z öne (anterior), X aynalı (özçekim görünümü) |
| konum | `min + (q + 32767) / 65534 × ext`, `q` = int16 |
| normal | `n / 127`, `n` = int8 |
| indeks | `uint16` ya da `uint32` (parça başına `idxType`) |

Bu sözleşme sayesinde tarayıcıda ölçek tek bir çarpanla yapılır: `ölçek = göz aralığı(px) × kullanıcı ayarı`.
