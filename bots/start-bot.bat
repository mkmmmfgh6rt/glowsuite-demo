@echo off
title WhatsApp Bot - Beauty Lounge
color 0a

echo =====================================
echo 🚀 Starte WhatsApp Bot (Auto-Restart)
echo =====================================
echo.

:loop
echo [INFO] Bot wird gestartet...
echo.

:: Umgebungsvariablen setzen
set WHATSAPP_TEST=false
set PUPPETEER_HEADLESS=false

:: Node.js Server starten
node server.js

echo.
echo ❌ Bot wurde beendet oder ist abgestürzt.
echo 🔄 Neustart in 5 Sekunden...
timeout /t 5 /nobreak >nul

goto loop