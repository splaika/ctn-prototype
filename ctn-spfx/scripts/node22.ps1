# ============================================================================
# node22.ps1 — SPFx ビルド用に Node 22 を PATH へ載せる
# ----------------------------------------------------------------------------
# SPFx 1.21.1 が対応する Node は 22 まで。開発機の既定が Node 24 だと
# gulp が動かないため、ビルド前にこれを dot-source する。
#
#   . .\scripts\node22.ps1          （ctn-spfx 直下から）
#   . C:\dev\ctn-prototype\ctn-spfx\scripts\node22.ps1
#
# 「dot-source」（先頭のピリオド）が必要。普通に実行すると子プロセスの
# 環境変数を変えるだけで、呼び出し元の PATH は変わらない。
#
# fnm で入れた Node 22 を探す。未導入なら:
#   fnm install 22
#
# fnm 以外（nvm-windows、公式インストーラ等）を使う場合は $candidates に
# 探索先を足す。以前はこのファイルがリポジトリ外（C:\dev\node22.ps1）にあり、
# 別の開発者が環境を再現できなかったため、リポジトリ内へ移した。
# ============================================================================

$ErrorActionPreference = 'Stop'

# Node 22 の実体を探す候補。上から順に見る
$candidates = @(
    "$env:APPDATA\fnm\node-versions",              # fnm (Windows 既定)
    "$env:LOCALAPPDATA\fnm\node-versions",         # fnm (別の配置)
    "$env:APPDATA\nvm"                             # nvm-windows
)

$found = $null
foreach ($base in $candidates) {
    if (-not (Test-Path $base)) { continue }
    $dir = Get-ChildItem $base -Directory -ErrorAction SilentlyContinue |
        Where-Object Name -like 'v22*' |
        Sort-Object Name |
        Select-Object -Last 1
    if (-not $dir) { continue }

    # fnm は <version>\installation\node.exe、nvm-windows は <version>\node.exe
    foreach ($rel in @('installation', '')) {
        $p = if ($rel) { Join-Path $dir.FullName $rel } else { $dir.FullName }
        if (Test-Path (Join-Path $p 'node.exe')) { $found = $p; break }
    }
    if ($found) { break }
}

if (-not $found) {
    throw @"
Node 22 が見つかりません。探した場所:
$($candidates -join "`n")

fnm を使っている場合:
    fnm install 22

別の方法で入れている場合は scripts/node22.ps1 の `$candidates` に探索先を足してください。
"@
}

$env:Path = $found + ';' + $env:Path

# SPFx のウォッチャーは長時間動かすとヒープを使い切る（既定 4GB。2日放置で落ちた実績あり）
if (-not $env:NODE_OPTIONS) { $env:NODE_OPTIONS = '--max-old-space-size=8192' }

$v = & node --version
Write-Host "Node $v を PATH に載せました（$found）" -ForegroundColor Green
if ($v -notlike 'v22*') {
    Write-Warning "期待は v22 系です。PATH の前方に別の Node が残っている可能性があります。"
}
