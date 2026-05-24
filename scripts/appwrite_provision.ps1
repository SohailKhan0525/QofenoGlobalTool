<#
Script: appwrite_provision.ps1
Purpose: Create collection attributes, indexes and deploy simple functions to Appwrite via REST API.

Usage: Run from PowerShell in repo root. It reads .env.server at repo root for credentials.
  .\scripts\appwrite_provision.ps1

Important: This script performs API calls using the APPWRITE_API_KEY in .env.server. Keep it secret.
#>

Write-Host "Loading .env.server..."
$envFile = Join-Path -Path (Get-Location) -ChildPath '.env.server'
if (-not (Test-Path $envFile)) {
  $alt = Join-Path -Path (Get-Location) -ChildPath 'QofenoGlobalTool\.env.server'
  if (Test-Path $alt) { $envFile = $alt } else { Write-Error ".env.server not found in repo root or QofenoGlobalTool folder"; exit 1 }
}

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^(\w+)=(.*)$') { Set-Item -Path env:$($matches[1]) -Value $matches[2] }
}

if (-not $env:APPWRITE_API_KEY) { Write-Error "APPWRITE_API_KEY not set in .env.server"; exit 1 }

$headers = @{
  'X-Appwrite-Project' = $env:APPWRITE_PROJECT_ID
  'X-Appwrite-Key' = $env:APPWRITE_API_KEY
  'Content-Type' = 'application/json'
}

function Invoke-AppwritePostJson {
  param($url, $obj)
  $body = $obj | ConvertTo-Json -Depth 12
  Write-Host "POST $url -> payload:`n$body"
  try {
    $resp = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $body -ContentType 'application/json'
    return $resp
  } catch {
    Write-Warning "Request failed: $($_.Exception.Message)"
    return $_.Exception.Response.Content.ReadAsStringAsync().Result
  }
}

function Create-Attribute {
  param($collectionId, $payload)
  $urlBase = "$($env:APPWRITE_ENDPOINT)/databases/$($env:DATABASE_ID)/collections/$collectionId/attributes"
  $type = $payload.type
  switch ($type) {
    'string' {
      $url = "$urlBase/string"
      $body = @{ }
      $body.key = $payload.key
      if ($null -ne $payload.size) { $body.size = $payload.size }
      if ($null -ne $payload.required) { $body.required = $payload.required }
      if ($null -ne $payload.array) { $body.array = $payload.array }
    }
    'integer' {
      $url = "$urlBase/integer"
      $body = @{ }
      $body.key = $payload.key
      if ($null -ne $payload.required) { $body.required = $payload.required }
      if ($null -ne $payload.array) { $body.array = $payload.array }
    }
    'boolean' {
      $url = "$urlBase/boolean"
      $body = @{ }
      $body.key = $payload.key
      if ($null -ne $payload.required) { $body.required = $payload.required }
    }
    'datetime' {
      $url = "$urlBase/datetime"
      $body = @{ }
      $body.key = $payload.key
      if ($null -ne $payload.required) { $body.required = $payload.required }
    }
    default {
      Write-Warning "Unsupported attribute type: $type"
      return $null
    }
  }

  return Invoke-AppwritePostJson -url $url -obj $body
}

function Create-Index {
  param($collectionId, $payload)
  $url = "$($env:APPWRITE_ENDPOINT)/databases/$($env:DATABASE_ID)/collections/$collectionId/indexes"
  return Invoke-AppwritePostJson -url $url -obj $payload
}

Write-Host "Creating attributes and indexes for all collections defined in the spec..."

$collections = @{
  'tools' = @(
    @{ key='slug'; type='string'; size=256; required=$true; array=$false },
    @{ key='name'; type='string'; size=256; required=$true; array=$false },
    @{ key='description'; type='string'; size=1024; required=$true; array=$false },
    @{ key='category'; type='string'; size=128; required=$true; array=$false },
    @{ key='is_free'; type='boolean'; required=$true },
    @{ key='is_new'; type='boolean'; required=$false },
    @{ key='function_id'; type='string'; size=128; required=$true; array=$false },
    @{ key='icon'; type='string'; size=1024; required=$false; array=$false },
    @{ key='tags'; type='string'; size=256; required=$false; array=$true },
    @{ key='max_file_size_free'; type='integer'; required=$false },
    @{ key='max_file_size_pro'; type='integer'; required=$false },
    @{ key='accepted_types'; type='string'; size=256; required=$false; array=$true },
    @{ key='output_type'; type='string'; size=128; required=$false; array=$false },
    @{ key='created_at'; type='datetime'; required=$false },
    @{ key='updated_at'; type='datetime'; required=$false }
  )

  'users_meta' = @(
    @{ key='user_id'; type='string'; size=128; required=$true; array=$false },
    @{ key='plan'; type='string'; size=32; required=$true; array=$false },
    @{ key='plan_expires_at'; type='datetime'; required=$false },
    @{ key='payment_ref'; type='string'; size=256; required=$false; array=$false },
    @{ key='tools_used'; type='integer'; required=$false },
    @{ key='files_processed'; type='integer'; required=$false },
    @{ key='storage_used'; type='integer'; required=$false },
    @{ key='created_at'; type='datetime'; required=$false },
    @{ key='updated_at'; type='datetime'; required=$false }
  )

  'tool_executions' = @(
    @{ key='user_id'; type='string'; size=128; required=$false; array=$false },
    @{ key='tool_slug'; type='string'; size=128; required=$true; array=$false },
    @{ key='tool_name'; type='string'; size=256; required=$true; array=$false },
    @{ key='category'; type='string'; size=128; required=$true; array=$false },
    @{ key='status'; type='string'; size=64; required=$true; array=$false },
    @{ key='input_filename'; type='string'; size=512; required=$false; array=$false },
    @{ key='input_size'; type='integer'; required=$false },
    @{ key='output_filename'; type='string'; size=512; required=$false; array=$false },
    @{ key='output_size'; type='integer'; required=$false },
    @{ key='download_url'; type='string'; size=1024; required=$false; array=$false },
    @{ key='download_url_expires'; type='datetime'; required=$false },
    @{ key='error_message'; type='string'; size=1024; required=$false; array=$false },
    @{ key='duration_ms'; type='integer'; required=$false },
    @{ key='created_at'; type='datetime'; required=$false },
    @{ key='updated_at'; type='datetime'; required=$false }
  )

  'tool_views' = @(
    @{ key='tool_slug'; type='string'; size=128; required=$true; array=$false },
    @{ key='count'; type='integer'; required=$true }
  )

  'tool_likes' = @(
    @{ key='user_id'; type='string'; size=128; required=$true; array=$false },
    @{ key='tool_slug'; type='string'; size=128; required=$true; array=$false },
    @{ key='created_at'; type='datetime'; required=$false }
  )

  'recently_viewed' = @(
    @{ key='user_id'; type='string'; size=128; required=$true; array=$false },
    @{ key='tool_slug'; type='string'; size=128; required=$true; array=$false },
    @{ key='tool_name'; type='string'; size=256; required=$true; array=$false },
    @{ key='category'; type='string'; size=128; required=$true; array=$false },
    @{ key='viewed_at'; type='datetime'; required=$true }
  )

  'subscriptions' = @(
    @{ key='user_id'; type='string'; size=128; required=$true; array=$false },
    @{ key='plan'; type='string'; size=64; required=$true; array=$false },
    @{ key='status'; type='string'; size=64; required=$true; array=$false },
    @{ key='payment_provider'; type='string'; size=64; required=$true; array=$false },
    @{ key='payment_sub_id'; type='string'; size=256; required=$true; array=$false },
    @{ key='payment_customer'; type='string'; size=256; required=$false; array=$false },
    @{ key='current_period_start'; type='datetime'; required=$false },
    @{ key='current_period_end'; type='datetime'; required=$false },
    @{ key='cancelled_at'; type='datetime'; required=$false },
    @{ key='created_at'; type='datetime'; required=$false }
  )

  'whats_new' = @(
    @{ key='title'; type='string'; size=256; required=$true; array=$false },
    @{ key='body'; type='string'; size=2048; required=$true; array=$false },
    @{ key='type'; type='string'; size=64; required=$true; array=$false },
    @{ key='author'; type='string'; size=128; required=$true; array=$false },
    @{ key='published'; type='boolean'; required=$false },
    @{ key='created_at'; type='datetime'; required=$false },
    @{ key='updated_at'; type='datetime'; required=$false }
  )

  'contact_messages' = @(
    @{ key='name'; type='string'; size=256; required=$true; array=$false },
    @{ key='email'; type='string'; size=256; required=$true; array=$false },
    @{ key='subject'; type='string'; size=512; required=$true; array=$false },
    @{ key='message'; type='string'; size=4096; required=$true; array=$false },
    @{ key='read'; type='boolean'; required=$false },
    @{ key='created_at'; type='datetime'; required=$false }
  )
}

foreach ($collectionId in $collections.Keys) {
  Write-Host "Provisioning collection: $collectionId"
  $attrs = $collections[$collectionId]
  foreach ($a in $attrs) {
    try { Create-Attribute -collectionId $collectionId -payload $a | Out-Null } catch { Write-Warning ("Failed attribute {0} on {1}: {2}" -f $a.key, $collectionId, $_) }
  }

  # Create common indexes per collection if applicable
  if ($collectionId -eq 'tools') {
    Create-Index -collectionId 'tools' -payload @{ key='unique_slug'; type='unique'; attributes=@('slug') }
    Create-Index -collectionId 'tools' -payload @{ key='category_idx'; type='key'; attributes=@('category') }
  }
  if ($collectionId -eq 'users_meta') {
    Create-Index -collectionId 'users_meta' -payload @{ key='user_id_unique'; type='unique'; attributes=@('user_id') }
  }
  if ($collectionId -eq 'tool_executions') {
    Create-Index -collectionId 'tool_executions' -payload @{ key='created_at_desc'; type='key'; attributes=@('created_at') }
    Create-Index -collectionId 'tool_executions' -payload @{ key='status_idx'; type='key'; attributes=@('status') }
  }
  if ($collectionId -eq 'tool_views') {
    Create-Index -collectionId 'tool_views' -payload @{ key='tool_slug_unique'; type='unique'; attributes=@('tool_slug') }
  }
  if ($collectionId -eq 'tool_likes') {
    Create-Index -collectionId 'tool_likes' -payload @{ key='user_tool_unique'; type='unique'; attributes=@('user_id','tool_slug') }
  }
  if ($collectionId -eq 'recently_viewed') {
    Create-Index -collectionId 'recently_viewed' -payload @{ key='user_view_unique'; type='unique'; attributes=@('user_id','tool_slug') }
  }
}

Write-Host "Provision script finished. Review results in Appwrite console and run additional deployments for functions." 
