# LAN Yayını

Uygulamayı bu PC üzerinden yerel ağdaki (aynı Wi-Fi/ethernet) cihazlara sunar.

```
LAN cihazı ──https──> Caddy :443 ──http──> Next.js :37337
LAN cihazı ──wss───> Caddy :7443 ──ws──> LiveKit :7880 (WSL Docker)
LAN cihazı ──udp 50000-50060 / tcp 7881──> LiveKit (medya, doğrudan)
```

HTTPS zorunludur: tarayıcılar kamera/mikrofon erişimini (canlı ders) yalnızca
güvenli bağlamda verir. Sertifikalar [mkcert](https://github.com/FiloSottile/mkcert)
ile üretilmiştir; **istemci cihazların mkcert kök sertifikasına güvenmesi gerekir**
(aşağıda).

## İlk kurulum (bir kez)

1. `npm run build` (kod her değiştiğinde tekrar).
2. Güvenlik duvarı kuralları — **yönetici** PowerShell'de:
   ```powershell
   .\ops\lan-yayin\guvenlik-duvari-admin.ps1
   ```
3. Kök sertifikayı istemci cihazlara kurun (aşağıdaki bölüm).
4. Router'da bu PC için **DHCP rezervasyonu** yapın: IP (192.168.1.101) değişirse
   sertifika, Caddyfile, livekit.yaml (`node_ip`) ve `.env` güncellenmelidir.

## Başlat / durdur

```powershell
.\ops\lan-yayin\baslat.ps1   # LiveKit + Caddy + Next.js
.\ops\lan-yayin\durdur.ps1
```

Erişim: **https://192.168.1.101**

## Kök sertifikayı cihazlara kurma

Kök sertifika dosyası: `%LOCALAPPDATA%\mkcert\rootCA.pem`
(bu PC'de: `C:\Users\ResulGüdek\AppData\Local\mkcert\rootCA.pem`).
Dosyayı cihazlara WhatsApp/e-posta/USB ile gönderin.

- **Windows:** dosyaya çift tıkla → Sertifika Yükle → Geçerli Kullanıcı →
  "Tüm sertifikaları aşağıdaki depoya yerleştir" → **Güvenilen Kök Sertifika
  Yetkilileri** → Son.
- **Android:** Ayarlar → Güvenlik → Diğer güvenlik ayarları → Depolamadan yükle →
  CA sertifikası → dosyayı seç (menü adları markaya göre değişir; "CA sertifikası
  yükle" diye aratın).
- **iOS/iPadOS:** dosyayı Mail/AirDrop ile aç → Profil indirilir → Ayarlar →
  Genel → VPN ve Cihaz Yönetimi → profili yükle → sonra Ayarlar → Genel →
  Hakkında → Sertifika Güveni Ayarları → **tam güveni aç**.
- **macOS:** çift tıkla → Anahtar Zinciri'ne ekle → sertifikayı aç →
  Güven → "Her zaman güven".

> Kurulmazsa: sayfa "bağlantınız gizli değil" uyarısıyla açılabilir ama canlı
> ders (kamera/mikrofon/wss) çalışmaz.

## IP değişirse

1. `mkcert -cert-file ops\lan-yayin\sertifika\lan.pem -key-file ops\lan-yayin\sertifika\lan-key.pem YENI_IP localhost 127.0.0.1`
2. `Caddyfile`, `.env` (`UYGULAMA_URL`, `LIVEKIT_URL`) ve
   `ops/livekit-local/livekit.yaml` (`rtc.node_ip`) içindeki IP'yi değiştirin.
3. `durdur.ps1` + `baslat.ps1`. (Kök CA aynı kaldığı için cihazlara yeniden
   sertifika kurmak **gerekmez**.)

## Otomatik başlatma (isteğe bağlı)

Görev Zamanlayıcı'da "Oturum açıldığında" tetikleyicili bir görev oluşturup
programa `powershell.exe`, bağımsız değişkenlere
`-ExecutionPolicy Bypass -File c:\Repos\kaynakakademi\ops\lan-yayin\baslat.ps1`
yazın.

## Güvenlik notları

- 37337 (Next.js) ve 1433 (SQL Server) güvenlik duvarında **açılmaz**; dışarıdan
  yalnızca Caddy (443/7443) üzerinden erişilir.
- LiveKit dev anahtarı üretim değeriyle değiştirildi (`livekit.yaml` + `.env`).
- Bu kurulum yalnızca yerel ağ içindir — internete açmak için router'da port
  yönlendirme YAPMAYIN; internet erişimi gerekirse gerçek domain + Let's Encrypt
  ile ayrı bir kurulum gerekir.
- Seed'den gelen demo hesap şifrelerini (`admin/admin1234` vb.) gerçek
  kullanıma geçmeden değiştirin.
