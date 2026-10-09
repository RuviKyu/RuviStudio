@echo off
rem update.bat - apply an update zip from the writing room in one click:
rem   unzip it over this folder, commit the change and push it to GitHub.
rem   Double-click: uses the newest RuviStudio_*_update.zip found next to this folder
rem   (D:\RuviStudio_repo\) or in your Downloads folder. Or drag a zip onto this file.
setlocal
cd /d "%~dp0"
set "zip=%~1"
if "%zip%"=="" (
  for /f "delims=" %%f in ('powershell -NoProfile -Command "Get-ChildItem -Path '..','%USERPROFILE%\Downloads' -Filter 'RuviStudio_*_update.zip' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName"') do set "zip=%%f"
)
if "%zip%"=="" (
  echo no RuviStudio_*_update.zip found next to this folder or in Downloads - drag the zip onto update.bat
  pause
  exit /b 1
)
echo applying: %zip%
powershell -NoProfile -Command "Expand-Archive -LiteralPath '%zip%' -DestinationPath '%~dp0' -Force"
if errorlevel 1 (
  echo extraction failed
  pause
  exit /b 1
)
for /f "tokens=2 delims=:," %%v in ('findstr /c:"\"version\"" package.json') do echo now at version %%v
if not exist ".git" (
  echo applied. (no git repository here - nothing pushed)
  pause
  exit /b 0
)
git add -A
git diff --cached --quiet && (echo applied - nothing new to push & pause & exit /b 0)
git commit -m "update: %~nx1 %zip:~-24%"
git pull --rebase origin main 2>nul
git push origin main
echo.
echo done - restart Ruvi Studio to load the new version. If writing-room files changed, press Sync in the Claude Project.
pause
