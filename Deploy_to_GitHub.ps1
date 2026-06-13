Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Uploading Triangle Congruence Game to GitHub Pages" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Prompt user for repository URL
$repoUrl = Read-Host "Please paste your GitHub Repository URL (e.g., https://github.com/username/math-game.git)"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "Error: Invalid URL." -ForegroundColor Red
    exit
}

# Run Git commands
Write-Host "Initializing local Git repository..." -ForegroundColor Yellow
git init

Write-Host "Adding files..." -ForegroundColor Yellow
git add index.html style.css game.js questions.js

Write-Host "Committing files..." -ForegroundColor Yellow
git commit -m "Initial commit of Amit's math game"

# Set branch name to main
git branch -M main

# Add remote
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    git remote remove origin
}

git remote add origin $repoUrl

Write-Host "Uploading files to GitHub (you may be asked to log in)..." -ForegroundColor Yellow
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "  Upload completed successfully! 🎉" -ForegroundColor Green
    Write-Host "  Now follow these steps on GitHub to activate the link:" -ForegroundColor Green
    Write-Host "  1. Go to your Repository settings in GitHub (Settings tab)." -ForegroundColor White
    Write-Host "  2. In the left sidebar, click on Pages." -ForegroundColor White
    Write-Host "  3. Under Build and deployment -> Source, select Deploy from a branch." -ForegroundColor White
    Write-Host "  4. Under Branch, select 'main' and click Save." -ForegroundColor White
    Write-Host "  5. In about 1 minute, you will get your web link to send to Amit!" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
} else {
    Write-Host "An error occurred during upload. Please check your URL and GitHub authentication." -ForegroundColor Red
}

Write-Host "Press any key to exit..."
[void][System.Console]::ReadKey($true)

