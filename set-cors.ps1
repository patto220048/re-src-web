# Script to set CORS for Firebase Storage
$bucketName = "editerlor.firebasestorage.app"
$corsFile = "cors.json"

Write-Host "Checking for gsutil..." -ForegroundColor Cyan
if (Get-Command gsutil -ErrorAction SilentlyContinue) {
    Write-Host "Applying CORS configuration to gs://$bucketName ..." -ForegroundColor Yellow
    gsutil cors set $corsFile gs://$bucketName
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully applied CORS configuration!" -ForegroundColor Green
    } else {
        Write-Host "Failed to apply CORS. Make sure you are logged in using 'gcloud auth login'." -ForegroundColor Red
    }
} else {
    Write-Host "Error: 'gsutil' not found." -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install#windows" -ForegroundColor Yellow
}
pause
