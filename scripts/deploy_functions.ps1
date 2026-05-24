Write-Host "Loading .env.server..."
$envFile = Join-Path -Path (Get-Location) -ChildPath 'QofenoGlobalTool\.env.server'
if (-not (Test-Path $envFile)) { Write-Error ".env.server not found in QofenoGlobalTool folder"; exit 1 }

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^(\w+)=(.*)$') { Set-Item -Path env:$($matches[1]) -Value $matches[2] }
}

if (-not $env:APPWRITE_API_KEY) { Write-Error "APPWRITE_API_KEY not set in .env.server"; exit 1 }

$base = $env:APPWRITE_ENDPOINT.TrimEnd('/')
$functionsRoot = Join-Path -Path (Get-Location) -ChildPath 'QofenoGlobalTool\functions'

function Invoke-Appwrite {
  param($method, $path, $json)
  $url = "$base$path"
  if ($json) { $body = $json | ConvertTo-Json -Depth 12 } else { $body = $null }
  Write-Host "$method $url"
  if ($method -eq 'GET') {
    return curl.exe -s -X GET $url -H "X-Appwrite-Project: $($env:APPWRITE_PROJECT_ID)" -H "X-Appwrite-Key: $($env:APPWRITE_API_KEY)" -H "Content-Type: application/json"
  } else {
    return curl.exe -s -X $method $url -H "X-Appwrite-Project: $($env:APPWRITE_PROJECT_ID)" -H "X-Appwrite-Key: $($env:APPWRITE_API_KEY)" -H "Content-Type: application/json" -d $body
  }
}

if (-not (Test-Path $functionsRoot)) { Write-Error "Functions folder not found: $functionsRoot"; exit 1 }

$existing = Invoke-Appwrite -method GET -path "/functions"
try { $existingJson = $existing | ConvertFrom-Json } catch { $existingJson = @{} }

Get-ChildItem -Path $functionsRoot -Directory | ForEach-Object {
  $categoryDir = $_.FullName
  Get-ChildItem -Path $categoryDir -Directory | ForEach-Object {
    $dir = $_.FullName
    $funcFolderName = $_.Name
    $categoryName = Split-Path -Leaf $categoryDir
    $funcName = "$categoryName-$funcFolderName"
    $displayName = $funcName

  # Check if function exists
  $found = $null
  if ($existingJson.functions) { $found = $existingJson.functions | Where-Object { $_.name -eq $displayName } }

  if (-not $found) {
    # Create function with explicit functionId
    $newId = [guid]::NewGuid().ToString('N')
    # Create function using multipart/form-data fields (Appwrite accepts form fields)
    $createUrl = "$base/functions"
    Write-Host "Creating function via form POST $createUrl"
    $resp = curl.exe -s -X POST $createUrl -H "X-Appwrite-Project: $($env:APPWRITE_PROJECT_ID)" -H "X-Appwrite-Key: $($env:APPWRITE_API_KEY)" -F "functionId=$newId" -F "name=$displayName" -F "runtime=node-18.0" -F "entrypoint=src/main.js" -F "commands=npm install" -F "timeout=900"
    try { $created = $resp | ConvertFrom-Json } catch { Write-Warning "Create function response (non-json): $resp"; $created = $null }
    if ($created) {
      if ($created.PSObject.Properties.Name -contains '$id') { $functionId = $created.'$id' }
      elseif ($created.PSObject.Properties.Name -contains 'id') { $functionId = $created.id }
    }
    if (-not $functionId) { Write-Warning "Could not determine function id for $displayName - response: $resp"; return }
  } else {
    if ($found.PSObject.Properties.Name -contains '$id') { $functionId = $found.'$id' }
    elseif ($found.PSObject.Properties.Name -contains 'id') { $functionId = $found.id }
  }

  $updateBody = @{ 
    name = $displayName
    timeout = 900
    logging = $true
    entrypoint = 'src/main.js'
    commands = 'npm install'
    execute = @('any')
  }
  if ($displayName -eq 'platform-auth-webhook') {
    $updateBody.events = @('users.*.create')
  }
  try {
    Invoke-RestMethod -Method Put -Uri "$base/functions/$functionId" -Headers @{ 'X-Appwrite-Project' = $env:APPWRITE_PROJECT_ID; 'X-Appwrite-Key' = $env:APPWRITE_API_KEY; 'Content-Type' = 'application/json' } -Body ($updateBody | ConvertTo-Json -Depth 6) | Out-Null
  } catch {
    Write-Warning "Function update failed for ${displayName}: $($_.Exception.Message)"
  }

  # Create tar.gz archive of the function folder (Appwrite accepts tar.gz for deployments)
  $tarPath = Join-Path -Path $env:TEMP -ChildPath ("$($funcName).tar.gz")
  if (Test-Path $tarPath) { Remove-Item $tarPath -Force }
  Write-Host "Creating archive $tarPath from $dir"
  tar -C $dir -czf $tarPath .

  # Upload deployment
  if (-not $functionId) { Write-Warning "Skipping deployment for $displayName because functionId is empty"; continue }
  $deployUrl = "$base/functions/$functionId/deployments"
  Write-Host "Uploading deployment for $displayName -> $deployUrl"
  Start-Sleep -Milliseconds 500
  $filename = [System.IO.Path]::GetFileName($tarPath)
  $resp2 = curl.exe -s -X POST $deployUrl -H "X-Appwrite-Project: $($env:APPWRITE_PROJECT_ID)" -H "X-Appwrite-Key: $($env:APPWRITE_API_KEY)" -F "code=@$tarPath;filename=$filename;type=application/gzip" -F "activate=true"
  try { $createdDeploy = $resp2 | ConvertFrom-Json } catch { $createdDeploy = $null }
  if ($createdDeploy) { Write-Host "Deployment response: $($createdDeploy | ConvertTo-Json -Depth 4)" } else { Write-Warning "Deployment response (non-json or failed): $resp2" }

  # Set common function vars
  $vars = @(
    @{ key='APPWRITE_ENDPOINT'; value = $env:APPWRITE_ENDPOINT; secret = $false },
    @{ key='APPWRITE_PROJECT_ID'; value = $env:APPWRITE_PROJECT_ID; secret = $false },
    @{ key='APPWRITE_API_KEY'; value = $env:APPWRITE_API_KEY; secret = $true },
    @{ key='DATABASE_ID'; value = $env:DATABASE_ID; secret = $false },
    @{ key='BUCKET_INPUTS'; value = $env:BUCKET_INPUTS; secret = $false },
    @{ key='BUCKET_OUTPUTS'; value = $env:BUCKET_OUTPUTS; secret = $false }
  )

  $existingVarsUrl = "$base/functions/$functionId/variables"
  try {
    $existingVars = Invoke-RestMethod -Method Get -Uri $existingVarsUrl -Headers @{ 'X-Appwrite-Project' = $env:APPWRITE_PROJECT_ID; 'X-Appwrite-Key' = $env:APPWRITE_API_KEY }
  } catch { $existingVars = $null }

  foreach ($v in $vars) {
    if (-not $functionId) { Write-Warning "Cannot set var $($v.key) because functionId is empty"; continue }
    $existingVar = $null
    if ($existingVars.variables) { $existingVar = $existingVars.variables | Where-Object { $_.key -eq $v.key } | Select-Object -First 1 }
    $keyPart = ($v.key.ToLower() -replace '[^a-z0-9._-]', '-')
    if ($keyPart.Length -gt 18) { $keyPart = $keyPart.Substring(0, 18) }
    $varId = if ($existingVar -and ($existingVar.PSObject.Properties.Name -contains '$id')) { $existingVar.'$id' } elseif ($existingVar -and ($existingVar.PSObject.Properties.Name -contains 'id')) { $existingVar.id } else { ('var-{0}-{1}' -f $functionId.Substring(0,8), $keyPart).Substring(0, [Math]::Min(36, ('var-{0}-{1}' -f $functionId.Substring(0,8), $keyPart).Length)) }
    $varUrl = if ($existingVar) { "$base/functions/$functionId/variables/$varId" } else { "$base/functions/$functionId/variables" }
    $payloadVar = @{ variableId = $varId; key = $v.key; value = $v.value; secret = $v.secret }
    try {
      $jsonVar = Invoke-RestMethod -Method $(if ($existingVar) { 'Put' } else { 'Post' }) -Uri $varUrl -Headers @{ 'X-Appwrite-Project' = $env:APPWRITE_PROJECT_ID; 'X-Appwrite-Key' = $env:APPWRITE_API_KEY; 'Content-Type' = 'application/json' } -Body ($payloadVar | ConvertTo-Json -Depth 6)
      Write-Host "Set var $($v.key) -> $($jsonVar | ConvertTo-Json -Depth 4)"
    } catch {
      Write-Warning "Set var response for $($v.key): $($_.Exception.Message)"
    }
  }
  }
}

Write-Host "Function deployment script finished. Review Appwrite console for deployments." 