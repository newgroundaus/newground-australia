# PowerShell script to start the development server
Set-Location $PSScriptRoot
Write-Host "Starting New Ground Australia website server..." -ForegroundColor Green
Write-Host ""
Write-Host "Server will be available at: http://127.0.0.1:5500" -ForegroundColor Cyan
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""

try {
    python serve.py
} catch {
    Write-Host ""
    Write-Host "ERROR: Python was not found." -ForegroundColor Red
    Write-Host "Install Python 3, then run this script again." -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
}
