@echo off
:: Launch restart-unbound.cmd at start-up if DNSCrypt client proxy is up
:: restart-unbound.cmd does not have a waiting loop
:: d
:: copy run-restart-unbound.cmd C:\Users\<Username>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
set /A SECS=6
set "SVC=DNSCrypt client proxy"
:start_check
FOR /F "delims=" %%s IN ('net start ^| find /c "%SVC%"') DO set /A cnt_svc=%%s

echo cnt_svc %cnt_svc%

if %cnt_svc% equ 0 (
  echo %DATE% %TIME% %SVC% not running
  timeout /t %SECS% /nobreak >nul
  goto start_check
)
:: Exec script
pushd
restart-unbound.cmd /debug=1 /tail=1 >restart-unbound.log 2>&1
popd
goto eof