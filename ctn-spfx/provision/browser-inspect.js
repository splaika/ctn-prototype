// ===========================================================================
// CTN Suite — 保存内容の確認スクリプト（ブラウザのコンソール用・手書き）
// ---------------------------------------------------------------------------
// このファイルは自動生成ではない。直接編集してよい。
// （browser-setup.js / browser-seed.js は自動生成なので編集しないこと）
//
// 目的:
//   届は集約 JSON（CtnPayload）が正で、昇格列はその投影。CtnPayload は
//   SharePoint のリスト画面では巨大な1行として表示され実質読めないため、
//   開発・検証時に中身を確認する手段をここにまとめる。
//
// 使い方:
//   1. 対象サイトのページを開く（例: SitePages/Home.aspx）
//   2. F12 → Console にこのファイルの全文を貼り付けて Enter
//   3. 以下を呼ぶ
//
//   await ctn.latest()          直近に更新された届の昇格列を表で見る
//   await ctn.get(61)           項目 Id 61 の CtnPayload を展開表示
//   await ctn.check(61)         昇格列と CtnPayload の整合を検証（投影のズレ検出）
//   await ctn.checkAll()        全届について整合を検証
//   await ctn.counts()          9リストの件数
//   await ctn.audit()           監査ログの直近
//   await ctn.hidePayload()     CtnPayload を既定ビューから外す（表示ノイズ削減）
//
// 素の fetch は OData-Version を送らないためサーバーが v3 とみなす。
// そのため v3 記法（odata=nometadata）で通る。SPFx の SPHttpClient は v4 を
// 使うので、アプリ側のコードとは記法が異なる点に注意（docs/引き継ぎ.md 3章）。
// ===========================================================================
(() => {
  const WEB =
    (typeof _spPageContextInfo !== "undefined" && _spPageContextInfo.webAbsoluteUrl) ||
    location.origin + location.pathname.replace(/\/(SitePages|Lists|_layouts)\/.*$/i, "");

  const LIST = {
    notifications: "CtnNotifications",
    compounds: "CtnCompounds",
    sponsors: "CtnSponsors",
    institutions: "CtnInstitutions",
    doctors: "CtnDoctors",
    siteStaff: "CtnSiteStaff",
    irbs: "CtnIrbs",
    gaiji: "CtnGaiji",
    audit: "CtnAudit",
  };

  /** 昇格列 → CtnPayload 上の対応プロパティ。check() の突合に使う */
  const PROJECTION = {
    CtnNotifType: "notifType",
    CtnFilingCount: "filingCount",
    CtnChangeCount: "changeCount",
    CtnStatus: "status",
    CtnProtocolNo: "protocolNo",
    CtnNoteDate: "noteDate",
    CtnCreatedByUser: "createdBy",
    CtnApprovedByUser: "approvedBy",
  };

  async function api(path) {
    const r = await fetch(`${WEB}/_api/${path}`, {
      headers: { Accept: "application/json;odata=nometadata" },
      credentials: "same-origin",
    });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${path}`);
    return r.json();
  }

  async function digest() {
    const r = await fetch(`${WEB}/_api/contextinfo`, {
      method: "POST",
      headers: { Accept: "application/json;odata=nometadata" },
      credentials: "same-origin",
    });
    return (await r.json()).FormDigestValue;
  }

  const items = (list, query) =>
    api(`web/lists/getbytitle('${list}')/items${query ? `?${query}` : ""}`).then((d) => d.value);

  /** CtnPayload をパースする。壊れていたら理由を添えて返す */
  function parsePayload(raw, id) {
    if (!raw) return { __error: `項目 ${id}: CtnPayload が空` };
    try {
      return JSON.parse(raw);
    } catch (e) {
      return { __error: `項目 ${id}: CtnPayload を解釈できない — ${e.message}` };
    }
  }

  const ctn = {
    /** 対象サイトの URL（誤ったサイトで実行していないか確認用） */
    web: WEB,

    /** 直近に更新された届。昇格列を表で見る */
    async latest(top = 10) {
      const rows = await items(
        LIST.notifications,
        `$select=Id,Title,CtnStatus,CtnNotifType,CtnFilingCount,CtnChangeCount,CtnProtocolNo,CtnCreatedByUser,CtnApprovedByUser,Modified&$orderby=Modified desc&$top=${top}`
      );
      console.table(rows);
      return rows;
    },

    /** 項目 Id の CtnPayload を展開表示する */
    async get(id) {
      const rows = await items(
        LIST.notifications,
        `$select=Id,Title,CtnStatus,CtnPayload,CtnPayloadVersion,Modified&$filter=Id eq ${Number(id)}`
      );
      const it = rows[0];
      if (!it) {
        console.warn(`項目 ${id} は見つかりません`);
        return undefined;
      }
      console.log(`Id ${it.Id} / ${it.Title} / ${it.CtnStatus} / payload v${it.CtnPayloadVersion} / ${it.Modified}`);
      const payload = parsePayload(it.CtnPayload, id);
      console.log(payload);
      return payload;
    },

    /** CtnPayload の生文字列（長さの確認や外部ツールへの貼り付け用） */
    async raw(id) {
      const rows = await items(LIST.notifications, `$select=CtnPayload&$filter=Id eq ${Number(id)}`);
      const raw = rows[0] && rows[0].CtnPayload;
      console.log(`長さ: ${raw ? raw.length : 0} 文字`);
      return raw;
    },

    /**
     * 昇格列と CtnPayload の整合を検証する。
     * 昇格列は投影なので、ズレていれば書き込み経路の不具合を意味する。
     */
    async check(id) {
      const rows = await items(
        LIST.notifications,
        `$select=Id,CtnPayload,${Object.keys(PROJECTION).join(",")}&$filter=Id eq ${Number(id)}`
      );
      const it = rows[0];
      if (!it) {
        console.warn(`項目 ${id} は見つかりません`);
        return undefined;
      }
      return report([it]);
    },

    /** 全届について整合を検証する */
    async checkAll(top = 500) {
      const rows = await items(
        LIST.notifications,
        `$select=Id,CtnPayload,${Object.keys(PROJECTION).join(",")}&$top=${top}`
      );
      return report(rows);
    },

    /** 9リストの件数 */
    async counts() {
      const out = {};
      for (const [key, name] of Object.entries(LIST)) {
        try {
          const d = await api(`web/lists/getbytitle('${name}')?$select=ItemCount`);
          out[name] = d.ItemCount;
        } catch (e) {
          out[name] = `取得失敗: ${e.message}`;
        }
      }
      console.table(out);
      return out;
    },

    /** 監査ログの直近 */
    async audit(top = 20) {
      const rows = await items(
        LIST.audit,
        `$select=Id,CtnWho,CtnAction,CtnEntity,CtnEntityRef,CtnSummary,CtnAt&$orderby=Id desc&$top=${top}`
      );
      console.table(rows);
      return rows;
    },

    /**
     * CtnPayload を既定ビューから外す。人間が読む列ではないため。
     * データは消えない。元に戻すにはリスト設定でチェックを入れ直す。
     */
    async hidePayload(list = LIST.notifications, field = "CtnPayload") {
      const d = await digest();
      const r = await fetch(
        `${WEB}/_api/web/lists/getbytitle('${list}')/defaultview/viewfields/removeviewfield('${field}')`,
        {
          method: "POST",
          headers: {
            Accept: "application/json;odata=nometadata",
            "X-RequestDigest": d,
          },
          credentials: "same-origin",
        }
      );
      if (!r.ok) {
        console.error(`失敗: ${r.status} ${r.statusText}`, await r.text());
        return false;
      }
      console.log(`${list} の既定ビューから ${field} を外しました。リスト画面を再読み込みしてください。`);
      return true;
    },
  };

  /** check / checkAll の共通処理。ズレのみを表に出す */
  function report(rows) {
    const problems = [];
    for (const it of rows) {
      const p = parsePayload(it.CtnPayload, it.Id);
      if (p.__error) {
        problems.push({ Id: it.Id, 列: "CtnPayload", 昇格列: "", payload: "", 備考: p.__error });
        continue;
      }
      for (const [col, prop] of Object.entries(PROJECTION)) {
        const a = it[col];
        const b = p[prop];
        // null と undefined と "" は同じ「未設定」として扱う（SharePoint は空を null で返す）
        const empty = (v) => v === null || v === undefined || v === "";
        if (empty(a) && empty(b)) continue;
        if (String(a) !== String(b)) {
          problems.push({ Id: it.Id, 列: col, 昇格列: a, payload: b, 備考: "不一致" });
        }
      }
    }
    if (problems.length === 0) {
      console.log(`OK: ${rows.length}件すべて、昇格列と CtnPayload が一致しています。`);
    } else {
      console.warn(`不一致 ${problems.length}件（${rows.length}件中）`);
      console.table(problems);
    }
    return problems;
  }

  window.ctn = ctn;
  console.log(
    [
      "CTN Suite 確認スクリプトを読み込みました。",
      `対象サイト: ${WEB}`,
      "",
      "  await ctn.latest()      直近に更新された届（昇格列を表で）",
      "  await ctn.get(61)       項目 Id 61 の CtnPayload を展開表示",
      "  await ctn.check(61)     昇格列と CtnPayload の整合を検証",
      "  await ctn.checkAll()    全届について整合を検証",
      "  await ctn.counts()      9リストの件数",
      "  await ctn.audit()       監査ログの直近",
      "  await ctn.hidePayload() CtnPayload を既定ビューから外す",
    ].join("\n")
  );
})();
