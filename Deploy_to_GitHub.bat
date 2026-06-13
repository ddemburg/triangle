@echo off
chcp 65001 > nul
title Deploying to GitHub Pages
cls
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Deploy_to_GitHub.ps1"
echo.
echo Press any key to close this window...
pause > nul
