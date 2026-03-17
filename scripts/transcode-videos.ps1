param(
    [string]$VideoDir = "static/videos",
    [string]$Pattern = "*.mp4",
    [switch]$ReencodeAll
)

$ErrorActionPreference = "Stop"

function Get-FFmpegPath {
    $cmd = Get-Command ffmpeg -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }

    $wingetBase = Join-Path $env:LOCALAPPDATA "Microsoft/WinGet/Packages"
    if (Test-Path $wingetBase) {
        $pkg = Get-ChildItem $wingetBase -Directory |
            Where-Object { $_.Name -match "FFmpeg|Gyan" } |
            Select-Object -First 1

        if ($pkg) {
            $ffmpeg = Get-ChildItem $pkg.FullName -Recurse -Filter "ffmpeg.exe" -ErrorAction SilentlyContinue |
                Select-Object -First 1
            if ($ffmpeg) {
                return $ffmpeg.FullName
            }
        }
    }

    throw "ffmpeg not found. Install with: winget install --id Gyan.FFmpeg"
}

function Resolve-VideoDir([string]$inputDir) {
    if ([System.IO.Path]::IsPathRooted($inputDir)) {
        return $inputDir
    }
    return Join-Path (Get-Location) $inputDir
}

$ffmpegPath = Get-FFmpegPath
$resolvedVideoDir = Resolve-VideoDir $VideoDir

if (-not (Test-Path $resolvedVideoDir)) {
    throw "Video directory does not exist: $resolvedVideoDir"
}

$sourceFiles = Get-ChildItem $resolvedVideoDir -File -Filter $Pattern |
    Where-Object {
        if ($ReencodeAll) {
            return $true
        }
        return $_.Name -notlike "*_web.mp4"
    }

if (-not $sourceFiles) {
    Write-Host "No matching source videos found in $resolvedVideoDir"
    exit 0
}

[int]$converted = 0
[int]$skipped = 0

foreach ($src in $sourceFiles) {
    $outPath = Join-Path $resolvedVideoDir ($src.BaseName + "_web.mp4")

    if ((-not $ReencodeAll) -and (Test-Path $outPath)) {
        $outInfo = Get-Item $outPath
        if ($outInfo.LastWriteTimeUtc -ge $src.LastWriteTimeUtc) {
            $skipped++
            Write-Host "Skip up-to-date: $($src.Name)"
            continue
        }
    }

    Write-Host "Transcoding: $($src.Name)"

    & $ffmpegPath -y -i $src.FullName `
        -c:v libx264 `
        -profile:v high `
        -level 4.1 `
        -pix_fmt yuv420p `
        -movflags +faststart `
        -an `
        $outPath | Out-Null

    $converted++
}

Write-Host "Done. Converted: $converted, Skipped: $skipped, Directory: $resolvedVideoDir"
