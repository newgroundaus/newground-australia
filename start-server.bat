@echo off
cd /d "%~dp0"
echo Starting New Ground Australia website server...
echo.
echo Server will be available at: http://127.0.0.1:5500
echo Press CTRL+C to stop the server
echo.
python serve.py
if errorlevel 1 (
    echo.
    echo ERROR: Python was not found. Install Python 3 and try again.
    pause
)
