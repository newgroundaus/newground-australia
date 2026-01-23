# PowerShell script to start the development server
Write-Host "Starting New Ground Australia website server..." -ForegroundColor Green
Write-Host ""
Write-Host "Server will be available at: http://localhost:5500" -ForegroundColor Cyan
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Try Python first
try {
    python -m http.server 5500
} catch {
    Write-Host "Python not found. Trying Node.js..." -ForegroundColor Yellow
    try {
        npx http-server -p 5500 -o
    } catch {
        Write-Host ""
        Write-Host "ERROR: Neither Python nor Node.js found." -ForegroundColor Red
        Write-Host "Please install Python 3 or Node.js to run the server." -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
    }
}
