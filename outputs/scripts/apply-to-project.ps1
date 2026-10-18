param(
    [switch]$DryRun = $false,
    [switch]$IncludeRemediatedPom = $false
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OutputsRoot = Split-Path -Parent $ScriptDir

$CandidateRepo1 = Join-Path (Split-Path -Parent $OutputsRoot) "SWP391_Code"
$CandidateRepo2 = Split-Path -Parent $OutputsRoot
if (Test-Path (Join-Path $CandidateRepo1 "Backend\pom.xml")) {
    $ProjectRoot = $CandidateRepo1
} elseif (Test-Path (Join-Path $CandidateRepo2 "Backend\pom.xml")) {
    $ProjectRoot = $CandidateRepo2
} else {
    throw "Cannot locate SWP391_Code directory from $OutputsRoot"
}

$FilesToCopy = @(
    @{ Source = ".github\workflows\ci.yml"; Target = ".github\workflows\ci.yml" },
    @{ Source = ".github\workflows\cd.yml"; Target = ".github\workflows\cd.yml" },
    @{ Source = ".github\workflows\snyk-security.yml"; Target = ".github\workflows\snyk-security.yml" },
    @{ Source = ".github\dependabot.yml"; Target = ".github\dependabot.yml" },
    @{ Source = ".github\PULL_REQUEST_TEMPLATE.md"; Target = ".github\PULL_REQUEST_TEMPLATE.md" },
    @{ Source = "Backend\Dockerfile"; Target = "Backend\Dockerfile" },
    @{ Source = "Backend\.dockerignore"; Target = "Backend\.dockerignore" },
    @{ Source = "Frontend\Dockerfile"; Target = "Frontend\Dockerfile" },
    @{ Source = "Frontend\.dockerignore"; Target = "Frontend\.dockerignore" },
    @{ Source = "Frontend\nginx.conf"; Target = "Frontend\nginx.conf" },
    @{ Source = "docker-compose.yml"; Target = "docker-compose.yml" },
    @{ Source = ".env.example"; Target = ".env.example" },
    @{ Source = "docs\CI_CD_PIPELINE_GUIDE.md"; Target = "docs\CI_CD_PIPELINE_GUIDE.md" },
    @{ Source = "docs\FLOW_TRACEABILITY_AND_TEST_MATRIX.md"; Target = "docs\FLOW_TRACEABILITY_AND_TEST_MATRIX.md" }
)

if ($IncludeRemediatedPom) {
    $FilesToCopy += @{ Source = "Backend\pom.xml"; Target = "Backend\pom.xml" }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " APPLYING STAGED CI/CD ARTIFACTS FROM outputs/ TO SWP391_Code" -ForegroundColor Cyan
Write-Host " Mode: $(if ($DryRun) { 'DRY-RUN (no files modified)' } else { 'APPLY' })" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

foreach ($item in $FilesToCopy) {
    $srcPath = Join-Path $OutputsRoot $item.Source
    $dstPath = Join-Path $ProjectRoot $item.Target
    $dstDir = Split-Path -Parent $dstPath

    if ($DryRun) {
        $action = if (Test-Path $dstPath) { "OVERWRITE" } else { "CREATE" }
        Write-Host "  [$action] $($item.Target)" -ForegroundColor Yellow
    } else {
        if (-not (Test-Path $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        }
        Copy-Item -Path $srcPath -Destination $dstPath -Force
        Write-Host "  [APPLIED] $($item.Target)" -ForegroundColor Green
    }
}

if (-not $IncludeRemediatedPom) {
    Write-Host "`n[NOTE] Backend/pom.xml was NOT overwritten (pass -IncludeRemediatedPom to also remove the 2 DEMO Snyk vulnerable dependencies)." -ForegroundColor Cyan
}
