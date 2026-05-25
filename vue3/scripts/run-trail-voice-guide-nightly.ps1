param(
  [int]$DelaySeconds = 60,
  [int]$BatchLimit = 999,
  [string]$Voices = "default,zh_female,sweet",
  [string]$Endpoint = "http://localhost:8800/api/tts/speech",
  [string]$Speed = "1.0"
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$repoRoot = Resolve-Path (Join-Path $projectRoot "..")
$backendRoot = Join-Path $repoRoot "springboot"
$backendJar = Join-Path $backendRoot "target\springboot-0.0.1-SNAPSHOT.jar"
$logDir = Join-Path $projectRoot "logs\voice-guide"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$nightlyLog = Join-Path $logDir "trail-voice-guide-nightly-$timestamp.log"
$generatorLog = Join-Path $logDir "trail-voice-guide-generator-$timestamp.log"
$frontendLog = Join-Path $logDir "frontend-nightly-$timestamp.log"
$backendLog = Join-Path $logDir "backend-nightly-$timestamp.log"
$backendErrLog = Join-Path $logDir "backend-nightly-$timestamp.err.log"

function Write-Log {
  param([string]$Message)
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
  Write-Host $line
  Add-Content -LiteralPath $nightlyLog -Value $line -Encoding UTF8
}

function Test-PortListening {
  param([int]$Port)
  $pattern = ":$Port\s+.*LISTENING"
  return [bool](netstat -ano | Select-String -Pattern $pattern)
}

function Wait-Port {
  param(
    [int]$Port,
    [string]$Name,
    [int]$TimeoutSeconds = 180
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortListening $Port) {
      Write-Log "$Name is listening on port $Port."
      return
    }
    Start-Sleep -Seconds 3
  }

  throw "$Name did not start on port $Port within $TimeoutSeconds seconds."
}

$backendJob = $null
$frontendJob = $null

try {
  Write-Log "Nightly trail voice guide generation started."
  Write-Log "Project: $projectRoot"
  Write-Log "Voices: $Voices"
  Write-Log "Delay: $DelaySeconds seconds per missing audio request"
  Write-Log "Batch limit: $BatchLimit"
  Write-Log "Endpoint: $Endpoint"
  Write-Log "Nightly log: $nightlyLog"
  Write-Log "Generator log: $generatorLog"

  if (-not (Test-PortListening 8889)) {
    Write-Log "Starting backend..."
    $backendJob = Start-Job -Name "trail-guide-backend" -ScriptBlock {
      param($Root, $Jar, $OutLog, $ErrLog)
      Set-Location $Root
      & "C:\Program Files\Java\jdk-21\bin\java.exe" -jar $Jar 1>> $OutLog 2>> $ErrLog
    } -ArgumentList $backendRoot, $backendJar, $backendLog, $backendErrLog
  } else {
    Write-Log "Backend already listening on port 8889."
  }
  Wait-Port -Port 8889 -Name "Backend"

  if (-not (Test-PortListening 8800)) {
    Write-Log "Starting frontend..."
    $frontendJob = Start-Job -Name "trail-guide-frontend" -ScriptBlock {
      param($Root, $OutLog)
      Set-Location $Root
      & npm.cmd run dev 2>&1 | Tee-Object -FilePath $OutLog
    } -ArgumentList $projectRoot, $frontendLog
  } else {
    Write-Log "Frontend already listening on port 8800."
  }
  Wait-Port -Port 8800 -Name "Frontend"

  Set-Location $projectRoot
  $env:TRAIL_TTS_ENDPOINT = $Endpoint
  $env:TRAIL_TTS_VOICES = $Voices
  $env:TRAIL_TTS_SPEED = $Speed
  $env:TRAIL_TTS_DELAY_MS = [string]($DelaySeconds * 1000)
  $env:TRAIL_TTS_BATCH_LIMIT = [string]$BatchLimit
  Remove-Item Env:TRAIL_TTS_DRY_RUN -ErrorAction SilentlyContinue

  Write-Log "Running generator..."
  & npm.cmd run voice-guide:generate 2>&1 | Tee-Object -FilePath $generatorLog
  $exitCode = $LASTEXITCODE

  Write-Log "Generator exit code: $exitCode"
  if ($exitCode -ne 0) {
    throw "Generator failed with exit code $exitCode."
  }

  Write-Log "Nightly trail voice guide generation finished."
} catch {
  Write-Log "FAILED: $($_.Exception.Message)"
  throw
} finally {
  if ($frontendJob) {
    Write-Log "Stopping frontend job..."
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -Force -ErrorAction SilentlyContinue
  }
  if ($backendJob) {
    Write-Log "Stopping backend job..."
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -Force -ErrorAction SilentlyContinue
  }
  Write-Log "Nightly script ended."
}
