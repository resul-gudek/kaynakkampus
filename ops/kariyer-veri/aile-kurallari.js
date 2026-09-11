/* Program → program ailesi eşleme kuralları.
   Sıralıdır: ilk eşleşen kural kazanır. "tam" birebir ad eşleşmesi,
   "desen" ad içinde geçen kalıp. Amaç: katalogdaki her programın tek ve
   mantıklı bir aileye bağlanması (UNMAPPED_PROGRAM_COUNT === 0). */
module.exports = [
  // ── Öğretmenlik en başta: alanı ne olursa olsun mesleği öğretmenliktir ──
  { aile: "egitim-ogretmenlik", desen: [/Öğretmenliği$/, /Öğreticilik$/] },
  { aile: "egitim-ogretmenlik", tam: ["Bilgisayar ve Öğretim Teknolojileri Öğretmenliği", "Felsefe Grubu Öğretmenliği"] },

  // ── Kültür, miras ve arkeoloji ──
  { aile: "kultur-miras", tam: ["Müzecilik", "Kültür Varlıklarını Koruma ve Onarım", "Eser Koruma", "Mimari Restorasyon", "Sanat Eserleri Konservasyonu ve Restorasyonu", "Geleneksel Tekstillerin Korunması ve Restorasyonu", "Bilgi ve Belge Yönetimi", "Sanat Tarihi", "Arkeoloji ve Sanat Tarihi", "Kültürel Miras ve Turizm", "Sanat ve Kültür Yönetimi"] },
  { aile: "kultur-miras", desen: [/Arkeoloji/] },


  { aile: "spor-hareket", desen: [/Antrenörlü/, /Spor/, /Rekreasyon/, /Egzersiz/, /Atçılık/] },

  // ── Müzik ──
  { aile: "muzik", tam: ["Arp", "Bale", "Bando Şefliği", "Bestecilik", "Bestecilik ve Müzik Teorisi", "Bestecilik ve Orkestra Şefliği", "Caz", "Caz ve Popüler Müzik", "Çalgı Eğitimi", "Çalgı Teknolojileri", "Çalgı Yapımı ve Onarımı", "Fagot", "Flüt", "Geleneksel Çalgılar", "Gitar", "Keman", "Klarnet", "Kontrbas", "Korno", "Koro", "Obua", "Opera", "Orkestra ve Koro Şefliği", "Piyano", "Piyano, Arp ve Gitar", "Saksafon", "Ses Eğitimi", "Ses Sanatları Tasarımı", "Şan", "Trombon", "Trompet", "Üflemeli ve Vurmalı Çalgılar", "Viyola", "Viyolonsel", "Vurmalı Çalgılar", "Yaylı Çalgılar", "Etnomüzikoloji", "Osmanlı Dönemi Karşılaştırmalı Müzik"] },
  { aile: "muzik", desen: [/Müzi[kğ]/, /Musiki/] },

  // ── Sahne sanatları ──
  { aile: "sahne-sanatlari", tam: ["Oyunculuk", "Drama ve Oyunculuk", "Drama Yazarlığı ve Dramaturji", "Tiyatro", "Tiyatro Eleştirmenliği ve Dramaturji", "Sahne Sanatları", "Sahne Tasarımı", "Sahne Dekoru ve Kostümü", "Sahne ve Dekor Tasarımı", "Sahne Işık ve Ses Teknolojileri", "Modern Dans", "Türk Halk Oyunları", "Performans"] },

  // ── Görsel sanatlar ──
  { aile: "gorsel-sanatlar", tam: ["Yapay Zeka Destekli Tasarım ve Animasyon", "Resim", "Görsel Sanatlar", "Heykel", "Baskı Sanatları", "Plastik Sanatlar", "Plastik Sanatlar ve Resim", "Bileşik Sanatlar", "Cam", "Seramik", "Seramik ve Cam", "Fotoğraf", "Fotoğraf ve Video", "Fotoğrafçılık ve Kameramanlık", "Grafik", "Grafik Sanatlar", "Grafik Tasarımı", "Çizgi Film ve Animasyon", "Çok Boyutlu Modelleme ve Animasyon", "Bilgisayar Destekli Tasarım ve Animasyon", "Mimari Dekoratif Sanatlar"] },

  // ── El sanatları ve üretim ──
  { aile: "el-sanatlari", tam: ["Saç Bakımı ve Güzellik Hizmetleri", "Saç ve Güzellik Uygulamaları", "El Sanatları", "Geleneksel El Sanatları", "Geleneksel Türk Sanatları", "Halı Tasarımı", "Halı, Kilim ve Geleneksel Kumaş Desenleri", "Halıcılık ve Kilimcilik", "Hat Sanatı", "Tezhip Sanatı", "Tezhip-Minyatür ve Ebru", "Çini Sanatı ve Tasarımı", "Çini Tasarımı ve Onarımı", "Kuyumculuk ve Mücevher Tasarımı", "Kuyumculuk ve Takı Tasarımı", "Takı Tasarımı ve İmalatı", "Aksesuar Tasarımı", "Endüstriyel Cam ve Seramik", "Seramik ve Cam Tasarımı", "Kenevir Dokumacılığı", "Mobilya ve Dekorasyon"] },

  // ── Tekstil ve moda ──
  { aile: "tekstil-moda", tam: ["Tekstil", "Tekstil Tasarımı", "Tekstil ve Moda Tasarımı", "Tekstil Mühendisliği", "Tekstil Teknolojisi", "Tekstil Geliştirme ve Pazarlama", "Tekstil ve Halı Makineleri", "Moda Tasarımı", "Moda Yönetimi", "Giyim Üretim Teknolojisi", "Ayakkabı Tasarım ve Üretimi", "Ayakkabı Tasarımı ve Üretimi", "Deri Mühendisliği", "Deri Teknolojisi"] },

  // ── Tasarım ──
  { aile: "tasarim", tam: ["Görsel Sanatlar ve İletişim Tasarımı", "Endüstriyel Tasarım", "Endüstriyel Tasarım Mühendisliği", "Endüstri Ürünleri Tasarımı", "Görsel İletişim Tasarımı", "Görsel İletişim", "İletişim ve Tasarımı", "İletişim Tasarımı ve Yönetimi", "Dijital Oyun Tasarımı"] },

  // ── Mimarlık ve mekân ──
  { aile: "mimarlik-mekan", tam: ["Mimarlık", "İç Mimarlık", "İç Mimarlık ve Çevre Tasarımı", "İç Mekan Tasarımı", "Peyzaj Mimarlığı", "Kentsel Tasarım ve Peyzaj Mimarlığı", "Şehir ve Bölge Planlama"] },

  // ── Sağlık ──
  { aile: "tip", tam: ["Tıp", "Adli Bilimler"] },
  { aile: "dis-hekimligi", tam: ["Diş Hekimliği", "Ağız ve Diş Sağlığı", "Diş Protez Teknolojisi"] },
  { aile: "eczacilik", tam: ["Eczacılık", "Eczane Hizmetleri", "Kozmetik Teknolojisi"] },
  { aile: "veterinerlik", tam: ["Veteriner", "Laborant ve Veteriner Sağlık"] },
  { aile: "hemsirelik-bakim", tam: ["Hemşirelik", "Ebelik", "Hasta Bakımı", "Evde Hasta Bakımı", "Yaşlı Bakımı", "Engelli Bakımı ve Rehabilitasyon", "Ameliyathane Hizmetleri", "Anestezi", "Perfüzyon", "Diyaliz", "Podoloji", "Dezenfeksiyon, Sterilizasyon ve Antisepsi Teknikerliği"] },
  { aile: "terapi-rehabilitasyon", tam: ["Fizyoterapi", "Fizyoterapi ve Rehabilitasyon", "Ergoterapi", "İş ve Uğraşı Terapisi", "Dil ve Konuşma Terapisi", "Odyoloji", "Odyometri", "Ortez ve Protez", "Ortopedik Protez ve Ortez"] },
  { aile: "guvenlik-acil", tam: ["İlk ve Acil Yardım", "Paramedik", "Acil Durum ve Afet Yönetimi", "Acil Yardım ve Afet Yönetimi", "Sivil Savunma ve İtfaiyecilik", "Özel Güvenlik ve Koruma", "Ceza İnfaz ve Güvenlik Hizmetleri", "İş Sağlığı ve Güvenliği"] },
  { aile: "saglik-teknolojileri", tam: ["Tıbbi Görüntüleme Teknikleri", "Tıbbi Laboratuvar Teknikleri", "Tıbbi Dokümantasyon ve Sekreterlik", "Tıbbi Veri İşleme Teknikerliği", "Patoloji Laboratuvar Teknikleri", "Radyoterapi", "Nükleer Tıp Teknikleri", "Elektronörofizyoloji", "Otopsi Yardımcılığı", "Optisyenlik", "Biyomedikal Cihaz Teknolojisi", "Biyomedikal Mühendisliği", "Sağlık Bilgi Sistemleri Teknikerliği", "Dijital Sağlık Sistemleri Teknikerliği", "Tele-Sağlık Teknikerliği", "Laboratuvar Teknolojisi", "Biyokimya", "Çevre Sağlığı", "Çevre Sağlığı ve Çevresel Risk Yönetimi Teknikerliği"] },

  // ── Beslenme, gıda, mutfak ──
  { aile: "beslenme-gida", tam: ["Beslenme ve Diyetetik", "Gıda Mühendisliği", "Gıda Teknolojisi", "Gıda Kalite Kontrolü ve Analizi", "Süt Teknolojisi", "Süt ve Ürünleri Teknolojisi", "Et ve Ürünleri Teknolojisi", "Un ve Unlu Mamuller Teknolojisi", "Yağ Endüstrisi", "Meyve ve Sebze İşleme Teknolojisi", "Su Ürünleri İşleme Teknolojisi", "Şarap Üretim Teknolojisi", "Zeytincilik ve Zeytin İşleme Teknolojisi", "Çay Tarımı ve İşleme Teknolojisi"] },
  { aile: "gastronomi", tam: ["Gastronomi ve Mutfak Sanatları", "Aşçılık", "Pastacılık ve Ekmekçilik", "İkram Hizmetleri", "Yiyecek ve İçecek İşletmeciliği", "Turizm ve Gastronomi Yönetimi Programları"] },

  // ── Dil, edebiyat, çeviri ──
  { aile: "dil-edebiyat-ceviri", desen: [/Dili ve Edebiyat/, /Dili ve Kültürü/, /Mütercim ve Tercümanlık/, /Çeviribilim/, /Dilbilim/, /Lehçeleri/, /Edebiyatı?$/] },
  { aile: "dil-edebiyat-ceviri", tam: ["Sinoloji", "Hindoloji", "Hititoloji", "Sümeroloji", "Hungaroloji", "Amerikan Kültürü ve Edebiyatı", "Çerkez Dili ve Kültürü", "Ermeni Dili ve Kültürü", "İbrani Dili ve Kültürü", "Karşılaştırmalı Edebiyat"] },

  // ── Bilişim ──
  { aile: "bilisim-yazilim", tam: ["Bilgisayar Mühendisliği", "Bilgisayar Bilimleri", "Yazılım Mühendisliği", "Yazılım Geliştirme", "Bilişim Sistemleri Mühendisliği", "Bilişim Sistemleri ve Teknolojileri", "Bilgisayar Teknolojisi", "Bilgisayar Teknolojisi ve Bilişim Sistemleri", "Bilgisayar Programcılığı", "Bilgisayar Operatörlüğü", "Arka-Yüz Yazılım Geliştirme", "Ön-Yüz Yazılım Geliştirme", "Mobil Teknolojileri", "İnternet ve Ağ Teknolojileri", "Bulut Bilişim Operatörlüğü", "Kurumsal Bilişim Uzmanlığı", "Siber Güvenlik", "Siber Güvenlik Mühendisliği", "Siber Güvenlik Analistliği ve Operatörlüğü", "Bilgi Güvenliği Teknolojisi", "Bilişim Güvenliği Teknolojisi", "Adli Bilişim Mühendisliği", "Yapay Zeka Mühendisliği", "Yapay Zeka ve Makine Öğrenmesi", "Yapay Zeka ve Veri Mühendisliği", "Yapay Zeka Operatörlüğü", "Robotik ve Yapay Zeka", "Veri Bilimi ve Analitiği", "Büyük Veri Analistliği", "Matematik ve Bilgisayar Bilimleri", "İstatistik ve Bilgisayar Bilimleri", "Yönetim Bilişim Sistemleri", "Teknoloji ve Bilgi Yönetimi", "Oyun Geliştirme ve Programlama", "Web Tasarımı ve Kodlama", "Sanal ve Artırılmış Gerçeklik"] },

  // ── Mühendislik kümeleri ──
  { aile: "elektrik-elektronik", tam: ["Elektrik Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Elektronik Mühendisliği", "Elektronik ve Haberleşme Mühendisliği", "Elektrik", "Elektrik Makineleri Bakım ve Onarımı", "Elektrik Enerjisi Üretim, İletim ve Dağıtımı", "Elektrikli Cihaz Teknolojisi", "Elektronik Teknolojisi", "Elektronik Haberleşme Teknolojisi", "Optoelektronik ve Elektro Optik Teknolojileri", "Optik ve Akustik Mühendisliği", "Fotonik", "Kontrol ve Otomasyon Mühendisliği", "Kontrol ve Otomasyon Teknolojisi", "Mekatronik", "Mekatronik Mühendisliği", "Otonom Sistemler Teknikerliği", "İnsansız Araç Teknikerliği", "Dijital Dönüşüm Elektroniği", "Raylı Sistemler Elektrik ve Elektronik"] },

  { aile: "insaat-yapi", tam: ["İnşaat Mühendisliği", "İnşaat Teknolojisi", "Yapı Denetimi", "Yapı Tesisat Teknolojisi", "Yapı Yalıtım Teknolojisi", "Yapı Ressamlığı", "Yapı Yüzeyi Tasarım Teknikerliği", "Geoteknik", "Harita Mühendisliği", "Harita ve Kadastro", "Tapu Kadastro", "Tapu ve Kadastro", "Coğrafi Bilgi Sistemleri", "Uzaktan Algılama ve Coğrafi Bilgi Sistemleri", "Doğal Yapı Taşları Teknolojisi", "Mermer Teknolojisi", "Yeşil ve Ekolojik Bina Teknikerliği", "Akıllı Altyapılar Teknikerliği", "İş Makineleri Operatörlüğü", "Emlak Yönetimi", "Gayrimenkul Geliştirme ve Yönetimi"] },

  { aile: "makine-uretim", tam: ["Makine Mühendisliği", "Makine", "Makine Resim ve Konstrüksiyonu", "İmalat Mühendisliği", "İmalat Yürütme Sistemleri Operatörlüğü", "Otomotiv Mühendisliği", "Otomotiv Teknolojisi", "Otomotiv Gövde ve Yüzey İşlem Teknolojileri", "Hibrid ve Elektrikli Taşıtlar Teknolojisi", "Endüstriyel Kalıpçılık", "Talaşlı Üretim Teknikerliği", "Cnc Programlama ve Operatörlüğü", "Kaynak Teknolojisi", "Su Altı Kaynak Teknolojisi", "Döküm", "Metalurji", "Metalurji ve Malzeme Mühendisliği", "Malzeme Bilimi ve Mühendisliği", "Malzeme Bilimi ve Teknolojileri", "Malzeme Bilimi ve Nanoteknoloji Mühendisliği", "Nanoteknoloji Mühendisliği", "Nanobilim ve Nanoteknoloji", "Polimer Malzeme Mühendisliği", "Polimer Teknolojisi", "Boya Teknolojisi", "Tahribatsız Muayene", "Üretimde Kalite Kontrol", "İklimlendirme ve Soğutma Teknolojisi", "Hidrolik ve Pnömatik Teknikerliği", "Doğalgaz ve Tesisatı Teknolojisi", "Dijital Fabrika Teknolojileri", "Ağaç İşleri Endüstri Mühendisliği", "Raylı Sistemler Makine Teknolojisi", "Raylı Sistemler Mühendisliği", "Raylı Sistemler Yol Teknolojisi", "Basım Teknolojileri", "Basım ve Yayım Teknolojileri", "Tarım Makineleri", "Tarım Makineleri ve Teknolojileri", "Tarım Makineleri ve Teknolojileri Mühendisliği", "Fiber Tekne İmalatı ve Kompozit Kalıp Teknolojileri", "Silah Sanayi Teknikerliği", "Bıçakçılık ve El Aletleri Üretim Teknolojisi", "Mühendislik ve Doğa Bilimleri Programları"] },

  { aile: "endustri-sistem", tam: ["Endüstri Mühendisliği", "İşletme Mühendisliği"] },

  { aile: "yer-maden-enerji", tam: ["Maden Mühendisliği", "Madencilik Teknolojisi", "Cevher Hazırlama Mühendisliği", "Jeoloji Mühendisliği", "Jeofizik Mühendisliği", "Hidrojeoloji Mühendisliği", "Petrol ve Doğalgaz Mühendisliği", "Sondaj Teknolojisi", "Açık Deniz Sondaj Teknolojisi", "Açık Deniz Tabanı Uygulamaları Teknolojisi", "Endüstriyel Hammaddeler İşleme Teknolojisi", "Rafineri ve Petro-Kimya Teknolojisi", "Enerji Sistemleri Mühendisliği", "Enerji Bilimi ve Teknolojileri", "Enerji Yönetimi", "Enerji Tesisleri İşletmeciliği", "Alternatif Enerji Kaynakları Teknolojisi", "Yenilenebilir Enerji Teknikerliği", "Hidrojen ve Enerji Depolama Teknikerliği", "Nükleer Enerji Mühendisliği", "Nükleer Teknoloji ve Radyasyon Güvenliği"] },

  // ── Temel bilimler ──
  { aile: "kimya-bilimleri", tam: ["Kimya", "Kimya Mühendisliği", "Kimya Teknolojisi", "Kimya-Biyoloji Mühendisliği"] },
  { aile: "fizik-bilimleri", tam: ["Fizik", "Fizik Mühendisliği", "Astronomi ve Uzay Bilimleri", "Uzay Bilimleri ve Teknolojileri"] },
  { aile: "matematik-istatistik", tam: ["Matematik", "Matematik Mühendisliği", "İstatistik", "Aktüerya Bilimleri", "Ekonometri"] },
  { aile: "biyoloji-yasam", tam: ["Biyoloji", "Moleküler Biyoloji ve Genetik", "Genetik ve Biyomühendislik", "Biyomühendislik", "Biyoteknoloji", "Biyoteknoloji ve Genetik", "Moleküler Biyoteknoloji", "Biyosistem Mühendisliği", "Tarımsal Biyoteknoloji", "Tarımsal Genetik Mühendisliği"] },
  { aile: "cevre-doga", tam: ["Çevre Mühendisliği", "Çevre Koruma ve Kontrol", "Çevresel Ölçüm ve İzleme Sistemleri Teknikerliği", "Su ve Atık Yönetimi Teknikerliği", "Karbon Yönetimi Teknikerliği", "İklim Bilimi ve Meteoroloji Mühendisliği", "Doğa Koruma ve Biyoçeşitlilik Yönetimi", "Yaban Hayatı Ekolojisi ve Yönetimi", "Avcılık ve Yaban Hayatı", "Su Bilimleri ve Mühendisliği", "Su Ürünleri Mühendisliği", "Su Ürünleri Endüstrisi Mühendisliği", "Balıkçılık Teknolojisi Mühendisliği", "Su Altı Teknolojisi"] },
  { aile: "orman-dogal-kaynak", tam: ["Orman Mühendisliği", "Orman Endüstrisi Mühendisliği", "Ormancılık ve Orman Ürünleri", "Fidan Yetiştiriciliği"] },

  // ── Tarım ve hayvancılık ──
  { aile: "tarim-bitkisel", tam: ["Ziraat Mühendisliği Programları", "Bahçe Bitkileri", "Bahçe Tarımı", "Tarla Bitkileri", "Bitki Koruma", "Bitkisel Üretim ve Teknolojileri", "Toprak Bilimi ve Bitki Besleme", "Tohum Bilimi ve Teknolojisi", "Tohumculuk Teknolojisi", "Organik Tarım", "Organik Tarım İşletmeciliği", "Seracılık", "Akıllı Sera Teknolojileri", "Akıllı Tarım ve Gıda Yönetimi", "Dijital Tarım Teknolojileri", "Hassas Tarım ve Tarımsal Robotlar", "Tarım Teknolojisi", "Tarımsal İşletmecilik", "Tarım Ekonomisi", "Tarım Ticareti ve İşletmeciliği", "Tarımsal Yapılar ve Sulama", "Sulama Teknolojisi", "Bağcılık", "Bağcılık ve Bağ Ürünleri Teknolojisi", "Mantarcılık", "Arıcılık", "Tıbbi ve Aromatik Bitkiler", "Peyzaj ve Süs Bitkileri Yetiştiriciliği", "Çim Alan Tesisi ve Yönetimi", "Zootekni", "Hayvansal Üretim ve Teknolojileri", "Kanatlı Hayvan Yetiştiriciliği", "Kümes Hayvanları Yetiştiriciliği", "Süt ve Besi Hayvancılığı", "Fındık Eksperliği", "Tütün Eksperliği"] },

  // ── Hukuk, kamu, yönetim, ekonomi ──
  { aile: "hukuk-adalet", tam: ["Hukuk", "Adalet", "Mahkeme Büro Hizmetleri"] },
  { aile: "siyaset-kamu", tam: ["Siyaset Bilimi", "Siyaset Bilimi ve Kamu Yönetimi", "Siyaset Bilimi ve Uluslararası İlişkiler", "Küresel Siyaset ve Uluslararası İlişkiler", "Uluslararası İlişkiler", "Kamu Yönetimi", "Yerel Yönetimler", "Politika ve Ekonomi", "Maliye", "Sosyal Güvenlik"] },
  { aile: "ekonomi-finans", tam: ["İktisat", "Ekonomi", "Ekonomi ve Finans", "Finans ve Bankacılık", "Bankacılık", "Bankacılık ve Sigortacılık", "Sigortacılık", "Sigortacılık ve Aktüerya Bilimleri", "Sigortacılık ve Risk Yönetimi", "Sigortacılık ve Sosyal Güvenlik", "Sermaye Piyasası", "Muhasebe ve Finans Yönetimi", "Muhasebe ve Vergi Uygulamaları", "Uluslararası Finans", "Uluslararası Finans ve Bankacılık", "Uluslararası Ticaret", "Uluslararası Ticaret ve Finansman", "Uluslararası Ticaret ve İşletmecilik", "Uluslararası Ticaret ve Lojistik", "Dış Ticaret", "Gümrük İşletme", "Elektronik Ticaret ve Yönetimi", "E-Ticaret ve Pazarlama", "İslam İktisadı ve Finans"] },
  { aile: "isletme-yonetim", tam: ["İşletme ve Yapay Zeka", "İşletme", "İşletme Yönetimi", "Uluslararası İşletme Yönetimi", "Uluslararası Girişimcilik", "İnsan Kaynakları Yönetimi", "Kooperatifçilik", "Çalışma Ekonomisi ve Endüstri İlişkileri", "Sağlık Kurumları İşletmeciliği", "Sağlık Yönetimi", "Yönetim Bilimleri Programları"] },
  { aile: "reklam-halkla-iliskiler", tam: ["Tıbbi Tanıtım ve Pazarlama", "Halkla İlişkiler ve Tanıtım", "Halkla İlişkiler ve Reklamcılık", "Reklamcılık", "Reklam Tasarımı ve İletişimi", "Pazarlama", "Marka İletişimi", "Sosyal Medya Yöneticiliği", "Perakende Satış ve Mağaza Yönetimi"] },
  { aile: "iletisim-medya", tam: ["İletişim", "İletişim Bilimleri", "Kültür ve İletişim Bilimleri", "Gazetecilik", "Basın ve Yayın", "Yeni Medya", "Yeni Medya ve İletişim", "Yeni Medya ve Gazetecilik", "Medya ve İletişim", "Medya ve Görsel Sanatlar", "Radyo, Televizyon ve Sinema", "Radyo ve Televizyon Teknolojisi", "Sinema ve Televizyon", "Sinema ve Dijital Medya", "Televizyon Haberciliği ve Programcılığı", "Film Tasarımı ve Yönetimi", "Kurgu, Ses ve Görüntü Yönetimi"] },

  // ── İnsan ve toplum ──
  { aile: "psikoloji-davranis", tam: ["Psikoloji", "Rehberlik ve Psikolojik Danışmanlık"] },
  { aile: "sosyal-hizmet", tam: ["Sosyal Hizmet", "Sosyal Hizmetler", "Gerontoloji"] },
  { aile: "cocuk-aile", tam: ["Çocuk Gelişimi", "Çocuk Koruma ve Bakım Hizmetleri"] },
  { aile: "sosyal-beseri", tam: ["Antropoloji", "Tarih ve Yapay Zeka", "Felsefe ve Yapay Zeka", "Sosyoloji", "Tarih", "Coğrafya", "Felsefe", "Bilim Tarihi", "Halkbilimi", "Türk Halkbilimi", "Sanat ve Sosyal Bilimler Programları", "İlahiyat", "İslami İlimler"] },

  // ── Ulaşım ve hizmet ──
  { aile: "havacilik", tam: ["Pilotaj", "Uçak Mühendisliği", "Havacılık ve Uzay Mühendisliği", "Uzay Mühendisliği", "Havacılık Elektrik ve Elektroniği", "Havacılık Elektroniği Teknolojileri", "Uçak Bakım ve Onarım", "Uçak Elektrik ve Elektroniği", "Uçak Gövde ve Motor Bakımı", "Uçak Teknolojisi", "Hava Aracı İmalat Teknolojileri", "Hava Trafik Kontrolü", "Uçuş Harekat Yöneticiliği", "Sivil Hava Ulaştırma İşletmeciliği", "Sivil Havacılık Kabin Hizmetleri", "Hava Lojistiği", "İnsansız Hava Aracı Teknolojisi ve Operatörlüğü", "Havacılık Yönetimi"] },
  { aile: "denizcilik", tam: ["Deniz Ulaştırma İşletme Mühendisliği", "Deniz Ulaştırma ve İşletme", "Gemi Makineleri İşletme Mühendisliği", "Gemi Makineleri İşletmeciliği", "Gemi İnşaatı", "Gemi İnşaatı ve Gemi Makineleri Mühendisliği", "Gemi ve Deniz Teknolojisi Mühendisliği", "Gemi ve Yat Tasarımı", "Deniz ve Liman İşletmeciliği", "Deniz Brokerliği", "Yat Kaptanlığı", "Denizcilik İşletmeleri Yönetimi", "Marina ve Yat İşletmeciliği"] },
  { aile: "lojistik-ulastirma", tam: ["Lojistik", "Lojistik Yönetimi", "Ulaştırma ve Trafik Hizmetleri", "Raylı Sistemler İşletmeciliği", "Raylı Sistemler Makinistliği", "Karayolu Yük Taşıtı Sürücülüğü", "Otobüs Kaptanlığı", "Posta Hizmetleri"] },
  { aile: "turizm-rehberlik", tam: ["Turizm İşletmeciliği", "Turizm ve Otel İşletmeciliği", "Turizm ve Seyahat Hizmetleri", "Seyahat İşletmeciliği", "Seyahat İşletmeciliği ve Turizm Rehberliği", "Turizm Rehberliği", "Turist Rehberliği", "Turizm Animasyonu", "Sağlık Turizmi İşletmeciliği", "Otel Yöneticiliği"] },
  { aile: "buro-yonetim-destek", tam: ["Büro Yönetimi ve Yönetici Asistanlığı", "Ofis Teknolojileri ve Veri Yönetimi", "Çağrı Merkezi Hizmetleri"] },


  /* ── 2026 kılavuzunda birimGrupId taşımayan kayıtlardan gelen adlar ──
     (bu kayıtlar id ile gruplanamadığı için ada göre toplanır) */
  { aile: "bilisim-yazilim", tam: ["Yapay Zeka Destekli Kodlama", "Yapay Zeka Destekli Web Tasarımı ve Kodlama", "Yapay Zeka ve Veri Analizi", "Dijital Oyun Teknolojileri", "Bilgisayar Bilimleri ve Mühendisliği", "Veri Mühendisliği", "Mobil Güvenlik Teknolojileri"] },
  { aile: "ekonomi-finans", tam: ["Bankacılık ve Finans", "Uygulamalı Bankacılık ve Finans", "Finansal Teknoloji", "Uluslararası Ticaret ve Finans", "E-Ticaret", "E-İşletme ve E-Ticaret"] },
  { aile: "reklam-halkla-iliskiler", tam: ["Halkla İlişkiler ve Pazarlama İletişimi"] },
  { aile: "iletisim-medya", tam: ["Dijital Yapımcılık ve Yayıncılık"] },
  { aile: "gorsel-sanatlar", tam: ["Animasyon ve Video Üretimi"] },
  { aile: "tasarim", tam: ["Veri Görselleştirme ve Bilgi Tasarımı"] },
  { aile: "mimarlik-mekan", tam: ["İç Mimarlık ve Mobilya Tasarımı"] },
  { aile: "el-sanatlari", tam: ["Tespih Tasarımı ve İmalatı"] },
  { aile: "gastronomi", tam: ["Gastronomi"] },
  { aile: "turizm-rehberlik", tam: ["Turizm ve Otel Yönetimi"] },
  { aile: "psikoloji-davranis", tam: ["Psikolojik Danışmanlık ve Rehberlik"] },
  { aile: "dil-edebiyat-ceviri", tam: ["Türkoloji", "Mütercim-Tercümanlık (Rusça)", "Kırgız Dili ve Edebiyatı", "Filoloji (İngiliz Dili ve Edebiyatı)"] },
  { aile: "tarim-bitkisel", tam: ["Bahçe ve Tarla Bitkileri", "Hayvancılık Teknolojileri ve İşletmeciliği"] },
  { aile: "veterinerlik", tam: ["Laboratuvar Hayvanları"] },
  { aile: "makine-uretim", tam: ["Robotik ve Otonom Sistemler Mühendisliği", "Patlayıcı ve Enerjetik Malzemeler Teknikerliği"] },
  { aile: "eczacilik", tam: ["İlaç Üretim Teknolojisi"] },
  { aile: "cevre-doga", tam: ["Balıkçılık Teknolojisi"] },

  // ── Son çare desenleri: yukarıdaki hiçbir kural tutmadıysa ──
  { aile: "makine-uretim", desen: [/Mühendisliği$/] },
  { aile: "teknik-uygulamali", desen: [/Teknolojisi$/, /Teknikerliği$/, /Operatörlüğü$/, /Teknolojileri$/, /Teknikleri$/] }];
