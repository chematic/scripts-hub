param(
  [Parameter(Mandatory=$true)]
  [string]$Origin
)

$ErrorActionPreference = "Stop"
$Origin = $Origin.TrimEnd("/")

if ($Origin -notmatch '^https://') {
  throw "Use an HTTPS origin, for example https://azuno.example.com"
}

foreach ($file in @("index.html","admin.html")) {
  $path = Join-Path $PSScriptRoot "..\$file"
  $html = Get-Content -LiteralPath $path -Raw

  $html = [regex]::Replace($html, '(<meta\s+property="og:image"\s+content=")[^"]+(")', "`${1}$Origin/assets/og-card.png`${2}")
  $html = [regex]::Replace($html, '(<meta\s+name="twitter:image"\s+content=")[^"]+(")', "`${1}$Origin/assets/og-card.png`${2}")

  if ($html -match '<meta\s+property="og:url"') {
    $html = [regex]::Replace($html, '(<meta\s+property="og:url"\s+content=")[^"]*(")', "`${1}$Origin/`${2}")
  } else {
    $html = $html -replace '(<meta\s+property="og:type"\s+content="website">)', '$1' + "`r`n" + "  <meta property=`"og:url`" content=`"$Origin/`">"
  }

  Set-Content -LiteralPath $path -Value $html -Encoding UTF8
}

Write-Host "Social preview URLs updated for $Origin" -ForegroundColor Green
