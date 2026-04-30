@echo off
title Ferabot — Atualizando sistema
cd /d "%~dp0"
echo.
echo  ============================================================
echo   FERABOT — Atualizando para a versao mais recente
echo  ============================================================
echo.

REM Verifica se Git esta instalado
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ATENCAO: Git nao encontrado.
    echo  Instale o Git em: https://git-scm.com/download/win
    echo  Depois execute este arquivo novamente.
    echo.
    pause
    exit /b 1
)

REM Verifica se e um repositorio git
git rev-parse --git-dir >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ATENCAO: Esta pasta nao e um repositorio Git.
    echo  O Ferabot precisa ter sido instalado via "git clone".
    echo  Contate o suporte para reinstalar corretamente.
    echo.
    pause
    exit /b 1
)

echo  Baixando atualizacoes...
git pull
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  Nao foi possivel baixar as atualizacoes.
    echo  Verifique sua conexao com a internet e tente novamente.
    echo.
    pause
    exit /b 1
)

echo.
echo  Reinstalando as skills atualizadas...
python SetupFera/setup_skills.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  Erro ao reinstalar as skills.
    echo  Tente rodar manualmente: python SetupFera/setup_skills.py
    echo.
    pause
    exit /b 1
)

echo.
echo  ============================================================
echo   FERABOT ATUALIZADO COM SUCESSO!
echo  ============================================================
echo.
echo  Abra o ABRIR_FERABOT.bat para comecar a usar.
echo.
pause
