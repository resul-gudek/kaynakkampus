# LAN yayını için güvenlik duvarı kuralları — YÖNETİCİ olarak çalıştırılmalıdır.
# Açılan portlar:
#   8443/TCP  Caddy (uygulama, https)
#   8444/TCP  Caddy (LiveKit sinyal, wss)
#   7881/TCP  LiveKit WebRTC TCP fallback (WSL container'ına doğrudan)
#   50000-50060/UDP  LiveKit WebRTC medya (WSL container'ına doğrudan)
# 37337 (Next.js) ve 1433 (SQL Server) bilerek AÇILMAZ — dışarıdan yalnızca
# Caddy üzerinden erişilmelidir.
$ErrorActionPreference = "Stop"

$kurallar = @(
  @{ Ad = "KaynakAkademi Caddy HTTPS";   Protokol = "TCP"; Port = "8443" },
  @{ Ad = "KaynakAkademi Caddy LiveKit"; Protokol = "TCP"; Port = "8444" },
  @{ Ad = "KaynakAkademi LiveKit TCP";   Protokol = "TCP"; Port = "7881" },
  @{ Ad = "KaynakAkademi LiveKit UDP";   Protokol = "UDP"; Port = "50000-50060" }
)

foreach ($k in $kurallar) {
  if (-not (Get-NetFirewallRule -DisplayName $k.Ad -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $k.Ad -Direction Inbound -Action Allow `
      -Protocol $k.Protokol -LocalPort $k.Port -Profile Private,Domain | Out-Null
    Write-Host "Kural eklendi: $($k.Ad)"
  } else {
    Set-NetFirewallRule -DisplayName $k.Ad -Protocol $k.Protokol -LocalPort $k.Port
    Write-Host "Kural güncellendi: $($k.Ad) -> $($k.Protokol) $($k.Port)"
  }
}

# WSL "mirrored" ağ modunda container portlarına LAN'dan gelen trafik ayrıca
# Hyper-V güvenlik duvarından geçer; WSL VM'i için de izin gerekir.
$wslVmCreator = "{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}"
$hvKurallar = @(
  @{ Ad = "KaynakAkademi WSL LiveKit TCP"; Protokol = "TCP"; Port = @("7880", "7881") },
  @{ Ad = "KaynakAkademi WSL LiveKit UDP"; Protokol = "UDP"; Port = @("50000-50060") }
)
foreach ($k in $hvKurallar) {
  if (-not (Get-NetFirewallHyperVRule -Name $k.Ad -ErrorAction SilentlyContinue)) {
    New-NetFirewallHyperVRule -Name $k.Ad -DisplayName $k.Ad -Direction Inbound `
      -Action Allow -Protocol $k.Protokol -LocalPorts $k.Port -VMCreatorId $wslVmCreator | Out-Null
    Write-Host "Hyper-V kuralı eklendi: $($k.Ad)"
  } else {
    Write-Host "Hyper-V kuralı zaten var: $($k.Ad)"
  }
}

Write-Host "Tamamlandı."
