# ctn-spfx — CTN Suite 方式B(React + SharePoint / SPFx)

治験届管理システム **CTN Suite** を、追加ライセンス¥0(Microsoft 365 のみ)で運用するための
**SPFx Web パーツ + SharePoint リスト**実装リポジトリ。

- UI・ドメインロジックの単一ソースは [`splaika/ctn-prototype`](https://github.com/splaika/ctn-prototype) の `demo/app`(無変更を維持)
- 本リポジトリは SPFx 側の実装・プロビジョニング・ドキュメントを保持する

## ドキュメント

| ファイル | 内容 |
| --- | --- |
| [`docs/spfx-methodology.md`](docs/spfx-methodology.md) | **方法論**: なぜ方式Bか、従来構成(Code App / Dataverse構想)との詳細比較、設計トレードオフ |
| [`docs/ctn-spfx-migration-brief.md`](docs/ctn-spfx-migration-brief.md) | **実装ブリーフ**: Claude Code 向けの実装手順・リスト設計・フェーズ・受け入れ基準 |
| [`CLAUDE.md`](CLAUDE.md) | Claude Code のエントリポイント(読む順序と絶対条件) |

## クイックスタート(実装)

```bash
# 隣接ディレクトリに単一ソースをクローン
git clone https://github.com/splaika/ctn-prototype.git ../ctn-prototype

# あとは Claude Code に:
#   「CLAUDE.md と docs/ を読んで Phase 0 から実装して」
```

## 位置づけ(3行)

1. Code Apps 構成は全ユーザーに Power Apps Premium が必要 → 方式Bは **M365 のみで全員入力可**
2. React UI・採番/期限/XML生成ロジック・テスト34件を**無傷で流用**(データ層のみ SharePoint 実装に差し替え)
3. 本番構想(Dataverse + プラグイン)を置き換えない**¥0運用検証版**。移行パスは方法論 §8 参照
