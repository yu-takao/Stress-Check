param(
  [string]$Profile = "trust-life-support-prod"
)

Write-Host "Re-authenticating AWS SSO for profile: $Profile" -ForegroundColor Cyan
aws sso login --profile $Profile
if ($LASTEXITCODE -ne 0) {
  Write-Error "aws sso login failed ($LASTEXITCODE)."
  exit $LASTEXITCODE
}

aws sts get-caller-identity --profile $Profile | Out-Host
Write-Host "SSO session refreshed." -ForegroundColor Green

