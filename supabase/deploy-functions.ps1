# ============================================================
# OPERUS - Deploy all Edge Functions to your Supabase project
# Usage: .\supabase\deploy-functions.ps1 -ProjectRef "your-project-ref"
# ============================================================

param(
  [Parameter(Mandatory=$true)]
  [string]$ProjectRef
)

$functions = @("create-user", "update-user", "export-brand-data", "import-brand-data")

Write-Host "Linking project $ProjectRef..." -ForegroundColor Cyan
npx supabase link --project-ref $ProjectRef

Write-Host "`nDeploying Edge Functions..." -ForegroundColor Cyan
foreach ($fn in $functions) {
  Write-Host "  -> Deploying $fn..." -ForegroundColor Yellow
  npx supabase functions deploy $fn --no-verify-jwt
  if ($LASTEXITCODE -eq 0) {
    Write-Host "     OK" -ForegroundColor Green
  } else {
    Write-Host "     FAILED" -ForegroundColor Red
  }
}

Write-Host "`nAll done! Don't forget to set the secrets:" -ForegroundColor Cyan
Write-Host "  npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key --project-ref $ProjectRef" -ForegroundColor White
