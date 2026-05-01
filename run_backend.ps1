# This script attempts to run the Java backend
# It assumes Maven is not installed and tries to use the Java compiler directly 
# or suggests installing Maven.

Write-Host "Checking for Maven..." -ForegroundColor Cyan
$mvn = Get-Command mvn -ErrorAction SilentlyContinue

if ($mvn) {
    Write-Host "Maven found! Starting backend..." -ForegroundColor Green
    cd backend
    mvn spring-boot:run
} else {
    Write-Host "Maven not found in PATH." -ForegroundColor Yellow
    Write-Host "Please install Maven or run the following command if you have it elsewhere:" -ForegroundColor White
    Write-Host "  path/to/mvn spring-boot:run" -ForegroundColor Cyan
    Write-Host "`nAlternatively, you can open the 'backend' folder in IntelliJ or VS Code and run 'FeesApplication.java'." -ForegroundColor White
}
