$Workspace = "C:\Users\Jaswanth Ch\.gemini\antigravity-ide\scratch\oilloop"

$f1 = Join-Path $Workspace "node_modules\@capacitor\android\capacitor\build.gradle"
if (Test-Path $f1) {
    (Get-Content $f1) -replace 'VERSION_21', 'VERSION_17' | Set-Content $f1
    Write-Host "Patched Capacitor module build.gradle"
} else {
    Write-Host "Capacitor module build.gradle not found"
}

$f2 = Join-Path $Workspace "android\app\capacitor.build.gradle"
if (Test-Path $f2) {
    (Get-Content $f2) -replace 'VERSION_21', 'VERSION_17' | Set-Content $f2
    Write-Host "Patched capacitor.build.gradle"
} else {
    Write-Host "capacitor.build.gradle not found"
}
