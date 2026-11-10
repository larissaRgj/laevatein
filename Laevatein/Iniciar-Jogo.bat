@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if not errorlevel 1 (
    node ".\js\local-server.js"
    goto fim
)

where py >nul 2>nul
if not errorlevel 1 (
    start "Laevatein - servidor local" /min py -3 -m http.server 8765 --bind 127.0.0.1
    timeout /t 2 /nobreak >nul
    start "" "http://127.0.0.1:8765/"
    goto fim
)

echo Node.js nao foi encontrado.
echo Instale Node.js ou abra a pasta com a extensao Live Server do VS Code.
echo Depois abra http://localhost:5500/index.html
pause

:fim
endlocal
