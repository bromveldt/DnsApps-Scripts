for ($i = 1; $i -le 3; $i++) {
  New-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\dot3svc\MigrationData' -Name 'dot3svcMigrationDone' -Value 0 -PropertyType DWORD -Force -ErrorAction SilentlyContinue
  Restart-Service -Name dot3svc -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 30
}