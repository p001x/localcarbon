@echo off
title LCRI Dashboard Start Portal
color 0A

:MENU
cls
echo =======================================================
echo        LOCAL CARBON RETURN INDEX (LCRI) PORTAL
echo =======================================================
echo.
echo Welcome! You can manually start the different parts of 
echo the LCRI Dashboard from this portal.
echo.
echo [1] Start React Frontend ^& Flask Backend (Final App)
echo [2] Start Streamlit Dashboard (Legacy Prototype)
echo [3] Start Flask Backend ONLY (API Server)
echo [4] Start React Frontend ONLY (Vite UI)
echo [5] Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto REACT_FLASK
if "%choice%"=="2" goto STREAMLIT
if "%choice%"=="3" goto FLASK
if "%choice%"=="4" goto VITE
if "%choice%"=="5" goto EXIT

echo Invalid choice. Please try again.
pause
goto MENU

:REACT_FLASK
echo Starting Flask Backend...
start cmd /k "C:\Users\user\miniconda3\Scripts\activate.bat && python server.py"
echo Starting React Frontend...
cd frontend
start cmd /k "npm run dev"
cd ..
goto MENU

:STREAMLIT
echo Starting Streamlit App...
start cmd /k "C:\Users\user\miniconda3\Scripts\activate.bat && python -m streamlit run streamlit_app.py"
goto MENU

:FLASK
echo Starting Flask Backend...
start cmd /k "C:\Users\user\miniconda3\Scripts\activate.bat && python server.py"
goto MENU

:VITE
echo Starting React Frontend...
cd frontend
start cmd /k "npm run dev"
cd ..
goto MENU

:EXIT
exit
