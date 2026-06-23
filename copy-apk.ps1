$src = "C:\Users\Jaswanth Ch\.gemini\antigravity-ide\scratch\oilloop\android\app\build\outputs\apk\debug\app-debug.apk"
$d1 = "C:\Users\Jaswanth Ch\.gemini\antigravity-ide\scratch\oilloop\app-debug.apk"
$d2 = "C:\Users\Jaswanth Ch\.gemini\antigravity-ide\scratch\oilloop\FrytoFly.apk"
$d3 = "C:\Users\Jaswanth Ch\.gemini\antigravity-ide\brain\f146ae03-a186-4931-b565-b3ec8dcc7308\app-debug.apk"

if (Test-Path $src) {
    Copy-Item -Path $src -Destination $d1 -Force
    Copy-Item -Path $src -Destination $d2 -Force
    Copy-Item -Path $src -Destination $d3 -Force
    Write-Host "APK copied to all destinations!"
    Write-Host "  -> $d1"
    Write-Host "  -> $d2"
    Write-Host "  -> $d3"
} else {
    Write-Host "ERROR: APK not found at $src"
}
