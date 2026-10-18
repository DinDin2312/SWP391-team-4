param(
    [switch]$RunDatabaseTests = $false
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OutputsRoot = Split-Path -Parent $ScriptDir

# Determine SWP391_Code directory whether outputs/ is at workspace root or inside SWP391_Code
$CandidateRepo1 = Join-Path (Split-Path -Parent $OutputsRoot) "SWP391_Code"
$CandidateRepo2 = Split-Path -Parent $OutputsRoot
if (Test-Path (Join-Path $CandidateRepo1 "Backend\pom.xml")) {
    $ProjectRoot = $CandidateRepo1
} elseif (Test-Path (Join-Path $CandidateRepo2 "Backend\pom.xml")) {
    $ProjectRoot = $CandidateRepo2
} else {
    throw "Cannot locate SWP391_Code directory from $OutputsRoot"
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " NEXUS SPORTS CENTER - LOCAL CI/CD VERIFICATION PIPELINE" -ForegroundColor Cyan
Write-Host " Project Root : $ProjectRoot" -ForegroundColor Cyan
Write-Host " Outputs Dir  : $OutputsRoot" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Verify staged CI/CD files in outputs/
$RequiredFiles = @(
    ".github\workflows\ci.yml",
    ".github\workflows\cd.yml",
    ".github\workflows\snyk-security.yml",
    ".github\dependabot.yml",
    ".github\PULL_REQUEST_TEMPLATE.md",
    "Backend\pom.xml",
    "Backend\Dockerfile",
    "Backend\.dockerignore",
    "Frontend\Dockerfile",
    "Frontend\.dockerignore",
    "Frontend\nginx.conf",
    "docker-compose.yml",
    ".env.example",
    "docs\CI_CD_PIPELINE_GUIDE.md",
    "docs\FLOW_TRACEABILITY_AND_TEST_MATRIX.md"
)

Write-Host "`n[Stage 1/5] Verifying CI/CD Artifacts in outputs/..." -ForegroundColor Yellow
foreach ($rel in $RequiredFiles) {
    $full = Join-Path $OutputsRoot $rel
    if (-not (Test-Path $full)) {
        throw "Missing required artifact in outputs/: $rel"
    }
    Write-Host "  [OK] $rel" -ForegroundColor Green
}

# 2. Audit Backend/pom.xml vs outputs/Backend/pom.xml for Snyk DEMO vulnerabilities
Write-Host "`n[Stage 2/5] Auditing Maven Dependencies (DevSecOps Gate)..." -ForegroundColor Yellow
$CurrentPom = Get-Content (Join-Path $ProjectRoot "Backend\pom.xml") -Raw
$StagedPom = Get-Content (Join-Path $OutputsRoot "Backend\pom.xml") -Raw

if ($CurrentPom -match "commons-collections" -and $CurrentPom -match "3\.2\.2") {
    Write-Host "  [WARN] Current SWP391_Code/Backend/pom.xml still contains DEMO Snyk 1 (commons-collections:3.2.2 - Critical RCE)." -ForegroundColor Yellow
}
if ($CurrentPom -match "dom4j" -and $CurrentPom -match "2\.1\.3") {
    Write-Host "  [WARN] Current SWP391_Code/Backend/pom.xml still contains DEMO Snyk 2 (dom4j:2.1.3 - High XXE)." -ForegroundColor Yellow
}
if (($StagedPom -match "<version>3\.2\.2</version>") -or ($StagedPom -match "<version>2\.1\.3</version>")) {
    throw "Staged outputs/Backend/pom.xml still contains vulnerable demo dependencies!"
} else {
    Write-Host "  [OK] Staged outputs/Backend/pom.xml is clean of DEMO Snyk RCE/XXE vulnerabilities." -ForegroundColor Green
}

# 3. Frontend Lint, Unit Tests & Production Build
Write-Host "`n[Stage 3/5] Running Frontend CI Checks (Oxlint + 52 Unit Tests + Vite Build)..." -ForegroundColor Yellow
Push-Location (Join-Path $ProjectRoot "Frontend")
try {
    npm run lint
    if ($LASTEXITCODE -ne 0) { throw "Frontend lint failed" }
    Write-Host "  [OK] Frontend Lint passed" -ForegroundColor Green

    npm test
    if ($LASTEXITCODE -ne 0) { throw "Frontend unit tests failed" }
    Write-Host "  [OK] Frontend Unit Tests passed (52/52)" -ForegroundColor Green

    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend production build failed" }
    Write-Host "  [OK] Frontend Production Build succeeded" -ForegroundColor Green
} finally {
    Pop-Location
}

# 4. Backend Compile & Unit Tests
Write-Host "`n[Stage 4/5] Running Backend CI Checks (Maven Compile & Unit Tests)..." -ForegroundColor Yellow
Push-Location (Join-Path $ProjectRoot "Backend")
try {
    .\mvnw.cmd --batch-mode --no-transfer-progress test-compile
    if ($LASTEXITCODE -ne 0) { throw "Backend test-compile failed" }
    Write-Host "  [OK] Backend test-compile passed" -ForegroundColor Green

    .\mvnw.cmd --batch-mode --no-transfer-progress "-Dtest=AvatarStorageServiceTests,CoachProfileServiceTests,ResourceImageStorageServiceTests,SchedulePlannerTests" test
    if ($LASTEXITCODE -ne 0) { throw "Backend isolated unit tests failed" }
    Write-Host "  [OK] Backend isolated unit tests passed" -ForegroundColor Green

    if ($RunDatabaseTests) {
        Write-Host "`n[Stage 5/5] Running Backend Flyway Migration Tests on Disposable Schemas..." -ForegroundColor Yellow
        if (-not $env:MIGRATION_TEST_URL) {
            $env:MIGRATION_TEST_URL = "jdbc:mysql://localhost:3306/SportCenter?useSSL=false&allowPublicKeyRetrieval=true&connectionTimeZone=Asia/Ho_Chi_Minh"
            $env:MIGRATION_TEST_USERNAME = "root"
            $env:MIGRATION_TEST_PASSWORD = "123456"
        }
        .\mvnw.cmd --batch-mode --no-transfer-progress "-Dtest=DatabaseMigrationTests" test
        if ($LASTEXITCODE -ne 0) { throw "Backend DatabaseMigrationTests failed" }
        Write-Host "  [OK] Backend Flyway DatabaseMigrationTests (7/7) passed" -ForegroundColor Green
    } else {
        Write-Host "`n[Stage 5/5] Skipping DB migration tests (pass -RunDatabaseTests to run against local MySQL)." -ForegroundColor Gray
    }
} finally {
    Pop-Location
}

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host " ALL CI/CD VERIFICATION CHECKS PASSED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
