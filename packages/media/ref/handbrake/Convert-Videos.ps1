<#
.SYNOPSIS
    Converts video files using HandBrakeCLI.

.DESCRIPTION
    This script processes video files matching a specified pattern using HandBrakeCLI with a specified preset.
    It creates output files with "-converted" added to the original filenames.

.PARAMETER InputPattern
    Glob pattern to match input video files (e.g., "C:\Videos\*.mp4").

.PARAMETER Preset
    HandBrake preset to use for conversion. Defaults to "Fast 1080p30".

.EXAMPLE
    .\Convert-Videos.ps1 -InputPattern "C:\Videos\*.mp4"
    Converts all MP4 files in C:\Videos using the default preset.

.EXAMPLE
    .\Convert-Videos.ps1 -InputPattern "C:\Videos\*.mkv" -Preset "Very Fast 720p30"
    Converts all MKV files in C:\Videos using the "Very Fast 720p30" preset.
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0, HelpMessage = "Glob pattern for input video files")]
    [ValidateNotNullOrEmpty()]
    [string]$InputPattern,
    
    [Parameter(Mandatory = $false, Position = 1, HelpMessage = "HandBrake preset to use")]
    [string]$Preset = "Fast 1080p30"
)

function Test-CommandExists {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Command
    )
    
    $exists = $null -ne (Get-Command -Name $Command -ErrorAction SilentlyContinue)
    return $exists
}

# Display script banner
Write-Host "Video Conversion Script" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Input Pattern: $InputPattern" -ForegroundColor Green
Write-Host "Using Preset: $Preset" -ForegroundColor Green
Write-Host ""

# Check if HandBrakeCLI is available
if (-not (Test-CommandExists "HandBrakeCLI")) {
    Write-Error "HandBrakeCLI is not found in PATH. Please install HandBrake CLI and ensure it's in your PATH."
    exit 1
}

# Get matching files
try {
    $files = Get-Item -Path $InputPattern -ErrorAction Stop
    $fileCount = ($files | Measure-Object).Count
    
    if ($fileCount -eq 0) {
        Write-Warning "No files found matching the pattern: $InputPattern"
        exit 0
    }
    
    Write-Host "Found $fileCount files to process." -ForegroundColor Yellow
} 
catch {
    Write-Error "Error finding files: $_"
    exit 1
}

# Process each file
$currentFile = 0
foreach ($file in $files) {
    $currentFile++
    $percentComplete = [math]::Round(($currentFile / $fileCount) * 100)
    
    # Create output filename by adding "-converted" before the extension
    $directory = [System.IO.Path]::GetDirectoryName($file.FullName)
    $filename = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $extension = [System.IO.Path]::GetExtension($file.Name)
    $outputFile = Join-Path -Path $directory -ChildPath "$filename-converted$extension"
    
    Write-Progress -Activity "Converting Videos" -Status "Processing $($file.Name)" -PercentComplete $percentComplete
    Write-Host "[$currentFile/$fileCount] Converting: $($file.Name)" -ForegroundColor Cyan
    
    try {
        # Run HandBrakeCLI
        $handbrakeArgs = @(
            "-i", "`"$($file.FullName)`"",
            "-o", "`"$outputFile`"",
            "--preset", "`"$Preset`""
        )
        
        Write-Host "  Command: HandBrakeCLI $($handbrakeArgs -join ' ')" -ForegroundColor DarkGray
        
        $process = Start-Process -FilePath "HandBrakeCLI" -ArgumentList $handbrakeArgs -NoNewWindow -PassThru -Wait
        
        if ($process.ExitCode -eq 0) {
            Write-Host "  Success: Created $outputFile" -ForegroundColor Green
        } else {
            Write-Host "  Failed: HandBrakeCLI returned exit code $($process.ExitCode)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  Error processing $($file.Name): $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Progress -Activity "Converting Videos" -Completed
Write-Host "Conversion process completed. Processed $fileCount files." -ForegroundColor Green

