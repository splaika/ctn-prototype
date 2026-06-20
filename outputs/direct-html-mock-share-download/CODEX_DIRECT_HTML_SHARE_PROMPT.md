# Codex向け: モックを単一HTMLで共有用に出力する指示

別PCや別スレッドで同じ作業を依頼するときは、以下をそのままCodexに貼り付ける。

```text
このプロジェクトのReact/Viteモックを、社内メンバーへメール添付で共有できる形にしてください。

重要な条件:
- ZIPにはしない
- 複数ファイル構成にしない
- CSS/JavaScriptをすべてHTML内に埋め込んだ単一HTMLにする
- 共有用ファイル名は CTN_UX_Mock_DIRECT.html にする
- 受け手はこのHTML 1ファイルだけをPCに保存し、EdgeまたはChromeで開けば画面遷移・入力操作を確認できる状態にする
- Outlook / Teams / SharePoint のプレビューで開く前提にはしない
- C:/Users/... のローカルパスを共有リンクとして案内しない

作業内容:
1. npm run build などでReactモックをビルドする
2. dist/index.html が参照しているCSSとJSを読み取り、1つのHTMLに埋め込む
3. outputs/email-direct/CTN_UX_Mock_DIRECT.html として出力する
4. 外部 script src や link href が残っていないことを確認する
5. メンバー向けに「PCに保存してEdge/Chromeで開く」と案内する短い文面も作る

最終的に渡すべきファイルは CTN_UX_Mock_DIRECT.html 1つだけです。
```

短縮版:

```text
React/Viteモックを、ZIPではなく、CSS/JS埋め込み済みの単一HTMLとして出力してください。ファイル名は CTN_UX_Mock_DIRECT.html。外部ファイル参照なしで、Edge/Chromeで直接開けば画面遷移・入力操作できるようにしてください。
```

## このプロジェクトで確定した共有ルール

- 共有ファイルは `CTN_UX_Mock_DIRECT.html` 1つだけ。
- ZIP化しない。
- 複数ファイル構成にしない。
- SharePoint / Teams / Outlook のプレビューでは開かせない。
- 受け手には「PCに保存してEdgeまたはChromeで開く」と案内する。
- 入力内容は保存されない。画面遷移と入力操作確認用のモックとして共有する。
