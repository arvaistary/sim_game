#!/usr/bin/env pwsh
# Common PowerShell functions analogous to common.sh

function Get-ScriptRepoRoot {
    return (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
}

function Get-ExternalBindingValue {
    param(
        [Parameter(Mandatory=$true)]
        [string]$BindingFile,
        [Parameter(Mandatory=$true)]
        [string]$Key
    )
    if (-not (Test-Path $BindingFile)) { return "" }
    $pattern = "^\s*$([Regex]::Escape($Key))\s*=\s*`"(.+)`"\s*$"
    foreach ($line in Get-Content -LiteralPath $BindingFile -Encoding utf8) {
        if ($line -match $pattern) { return $Matches[1] }
    }
    return ""
}

function Get-ExternalBindingFile {
    return (Join-Path (Get-ScriptRepoRoot) ".specify/external-project.toml")
}

function Test-ExternalArtifactsMode {
    $bindingFile = Get-ExternalBindingFile
    return ((Test-Path $bindingFile) -and ((Get-ExternalBindingValue -BindingFile $bindingFile -Key "artifact_mode") -eq "external"))
}

function Get-RepoRoot {
    $scriptRoot = Get-ScriptRepoRoot
    if (Test-ExternalArtifactsMode) {
        return (Get-ExternalBindingValue -BindingFile (Get-ExternalBindingFile) -Key "spec_root")
    }

    try {
        $result = git rev-parse --show-toplevel 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $result
        }
    } catch {
        # Git command failed
    }

    # Fall back to script location for non-git repos
    return $scriptRoot
}

function Get-ProductRoot {
    $bindingFile = Get-ExternalBindingFile
    if (Test-ExternalArtifactsMode) {
        return (Get-ExternalBindingValue -BindingFile $bindingFile -Key "product_root")
    }
    return (Get-RepoRoot)
}

function Get-ProductGitRoot {
    $bindingFile = Get-ExternalBindingFile
    if (Test-ExternalArtifactsMode) {
        return (Get-ExternalBindingValue -BindingFile $bindingFile -Key "product_git_root")
    }
    try {
        $result = git rev-parse --show-toplevel 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $result
        }
    } catch {
        # Git command failed
    }
    return ""
}

function Get-ArtifactMode {
    if (Test-ExternalArtifactsMode) { return "external" }
    return "in-repo"
}

function Get-CurrentBranch {
    # First check if SPECIFY_FEATURE environment variable is set
    if ($env:SPECIFY_FEATURE) {
        return $env:SPECIFY_FEATURE
    }

    # Then check product git if available
    $productRoot = Get-ProductRoot
    try {
        $result = git -C $productRoot rev-parse --abbrev-ref HEAD 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $result
        }
    } catch {
        # Git command failed
    }

    # For non-git repos, try to find the latest feature directory
    $repoRoot = Get-RepoRoot
    $specsDir = Join-Path $repoRoot "specs"

    if (Test-Path $specsDir) {
        $latestFeature = ""
        $highest = 0

        Get-ChildItem -Path $specsDir -Directory | ForEach-Object {
            if ($_.Name -match '^(\d{3})-') {
                $num = [int]$matches[1]
                if ($num -gt $highest) {
                    $highest = $num
                    $latestFeature = $_.Name
                }
            }
        }

        if ($latestFeature) {
            return $latestFeature
        }
    }

    # Final fallback
    return "main"
}

function Test-HasGit {
    $productRoot = Get-ProductRoot
    try {
        git -C $productRoot rev-parse --show-toplevel 2>$null | Out-Null
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    }
}

function Test-FeatureBranch {
    param(
        [string]$Branch,
        [bool]$HasGit = $true
    )

    # For non-git repos, we can't enforce branch naming but still provide output
    if (-not $HasGit) {
        Write-Warning "[specify] Warning: Git repository not detected; skipped branch validation"
        return $true
    }

    if ($Branch -notmatch '^[0-9]{3}-') {
        Write-Output "ERROR: Not on a feature branch. Current branch: $Branch"
        Write-Output "Feature branches should be named like: 001-feature-name"
        return $false
    }
    return $true
}

function Get-FeatureDir {
    param([string]$RepoRoot, [string]$Branch)
    $specsDir = Join-Path $RepoRoot 'specs'
    if ($Branch -match '^(\d{3})-') {
        $matches = @(Get-ChildItem -Path $specsDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "$($Matches[1])-*" })
        if ($matches.Count -eq 1) { return $matches[0].FullName }
        if ($matches.Count -gt 1) { throw "Multiple spec directories found with prefix '$($Matches[1])': $($matches.Name -join ', ')" }
    }
    return (Join-Path $specsDir $Branch)
}

function Get-FeaturePathsEnv {
    $repoRoot = Get-RepoRoot
    $hasGit = Test-HasGit
    $productRoot = Get-ProductRoot
    $productGitRoot = Get-ProductGitRoot
    $artifactMode = Get-ArtifactMode
    $currentBranch = ''
    $featureDir = ''
    $resolutionSource = ''

    if ($env:SPECIFY_FEATURE) {
        $currentBranch = $env:SPECIFY_FEATURE
        $featureDir = Get-FeatureDir -RepoRoot $repoRoot -Branch $currentBranch
        $resolutionSource = 'environment'
    } else {
        $activeStateFile = Join-Path $repoRoot '.specify/.active-work-item.json'
        if (Test-Path -LiteralPath $activeStateFile -PathType Leaf) {
            try {
                $activeState = Get-Content -Raw -Encoding UTF8 -LiteralPath $activeStateFile | ConvertFrom-Json
                $currentBranch = [string]$activeState.name
                if ($activeState.path) {
                    $relativePath = ([string]$activeState.path).TrimEnd([char[]]@('/', '\'))
                    if ([IO.Path]::IsPathRooted($relativePath) -or $relativePath -match '(^|[\\/])\.\.([\\/]|$)') {
                        throw 'path must be repository-relative and cannot contain .. segments'
                    }
                    $featureDir = Join-Path $repoRoot $relativePath
                } elseif ($currentBranch) {
                    $featureDir = Get-FeatureDir -RepoRoot $repoRoot -Branch $currentBranch
                }
                if (-not $currentBranch -or -not $featureDir -or -not (Test-Path -LiteralPath $featureDir -PathType Container)) {
                    throw 'name/path is missing or target directory does not exist'
                }
                $resolutionSource = 'active-work-item'
            } catch {
                Write-Warning "[specify] Invalid active work-item state at ${activeStateFile}: $($_.Exception.Message); falling back"
                $currentBranch = ''
                $featureDir = ''
            }
        }

        if (-not $featureDir) {
            $currentBranch = Get-CurrentBranch
            $featureDir = Get-FeatureDir -RepoRoot $repoRoot -Branch $currentBranch
            $resolutionSource = if ($hasGit) { 'git-branch' } else { 'latest-spec' }
        }
    }

    [PSCustomObject]@{
        REPO_ROOT     = $repoRoot
        SPEC_ROOT     = $repoRoot
        PRODUCT_ROOT  = $productRoot
        PRODUCT_GIT_ROOT = $productGitRoot
        ARTIFACT_MODE = $artifactMode
        RESOLUTION_SOURCE = $resolutionSource
        CURRENT_BRANCH = $currentBranch
        HAS_GIT       = $hasGit
        FEATURE_DIR   = $featureDir
        FEATURE_SPEC  = Join-Path $featureDir 'spec.md'
        IMPL_PLAN     = Join-Path $featureDir 'plan.md'
        TASKS         = Join-Path $featureDir 'tasks.md'
        RESEARCH      = Join-Path $featureDir 'research.md'
        DATA_MODEL    = Join-Path $featureDir 'data-model.md'
        QUICKSTART    = Join-Path $featureDir 'quickstart.md'
        CONTRACTS_DIR = Join-Path $featureDir 'contracts'
    }
}

function Test-FileExists {
    param([string]$Path, [string]$Description)
    if (Test-Path -Path $Path -PathType Leaf) {
        Write-Output "  ✓ $Description"
        return $true
    } else {
        Write-Output "  ✗ $Description"
        return $false
    }
}

function Test-DirHasFiles {
    param([string]$Path, [string]$Description)
    if ((Test-Path -Path $Path -PathType Container) -and (Get-ChildItem -Path $Path -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Select-Object -First 1)) {
        Write-Output "  ✓ $Description"
        return $true
    } else {
        Write-Output "  ✗ $Description"
        return $false
    }
}
