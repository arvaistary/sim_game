# Creates sub-issues for epics #11-31, new epics from doc audit, and their subtasks.
# Usage: pwsh -NoProfile -File scripts/seed-github-subtasks.ps1

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $repoRoot '.env'
$dataFile = Join-Path $PSScriptRoot 'github-backlog-subtasks.json'
$match = Select-String -Path $envFile -Pattern '^GH_TOKEN_CLASSIC=(.*)$' | Select-Object -First 1

if ($null -eq $match) {
    Write-Error 'GH_TOKEN_CLASSIC not found in .env'
}

$env:GH_TOKEN = $match.Matches.Groups[1].Value.Trim()
$repo = 'arvaistary/sim_game'
$projectNumber = 2
$owner = '@me'
$data = Get-Content $dataFile -Raw | ConvertFrom-Json

gh label create 'subtask' --repo $repo --color '1d76db' --description 'Sub-issue of a backlog epic' 2>$null

function Add-ToProject {
    param([string]$IssueUrl)

    gh project item-add $projectNumber --owner $owner --url $IssueUrl | Out-Null
}

function New-SubIssue {
    param(
        [int]$ParentNumber,
        [string]$Title,
        [string]$Body,
        [string]$Labels = 'subtask,enhancement'
    )

    $fullBody = "**Epic:** #$ParentNumber`n`n$Body"
    $url = gh issue create --repo $repo --title $Title --body $fullBody --label $Labels --parent $ParentNumber
    Add-ToProject -IssueUrl $url
    Start-Sleep -Milliseconds 400
    return $url
}

function New-Epic {
    param(
        [string]$Title,
        [string]$Body,
        [string]$Labels
    )

    $url = gh issue create --repo $repo --title $Title --body $Body --label $Labels
    Add-ToProject -IssueUrl $url
    Start-Sleep -Milliseconds 400
    $number = [int]($url -replace '.*/issues/')
    return $number
}

$created = @()
$newEpicMap = @{}
$epicIndex = 0
$epicKeys = @('32', '33', '34')

foreach ($epic in $data.newEpics) {
    $number = New-Epic -Title $epic.title -Body $epic.body -Labels $epic.labels
    $mapKey = $epicKeys[$epicIndex]
    $newEpicMap[$mapKey] = $number
    $epicIndex++
    $created += "Epic #$number $($epic.title)"
    Write-Output "Epic #$number"
}

foreach ($parentKey in $data.subtasks.PSObject.Properties.Name) {
    $parent = [int]$parentKey
    $priority = if ($parent -le 17) { 'P0' } elseif ($parent -le 25) { 'P1' } elseif ($parent -le 28) { 'P2' } else { 'P3' }

    foreach ($item in $data.subtasks.$parentKey) {
        $title = $item[0]
        $detail = $item[1]
        $url = New-SubIssue -ParentNumber $parent -Title $title -Body $detail -Labels "subtask,enhancement,$priority"
        $created += $url
    }

    Write-Output "Subtasks for #$parent done"
}

foreach ($epicProp in $data.newEpicSubtasks.PSObject.Properties) {
    $parent = $newEpicMap[$epicProp.Name]
    if ($null -eq $parent) {
        Write-Warning "Skip subtasks for unmapped epic key $($epicProp.Name)"
        continue
    }
    $priority = if ($epicProp.Name -eq '32') { 'P1' } else { 'P2' }

    foreach ($item in $epicProp.Value) {
        $title = $item[0]
        $detail = $item[1]
        $url = New-SubIssue -ParentNumber $parent -Title $title -Body $detail -Labels "subtask,enhancement,$priority"
        $created += $url
    }

    Write-Output "Subtasks for new epic #$parent done"
}

Write-Output "---"
Write-Output "Created $($created.Count) issues (epics + subtasks)"
