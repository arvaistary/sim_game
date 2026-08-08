#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Deterministic Section-A integrity check for ui-plan.md.

.DESCRIPTION
    Validates internal UI plan references: screen sections, state references,
    interaction test coverage, non-empty Source columns, unresolved clarification
    markers, and duplicate state definitions. Semantic checks remain with the
    agent and /speckit.analyze.
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0, Mandatory = $true)]
    [string]$File,

    [switch]$Json
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -Path $File -PathType Leaf)) {
    Write-Error "file not found: $File"
    exit 2
}

$content = Get-Content -Path $File -Raw
$lines = $content -split "`r?`n"
$errors = [System.Collections.Generic.List[string]]::new()

function Get-Ids {
    param([string]$Pattern)
    return [regex]::Matches($content, $Pattern) |
        ForEach-Object { $_.Value } |
        Sort-Object -Unique
}

function Get-SectionText {
    param([string]$HeadingText)

    $sectionLines = [System.Collections.Generic.List[string]]::new()
    $on = $false
    $startLevel = 0
    $escapedHeading = [regex]::Escape($HeadingText)

    foreach ($line in $lines) {
        if ($line -match '^(#+) ') {
            $level = $matches[1].Length
            if ($on -and $level -le $startLevel) {
                $on = $false
            }
            if (-not $on -and $line -match "^#+ .*$escapedHeading") {
                $on = $true
                $startLevel = $level
            }
        }
        if ($on) {
            [void]$sectionLines.Add($line)
        }
    }

    return ($sectionLines -join "`n")
}

function Add-Error {
    param([string]$Message)
    [void]$errors.Add($Message)
}

$overviewText = Get-SectionText 'Screen Overview'
$overviewScrs = [regex]::Matches($overviewText, 'SCR-[0-9]{3}') |
    ForEach-Object { $_.Value } |
    Sort-Object -Unique

foreach ($scr in $overviewScrs) {
    if ($content -notmatch "(?m)^## $([regex]::Escape($scr)):") {
        Add-Error "no section for $scr"
    }
}

$sectionScrs = [regex]::Matches($content, '(?m)^## SCR-[0-9]{3}') |
    ForEach-Object { [regex]::Match($_.Value, 'SCR-[0-9]{3}').Value } |
    Sort-Object -Unique

foreach ($scr in $sectionScrs) {
    if ($overviewScrs -notcontains $scr) {
        Add-Error "${scr}: section not declared in Screen Overview"
    }
}

foreach ($st in (Get-Ids 'ST-[0-9]{3}')) {
    if ((Get-SectionText 'Component Tree') -notmatch [regex]::Escape($st)) {
        Add-Error "${st}: no branch in the component tree"
    }
    if ((Get-SectionText 'Test Matrix') -notmatch [regex]::Escape($st)) {
        Add-Error "${st}: not in the test matrix"
    }
    if ((Get-SectionText 'State Model') -notmatch [regex]::Escape($st)) {
        Add-Error "${st}: not derived from the state model"
    }
    if ((Get-SectionText 'Design Reference') -notmatch [regex]::Escape($st)) {
        Add-Error "${st}: no design reference"
    }
}

foreach ($ix in (Get-Ids 'IX-[0-9]{3}')) {
    if ((Get-SectionText 'Test Matrix') -notmatch [regex]::Escape($ix)) {
        Add-Error "${ix}: not in the test matrix"
    }
}

foreach ($line in $lines) {
    if ($line -match '^\| ST-[0-9]{3} ') {
        $st = [regex]::Match($line, 'ST-[0-9]{3}').Value
        $columns = $line -split '\|'
        $source = if ($columns.Count -gt 3) { $columns[3].Trim() } else { '' }
        if ([string]::IsNullOrWhiteSpace($source) -or $source -eq '[...]') {
            Add-Error "${st}: empty Source"
        }
    }
}

if ($content -match '\[NEEDS CLARIFICATION') {
    Add-Error 'NEEDS CLARIFICATION remains'
}

$definitionIds = foreach ($line in $lines) {
    if ($line -match '^\| ST-[0-9]{3}') {
        [regex]::Match($line, 'ST-[0-9]{3}').Value
    }
}

$duplicateIds = $definitionIds |
    Group-Object |
    Where-Object { $_.Count -gt 1 } |
    ForEach-Object { $_.Name }

foreach ($duplicateId in $duplicateIds) {
    Add-Error "duplicate definition: $duplicateId"
}

$status = if ($errors.Count -eq 0) { 'PASS' } else { 'FAIL' }

if ($Json) {
    [PSCustomObject]@{
        STATUS = $status
        ERRORS = @($errors)
    } | ConvertTo-Json -Compress
} else {
    if ($errors.Count -eq 0) {
        Write-Output 'PASS'
    } else {
        Write-Output 'FAIL'
        foreach ($errorMessage in $errors) {
            Write-Output "- $errorMessage"
        }
    }
}

if ($errors.Count -eq 0) {
    exit 0
}
exit 1
