$ErrorActionPreference = 'Stop'
function Get-Value($class, $property) {
  try {
    $v = (Get-CimInstance -ClassName $class -ErrorAction Stop | Select-Object -First 1 -ExpandProperty $property)
    if ($v) { return ([string]$v).Trim() }
  } catch {}
  return ""
}
$parts = @(
  (Get-Value 'Win32_ComputerSystemProduct' 'UUID'),
  (Get-Value 'Win32_BIOS' 'SerialNumber'),
  (Get-Value 'Win32_BaseBoard' 'SerialNumber')
) | Where-Object { $_ -and $_ -notmatch 'To Be Filled|Default string|None|Unknown' }
$seed = ($parts -join '|').ToLowerInvariant()
if (-not $seed) { throw 'Could not read enough machine identifiers.' }
$bytes = [Text.Encoding]::UTF8.GetBytes($seed)
$hash = [Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
$hwid = (($hash | ForEach-Object ToString x2) -join '').ToUpperInvariant()
Set-Clipboard -Value $hwid
Write-Host "HWID copied to clipboard:`n$hwid" -ForegroundColor Green
