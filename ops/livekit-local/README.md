# Yerel LiveKit Sunucusu

Canlı ders altyapısı (video/ses/ekran paylaşımı + tahta senkronu) self-hosted
[LiveKit](https://livekit.io) üzerinden çalışır. Bu klasör yalnızca **yerel geliştirme**
içindir.

## Başlatma

Bu makinede Docker, WSL (Ubuntu-22.04) içinde çalışır. WSL açık oturum kalmayınca
VM'i kapattığı için başlatma betiği bir keepalive oturumu da açar:

```powershell
.\ops\livekit-local\start-livekit.ps1   # başlat
.\ops\livekit-local\stop-livekit.ps1    # durdur
```

Docker doğrudan Windows'ta kuruluysa şu da yeterlidir:

```powershell
cd ops/livekit-local
docker compose up -d
```

`.env` dosyasında şunlar tanımlı olmalı (bkz. `.env.example`):

```
LIVEKIT_URL="ws://127.0.0.1:7880"
LIVEKIT_API_KEY="devkey"
LIVEKIT_API_SECRET="kaynakakademi-livekit-dev-secret-0001"
```

Secret, `livekit.yaml` içindeki `keys.devkey` değeriyle birebir aynı olmalıdır.

> **Neden `localhost` değil?** WSL'in port yönlendirmesi Windows tarafında yalnızca
> IPv4 (127.0.0.1) dinler. Tarayıcı `ws://localhost` için önce IPv6 (::1) dener ve
> bağlantı kurulamaz ("websocket error during connection establishment").

## Doğrulama

```powershell
curl http://localhost:7880
# "OK" dönerse sunucu ayakta
```

Uygulamada bir ders oturumu oluşturup `/canli-ders/[id]` sayfasından "Derse Katıl"
ile odaya girilebilir. Aynı odayı iki farklı tarayıcı profiliyle (öğretmen + öğrenci)
test etmek en pratik yoldur.

## Production notları

- Tarayıcılar güvenli bağlam ister: prod'da `LIVEKIT_URL` **wss://** olmalı
  (reverse proxy arkasında TLS ya da LiveKit'in kendi TLS yapılandırması).
- UDP 50000-50060 (veya seçtiğiniz aralık) dışarı açık olmalı; kısıtlı ağlar için
  7881/TCP fallback ve gerekirse TURN yapılandırın.
- `keys` altına production için uzun rastgele bir secret üretin (`openssl rand -hex 32`),
  dev anahtarını prod'da kullanmayın.
- Ders kaydı ileride gerekirse LiveKit Egress ayrı bir servis olarak eklenir
  (KVKK süreci tamamlanana kadar kayıt kapalıdır).
