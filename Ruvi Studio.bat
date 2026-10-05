@echo off
title Ruvi Studio
rem ------------------------------------------------------------------
rem  RUVI Conductor SPECIAL - one-click launcher (Windows)
rem  Checks Node.js, ffmpeg, Chrome/Edge, the renderer package and the
rem  fonts; downloads what is missing into .\runtime\; starts the
rem  server in its own window; opens http://localhost:4710
rem ------------------------------------------------------------------
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0launcher\launch.ps1"
if errorlevel 1 (
  echo.
  echo Something did not go through - read the messages above.
  pause
)
