@echo off
set "OUTPUT=%CD%\editor.out"
cd /d "%TEMP%"
echo EDITOR %~1 > "%OUTPUT%"
