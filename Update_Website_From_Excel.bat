@echo off
setlocal EnableExtensions
chcp 65001 >nul

cd /d "%~dp0"

title Update Cost Center Website from Excel

echo ============================================================
echo تحديث موقع دليل مراكز التكلفة من Excel
echo ============================================================
echo.

where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python is not installed or not available in PATH.
    echo.
    pause
    exit /b 1
)

where git >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Git is not installed or not available in PATH.
    echo.
    pause
    exit /b 1
)

python -c "import openpyxl" >nul 2>nul
if errorlevel 1 (
    echo Installing required openpyxl library...
    python -m pip install openpyxl

    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install openpyxl.
        pause
        exit /b 1
    )
)

echo Starting Excel update...
echo.

python update_from_excel.py

if errorlevel 1 (
    echo.
    echo ============================================================
    echo فشلت عملية التحديث. لم يتم رفع البيانات إلى GitHub.
    echo ============================================================
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo تم تحديث JSON ورفعه إلى GitHub بنجاح
echo ============================================================
echo.
echo Published website:
echo https://ahmed-fudail.github.io/-1/
echo.
pause
exit /b 0