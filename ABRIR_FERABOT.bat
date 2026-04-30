@echo off
title Ferabot — Abrindo Claude Code
cd /d "%~dp0"
echo.
echo  Abrindo o Ferabot no Claude Code...
echo  Aguarde alguns segundos.
echo.

where claude >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ATENCAO: Claude Code nao encontrado no seu computador.
    echo.
    echo  Instale o Claude Code em: https://claude.ai/code
    echo  Depois rode este arquivo novamente.
    echo.
    pause
    exit /b 1
)

claude .
