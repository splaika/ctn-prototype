# SharePoint カスタム Web パーツ 展開依頼

> このファイルはそのままメール本文へ貼り付けられる形で書いています。
> 角括弧 `[ ]` の箇所だけご自身の情報に置き換えてください。

---

**件名**: SharePoint アプリ カタログへの Web パーツ登録のお願い（治験届デモ用・1サイト限定）

**宛先**: [IT部門ご担当者様]

---

## 背景

治験届（CTN）作成支援システムの社内検証用デモを、以下の SharePoint サイトで動かしたいと考えています。

- 対象サイト: `https://seventoone.sharepoint.com/sites/ClinicalTrialSubmissionAssistant-Demo`
- 利用者: 現在3名、将来的に約30名を想定
- 追加ライセンス費用: なし（Microsoft 365 のみで動作します）

サイト所有者権限では実施できない作業が2点あるため、お願いに上がりました。
いずれも SharePoint 管理者権限が必要な、仕様上の制約による依頼です。

---

## 依頼1（必須）: アプリ カタログへのパッケージ登録

**作業内容**

1. SharePoint 管理センター → アプリ カタログ →「SharePoint 用アプリ」ライブラリを開く
2. 添付の `ctn-suite.sppkg` をアップロード
3. 表示される「展開」ダイアログで内容を確認し、承認

**所要時間**: 2〜3分

**ご確認いただきたい点（先回りで回答します）**

| 観点 | 内容 |
| --- | --- |
| 追加の API アクセス許可 | **要求しません**。パッケージに `webApiPermissionRequests` の定義がありません（Microsoft Graph 等への追加権限なし） |
| 動作権限 | サインインユーザー自身の権限で動作します。ユーザーが元々アクセスできないデータは参照できません |
| 影響範囲 | **サイト単位**です。`skipFeatureDeployment` を `false` にしているため、承認後もサイト所有者が明示的に「アプリを追加」したサイトでしか利用できません。承認と同時に全サイトへ配置されることはありません |
| 分離ドメイン | 使用しません（`isDomainIsolated: false`） |
| 外部への通信 | ありません。データは対象サイト内の SharePoint リストにのみ保存されます |
| 技術スタック | SharePoint Framework (SPFx) 1.21.1 / React 17。Microsoft の標準的な拡張方式です |

**ソースコードの確認をご希望の場合**

https://github.com/splaika/ctn-prototype の `ctn-spfx/` 配下が該当します。
ビルド手順は同ディレクトリの `README-spfx.md` に記載しています。

---

## 依頼2（必須）: リスト作成スクリプトの実行、または Entra ID アプリ登録

デモで使う SharePoint リスト（9個・計83列）を作成する必要があります。
PnP.PowerShell 2.x 以降は対話ログインに Entra ID のアプリ登録を要求し、
その作成にテナント管理者の同意が必要なため、こちらもお願いに上がりました。

**どちらか一方をお願いします。**

### 案A: スクリプトを実行していただく（1回で完了）

添付の `provision-lists.ps1` を、対象サイトに対して1回実行してください。

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
.\provision-lists.ps1 -SiteUrl 'https://seventoone.sharepoint.com/sites/ClinicalTrialSubmissionAssistant-Demo' -ClientId '<Entra アプリID>'
```

- **冪等です。** 既存のリスト・列・グループは作り直しません。複数回実行しても安全です
- 既存列の型変更は行いません（データ損失を避ける設計にしています）
- 作成されるのは対象サイト内のリスト9個と、ロール用サイトグループ4個のみです
- 作成される列の一覧は、必要であれば `columns.md` をお送りします

### 案B: Entra ID アプリ登録だけ作成していただく

以下を1回実行して同意いただければ、以降のスクリプト実行は私が行います。
今後の再実行やリスト調整で毎回お手数をかけずに済むため、**可能であればこちらを希望します。**

```powershell
Register-PnPEntraIDAppForInteractiveLogin -ApplicationName 'PnP-PowerShell-CTN' -Tenant seventoone.onmicrosoft.com -Interactive
```

作成後、アプリケーション（クライアント）ID をお知らせください。

---

## 依頼3（任意・急ぎません）: サイト URL の短縮

現在の URL が長く、関係者への共有時に扱いにくいため、可能であれば短縮を希望します。
サイト アドレスの変更は SharePoint 管理センターからのみ可能なため、お願いに上がりました。

- 現在: `/sites/ClinicalTrialSubmissionAssistant-Demo`
- 希望: `/sites/ctn-demo` （他の候補でも構いません）

急ぎではないため、依頼1・2が完了した後で問題ありません。

---

## 添付ファイル

| ファイル | サイズ | 用途 |
| --- | --- | --- |
| `ctn-suite.sppkg` | 約 1.2 MB | 依頼1 でアップロードしていただくパッケージ |
| `provision-lists.ps1` | 約 35 KB | 依頼2 の案A を選ぶ場合のみ |

---

## 完了後の作業（こちらで実施します）

1. サイトへアプリを追加
2. Web パーツをページへ配置し、データソースを SharePoint リストへ切り替え
3. ロール用グループへの担当者割り当て

ご不明な点があればお知らせください。

[お名前 / 部署 / 連絡先]
