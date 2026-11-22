@echo off
chcp 65001 > nul
title «Эстетика & Сервис» (React 18)
echo ====================================================
echo  Запуск проекта «Эстетика & Сервис» (React 18)...
echo ====================================================
cd /d "%~dp0"
timeout /t 1 > nul
start http://localhost:3000
node index.js
pause
