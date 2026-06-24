@echo off
setlocal enabledelayedexpansion
:: Launch restart-unbound.cmd at start-up if DNSCrypt client proxy is up
:: restart-unbound.cmd does not have a waiting loop
:: Run the command:
:: copy run-restart-unbound.cmd C:\Users\<Username>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
:: Number of seconds to wait
set /A SECS=6
:: Number of iterations
set /A REPS=10
set "PROXY_SVC_NAME=DNSCrypt client proxy"
set "VALIDATOR_SVC_NAME=Unbound"
:: Inspect the parameters (looking for '-force' and '-v')
set "ARGS=%*"
echo %DATE% %TIME% ARGS=[%ARGS%]
:: Init switches
set /A VERBOSE=0
set /A FORCE_RESTART=0
:: Verify if -force is a parameter
if "x!ARGS!" neq "x" (
  set "FARGS=!ARGS:-force=!"
  set "VARGS=!ARGS:-v=!"
  echo %DATE% %TIME% FARGS="!FARGS!"
  echo %DATE% %TIME% VARGS="!VARGS!"
  :: Check if -force was found and replaced
  if "x!ARGS!" neq "x!FARGS!" set /A FORCE_RESTART=1
  if "x!ARGS!" neq "x!VARGS!" set /A VERBOSE=1
)
echo %DATE% %TIME% VERBOSE=!VERBOSE!
echo %DATE% %TIME% FORCE_RESTART=!FORCE_RESTART!

:: Do not restart Unbound unless it is explicitly requested
:is_validator_running
FOR /F "delims=" %%s IN ('net start ^| find /I /c "%VALIDATOR_SVC_NAME%"') DO set /A cnt_validator_svc=%%s
if !VERBOSE! equ 1 echo %DATE% %TIME% is_validator_running? !cnt_validator_svc!
:: Exit is the process
if !cnt_validator_svc! equ 0 (
  echo %DATE% %TIME% Unbound is NOT running; checking %PROXY_SVC_NAME%
) else (
  echo %DATE% %TIME% Unbound is running; force restart? !FORCE_RESTART!
  if !FORCE_RESTART! equ 0 (
    echo %DATE% %TIME% Exiting; pass -force to restart Unbound
    goto eof
  ) else echo %DATE% %TIME% Validator will be restarted
)
:is_proxy_running
echo %DATE% %TIME% REPS=!REPS!
FOR /F "delims=" %%s IN ('net start ^| find /I /c "%PROXY_SVC_NAME%"') DO set /A cnt_proxy_svc=%%s
if !VERBOSE! equ 1 echo %DATE% %TIME% is_proxy_running? !cnt_proxy_svc!
:: Wait and retry until DNSCrypt-proxy is running (up to REPS * SECS seconds)
if !cnt_proxy_svc! equ 0 (
  echo %DATE% %TIME% Proxy %PROXY_SVC_NAME% not running; waiting !REPS! times %SECS% secs 
  timeout /T %SECS% /NOBREAK >nul
  set /A REPS-=1
  if !REPS! GTR 0 goto is_proxy_running else goto do_restart_validator
)
echo %DATE% %TIME% Proxy %PROXY_SVC_NAME% is running

echo %DATE% %TIME% Restarting validator
:: Exec script
:do_restart_validator
pushd
restart-unbound.cmd /debug=1 /tail=1 >restart-unbound.log 2>&1
popd
:eof
endlocal
exit /B 0
