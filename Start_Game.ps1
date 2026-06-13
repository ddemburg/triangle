# Find the local active IPv4 address (WiFi or Ethernet preferred)
$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias *WiFi*, *Ethernet* -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress

if (!$ip) {
    # Fallback to any active non-loopback IPv4 address
    $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress
}

if (!$ip) {
    # Final fallback if offline
    $ip = "localhost"
}

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  מריץ את משחק חפיפת המשולשים של עמית..." -ForegroundColor Cyan
Write-Host "  כתובת ה-IP המקומית שזוהתה: $ip" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan

# Check if Python is installed
$hasPython = Get-Command python -ErrorAction SilentlyContinue

if ($hasPython) {
    Write-Host "מפעיל שרת מקומי באמצעות Python בפורט 8000..." -ForegroundColor Yellow
    # Start python server in a hidden background job
    Start-Job -ScriptBlock { python -m http.server 8000 } | Out-Null
} else {
    # Check if Node/npx is installed
    $hasNpx = Get-Command npx -ErrorAction SilentlyContinue
    if ($hasNpx) {
        Write-Host "מפעיל שרת מקומי באמצעות Node/npx בפורט 8000..." -ForegroundColor Yellow
        Start-Job -ScriptBlock { npx http-server -p 8000 } | Out-Null
    } else {
        Write-Host "שגיאה: לא נמצאו Python או Node.js מותקנים במחשב." -ForegroundColor Red
        Write-Host "לא ניתן להריץ שרת שיתוף מקומי. פותח את קובץ המשחק ישירות (שים לב: קוד ה-QR לא יוצג)." -ForegroundColor LightYellow
        Start-Process "index.html"
        exit
    }
}

# Wait a brief moment for the server to spin up
Start-Sleep -Seconds 1

# Open the browser with the local IP parameter so game.js can generate the QR code
$url = "http://localhost:8000/?ip=$ip"
Write-Host "פותח את המשחק בדפדפן בכתובת: $url" -ForegroundColor Green
Write-Host "סרוק את קוד ה-QR שיופיע על המסך באמצעות הטלפון כדי לשחק!" -ForegroundColor Green
Write-Host "כדי לסגור את השרת, פשוט סגור את חלון המסוף הזה." -ForegroundColor Gray
Write-Host "=============================================" -ForegroundColor Cyan

Start-Process $url

# Keep console open so the server process continues running
while ($true) {
    Start-Sleep -Seconds 60
}

