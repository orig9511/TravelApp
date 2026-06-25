$port = 3000
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1

if ($process) {
  Stop-Process -Id $process.OwningProcess -Force
  Write-Host "Killed process on port $port"
}
