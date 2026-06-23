# OilLoop Android APK Builder
# This script runs locally inside the workspace to download JDK 17, Android SDK, and compile the APK.

$ErrorActionPreference = "Stop"

# 1. Setup paths
$Workspace = "C:\Users\Jaswanth Ch\.gemini\antigravity-ide\scratch\oilloop"
$ToolsDir = "$Workspace\build-tools"
$JdkZip = "$ToolsDir\jdk17.zip"
$JdkDir = "$ToolsDir\jdk-17"
$SdkZip = "$ToolsDir\cmdline-tools.zip"
$AndroidSdkDir = "$ToolsDir\android-sdk"
$CmdLineToolsDir = "$AndroidSdkDir\cmdline-tools"

if (!(Test-Path $ToolsDir)) {
    New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null
    Write-Host "Created build-tools directory."
}

# 2. Download and extract JDK 17 if not exists
if (!(Test-Path "$JdkDir\bin\java.exe")) {
    Write-Host "Downloading OpenJDK 17..."
    $JdkUrl = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse"
    Invoke-WebRequest -Uri $JdkUrl -OutFile $JdkZip -UseBasicParsing
    
    Write-Host "Extracting OpenJDK 17..."
    Expand-Archive -Path $JdkZip -DestinationPath $ToolsDir -Force
    
    # Rename extracted folder (like jdk-17.x.x+x) to jdk-17
    $ExtractedFolder = Get-ChildItem $ToolsDir -Directory | Where-Object { $_.Name -like "jdk-17*" } | Select-Object -First 1
    if ($ExtractedFolder) {
        Rename-Item -Path $ExtractedFolder.FullName -NewName "jdk-17"
        Write-Host "JDK 17 setup complete."
    } else {
        throw "Failed to locate extracted JDK 17 folder."
    }
    Remove-Item -Path $JdkZip -Force
} else {
    Write-Host "JDK 17 is already installed."
}

# 3. Download and extract Android Command Line Tools if not exists
$SdkManagerPath = "$CmdLineToolsDir\latest\bin\sdkmanager.bat"
if (!(Test-Path $SdkManagerPath)) {
    Write-Host "Downloading Android SDK Command-line Tools..."
    $SdkUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    Invoke-WebRequest -Uri $SdkUrl -OutFile $SdkZip -UseBasicParsing
    
    Write-Host "Extracting Android SDK Command-line Tools..."
    # Extract to a temp folder first
    $TempExtract = "$ToolsDir\temp-sdk"
    if (Test-Path $TempExtract) { Remove-Item -Path $TempExtract -Recurse -Force }
    New-Item -ItemType Directory -Path $TempExtract | Out-Null
    Expand-Archive -Path $SdkZip -DestinationPath $TempExtract -Force
    
    # Structure correctly: android-sdk/cmdline-tools/latest
    if (!(Test-Path "$CmdLineToolsDir\latest")) {
        New-Item -ItemType Directory -Path "$CmdLineToolsDir\latest" -Force | Out-Null
    }
    
    # Copy from temp-sdk/cmdline-tools to cmdline-tools/latest
    Copy-Item -Path "$TempExtract\cmdline-tools\*" -Destination "$CmdLineToolsDir\latest" -Recurse -Force
    
    Write-Host "Android Command-line Tools setup complete."
    Remove-Item -Path $SdkZip -Force
    Remove-Item -Path $TempExtract -Recurse -Force
} else {
    Write-Host "Android Command-line Tools are already installed."
}

# 4. Set environment variables for this process
$env:JAVA_HOME = $JdkDir
$env:ANDROID_HOME = $AndroidSdkDir
$env:PATH = "$JdkDir\bin;$CmdLineToolsDir\latest\bin;$AndroidSdkDir\platform-tools;$env:PATH"

Write-Host "Java version:"
java -version

# 5. Accept Android SDK licenses and install build tools
Write-Host "Accepting Android SDK licenses..."
# Pipes 'y' to accept licenses
$LicenseFile = "$AndroidSdkDir\licenses\android-sdk-license"
if (!(Test-Path $LicenseFile)) {
    $ProcessInfo = New-Object System.Diagnostics.ProcessStartInfo
    $ProcessInfo.FileName = "cmd.exe"
    $ProcessInfo.Arguments = "/c echo y | sdkmanager --licenses"
    $ProcessInfo.UseShellExecute = $false
    $ProcessInfo.RedirectStandardInput = $true
    $Process = [System.Diagnostics.Process]::Start($ProcessInfo)
    $Process.WaitForExit()
}

Write-Host "Installing Android SDK Platform 34 and Build Tools..."
# We install platform 34 and 35 just in case, and 36 if available
sdkmanager --update
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" "platforms;android-35" "build-tools;35.0.0" "platforms;android-36" "build-tools;36.0.0"

# 6. Run Capacitor Sync
Write-Host "Building web assets and syncing with Capacitor..."
Set-Location -Path $Workspace
npm.cmd run build
npx.cmd cap sync android
    # Also patch Capacitor module's build.gradle to use Java 17
    $CapacitorModuleGradle = "$Workspace\node_modules\@capacitor\android\capacitor\build.gradle"
    if (Test-Path $CapacitorModuleGradle) {
        (Get-Content $CapacitorModuleGradle) -replace 'VERSION_21', 'VERSION_17' | Set-Content $CapacitorModuleGradle
        Write-Host "Patched Capacitor module's build.gradle to use Java 17."
    } else {
        Write-Host "Warning: Capacitor module build.gradle not found at $CapacitorModuleGradle"
    }
    $CapacitorGradle = "$Workspace\android\app\capacitor.build.gradle"
    if (Test-Path $CapacitorGradle) {
        (Get-Content $CapacitorGradle) -replace 'VERSION_21', 'VERSION_17' | Set-Content $CapacitorGradle
        Write-Host "Patched capacitor.build.gradle to use Java 17."
    } else {
        Write-Host "Warning: capacitor.build.gradle not found at $CapacitorGradle"
    }

# 7. Compile the Android App using Gradle wrapper
Write-Host "Compiling debug APK with Gradle..."
Set-Location -Path "$Workspace\android"

# Run clean and assembleDebug
.\gradlew.bat --no-daemon clean
.\gradlew.bat --no-daemon assembleDebug

# 8. Copy APK file to outputs
$ApkSource = "$Workspace\android\app\build\outputs\apk\debug\app-debug.apk"
$ApkDestWorkspace = "$Workspace\app-debug.apk"
$ApkDestFrytoFly = "$Workspace\FrytoFly.apk"
$ApkDestArtifacts = "C:\Users\Jaswanth Ch\.gemini\antigravity-ide\brain\ac94c1e0-2d95-4eef-b05b-dd7f3c99b97e\FrytoFly.apk"

if (Test-Path $ApkSource) {
    Copy-Item -Path $ApkSource -Destination $ApkDestWorkspace -Force
    Copy-Item -Path $ApkSource -Destination $ApkDestFrytoFly -Force
    Copy-Item -Path $ApkSource -Destination $ApkDestArtifacts -Force
    Write-Host "--------------------------------------------------------"
    Write-Host "SUCCESS: APK file built successfully!"
    Write-Host "Workspace APK: $ApkDestWorkspace"
    Write-Host "Workspace FrytoFly APK: $ApkDestFrytoFly"
    Write-Host "Artifacts APK (downloadable): $ApkDestArtifacts"
    Write-Host "--------------------------------------------------------"
} else {
    throw "Gradle build succeeded but APK file was not found at $ApkSource!"
}
