param(
  [string[]]$Suites = @(),
  [string]$Browser = '',
  [uint32[]]$Seed = @(),
  [ValidateRange(1,600)][int]$TimeoutSeconds = 90,
  [ValidateRange(1,16)][int]$Parallel = 1,
  [switch]$Gen
)
# Native Windows runner: isolated headless browsers (one per -Parallel worker), a fresh tab per suite, no npm dependencies.
# Usage from PowerShell: .\tests\run-tests.ps1 -Suites parties,troopxp [-Seed 1,2] [-Parallel 4] [-Gen]
# -Gen: the generated world (the page's address gets gen=1: data/world.js WORLD.gen, doc/WORLD_DESIGN.md, 15.2).
# Output: "== suite" (and "# seed=N"), the suite's lines (PASS/FAIL/EXC/ERR/INFO...), then "# N pass, N fail, N.N s".
# The last lines ("# summary: ...") total every suite; the exit code is 1 if any line of any suite reads FAIL, EXC or ERR.
$ErrorActionPreference = 'Stop'
if (!$Browser) {
  $Browser = @('C:\Program Files\Google\Chrome\Application\chrome.exe', 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') |
    Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (!$Browser) { throw 'No Chrome or Edge found.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
if (!$Suites.Count) {
  # every suite in tests/ (not tests/visual: screenshot scenes and reports, run by name; not the harness nor the test kit)
  $Suites = @(Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.js' | Where-Object { $_.BaseName -notin @('harness', 'kit') } | Sort-Object Name | ForEach-Object BaseName)
}
foreach ($suite in $Suites) { if ($suite -notmatch '^(visual/)?\w+$') { throw "Invalid suite name: $suite" } }
$runs = @(); foreach ($suite in $Suites) {
  if ($Seed.Count) { foreach ($value in $Seed) { $runs += [pscustomobject]@{Index=$runs.Count; Suite=$suite; Seed=$value} } }
  else { $runs += [pscustomobject]@{Index=$runs.Count; Suite=$suite; Seed=$null} }
}
$queue = New-Object 'Collections.Concurrent.ConcurrentQueue[object]'
foreach ($run in $runs) { $queue.Enqueue($run) }

# One worker: its own browser and profile, taking suites off the shared queue until it is empty; emits one result per run.
$worker = {
  param($Queue, [string]$Browser, [string]$ProjectRoot, [int]$TimeoutSeconds, [bool]$Gen)
  $ErrorActionPreference = 'Stop'
  $state = @{ id = 0 }
  function Invoke-Cdp($Socket, [string]$Method, $Params = @{}) {
    $id = ++$state.id
    $bytes = [Text.Encoding]::UTF8.GetBytes((@{id=$id; method=$Method; params=$Params} | ConvertTo-Json -Depth 20 -Compress))
    $deadline = New-Object Threading.CancellationTokenSource
    $deadline.CancelAfter($TimeoutSeconds * 1000)
    try {
      $Socket.SendAsync([ArraySegment[byte]]::new($bytes), [Net.WebSockets.WebSocketMessageType]::Text, $true, $deadline.Token).GetAwaiter().GetResult() | Out-Null
      do {
        $stream = New-Object IO.MemoryStream
        try {
          do {
            $buffer = New-Object byte[] 65536
            $frame = $Socket.ReceiveAsync([ArraySegment[byte]]::new($buffer), $deadline.Token).GetAwaiter().GetResult()
            if ($frame.MessageType -eq [Net.WebSockets.WebSocketMessageType]::Close) { throw 'Test browser closed the connection.' }
            $stream.Write($buffer, 0, $frame.Count)
          } until ($frame.EndOfMessage)
          $reply = [Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
        } finally { $stream.Dispose() }
      } until ($reply.id -eq $id)
      if ($reply.error) { throw ($reply.error | ConvertTo-Json -Compress) }
      return $reply.result
    } finally { $deadline.Dispose() }
  }
  # A reused profile: a brand-new one costs Chrome 10-20 s of set-up before its first page loads. Each worker locks a numbered
  # slot under %TEMP%\ashmark-tests (a slot whose browser is still alive is skipped); its file:// storage is cleared below.
  $slotRoot = Join-Path ([IO.Path]::GetTempPath()) 'ashmark-tests'
  New-Item -ItemType Directory -Force -Path $slotRoot | Out-Null
  $slotLock = $null; $testProfile = $null
  for ($slot = 0; $slot -lt 32 -and !$slotLock; $slot++) {
    try { $slotLock = [IO.File]::Open((Join-Path $slotRoot "profile$slot.lock"), 'OpenOrCreate', 'ReadWrite', 'None') } catch { continue }
    $dir = Join-Path $slotRoot "profile$slot"; $chromeLock = Join-Path $dir 'lockfile'
    try { if (Test-Path -LiteralPath $chromeLock) { Remove-Item -LiteralPath $chromeLock -Force } ; $testProfile = $dir }
    catch { $slotLock.Dispose(); $slotLock = $null }
  }
  if (!$testProfile) { $testProfile = Join-Path $slotRoot ('fresh-' + [guid]::NewGuid().ToString('N')) }
  New-Item -ItemType Directory -Force -Path $testProfile | Out-Null
  Remove-Item -LiteralPath (Join-Path $testProfile 'DevToolsActivePort') -Force -ErrorAction SilentlyContinue
  $browserProcess = $null
  $run = $null
  $cleared = $false
  try {
    $browserArgs = @('--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
      '--host-resolver-rules="MAP * ~NOTFOUND"', '--allow-file-access-from-files', '--remote-debugging-port=0', ('--user-data-dir="' + $testProfile + '"'), 'about:blank')
    $browserProcess = Start-Process -FilePath $Browser -ArgumentList $browserArgs -WindowStyle Hidden -PassThru
    $portFile = Join-Path $testProfile 'DevToolsActivePort'
    $startup = [Diagnostics.Stopwatch]::StartNew()
    $port = $null
    # (the browser may still be writing the file, or hold it open: retry instead of failing on the first read)
    while (!$port) {
      if ($browserProcess.HasExited -or $startup.Elapsed.TotalSeconds -gt $TimeoutSeconds) { throw 'Test browser did not start.' }
      try { if (Test-Path -LiteralPath $portFile) { $port = @(Get-Content -LiteralPath $portFile)[0] } } catch { $port = $null }
      if ($port -notmatch '^\d+$') { $port = $null; Start-Sleep -Milliseconds 100 }
    }
    $endpoint = 'http://127.0.0.1:' + $port
    while ($Queue.TryDequeue([ref]$run)) {
      $target = $null; $socket = $null
      $clock = [Diagnostics.Stopwatch]::StartNew()
      try {
        $target = Invoke-RestMethod -Method Put -Uri "$endpoint/json/new?about:blank" -TimeoutSec 10
        $socket = New-Object Net.WebSockets.ClientWebSocket
        $socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
        # (saves and settings left in the reused profile by an earlier run)
        if (!$cleared) { Invoke-Cdp $socket 'Storage.clearDataForOrigin' @{origin='file://'; storageTypes='local_storage,indexeddb'} | Out-Null; $cleared = $true }
        $pageUrl = ([Uri](Join-Path $ProjectRoot 'Ashmark.html')).AbsoluteUri + '?test=' + $run.Suite
        if ($null -ne $run.Seed) { $pageUrl += '&seed=' + $run.Seed }
        if ($Gen) { $pageUrl += '&gen=1' }
        Invoke-Cdp $socket 'Page.navigate' @{url=$pageUrl} | Out-Null
        $out = ''
        do {
          $value = Invoke-Cdp $socket 'Runtime.evaluate' @{expression="document.getElementById('OUT')?.textContent || ''"; returnByValue=$true}
          $out = $value.result.value
          if (!$out) { Start-Sleep -Milliseconds 50 }
        } until ($out -or $clock.Elapsed.TotalSeconds -gt $TimeoutSeconds)
        if (!$out) { $out = 'FAIL no output (the page or suite did not finish)' }
      } catch {
        $out = 'ERR runner: ' + $_.Exception.Message
      } finally {
        if ($socket) { $socket.Dispose() }
        if ($target) { try { Invoke-RestMethod -Uri "$endpoint/json/close/$($target.id)" -TimeoutSec 10 | Out-Null } catch {} }
      }
      [pscustomobject]@{Index=$run.Index; Suite=$run.Suite; Seed=$run.Seed; Out=[string]$out; Ms=$clock.Elapsed.TotalMilliseconds}
      $run = $null
    }
  } catch {
    # the browser failed: report the suite it held; the other workers (or the summary) account for the rest
    if ($run) { [pscustomobject]@{Index=$run.Index; Suite=$run.Suite; Seed=$run.Seed; Out='ERR runner: ' + $_.Exception.Message; Ms=0} }
    else { [pscustomobject]@{Index=-1; Suite=''; Seed=$null; Out='ERR runner: ' + $_.Exception.Message; Ms=0} }
  } finally {
    # Only terminate the browser we launched (with its child processes), never an existing user browser session.
    if ($browserProcess -and !$browserProcess.HasExited) {
      # closed through DevTools it shuts down cleanly (and leaves its profile in order for the next run); killed if it will not
      try {
        $version = Invoke-RestMethod -Uri "$endpoint/json/version" -TimeoutSec 5
        $socket = New-Object Net.WebSockets.ClientWebSocket
        $socket.ConnectAsync([Uri]$version.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
        try { Invoke-Cdp $socket 'Browser.close' | Out-Null } catch {}
        $socket.Dispose()
      } catch {}
      # (taskkill's own messages go to cmd's nul: in Windows PowerShell a native command's stderr would stop the script)
      if (!$browserProcess.WaitForExit(5000)) { try { & cmd.exe /c "taskkill /PID $($browserProcess.Id) /T /F >nul 2>&1" } catch {}; $browserProcess.WaitForExit(5000) | Out-Null }
    }
    if ($slotLock) { $slotLock.Dispose() }
  }
}

$totals = @{pass=0; fail=0; ms=0.0; failing=New-Object Collections.Generic.List[string]; workerErrors=New-Object Collections.Generic.List[string]}
function Write-Result($r) {
  if ($r.Index -lt 0) { Write-Output $r.Out; $totals.workerErrors.Add($r.Out); return }
  Write-Output "== $($r.Suite)"
  if ($null -ne $r.Seed) { Write-Output ('# seed=' + $r.Seed) }
  Write-Output $r.Out
  # count every line: a suite may print a multi-line block, so a first-line filter would hide failures
  $lines = $r.Out -split "`r?`n"
  $pass = @($lines | Where-Object { $_ -match '^PASS( |$)' }).Count
  $fail = @($lines | Where-Object { $_ -match '^(FAIL|EXC|ERR)( |$)' }).Count
  Write-Output ('# {0} pass, {1} fail, {2:N1} s' -f $pass, $fail, ($r.Ms / 1000))
  $totals.pass += $pass; $totals.fail += $fail; $totals.ms += $r.Ms
  if ($fail) { $totals.failing.Add($(if ($null -ne $r.Seed) { "$($r.Suite) (seed $($r.Seed))" } else { $r.Suite })) }
}

$wall = [Diagnostics.Stopwatch]::StartNew()
$printed = @{}
$workers = [Math]::Min($Parallel, [Math]::Max(1, $runs.Count))
if ($workers -eq 1) {
  & $worker $queue $Browser $projectRoot $TimeoutSeconds $Gen.IsPresent | ForEach-Object { Write-Result $_; $printed[$_.Index] = $true }
} else {
  $pool = [runspacefactory]::CreateRunspacePool(1, $workers); $pool.Open()
  $jobs = @(foreach ($i in 1..$workers) {
    $ps = [powershell]::Create(); $ps.RunspacePool = $pool
    [void]$ps.AddScript($worker).AddArgument($queue).AddArgument($Browser).AddArgument($projectRoot).AddArgument($TimeoutSeconds).AddArgument($Gen.IsPresent)
    $in = New-Object 'Management.Automation.PSDataCollection[psobject]'; $in.Complete()
    $out = New-Object 'Management.Automation.PSDataCollection[psobject]'
    [pscustomobject]@{PS=$ps; Out=$out; Handle=$ps.BeginInvoke($in, $out); Read=0}
  })
  try {
    # print results in suite order as they arrive
    $done = @{}; $next = 0
    do {
      $busy = @($jobs | Where-Object { !$_.Handle.IsCompleted }).Count
      foreach ($j in $jobs) { while ($j.Read -lt $j.Out.Count) { $r = $j.Out[$j.Read]; $j.Read++; if ($r.Index -lt 0) { Write-Result $r } else { $done[$r.Index] = $r } } }
      while ($done.ContainsKey($next)) { Write-Result $done[$next]; $printed[$next] = $true; $done.Remove($next); $next++ }
      if ($busy) { Start-Sleep -Milliseconds 100 }
    } while ($busy)
    foreach ($k in @($done.Keys | Sort-Object)) { Write-Result $done[$k]; $printed[$k] = $true }
  } finally {
    foreach ($j in $jobs) { try { $j.PS.EndInvoke($j.Handle) | Out-Null } catch { $totals.workerErrors.Add('ERR runner: ' + $_.Exception.Message) }; $j.PS.Dispose() }
    $pool.Close(); $pool.Dispose()
  }
}
# a run no worker reached (its browser failed) still counts as a failure
foreach ($run in $runs) { if (!$printed.ContainsKey($run.Index)) { Write-Result ([pscustomobject]@{Index=$run.Index; Suite=$run.Suite; Seed=$run.Seed; Out='ERR runner: not run (no test browser)'; Ms=0}) } }
Write-Output ('# summary: {0} runs, {1} pass, {2} fail, suites {3:N1} s, wall {4:N1} s, {5} browser(s){6}' -f $runs.Count, $totals.pass, $totals.fail, ($totals.ms / 1000), $wall.Elapsed.TotalSeconds, $workers, $(if ($Gen) { ', gen=1' } else { '' }))
if ($totals.failing.Count) { Write-Output ('# failing: ' + ($totals.failing -join ', ')) }
if ($totals.fail -or $totals.failing.Count -or $totals.workerErrors.Count) { exit 1 }
exit 0
