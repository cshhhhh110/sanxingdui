param(
  [int]$DelaySeconds = 15,
  [int]$BatchLimit = 9999,
  [string]$Voices = "default,zh_female,sweet",
  [string]$Endpoint = "http://localhost:8889/api/tts/speech",
  [ValidateSet("SupplementMissing", "RefreshOptimized")]
  [string]$Mode = "SupplementMissing",
  [string]$Speed = "1.0",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$logDir = Join-Path $projectRoot "logs\voice-guide"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $logDir "trail-voice-guide-complete-$timestamp.log"
$pingUrl = $Endpoint -replace "/tts/speech$", "/tts/ping"

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

function Test-TtsBackend {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 300
  } catch {
    return $false
  }
}

$envNames = @(
  "TRAIL_TTS_ENDPOINT",
  "TRAIL_TTS_VOICES",
  "TRAIL_TTS_SPEED",
  "TRAIL_TTS_DELAY_MS",
  "TRAIL_TTS_BATCH_LIMIT",
  "TRAIL_TTS_MODE",
  "TRAIL_TTS_DRY_RUN"
)

$oldEnv = @{}
foreach ($name in $envNames) {
  $oldEnv[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
}

try {
  Set-Location $projectRoot

  if ($DryRun) {
    Write-Step "Skipping TTS backend check for dry run"
    Write-Host "Dry run does not send TTS requests, so the backend can be offline."
  } else {
    Write-Step "Checking TTS backend"
    Write-Host "Ping URL : $pingUrl"
    if (-not (Test-TtsBackend $pingUrl)) {
      Write-Host ""
      Write-Host "TTS backend is not reachable." -ForegroundColor Red
      Write-Host "Please start the Spring Boot backend first, then rerun this script." -ForegroundColor Yellow
      Write-Host "Backend command:" -ForegroundColor Yellow
      Write-Host "  cd G:\终版\springboot; .\mvnw.cmd spring-boot:run" -ForegroundColor Yellow
      Write-Host "Expected endpoint: $Endpoint" -ForegroundColor Yellow
      throw "TTS backend is not reachable: $pingUrl"
    }
  }

  $nodeVersion = (& node --version)
  $npmVersion = (& npm.cmd --version)

  $env:TRAIL_TTS_ENDPOINT = $Endpoint
  $env:TRAIL_TTS_VOICES = $Voices
  $env:TRAIL_TTS_SPEED = $Speed
  $env:TRAIL_TTS_DELAY_MS = [string]($DelaySeconds * 1000)
  $env:TRAIL_TTS_BATCH_LIMIT = [string]$BatchLimit
  $env:TRAIL_TTS_MODE = $Mode

  if ($DryRun) {
    $env:TRAIL_TTS_DRY_RUN = "1"
  } else {
    Remove-Item Env:TRAIL_TTS_DRY_RUN -ErrorAction SilentlyContinue
  }

  Write-Step "Trail voice guide complete generation"
  Write-Host "Project : $projectRoot"
  Write-Host "Endpoint: $Endpoint"
  Write-Host "Mode    : $Mode"
  Write-Host "Voices  : $Voices"
  Write-Host "Delay   : $DelaySeconds seconds per request"
  Write-Host "Limit   : $BatchLimit missing audio requests"
  Write-Host "Speed   : $Speed"
  Write-Host "Dry run : $DryRun"
  Write-Host "Node    : $nodeVersion"
  Write-Host "npm     : $npmVersion"
  Write-Host "Log     : $logPath"
  Write-Host ""
  Write-Host "Existing valid WAV files are skipped. You can stop with Ctrl+C and rerun later." -ForegroundColor Yellow
  Write-Host "Use -Mode RefreshOptimized when you want to regenerate the optimized Chinese guide text." -ForegroundColor Yellow

  Write-Step "Starting generator"
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
