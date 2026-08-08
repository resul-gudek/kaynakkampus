
/* ═════════════ SABİTLER ═════════════ */
const $ = id => document.getElementById(id);

const ALAN_SIRA = ["sozel","mantik","gorsel","beden","muzik","sosyal","icsel","doga"];

const ALANLAR = {
  sozel: {
    ad: "Sözel-Dilsel", kisaAd: "Sözel-Dilsel", renk: "#3E6FB0",
    kisa: "Kelimeleri anlama, kullanma ve düşünceleri etkili biçimde ifade etme eğilimidir.",
    nasil: "Konuyu kendi cümlelerinle anlatarak, özet çıkararak ve sesli okuyarak daha kalıcı öğrenebilirsin.",
    yontemler: ["Konuyu kendi cümlelerinle anlatma", "Sesli okuma", "Kısa özet çıkarma", "Kelime kartlarıyla çalışma", "Bir konuyu arkadaşına anlatma"],
    ders: ["Konuyu kendi cümleleriyle anlatma", "Hikâyeleştirme", "Sesli okuma", "Özet yazma", "Kelime kartları", "Soru-cevap", "Arkadaşına ders anlatma", "Günlük veya kısa not tutma"],
    ogretmen: "Konuyu öğrencinin kendi cümleleriyle anlatmasını isteyin; tartışma, sunum, hikâyeleştirme ve yazma etkinliklerinden yararlanın.",
    gunluk: "Okuduğun bir hikâyeyi kendi cümlelerinle anlat; yeni öğrendiğin kelimelerle kısa cümleler kur."
  },
  mantik: {
    ad: "Mantıksal-Matematiksel", kisaAd: "Mantıksal-Mat.", renk: "#6E5AA6",
    kisa: "Neden-sonuç ilişkileri kurma, örüntüleri fark etme ve problemleri sistemli biçimde çözme eğilimidir.",
    nasil: "Konuyu adımlara ayırarak, karşılaştırarak ve örüntü bularak daha kolay kavrayabilirsin.",
    yontemler: ["Konuyu adımlara ayırma", "Neden-sonuç ilişkisi kurma", "Sınıflandırma ve karşılaştırma", "Problem çözme", "Örüntü bulma"],
    ders: ["Konuyu adımlara ayırma", "Neden-sonuç tablosu hazırlama", "Sınıflandırma", "Problem çözme", "Örüntü bulma", "Deney yapma", "Bilgileri karşılaştırma", "Kural ve sistem oluşturma"],
    ogretmen: "Sınıflandırma, sıralama ve problem çözme çalışmaları sunun; kuralları öğrencinin kendisinin keşfetmesine olanak verin.",
    gunluk: "Bir bilmece ya da bulmaca çöz; günlük olayları neden-sonuç ilişkisiyle açıklamaya çalış."
  },
  gorsel: {
    ad: "Görsel-Uzamsal", kisaAd: "Görsel-Uzamsal", renk: "#C0637E",
    kisa: "Bilgiyi görüntüler, şekiller, renkler, haritalar ve zihinsel canlandırmalar yoluyla algılama eğilimidir.",
    nasil: "Renkli notlar, şemalar, zihin haritaları ve videolarla daha rahat öğrenebilirsin.",
    yontemler: ["Renkli notlar alma", "Şema ve zihin haritası çizme", "Grafik ve tablo kullanma", "Video içeriklerden yararlanma", "Konuyu zihinde canlandırma"],
    ders: ["Renkli notlar", "Şemalar", "Zihin haritaları", "Grafikler", "Tablolar", "Video içerikleri", "Resim ve semboller", "Konuyu zihinde canlandırma"],
    ogretmen: "Renkli şema, resim ve kartlar kullanın; bilgiyi görsellerle destekleyin ve öğrencinin çizerek anlatmasına olanak verin.",
    gunluk: "Öğrendiğin bir konuyu renkli bir şema ya da küçük bir çizimle anlat."
  },
  beden: {
    ad: "Bedensel-Kinestetik", kisaAd: "Bedensel-Kin.", renk: "#D98A3A",
    kisa: "Hareket ederek, deneyerek, dokunarak ve uygulama yaparak öğrenme eğilimidir.",
    nasil: "Yaparak, deneyerek ve somut materyallerle çalıştığında daha rahat öğrenebilirsin.",
    yontemler: ["Yaparak-yaşayarak öğrenme", "Somut materyallerle çalışma", "Drama ve canlandırma", "Deney yapma", "Hareketli tekrar"],
    ders: ["Yaparak öğrenme", "Drama", "Rol oynama", "Deney", "Maket hazırlama", "Hareketli tekrar", "Kartlarla çalışma", "Somut materyaller kullanma"],
    ogretmen: "Hareketli etkinlikler ve somut materyaller kullanın; öğrenciye deneyerek ve uygulayarak öğrenme fırsatı verin.",
    gunluk: "Bir konuyu maket, deney ya da küçük bir uygulama yaparak öğrenmeyi dene."
  },
  muzik: {
    ad: "Müziksel-Ritmik", kisaAd: "Müziksel-Ritmik", renk: "#2E9E9E",
    kisa: "Sesleri, ritimleri, melodileri ve tonlamaları fark etme ve bunlardan yararlanma eğilimidir.",
    nasil: "Bilgileri şarkı, ritim ve tekerlemelere dönüştürdüğünde daha kolay hatırlayabilirsin.",
    yontemler: ["Şarkı ve melodiyle tekrar", "Ritim tutarak çalışma", "Tekerleme oluşturma", "Sesli kayıt dinleme", "Vurgulu okuma"],
    ders: ["Şarkıyla tekrar", "Ritim oluşturma", "Tekerleme", "Sesli kayıt", "Vurgulu okuma", "Bilgileri melodiye uyarlama", "Alkış veya tempo eşliğinde tekrar"],
    ogretmen: "Ritim, tekerleme ve şarkılardan yararlanın; bilgileri melodi ve vurguyla ilişkilendirin.",
    gunluk: "Ezberlemen gereken bir bilgiyi kısa bir tekerlemeye ya da ritme dönüştür."
  },
  sosyal: {
    ad: "Sosyal", kisaAd: "Sosyal", renk: "#B24C86",
    kisa: "Başkalarının duygu, düşünce ve ihtiyaçlarını anlama; iletişim ve iş birliği kurma eğilimidir.",
    nasil: "Grup çalışması, akran öğretimi ve tartışma ile daha rahat öğrenebilirsin.",
    yontemler: ["Grup çalışması", "Akran öğretimi (arkadaşına anlatma)", "Tartışma ve soru-cevap", "Grup projesi", "İş birliğine dayalı oyunlar"],
    ders: ["Grup çalışması", "Akran öğretimi", "Tartışma", "Soru-cevap", "Grup projesi", "Sunum", "Arkadaşla tekrar", "İş birliğine dayalı oyunlar"],
    ogretmen: "Akran çalışmaları ve grup görevleri verin; iş birliğine dayalı etkinliklerden ve tartışmalardan yararlanın.",
    gunluk: "Öğrendiğin bir konuyu bir arkadaşınla birlikte tekrar et ya da ona anlat."
  },
  icsel: {
    ad: "İçsel", kisaAd: "İçsel", renk: "#4F7BA6",
    kisa: "Kişinin kendi duygu, düşünce, ihtiyaç, hedef ve özelliklerini fark etme eğilimidir.",
    nasil: "Kendi çalışma planını yaparak, hedef belirleyerek ve sessiz ortamda çalışarak daha verimli olabilirsin.",
    yontemler: ["Kişisel çalışma planı yapma", "Küçük hedefler belirleme", "Çalışma günlüğü tutma", "Öz değerlendirme", "Sessiz ve bireysel çalışma"],
    ders: ["Bireysel çalışma planı", "Kişisel hedef belirleme", "Çalışma günlüğü", "Öz değerlendirme", "Sessiz çalışma", "Kendi hızında ilerleme", "Öğrendiklerini düşünerek değerlendirme"],
    ogretmen: "Bireysel düşünme ve hedef belirleme zamanı tanıyın; öz değerlendirmeyi ve kendi hızında ilerlemeyi destekleyin.",
    gunluk: "Bugün ne öğrendiğini kısa bir cümleyle kendine not et ve küçük bir hedef koy."
  },
  doga: {
    ad: "Doğacı", kisaAd: "Doğacı", renk: "#5B9E5B",
    kisa: "Canlıları, doğayı ve çevredeki değişimleri gözlemleme, sınıflandırma ve bunlarla ilgilenme eğilimidir.",
    nasil: "Doğadan örnekler, gözlem ve açık hava etkinlikleriyle daha rahat öğrenebilirsin.",
    yontemler: ["Doğadan örneklerle çalışma", "Gözlem yapma", "Canlıları sınıflandırma", "Açık hava etkinlikleri", "Koleksiyon ve inceleme"],
    ders: ["Açık hava etkinlikleri", "Doğadan örnekler", "Gözlem çalışmaları", "Canlıları sınıflandırma", "Bitki ve hayvan temalı etkinlikler", "Çevre projeleri", "Gerçek yaşam örnekleri", "Koleksiyon ve inceleme çalışmaları"],
    ogretmen: "Doğa, hayvan ve çevre örneklerinden yararlanın; gözlem ve sınıflandırma etkinlikleri sunun.",
    gunluk: "Çevrende gözlemlediğin bir doğa olayını ya da canlıyı incele ve özelliklerine göre grupla."
  }
};

/* Yaş grubuna göre veli önerileri (ilkokul/ortaokul) */
const VELI_ONERI = [
  "Çocuğunuzun farklı öğrenme yollarını denemesine fırsat verin.",
  "Sonucu kesin bir yetenek veya zekâ etiketi olarak kullanmayın.",
  "Güçlü görünen alanları desteklerken diğer alanları ihmal etmeyin.",
  "Çocuğunuzu başka çocuklarla karşılaştırmayın.",
  "Evde kısa, eğlenceli ve yaşına uygun etkinlikler uygulayın.",
  "Çocuğun hangi yöntemle daha rahat öğrendiğini birlikte gözlemleyin.",
  "Test sonucunu not verme veya başarı tahmini amacıyla kullanmayın."
];

/* Cevap seçenekleri (5'li derecelendirme) — puan = index+1 */
const SECENEKLER = [
  { metin: "Bana hiç uygun değil", emoji: "😟" },
  { metin: "Bana biraz uygun",     emoji: "🙁" },
  { metin: "Kararsızım",           emoji: "😐" },
  { metin: "Bana uygun",           emoji: "🙂" },
  { metin: "Bana tamamen uygun",   emoji: "😄" }
];

/* Zorunlu bilgilendirme metni */
const UYARI_UZUN = "Bu çalışma, Howard Gardner’ın Çoklu Zekâ Kuramı temel alınarak hazırlanmış bir öğrenme eğilimleri ve güçlü yönler envanteridir. Bir zekâ testi, psikolojik test, tanı veya bilimsel ölçüm aracı değildir. Sonuçlar, kişinin farklı öğrenme yöntemlerine yönelik eğilimlerini fark etmesine yardımcı olmak amacıyla sunulur. Sonuçlar yaşa, deneyimlere, ilgi alanlarına ve içinde bulunulan koşullara göre değişebilir.";
const UYARI_COCUK = "Bu test sana hangi yollarla öğrenmeyi daha çok sevdiğini göstermeye yardımcı olur. Doğru veya yanlış cevap yoktur. Sana en uygun cevabı seçmelisin.";

/* Seviyeler — yalnızca ilkokul aktif. Diğerleri ikinci bölümde eklenecek. */
const SEVIYELER = {
  ilkokul:  { ad: "İlkokul",  emoji: "🎈", yas: "7–10 yaş", aciklama: "Kısa ve sade sorularla hangi yollarla öğrenmeyi sevdiğini keşfet.", cocuk: true, veli: true, aktif: true },
  ortaokul: { ad: "Ortaokul", emoji: "🧩", yas: "11–13 yaş", aciklama: "Yaş grubuna uygun sorularla öğrenme eğilimlerini keşfet.", cocuk: false, veli: true, aktif: false },
  lise:     { ad: "Lise",     emoji: "🎓", yas: "14–17 yaş", aciklama: "Çalışma ve öğrenme alışkanlıklarına yönelik sorular.", cocuk: false, veli: false, aktif: false },
  yetiskin: { ad: "Yetişkin", emoji: "💼", yas: "18 yaş ve üzeri", aciklama: "Günlük yaşam, çalışma biçimi, iletişim ve problem çözme alışkanlıkları.", cocuk: false, veli: false, aktif: false }
};

/* İlkokul soruları — kullanıcıya sunulan karışık sırada (alan gruplaması gizli). */
const SORULAR = {
  ilkokul: [
    { t: "Hikâye dinlemeyi severim.", a: "sozel" },
    { t: "Bulmaca çözmeyi severim.", a: "mantik" },
    { t: "Resim çizmeyi severim.", a: "gorsel" },
    { t: "Bir şeyi yaparak öğrenmek bana kolay gelir.", a: "beden" },
    { t: "Şarkı söylemeyi severim.", a: "muzik" },
    { t: "Arkadaşlarımla birlikte çalışmayı severim.", a: "sosyal" },
    { t: "Tek başıma düşünüp karar vermeyi severim.", a: "icsel" },
    { t: "Hayvanlarla ilgilenmeyi severim.", a: "doga" },
    { t: "Yeni kelimeler öğrenmek hoşuma gider.", a: "sozel" },
    { t: "Sayılarla işlem yapmak hoşuma gider.", a: "mantik" },
    { t: "Renkli anlatımlarla daha kolay öğrenirim.", a: "gorsel" },
    { t: "Öğrenirken hareket etmeyi severim.", a: "beden" },
    { t: "Ritim tutmaktan hoşlanırım.", a: "muzik" },
    { t: "Arkadaşlarımın duygularını anlamaya çalışırım.", a: "sosyal" },
    { t: "Neleri iyi yaptığımı bilirim.", a: "icsel" },
    { t: "Doğada zaman geçirmek hoşuma gider.", a: "doga" },
    { t: "Bir şeyi başkasına anlatmayı severim.", a: "sozel" },
    { t: "Bir sorunun cevabını adım adım bulmayı severim.", a: "mantik" },
    { t: "Şekillere, haritalara ve resimlere bakmayı severim.", a: "gorsel" },
    { t: "Elimle bir şeyler hazırlamaktan hoşlanırım.", a: "beden" },
    { t: "Şarkı hâline getirilen bilgileri kolay hatırlarım.", a: "muzik" },
    { t: "Bir arkadaşım zorlandığında ona yardım etmek isterim.", a: "sosyal" },
    { t: "Kendime küçük hedefler koymaktan hoşlanırım.", a: "icsel" },
    { t: "Bitkileri ve doğadaki değişiklikleri incelemeyi severim.", a: "doga" }
  ]
};

/* ═════════════ DURUM ═════════════ */
const durum = { ekran: "secim", seviye: null, cevaplar: [], indeks: 0 };

/* ═════════════ YARDIMCILAR ═════════════ */
function yuzdeHesapla(cevaplar, seviye) {
  const sorular = SORULAR[seviye];
  const toplam = {}; ALAN_SIRA.forEach(k => toplam[k] = 0);
  sorular.forEach((s, i) => { toplam[s.a] += (cevaplar[i] || 0); });
  // Her alan 3 soru → 3..15 puan. Yüzde = ((puan-3)/12)*100
  return ALAN_SIRA.map(k => ({
    key: k, ad: ALANLAR[k].ad, renk: ALANLAR[k].renk,
    puan: toplam[k], yuzde: Math.round(((toplam[k] - 3) / 12) * 100)
  }));
}
function yorumAralik(y) {
  if (y <= 24) return "Bu eğilim şu anda diğer eğilimlerine göre daha az belirgin görünüyor.";
  if (y <= 49) return "Bu eğilim bazı durumlarda sana yardımcı olabilir.";
  if (y <= 69) return "Bu alanda belirgin bir öğrenme eğilimin bulunuyor.";
  if (y <= 84) return "Bu alan güçlü öğrenme eğilimlerinden biri.";
  return "Bu alan en belirgin güçlü yönlerinden biri olabilir.";
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function benzersiz(arr) { return [...new Set(arr)]; }

/* ═════════════ RADAR GRAFİK (SVG) ═════════════ */
function radarSVG(sonuclarSirali) {
  // Alan sırasına göre yeniden düzenle (grafik sabit eksen sırası kullanır)
  const map = {}; sonuclarSirali.forEach(s => map[s.key] = s.yuzde);
  const veri = ALAN_SIRA.map(k => ({ key: k, ad: ALANLAR[k].kisaAd, y: map[k] }));
  const n = veri.length, cx = 210, cy = 210, R = 145;
  const aci = i => (-Math.PI / 2) + i * 2 * Math.PI / n;
  const nokta = (i, r) => [cx + r * Math.cos(aci(i)), cy + r * Math.sin(aci(i))];

  let grid = "";
  [25, 50, 75, 100].forEach(seviye => {
    const pts = veri.map((_, i) => nokta(i, R * seviye / 100).map(v => v.toFixed(1)).join(",")).join(" ");
    grid += `<polygon points="${pts}" fill="none" stroke="#E2D6DA" stroke-width="1"/>`;
  });
  let eksen = "", etiket = "";
  veri.forEach((d, i) => {
    const [x, y] = nokta(i, R);
    eksen += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#E2D6DA" stroke-width="1"/>`;
    const [lx, ly] = nokta(i, R + 26);
    const cos = Math.cos(aci(i));
    const anchor = cos < -0.3 ? "end" : cos > 0.3 ? "start" : "middle";
    etiket += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" font-size="11" font-weight="600" fill="#55505A" dominant-baseline="middle">${esc(d.ad)}</text>`;
    etiket += `<text x="${lx.toFixed(1)}" y="${(ly + 13).toFixed(1)}" text-anchor="${anchor}" font-size="10" font-weight="700" fill="#7A2035" dominant-baseline="middle">%${d.y}</text>`;
  });
  const dataPts = veri.map((d, i) => nokta(i, R * Math.max(d.y, 0) / 100).map(v => v.toFixed(1)).join(",")).join(" ");
  let dots = "";
  veri.forEach((d, i) => { const [x, y] = nokta(i, R * Math.max(d.y, 0) / 100); dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#7A2035"/>`; });

  return `<svg viewBox="0 0 420 420" role="img" aria-label="Sekiz öğrenme alanının yüzde radarı">
    ${grid}${eksen}
    <polygon points="${dataPts}" fill="rgba(122,32,53,.20)" stroke="#7A2035" stroke-width="2"/>
    ${dots}${etiket}
  </svg>`;
}

/* ═════════════ EKRANLAR ═════════════ */
function render() {
  if (durum.ekran === "secim") return ekranSecim();
  if (durum.ekran === "intro") return ekranIntro();
  if (durum.ekran === "test") return ekranTest();
  if (durum.ekran === "kontrol") return ekranKontrol();
  if (durum.ekran === "sonuc") return ekranSonuc();
}

function ekranSecim() {
  const kartlar = Object.entries(SEVIYELER).map(([k, s]) => {
    if (s.aktif) {
      return `<div class="lvl-card aktif" data-sev="${k}">
        <span class="lvl-emoji">${s.emoji}</span>
        <span class="lvl-yas">${s.yas}</span>
        <h3>${s.ad}</h3>
        <p>${s.aciklama}</p>
        <span class="lvl-cta">Seviyeyi seç →</span>
      </div>`;
    }
    return `<div class="lvl-card pasif">
      <span class="yakinda">Yakında</span>
      <span class="lvl-emoji">${s.emoji}</span>
      <span class="lvl-yas">${s.yas}</span>
      <h3>${s.ad}</h3>
      <p>${s.aciklama}</p>
      <span class="lvl-cta" style="color:#A99CA0;">Sorular yakında ekleniyor</span>
    </div>`;
  }).join("");

  $("app").innerHTML = `
    <div class="info-box" style="margin-bottom:6px;">
      <strong>Başlamadan önce:</strong> ${UYARI_UZUN}
    </div>
    <h2 style="margin-top:26px;font-size:1.35rem;font-weight:800;">Sana uygun seviyeyi seç</h2>
    <p style="color:var(--muted);margin-top:6px;font-size:.92rem;">Her seviye için ayrı bir test hazırlanmıştır. Şu an <strong>İlkokul</strong> testi kullanıma açıktır; diğer seviyeler yakında eklenecektir.</p>
    <div class="lvl-grid">${kartlar}</div>
  `;
  document.querySelectorAll(".lvl-card.aktif").forEach(c => c.addEventListener("click", () => seviyeSec(c.dataset.sev)));
}

function seviyeSec(sev) { durum.seviye = sev; durum.ekran = "intro"; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }

function ekranIntro() {
  const s = SEVIYELER[durum.seviye];
  const uyari = s.cocuk ? UYARI_COCUK : UYARI_UZUN;
  const soruSay = SORULAR[durum.seviye].length;
  $("app").innerHTML = `
    <div class="card">
      <div class="intro-head">
        <span class="lvl-emoji">${s.emoji}</span>
        <div><span class="lvl-yas">${s.yas}</span><h2 style="margin-top:6px;">${s.ad} Testi</h2></div>
      </div>
      <p class="intro-desc">Bu testte <strong>${soruSay} soru</strong> bulunuyor. Her soruda sana en uygun seçeneği işaretle. Doğru ya da yanlış cevap yoktur — cevaplarını istediğin zaman değiştirebilirsin.</p>
      <div class="info-box">${uyari}</div>
      <div class="btn-row">
        <button class="btn btn-primary" id="basla">Teste Başla →</button>
        <button class="btn btn-ghost" id="geri">← Seviye Seçimi</button>
      </div>
    </div>
  `;
  $("basla").addEventListener("click", testeBasla);
  $("geri").addEventListener("click", () => { durum.ekran = "secim"; render(); window.scrollTo({ top: 0 }); });
}

function testeBasla() {
  durum.cevaplar = new Array(SORULAR[durum.seviye].length).fill(null);
  durum.indeks = 0; durum.ekran = "test"; render(); window.scrollTo({ top: 0 });
}

function ekranTest() {
  const sorular = SORULAR[durum.seviye];
  const i = durum.indeks, toplam = sorular.length;
  const soru = sorular[i];
  const cocuk = SEVIYELER[durum.seviye].cocuk;
  const yuzde = Math.round(((i) / toplam) * 100);

  const secenekler = SECENEKLER.map((o, idx) => {
    const puan = idx + 1, secili = durum.cevaplar[i] === puan;
    return `<button class="opt ${secili ? "secili" : ""}" data-puan="${puan}">
      ${cocuk ? `<span class="opt-emoji" aria-hidden="true">${o.emoji}</span>` : ""}
      <span>${o.metin}</span>
      <span class="opt-mark"></span>
    </button>`;
  }).join("");

  $("app").innerHTML = `
    <div class="progress-wrap">
      <div class="progress-top"><span>İlerleme</span><span class="progress-count">${i + 1}/${toplam}</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${yuzde}%"></div></div>
    </div>
    <div class="q-card">
      <span class="q-index">Soru ${i + 1}</span>
      <h2 class="q-text">${esc(soru.t)}</h2>
      <div class="options">${secenekler}</div>
      <div class="nav-row">
        <button class="btn btn-ghost" id="onceki" ${i === 0 ? "disabled" : ""}>← Önceki</button>
        <button class="btn btn-primary" id="sonraki">${i === toplam - 1 ? "Cevapları Kontrol Et →" : "Sonraki →"}</button>
      </div>
    </div>
  `;
  document.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
    durum.cevaplar[i] = parseInt(b.dataset.puan, 10);
    render(); // seçimi göster; kullanıcı Sonraki ile ilerler
  }));
  $("onceki").addEventListener("click", () => { if (i > 0) { durum.indeks--; render(); window.scrollTo({ top: 0 }); } });
  $("sonraki").addEventListener("click", () => {
    if (i < toplam - 1) { durum.indeks++; render(); window.scrollTo({ top: 0 }); }
    else { durum.ekran = "kontrol"; render(); window.scrollTo({ top: 0 }); }
  });
}

function ekranKontrol() {
  const sorular = SORULAR[durum.seviye];
  const boslar = durum.cevaplar.map((c, i) => c == null ? i : -1).filter(i => i >= 0);
  const chips = durum.cevaplar.map((c, i) =>
    `<div class="review-chip ${c == null ? "bos" : "dolu"}" data-i="${i}">${i + 1}</div>`).join("");

  $("app").innerHTML = `
    <div class="card">
      <h2 style="font-size:1.4rem;font-weight:800;">Cevaplarını Kontrol Et</h2>
      <p style="color:var(--muted);margin-top:6px;font-size:.9rem;">Bir soruya dönmek için numarasına dokunabilirsin. Boş bırakılan sorular kesikli çerçeveyle gösterilir.</p>
      <div class="warn-box ${boslar.length ? "show" : ""}" id="warn">
        <strong>${boslar.length} soruyu</strong> henüz boş bıraktın. Testi tamamlamak için tüm soruları cevaplaman gerekiyor.
      </div>
      <div class="review-list">${chips}</div>
      <div class="btn-row">
        <button class="btn btn-primary" id="bitir" ${boslar.length ? "disabled" : ""}>Sonucu Gör →</button>
        <button class="btn btn-ghost" id="devam">← Sorulara Dön</button>
      </div>
      ${boslar.length ? `<p style="margin-top:14px;"><button class="btn btn-outline" id="ilkBos">İlk boş soruya git (Soru ${boslar[0] + 1})</button></p>` : ""}
    </div>
  `;
  document.querySelectorAll(".review-chip").forEach(c => c.addEventListener("click", () => {
    durum.indeks = parseInt(c.dataset.i, 10); durum.ekran = "test"; render(); window.scrollTo({ top: 0 });
  }));
  $("devam").addEventListener("click", () => { durum.indeks = 0; durum.ekran = "test"; render(); window.scrollTo({ top: 0 }); });
  if (boslar.length) {
    $("ilkBos").addEventListener("click", () => { durum.indeks = boslar[0]; durum.ekran = "test"; render(); window.scrollTo({ top: 0 }); });
  } else {
    $("bitir").addEventListener("click", () => { durum.ekran = "sonuc"; render(); window.scrollTo({ top: 0 }); });
  }
}

function ekranSonuc() {
  const seviye = durum.seviye, s = SEVIYELER[seviye];
  const sonuclar = yuzdeHesapla(durum.cevaplar, seviye).sort((a, b) => b.yuzde - a.yuzde);
  const top3 = sonuclar.slice(0, 3);
  const dengeli = (top3[0].yuzde - top3[2].yuzde) < 5;

  const topCards = top3.map((r, idx) => {
    const A = ALANLAR[r.key];
    return `<div class="top-card" style="border-top:4px solid ${A.renk};">
      <span class="top-rank">${idx + 1}. Öne Çıkan Alan</span>
      <div class="top-name">${A.ad}</div>
      <div class="top-pct" style="color:${A.renk};">%${r.yuzde}</div>
      <div class="top-desc">${A.kisa}</div>
      <div class="top-use"><b>Nasıl kullanabilirsin?</b> ${A.nasil}</div>
    </div>`;
  }).join("");

  const barlar = sonuclar.map(r => {
    const A = ALANLAR[r.key];
    return `<div>
      <div class="bar-row">
        <span class="bar-name">${A.ad}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${r.yuzde}%;background:${A.renk};"></span></span>
        <span class="bar-pct">%${r.yuzde}</span>
      </div>
      <div class="bar-interp" style="margin-left:162px;">${yorumAralik(r.yuzde)}</div>
    </div>`;
  }).join("");

  $("app").innerHTML = `
    <div class="no-print" style="margin-bottom:18px;"><button class="btn btn-ghost" id="tekrar">← Yeni Test / Seviye Seç</button></div>

    <h1 class="result-title">Öğrenme Eğilimleri ve Güçlü Yönler Sonucun</h1>
    <p class="result-sub">${s.ad} düzeyi · Aşağıdaki sonuçlar hangi yöntemlerle daha rahat öğrendiğine dair bir <strong>eğilim</strong> gösterir; kesin bir zekâ ölçümü değildir.</p>

    <div class="card" style="margin-top:22px;">
      <div class="section-h">🌟 Öne Çıkan Öğrenme Eğilimlerin</div>
      <div class="section-note">En belirgin görünen üç alan. Bu, yalnızca bu alanlara sahip olduğun anlamına gelmez.</div>
      <div class="top-grid">${topCards}</div>
      ${dengeli ? `<div class="balanced-box">Sonuçların, birden fazla öğrenme alanını birlikte kullandığını gösteriyor. Bu nedenle tek bir yöntem yerine farklı çalışma tekniklerini bir arada kullanman daha yararlı olabilir.</div>` : ""}
    </div>

    <div class="card">
      <div class="section-h">📊 Bütün Alanların Yüzdeleri</div>
      <div class="section-note">Sekiz alan yüksekten düşüğe sıralanmıştır.</div>
      ${barlar}
    </div>

    <div class="card">
      <div class="section-h">🕸️ Öğrenme Profili Radarı</div>
      <div class="section-note">Sekiz alan tek grafikte. Altındaki liste tüm yüzdeleri ayrıca gösterir.</div>
      <div class="radar-wrap">${radarSVG(sonuclar)}</div>
    </div>

    <div class="card rapor" id="rapor">${raporUret(sonuclar, seviye)}</div>

    <div class="card" style="background:var(--bg-soft);">
      <div class="section-h">ℹ️ Bilgilendirme</div>
      <p style="font-size:.9rem;line-height:1.65;color:#55505A;">${UYARI_UZUN}</p>
    </div>

    <div class="no-print btn-row" style="justify-content:center;">
      <button class="btn btn-outline" id="yazdir">🖨️ Sonucu Yazdır / PDF</button>
      <button class="btn btn-ghost" id="tekrar2">Yeni Test</button>
    </div>
  `;
  $("tekrar").addEventListener("click", yeniden);
  $("tekrar2").addEventListener("click", yeniden);
  $("yazdir").addEventListener("click", () => window.print());
}

function yeniden() { durum.ekran = "secim"; durum.seviye = null; durum.cevaplar = []; durum.indeks = 0; render(); window.scrollTo({ top: 0 }); }

/* ═════════════ KİŞİSEL RAPOR (kural tabanlı) ═════════════ */
function raporUret(sonuclar, seviye) {
  const s = SEVIYELER[seviye];
  const cocuk = s.cocuk;
  const top3 = sonuclar.slice(0, 3);
  const orta = sonuclar.filter(r => r.yuzde >= 25 && r.yuzde < 50);
  const dusuk = sonuclar.filter(r => r.yuzde < 25);
  const guclu = sonuclar.filter(r => r.yuzde >= 50);
  const sen = cocuk ? "sen" : "sen";

  // 1. Genel profil
  const enY = top3[0], A0 = ALANLAR[enY.key];
  const dengeli = (top3[0].yuzde - top3[2].yuzde) < 5;
  let genel;
  if (dengeli) {
    genel = `Cevapların, öğrenirken birden fazla yolu birlikte kullandığını gösteriyor. En yüksek çıkan alanların (${top3.map(r => ALANLAR[r.key].ad).join(", ")}) birbirine yakın; bu, dengeli bir öğrenme profiline sahip olabileceğini gösterir. Tek bir yönteme bağlı kalmak yerine farklı çalışma tekniklerini bir arada denemen sana yardımcı olabilir.`;
  } else {
    genel = `Cevaplarına göre ${A0.ad} eğilimin şu anda diğer alanlara göre daha belirgin görünüyor. Ancak bu, yalnızca tek bir öğrenme yönün olduğu anlamına gelmez; birden fazla alanda güçlü yönlere sahip olabilirsin ve sonuçların zamanla, deneyimlerinle değişebilir.`;
  }

  // 2. Öne çıkan eğilimler
  const oneCikan = `<ul class="dots">${top3.map(r => `<li><strong>${ALANLAR[r.key].ad} (%${r.yuzde})</strong> — ${ALANLAR[r.key].kisa}</li>`).join("")}</ul>`;

  // 3. Güçlü yönler
  const gucluMetin = guclu.length
    ? `<ul class="dots">${guclu.map(r => `<li><strong>${ALANLAR[r.key].ad}:</strong> ${yorumAralik(r.yuzde)}</li>`).join("")}</ul>`
    : `<p>Sonuçların alanlar arasında oldukça dengeli dağılmış. Bu da farklı yöntemleri esnek biçimde kullanabildiğin anlamına gelebilir.</p>`;

  // 4. En uygun öğrenme yöntemleri (top3 birleşimi)
  const yontemler = benzersiz(top3.flatMap(r => ALANLAR[r.key].yontemler)).slice(0, 10);
  const yontemMetin = `<ul class="dots">${yontemler.map(y => `<li>${y}</li>`).join("")}</ul>`;

  // 5. Ders çalışma önerileri
  const dersler = benzersiz(top3.flatMap(r => ALANLAR[r.key].ders)).slice(0, 12);
  const dersMetin = `<ul class="dots">${dersler.map(d => `<li>${d}</li>`).join("")}</ul>`;

  // 6. Öğretmen önerileri (öğrenci seviyeleri)
  const ogretmenBolum = seviye !== "yetiskin"
    ? `<h4>Öğretmen İçin Öneriler</h4><ul class="dots">${top3.map(r => `<li><strong>${ALANLAR[r.key].ad}:</strong> ${ALANLAR[r.key].ogretmen}</li>`).join("")}</ul>`
    : "";

  // 7. Veli önerileri (ilkokul/ortaokul)
  const veliBolum = s.veli
    ? `<h4>Veli İçin Öneriler</h4><ul class="dots">${VELI_ONERI.map(v => `<li>${v}</li>`).join("")}</ul>`
    : "";

  // 8. Günlük hayatta etkinlikler
  const gunlukMetin = `<ul class="dots">${top3.map(r => `<li><strong>${ALANLAR[r.key].ad}:</strong> ${ALANLAR[r.key].gunluk}</li>`).join("")}</ul>`;

  // 9. Daha az belirgin alanları destekleme
  const destekAlan = (dusuk.length ? dusuk : sonuclar.slice(-2));
  const destekMetin = `<p style="margin-bottom:6px;">Aşağıdaki alanlar şu anda diğer eğilimlerine göre daha az belirgin. Bu bir eksiklik değildir; istersen bu alanları da farklı etkinliklerle destekleyebilirsin:</p><ul class="dots">${destekAlan.map(r => `<li><strong>${ALANLAR[r.key].ad}:</strong> ${ALANLAR[r.key].gunluk}</li>`).join("")}</ul>`;

  // İlkokul için sıcak, çocuğa hitap eden özet
  const cocukOzet = cocuk
    ? `<div class="info-box" style="margin-bottom:16px;border-left-color:${A0.renk};">Cevaplarına göre <strong>${A0.ad.toLocaleLowerCase("tr-TR")}</strong> yöntemleriyle çalışmak sana öğrenirken yardımcı olabilir. ${A0.nasil} Başka yöntemleri de birlikte kullanabilirsin — birçok alanda güçlü yönlerin olabilir.</div>`
    : "";

  return `
    <div class="section-h">🤖 Sana Özel Öğrenme Raporu</div>
    <div class="section-note">Bu rapor, sekiz alanın sonucunu birlikte değerlendirir; tek bir alana indirgemez.</div>
    ${cocukOzet}
    <h4>1. Genel Profil</h4><p>${genel}</p>
    <h4>2. Öne Çıkan Öğrenme Eğilimlerin</h4>${oneCikan}
    <h4>3. Güçlü Yönlerin</h4>${gucluMetin}
    <h4>4. Sana En Uygun Öğrenme Yöntemleri</h4>${yontemMetin}
    <h4>5. Ders Çalışma Önerileri</h4>${dersMetin}
    <h4>6. Günlük Hayatta Uygulayabileceğin Etkinlikler</h4>${gunlukMetin}
    <h4>7. Daha Az Belirgin Alanları Destekleme</h4>${destekMetin}
    ${ogretmenBolum}
    ${veliBolum}
    <h4>Bilimsel ve Eğitsel Uyarı</h4>
    <p>Bu sonuçlar kesin bir zekâ ölçümü veya bilimsel teşhis değildir; öğrenme eğilimlerini fark etmene yardımcı olmak amacıyla hazırlanmıştır. Sonuçların yaşa, deneyimlerine ve ilgi alanlarına göre değişebilir.</p>
  `;
}

/* ═════════════ BAŞLAT ═════════════ */
render();

/* Mobil menü */
const btn = $("menuBtn"), mnav = $("mobileNav");
btn.addEventListener("click", () => mnav.classList.toggle("open"));
mnav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => mnav.classList.remove("open")));
