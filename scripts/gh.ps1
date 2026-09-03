# Loads GitHub token from .env and runs gh with the remaining arguments.
# Prefers GH_TOKEN_CLASSIC (required for Projects v2); falls back to GH_TOKEN.

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$GhArgs
)

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $repoRoot '.env'

if (-not (Test-Path $envFile)) {
    Write-Error ".env not found at $envFile. Copy from .env.example."
    exit 1
}

function Get-EnvValue {
    param([string]$Name)

    $pattern = "^${Name}=(.*)$"
    $match = Select-String -Path $envFile -Pattern $pattern | Select-Object -First 1

    if ($null -eq $match) {
        return $null
    }

    return $match.Matches.Groups[1].Value.Trim()
}

$token = Get-EnvValue -Name 'GH_TOKEN_CLASSIC'

if ([string]::IsNullOrWhiteSpace($token)) {
    $token = Get-EnvValue -Name 'GH_TOKEN'
}

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Error 'Set GH_TOKEN_CLASSIC (recommended for Projects) or GH_TOKEN in .env'
    exit 1
}

$env:GH_TOKEN = $token

if ($GhArgs.Count -eq 0) {
    gh --help
    exit $LASTEXITCODE
}

& gh @GhArgs
exit $LASTEXITCODE
