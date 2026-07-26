import {
  GUNLER,
  OKUL_TURLERI,
  SINAV_GRUPLARI,
  SINIF_SEVIYELERI,
} from "@/lib/sabitler";
import type { FormTanimi } from "./tipler";

/* Üç ön mülakat formunun alan/aşama tanımları. Alan adları
   src/lib/dogrulama-basvuru.ts şemalarıyla birebir eşleşir. */

const KVKK_ADIMI = (turAdi: string) => ({
  baslik: "Onay ve gönderim",
  aciklama: "Bilgilerinizi kontrol edip onayları işaretledikten sonra başvurunuzu gönderin.",
  alanlar: [
    {
      ad: "kvkkOnay",
      etiket:
        `Kaynak Kampüs'ün, ${turAdi} ön başvurusu kapsamında paylaştığım kişisel verileri ` +
        "KVKK Aydınlatma Metni doğrultusunda işlemesini okudum ve anladım.",
      tip: "onay" as const,
      zorunlu: true,
      tamGenislik: true,
    },
    {
      ad: "acikRizaOnay",
      etiket:
        "Başvurumun değerlendirilmesi ve benimle iletişime geçilmesi amacıyla verilerimin " +
        "işlenmesine açık rıza veriyorum.",
      tip: "onay" as const,
      zorunlu: true,
      tamGenislik: true,
    },
  ],
});

// Sınıf seviyeleri + sınav grupları (öğretmen "ders verebileceği seviyeler")
const SEVIYE_GRUPLARI = [
  { baslik: "İlkokul", secenekler: SINIF_SEVIYELERI.ilkokul },
  { baslik: "Ortaokul", secenekler: SINIF_SEVIYELERI.ortaokul },
  { baslik: "Lise", secenekler: SINIF_SEVIYELERI.lise },
  { baslik: "Sınav grupları", secenekler: SINAV_GRUPLARI },
];

export const OGRETMEN_FORMU: FormTanimi = {
  tur: "ogretmen",
  baslik: "Öğretmen Ön Mülakat Başvurusu",
  adimlar: [
    {
      baslik: "Kişisel bilgiler",
      alanlar: [
        { ad: "ad", etiket: "Ad", tip: "metin", zorunlu: true },
        { ad: "soyad", etiket: "Soyad", tip: "metin", zorunlu: true },
        { ad: "telefon", etiket: "Telefon numarası", tip: "tel", zorunlu: true, placeholder: "05xx xxx xx xx" },
        { ad: "eposta", etiket: "E-posta adresi", tip: "eposta", placeholder: "ornek@eposta.com" },
        { ad: "sehir", etiket: "Yaşadığı şehir", tip: "metin" },
        { ad: "ilce", etiket: "Yaşadığı ilçe", tip: "metin" },
        { ad: "dogumYili", etiket: "Doğum yılı", tip: "yil", placeholder: "Örn. 1990" },
        { ad: "profil", etiket: "Profil fotoğrafı", tip: "dosya", dosyaAlani: "profil", tamGenislik: true },
      ],
    },
    {
      baslik: "Eğitim bilgileri",
      alanlar: [
        { ad: "universite", etiket: "Mezun olduğu üniversite", tip: "metin" },
        { ad: "fakulte", etiket: "Fakülte", tip: "metin" },
        { ad: "bolum", etiket: "Bölüm", tip: "metin" },
        { ad: "mezuniyetYili", etiket: "Mezuniyet yılı", tip: "metin", placeholder: "Örn. 2013" },
        { ad: "devamEgitim", etiket: "Devam eden eğitim", tip: "metin", placeholder: "Varsa" },
        { ad: "yuksekLisans", etiket: "Yüksek lisans bilgisi", tip: "metin" },
        {
          ad: "formasyon",
          etiket: "Pedagojik formasyon durumu",
          tip: "secim",
          secenekler: ["Var", "Yok", "Devam ediyor"],
        },
        { ad: "sertifikalar", etiket: "Sahip olduğu sertifikalar", tip: "cokMetin", tamGenislik: true },
      ],
    },
    {
      baslik: "Branş ve ders bilgileri",
      alanlar: [
        { ad: "brans", etiket: "Branşı", tip: "metin", zorunlu: true, placeholder: "Örn. Matematik" },
        {
          ad: "dersler",
          etiket: "Anlatabileceği dersler",
          tip: "cokMetin",
          tamGenislik: true,
          ipucu: "Virgülle ayırarak yazabilirsiniz.",
        },
        {
          ad: "seviyeler",
          etiket: "Ders verebileceği sınıf seviyeleri",
          tip: "cokSecim",
          gruplar: SEVIYE_GRUPLARI,
          tamGenislik: true,
        },
        { ad: "bireyselDers", etiket: "Bireysel (birebir) ders verebilirim", tip: "onay" },
        { ad: "grupDersi", etiket: "Grup dersi verebilirim", tip: "onay" },
      ],
    },
    {
      baslik: "Deneyim bilgileri",
      alanlar: [
        { ad: "deneyimYili", etiket: "Mesleki deneyim süresi", tip: "metin", placeholder: "Örn. 5 yıl" },
        { ad: "kurumlar", etiket: "Daha önce çalıştığı kurumlar", tip: "cokMetin", tamGenislik: true },
        { ad: "ozelDersDeneyimi", etiket: "Özel ders deneyimi", tip: "cokMetin", tamGenislik: true },
        { ad: "onlineDersDeneyimi", etiket: "Online ders deneyimi", tip: "cokMetin", tamGenislik: true },
        {
          ad: "egitimTeknolojisiDuzey",
          etiket: "Eğitim teknolojileri kullanma düzeyi",
          tip: "secim",
          secenekler: ["Başlangıç", "Orta", "İleri"],
        },
        { ad: "kullandigiAraclar", etiket: "Daha önce kullandığı online ders araçları", tip: "metin", placeholder: "Zoom, Meet, …" },
      ],
    },
    {
      baslik: "Uygunluk bilgileri",
      alanlar: [
        { ad: "gunler", etiket: "Ders verebileceği günler", tip: "cokSecim", secenekler: GUNLER, tamGenislik: true },
        { ad: "saatler", etiket: "Ders verebileceği saatler", tip: "metin", tamGenislik: true, placeholder: "Örn. Hafta içi 18:00–22:00" },
        { ad: "maxHaftalikDers", etiket: "Haftalık verebileceği maksimum ders sayısı", tip: "sayi" },
        { ad: "onlineUygun", etiket: "Online ders verebilirim", tip: "onay" },
        { ad: "yuzyuzeUygun", etiket: "Yüz yüze ders verebilirim", tip: "onay" },
      ],
    },
    {
      baslik: "Açık uçlu sorular",
      alanlar: [
        { ad: "nedenKatilmak", etiket: "Kaynak Kampüs'e neden katılmak istiyorsunuz?", tip: "cokMetin", tamGenislik: true },
        { ad: "anlatimYontemi", etiket: "Ders anlatım yönteminizi nasıl tanımlarsınız?", tip: "cokMetin", tamGenislik: true },
        { ad: "anlamadigindaYontem", etiket: "Bir öğrenci konuyu anlamadığında nasıl bir yöntem izlersiniz?", tip: "cokMetin", tamGenislik: true },
        { ad: "motivasyonDusuk", etiket: "Motivasyonu düşük bir öğrenciye nasıl yaklaşırsınız?", tip: "cokMetin", tamGenislik: true },
        { ad: "dikkatCanli", etiket: "Online derslerde öğrencinin dikkatini nasıl canlı tutarsınız?", tip: "cokMetin", tamGenislik: true },
        { ad: "veliIletisim", etiket: "Öğrenci ve veli iletişiminde nelere dikkat edersiniz?", tip: "cokMetin", tamGenislik: true },
      ],
    },
    {
      baslik: "Dosya yükleme",
      aciklama: "Belgeleri yükleyebilir, videoları bağlantı olarak paylaşabilirsiniz.",
      alanlar: [
        { ad: "ozgecmis", etiket: "Özgeçmiş", tip: "dosya", dosyaAlani: "ozgecmis" },
        { ad: "diploma", etiket: "Diploma", tip: "dosya", dosyaAlani: "diploma" },
        { ad: "sertifika", etiket: "Sertifika(lar)", tip: "dosya", dosyaAlani: "sertifika", coklu: true },
        { ad: "ek", etiket: "Ek belge(ler)", tip: "dosya", dosyaAlani: "ek", coklu: true },
        { ad: "ornekDersVideo", etiket: "Örnek ders videosu (bağlantı)", tip: "url", tamGenislik: true, placeholder: "https://youtube.com/…" },
        { ad: "tanitimVideo", etiket: "Tanıtım videosu (bağlantı)", tip: "url", tamGenislik: true, placeholder: "https://…" },
      ],
    },
    KVKK_ADIMI("öğretmen"),
  ],
};

export const OGRENCI_FORMU: FormTanimi = {
  tur: "ogrenci",
  baslik: "Öğrenci Ön Mülakat Başvurusu",
  adimlar: [
    {
      baslik: "Kimlik ve iletişim",
      alanlar: [
        {
          ad: "formuDolduran",
          etiket: "Formu dolduran kişi",
          tip: "secim",
          secenekler: ["ogrenci", "veli"],
          tamGenislik: true,
          ipucu: "İlkokul ve ortaokul düzeyi için form veli tarafından da doldurulabilir.",
        },
        { ad: "ad", etiket: "Öğrencinin adı", tip: "metin", zorunlu: true },
        { ad: "soyad", etiket: "Öğrencinin soyadı", tip: "metin", zorunlu: true },
        { ad: "sinif", etiket: "Sınıfı", tip: "metin", placeholder: "Örn. 8. Sınıf" },
        { ad: "okulTuru", etiket: "Okul türü", tip: "secim", secenekler: OKUL_TURLERI },
        { ad: "sehir", etiket: "Yaşadığı şehir", tip: "metin" },
        { ad: "telefon", etiket: "İletişim telefonu", tip: "tel", zorunlu: true, placeholder: "05xx xxx xx xx" },
        { ad: "eposta", etiket: "E-posta adresi", tip: "eposta" },
        {
          ad: "yas18Alti",
          etiket: "Öğrenci 18 yaşından küçük",
          tip: "onay",
          tamGenislik: true,
          ipucu: "İşaretlenirse veli bilgileri zorunludur.",
        },
      ],
    },
    {
      baslik: "Veli bilgileri",
      aciklama: "18 yaşından küçük öğrenciler veya formu velinin doldurduğu durumlar için zorunludur.",
      alanlar: [
        {
          ad: "veliAd",
          etiket: "Veli adı soyadı",
          tip: "metin",
          gorunur: (d) => veliZorunlu(d),
          zorunlu: true,
        },
        {
          ad: "veliTelefon",
          etiket: "Veli telefonu",
          tip: "tel",
          gorunur: (d) => veliZorunlu(d),
          zorunlu: true,
          placeholder: "05xx xxx xx xx",
        },
        { ad: "veliEposta", etiket: "Veli e-postası", tip: "eposta", gorunur: (d) => veliZorunlu(d) },
        {
          ad: "veliOnay",
          etiket: "Veli olarak başvuruyu ve verilerin işlenmesini onaylıyorum.",
          tip: "onay",
          tamGenislik: true,
          gorunur: (d) => veliZorunlu(d),
          zorunlu: true,
        },
      ],
    },
    {
      baslik: "Eğitim ihtiyacı",
      alanlar: [
        { ad: "ders", etiket: "Eğitim almak istediği ders", tip: "metin", tamGenislik: true },
        { ad: "konular", etiket: "Destek almak istediği konular", tip: "cokMetin", tamGenislik: true },
        { ad: "sonNot", etiket: "Son aldığı ders notu", tip: "metin" },
        { ad: "ortalama", etiket: "Genel ders ortalaması", tip: "metin" },
        { ad: "sorunlar", etiket: "Dersle ilgili yaşadığı sorunlar", tip: "cokMetin", tamGenislik: true },
        { ad: "hedefNot", etiket: "Hedeflediği not", tip: "metin" },
        { ad: "hedefGelisim", etiket: "Hedeflediği gelişim", tip: "cokMetin", tamGenislik: true },
        { ad: "beklenti", etiket: "Özel dersten beklentisi", tip: "cokMetin", tamGenislik: true },
      ],
    },
    {
      baslik: "Uygunluk ve tercihler",
      alanlar: [
        { ad: "gunler", etiket: "Haftalık uygun olduğu günler", tip: "cokSecim", secenekler: GUNLER, tamGenislik: true },
        { ad: "saatler", etiket: "Uygun olduğu saatler", tip: "metin", tamGenislik: true, placeholder: "Örn. Akşam 19:00 sonrası" },
        { ad: "oncedenOzelDers", etiket: "Daha önce özel ders aldım", tip: "onay" },
        { ad: "koclukIster", etiket: "Eğitim koçluğu almak istiyorum", tip: "onay" },
        { ad: "ekBilgi", etiket: "Eklemek istediği bilgiler", tip: "cokMetin", tamGenislik: true },
      ],
    },
    KVKK_ADIMI("öğrenci"),
  ],
};

export const KOC_FORMU: FormTanimi = {
  tur: "koc",
  baslik: "Eğitim Koçu Ön Mülakat Başvurusu",
  adimlar: [
    {
      baslik: "Kişisel bilgiler",
      alanlar: [
        { ad: "ad", etiket: "Ad", tip: "metin", zorunlu: true },
        { ad: "soyad", etiket: "Soyad", tip: "metin", zorunlu: true },
        { ad: "telefon", etiket: "Telefon", tip: "tel", zorunlu: true, placeholder: "05xx xxx xx xx" },
        { ad: "eposta", etiket: "E-posta", tip: "eposta" },
        { ad: "sehir", etiket: "Yaşadığı şehir", tip: "metin" },
        { ad: "mezunOkul", etiket: "Mezun olduğu okul", tip: "metin" },
        { ad: "mezunBolum", etiket: "Mezun olduğu bölüm", tip: "metin" },
      ],
    },
    {
      baslik: "Eğitim ve deneyim",
      alanlar: [
        { ad: "koclukEgitimi", etiket: "Eğitim koçluğu eğitimi", tip: "cokMetin", tamGenislik: true },
        { ad: "sertifikalar", etiket: "Sertifikalar", tip: "cokMetin", tamGenislik: true },
        { ad: "koclukDeneyimi", etiket: "Koçluk deneyimi", tip: "cokMetin", tamGenislik: true },
        {
          ad: "yasGruplari",
          etiket: "Çalıştığı yaş grupları",
          tip: "cokSecim",
          secenekler: ["İlkokul", "Ortaokul", "Lise", "Sınav (LGS/YKS)", "Üniversite", "Yetişkin"],
          tamGenislik: true,
        },
        { ad: "ilkokulDeneyim", etiket: "İlkokul öğrencileriyle çalışma deneyimim var", tip: "onay" },
        { ad: "ortaokulDeneyim", etiket: "Ortaokul öğrencileriyle çalışma deneyimim var", tip: "onay" },
        { ad: "liseDeneyim", etiket: "Lise öğrencileriyle çalışma deneyimim var", tip: "onay" },
        { ad: "sinavDeneyim", etiket: "Sınav öğrencileriyle çalışma deneyimim var", tip: "onay" },
      ],
    },
    {
      baslik: "Uygunluk ve özgeçmiş",
      alanlar: [
        { ad: "haftalikUygunluk", etiket: "Haftalık uygunluk", tip: "metin", tamGenislik: true, placeholder: "Örn. Hafta içi akşamları" },
        { ad: "onlineGorusmeUygun", etiket: "Online görüşme yapabilirim", tip: "onay" },
        { ad: "kisaOzgecmis", etiket: "Kısa özgeçmiş", tip: "cokMetin", tamGenislik: true },
        { ad: "ozgecmis", etiket: "Özgeçmiş dosyası (opsiyonel)", tip: "dosya", dosyaAlani: "ozgecmis" },
        { ad: "sertifika", etiket: "Sertifika(lar) (opsiyonel)", tip: "dosya", dosyaAlani: "sertifika", coklu: true },
      ],
    },
    {
      baslik: "Açık uçlu sorular",
      alanlar: [
        { ad: "koclukTanimi", etiket: "Eğitim koçluğunu nasıl tanımlarsınız?", tip: "cokMetin", tamGenislik: true },
        { ad: "calismaAliskanligiYok", etiket: "Ders çalışma alışkanlığı olmayan bir öğrenciye nasıl yaklaşılır?", tip: "cokMetin", tamGenislik: true },
        { ad: "surekliErteleyen", etiket: "Sürekli görevlerini erteleyen bir öğrenci için nasıl bir yol izlersiniz?", tip: "cokMetin", tamGenislik: true },
        { ad: "hedefBelirleme", etiket: "Öğrenci hedefleri nasıl belirlenmelidir?", tip: "cokMetin", tamGenislik: true },
        { ad: "gelisimTakip", etiket: "Öğrencinin gelişimini nasıl takip edersiniz?", tip: "cokMetin", tamGenislik: true },
        { ad: "veliIletisim", etiket: "Veliyle iletişim kurarken nelere dikkat edersiniz?", tip: "cokMetin", tamGenislik: true },
      ],
    },
    KVKK_ADIMI("eğitim koçu"),
  ],
};

/** Öğrenci formunda veli alanlarının zorunlu olduğu durum */
export function veliZorunlu(d: Record<string, unknown>): boolean {
  return (
    d.formuDolduran === "veli" ||
    d.yas18Alti === true ||
    d.okulTuru === "İlkokul" ||
    d.okulTuru === "Ortaokul"
  );
}

export const FORMLAR: Record<FormTanimi["tur"], FormTanimi> = {
  ogretmen: OGRETMEN_FORMU,
  ogrenci: OGRENCI_FORMU,
  koc: KOC_FORMU,
};
