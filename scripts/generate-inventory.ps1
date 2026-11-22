
$ErrorActionPreference = "Stop"

# Project root is the parent of scripts
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$TerraformDir = Join-Path $ProjectRoot "terraform"

Write-Host "Terraform directory: $TerraformDir"

if (-not (Test-Path $TerraformDir)) {
    throw "Terraform directory not found: $TerraformDir"
}

# Read Terraform outputs
Push-Location $TerraformDir
try {
    $TerraformOutput = terraform output -json | ConvertFrom-Json
}
finally {
    Pop-Location
}

# Extract private IPs
$AppIP = $TerraformOutput.app_server_private_ip.value
$MonitorIP = $TerraformOutput.monitor_server_private_ip.value

if (-not $AppIP -or -not $MonitorIP) {
    throw "Could not retrieve server private IPs."
}

# Generate inventory
$Inventory = @"
[app]
app-server ansible_host=$AppIP

[monitor]
monitor-server ansible_host=$MonitorIP

[all:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=/home/ubuntu/.ssh/investment-research-key
ansible_python_interpreter=/usr/bin/python3
"@

$LocalInventory = Join-Path $ProjectRoot "inventory.ini"

$Inventory | Set-Content -Path $LocalInventory -Encoding ascii

Write-Host "`nInventory generated successfully:"
Get-Content $LocalInventory
