// ============================================================================
// spClient.ts — SharePoint REST の最小ラッパ
// ----------------------------------------------------------------------------
// SharePointCtnRepository をユニットテスト可能にするための抽象。実装は
// SPHttpClient を使う SpRestClient、テストは同じ interface のフェイクを使う。
//
// メタデータ形式について（ブリーフ 6章からの意図的な逸脱）:
//   ブリーフは `odata=nometadata` を指定しているが、その形式では応答本文に
//   etag が含まれない。同じブリーフが「更新の IF-MATCH は実 etag（* 禁止）」を
//   絶対条件にしているため、両立しない。コレクション取得の各アイテムに
//   `odata.etag` が載る `odata=minimalmetadata` を採用する。
//   nometadata + アイテム個別 GET でも etag は取れるが、9リストの一括読み込みが
//   アイテム数ぶんの往復に膨らむため採らない。
// ============================================================================

/** リスト項目。SharePoint の数値 Id と etag を伴う */
export interface SpListItem {
  Id: number;
  /** 楽観的同時実行制御に使う実 etag（例: '"3"'） */
  __etag?: string;
  [field: string]: unknown;
}

/** 412 Precondition Failed（他者が先に更新した）を表す */
export class SpConflictError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "SpConflictError";
  }
}

/** SharePoint REST 呼び出しの契約。テストではこれをフェイクに差し替える */
export interface ISpRestClient {
  /** リスト項目を取得する。query は `$select=...&$top=500` 形式（先頭の ? 不要） */
  getItems(listTitle: string, query?: string): Promise<SpListItem[]>;
  /** 1件追加し、作成されたアイテム（Id・etag 付き）を返す */
  addItem(listTitle: string, fields: Record<string, unknown>): Promise<SpListItem>;
  /**
   * 1件更新する（MERGE）。etag が一致しなければ SpConflictError を投げる。
   * 呼び出し側は再取得→再計算→リトライすること。
   */
  updateItem(listTitle: string, id: number, fields: Record<string, unknown>, etag: string): Promise<void>;
  /** 1件削除する */
  deleteItem(listTitle: string, id: number, etag: string): Promise<void>;
  /** サインインユーザーが所属する SharePoint グループ名の一覧 */
  getCurrentUserGroupNames(): Promise<string[]>;
}

/**
 * リスト・列・グループを作るための操作。
 * いずれもサイト所有者の権限で通るため、テナント管理者は不要
 * （PowerShell 版 provision-lists.ps1 と同じことを REST で行う）。
 */
export interface ISpProvisioningClient {
  /** サイト内のリスト（タイトルと GUID） */
  getLists(): Promise<{ title: string; id: string }[]>;
  /** リストを作る。バージョン管理を有効にした状態で作成する */
  createList(title: string, description: string): Promise<{ id: string }>;
  /** 既存リストのバージョン管理と説明を揃える */
  updateListSettings(title: string, description: string): Promise<void>;
  /** リストの既存列の内部名 */
  getFieldInternalNames(listTitle: string): Promise<string[]>;
  /** Field XML で列を追加する（全型を1経路で扱えるため XML を使う） */
  createFieldAsXml(listTitle: string, schemaXml: string, addToDefaultView: boolean): Promise<void>;
  /** サイトグループ名の一覧 */
  getSiteGroupNames(): Promise<string[]>;
  /** サイトグループを作る */
  createSiteGroup(title: string, description: string): Promise<void>;
}

/** SPHttpClient の最小サブセット（テストで差し替えやすいよう構造的に定義） */
export interface ISpHttpClientLike {
  get(url: string, config: unknown, options?: unknown): Promise<ISpHttpResponseLike>;
  post(url: string, config: unknown, options?: unknown): Promise<ISpHttpResponseLike>;
}
export interface ISpHttpResponseLike {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

const ACCEPT = "application/json;odata=minimalmetadata";

interface ISpCollectionResponse {
  value?: unknown[];
}

/** SharePoint が返す 1 アイテムを SpListItem へ正規化する */
function toItem(raw: unknown): SpListItem {
  const o = (raw ?? {}) as Record<string, unknown>;
  const etag = typeof o["odata.etag"] === "string" ? (o["odata.etag"] as string) : undefined;
  const item: SpListItem = { ...o, Id: Number(o.Id) };
  if (etag) item.__etag = etag;
  delete (item as Record<string, unknown>)["odata.etag"];
  return item;
}

export class SpRestClient implements ISpRestClient, ISpProvisioningClient {
  public constructor(
    private readonly http: ISpHttpClientLike,
    /** SPHttpClient.configurations.v1 をそのまま渡す */
    private readonly config: unknown,
    /** サイトの絶対 URL（pageContext.web.absoluteUrl） */
    private readonly webUrl: string
  ) {}

  private listUrl(listTitle: string): string {
    return `${this.webUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')`;
  }

  private async fail(res: ISpHttpResponseLike, what: string): Promise<never> {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* 本文が読めないことがある */
    }
    throw new Error(`${what} に失敗しました (HTTP ${res.status} ${res.statusText})。${detail.slice(0, 400)}`);
  }

  public async getItems(listTitle: string, query?: string): Promise<SpListItem[]> {
    const url = `${this.listUrl(listTitle)}/items${query ? `?${query}` : ""}`;
    const res = await this.http.get(url, this.config, { headers: { Accept: ACCEPT } });
    if (!res.ok) return this.fail(res, `リスト「${listTitle}」の取得`);
    const body = (await res.json()) as ISpCollectionResponse;
    return (body.value ?? []).map(toItem);
  }

  public async addItem(listTitle: string, fields: Record<string, unknown>): Promise<SpListItem> {
    const res = await this.http.post(`${this.listUrl(listTitle)}/items`, this.config, {
      headers: { Accept: ACCEPT, "Content-Type": "application/json;odata=nometadata" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) return this.fail(res, `リスト「${listTitle}」への追加`);
    return toItem(await res.json());
  }

  public async updateItem(
    listTitle: string,
    id: number,
    fields: Record<string, unknown>,
    etag: string
  ): Promise<void> {
    const res = await this.http.post(`${this.listUrl(listTitle)}/items(${id})`, this.config, {
      headers: {
        Accept: ACCEPT,
        "Content-Type": "application/json;odata=nometadata",
        "X-HTTP-Method": "MERGE",
        // 実 etag のみ。"*" は採番衝突の温床になるため使わない（ブリーフ 5章）
        "IF-MATCH": etag,
      },
      body: JSON.stringify(fields),
    });
    if (res.status === 412) {
      throw new SpConflictError(
        `リスト「${listTitle}」の項目 ${id} は他の操作で更新されています（etag 不一致）。`
      );
    }
    if (!res.ok) await this.fail(res, `リスト「${listTitle}」の更新`);
  }

  public async deleteItem(listTitle: string, id: number, etag: string): Promise<void> {
    const res = await this.http.post(`${this.listUrl(listTitle)}/items(${id})`, this.config, {
      headers: { Accept: ACCEPT, "X-HTTP-Method": "DELETE", "IF-MATCH": etag },
    });
    if (res.status === 412) {
      throw new SpConflictError(`リスト「${listTitle}」の項目 ${id} は他の操作で更新されています。`);
    }
    if (!res.ok) await this.fail(res, `リスト「${listTitle}」の削除`);
  }

  // -------------------------------------------------------------------------
  // プロビジョニング（ISpProvisioningClient）
  //   サイト所有者の権限で通る操作のみ。管理者権限は使わない。
  // -------------------------------------------------------------------------

  /** JSON を POST して結果を返す共通処理 */
  private async postJson(
    url: string,
    body: unknown,
    extraHeaders: Record<string, string>,
    what: string
  ): Promise<unknown> {
    const res = await this.http.post(url, this.config, {
      headers: {
        Accept: ACCEPT,
        "Content-Type": "application/json;odata=verbose",
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return this.fail(res, what);
    // 204 No Content のこともあるので本文が無くても落ちないようにする
    try {
      return await res.json();
    } catch {
      return undefined;
    }
  }

  public async getLists(): Promise<{ title: string; id: string }[]> {
    const res = await this.http.get(
      `${this.webUrl}/_api/web/lists?$select=Title,Id&$top=500`,
      this.config,
      { headers: { Accept: ACCEPT } }
    );
    if (!res.ok) return this.fail(res, "リスト一覧の取得");
    const body = (await res.json()) as ISpCollectionResponse;
    return (body.value ?? [])
      .map((l) => l as { Title?: unknown; Id?: unknown })
      .filter((l) => typeof l.Title === "string" && typeof l.Id === "string")
      .map((l) => ({ title: l.Title as string, id: l.Id as string }));
  }

  public async createList(title: string, description: string): Promise<{ id: string }> {
    // BaseTemplate 100 = ジェネリックリスト。作成と同時にバージョン管理を有効化する
    const created = (await this.postJson(
      `${this.webUrl}/_api/web/lists`,
      {
        __metadata: { type: "SP.List" },
        Title: title,
        Description: description,
        BaseTemplate: 100,
        EnableVersioning: true,
      },
      {},
      `リスト「${title}」の作成`
    )) as { Id?: unknown; d?: { Id?: unknown } } | undefined;
    // odata=verbose の応答は { d: {...} }、それ以外は素の形で返る
    const id = created?.Id ?? created?.d?.Id;
    return { id: typeof id === "string" ? id : "" };
  }

  public async updateListSettings(title: string, description: string): Promise<void> {
    const res = await this.http.get(`${this.listUrl(title)}?$select=Id`, this.config, {
      headers: { Accept: ACCEPT },
    });
    if (!res.ok) await this.fail(res, `リスト「${title}」の取得`);
    const raw = (await res.json()) as Record<string, unknown>;
    const etag = typeof raw["odata.etag"] === "string" ? (raw["odata.etag"] as string) : undefined;
    if (!etag) {
      // etag が取れないときは設定変更を諦める（IF-MATCH: * は使わない方針）
      return;
    }
    await this.postJson(
      this.listUrl(title),
      {
        __metadata: { type: "SP.List" },
        Description: description,
        EnableVersioning: true,
      },
      { "X-HTTP-Method": "MERGE", "IF-MATCH": etag },
      `リスト「${title}」の設定更新`
    );
  }

  public async getFieldInternalNames(listTitle: string): Promise<string[]> {
    const res = await this.http.get(
      `${this.listUrl(listTitle)}/fields?$select=InternalName&$top=500`,
      this.config,
      { headers: { Accept: ACCEPT } }
    );
    if (!res.ok) return this.fail(res, `リスト「${listTitle}」の列一覧の取得`);
    const body = (await res.json()) as ISpCollectionResponse;
    return (body.value ?? [])
      .map((f) => (f as { InternalName?: unknown }).InternalName)
      .filter((n): n is string => typeof n === "string");
  }

  public async createFieldAsXml(
    listTitle: string,
    schemaXml: string,
    addToDefaultView: boolean
  ): Promise<void> {
    await this.postJson(
      `${this.listUrl(listTitle)}/fields/createfieldasxml`,
      {
        parameters: {
          __metadata: { type: "SP.XmlSchemaFieldCreationInformation" },
          SchemaXml: schemaXml,
          // SP.AddFieldOptions.AddFieldToDefaultView = 8, DefaultValue = 0
          Options: addToDefaultView ? 8 : 0,
        },
      },
      {},
      `リスト「${listTitle}」への列追加`
    );
  }

  public async getSiteGroupNames(): Promise<string[]> {
    const res = await this.http.get(
      `${this.webUrl}/_api/web/sitegroups?$select=Title&$top=500`,
      this.config,
      { headers: { Accept: ACCEPT } }
    );
    if (!res.ok) return this.fail(res, "サイトグループ一覧の取得");
    const body = (await res.json()) as ISpCollectionResponse;
    return (body.value ?? [])
      .map((g) => (g as { Title?: unknown }).Title)
      .filter((t): t is string => typeof t === "string");
  }

  public async createSiteGroup(title: string, description: string): Promise<void> {
    await this.postJson(
      `${this.webUrl}/_api/web/sitegroups`,
      { __metadata: { type: "SP.Group" }, Title: title, Description: description },
      {},
      `サイトグループ「${title}」の作成`
    );
  }

  public async getCurrentUserGroupNames(): Promise<string[]> {
    const res = await this.http.get(
      `${this.webUrl}/_api/web/currentuser/groups?$select=Title`,
      this.config,
      { headers: { Accept: ACCEPT } }
    );
    if (!res.ok) return this.fail(res, "所属グループの取得");
    const body = (await res.json()) as ISpCollectionResponse;
    return (body.value ?? [])
      .map((g) => (g as { Title?: unknown }).Title)
      .filter((t): t is string => typeof t === "string");
  }
}
