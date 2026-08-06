$ErrorActionPreference = "Stop"
$az = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"

$rg = "qofeno-rg"
$location = "eastus"
$acrName = "qofenoacr" + (Get-Random -Minimum 1000 -Maximum 9999)
$envName = "qofeno-env"

Write-Host "1. Creating Resource Group $rg in $location..."
& $az group create --name $rg --location $location | Out-Null
Write-Host "✓ Resource Group $rg created."

Write-Host "2. Creating Container Registry $acrName..."
& $az acr create --name $acrName --resource-group $rg --sku Basic --admin-enabled true | Out-Null
Write-Host "✓ Container Registry $acrName created."

$acrServer = (& $az acr show --name $acrName --query loginServer -o tsv).Trim()
$acrUser = (& $az acr credential show --name $acrName --query username -o tsv).Trim()
$acrPass = (& $az acr credential show --name $acrName --query "passwords[0].value" -o tsv).Trim()

Write-Host "3. Installing Azure Container Apps CLI extension..."
& $az extension add --name containerapp --upgrade --yes | Out-Null

Write-Host "4. Registering Microsoft.App namespace..."
& $az provider register --namespace Microsoft.App --wait | Out-Null

Write-Host "5. Creating Container Apps Environment $envName..."
& $az containerapp env create --name $envName --resource-group $rg --location $location | Out-Null
Write-Host "✓ Container Apps Environment $envName created."

$output = @"
AZURE_RESOURCE_GROUP=$rg
AZURE_CONTAINER_ENV=$envName
AZURE_ACR_SERVER=$acrServer
AZURE_ACR_USERNAME=$acrUser
AZURE_ACR_PASSWORD=$acrPass
AZURE_LOCATION=$location
"@

Write-Host ""
Write-Host "==== AZURE SETUP COMPLETE ===="
Write-Host $output

$envPath = "c:\Qofeno\QofenoGlobalTool\.env"
$envLocalPath = "c:\Qofeno\QofenoGlobalTool\.env.local"

Add-Content -Path $envPath -Value "`n$output"
Add-Content -Path $envLocalPath -Value "`n$output"

Write-Host "✓ Credentials appended to .env and .env.local"
