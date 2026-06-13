@echo off
chcp 65001 > nul
title משחק חפיפת משולשים - שיתוף לנייד
cls
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start_Game.ps1"
pause
