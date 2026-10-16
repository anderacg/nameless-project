param(
  [string[]]$Suites = @(),
  [string]$Browser = '',
  [uint32[]]$Seed = @(),
  [ValidateRange(1,600)][int]$TimeoutSeconds = 90
)
# Native Windows runner: one isolated headless browser, a fresh tab per suite, no npm dependencies.
# Usage from PowerShell: .\tests\run-tests.ps1 -Suites parties,troopxp
$ErrorActionPreference = 'Stop'
if (!$Browser) {
  $Browser = @('C:\Program Files\Google\Chrome\Application\chrome.exe', 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') |
    Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (!$Browser) { throw 'No Chrome or Edge found.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
if (!$Suites.Count) {
  $Suites = @(Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.js' | Where-Object BaseName -ne 'harness' | Sort-Object Name | ForEach-Object BaseName)
}
foreach ($suite in $Suites) { if ($suite -notmatch '^(visual/)?\w+$') { throw "Invalid suite name: $suite" } }
$testProfile = Join-Path ([IO.Path]::GetTempPath()) ('ashmark-tests-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testProfile | Out-Null
$browserProcess = $null
$socket = $null
$script:commandId = 0
function Invoke-Cdp($Socket, [string]$Method, $Params = @{}) {
  $id = ++$script:commandId
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
$failures = 0
try {
  $browserArgs = @('--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
    '--host-resolver-rules="MAP * ~NOTFOUND"', '--allow-file-access-from-files', '--remote-debugging-port=0', ('--user-data-dir="' + $testProfile + '"'), 'about:blank')
  $browserProcess = Start-Process -FilePath $Browser -ArgumentList $browserArgs -WindowStyle Hidden -PassThru
  $portFile = Join-Path $testProfile 'DevToolsActivePort'
  $startup = [Diagnostics.Stopwatch]::StartNew()
  while (!(Test-Path -LiteralPath $portFile)) {
    if ($browserProcess.HasExited -or $startup.Elapsed.TotalSeconds -gt $TimeoutSeconds) { throw 'Test browser did not start.' }
    Start-Sleep -Milliseconds 100
  }
  $port = (Get-Content -LiteralPath $portFile)[0]
  $endpoint = 'http://127.0.0.1:' + $port
  $runs = @(); foreach ($suite in $Suites) {
    if ($Seed.Count) { foreach ($value in $Seed) { $runs += @{Suite=$suite; Seed=$value} } }
    else { $runs += @{Suite=$suite; Seed=$null} }
  }
  foreach ($run in $runs) {
    $suite = $run.Suite
    Write-Output "== $suite"
    $target = $null
    try {
      $target = Invoke-RestMethod -Method Put -Uri "$endpoint/json/new?about:blank" -TimeoutSec 10
      $socket = New-Object Net.WebSockets.ClientWebSocket
      $socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
      $pageUrl = ([Uri](Join-Path $projectRoot 'Ashmark.html')).AbsoluteUri + '?test=' + $suite
      if ($null -ne $run.Seed) { Write-Output ('# seed=' + $run.Seed); $pageUrl += '&seed=' + $run.Seed }
      Invoke-Cdp $socket 'Page.navigate' @{url=$pageUrl} | Out-Null
      $clock = [Diagnostics.Stopwatch]::StartNew()
      $out = ''
      do {
        $value = Invoke-Cdp $socket 'Runtime.evaluate' @{expression="document.getElementById('OUT')?.textContent || ''"; returnByValue=$true}
        $out = $value.result.value
        if (!$out) { Start-Sleep -Milliseconds 100 }
      } until ($out -or $clock.Elapsed.TotalSeconds -gt $TimeoutSeconds)
      if (!$out) { $out = 'FAIL no output (the page or suite did not finish)' }
      Write-Output $out
      if ($out -match '(?m)^(FAIL|EXC|ERR)( |$)') { $failures++ }
    } catch {
      Write-Output ('ERR runner: ' + $_.Exception.Message)
      $failures++
    } finally {
      if ($socket) { $socket.Dispose(); $socket = $null }
      if ($target) { Invoke-RestMethod -Uri "$endpoint/json/close/$($target.id)" -TimeoutSec 10 | Out-Null }
    }
  }
} finally {
  if ($socket) { $socket.Dispose() }
  # Only terminate the browser we launched, not any existing user browser session.
  if ($browserProcess -and !$browserProcess.HasExited) { Stop-Process -Id $browserProcess.Id -ErrorAction SilentlyContinue; $browserProcess.WaitForExit(5000) | Out-Null }
  # Keep the isolated temporary profile: a crash or timeout may leave browser children holding its files.
}
if ($failures) { exit 1 }
exit 0
