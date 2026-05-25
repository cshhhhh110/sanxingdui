param(
  [int]$DelaySeconds = 60,
  [int]$BatchLimit = 999,
  [string]$Voices = "default,zh_female,sweet",
  [string]$Endpoint = "http://localhost:8800/api/tts/speech",
  [string]$Speed = "1.0",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$logDir = Join-Path $projectRoot "logs\voice-guide"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $logDir "trail-voice-guide-$timestamp.log"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor Cyan
}

function Restore-Env {
  param([hashtable]$OldValues)

  foreach ($name in $OldValues.Keys) {
    if ($null -eq $OldValues[$name]) {
      Remove-Item "Env:$name" -ErrorAction SilentlyContinue
    } else {
      Set-Item "Env:$name" $OldValues[$name]
    }
  }
}

$envNames = @(
  "TRAIL_TTS_ENDPOINT",
  "TRAIL_TTS_VOICES",
  "TRAIL_TTS_SPEED",
  "TRAIL_TTS_DELAY_MS",
  "TRAIL_TTS_BATCH_LIMIT",
  "TRAIL_TTS_DRY_RUN"
)

$oldEnv = @{}
foreach ($name in $envNames) {
  $oldEnv[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
}

try {
  Set-Location $projectRoot

  $nodeVersion = (& node --version)
  $npmVersion = (& npm.cmd --version)

  $env:TRAIL_TTS_ENDPOINT = $Endpoint
  $env:TRAIL_TTS_VOICES = $Voices
  $env:TRAIL_TTS_SPEED = $Speed
  $env:TRAIL_TTS_DELAY_MS = [string]($DelaySeconds * 1000)
  $env:TRAIL_TTS_BATCH_LIMIT = [string]$BatchLimit

  if ($DryRun) {
    $env:TRAIL_TTS_DRY_RUN = "1"
  } else {
    Remove-Item Env:TRAIL_TTS_DRY_RUN -ErrorAction SilentlyContinue
  }

  Write-Step "Trail voice guide generation"
  Write-Host "Project : $projectRoot"
  Write-Host "Endpoint: $Endpoint"
  Write-Host "Voices  : $Voices"
  Write-Host "Delay   : $DelaySeconds seconds per request"
  Write-Host "Limit   : $BatchLimit missing audio requests"
  Write-Host "Speed   : $Speed"
  Write-Host "Dry run : $DryRun"
  Write-Host "Node    : $nodeVersion"
  Write-Host "npm     : $npmVersion"
  Write-Host "Log     : $logPath"
  Write-Host ""
  Write-Host "Keep the frontend/backend running while this script works." -ForegroundColor Yellow
  Write-Host "You can stop it with Ctrl+C. Existing audio files are skipped next time." -ForegroundColor Yellow
  Write-Host ""

  Write-Step "Starting npm script"
  & npm.cmd run voice-guide:generate 2>&1 | Tee-Object -FilePath $logPath

  if ($LASTEXITCODE -ne 0) {
    throw "voice-guide:generate failed with exit code $LASTEXITCODE"
  }

  Write-Step "Done"
  Write-Host "Log saved to: $logPath" -ForegroundColor Green
  Write-Host "Manifest: public\data\trail-voice-guide.manifest.json" -ForegroundColor Green
  Write-Host "Audio   : public\audio\trail-guide" -ForegroundColor Green
} finally {
  Restore-Env $oldEnv
}
