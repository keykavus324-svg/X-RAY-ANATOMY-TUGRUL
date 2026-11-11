# tools — veri hattı

Bu klasör, sitede duran `models/anatomy.bin` + `models/anatomy.json` dosyalarının nasıl üretildiğini gösterir. Kaynak ağlar (STL/GLB) lisans ve boyut nedeniyle depoya konmamıştır.

```
tools/
  build_geometry.py     STL + GLB(JSON) → models/anatomy.bin + anatomy.json   (asıl derleme)
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
python tools/build_geometry.py models          # → models/anatomy.{bin,json}
python tools/make_assets.py models assets      # → assets/og.png, icon-192.png, icon-512.png
```

Beklenen çıktı (doğrulama satırları):

```
parts 64  verts 88130  tris 175918
bin MB 1.85 json KB 16.3
parts with >65535 verts: []
structures 34
```

Derleme betiği ayrıca şunları garanti eder: parça kimlikleri benzersiz (`assert`), sıfır alanlı üçgenler atılır, referanssız köşeler temizlenir, normaller birim uzunlukta (`int8` kuantizasyonu sonrası da), indeks türü köşe sayısına göre seçilir.

## 3. Doğrula (tarayıcısız)

```bash
python tools/preview.py     # models/anatomy.bin → PNG
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
