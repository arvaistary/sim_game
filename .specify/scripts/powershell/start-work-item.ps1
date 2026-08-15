#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [switch]$Json,
    [ValidateSet('lite', 'full')]
    [string]$Mode = 'lite',
    [string]$ShortName,
    [int]$Number = 0,
    [switch]$Help,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Description
)

$ErrorActionPreference = 'Stop'
if ($Help) {
    Write-Output 'Usage: ./start-work-item.ps1 [-Json] [-Mode lite|full] [-ShortName name] [-Number N] description'
    exit 0
}
if (-not $Description -or $Description.Count -eq 0) { throw 'A work-item description is required.' }
if ($Number -lt 0) { throw '-Number must be a non-negative integer.' }

. "$PSScriptRoot/common.ps1"
$repoRoot = Get-RepoRoot
$specsDir = Join-Path $repoRoot 'specs'
New-Item -ItemType Directory -Path $specsDir -Force | Out-Null
$descriptionText = ($Description -join ' ').Trim()

function Convert-ToShortName([string]$Value) {
    $clean = $Value.ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    return $clean.Trim('-')
}

$suffix = if ($ShortName) { Convert-ToShortName $ShortName } else { Convert-ToShortName $descriptionText }
if (-not $suffix) { throw 'Could not generate a valid short name.' }
if ($Number -eq 0) {
    $numbers = Get-ChildItem -LiteralPath $specsDir -Directory -ErrorAction SilentlyContinue |
        ForEach-Object { if ($_.Name -match '^([0-9]+)-') { [int]$Matches[1] } }
    $Number = if ($numbers) { ($numbers | Measure-Object -Maximum).Maximum + 1 } else { 1 }
}

$workItemName = '{0:D3}-{1}' -f $Number, $suffix
$workItemDir = Join-Path $specsDir $workItemName
if (Test-Path -LiteralPath $workItemDir) {
    throw "Work-item directory already exists: $workItemDir. Choose a different -Number/-ShortName or explicitly update existing artifacts."
}
New-Item -ItemType Directory -Path $workItemDir -Force | Out-Null
if ($Mode -eq 'full') {
    $template = Join-Path $repoRoot '.specify/templates/spec-template.md'
    $specFile = Join-Path $workItemDir 'spec.md'
    if (Test-Path -LiteralPath $template) { Copy-Item -LiteralPath $template -Destination $specFile -Force }
    elseif (-not (Test-Path -LiteralPath $specFile)) { New-Item -ItemType File -Path $specFile | Out-Null }
}

$state = [ordered]@{
    name = $workItemName
    path = "specs/$workItemName/"
    mode = $Mode
    description = $descriptionText
    created = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
}
$stateFile = Join-Path $repoRoot '.specify/.active-work-item.json'
$state | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8

$result = [ordered]@{
    WORK_ITEM_NAME = $workItemName
    WORK_ITEM_DIR = $workItemDir
    MODE = $Mode
    SPEC_ROOT = $repoRoot
    PRODUCT_ROOT = Get-ProductRoot
    PRODUCT_GIT_ROOT = Get-ProductGitRoot
    ARTIFACT_MODE = Get-ArtifactMode
}
if ($Json) { $result | ConvertTo-Json -Compress } else { $result.GetEnumerator() | ForEach-Object { "$($_.Key): $($_.Value)" } }
