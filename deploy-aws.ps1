$ErrorActionPreference = "Stop"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "    API Cemetery — AWS Full-Stack Deployment" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Check AWS Credentials
Write-Host ""
Write-Host "[1/6] Checking AWS credentials..." -ForegroundColor Yellow
$identityJson = aws sts get-caller-identity --output json
if ($LASTEXITCODE -ne 0) {
    Write-Error "AWS credentials not configured. Please run 'aws configure'."
    exit 1
}
$identity = $identityJson | ConvertFrom-Json
$region = aws configure get region
if (-not $region) { $region = "us-east-1" }
Write-Host "Connected as: $($identity.Arn)" -ForegroundColor Green
Write-Host "Target Region: $region" -ForegroundColor Green

# 2. Build SAM Backend
Write-Host ""
Write-Host "[2/6] Building AWS SAM backend..." -ForegroundColor Yellow
sam build --template-file template.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Error "SAM build failed."
    exit 1
}
Write-Host "SAM backend built successfully." -ForegroundColor Green

# 3. Deploy CloudFormation Stack
Write-Host ""
Write-Host "[3/6] Deploying CloudFormation stack (api-cemetery-prod)..." -ForegroundColor Yellow
sam deploy `
    --stack-name api-cemetery-prod `
    --resolve-s3 `
    --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND `
    --no-confirm-changeset `
    --region $region
if ($LASTEXITCODE -ne 0) {
    Write-Error "SAM deploy failed."
    exit 1
}

# 4. Fetch Stack Outputs
Write-Host ""
Write-Host "[4/6] Retrieving stack outputs..." -ForegroundColor Yellow
$outputsJson = aws cloudformation describe-stacks `
    --stack-name api-cemetery-prod `
    --query "Stacks[0].Outputs" `
    --output json `
    --region $region
$outputs = $outputsJson | ConvertFrom-Json

$cloudFrontUrl = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontUrl" }).OutputValue
$distId = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontDistributionId" }).OutputValue
$hostingBucket = ($outputs | Where-Object { $_.OutputKey -eq "HostingBucketName" }).OutputValue
$apiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiUrl" }).OutputValue

Write-Host "CloudFront URL: $cloudFrontUrl" -ForegroundColor Cyan
Write-Host "API Gateway URL: $apiUrl" -ForegroundColor Cyan
Write-Host "Hosting Bucket: $hostingBucket" -ForegroundColor Cyan

# Update .env.production with live API URL
Set-Content -Path ".\.env.production" -Value @("NEXT_PUBLIC_PROJECT_ID=proj-demo-001", "NEXT_PUBLIC_API_URL=$apiUrl")

# 5. Build Next.js Static Export
Write-Host ""
Write-Host "[5/6] Building Next.js static export..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Next.js build failed."
    exit 1
}

# 6. Upload Assets & Invalidate Cache
Write-Host ""
Write-Host "[6/6] Syncing assets to S3 and invalidating CloudFront..." -ForegroundColor Yellow
aws s3 sync out/ "s3://$hostingBucket" --delete --region $region
if ($LASTEXITCODE -ne 0) {
    Write-Error "S3 sync failed."
    exit 1
}

if ($distId) {
    Write-Host "Invalidating CloudFront cache for distribution $distId..." -ForegroundColor Yellow
    aws cloudfront create-invalidation --distribution-id $distId --paths "/*" --region $region | Out-Null
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "[SUCCESS] DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host "Frontend URL:    $cloudFrontUrl" -ForegroundColor Cyan
Write-Host "API Gateway URL: $apiUrl" -ForegroundColor Cyan
Write-Host "Hosting S3:      s3://$hostingBucket" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
