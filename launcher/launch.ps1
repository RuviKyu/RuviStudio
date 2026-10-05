# RUVI Conductor SPECIAL - launcher (Windows PowerShell 5.1+ / PowerShell 7)
# Idempotent: every check is skipped when the piece is already there; a second click just launches.
$ErrorActionPreference = "Stop"
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
$Root    = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Runtime = Join-Path $Root "runtime"
New-Item -ItemType Directory -Force -Path $Runtime | Out-Null
function Step($m) { Write-Host ""; Write-Host ("== " + $m) -ForegroundColor Cyan }
function Say($m)  { Write-Host ("   " + $m) }
function Warn($m) { Write-Host ("   ! " + $m) -ForegroundColor Yellow }
function Download($url, $dest) { Say ("downloading " + $url); Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing }
function Find-Exe($name) { $c = Get-Command $name -ErrorAction SilentlyContinue; if ($c) { return $c.Source }; return $null }
function Newest($dir, $filter) { if (-not (Test-Path $dir)) { return $null }; $f = Get-ChildItem -Path $dir -Filter $filter -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1; if ($f) { return $f.FullName }; return $null }

Write-Host "Ruvi Studio launcher" -ForegroundColor Green
Say ("app folder: " + $Root)

# ---------- Node.js 18+ (portable copy if the machine has none) ----------
Step "Node.js"
$node = Newest (Join-Path $Runtime "node") "node.exe"
if (-not $node) {
    $sys = Find-Exe "node"
    if ($sys) { $v = ((& $sys --version) -replace "v", "").Split(".")[0]; if ([int]$v -ge 18) { $node = $sys } else { Warn ("system Node is v" + $v + " - need 18+") } }
}
if (-not $node) {
    Say "not found - fetching a portable Node.js LTS (about 30 MB)"
    $index = Invoke-RestMethod -Uri "https://nodejs.org/dist/index.json" -UseBasicParsing
    $lts = $index | Where-Object { $_.lts -is [string] } | Select-Object -First 1
    $ver = $lts.version
    $zip = Join-Path $Runtime "node.zip"
    Download ("https://nodejs.org/dist/" + $ver + "/node-" + $ver + "-win-x64.zip") $zip
    Expand-Archive -Path $zip -DestinationPath (Join-Path $Runtime "node") -Force
    Remove-Item $zip -Force
    $node = Newest (Join-Path $Runtime "node") "node.exe"
    if (-not $node) { throw "portable Node.js did not unpack" }
}
$nodeDir = Split-Path -Parent $node
$env:Path = $nodeDir + ";" + $env:Path
Say ("node " + (& $node --version) + "  -> " + $node)

# ---------- the renderer package (puppeteer-core) ----------
Step "renderer package (npm install, once)"
if (Test-Path (Join-Path $Root "node_modules\puppeteer-core\package.json")) { Say "puppeteer-core present" }
else {
    $npm = Join-Path $nodeDir "npm.cmd"; if (-not (Test-Path $npm)) { $npm = Find-Exe "npm" }
    if (-not $npm) { throw "npm not found next to node" }
    Push-Location $Root
    try { & $npm install --omit=dev --no-audit --no-fund --loglevel=error } finally { Pop-Location }
    if (-not (Test-Path (Join-Path $Root "node_modules\puppeteer-core\package.json"))) { throw "npm install did not produce node_modules\puppeteer-core" }
    Say "installed"
}

# ---------- ffmpeg / ffprobe (static build into .\runtime\ffmpeg when the machine has none) ----------
Step "ffmpeg"
$ff = Newest (Join-Path $Runtime "ffmpeg") "ffmpeg.exe"; $fp = Newest (Join-Path $Runtime "ffmpeg") "ffprobe.exe"
if (-not $ff) { $ff = Find-Exe "ffmpeg"; $fp = Find-Exe "ffprobe" }
if (-not $ff -or -not $fp) { try {
    Say "not found - fetching a static build (BtbN FFmpeg-Builds, about 90 MB)"
    $zip = Join-Path $Runtime "ffmpeg.zip"; $tmp = Join-Path $Runtime "ffmpeg_tmp"
    Download "https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip" $zip
    if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
    Expand-Archive -Path $zip -DestinationPath $tmp -Force
    $exe = Newest $tmp "ffmpeg.exe"; if (-not $exe) { throw "ffmpeg.exe not in the archive" }
    $dst = Join-Path $Runtime "ffmpeg"; New-Item -ItemType Directory -Force -Path $dst | Out-Null
    Copy-Item (Join-Path (Split-Path -Parent $exe) "ffmpeg.exe")  (Join-Path $dst "ffmpeg.exe")  -Force
    Copy-Item (Join-Path (Split-Path -Parent $exe) "ffprobe.exe") (Join-Path $dst "ffprobe.exe") -Force
    Remove-Item $tmp -Recurse -Force; Remove-Item $zip -Force
    $ff = Join-Path $dst "ffmpeg.exe"; $fp = Join-Path $dst "ffprobe.exe"
} catch { Warn ("ffmpeg download failed here (" + $_.Exception.Message + ") - the app fetches it itself at startup") } }
if ($ff) { Say ("ffmpeg  -> " + $ff) }

# ---------- Chrome / Edge (Chrome for Testing into .\runtime\chrome when neither exists) ----------
Step "Chrome / Edge"
$chrome = Newest (Join-Path $Runtime "chrome") "chrome.exe"
if (-not $chrome) {
    $cands = @(
        (Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"),
        (Join-Path ${env:ProgramFiles(x86)} "Google\Chrome\Application\chrome.exe"),
        (Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe"),
        (Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe"),
        (Join-Path $env:ProgramFiles "Microsoft\Edge\Application\msedge.exe"))
    foreach ($c in $cands) { if ($c -and (Test-Path $c)) { $chrome = $c; break } }
}
if (-not $chrome) { try {
    Say "no Chrome or Edge - fetching Chrome for Testing (about 150 MB)"
    $npx = Join-Path $nodeDir "npx.cmd"; if (-not (Test-Path $npx)) { $npx = Find-Exe "npx" }
    & $npx --yes --package=@puppeteer/browsers browsers install chrome@stable --path (Join-Path $Runtime "chrome") | Out-Host
    $chrome = Newest (Join-Path $Runtime "chrome") "chrome.exe"
    if (-not $chrome) { throw "Chrome for Testing did not install" }
} catch { Warn ("browser download failed here (" + $_.Exception.Message + ") - the app fetches it itself at startup") } }
if ($chrome) { Say ("browser -> " + $chrome) }

# ---------- fonts: nothing is installed into Windows; the app fetches Pirata One and Cinzel into runtime\fonts at startup and the renderer reads them there (Algerian is read from Windows\Fonts) ----------
Step "fonts"
Say "self-contained: fetched by the app into runtime\fonts on first start"

# ---------- whisper (needed only for the Trello grab's word timings) ----------
Step "whisper-ctranslate2"
if (Find-Exe "whisper-ctranslate2") { Say "present on PATH" } else { Say "the app builds its own runtime at startup (uv, Python 3.11, whisper-ctranslate2, CUDA 12 libs on NVIDIA) under <base>\_RUNTIME\python" }

# ---------- write the paths into studio.config.json ----------
Step "config"
$port = (& $node (Join-Path $Root "tools\setup.js") "--ffmpeg" $ff "--ffprobe" $fp "--chrome" $chrome).Trim()
if (-not $port) { $port = "4710" }
Say ("studio.config.json updated - port " + $port)

# ---------- launch the server (its own window) and open the UI ----------
Step "launch"
function Port-Open($p) { try { $c = New-Object Net.Sockets.TcpClient; $c.Connect("127.0.0.1", [int]$p); $c.Close(); return $true } catch { return $false } }
if (Port-Open $port) { Say "server already running" }
else {
    Start-Process -FilePath $node -ArgumentList ('"' + (Join-Path $Root "studio.js") + '"') -WorkingDirectory $Root -WindowStyle Normal
    $tries = 0; while (-not (Port-Open $port) -and $tries -lt 40) { Start-Sleep -Milliseconds 500; $tries++ }
    if (-not (Port-Open $port)) { throw "the server did not come up on port $port - look at the Ruvi Studio window" }
    Say "server started"
}
Start-Process ("http://localhost:" + $port)
Write-Host ""
Write-Host ("Ruvi Studio is running at http://localhost:" + $port + "  (close the black server window to stop it)") -ForegroundColor Green
Start-Sleep -Seconds 3
