# Yerel LiveKit sunucusunu ve WSL keepalive oturumunu durdurur.
$ErrorActionPreference = "Stop"
$klasor = Split-Path -Parent $MyInvocation.MyCommand.Path

$yol = wsl -e wslpath -a ($klasor -replace "\\", "/")
wsl -e sh -c "cd '$yol' && docker compose down"

Get-CimInstance Win32_Process -Filter "Name = 'wsl.exe'" |
  Where-Object { $_.CommandLine -match "sleep infinity" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -Confirm:$false }
Write-Host "LiveKit durduruldu."
