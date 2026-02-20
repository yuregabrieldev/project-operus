# Publicar a Edge Function create-user no Supabase
# Executa isto DEPOIS de fazeres: npx supabase login (e completares no browser)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$projectRef = "yijfkgfrhloupiwagelb"

Write-Host "1. A ligar o projeto ao Supabase..." -ForegroundColor Cyan
npx supabase link --project-ref $projectRef
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao ligar. Se der Unauthorized, corre primeiro: npx supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "2. A publicar a funcao create-user..." -ForegroundColor Cyan
npx supabase functions deploy create-user
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Concluido. A Edge Function create-user esta no ar." -ForegroundColor Green
