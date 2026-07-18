#!/usr/bin/env bash
# ------------------------------------------------------------
# ctn-spfx リポジトリ 一発セットアップ(GitHub CLI 使用)
# 前提: gh インストール済み & `gh auth login` 認証済み
# 使い方: ./setup-github.sh [リポジトリ名] [public|private]
#   例)   ./setup-github.sh ctn-spfx private
# ------------------------------------------------------------
set -euo pipefail
REPO="${1:-ctn-spfx}"
VIS="${2:-private}"
command -v gh >/dev/null 2>&1 || { echo "❌ GitHub CLI (gh) が見つかりません: https://cli.github.com/"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "❌ 未認証です。'gh auth login' を実行してください。"; exit 1; }
[ "$VIS" = "public" ] && VISFLAG="--public" || VISFLAG="--private"
git init -q 2>/dev/null || true
git add .
git commit -q -m "Add methodology and implementation brief for SPFx + SharePoint (方式B)" || echo "(コミット済みの変更なし)"
git branch -M main
echo "▶ リポジトリ $REPO を作成して push します…"
gh repo create "$REPO" $VISFLAG --source=. --remote=origin --push
echo "✅ 完了: $(gh repo view "$REPO" --json url --jq .url)"
