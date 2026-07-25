# LAN yayınını durdurur: Next.js + Caddy + LiveKit.
$ErrorActionPreference = "Continue"
$opsKlasor = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $opsKlasor "..\..")

# Next.js: 37337'yi dinleyen node sürecini kapat
$baglanti = Get-NetTCPConnection -LocalPort 37337 -State Listen -ErrorAction SilentlyContinue
if ($baglanti) {
  $baglanti | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    Write-Host "Next.js durduruldu (PID $_)."
  }
} else {
  Write-Host "Next.js zaten çalışmıyor."
}

# Caddy
$caddy = Get-Process caddy -ErrorAction SilentlyContinue
if ($caddy) { $caddy | Stop-Process -Force; Write-Host "Caddy durduruldu." }
else { Write-Host "Caddy zaten çalışmıyor." }

# LiveKit
& (Join-Path $repo "ops\livekit-local\stop-livekit.ps1")
