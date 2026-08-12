// ============================================================================
// hostStyles.ts — SharePoint ページ内でホストするための上書きスタイル（手編集可）
// ----------------------------------------------------------------------------
// styles.generated.ts は demo/app の index.css をそのまま .ctnApp スコープへ
// 変換したもの。元は「ブラウザのビューポート全体を占有する SPA」前提なので、
// SharePoint の Web パーツ枠に収めるための差分だけをここで当てる。
// 生成CSSの後に注入すること（同詳細度なら後勝ち）。
//
// 対象は index.css で 100vh / position:fixed を使っている箇所:
//   body, .app        … height:100vh
//   .scrim            … position:fixed（ドロワー背景）
//   .drawer           … position:fixed + height:100vh
//   .modal-scrim      … position:fixed（ウィザード・XMLプレビュー）
//   .toast            … position:fixed
// ============================================================================

export const CTN_HOST_CSS: string = `
/* Web パーツはページの一部。ビューポート高ではなく指定された高さに収める */
.ctnApp{
  height: var(--ctn-host-height, 820px);
  overflow: hidden;
  margin: 0;
  padding: 0;
  /* position:absolute な子（scrim/drawer/modal/toast）の包含ブロックにする */
  position: relative;
  /* ページ側の z-index スタックと混ざらないようにする */
  isolation: isolate;
}
.ctnApp .app{ height: 100%; }

/* オーバーレイをビューポートではなく Web パーツ枠に閉じ込める。
   position:fixed のままだと SharePoint のページ全体を覆ってしまう。 */
.ctnApp .scrim,
.ctnApp .modal-scrim{ position: absolute; }
.ctnApp .drawer{ position: absolute; height: 100%; }
.ctnApp .toast{ position: absolute; }
`;
