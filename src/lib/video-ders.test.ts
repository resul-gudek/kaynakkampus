import { describe, expect, it } from "vitest";
import { VideoDersSemasi } from "./dogrulama";
import {
  akisUrl,
  boyutMetni,
  ilerlemeIzlenebilir,
  izlemeDurumu,
  konumMetni,
  oynatilabilir,
  satirlar,
  sureMetni,
  videoKaynagi,
} from "./video-ders";

/* videoKaynagi, öğretmenin elle girdiği bağlantıyı oynatıcı adresine çevirir.
   Gömülemeyen adres "harici" döner (boş iframe yerine bağlantı gösterilir). */
describe("videoKaynagi", () => {
  it("YouTube izleme adresini nocookie gömme adresine çevirir", () => {
    expect(videoKaynagi({ id: "v1", kaynakTur: "baglanti", adres: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }))
      .toEqual({ tur: "youtube", adres: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" });
  });

  it("youtu.be kısa adresini ve başlangıç saniyesini tanır", () => {
    expect(videoKaynagi({ id: "v1", kaynakTur: "baglanti", adres: "https://youtu.be/dQw4w9WgXcQ?t=90" }))
      .toEqual({ tur: "youtube", adres: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=90" });
  });

  it("YouTube embed / shorts biçimlerini de çözer", () => {
    for (const adres of [
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=share",
    ]) {
      expect(videoKaynagi({ id: "v1", kaynakTur: "baglanti", adres }).tur).toBe("youtube");
    }
  });

  it("11 karakter olmayan YouTube kimliğini kabul etmez", () => {
    expect(videoKaynagi({ id: "v1", kaynakTur: "baglanti", adres: "https://www.youtube.com/watch?v=kisa" }).tur)
      .toBe("harici");
  });

  it("Vimeo adresini oynatıcı adresine çevirir", () => {
    expect(videoKaynagi({ id: "v1", kaynakTur: "baglanti", adres: "https://vimeo.com/76979871" }))
      .toEqual({ tur: "vimeo", adres: "https://player.vimeo.com/video/76979871" });
  });

  it("doğrudan medya bağlantısını dosya olarak oynatır", () => {
    expect(videoKaynagi({ id: "v1", kaynakTur: "baglanti", adres: "https://cdn.example.com/ders/kesirler.mp4" }))
      .toEqual({ tur: "dosya", adres: "https://cdn.example.com/ders/kesirler.mp4" });
  });

  it("tanınmayan adresi gömmez, harici sayar", () => {
    expect(videoKaynagi({ id: "v1", kaynakTur: "baglanti", adres: "https://drive.example.com/dosya/abc" }).tur)
      .toBe("harici");
  });

  it("http/https dışı ve bozuk adresleri reddeder", () => {
    for (const adres of ["javascript:alert(1)", "ftp://sunucu/video.mp4", "adres-degil", ""]) {
      expect(videoKaynagi({ id: "v1", kaynakTur: "baglanti", adres }).tur).toBe("yok");
    }
  });

  it("yüklenmiş dosyayı akış adresinden oynatır", () => {
    expect(videoKaynagi({ id: "v1", kaynakTur: "dosya", adres: "", dosyaYol: "video-ders/v1/video-a.mp4" }))
      .toEqual({ tur: "dosya", adres: akisUrl("v1") });
  });

  it("dosya kaynağı henüz yüklenmemişse oynatılamaz", () => {
    expect(videoKaynagi({ id: "v1", kaynakTur: "dosya", adres: "", dosyaYol: null }).tur).toBe("yok");
  });
});

describe("oynatilabilir / ilerlemeIzlenebilir", () => {
  it("dosya, youtube ve vimeo oynatılır; harici ve yok oynatılmaz", () => {
    expect(oynatilabilir({ tur: "dosya", adres: "/a" })).toBe(true);
    expect(oynatilabilir({ tur: "youtube", adres: "/a" })).toBe(true);
    expect(oynatilabilir({ tur: "vimeo", adres: "/a" })).toBe(true);
    expect(oynatilabilir({ tur: "harici", adres: "/a" })).toBe(false);
    expect(oynatilabilir({ tur: "yok", adres: "" })).toBe(false);
  });

  it("ilerleme yalnız <video> ile oynayan kaynakta izlenebilir", () => {
    expect(ilerlemeIzlenebilir({ tur: "dosya", adres: "/a" })).toBe(true);
    // iframe içine erişilemez → elle tamamlama gerekir
    expect(ilerlemeIzlenebilir({ tur: "youtube", adres: "/a" })).toBe(false);
  });
});

describe("izlemeDurumu", () => {
  it("izleme kaydı yoksa izlenmedi sayar", () => {
    expect(izlemeDurumu(null)).toBe("izlenmedi");
  });

  it("tamamlanan izleme tamamlandı kalır", () => {
    expect(izlemeDurumu({ durum: "tamamlandi", yuzde: 95 })).toBe("tamamlandi");
  });

  it("yüzdesi olan ama tamamlanmamış izleme izleniyor olur", () => {
    expect(izlemeDurumu({ durum: "izleniyor", yuzde: 20 })).toBe("izleniyor");
    // Not kaydı yüzünden oluşmuş sıfır ilerlemeli kayıt izlenmedi kalır
    expect(izlemeDurumu({ durum: "izlenmedi", yuzde: 0 })).toBe("izlenmedi");
  });
});

describe("biçimlendirme", () => {
  it("süreyi dakika/saat olarak yazar", () => {
    expect(sureMetni(0)).toBe("");
    expect(sureMetni(42)).toBe("42 dakika");
    expect(sureMetni(60)).toBe("1 saat");
    expect(sureMetni(95)).toBe("1 sa 35 dk");
  });

  it("oynatıcı konumunu saat:dakika:saniye yazar", () => {
    expect(konumMetni(0)).toBe("00:00");
    expect(konumMetni(452)).toBe("07:32");
    expect(konumMetni(4052)).toBe("1:07:32");
  });

  it("dosya boyutunu okunur biçime çevirir", () => {
    expect(boyutMetni(512)).toBe("512 B");
    expect(boyutMetni(2048)).toBe("2 KB");
    expect(boyutMetni(13_000_000)).toBe("12,4 MB");
  });

  it("çok satırlı metni temizleyip böler", () => {
    expect(satirlar(" Kesirler \n\n  Denk kesirler\n")).toEqual(["Kesirler", "Denk kesirler"]);
    expect(satirlar(null)).toEqual([]);
  });
});

/* Şema, kaynağı ve atamayı zorunlu tutar: kaynaksız video oynatılamaz,
   atanmamış video hiçbir öğrencinin listesine düşmez. */
describe("VideoDersSemasi", () => {
  const temel = {
    baslik: "Kesirlerde Toplama İşlemi",
    ders: "Matematik",
    tarih: "2026-09-15",
    ogrenciIdler: ["o1"],
  };

  it("geçerli bağlantılı videoyu kabul eder", () => {
    const v = VideoDersSemasi.parse({ ...temel, adres: "https://youtu.be/dQw4w9WgXcQ" });
    expect(v.kaynakTur).toBe("baglanti");
    expect(v.durum).toBe("taslak"); // varsayılan yayına almaz
  });

  it("bağlantı kaynağında adres zorunludur", () => {
    expect(VideoDersSemasi.safeParse({ ...temel, kaynakTur: "baglanti" }).success).toBe(false);
  });

  it("dosya kaynağında adres beklenmez", () => {
    expect(VideoDersSemasi.safeParse({ ...temel, kaynakTur: "dosya" }).success).toBe(true);
  });

  it("http(s) olmayan adresi reddeder", () => {
    expect(VideoDersSemasi.safeParse({ ...temel, adres: "javascript:alert(1)" }).success).toBe(false);
  });

  it("hedefsiz videoyu reddeder, sınıf ataması yeterlidir", () => {
    const adres = "https://youtu.be/dQw4w9WgXcQ";
    expect(VideoDersSemasi.safeParse({ ...temel, ogrenciIdler: [], adres }).success).toBe(false);
    expect(
      VideoDersSemasi.safeParse({ ...temel, ogrenciIdler: [], sinifIdler: ["s1"], adres }).success
    ).toBe(true);
  });

  it("geçersiz yayın durumunu ve aşırı süreyi reddeder", () => {
    const adres = "https://youtu.be/dQw4w9WgXcQ";
    expect(VideoDersSemasi.safeParse({ ...temel, adres, durum: "yayin" }).success).toBe(false);
    expect(VideoDersSemasi.safeParse({ ...temel, adres, sure: 9999 }).success).toBe(false);
  });
});
