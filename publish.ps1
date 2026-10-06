# publish.ps1 - publish this folder to an EMPTY GitHub repository (run once, from the app folder).
#   1. On github.com: New repository -> name it (e.g. RuviStudio), Private, NO README / .gitignore / license -> Create.
#   2. powershell -ExecutionPolicy Bypass -File .\publish.ps1 -RepoUrl https://github.com/<you>/RuviStudio.git
#   Git for Windows must be installed (https://git-scm.com); the first push opens GitHub's sign-in window.
param([string]$RepoUrl = "", [string]$Branch = "main")
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Host "git is not installed - install Git for Windows first: https://git-scm.com/download/win"; exit 1 }
if ($RepoUrl -eq "") { $RepoUrl = Read-Host "Paste the empty repository URL (https://github.com/<you>/RuviStudio.git)" }
if (-not (Test-Path ".git")) { git init -b $Branch | Out-Null } else { git checkout -B $Branch | Out-Null }
if (-not (git config user.name))  { git config user.name  (Read-Host "Your name for commits") }
if (-not (git config user.email)) { git config user.email (Read-Host "Your e-mail for commits") }
git add -A
if (git status --porcelain) { git commit -m "Ruvi Studio 3.12 + writing room r18" | Out-Null }
if (git remote | Select-String -Quiet "^origin$") { git remote set-url origin $RepoUrl } else { git remote add origin $RepoUrl }
git push -u origin $Branch
Write-Host ""
Write-Host "Published. Next: in the Claude Project -> knowledge -> GitHub -> pick this repo -> folder writing-room/ -> Sync."
Write-Host "Later changes: double-click sync.bat (commit + push), then press Sync in the Project."
