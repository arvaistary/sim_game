#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [switch]$Json,
    [switch]$Force,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'
if ($Help) {
    Write-Output 'Usage: ./adopt-project.ps1 [-Json] [-Force]'
    Write-Output '  -Json   Output JSON summary'
    Write-Output '  -Force  Overwrite non-constitution memory files'
    exit 0
}

. "$PSScriptRoot/common.ps1"
$repoRoot = Get-RepoRoot
$templatesDir = Join-Path $repoRoot '.specify/templates'
$memoryDir = Join-Path $repoRoot '.specify/memory'
$targets = @(
    @{ Source = 'memory-context.md'; Target = 'context.md'; Relative = 'context.md' },
    @{ Source = 'memory-architecture.md'; Target = 'architecture/overview.md'; Relative = 'architecture/overview.md' },
    @{ Source = 'memory-tech-stack.md'; Target = 'architecture/tech-stack.md'; Relative = 'architecture/tech-stack.md' },
    @{ Source = 'memory-data-flow.md'; Target = 'architecture/data-flow.md'; Relative = 'architecture/data-flow.md' },
    @{ Source = 'memory-adr-readme.md'; Target = 'architecture/adr/README.md'; Relative = 'architecture/adr/README.md' },
    @{ Source = 'memory-code-style.md'; Target = 'development/code-style.md'; Relative = 'development/code-style.md' },
    @{ Source = 'memory-ui-screens.md'; Target = 'ui/screens.md'; Relative = 'ui/screens.md' },
    @{ Source = 'memory-ui-navigation.md'; Target = 'ui/navigation.md'; Relative = 'ui/navigation.md' },
    @{ Source = 'memory-ui-conventions.md'; Target = 'ui/conventions.md'; Relative = 'ui/conventions.md' }
)

$created = [System.Collections.Generic.List[string]]::new()
$skipped = [System.Collections.Generic.List[string]]::new()
foreach ($item in $targets) {
    $source = Join-Path $templatesDir $item.Source
    $target = Join-Path $memoryDir $item.Target
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing template file: $source" }
    if (Test-Path -LiteralPath $target -PathType Leaf) {
        if ($Force) { Copy-Item -LiteralPath $source -Destination $target -Force; $created.Add($item.Relative) }
        else { $skipped.Add($item.Relative) }
    } else {
        New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
        Copy-Item -LiteralPath $source -Destination $target
        $created.Add($item.Relative)
    }
}

$constitution = Join-Path $memoryDir 'constitution.md'
if (Test-Path -LiteralPath $constitution -PathType Leaf) {
    $skipped.Add('constitution.md')
    $constitutionStatus = 'preserved'
} else {
    $source = Join-Path $templatesDir 'constitution-template.md'
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing constitution template: $source" }
    New-Item -ItemType Directory -Path $memoryDir -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $constitution
    $created.Add('constitution.md')
    $constitutionStatus = 'created'
}

$result = [ordered]@{
    REPO_ROOT = $repoRoot
    SPEC_ROOT = $repoRoot
    PRODUCT_ROOT = Get-ProductRoot
    PRODUCT_GIT_ROOT = Get-ProductGitRoot
    ARTIFACT_MODE = Get-ArtifactMode
    FILES_CREATED = @($created)
    FILES_SKIPPED = @($skipped)
    CONSTITUTION_STATUS = $constitutionStatus
}
if ($Json) { $result | ConvertTo-Json -Compress } else { $result.GetEnumerator() | ForEach-Object { "$($_.Key): $($_.Value)" } }
