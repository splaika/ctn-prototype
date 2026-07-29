// ===========================================================================
// AUTO-GENERATED — 手編集禁止
// scripts/sync-from-demo.mjs が demo/app/src から生成。再同期で上書きされます。
// 変更は単一ソース demo/app/src/index.css 側で行ってください。
// ===========================================================================

// index.css の全セレクタを .ctnApp スコープへ変換したもの。
// SPFx の CSS ローダーを経由せず、Web パーツが <style> として注入する。

export const CTN_SCOPED_CSS: string = `.ctnApp{
    --navy:#002060; --blue:#238CC5; --blue-soft:#EAF3FA;
    --ink:#101B2D; --ink-2:#46556B; --ink-3:#66707f; --ink-4:#B9C3D1;
    --ink-faint:#8A98AC;                                  /* 装飾/大文字ラベル専用（AA未満を許容） */
    --line:#E6ECF3; --line-2:#F1F5F9; --bg:#F7F9FC; --white:#fff; --surface:#fff;
    --green:#1C8A5B; --green-bg:#E5F4EC;
    --amber:#A9760F; --amber-bg:#FAF0DA;
    --red:#C0392B; --red-bg:#FBE8E5;
    --sh:0 1px 2px rgba(16,27,45,.04); --sh-2:0 10px 30px rgba(16,27,45,.12);
    --r:12px;
    /* radius scale（段階を統一） */
    --r-sm:8px; --r-md:12px; --r-lg:16px; --r-pill:999px;
    /* keyboard focus ring（テーマの accent を使用） */
    --focus:var(--blue);
    /* 強調KPI：カード全体を"やや薄めの意味色"で塗り、文字は白 */
    --kpi-crit:#d95c6a; --kpi-warn:#cf8a3a;
    /* アクセント色に追従する淡色ボーダー（バナー/ノート/ツールバー）。
       配色バリエーション（palette-*）で差し替える */
    --tint-border:#cfe4f3;
    /* ブランドマークのグラデーション終端 */
    --blue-2:#6fc0ec;
  }
  .ctnApp, .ctnApp *{box-sizing:border-box;margin:0;padding:0}
  .ctnApp{font-family:'IBM Plex Sans',sans-serif;font-size:14px;color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased;height:100vh;overflow:hidden}
  .ctnApp.ja{font-family:'Noto Sans JP','IBM Plex Sans',sans-serif}
  .ctnApp button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
  .ctnApp input,.ctnApp select,.ctnApp textarea{font-family:inherit}
  .ctnApp [data-ja]{display:none}
  .ctnApp.ja [data-en]{display:none}
  .ctnApp.ja [data-ja]{display:inline}

  /* grid-template-rows:minmax(0,1fr) forces the single row to the viewport height
     (an implicit auto row would grow to content and break inner scrolling) */
  .ctnApp .app{display:grid;grid-template-columns:212px 1fr;grid-template-rows:minmax(0,1fr);height:100vh;overflow:hidden;color:var(--ink);background:var(--bg)}

  /* sidebar */
  .ctnApp .side{background:var(--navy);color:#fff;display:flex;flex-direction:column}
  .ctnApp .brand{padding:22px 20px 18px;display:flex;align-items:center;gap:11px}
  .ctnApp .brand .m{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--blue),var(--blue-2));display:grid;place-items:center;font-weight:700}
  .ctnApp .brand b{font-size:15px}
  .ctnApp .brand span{display:block;font-size:10.5px;color:#9db4d6;font-weight:400}
  .ctnApp .nav{padding:6px 12px;flex:1}
  .ctnApp .nav a{display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:9px;color:#c6d4ea;font-weight:500;font-size:14px;margin-bottom:3px;transition:.14s}
  .ctnApp .nav a svg{width:18px;height:18px;opacity:.85}
  .ctnApp .nav a:hover{background:rgba(255,255,255,.07);color:#fff}
  .ctnApp .nav a.on{background:var(--blue);color:#fff}
  .ctnApp .nav a.on svg{opacity:1}
  .ctnApp .sfoot{padding:16px 18px;border-top:1px solid rgba(255,255,255,.1);display:flex;gap:10px;align-items:center}
  .ctnApp .sfoot .a{width:30px;height:30px;border-radius:50%;background:#3a6aa3;display:grid;place-items:center;font-weight:600;font-size:12px}
  .ctnApp .sfoot .n{font-size:12.5px;font-weight:500}.ctnApp .sfoot .r{font-size:10.5px;color:#9db4d6}
  .ctnApp .hublink{display:flex;align-items:center;gap:12px;margin:0 12px 8px;padding:9px 13px;border-radius:9px;color:#9db4d6;font-size:12.5px;font-weight:500;cursor:pointer;transition:.14s;border:1px dashed rgba(255,255,255,.14)}
  .ctnApp .hublink svg{width:16px;height:16px;opacity:.8}
  .ctnApp .hublink:hover{background:rgba(255,255,255,.07);color:#fff;border-color:rgba(255,255,255,.28)}
  .ctnApp .hublink .ext{margin-left:auto;font-size:12px}

  /* main */
  .ctnApp .main{display:flex;flex-direction:column;min-width:0;min-height:0}
  .ctnApp .top{height:60px;background:var(--surface);border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 26px;gap:16px;flex:none}
  .ctnApp .top h1{font-size:16px;font-weight:600}
  .ctnApp .top .sp{flex:1}
  .ctnApp .lang{display:flex;border:1px solid var(--line);border-radius:9px;overflow:hidden}
  .ctnApp .lang button{padding:7px 13px;font-size:12px;font-weight:600;color:var(--ink-3)}
  .ctnApp .lang button.on{background:var(--navy);color:#fff}
  .ctnApp .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:9px;font-weight:600;font-size:13px;transition:.14s;white-space:nowrap}
  .ctnApp .btn svg{width:15px;height:15px}
  .ctnApp .btn-p{background:var(--blue);color:#fff}.ctnApp .btn-p:hover{background:#1e7cb1}
  .ctnApp .btn-g{border:1px solid var(--line);color:var(--ink-2);background:var(--surface)}.ctnApp .btn-g:hover{background:var(--line-2);border-color:var(--ink-4)}

  .ctnApp .scroll{flex:1;min-height:0;overflow-y:auto;padding:20px 32px 28px}
  .ctnApp .view{display:none}.ctnApp .view.on{display:block;animation:f .22s ease}
  @keyframes f{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
  .ctnApp .vh{margin-bottom:22px}
  .ctnApp .vh .t{font-size:22px;font-weight:700;letter-spacing:-.3px}
  .ctnApp .vh .s{color:var(--ink-3);font-size:13px;margin-top:4px}

  /* KPI */
  .ctnApp .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
  .ctnApp .kpi{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:18px 20px;box-shadow:var(--sh)}
  .ctnApp .kpi .l{font-size:11.5px;color:var(--ink-3);font-weight:600;text-transform:uppercase;letter-spacing:.5px}
  .ctnApp .kpi .v{font-size:32px;font-weight:700;margin-top:8px;letter-spacing:-1px}
  .ctnApp .kpi .v small{font-size:16px;color:var(--ink-4)}
  .ctnApp .kpi .m{font-size:12px;color:var(--ink-3);margin-top:2px}
  .ctnApp .kpi.hl{border-top:3px solid var(--blue)}

  .ctnApp .card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);overflow:hidden}
  .ctnApp .card-h{padding:16px 20px;border-bottom:1px solid var(--line-2);display:flex;align-items:center;justify-content:space-between}
  .ctnApp .card-h h3{font-size:14px;font-weight:600}
  .ctnApp .card-h .tag{font-size:11.5px;color:var(--ink-3)}

  /* status bar / pills */
  .ctnApp .bar{height:8px;border-radius:5px;background:var(--line);overflow:hidden}
  .ctnApp .bar>i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,var(--blue),#62b6e4);transition:width .45s cubic-bezier(.4,0,.2,1)}
  .ctnApp .bar.g>i{background:linear-gradient(90deg,#23a06b,#46c08a)}
  .ctnApp .bar.a>i{background:linear-gradient(90deg,#cf9426,#e6b653)}
  .ctnApp .bar.r>i{background:linear-gradient(90deg,#d3564b,#e6877d)}
  .ctnApp .pill{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:600;white-space:nowrap}
  .ctnApp .pill::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
  .ctnApp .g{color:var(--green);background:var(--green-bg)} .ctnApp .a{color:var(--amber);background:var(--amber-bg)} .ctnApp .r{color:var(--red);background:var(--red-bg)}

  /* dept summary table */
  .ctnApp .tbl{width:100%;border-collapse:collapse;font-size:13px}
  .ctnApp .tbl th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--ink-3);font-weight:600;padding:11px 20px;border-bottom:1px solid var(--line-2)}
  .ctnApp .tbl td{padding:13px 20px;border-bottom:1px solid var(--line-2);vertical-align:middle}
  .ctnApp .tbl tr:last-child td{border-bottom:none}
  .ctnApp .tbl .nm{font-weight:600}
  .ctnApp .tbl .pcell{display:flex;align-items:center;gap:10px;min-width:150px}
  .ctnApp .tbl .pcell .bar{flex:1}
  .ctnApp .tbl .pcell b{font-size:12.5px;min-width:34px;text-align:right}
  .ctnApp .stcell{display:flex;align-items:center;gap:11px}
  .ctnApp .sbar{height:8px;border-radius:5px;overflow:hidden;display:flex;background:var(--line);width:120px;flex:none}
  .ctnApp .sbar i{height:100%}
  .ctnApp .sbar i.g{background:#23a06b}.ctnApp .sbar i.a{background:#d99a2b}.ctnApp .sbar i.r{background:#d3564b}
  .ctnApp .stnum{font-size:12.5px;display:inline-flex;gap:9px}
  .ctnApp .stnum b{font-weight:600}
  .ctnApp .stnum .cg{color:var(--green)}.ctnApp .stnum .ca{color:var(--amber)}.ctnApp .stnum .cr{color:var(--red)}

  /* filter bar */
  .ctnApp .filters{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);padding:14px 16px;display:flex;align-items:center;gap:18px;margin-bottom:18px;flex-wrap:wrap}
  .ctnApp .fg{display:flex;align-items:center;gap:9px}
  .ctnApp .fg>label{font-size:11px;font-weight:700;color:var(--ink-3);text-transform:uppercase;letter-spacing:.5px}
  .ctnApp .seg{display:flex;background:var(--line-2);border-radius:9px;padding:3px}
  .ctnApp .seg button{padding:7px 13px;border-radius:7px;font-size:12.5px;font-weight:600;color:var(--ink-2);transition:.12s}
  .ctnApp .seg button.on{background:var(--surface);color:var(--navy);box-shadow:var(--sh)}
  .ctnApp select.sel{padding:8px 30px 8px 12px;border:1px solid var(--line);border-radius:9px;font-size:13px;font-weight:600;color:var(--ink);background:var(--surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A98AC' stroke-width='3'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 11px center;-webkit-appearance:none;appearance:none;cursor:pointer}
  .ctnApp .fsp{flex:1}
  .ctnApp .fcount{font-size:12.5px;color:var(--ink-3);font-weight:500}

  /* goal list / tree */
  .ctnApp .glist{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);overflow:hidden}
  .ctnApp .grow{display:grid;grid-template-columns:1fr 168px 116px 96px;gap:14px;align-items:center;padding:14px 20px;border-bottom:1px solid var(--line-2);cursor:pointer;transition:.12s}
  .ctnApp .grow:last-child{border-bottom:none}
  .ctnApp .grow:hover{background:var(--blue-soft)}
  .ctnApp .gh{display:grid;grid-template-columns:1fr 168px 116px 96px;gap:14px;padding:11px 20px;background:var(--line-2);font-size:11px;font-weight:600;color:var(--ink-3);text-transform:uppercase;letter-spacing:.5px}
  .ctnApp .gname{display:flex;align-items:center;gap:10px;min-width:0}
  .ctnApp .tog{width:20px;height:20px;flex:none;display:grid;place-items:center;border-radius:6px;color:var(--ink-3)}
  .ctnApp .tog:hover{background:var(--line)}.ctnApp .tog svg{width:13px;height:13px;transition:.18s}
  .ctnApp .tog.leaf{visibility:hidden}.ctnApp .tog.open svg{transform:rotate(90deg)}
  .ctnApp .lvl{font-size:9.5px;font-weight:700;padding:2.5px 7px;border-radius:6px;letter-spacing:.4px;flex:none}
  .ctnApp .lc{background:var(--navy);color:#fff}.ctnApp .ld{background:var(--blue);color:#fff}.ctnApp .lt{background:#7aa6c9;color:#fff}.ctnApp .li{background:var(--line);color:var(--ink-2)}
  .ctnApp .gtx{min-width:0}.ctnApp .gtx b{display:block;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ctnApp .gtx small{font-size:11.5px;color:var(--ink-3)}
  .ctnApp .gtx small.nolink{color:var(--amber)}
  .ctnApp .own{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink-2);min-width:0}
  .ctnApp .own .a{width:25px;height:25px;border-radius:50%;background:#d2e2f0;color:var(--navy);display:grid;place-items:center;font-size:10px;font-weight:600;flex:none}
  .ctnApp .own span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ctnApp .gp{display:flex;align-items:center;gap:9px}.ctnApp .gp .bar{flex:1}.ctnApp .gp b{font-size:12.5px;min-width:32px;text-align:right}
  .ctnApp .children{display:none}.ctnApp .node.open>.children{display:block}
  .ctnApp .empty{padding:46px;text-align:center;color:var(--ink-4);font-size:13px}

  /* drawer */
  .ctnApp .scrim{position:fixed;inset:0;background:rgba(8,18,36,.34);opacity:0;pointer-events:none;transition:.2s;z-index:40}
  .ctnApp .scrim.on{opacity:1;pointer-events:auto}
  .ctnApp .drawer{position:fixed;top:0;right:0;height:100vh;width:460px;max-width:94vw;background:var(--surface);box-shadow:var(--sh-2);transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);z-index:50;display:flex;flex-direction:column}
  .ctnApp .drawer.on{transform:none}
  .ctnApp .dh{padding:20px 24px;border-bottom:1px solid var(--line);display:flex;gap:12px;align-items:flex-start}
  .ctnApp .dh .x{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--ink-3);flex:none}.ctnApp .dh .x:hover{background:var(--line-2)}
  .ctnApp .dh-t{flex:1;min-width:0}
  .ctnApp .dh-t input.title{font-size:18px;font-weight:700;border:none;width:100%;padding:2px 0;border-bottom:1.5px solid transparent;color:var(--ink)}
  .ctnApp .dh-t input.title:focus{outline:none;border-bottom-color:var(--blue)}
  .ctnApp .db{flex:1;overflow-y:auto;padding:22px 24px}
  .ctnApp .fld{margin-bottom:22px}
  .ctnApp .fld>label{display:block;font-size:11px;font-weight:700;color:var(--ink-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:9px}
  .ctnApp .row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .ctnApp .drawer select.sel,.ctnApp .drawer input.tin{width:100%;padding:9px 12px;border:1px solid var(--line);border-radius:9px;font-size:13px;background-color:var(--surface)}
  .ctnApp .drawer input.tin:focus,.ctnApp .drawer select.sel:focus{outline:none;border-color:var(--blue)}
  .ctnApp .stseg{display:flex;gap:8px}
  .ctnApp .stseg button{flex:1;padding:10px;border:1px solid var(--line);border-radius:9px;font-size:12.5px;font-weight:600;color:var(--ink-3)}
  .ctnApp .stseg button.on.sg{background:var(--green-bg);border-color:var(--green);color:var(--green)}
  .ctnApp .stseg button.on.sa{background:var(--amber-bg);border-color:var(--amber);color:var(--amber)}
  .ctnApp .stseg button.on.sr{background:var(--red-bg);border-color:var(--red);color:var(--red)}

  /* monthly */
  .ctnApp .mo{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--line-2)}
  .ctnApp .mo:last-child{border-bottom:none}
  .ctnApp .mo .mk{font-size:11.5px;font-weight:700;color:var(--navy);min-width:54px;padding-top:2px}
  .ctnApp .mo .mb{flex:1}
  .ctnApp .mo .mr{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .ctnApp .mo .mr .bar{flex:1}.ctnApp .mo .mr b{font-size:12px;min-width:30px;text-align:right}
  .ctnApp .mo .mc{font-size:12.5px;color:var(--ink-2);line-height:1.45}
  .ctnApp .mo .mc.none{color:var(--ink-4)}
  .ctnApp .addmo{background:var(--blue-soft);border-radius:11px;padding:15px 16px;margin-top:6px}
  .ctnApp .addmo .hd{font-size:12px;font-weight:700;color:var(--navy);margin-bottom:11px}
  .ctnApp .addmo .rr{display:flex;align-items:center;gap:10px;margin-bottom:10px}
  .ctnApp .addmo .rr label{font-size:12px;color:var(--ink-2);min-width:60px}
  .ctnApp .addmo input[type=range]{flex:1;accent-color:var(--blue)}
  .ctnApp .addmo b{font-size:13px;min-width:38px;text-align:right;color:var(--navy)}
  .ctnApp .addmo textarea{width:100%;border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-size:13px;resize:vertical;min-height:54px}
  .ctnApp .addmo textarea:focus{outline:none;border-color:var(--blue)}

  .ctnApp .df{padding:15px 24px;border-top:1px solid var(--line);display:flex;gap:10px;align-items:center}
  /* change history */
  .ctnApp .logl{display:flex;gap:10px;padding:11px 0;border-bottom:1px solid var(--line-2)}
  .ctnApp .logl:last-child{border-bottom:none}
  .ctnApp .logl .a{width:24px;height:24px;border-radius:50%;background:var(--blue);color:#fff;display:grid;place-items:center;font-size:10px;font-weight:600;flex:none}
  .ctnApp .logl .lt{font-size:12.5px;color:var(--ink-2);line-height:1.45}
  .ctnApp .logl .lt .kind{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--blue);background:var(--blue-soft);padding:2px 6px;border-radius:5px}
  .ctnApp .logl .lt .note{color:var(--ink)}
  .ctnApp .logl .lm{font-size:10.5px;color:var(--ink-4);margin-top:3px}
  .ctnApp .df .del{color:var(--red);font-weight:600;font-size:12.5px;padding:9px 12px;border-radius:9px}.ctnApp .df .del:hover{background:var(--red-bg)}
  .ctnApp .df .sp{flex:1}

  /* report */
  .ctnApp .rep-top{display:flex;gap:14px;align-items:center;margin-bottom:18px;flex-wrap:wrap}
  .ctnApp .rep{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);overflow:hidden}
  .ctnApp .rep-hd{padding:22px 26px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,#fbfdff,#fff)}
  .ctnApp .rep-hd .ti{font-size:19px;font-weight:700}
  .ctnApp .rep-hd .me{font-size:13px;color:var(--ink-3);margin-top:4px}
  .ctnApp .rep-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid var(--line)}
  .ctnApp .rep-stats .st{padding:18px 24px;border-right:1px solid var(--line-2)}
  .ctnApp .rep-stats .st:last-child{border-right:none}
  .ctnApp .rep-stats .l{font-size:11px;color:var(--ink-3);font-weight:600;text-transform:uppercase;letter-spacing:.5px}
  .ctnApp .rep-stats .v{font-size:26px;font-weight:700;margin-top:6px;letter-spacing:-.5px}
  .ctnApp .rep-stats .v .seg-mini{display:inline-flex;gap:5px;font-size:13px;font-weight:600}
  .ctnApp .rep-tbl{width:100%;border-collapse:collapse;font-size:12.5px}
  .ctnApp .rep-tbl th{position:sticky;top:0;background:var(--line-2);text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--ink-3);font-weight:700;padding:10px 12px;white-space:nowrap}
  .ctnApp .rep-tbl td{padding:11px 12px;border-bottom:1px solid var(--line-2);vertical-align:top}
  .ctnApp .rep-tbl .mcol{text-align:center;font-variant-numeric:tabular-nums;color:var(--ink-2);min-width:42px}
  .ctnApp .rep-tbl .mcol.cur{font-weight:700;color:var(--navy)}
  .ctnApp .rep-tbl .gn{font-weight:600;max-width:230px}
  .ctnApp .rep-tbl .cm{color:var(--ink-2);max-width:240px;font-size:12px}
  .ctnApp .rep-scroll{overflow-x:auto}

  .ctnApp .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(18px);background:var(--navy);color:#fff;padding:12px 22px;border-radius:11px;font-size:13px;font-weight:500;box-shadow:var(--sh-2);opacity:0;pointer-events:none;transition:.24s;z-index:80;display:flex;gap:9px;align-items:center}
  .ctnApp .toast.on{opacity:1;transform:translateX(-50%)}
  .ctnApp .toast svg{width:16px;height:16px;color:#7fe0a8}
  .ctnApp ::-webkit-scrollbar{width:10px;height:10px}.ctnApp ::-webkit-scrollbar-thumb{background:#ccd6e2;border-radius:6px;border:2px solid var(--bg)}

  @media print{
    .ctnApp .side,.ctnApp .top,.ctnApp .rep-top{display:none!important}
    .ctnApp .app{display:block}.ctnApp .scroll{overflow:visible;padding:0}
    .ctnApp .view{display:none!important}.ctnApp #view-report.on{display:block!important}
    .ctnApp .rep{border:none;box-shadow:none}
    .ctnApp{height:auto;overflow:visible}
  }

/* boot / loading screen (PowerProvider) */
.ctnApp .boot{height:100vh;display:grid;place-content:center;justify-items:center;gap:8px;text-align:center;color:var(--ink);font-size:14px}
.ctnApp .boot p{color:var(--ink-3);font-size:12.5px;max-width:360px}
.ctnApp .boot small{color:var(--ink-4);font-size:11px;word-break:break-all;max-width:420px}
.ctnApp .boot code{background:var(--line-2);padding:1px 5px;border-radius:5px}

/* ============================================================
   CTN Suite — additional styles (extends the base design system)
   ============================================================ */
.ctnApp{
  --st-draft:#8A98AC; --st-review:#238CC5; --st-approved:#1C8A5B; --st-submitted:#002060;
  --ty-plan:#238CC5; --ty-change:#A9760F; --ty-term:#C0392B; --ty-comp:#1C8A5B; --ty-dev:#6b7280;
}
.ctnApp .app.ja,.ctnApp .app{font-feature-settings:"palt"}

/* brand two-line */
.ctnApp .brand>div{min-width:0}
.ctnApp .brand b{font-size:14.5px;display:block;line-height:1.1}
.ctnApp .brand span{display:block;font-size:10px;color:#9db4d6;font-weight:400}
.ctnApp .nav a{position:relative}
/* メニュー項目のラベルは折り返さず、省略もせず全文表示（「ロジカルチェック設定」対策） */
.ctnApp .nav a>span:not(.nav-badge){white-space:nowrap;overflow:visible;text-overflow:clip}
.ctnApp .nav-badge{position:absolute;right:11px;background:var(--blue);color:#fff;font-size:10px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:grid;place-items:center;padding:0 5px}
.ctnApp .nav a.on .nav-badge{background:#fff;color:var(--navy)}

/* header extras */
.ctnApp .user-switch{display:flex;align-items:center;gap:8px}
.ctnApp .user-switch .us-label{font-size:10.5px;font-weight:700;color:var(--ink-3);text-transform:uppercase;letter-spacing:.4px}
.ctnApp .user-switch .sel{padding:7px 28px 7px 11px;font-size:12.5px;font-weight:600}

/* KPI variants */
.ctnApp .kpis-6{grid-template-columns:repeat(6,1fr)}
@media(max-width:1200px){.ctnApp .kpis-6{grid-template-columns:repeat(3,1fr)}}
.ctnApp .kpi-click{cursor:pointer;transition:.15s}.ctnApp .kpi-click:hover{border-color:var(--blue);box-shadow:var(--sh-2)}
.ctnApp .kpi-blue{border-top:3px solid var(--blue)} .ctnApp .kpi-green{border-top:3px solid var(--green)}
.ctnApp .kpi-amber{border-top:3px solid var(--amber)} .ctnApp .kpi-red{border-top:3px solid var(--red)}
.ctnApp .kpi .v{font-size:30px}

/* vh header */
.ctnApp .vh .t{font-size:22px;font-weight:700;letter-spacing:-.3px}
.ctnApp .vh .s{color:var(--ink-3);font-size:13px;margin-top:4px}

/* section card */
.ctnApp .sect{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);margin-bottom:18px;overflow:hidden}
.ctnApp .sect-h{padding:15px 20px;border-bottom:1px solid var(--line-2);display:flex;align-items:center;justify-content:space-between;gap:12px}
.ctnApp .sect-h h3{font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px}
.ctnApp .sect-sub{font-size:11.5px;color:var(--ink-3);margin-top:3px}
.ctnApp .sect-b{padding:18px 20px}
.ctnApp .sect-b.nopad{padding:0}
.ctnApp .count-chip{font-size:12px;font-weight:700;min-width:24px;height:24px;border-radius:12px;display:grid;place-items:center;padding:0 8px}
.ctnApp .count-chip.red{background:var(--red-bg);color:var(--red)} .ctnApp .count-chip.amber{background:var(--amber-bg);color:var(--amber)}

/* dashboard alerts */
.ctnApp .dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px}
@media(max-width:980px){.ctnApp .dash-grid{grid-template-columns:1fr}}
.ctnApp .alert-row{display:flex;align-items:flex-start;gap:11px;padding:12px 18px;border-bottom:1px solid var(--line-2)}
.ctnApp .alert-row:last-child{border-bottom:none}
.ctnApp .alert-row.clickable{cursor:pointer}.ctnApp .alert-row.clickable:hover{background:var(--blue-soft)}
.ctnApp .alert-dot{width:9px;height:9px;border-radius:50%;margin-top:5px;flex:none}
.ctnApp .alert-dot.alert{background:var(--red)} .ctnApp .alert-dot.reminder{background:var(--amber)}
.ctnApp .alert-row.sev-med .alert-dot.alert{background:var(--amber)}
.ctnApp .alert-txt{flex:1;min-width:0}
.ctnApp .alert-t{font-size:13px;font-weight:600}
.ctnApp .alert-d{font-size:11.5px;color:var(--ink-2);margin-top:2px;line-height:1.4}
.ctnApp .alert-due{font-size:11px;font-weight:700;color:var(--ink-3);white-space:nowrap}
.ctnApp .empty.small{padding:26px;font-size:12.5px}
.ctnApp .dash-note{font-size:11.5px;color:var(--ink-3);line-height:1.6;background:var(--blue-soft);border:1px solid var(--tint-border);border-radius:10px;padding:12px 16px}

/* notification table */
.ctnApp .ntbl-wrap{overflow-x:auto}
.ctnApp .ntbl{width:100%;border-collapse:collapse;font-size:13px}
.ctnApp .ntbl th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--ink-3);font-weight:700;padding:11px 16px;background:var(--line-2);white-space:nowrap}
.ctnApp .ntbl td{padding:12px 16px;border-bottom:1px solid var(--line-2);vertical-align:middle;white-space:nowrap}
.ctnApp .ntbl tr{cursor:pointer;transition:.1s}
.ctnApp .ntbl tbody tr:hover{background:var(--blue-soft)}
.ctnApp .ntbl .nm{font-weight:700;font-size:13.5px}
.ctnApp .ntbl .tnum{font-variant-numeric:tabular-nums;font-weight:600}
.ctnApp .muted{color:var(--ink-3)} .ctnApp .small{font-size:11.5px}
.ctnApp .kubun-chip{display:inline-block;font-size:11px;font-weight:700;background:var(--blue-soft);color:var(--navy);padding:3px 9px;border-radius:7px}
.ctnApp .dlcell{display:flex;flex-direction:column;font-weight:600;font-size:12.5px}
.ctnApp .dlcell small{font-size:10px;font-weight:700}
.ctnApp .dl-ok{color:var(--ink-2)} .ctnApp .dl-warn{color:var(--amber)} .ctnApp .dl-hot{color:var(--red)} .ctnApp .dl-over{color:var(--red)}
.ctnApp .dl-over small,.ctnApp .dl-hot small{color:var(--red)}

/* status pill / type badge */
.ctnApp .stpill{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;color:#fff}
.ctnApp .stpill::before{content:"";width:6px;height:6px;border-radius:50%;background:#fff;opacity:.9}
.ctnApp .st-draft{background:var(--st-draft)} .ctnApp .st-review{background:var(--st-review)} .ctnApp .st-approved{background:var(--st-approved)} .ctnApp .st-submitted{background:var(--st-submitted)}
.ctnApp .tybadge{display:inline-block;font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap}
/* 一覧・詳細のバッジは「淡色 tint + 枠線」。ソリッド塗り＋白文字のステータスピルと明確に差別化し、彩度を抑える */
.ctnApp .ty-plan{background:var(--ty-plan)} .ctnApp .ty-change{background:var(--ty-change)} .ctnApp .ty-termination{background:var(--ty-term)} .ctnApp .ty-completion{background:var(--ty-comp)} .ctnApp .ty-devDiscontinuation{background:var(--ty-dev)}
.ctnApp .tybadge.ty-plan{color:var(--blue);background:color-mix(in srgb,var(--blue) 12%,transparent);border:1px solid color-mix(in srgb,var(--blue) 26%,transparent)}
.ctnApp .tybadge.ty-change{color:var(--amber);background:color-mix(in srgb,var(--amber) 15%,transparent);border:1px solid color-mix(in srgb,var(--amber) 30%,transparent)}
.ctnApp .tybadge.ty-termination{color:var(--red);background:color-mix(in srgb,var(--red) 12%,transparent);border:1px solid color-mix(in srgb,var(--red) 26%,transparent)}
.ctnApp .tybadge.ty-completion{color:var(--green);background:color-mix(in srgb,var(--green) 12%,transparent);border:1px solid color-mix(in srgb,var(--green) 26%,transparent)}
.ctnApp .tybadge.ty-devDiscontinuation{color:var(--ink-3);background:color-mix(in srgb,var(--ink) 8%,transparent);border:1px solid color-mix(in srgb,var(--ink) 16%,transparent)}

/* search input */
.ctnApp .search{padding:8px 12px;border:1px solid var(--line);border-radius:9px;font-size:13px;min-width:180px}
.ctnApp .search:focus{outline:none;border-color:var(--blue)}

/* 要確認 & required marks */
.ctnApp .unconf{display:inline-flex;align-items:center;gap:4px;font-size:9.5px;font-weight:700;color:var(--amber);background:var(--amber-bg);padding:2px 7px;border-radius:6px;vertical-align:middle}
.ctnApp .unconf svg{width:11px;height:11px}
.ctnApp .reqmark{font-size:10px;font-weight:700;margin-right:5px}
.ctnApp .req-a{color:var(--red)} .ctnApp .req-c{color:var(--amber)} .ctnApp .req-o{color:var(--ink-4)} .ctnApp .req-auto{color:var(--ink-3);font-size:9px;background:var(--line-2);padding:1px 5px;border-radius:5px}
.ctnApp .req-star{color:var(--red);margin-left:3px}

/* forms */
.ctnApp .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 18px}
.ctnApp .form-sub{grid-column:1/-1;margin:18px 0 2px;font-size:11.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--ink-3);border-top:1px solid var(--line-2);padding-top:12px}
@media(max-width:760px){.ctnApp .form-grid{grid-template-columns:1fr}}
.ctnApp .field{display:flex;flex-direction:column;gap:6px}
.ctnApp .field-wide{grid-column:1/-1}
.ctnApp .field>label{font-size:11px;font-weight:700;color:var(--ink-3);text-transform:uppercase;letter-spacing:.4px;display:flex;align-items:center}
.ctnApp .field-hint{font-size:11px;color:var(--ink-3);line-height:1.4}
.ctnApp .tin,.ctnApp .ta{width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:9px;font-size:13px;background:var(--surface);color:var(--ink)}
.ctnApp .tin:focus,.ctnApp .ta:focus{outline:none;border-color:var(--blue)}
.ctnApp .tin:disabled,.ctnApp .sel:disabled{background:var(--line-2);color:var(--ink-2);cursor:not-allowed}
.ctnApp .tin.err{border-color:var(--red)}
.ctnApp .ta{min-height:64px;resize:vertical;line-height:1.5}
.ctnApp .tin-sm{padding:6px 9px;font-size:12.5px} .ctnApp .tin-xs{padding:5px 7px;font-size:12px;width:80px}
.ctnApp .mt4{margin-top:4px}
.ctnApp .sel-sm{padding:6px 26px 6px 9px;font-size:12.5px}
.ctnApp .inline{display:flex;gap:8px;align-items:center}
.ctnApp .inline .sel{flex:1}
.ctnApp .chk{display:inline-flex;align-items:center;gap:8px;font-size:13px;margin-top:12px;cursor:pointer}

/* chips (change locations) */
.ctnApp .chips{display:flex;flex-wrap:wrap;gap:8px}
.ctnApp .chip{font-size:12px;font-weight:600;padding:6px 12px;border:1px solid var(--line);border-radius:18px;color:var(--ink-2);background:var(--surface);transition:.12s}
.ctnApp .chip:hover:not(:disabled){border-color:var(--blue)}
.ctnApp .chip.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.ctnApp .chip:disabled{opacity:.55;cursor:not-allowed}

/* buttons additions */
.ctnApp .btn-danger{background:var(--red-bg);color:var(--red)}.ctnApp .btn-danger:hover{background:#f5d5d0}
.ctnApp .btn-ghost{color:var(--ink-2)}.ctnApp .btn-ghost:hover{background:var(--line-2)}
.ctnApp .btn-sm{padding:7px 12px;font-size:12.5px}
.ctnApp .btn:disabled{opacity:.5;cursor:not-allowed}
.ctnApp .icon-btn{width:30px;height:30px;border-radius:8px;display:inline-grid;place-items:center;color:var(--ink-3);border:1px solid var(--line);background:var(--surface)}
.ctnApp .icon-btn:hover{background:var(--line-2);color:var(--ink)}
.ctnApp .icon-btn svg{width:15px;height:15px}
.ctnApp .icon-btn.danger{color:var(--red)}.ctnApp .icon-btn.danger:hover{background:var(--red-bg)}
.ctnApp .icon-btn.sm{width:24px;height:24px;border:none}.ctnApp .icon-btn.sm svg{width:13px;height:13px}

/* detail */
.ctnApp .detail{max-width:1080px}
.ctnApp .detail-top{display:flex;align-items:center;gap:14px;margin-bottom:16px;flex-wrap:wrap}
.ctnApp .back{font-size:13px;font-weight:600;color:var(--ink-2);padding:7px 12px;border-radius:8px}
.ctnApp .back:hover{background:var(--line-2)}
.ctnApp .detail-title{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.ctnApp .dt-code{font-size:19px;font-weight:700;letter-spacing:-.3px}
.ctnApp .dt-count{font-size:13px;font-weight:600;color:var(--ink-3);font-variant-numeric:tabular-nums}
.ctnApp .detail-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}

/* workflow bar — dot stacked above label so the connector never crosses text */
.ctnApp .wf{display:flex;align-items:flex-start;gap:6px;margin-bottom:16px;background:var(--surface);border:1px solid var(--line);border-radius:11px;padding:14px 16px 12px;box-shadow:var(--sh)}
.ctnApp .wf-step{display:flex;flex-direction:column;align-items:center;gap:7px;flex:1;position:relative}
.ctnApp .wf-step:not(:last-child)::after{content:"";position:absolute;top:13px;left:calc(50% + 18px);width:calc(100% - 36px);height:2px;background:var(--line);z-index:0}
.ctnApp .wf-dot{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;background:var(--line);color:var(--ink-3);flex:none;position:relative;z-index:1}
.ctnApp .wf-name{font-size:12px;font-weight:600;color:var(--ink-3);text-align:center;white-space:nowrap}
.ctnApp .wf-step.done .wf-dot{background:var(--green);color:#fff} .ctnApp .wf-step.done .wf-name{color:var(--ink-2)}
.ctnApp .wf-step.done:not(:last-child)::after{background:var(--green)}
.ctnApp .wf-step.cur .wf-dot{background:var(--blue);color:#fff;box-shadow:0 0 0 4px var(--blue-soft)} .ctnApp .wf-step.cur .wf-name{color:var(--navy)}

/* banners */
.ctnApp .banner{display:flex;align-items:center;gap:14px;padding:12px 18px;border-radius:11px;margin-bottom:16px;font-size:13px;flex-wrap:wrap}
.ctnApp .banner b{font-weight:700}
.ctnApp .banner-blue{background:var(--blue-soft);border:1px solid var(--tint-border);color:var(--navy)}
.ctnApp .banner-amber{background:var(--amber-bg);border:1px solid #ecd9a8;color:var(--amber)}
.ctnApp .banner-red{background:var(--red-bg);border:1px solid #f0c4bd;color:var(--red)}
.ctnApp .banner-green{background:var(--green-bg);border:1px solid #bfe4cf;color:var(--green)}
.ctnApp .banner.deadline .banner-days{margin-left:auto;font-weight:700}
.ctnApp .banner span{font-size:12px}

/* row tables (drugs / attachments) */
.ctnApp .row-table{display:flex;flex-direction:column}
.ctnApp .rt-head,.ctnApp .rt-row{display:grid;gap:10px;align-items:center;padding:9px 4px}
.ctnApp .rt-head{font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--ink-3);font-weight:700;border-bottom:1px solid var(--line-2)}
.ctnApp .rt-row{border-bottom:1px solid var(--line-2)}
.ctnApp .rt-row:last-child{border-bottom:none}
.ctnApp .rt-drug{grid-template-columns:120px 66px 1fr 1.4fr 1fr 34px}
.ctnApp .rt-att{grid-template-columns:1.4fr 2fr 90px 34px}
.ctnApp .rt-empty{padding:20px;text-align:center;color:var(--ink-4);font-size:12.5px}
.ctnApp .serial{font-weight:700;font-variant-numeric:tabular-nums;color:var(--navy)}

/* site cards */
.ctnApp .sitecard{border:1px solid var(--line);border-radius:11px;margin-bottom:14px;overflow:hidden}
.ctnApp .sitecard:last-child{margin-bottom:0}
.ctnApp .sitecard-h{display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--line-2)}
.ctnApp .site-serial{font-size:12px;font-weight:700;color:var(--navy);white-space:nowrap}
.ctnApp .sitecard-h .sel{flex:1;max-width:420px}
.ctnApp .site-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:14px 16px}
@media(max-width:820px){.ctnApp .site-grid{grid-template-columns:1fr 1fr}}
.ctnApp .roster{padding:0 16px 14px;border-top:1px solid var(--line-2)}
.ctnApp .roster-h{font-size:12px;font-weight:700;color:var(--ink-2);margin:12px 0 8px}
.ctnApp .roster-row{display:flex;align-items:center;gap:10px;padding:7px 10px;border:1px solid var(--line-2);border-radius:9px;margin-bottom:6px}
.ctnApp .roster-row.removed{opacity:.6;text-decoration:line-through;background:var(--red-bg)}
.ctnApp .role-chip{font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;white-space:nowrap;color:#fff}
.ctnApp .role-chip.resp{background:var(--navy)} .ctnApp .role-chip.sub{background:#7aa6c9}
.ctnApp .rname{flex:1;font-size:13px;font-weight:600}
.ctnApp .rname small{font-weight:400}
.ctnApp .gaiji-note{color:var(--amber);font-size:10.5px}
.ctnApp .rserial{font-variant-numeric:tabular-nums;font-weight:700;color:var(--navy);font-size:12px}
.ctnApp .mv{font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:5px;white-space:nowrap}
.ctnApp .mv-add{background:var(--green-bg);color:var(--green)} .ctnApp .mv-remove{background:var(--red-bg);color:var(--red)}
.ctnApp .mv-register{background:var(--blue-soft);color:var(--navy)} .ctnApp .mv-cont{background:var(--line-2);color:var(--ink-3)}
.ctnApp .roster-add{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}
.ctnApp .roster-add .sel{min-width:150px}

/* quantity matrix */
.ctnApp .qty{padding:0 16px 16px;border-top:1px solid var(--line-2)}
.ctnApp .qty-h{font-size:12px;font-weight:700;color:var(--ink-2);margin:12px 0 8px;display:flex;align-items:center;gap:8px}
.ctnApp .qty-tbl{width:100%;border-collapse:collapse;font-size:12.5px}
.ctnApp .qty-tbl th{text-align:left;font-size:10px;text-transform:uppercase;color:var(--ink-3);font-weight:700;padding:6px 8px;border-bottom:1px solid var(--line-2)}
.ctnApp .qty-tbl td{padding:6px 8px;border-bottom:1px solid var(--line-2)}

/* attachments */
.ctnApp .att-chip{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:6px}
.ctnApp .att-100001300{background:var(--green-bg);color:var(--green)} .ctnApp .att-100001301{background:var(--amber-bg);color:var(--amber)} .ctnApp .att-100001302{background:var(--line-2);color:var(--ink-3)}

/* inquiries */
.ctnApp .inq-row{display:flex;gap:14px;align-items:center;padding:10px 4px;border-bottom:1px solid var(--line-2)}
.ctnApp .inq-row:last-child{border-bottom:none}
.ctnApp .inq-date{font-size:11.5px;font-weight:700;color:var(--ink-3);white-space:nowrap}
.ctnApp .inq-body{flex:1}.ctnApp .inq-body b{font-size:13px}
.ctnApp .inq-flag{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:7px}
.ctnApp .inq-flag.open{background:var(--amber-bg);color:var(--amber)} .ctnApp .inq-flag.done{background:var(--green-bg);color:var(--green)}

.ctnApp .detail-foot{padding:12px 4px;color:var(--ink-3)}

/* modal */
.ctnApp .modal-scrim{position:fixed;inset:0;background:rgba(8,18,36,.4);display:grid;place-items:center;z-index:60;opacity:0;animation:mf .18s forwards;padding:24px;overflow:auto}
@keyframes mf{to{opacity:1}}
/* max-height fits inside the scrim's 24px padding so the modal never exceeds the viewport */
.ctnApp .modal{background:var(--surface);border-radius:14px;box-shadow:var(--sh-2);width:100%;max-height:calc(100vh - 48px);display:flex;flex-direction:column;overflow:hidden}
.ctnApp .modal-sm{max-width:440px} .ctnApp .modal-md{max-width:620px} .ctnApp .modal-lg{max-width:820px} .ctnApp .modal-xl{max-width:1000px}
.ctnApp .modal-h{padding:18px 22px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex:none}
.ctnApp .modal-h h3{font-size:16px;font-weight:700}
.ctnApp .modal-sub{font-size:12px;color:var(--ink-3);margin-top:4px;line-height:1.4}
.ctnApp .modal-x{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;color:var(--ink-3);flex:none}
.ctnApp .modal-x:hover{background:var(--line-2)}.ctnApp .modal-x svg{width:18px;height:18px}
/* flex:1 + min-height:0 lets the body take remaining space and actually scroll */
.ctnApp .modal-b{padding:20px 22px;overflow-y:auto;flex:1 1 auto;min-height:0}
.ctnApp .modal-f{padding:14px 22px;border-top:1px solid var(--line);display:flex;gap:10px;align-items:center;flex:none}

/* wizard */
.ctnApp .wiz-steps{display:flex;gap:20px;margin-bottom:18px;font-size:12.5px;font-weight:700;color:var(--ink-4)}
.ctnApp .wiz-steps .on{color:var(--navy)} .ctnApp .wiz-steps .done{color:var(--green)}
.ctnApp .seg-2{display:flex;background:var(--line-2);border-radius:10px;padding:4px;gap:4px}
.ctnApp .seg-2 button{flex:1;padding:10px;border-radius:8px;font-size:13px;font-weight:600;color:var(--ink-2)}
.ctnApp .seg-2 button.on{background:var(--surface);color:var(--navy);box-shadow:var(--sh)}
.ctnApp .wiz-list{display:flex;flex-direction:column;gap:8px;margin-top:14px}
.ctnApp .wiz-series{display:flex;gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:10px;cursor:pointer;transition:.12s}
.ctnApp .wiz-series:hover{border-color:var(--blue)}
.ctnApp .wiz-series.on{border-color:var(--blue);background:var(--blue-soft)}
.ctnApp .wiz-series b{font-size:14px}
.ctnApp .validate{margin-top:8px;display:flex;flex-direction:column;gap:3px}
.ctnApp .v-err{color:var(--red);font-size:11.5px;font-weight:600} .ctnApp .v-warn{color:var(--amber);font-size:11.5px;font-weight:600} .ctnApp .v-ok{color:var(--green);font-size:11.5px;font-weight:600}
.ctnApp .wiz-note{background:var(--blue-soft);border:1px solid var(--tint-border);border-radius:9px;padding:10px 14px;font-size:12px;color:var(--navy);line-height:1.5}
.ctnApp .wiz-note.wide{grid-column:1/-1}
.ctnApp .wiz-fixed{display:flex;align-items:center;gap:14px;padding:16px;border:1px solid var(--line);border-radius:11px}
.ctnApp .wiz-fixed-badge{background:var(--ty-plan);color:#fff;font-weight:700;font-size:13px;padding:8px 14px;border-radius:9px}
.ctnApp .type-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
@media(max-width:760px){.ctnApp .type-grid{grid-template-columns:repeat(2,1fr)}}
.ctnApp .type-card{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:16px 10px;border:1.5px solid var(--line);border-radius:12px;transition:.12s;background:var(--surface)}
.ctnApp .type-card:hover:not(.disabled){border-color:var(--blue)}
.ctnApp .type-card.on{border-color:var(--blue);background:var(--blue-soft)}
.ctnApp .type-card.disabled{opacity:.4;cursor:not-allowed}
.ctnApp .type-card b{font-size:13px}
.ctnApp .type-ico{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;color:#fff;font-size:13px;font-weight:700}

/* master */
.ctnApp .mtabs{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
.ctnApp .mtabs button{padding:9px 16px;border-radius:9px;font-size:13px;font-weight:600;color:var(--ink-2);border:1px solid var(--line);background:var(--surface)}
.ctnApp .mtabs button.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.ctnApp .mtab-n{font-size:11px;opacity:.7;margin-left:4px}
.ctnApp .mtbl{width:100%;border-collapse:collapse;font-size:13px}
.ctnApp .mtbl th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--ink-3);font-weight:700;padding:11px 16px;background:var(--line-2)}
.ctnApp .mtbl td{padding:11px 16px;border-bottom:1px solid var(--line-2);vertical-align:middle}
.ctnApp .mtbl .nm{font-weight:600}
.ctnApp .mtbl tr.inactive{opacity:.5}
.ctnApp .del-badge{font-size:9.5px;font-weight:700;color:var(--red);background:var(--red-bg);padding:2px 6px;border-radius:5px;margin-left:8px}
.ctnApp .acts{display:flex;gap:6px;justify-content:flex-end}
.ctnApp .gaiji-orig-cell{color:var(--amber);font-weight:600}
.ctnApp .gaiji-flag{font-size:10.5px;font-weight:700;color:var(--amber);background:var(--amber-bg);padding:2px 8px;border-radius:6px}
.ctnApp .irb-chip{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:6px}
.ctnApp .irb-chip.in{background:var(--blue-soft);color:var(--navy)} .ctnApp .irb-chip.ex{background:var(--amber-bg);color:var(--amber)}
.ctnApp .staff-role{font-size:10.5px;font-weight:700;background:var(--line-2);color:var(--ink-2);padding:3px 9px;border-radius:6px}

/* gaiji dialog */
.ctnApp .gaiji-orig{font-size:14px;margin-bottom:14px;padding:12px 14px;background:var(--amber-bg);border-radius:9px}
.ctnApp .gaiji-orig .hl{color:var(--green)}
.ctnApp .gaiji-tbl{width:100%;border-collapse:collapse;font-size:13px}
.ctnApp .gaiji-tbl th{text-align:left;font-size:10.5px;text-transform:uppercase;color:var(--ink-3);font-weight:700;padding:8px 10px;border-bottom:1px solid var(--line-2)}
.ctnApp .gaiji-tbl td{padding:9px 10px;border-bottom:1px solid var(--line-2)}
.ctnApp .gc{font-size:20px;font-weight:700;color:var(--amber)}
.ctnApp .gc-in{width:60px;text-align:center;font-size:16px}
.ctnApp .gtype{font-size:10px;font-weight:700;padding:2px 7px;border-radius:5px;background:var(--line-2);color:var(--ink-2)}
.ctnApp .gaiji-note{color:var(--ink-3);font-size:11.5px;margin-top:12px;line-height:1.5}

/* xml preview */
.ctnApp .xsd-verdict{font-weight:700;font-size:13px;padding:6px 12px;border-radius:8px}
.ctnApp .xsd-verdict.ok{background:var(--green-bg);color:var(--green)} .ctnApp .xsd-verdict.err{background:var(--red-bg);color:var(--red)}
.ctnApp .serial-summary{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
@media(max-width:760px){.ctnApp .serial-summary{grid-template-columns:1fr}}
.ctnApp .ss-block{border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.ctnApp .ss-h{font-size:11px;font-weight:700;color:var(--ink-3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px}
.ctnApp .ss-row{display:flex;align-items:center;gap:8px;font-size:12.5px;padding:4px 0;flex-wrap:wrap}
.ctnApp .ss-serial{font-weight:700;color:var(--navy);font-variant-numeric:tabular-nums;min-width:28px}
.ctnApp .mini-badge{font-size:9.5px;font-weight:700;padding:2px 6px;border-radius:5px;background:var(--line-2);color:var(--ink-2)}
.ctnApp .mini-badge.main,.ctnApp .mini-badge.resp{background:var(--blue-soft);color:var(--navy)}
.ctnApp .xsd-msgs{margin-bottom:12px;display:flex;flex-direction:column;gap:4px}
.ctnApp .xml-pre{background:#0d1b2e;color:#c7e0f4;padding:16px;border-radius:10px;font-family:'SFMono-Regular',Consolas,monospace;font-size:11.5px;line-height:1.55;overflow-x:auto;white-space:pre;max-height:44vh}

/* series */
.ctnApp .series-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
@media(max-width:900px){.ctnApp .series-grid{grid-template-columns:1fr}}
.ctnApp .series-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);padding:18px 20px}
.ctnApp .series-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
.ctnApp .series-code{font-size:18px;font-weight:700;letter-spacing:-.3px}
.ctnApp .dev-chip{font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:7px}
.ctnApp .dev-chip.active{background:var(--green-bg);color:var(--green)} .ctnApp .dev-chip.disc{background:var(--line-2);color:var(--ink-3)}
.ctnApp .series-meta{display:flex;flex-wrap:wrap;gap:8px 16px;font-size:11.5px;color:var(--ink-3);margin-bottom:14px}
.ctnApp .series-timeline{display:flex;flex-direction:column;gap:7px}
.ctnApp .tl-item{display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid var(--line-2);border-radius:9px;text-align:left;transition:.1s}
.ctnApp .tl-item:hover{background:var(--blue-soft);border-color:var(--blue)}
.ctnApp .tl-count{font-weight:700;font-variant-numeric:tabular-nums;color:var(--navy);min-width:26px;font-size:12.5px}

/* audit */
.ctnApp .audit-tbl{width:100%;border-collapse:collapse;font-size:13px}
.ctnApp .audit-tbl th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--ink-3);font-weight:700;padding:11px 16px;background:var(--line-2)}
.ctnApp .audit-tbl td{padding:11px 16px;border-bottom:1px solid var(--line-2);vertical-align:top}
.ctnApp .audit-tbl .nm{font-weight:600}
.ctnApp .nowrap{white-space:nowrap}
.ctnApp .act-chip{font-size:10px;font-weight:700;padding:3px 9px;border-radius:6px;white-space:nowrap}
.ctnApp .a-create{background:var(--blue-soft);color:var(--navy)} .ctnApp .a-update{background:var(--line-2);color:var(--ink-2)}
.ctnApp .a-delete{background:var(--red-bg);color:var(--red)} .ctnApp .a-restore{background:var(--green-bg);color:var(--green)}
.ctnApp .a-submit{background:#e5eefa;color:var(--st-submitted)} .ctnApp .a-approve{background:var(--green-bg);color:var(--green)} .ctnApp .a-xml{background:#efe7fb;color:#6b3fb0}

/* toast error variant */
.ctnApp .toast-err{background:var(--red)}
.ctnApp .toast-err svg{color:#fff}

/* ============================================================
   CTN — revision 2 (dashboard/list/import/settings/drug cards)
   ============================================================ */
.ctnApp .kpis-5{grid-template-columns:repeat(5,1fr)}
@media(max-width:1100px){.ctnApp .kpis-5{grid-template-columns:repeat(3,1fr)}}

/* notification list: draggable columns */
.ctnApp .ntbl-hint{font-size:11px;color:var(--ink-3);padding:8px 16px;border-bottom:1px solid var(--line-2);display:flex;align-items:center;gap:10px}
.ctnApp .linkbtn{background:none;border:none;color:var(--blue);font-size:11.5px;font-weight:600;cursor:pointer;padding:0}
.ctnApp .linkbtn:hover{text-decoration:underline}
.ctnApp .col-drag{cursor:grab;user-select:none}
.ctnApp .col-drag:active{cursor:grabbing}
.ctnApp .col-grip{color:var(--ink-4);margin-right:6px;letter-spacing:-2px;font-size:10px}

/* import (dropzone + list) */
.ctnApp .dropzone{border:2px dashed var(--line);border-radius:14px;padding:34px 20px;text-align:center;cursor:pointer;transition:.15s;background:var(--surface);margin-bottom:18px}
.ctnApp .dropzone:hover,.ctnApp .dropzone.over{border-color:var(--blue);background:var(--blue-soft)}
.ctnApp .dz-ico{width:40px;height:40px;margin:0 auto 10px;color:var(--blue)}.ctnApp .dz-ico svg{width:40px;height:40px}
.ctnApp .dz-t{font-size:14px;font-weight:600}
.ctnApp .dz-s{font-size:12px;color:var(--ink-3);margin-top:5px}
.ctnApp .imp-list{display:flex;flex-direction:column}
.ctnApp .imp-row{display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid var(--line-2)}
.ctnApp .imp-row:last-child{border-bottom:none}
.ctnApp .imp-kind{font-size:10px;font-weight:700;padding:4px 8px;border-radius:6px;color:#fff;flex:none}
.ctnApp .imp-kind.k-xml{background:var(--blue)} .ctnApp .imp-kind.k-pdf{background:var(--red)} .ctnApp .imp-kind.k-other{background:var(--ink-3)}
.ctnApp .imp-body{flex:1;min-width:0}
.ctnApp .imp-name{font-size:13px;font-weight:600}
.ctnApp .imp-msg{font-size:11.5px;color:var(--ink-2);margin-top:2px}
.ctnApp .imp-row.st-error .imp-msg{color:var(--red)}
.ctnApp .imp-parsed{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:6px;font-size:11.5px;align-items:center}
.ctnApp .imp-chip{background:var(--blue-soft);color:var(--navy);font-weight:700;font-size:10.5px;padding:2px 8px;border-radius:6px}

/* settings (rule toggles) */
.ctnApp .rule-toggles{display:flex;flex-direction:column;gap:2px}
.ctnApp .rule-toggle{display:flex;gap:12px;align-items:flex-start;padding:12px;border-radius:10px;cursor:pointer;transition:.1s}
.ctnApp .rule-toggle:hover{background:var(--line-2)}
.ctnApp .rule-toggle input{margin-top:3px;width:16px;height:16px;accent-color:var(--blue)}
.ctnApp .rule-toggle b{font-size:13px;display:block}
.ctnApp .rule-toggle span{font-size:11.5px;color:var(--ink-3);display:block;margin-top:2px}
.ctnApp .settings-actions{display:flex;align-items:center;gap:10px;margin-top:6px}

/* references row grid */
.ctnApp .rt-ref{grid-template-columns:130px 1.2fr 90px 1fr 1.4fr 34px}

/* study drug card (expandable) */
.ctnApp .drugcard{border:1px solid var(--line);border-radius:11px;margin-bottom:12px;overflow:hidden}
.ctnApp .drugcard:last-child{margin-bottom:0}
.ctnApp .drugcard-h{display:flex;align-items:center;gap:10px;padding:11px 14px;background:var(--line-2);cursor:pointer}
.ctnApp .drugcard-h:hover{background:#eef2f7}
.ctnApp .tog2{width:20px;height:20px;display:grid;place-items:center;color:var(--ink-3);flex:none;background:none;border:none}
.ctnApp .tog2 svg{width:14px;height:14px;transition:.18s}
.ctnApp .tog2.open svg{transform:rotate(90deg)}
.ctnApp .drug-serial{font-weight:700;color:var(--navy);font-variant-numeric:tabular-nums;font-size:12.5px;min-width:32px}
.ctnApp .drug-name{font-size:13.5px;font-weight:600}
.ctnApp .drugcard-b{padding:16px 14px;display:flex;flex-direction:column;gap:14px}

/* ============================================================
   CTN — revision 3 (section tabs, import toolbar, perm banner, alert bg)
   ============================================================ */
/* detail section tabs (horizontal shortcut buttons) */
.ctnApp .detail-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;background:var(--surface);border:1px solid var(--line);border-radius:11px;padding:6px;box-shadow:var(--sh)}
.ctnApp .dtab{padding:9px 16px;border-radius:8px;font-size:13px;font-weight:600;color:var(--ink-2);background:none;border:none;transition:.12s;white-space:nowrap}
.ctnApp .dtab:hover{background:var(--line-2)}
.ctnApp .dtab.on{background:var(--navy);color:#fff}

/* dashboard alert / reminder card tints */
.ctnApp .sect-alert{background:#fce4e4;border-color:#f2b8b8}
.ctnApp .sect-alert .sect-h{border-bottom-color:#f2b8b8}
.ctnApp .sect-reminder{background:#fdf0d3;border-color:#efd695}
.ctnApp .sect-reminder .sect-h{border-bottom-color:#efd695}

/* import toolbar */
.ctnApp .import-toolbar{display:flex;align-items:center;gap:10px;margin:0 0 16px;padding:10px 14px;background:var(--blue-soft);border:1px solid var(--tint-border);border-radius:10px}

/* settings permission banner */
.ctnApp .perm-banner{border-radius:11px;padding:13px 16px;margin-bottom:18px;font-size:12.5px;line-height:1.55}
.ctnApp .perm-banner b{display:block;font-size:13px;margin-bottom:3px}
.ctnApp .perm-banner.ok{background:var(--green-bg);border:1px solid #bfe4cf;color:#155e3f}
.ctnApp .perm-banner.ro{background:var(--amber-bg);border:1px solid #ecd9a8;color:var(--amber)}

/* ============================================================
   CTN — ALTERNATIVE DESIGN THEME "Modern"
   Light sidebar, indigo/violet accent, rounder cards, softer shadows.
   Same structure/content; palette + a few component styles overridden.
   ============================================================ */
.ctnApp .app.theme-modern{
  --navy:#4f46e5; --blue:#6d5efc; --blue-soft:#eef0ff;
  --ink:#1e2233; --ink-2:#5a6072; --ink-3:#6b7180; --ink-4:#c3c8d6; --ink-faint:#9aa0b4;
  --line:#ecedf4; --line-2:#f5f6fb; --bg:#f6f7fb; --white:#fff; --surface:#fff;
  --focus:var(--blue);   /* モダンの accent(#6d5efc) でフォーカスリングを再計算 */
  --green:#10b981; --green-bg:#e7f7f0;
  --amber:#f59e0b; --amber-bg:#fdf1de;
  --red:#ef4444; --red-bg:#fdecec;
  --blue-2:#a78bfa;   /* ブランドマークのグラデーション終端 */
  --sh:0 1px 3px rgba(28,28,60,.05); --sh-2:0 18px 44px rgba(28,28,60,.15);
  --r:16px;
  /* status pill colors */
  --st-draft:#9aa0b4; --st-review:#6d5efc; --st-approved:#10b981; --st-submitted:#4f46e5;
  --ty-plan:#6d5efc; --ty-change:#f59e0b; --ty-term:#ef4444; --ty-comp:#10b981; --ty-dev:#9aa0b4;
  background:var(--bg);
}
/* light sidebar */
.ctnApp .app.theme-modern .side{background:var(--surface);color:var(--ink);border-right:1px solid var(--line)}
.ctnApp .app.theme-modern .brand b{color:var(--ink)}
.ctnApp .app.theme-modern .brand span{color:var(--ink-3)}
.ctnApp .app.theme-modern .brand .m{background:linear-gradient(135deg,var(--blue),var(--blue-2))}
.ctnApp .app.theme-modern .nav a{color:var(--ink-2);font-weight:600}
.ctnApp .app.theme-modern .nav a:hover{background:var(--line-2);color:var(--ink)}
.ctnApp .app.theme-modern .nav a.on{background:var(--blue-soft);color:var(--blue)}
.ctnApp .app.theme-modern .nav a.on svg{opacity:1}
.ctnApp .app.theme-modern .nav-badge{background:var(--blue);color:#fff}
.ctnApp .app.theme-modern .nav a.on .nav-badge{background:var(--blue);color:#fff}
.ctnApp .app.theme-modern .sfoot{border-top-color:var(--line)}
.ctnApp .app.theme-modern .sfoot .a{background:var(--blue-soft);color:var(--blue)}
.ctnApp .app.theme-modern .sfoot .n{color:var(--ink)}
.ctnApp .app.theme-modern .sfoot .r{color:var(--ink-3)}
.ctnApp .app.theme-modern .hublink{color:var(--ink-3);border-color:var(--line)}
.ctnApp .app.theme-modern .hublink:hover{background:var(--line-2);color:var(--ink);border-color:var(--line)}
/* rounder cards & controls */
.ctnApp .app.theme-modern .kpi,.ctnApp .app.theme-modern .card,.ctnApp .app.theme-modern .sect,.ctnApp .app.theme-modern .filters,.ctnApp .app.theme-modern .series-card{border-radius:16px}
.ctnApp .app.theme-modern .btn{border-radius:11px}
.ctnApp .app.theme-modern .tin,.ctnApp .app.theme-modern .ta,.ctnApp .app.theme-modern select.sel{border-radius:11px}
.ctnApp .app.theme-modern .lang{border-radius:11px}
.ctnApp .app.theme-modern .modal{border-radius:20px}
/* accent-tinted lang/theme toggle active */
.ctnApp .app.theme-modern .lang button.on{background:var(--blue)}
/* KPI numbers a touch softer */
.ctnApp .app.theme-modern .kpi .v{letter-spacing:-.5px}
/* header stays surface, subtle divider */
.ctnApp .app.theme-modern .top{border-bottom-color:var(--line)}

/* ============================================================
   COLOR PALETTE VARIANTS
   現行デザイン（theme-modern）の構造・タイポ・角丸・影はそのままに、
   アクセント色だけを差し替えるバリエーション。
   意味色（緑=承認/黄=注意/赤=警告）とは衝突しない色相のみを採用する。

   ・アクセント系トークンのみ上書きし、中立色（bg/surface/ink/line）は触らない
     → ダークモードと直交する
   ・.app.mode-dark と同じ2クラス詳細度なので、必ずその「前」に置くこと
     （--blue-soft や *-bg の暗色化はダークモード側に勝たせる）
   ・「現行（インディゴ）」は palette クラスを付けない = theme-modern そのまま
   ============================================================ */
/* ティール — 医療・臨床寄りの落ち着いた青緑 */
.ctnApp .app.palette-teal{
  --navy:#0f766e; --blue:#0d9488; --blue-2:#5eead4; --blue-soft:#e6f7f4;
  --tint-border:#b9e5de;
  --st-draft:#94a3b8; --st-review:var(--blue); --st-submitted:var(--navy);
  --ty-plan:var(--blue);
}
/* オーシャン — 製薬コーポレートに寄せた実直なブルー */
.ctnApp .app.palette-ocean{
  --navy:#1e3a8a; --blue:#2563eb; --blue-2:#7dd3fc; --blue-soft:#eaf1fe;
  --tint-border:#c3d9fb;
  --st-draft:#94a3b8; --st-review:var(--blue); --st-submitted:var(--navy);
  --ty-plan:var(--blue);
}

/* ============================================================
   DARK MODE  (color axis, independent of the standard/modern theme)
   Overrides only neutral tokens + literal surfaces; each theme keeps
   its own accent hue. Placed last so it wins the equal-specificity
   variable cascade against .app.theme-modern.
   ============================================================ */
.ctnApp .app.mode-dark{
  --bg:#0e131a; --surface:#182029; --white:#182029;
  --ink:#e8eef4; --ink-2:#b4c1d0; --ink-3:#8493a6; --ink-4:#5c6b7d;
  --line:#28323e; --line-2:#1d2530;
  --ink-faint:#6a7789;
  --blue-soft:#15304a;
  --green-bg:#12261d; --amber-bg:#2b2212; --red-bg:#2e1b18;
  --kpi-crit:#c1505d; --kpi-warn:#b07a30; --focus:#8b7dff;
  --sh:0 1px 2px rgba(0,0,0,.5); --sh-2:0 16px 40px rgba(0,0,0,.6);
  background:var(--bg);
  color-scheme:dark;
}
/* modern's white sidebar → dark surface in dark mode (needs the extra class) */
.ctnApp .app.mode-dark.theme-modern .side{background:var(--surface)}
/* tinted hovers / alert & reminder cards keep their hue but go dark */
.ctnApp .app.mode-dark .drugcard-h:hover{background:var(--line-2)}
.ctnApp .app.mode-dark .grow:hover{background:#16222e}
.ctnApp .app.mode-dark .sect-alert,.ctnApp .app.mode-dark .kpi-red{background:#2a1a1d;border-color:#5b2f36}
.ctnApp .app.mode-dark .sect-reminder,.ctnApp .app.mode-dark .kpi-amber{background:#2a2616;border-color:#5a4f2a}
.ctnApp .app.mode-dark .btn-danger:hover{background:#3a2320}
.ctnApp .app.mode-dark .a-submit{background:#16283f} .ctnApp .app.mode-dark .a-xml{background:#241a38}
/* scrollbars */
.ctnApp .app.mode-dark .scroll{scrollbar-color:#3a4756 transparent}

/* ============================================================
   SIDEBAR COLLAPSE  (icon-only rail)
   ============================================================ */
.ctnApp .side .brand{position:relative}
.ctnApp .collapse-btn{position:absolute;top:20px;right:12px;width:26px;height:26px;border-radius:7px;display:grid;place-items:center;color:inherit;opacity:.6;transition:.14s}
.ctnApp .collapse-btn:hover{opacity:1;background:rgba(255,255,255,.09)}
.ctnApp .collapse-btn svg{width:16px;height:16px;transition:transform .2s}
.ctnApp .app.theme-modern .collapse-btn:hover{background:var(--line-2)}
.ctnApp .app.collapsed{grid-template-columns:64px 1fr}
.ctnApp .app.collapsed .brand{padding:22px 0 18px;justify-content:center}
.ctnApp .app.collapsed .brand .txt{display:none}
.ctnApp .app.collapsed .brand .m{display:none}
.ctnApp .app.collapsed .collapse-btn{position:static;margin:0 auto}
.ctnApp .app.collapsed .collapse-btn svg{transform:rotate(180deg)}
.ctnApp .app.collapsed .nav{padding:6px 8px}
.ctnApp .app.collapsed .nav a{justify-content:center;padding:11px 0;gap:0}
.ctnApp .app.collapsed .nav a span:not(.nav-badge){display:none}
.ctnApp .app.collapsed .nav a .nav-badge{right:8px;top:5px;min-width:15px;height:15px;font-size:9px}
.ctnApp .app.collapsed .hublink{justify-content:center;gap:0;margin:0 8px 8px;padding:9px 0}
.ctnApp .app.collapsed .hublink span{display:none}
.ctnApp .app.collapsed .sfoot{padding:14px 0;justify-content:center}
.ctnApp .app.collapsed .sfoot>div:not(.a){display:none}
/* header palette swatches（配色バリエーション切替） */
.ctnApp .palette-switch{display:flex;align-items:center;gap:6px;flex:none;padding:5px 8px;border:1px solid var(--line);border-radius:10px}
.ctnApp .pal-dot{width:16px;height:16px;border-radius:50%;flex:none;border:2px solid transparent;transition:.14s;padding:0}
.ctnApp .pal-dot:hover{transform:scale(1.15)}
.ctnApp .pal-dot.on{border-color:var(--ink);box-shadow:0 0 0 2px var(--surface) inset}
.ctnApp .app.theme-modern .palette-switch{border-radius:11px}
@media (prefers-reduced-motion: reduce){.ctnApp .pal-dot:hover{transform:none}}
/* header dark/light toggle */
.ctnApp .mode-toggle{flex:none}
.ctnApp .mode-toggle svg{width:17px;height:17px}
/* usage-manual placeholder (link repurposed later, after spec is finalized) */
.ctnApp .hublink.manual{cursor:default;opacity:.72;gap:9px;padding:9px 11px}
.ctnApp .hublink.manual:hover{background:transparent;color:inherit;border-color:inherit}
.ctnApp .hublink.manual>span:not(.ext){white-space:nowrap;font-size:12px}
.ctnApp .hublink.manual .ext{margin-left:auto;flex:none;font-size:9px;font-weight:700;letter-spacing:.02em;padding:1px 5px;border-radius:6px;background:var(--line-2);color:var(--ink-3)}
.ctnApp .app.collapsed .hublink.manual .ext{display:none}

/* ============================================================
   UI POLISH — design-lab で採択した改善（P1改/P2/P3）
   ============================================================ */

/* --- P1: キーボードフォーカスの可視化（focus-visible リング） --- */
.ctnApp button:focus-visible,
.ctnApp a:focus-visible,
.ctnApp input:focus-visible,
.ctnApp select:focus-visible,
.ctnApp textarea:focus-visible,
.ctnApp [tabindex]:focus-visible,
.ctnApp .chip:focus-visible,
.ctnApp .nav a:focus-visible,
.ctnApp .dtab:focus-visible,
.ctnApp .seg button:focus-visible,
.ctnApp .mtabs button:focus-visible,
.ctnApp .col-drag:focus-visible{
  outline:none;
  box-shadow:0 0 0 3px color-mix(in srgb, var(--focus) 42%, transparent);
}

/* --- P1改: 強調KPI（アラート／リマインダ カードは、直下の一覧ボックスと同じ淡色に統一） --- */
/* sect-alert / sect-reminder と同じ tint を使い、数値のみ意味色で強調 */
.ctnApp .kpi-red{background:#fdf1f2;border:1px solid #f3d3d6}
.ctnApp .kpi-amber{background:#fdf9ec;border:1px solid #efe4bf}
.ctnApp .kpi-red .v{color:var(--red)}
.ctnApp .kpi-amber .v{color:var(--amber)}

/* --- P2/P3: データテーブルの走査性（数値右寄せ・薄zebra・行密度） --- */
.ctnApp .ntbl td{padding:10px 16px}                                   /* やや高密度 */
.ctnApp .ntbl th.tnum,.ctnApp .ntbl td.tnum{text-align:right}
.ctnApp .ntbl tbody tr:nth-child(even):not(:hover){background:color-mix(in srgb, var(--ink) 3.5%, transparent)}

/* --- P2: 読み込み中スケルトン --- */
.ctnApp .sk-row{display:grid;grid-template-columns:1.4fr 1.2fr .7fr .7fr 1fr;gap:16px;padding:12px 16px;border-bottom:1px solid var(--line-2)}
.ctnApp .sk{height:12px;border-radius:6px;background:linear-gradient(90deg,var(--line-2),var(--line),var(--line-2));background-size:200% 100%;animation:sk-shine 1.3s cubic-bezier(.4,0,.2,1) infinite}
@keyframes sk-shine{to{background-position:-200% 0}}
.ctnApp .sk-note{font-size:12px;color:var(--ink-3);padding:10px 16px}
.ctnApp .boot-card{width:min(560px,90vw);background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--sh);overflow:hidden;text-align:left}

/* --- P3: 日本語タイポ（約物詰め）。数値は各所で tabular-nums 済み --- */
.ctnApp.ja{font-feature-settings:"palt" 1}

@media (prefers-reduced-motion: reduce){
  .ctnApp .sk{animation:none}
}
`;
