@echo off
echo Starting New Ground Australia website server...
echo.
echo Server will be available at: http://localhost:5500
echo Press CTRL+C to stop the server
echo.

REM Try Python first (usually available on Windows)
python -m http.server 5500 2>nul
if errorlevel 1 (
    echo Python not found. Trying Node.js...
    npx http-server -p 5500 -o
    if errorlevel 1 (
        echo.
        echo ERROR: Neither Python nor Node.js found.
        echo Please install Python 3 or Node.js to run the server.
        echo.
        pause
    )
)
