# Yerel LiveKit sunucusunu WSL içindeki Docker'da başlatır.
# WSL, açık oturum kalmayınca VM'i kapattığı için arka planda bir keepalive
# oturumu tutulur; durdurmak için stop-livekit.ps1 kullanın.
$ErrorActionPreference = "Stop"
$klasor = Split-Path -Parent $MyInvocation.MyCommand.Path

$keepalive = Get-CimInstance Win32_Process -Filter "Name = 'wsl.exe'" |
  Where-Object { $_.CommandLine -match "sleep infinity" }
if (-not $keepalive) {
  Start-Process -WindowStyle Hidden wsl -ArgumentList "-e", "sleep", "infinity"
  Write-Host "WSL keepalive oturumu başlatıldı."
}

$yol = wsl -e wslpath -a ($klasor -replace "\\", "/")
wsl -e sh -c "cd '$yol' && docker compose up -d"
if ($LASTEXITCODE -ne 0) { throw "docker compose başlatılamadı." }

$hazir = $false
foreach ($deneme in 1..10) {
  $kod = & curl.exe -s -o NUL -w "%{http_code}" --max-time 5 http://127.0.0.1:7880
  if ($kod -eq "200") {
    Write-Host "LiveKit hazır: http://localhost:7880 (HTTP $kod)"
    $hazir = $true
    break
  }
  Start-Sleep -Seconds 2
}
if (-not $hazir) {
  Write-Warning "LiveKit yanıt vermiyor; 'wsl -e sh -c ""docker logs livekit-local-livekit-1""' ile kontrol edin."
}
