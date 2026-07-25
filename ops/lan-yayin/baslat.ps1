# Kaynak Akademi'yi LAN yayını modunda başlatır:
#   1. LiveKit (WSL Docker)  2. Caddy (https/wss)  3. Next.js production sunucusu
# Ön koşullar: npm run build alınmış olmalı, güvenlik duvarı kuralları uygulanmış
# olmalı (guvenlik-duvari-admin.ps1, bir kez, yönetici olarak).
$ErrorActionPreference = "Stop"
$opsKlasor = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $opsKlasor "..\..")

# 1) LiveKit
& (Join-Path $repo "ops\livekit-local\start-livekit.ps1")

# 2) Caddy (zaten çalışıyorsa dokunma)
$caddyCalisiyor = Get-Process caddy -ErrorAction SilentlyContinue
if ($caddyCalisiyor) {
  Write-Host "Caddy zaten çalışıyor (PID $($caddyCalisiyor.Id))."
} else {
  Start-Process -WindowStyle Hidden caddy -ArgumentList "run", "--config", (Join-Path $opsKlasor "Caddyfile") -WorkingDirectory $opsKlasor
  Write-Host "Caddy başlatıldı."
}

# 3) Next.js (port 37337'yi dinleyen biri var mı?)
$portDolu = Get-NetTCPConnection -LocalPort 37337 -State Listen -ErrorAction SilentlyContinue
if ($portDolu) {
  Write-Host "37337 portu zaten dinleniyor — uygulama çalışıyor görünüyor."
} else {
  Start-Process -WindowStyle Hidden cmd -ArgumentList "/c", "npm start" -WorkingDirectory $repo
  Write-Host "Next.js production sunucusu başlatılıyor..."
}

Start-Sleep -Seconds 3
foreach ($deneme in 1..15) {
  $kod = & curl.exe -k -s -o NUL -w "%{http_code}" --max-time 5 https://192.168.1.101:8443/giris
  if ($kod -eq "200") {
    Write-Host ""
    Write-Host "Hazır! LAN'daki cihazlardan erişim: https://192.168.1.101:8443" -ForegroundColor Green
    Write-Host "(Cihazların mkcert kök sertifikasına güvenmesi gerekir — bkz. README.md)"
    exit 0
  }
  Start-Sleep -Seconds 2
}
Write-Warning "Uygulama yanıt vermedi. 'npm start' çıktısını elle kontrol edin."
