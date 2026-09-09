# Kariyer Pusulam — program kataloğu güncelleme

`public/assets/kariyer-programlar.js` dosyası **elle düzenlenmez**; her yıl
ÖSYM/YÖK kılavuzları yenilendiğinde buradaki betikle yeniden üretilir.

## Çalıştırma

```sh
node ops/kariyer-veri/programlari-guncelle.js
```

Betik iki resmî kaynağı okur:

1. **YÖK Yükseköğretim Program Atlası** — tercih kılavuzu arama servisi
   (`https://yokatlas.yok.gov.tr/api/tercih-kilavuz/search`). Merkezî
   yerleştirmeyle öğrenci alan bütün ön lisans (Tablo 3) ve lisans (Tablo 4)
   programlarının adı, düzeyi ve puan türü buradan gelir.
2. **ÖSYM Yükseköğretim Programları ve Kontenjanları Kılavuzu (PDF), Tablo 5** —
   özel yetenek sınavıyla öğrenci alan programlar. YÖK Atlas bu tabloyu
   taşımadığı için PDF'ten okunur (`pdf-metin.js`).

Kayıtlar **program türü** düzeyindedir: aynı bölümün farklı üniversitelerdeki
programları tek satırda toplanır. Kontenjan, taban puan, üniversite ve şehir
bilgisi bu araca bilinçli olarak dâhil edilmez.

## Yıllık bakım

- `programlari-guncelle.js` içindeki `KILAVUZ_PDF` adresini o yılın kılavuzuyla
  değiştirin (ÖSYM her yıl yeni bir dosya adı yayımlar).
- Betiği çalıştırın. Sonunda **`UNMAPPED_PROGRAM_COUNT = 0`** yazmalıdır.
  Sıfır değilse yeni program adları için `aile-kurallari.js` içine kural
  eklenmeli; aksi hâlde betik dosyayı yazmadan durur.
- "Katalogda karşılığı olmayan kural girdileri" listesi bilgi amaçlıdır:
  o programlar kılavuzdan çıkmış olabilir, kural zararsızca kalabilir.

## Dosyalar

| Dosya | İş |
| --- | --- |
| `programlari-guncelle.js` | Hasat + birleştirme + aile ataması + dosya üretimi |
| `aile-kurallari.js` | Program adı → program ailesi eşleme kuralları (sıralı) |
| `pdf-metin.js` | ÖSYM kılavuz PDF'inden düz metin çıkarır |

Program ailelerinin kariyer profilleri ayrı dosyadadır ve elle yazılır:
`public/assets/kariyer-aileler.js`. Program listesi güncellendiğinde skor
motoruna dokunmak gerekmez.
