@echo off
set "OUTPUT=%CD%\visual.out"
cd /d "%TEMP%"
echo VISUAL %~1 > "%OUTPUT%"
