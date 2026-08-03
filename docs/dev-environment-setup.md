# 開発環境セットアップ手順書 — Azure DevOps × VS Code × Claude Code

> **この文書の目的**: 複数のPC（個人・会社）から同じプロジェクトを継続して開発できる環境を作る。会社環境は Microsoft 中心（Entra ID / Microsoft 365）で、GitHub の組織アカウントがない前提。
>
> 上から順に実施すれば環境が完成する。既に済んでいる項目は飛ばしてよい。

---

## 0. 先に全体像 — 考える / 作る / 残す

道具が3つあるので、まず役割を決めておく。ここが曖昧だと「どれで何をするか」で毎回迷う。

| 層 | 道具 | 役割 |
|---|---|---|
| **考える** | Claude Code | 方針を決める・疑問を解く・調べる・設計判断をする |
| **作る** | VS Code | 実装する・動かす・テストする・目で見て詰める |
| **残す** | Azure DevOps | 成果と履歴を保管する・レビュー・自動化 |

思考 → 実装 → 保管、という素直な流れ。**判断が要ることは Claude Code で壁打ちし、手を動かす実装は VS Code、その結果はすべて Azure DevOps に置く。**

### この分け方で最も注意すべき一点

**「考える層」の成果は、放っておくと消える。**

Claude Code との会話で決めた方針・設計判断・調査結果は、チャットの中にしか存在しない。チャット履歴も Claude のメモリも**環境やアカウントをまたいで共有されない**。別のPCで、別のアカウントで開いた Claude は、その結論を一切知らない。

したがって規律はひとつ。

> **会話で決まったことは、その場で `CLAUDE.md` か `docs/` に書いてコミットする。**

Claude Code はどの環境でもリポジトリ内の `CLAUDE.md` を自動で読む。ここに書いておけば、次に誰がどこで開いても同じ前提から始められる。**「考える層」を Azure DevOps に保管する手段が、この2つのファイル**（詳細は §4.3）。

### もうひとつの規律

**正本は常にリモートリポジトリ。** 作業開始時に `git pull`、終了時に push。ローカルにだけ変更を溜めない。複数PCで乖離しないための唯一の規律。

### 補足 — 境界は絶対ではない

実装であっても、**複数ファイルにまたがる機械的な作業（一括リネーム、パターンの横展開、影響範囲の調査）は Claude Code の方が速い**。機械が網羅して並べ、人が選ぶ、という配分で考えるとよい。逆に、1〜2行の直しや「余白をもう少し」のような目で見て決める調整は、頼むより自分で直した方が速い。

---

## 1. Azure DevOps を立ち上げる

### 1.1 なぜ Azure DevOps か

会社に GitHub アカウントがなくても、**職場の Microsoft アカウント（Entra ID）でそのままサインインできる**。中身は標準の git なので、git の知識・VS Code・Claude Code はすべてそのまま使える。GitLab を持ち込む理由はない（IDが3系統になるだけで、Power Platform 向けの公式ツールもない）。

### 1.2 構造の理解

GitHub より階層が1つ深い。これだけ押さえれば迷わない。

```
組織 (Organization)      ← 会社／チーム単位。dev.azure.com/{組織名}
└─ プロジェクト (Project) ← 案件単位。ここに Repos / Boards / Pipelines がぶら下がる
   └─ リポジトリ (Repository) ← GitHub の repo と同じもの。1プロジェクトに複数可
```

GitHub の各機能との対応:

| GitHub | Azure DevOps |
|---|---|
| リポジトリ | Azure Repos |
| Actions | Azure Pipelines |
| Issues / Projects | Azure Boards |
| Packages | Azure Artifacts |

### 1.3 手順

1. ブラウザで `https://dev.azure.com` を開く
2. **職場の Microsoft アカウントでサインイン**（新規アカウント作成は不要）
3. 組織を作成する（`https://dev.azure.com/{組織名}` になる）
4. プロジェクトを作成する。**Visibility は Private**、Version control は **Git** を選ぶ
5. プロジェクト内で Repos → リポジトリを作成

### 1.4 料金

無料枠に収まる。個人〜少人数なら実質無償で運用できる。

| 項目 | 無料枠 |
|---|---|
| ユーザー | 最初の5人（Basic ライセンス） |
| Azure Repos | プライベートリポジトリ **無制限** |
| Azure Pipelines | Microsoft ホスト 1並列・月30時間 |
| Azure Artifacts | 2 GiB |

### 1.5 つまずいたら

**組織が作成できない場合**、テナントのポリシーで一般ユーザーの組織作成が制限されている可能性が高い。情シスに「Azure DevOps の組織を作成したい」と申請する。**追加のライセンス費用は発生しない**（上記の無料枠のため）ことを添えると話が早い。

---

## 2. Git の認証を通す

ここが唯一の関門。一度通れば以後は意識しなくてよい。

### 2.1 Git Credential Manager

Git for Windows に同梱されている。インストール時に有効化されていれば、**初回の clone / push でブラウザのサインイン画面が開き、多要素認証も含めて完了する**。以降はトークンがキャッシュされ、再入力を求められない。

### 2.2 Entra ID トークンを既定にする（推奨）

個人アクセストークン（PAT）より安全で、組織のポリシーとも整合する。最初に一度だけ実行する。

```bash
git config --global credential.azreposCredentialType oauth
```

### 2.3 clone する

URL の形式が GitHub と違い、**`_git` が挟まる**。ここを間違えると 404 になる。

```bash
git clone https://dev.azure.com/{組織名}/{プロジェクト名}/_git/{リポジトリ名}
```

clone URL は Azure DevOps の Repos 画面右上の「Clone」ボタンからコピーできる。手で組み立てるより確実。

### 2.4 既存のローカルリポジトリを Azure Repos に繋ぐ場合

```bash
git remote add origin https://dev.azure.com/{組織名}/{プロジェクト名}/_git/{リポジトリ名}
```

すでに別の origin がある場合は、先に `git remote remove origin` してから実行する。

### 2.5 認証エラーからの復旧

パスワード変更後などに、キャッシュされた資格情報が古くなって認証エラーになることがある。捨てて入れ直す。

```bash
git config --global --unset credential.helper
```

この後に `git config --global credential.helper manager` を実行し、再度 clone / push すると再認証が走る。Windows の「資格情報マネージャー」から `git:https://dev.azure.com/{組織名}` のエントリを削除しても同じ効果がある。

---

## 3. VS Code を整える

実装の主戦場。ここを快適にしておくと効果が大きい。

### 3.1 Azure Repos との接続に特別な準備は不要

Azure Repos は標準の git なので、**VS Code の組み込み Git がそのまま使える**。サイドバーのソース管理からコミット・プッシュ・ブランチ切り替え・差分レビューまで完結する。専用拡張は必須ではない。

PR の作成はブラウザで行うのが素直。コマンドで済ませたい場合は Azure CLI に `az repos pr create` がある。

### 3.2 プロジェクト設定はリポジトリで共有する

**これが複数PC問題の VS Code 版の答え。** リポジトリに `.vscode/` を作って git に含めておくと、別のPCで clone した瞬間に同じ環境が再現される。

| ファイル | 役割 |
|---|---|
| `.vscode/extensions.json` | 推奨拡張のリスト。プロジェクトを開くと VS Code が「インストールしますか」と促す |
| `.vscode/settings.json` | フォーマッタ・保存時整形など、PC間で揃えたい設定 |
| `.vscode/launch.json` | 開発サーバやデバッガの起動構成 |

**個人の好み（テーマ・キーバインド・フォント）は Settings Sync**（Microsoft アカウントでサインイン）で同期する。**プロジェクト固有の設定はリポジトリ、個人の好みは Settings Sync** と分けるのが定石。両方を混ぜるとチームに自分の趣味を押し付けることになる。

### 3.3 このプロジェクト（`demo/app`）での実務

`demo/app` は React + TypeScript + Vite 構成で、テストが34件ある。VS Code の地力がそのまま効く。

```bash
cd demo/app && npm run dev
```

保存した瞬間に画面へ反映される（HMR）。UI の微調整はこれが最速。

```bash
cd demo/app && npm test
```

Vitest のテスト。VS Code のテストエクスプローラーから個別実行や失敗行へのジャンプもできる。

```bash
cd demo/app && npm run build:demo
```

公開用の自己完結 HTML（`demo/index.html`）を再生成する。

TypeScript の型エラーはエディタ上に即座に出る。`ctn-schema.json` を単一ソースにしている設計なので、スキーマと実装のズレを型が拾ってくれる。この恩恵は VS Code で開いている間ずっと効く。

---

## 4. Claude Code を繋ぐ

### 4.1 VS Code 拡張を入れる

Claude Code には VS Code 拡張がある。入れると **Claude の変更が VS Code の差分ビューアに表示される**ので、ターミナルとエディタを往復せずに検収できる。最初に入れる価値が最も高い設定。

### 4.2 Azure DevOps の MCP サーバー（任意）

作業項目・PR・ビルドの情報を Claude から直接読み書きしたい場合に設定する。

⚠️ **重要な注意点**: Azure DevOps の MCP サーバーにはリモート版とローカル版があり、**リモート版は Claude Code に対応していない**（Microsoft のドキュメントに Claude Code / Claude Desktop / Cursor / Codex は Entra 認証フロー未対応と明記）。**ローカル版を使う。** Node.js 20 以上が必要。

```bash
claude mcp add ado -- npx -y @azure-devops/mcp {組織名}
```

MCP サーバー自体は無料（Azure DevOps の通常料金のみ）。VS Code の Copilot エージェントモードから使う場合はリモート版が使える — 同じ MCP でもクライアントによって使える版が違う点に注意。

### 4.3 CLAUDE.md を正本にする ★最重要

§0 で触れた「考える層の成果を残す」具体策。Claude Code は**どの環境・どのアカウントでも、リポジトリ内の `CLAUDE.md` を自動で読み込む**。

| 書く場所 | 何を書くか |
|---|---|
| `CLAUDE.md` | 常に効く前提・設計原則・触ってはいけないもの・ビルド手順 |
| `docs/` | 個別テーマの詳細（本書のような手順書、調査結果、設計判断の記録） |

守る規律は2つ。

1. **会話で決めた設計判断は、その場で昇格させる。** 後でまとめてやろうとすると必ず消える
2. **「前回の会話で決めた」に依存した書き方をしない。** 読み手（別環境の Claude、数ヶ月後の自分）はその会話を知らない。前提から書く

これがプロジェクトの脳をアカウント側からリポジトリ側に移す、ということ。**コードだけ共有しても文脈は共有されない** ため、この一手間が複数環境開発の成否を分ける。

---

## 5. 日常の流れ

```bash
git pull
```

作業開始時。必ず最初に実行する。

以降は次の判断軸で道具を選ぶ。

| やりたいこと | どこで |
|---|---|
| 方針を決める・疑問を解く・調べる | Claude Code |
| 複数ファイルの変更・調査・リファクタ | Claude Code |
| 実装する・1〜2行の直し・目で見る調整 | VS Code |
| 動くかの確認・テスト実行 | VS Code のターミナル＋ブラウザ |
| **決まったことを書き残す** | **`CLAUDE.md` / `docs/` にコミット** |
| マージ・レビュー・履歴・自動化 | Azure DevOps |

作業が一段落したら push する。1人が複数PCを使う場合、ブランチを切らず `main` に直接コミットする運用（トランクベース）で十分。同時並行で別の作業が走りそうなときだけブランチと PR を使う。

**セッションを終える前のチェック**: 今日決めたことのうち、次に開く人（別PCの自分・別アカウントの Claude）が知らないと困ることは書き残したか。

---

## 6. トラブルシュート

| 症状 | 原因と対処 |
|---|---|
| 組織が作成できない | テナントポリシーによる制限。情シスに申請（§1.5） |
| clone が 404 になる | URL に `_git` が入っていない（§2.3） |
| 毎回サインインを求められる | 資格情報キャッシュの不整合。§2.5 で入れ直す |
| push が rejected される | リモートに未取得のコミットがある。`git pull` してから push |
| MCP が繋がらない | リモート版を指定している。ローカル版に変更（§4.2） |
| 別PCの変更が見当たらない | pull していない、または相手が push していない |

---

## 7. 将来: Power Platform の自動デプロイ

本プロジェクトの本番実装（Dataverse ＋ モデル駆動型アプリ）を運用に乗せる段階で、Azure DevOps を選んだ利点が出る。

**Power Platform Build Tools for Azure DevOps** という Microsoft 公式の拡張機能があり、次をパイプラインのタスクとして組める。

- ソリューションのエクスポート／インポート
- 開発環境 → 検証環境 → 本番環境へのデプロイ
- ソリューションチェッカーによる静的解析

GitHub にも同等の Actions が存在するが、公式ドキュメント上「Azure DevOps 機能のサブセット」と位置づけられており機能の厚みが違う。

CSV（コンピュータ化システムバリデーション）の観点でも、**デプロイが人手作業ではなく記録の残るパイプラインになる**点は査察対応で効く。着手は Phase 2 以降でよい。

---

## 出典

本文中の仕様はすべて Microsoft Learn の一次情報で確認済み。

- Azure DevOps 無料枠・課金: `learn.microsoft.com/azure/devops/organizations/billing/overview`
- Azure Repos 認証: `learn.microsoft.com/azure/devops/repos/git/auth-overview`
- Git Credential Manager: `learn.microsoft.com/azure/devops/repos/git/set-up-credential-managers`
- Azure DevOps MCP Server: `learn.microsoft.com/azure/devops/mcp-server/mcp-server-overview`
- Power Platform Build Tools: `learn.microsoft.com/power-platform/alm/devops-build-tools`
