# Setup Windows Task Scheduler for Offer Automator
# Run this script as Administrator:
#   Right-click PowerShell -> Run as Administrator
#   cd C:\Projects\offer-automator
#   .\setup-scheduler.ps1

$taskBaseName = "OfferAutomator"
$batPath = Join-Path $PSScriptRoot "run.bat"
$workingDir = $PSScriptRoot

# Brasilia times (GMT-3) -> convert to local Windows time automatically
# Using E. South America Standard Time timezone
$brTimeZone = [TimeZoneInfo]::FindSystemTimeZoneById("E. South America Standard Time")
$localTimeZone = [TimeZoneInfo]::Local

$brasiliaHours = @(9, 12, 19)

foreach ($hour in $brasiliaHours) {
    $taskName = "${taskBaseName}_${hour}h"

    # Convert Brasilia time to local time
    $brTime = [DateTime]::Today.AddHours($hour)
    $brDateTimeOffset = New-Object DateTimeOffset($brTime, $brTimeZone.GetUtcOffset($brTime))
    $localTime = $brDateTimeOffset.ToOffset($localTimeZone.GetUtcOffset([DateTime]::Now)).DateTime
    $triggerTime = $localTime.ToString("HH:mm")

    # Remove existing task if present
    $existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "Removed existing task: $taskName"
    }

    $action = New-ScheduledTaskAction -Execute $batPath -WorkingDirectory $workingDir
    $trigger = New-ScheduledTaskTrigger -Daily -At $triggerTime
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Description "Offer Automator - batch at ${hour}h BRT" `
        -RunLevel Highest | Out-Null

    Write-Host "Created task: $taskName -> runs daily at $triggerTime (local) = ${hour}:00 BRT"
}

Write-Host ""
Write-Host "Done! 3 tasks created. Verify with:"
Write-Host "  Get-ScheduledTask -TaskName 'OfferAutomator_*'"
Write-Host ""
Write-Host "To remove all tasks later:"
Write-Host "  Get-ScheduledTask -TaskName 'OfferAutomator_*' | Unregister-ScheduledTask -Confirm:`$false"
