@echo off
rem sync.bat — commit every change in this folder and push it to GitHub (then press Sync in the Claude Project).
cd /d "%~dp0"
git add -A
git diff --cached --quiet && (echo nothing to push & pause & exit /b 0)
set msg=%~1
if "%msg%"=="" set msg=update %date% %time%
git commit -m "%msg%"
git pull --rebase origin main
git push origin main
echo.
echo pushed. If the writing-room docs changed, press Sync in the Claude Project's GitHub knowledge.
pause
