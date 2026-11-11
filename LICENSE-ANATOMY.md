# 3B anatomi verisi — kaynak, lisans, türev

Bu depodaki `models/anatomy.bin` ve `models/anatomy.json` dosyaları **türev** çalışmalardır:

- **Kafatası (25 parça, dişler dahil) ve beyin (cerebrum, cerebellum, beyin sapı)**
  Z-Anatomy açık kaynak 3B anatomi atlasından türetilmiştir — **CC BY-SA 4.0**.
  Z-Anatomy, BodyParts3D veri kümesi üzerine kuruludur.
  Kaynak GLB dosyaları: `anatomyverse` deposundaki `models/zanatomy-*.glb`.

- **Yüz kasları, göz küreleri ve boyun omurları**
  BodyParts3D veri tabanından alınmıştır — **CC Attribution-Share Alike 2.1 Japan**.

Zorunlu atıf (olduğu gibi korunmalıdır):

> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan

## Türev çalışma neyi değiştirdi?

1. Parçalar ortak bir çerçeveye taşındı (orijin = göz bebekleri ortası, 1 birim = göz bebekleri arası, +Y yukarı, +Z öne, aynalı özçekim yönü).
2. BodyParts3D STL'leri, Z-Anatomy çerçevesine en küçük kareler benzerlik dönüşümüyle hizalandı (`tools/fit.py` → `tools/bpd_to_za.json`).
3. Yüzeyler, toplam ~176 bin üçgene inecek şekilde sadeleştirildi (fast-simplification), kullanılmayan köşeler atıldı, normaller birim vektör olarak yeniden hesaplandı.
4. Konumlar `int16`, normaller `int8` olarak kuantize edildi; indeksler `uint16`; tüm parçalar tek bir ikili dosyada birleştirildi.

Bu türev de **CC BY-SA** koşulları altındadır: yeniden yayınlarken yukarıdaki atfı, bu lisansı ve yaptığınız değişikliklerin belirtilmesini korumak zorundasınız. Uygulama kodu (`index.html`, `src/`, `assets/css`) ayrı olarak MIT lisanslıdır (bkz. `LICENSE`).

## Kaynakların yeniden indirilmesi

Kaynak ağlar depoya dahil edilmemiştir (boyut + lisans). Hattı yeniden çalıştırmak için:

```bash
# 1) BodyParts3D STL aynası (FMA id'leri tools/build_geometry.py içinde listelenmiştir)
#    ör. Kevin-Mattheus-Moerman/BodyParts3D → assets/BodyParts3D_data/stl/FMA<id>.stl
#    hedef: tools/sources/stl/

# 2) Z-Anatomy GLB'leri (officercon9-stack/anatomyverse → models/zanatomy-*.glb)
#    hedef: tools/sources/
#    json'a çevir:  node tools/decode_glb.mjs

# 3) derle
XRM_WORK=$PWD/tools/sources python tools/build_geometry.py models
python tools/make_assets.py models assets
```

`XRM_WORK` verilmezse `tools/sources/` kullanılır.
