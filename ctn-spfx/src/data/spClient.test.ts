// ============================================================================
// spClient.test.ts — HTTP と応答解析の層のテスト
// ----------------------------------------------------------------------------
// これまでのテストは全て ISpRestClient を差し替えていたため、この層（実際の
// リクエスト組み立てと応答の解析）を一度も通っていなかった。実テナントで
// 詰まった原因はまさにここにあった:
//
//   SPFx の SPHttpClient は OData v4 を既定で使う（OData-Version: 4.0 を自動付与）。
//   v4 の最小メタデータでは etag は「@odata.etag」（アットマーク付き）で載る。
//   実装は「odata.etag」（@ なし）を読んでいたため etag が常に未取得となり、
//   IF-MATCH を使う全ての更新が失敗していた。
//
// ここでは本物の SharePoint が返す形を模した応答を使い、解析が正しいことを
// 確かめる。フェイクを ISpRestClient に置くのでは検出できない領域。
// ============================================================================
import { describe, expect, it } from "vitest";

import { SpRestClient, readEtag, toItem, type ISpHttpClientLike, type ISpHttpResponseLike } from "./spClient";

const WEB = "https://contoso.sharepoint.com/sites/demo";

interface Recorded {
  method: "GET" | "POST";
  url: string;
  headers: Record<string, string>;
  body?: string;
}

/** 応答を差し込める HTTP フェイク。リクエストの内容も記録する */
function makeHttp(
  respond: (r: Recorded) => Partial<ISpHttpResponseLike> & { bodyJson?: unknown; etagHeader?: string }
): { http: ISpHttpClientLike; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const build = (method: "GET" | "POST") => async (url: string, _c: unknown, opts?: unknown): Promise<ISpHttpResponseLike> => {
    const o = (opts ?? {}) as { headers?: Record<string, string>; body?: string };
    const rec: Recorded = { method, url, headers: o.headers ?? {}, body: o.body };
    calls.push(rec);
    const r = respond(rec);
    return {
      ok: r.ok ?? true,
      status: r.status ?? 200,
      statusText: r.statusText ?? "OK",
      headers: { get: (n: string) => (n.toLowerCase() === "etag" ? r.etagHeader ?? null : null) },
      json: async () => r.bodyJson ?? {},
      text: async () => JSON.stringify(r.bodyJson ?? {}),
    };
  };
  return { http: { get: build("GET"), post: build("POST") }, calls };
}

describe("etag の読み取り（実テナントで踏んだ回帰）", () => {
  it("OData v4 の @odata.etag を読む", () => {
    expect(readEtag({ "@odata.etag": '"3"' })).toBe('"3"');
  });

  it("OData v3 の odata.etag も読む（版が変わっても壊れない）", () => {
    expect(readEtag({ "odata.etag": '"5"' })).toBe('"5"');
  });

  it("どちらも無ければ undefined", () => {
    expect(readEtag({ Id: 1, Title: "x" })).toBeUndefined();
    expect(readEtag({ "@odata.etag": "" })).toBeUndefined();
  });

  it("toItem は @odata.etag を __etag へ移し、元のキーを残さない", () => {
    const item = toItem({ "@odata.etag": '"7"', Id: "42", Title: "届" });
    expect(item.__etag).toBe('"7"');
    expect(item.Id).toBe(42); // 文字列でも数値へ正規化する
    expect(item["@odata.etag"]).toBeUndefined();
    expect(item["odata.etag"]).toBeUndefined();
  });
});

describe("リクエストの組み立て", () => {
  it("Accept は OData v4 記法を使う（v3 記法は 406 になる）", async () => {
    const { http, calls } = makeHttp(() => ({ bodyJson: { value: [] } }));
    await new SpRestClient(http, {}, WEB).getItems("CtnNotifications", "$top=10");

    expect(calls[0].headers.Accept).toBe("application/json;odata.metadata=minimal");
    // v3 記法が残っていないこと
    expect(calls[0].headers.Accept).not.toContain("odata=");
  });

  it("一覧取得のURLとクエリが正しい", async () => {
    const { http, calls } = makeHttp(() => ({ bodyJson: { value: [] } }));
    await new SpRestClient(http, {}, WEB).getItems("CtnNotifications", "$select=Id&$top=500");

    expect(calls[0].method).toBe("GET");
    expect(calls[0].url).toBe(
      `${WEB}/_api/web/lists/getbytitle('CtnNotifications')/items?$select=Id&$top=500`
    );
  });

  it("更新は MERGE と実 etag の IF-MATCH を送る（* は使わない）", async () => {
    const { http, calls } = makeHttp(() => ({ status: 200 }));
    await new SpRestClient(http, {}, WEB).updateItem("CtnDoctors", 12, { CtnActive: false }, '"4"');

    const req = calls[0];
    expect(req.method).toBe("POST");
    expect(req.url).toBe(`${WEB}/_api/web/lists/getbytitle('CtnDoctors')/items(12)`);
    expect(req.headers["X-HTTP-Method"]).toBe("MERGE");
    expect(req.headers["IF-MATCH"]).toBe('"4"');
    expect(req.headers["IF-MATCH"]).not.toBe("*");
    expect(JSON.parse(req.body!)).toEqual({ CtnActive: false });
  });

  it("削除は DELETE と実 etag を送る", async () => {
    const { http, calls } = makeHttp(() => ({ status: 200 }));
    await new SpRestClient(http, {}, WEB).deleteItem("CtnNotifications", 9, '"2"');
    expect(calls[0].headers["X-HTTP-Method"]).toBe("DELETE");
    expect(calls[0].headers["IF-MATCH"]).toBe('"2"');
  });

  it("リスト名は URL エンコードされる", async () => {
    const { http, calls } = makeHttp(() => ({ bodyJson: { value: [] } }));
    await new SpRestClient(http, {}, WEB).getItems("CTN 治験届");
    expect(calls[0].url).toContain(encodeURIComponent("CTN 治験届"));
  });
});

describe("応答の解析", () => {
  it("一覧の各項目から @odata.etag を取り出す", async () => {
    const { http } = makeHttp(() => ({
      bodyJson: {
        "@odata.context": "…",
        value: [
          { "@odata.etag": '"1"', Id: 1, Title: "A" },
          { "@odata.etag": '"2"', Id: 2, Title: "B" },
        ],
      },
    }));
    const items = await new SpRestClient(http, {}, WEB).getItems("CtnNotifications");

    expect(items).toHaveLength(2);
    expect(items[0].__etag).toBe('"1"');
    expect(items[1].__etag).toBe('"2"');
    expect(items[0].Title).toBe("A");
  });

  it("追加の応答から etag を取り出す", async () => {
    const { http } = makeHttp(() => ({ bodyJson: { "@odata.etag": '"1"', Id: 46, Title: "新規" } }));
    const created = await new SpRestClient(http, {}, WEB).addItem("CtnNotifications", { Title: "新規" });

    expect(created.Id).toBe(46);
    expect(created.__etag).toBe('"1"');
  });

  it("value が無い応答でも落ちない", async () => {
    const { http } = makeHttp(() => ({ bodyJson: {} }));
    await expect(new SpRestClient(http, {}, WEB).getItems("CtnAudit")).resolves.toEqual([]);
  });

  it("412 は競合として区別される（リトライ判定に使う）", async () => {
    const { http } = makeHttp(() => ({ ok: false, status: 412, statusText: "Precondition Failed" }));
    await expect(
      new SpRestClient(http, {}, WEB).updateItem("CtnNotifications", 1, {}, '"1"')
    ).rejects.toThrow(/他の操作で更新されています/);
  });

  it("失敗時のエラーに、落ちたエンドポイントが含まれる", async () => {
    const { http } = makeHttp(() => ({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      bodyJson: { error: { message: "Attempted to perform an unauthorized operation." } },
    }));
    await expect(new SpRestClient(http, {}, WEB).getItems("CtnNotifications", "$top=1")).rejects.toThrow(
      /対象: \/_api\/web\/lists\/getbytitle\('CtnNotifications'\)\/items/
    );
  });
});

describe("単一項目の etag 取得", () => {
  it("ETag レスポンスヘッダーから取れる（本文にメタデータが無い場合の保険）", async () => {
    const { http, calls } = makeHttp(() => ({ etagHeader: '"9"', bodyJson: { Id: 5 } }));
    const etag = await new SpRestClient(http, {}, WEB).getItemEtag("CtnNotifications", 5);

    expect(etag).toBe('"9"');
    expect(calls[0].url).toBe(`${WEB}/_api/web/lists/getbytitle('CtnNotifications')/items(5)`);
  });

  it("ヘッダーが無ければ本文の @odata.etag を使う", async () => {
    const { http } = makeHttp(() => ({ bodyJson: { "@odata.etag": '"11"', Id: 5 } }));
    expect(await new SpRestClient(http, {}, WEB).getItemEtag("CtnNotifications", 5)).toBe('"11"');
  });

  it("項目が無ければ undefined（例外にしない）", async () => {
    const { http } = makeHttp(() => ({ ok: false, status: 404, statusText: "Not Found" }));
    expect(await new SpRestClient(http, {}, WEB).getItemEtag("CtnNotifications", 999)).toBeUndefined();
  });
});

describe("プロビジョニング（初期セットアップが使う経路）", () => {
  // ここも v3 記法（__metadata / odata=verbose）のままだと、項目の更新と
  // 同じ理由で失敗する。実テナントでは browser-setup.js で代替したため
  // 一度も通っていない経路であり、テストで押さえる必要がある。
  it("リスト作成は @odata.type を使い、v3 の __metadata を送らない", async () => {
    const { http, calls } = makeHttp(() => ({ bodyJson: { Id: "guid-1" } }));
    await new SpRestClient(http, {}, WEB).createList("CtnNotifications", "治験届");

    const body = JSON.parse(calls[0].body!);
    expect(body["@odata.type"]).toBe("SP.List");
    expect(body.__metadata, "v3 の型指定は送らない").toBeUndefined();
    expect(body.BaseTemplate).toBe(100);
    expect(body.EnableVersioning).toBe(true);
    expect(calls[0].headers["Content-Type"]).not.toContain("odata=verbose");
  });

  it("列作成は @odata.type と Field XML を送る", async () => {
    const { http, calls } = makeHttp(() => ({ bodyJson: {} }));
    const xml = '<Field Type="Text" DisplayName="CtnFoo" Name="CtnFoo" />';
    await new SpRestClient(http, {}, WEB).createFieldAsXml("CtnNotifications", xml, true);

    expect(calls[0].url).toBe(
      `${WEB}/_api/web/lists/getbytitle('CtnNotifications')/fields/createfieldasxml`
    );
    const body = JSON.parse(calls[0].body!);
    expect(body.parameters["@odata.type"]).toBe("SP.XmlSchemaFieldCreationInformation");
    expect(body.parameters.__metadata).toBeUndefined();
    expect(body.parameters.SchemaXml).toBe(xml);
    expect(body.parameters.Options).toBe(8); // AddFieldToDefaultView
  });

  it("グループ作成は @odata.type を使う", async () => {
    const { http, calls } = makeHttp(() => ({ bodyJson: {} }));
    await new SpRestClient(http, {}, WEB).createSiteGroup("CTN 承認者", "承認を行う");

    const body = JSON.parse(calls[0].body!);
    expect(body["@odata.type"]).toBe("SP.Group");
    expect(body.__metadata).toBeUndefined();
    expect(body.Title).toBe("CTN 承認者");
  });

  it("リスト作成の応答から GUID を取り出す（v4 の素の形）", async () => {
    const { http } = makeHttp(() => ({ bodyJson: { Id: "11111111-2222-3333-4444-555555555555" } }));
    const r = await new SpRestClient(http, {}, WEB).createList("CtnAudit", "監査");
    expect(r.id).toBe("11111111-2222-3333-4444-555555555555");
  });

  it("リスト作成の応答が v3 の { d: … } でも GUID を取り出す", async () => {
    const { http } = makeHttp(() => ({ bodyJson: { d: { Id: "aaaa-bbbb" } } }));
    const r = await new SpRestClient(http, {}, WEB).createList("CtnAudit", "監査");
    expect(r.id).toBe("aaaa-bbbb");
  });

  it("列一覧は InternalName だけを取り出す", async () => {
    const { http } = makeHttp(() => ({
      bodyJson: { value: [{ InternalName: "Title" }, { InternalName: "CtnPayload" }, { Id: 1 }] },
    }));
    const names = await new SpRestClient(http, {}, WEB).getFieldInternalNames("CtnNotifications");
    expect(names).toEqual(["Title", "CtnPayload"]);
  });

  it("リスト一覧は Title と Id が揃っているものだけ返す", async () => {
    const { http } = makeHttp(() => ({
      bodyJson: { value: [{ Title: "CtnAudit", Id: "g1" }, { Title: "壊れ" }, { Id: "g2" }] },
    }));
    const lists = await new SpRestClient(http, {}, WEB).getLists();
    expect(lists).toEqual([{ title: "CtnAudit", id: "g1" }]);
  });
});

describe("所属グループの取得", () => {
  it("Title だけを取り出す", async () => {
    const { http } = makeHttp(() => ({
      bodyJson: { value: [{ Title: "CTN 承認者" }, { Title: "メンバー" }, { Id: 3 }] },
    }));
    const names = await new SpRestClient(http, {}, WEB).getCurrentUserGroupNames();
    expect(names).toEqual(["CTN 承認者", "メンバー"]);
  });
});
