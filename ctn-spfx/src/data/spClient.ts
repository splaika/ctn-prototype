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
   * 戻り値は更新後の etag（応答の ETag ヘッダー）。連続更新のたびに
   * etag を取り直す往復を省くために使う。取れなければ undefined。
   */
  updateItem(
    listTitle: string,
    id: number,
    fields: Record<string, unknown>,
    etag: string
  ): Promise<string | undefined>;
  /** 1件削除する */
  deleteItem(listTitle: string, id: number, etag: string): Promise<void>;
  /**
   * 1項目の実 etag を取る。
   * コレクション取得の応答本文に odata.etag が入らない環境があるため
   * （SPFx の spHttpClient が Accept を上書きし nometadata 相当になる）、
   * 項目単体を GET して ETag レスポンスヘッダーから読む経路を用意する。
   */
  getItemEtag(listTitle: string, id: number): Promise<string | undefined>;
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
  /**
   * ETag レスポンスヘッダーを読むために使う（本文に odata.etag が入らない環境がある）。
   * null を返すのは Fetch API の Headers.get の契約に合わせるため。
   */
  // eslint-disable-next-line @rushstack/no-new-null
  headers?: { get(name: string): string | null };
  json(): Promise<unknown>;
  text(): Promise<string>;
}

/**
 * SPFx の SPHttpClient は OData v4 を既定で使い、`OData-Version: 4.0` を自動で
 * 付ける。そのため v3 記法（`odata=minimalmetadata` / `odata=nometadata`）は
 * 通らない（406 になる）。v4 記法は `odata.metadata=<none|minimal|full>` とドット。
 *
 * minimal を選ぶ理由: 各項目に `@odata.etag` が載る。IF-MATCH に実 etag を使う
 * 方針（* 禁止）を満たすにはこれが必要。
 */
const ACCEPT = "application/json;odata.metadata=minimal";

interface ISpCollectionResponse {
  value?: unknown[];
}

/**
 * 応答から etag を取り出す。
 * OData v4（SPFx の既定）では `@odata.etag`、v3 では `odata.etag` に載る。
 * 版によってキーが変わるため両方を見る。これを取り違えると etag が常に
 * 未取得になり、IF-MATCH を使う全ての更新が失敗する（実際にそうなった）。
 */
export function readEtag(o: Record<string, unknown>): string | undefined {
  for (const key of ["@odata.etag", "odata.etag"]) {
    const v = o[key];
    if (typeof v === "string" && v !== "") return v;
  }
  return undefined;
}

/** SharePoint が返す 1 アイテムを SpListItem へ正規化する */
export function toItem(raw: unknown): SpListItem {
  const o = (raw ?? {}) as Record<string, unknown>;
  const etag = readEtag(o);
  const item: SpListItem = { ...o, Id: Number(o.Id) };
  if (etag) item.__etag = etag;
  delete (item as Record<string, unknown>)["@odata.etag"];
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

  /**
   * 失敗を、原因を追える形で投げる。
   * どのエンドポイントで落ちたか分からないと切り分けができないため、
   * サイト URL を除いた相対パスを必ず含める。
   */
  private async fail(res: ISpHttpResponseLike, what: string, url: string): Promise<never> {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* 本文が読めないことがある */
    }
    const path = url.replace(this.webUrl, "");
    throw new Error(
      `${what} に失敗しました (HTTP ${res.status} ${res.statusText})。` +
        `対象: ${path} ${detail.slice(0, 300)}`
    );
  }

  public async getItems(listTitle: string, query?: string): Promise<SpListItem[]> {
    const url = `${this.listUrl(listTitle)}/items${query ? `?${query}` : ""}`;
    const res = await this.http.get(url, this.config, { headers: { Accept: ACCEPT } });
    if (!res.ok) return this.fail(res, `リスト「${listTitle}」の取得`, url);
    const body = (await res.json()) as ISpCollectionResponse;
    return (body.value ?? []).map(toItem);
  }

  public async getItemEtag(listTitle: string, id: number): Promise<string | undefined> {
    const res = await this.http.get(`${this.listUrl(listTitle)}/items(${id})`, this.config, {
      headers: { Accept: ACCEPT },
    });
    if (!res.ok) return undefined;
    // まず ETag ヘッダー。SharePoint は単一項目の GET で必ず返す
    const header = res.headers?.get("ETag") ?? undefined;
    if (header) return header;
    // 次に本文の odata.etag（メタデータ指定が効いている場合）
    try {
      return readEtag((await res.json()) as Record<string, unknown>);
    } catch {
      return undefined;
    }
  }

  /**
   * 項目の追加・更新の Content-Type は v3 記法（`odata=nometadata`）のままにしている。
   * 本文は注釈を持たない素の JSON なので SharePoint はこの指定を見ておらず、
   * 実テナントで追加が成功することを確認済み。仕様準拠のために v4 記法へ
   * 変えると、動いている経路を根拠なく壊すリスクだけが残るため触らない。
   * （応答の解釈側は v4 の @odata.etag を読む必要があり、そこは修正済み）
   */
  public async addItem(listTitle: string, fields: Record<string, unknown>): Promise<SpListItem> {
    const res = await this.http.post(`${this.listUrl(listTitle)}/items`, this.config, {
      headers: { Accept: ACCEPT, "Content-Type": "application/json;odata=nometadata" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) return this.fail(res, `リスト「${listTitle}」への追加`, `${this.listUrl(listTitle)}/items`);
    return toItem(await res.json());
  }

  public async updateItem(
    listTitle: string,
    id: number,
    fields: Record<string, unknown>,
    etag: string
  ): Promise<string | undefined> {
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
    if (!res.ok) await this.fail(res, `リスト「${listTitle}」の更新`, `${this.listUrl(listTitle)}/items(${id})`);
    // 更新後の etag。次の更新でこれを使えば取り直しの往復を省ける
    return res.headers?.get("ETag") ?? undefined;
  }

  public async deleteItem(listTitle: string, id: number, etag: string): Promise<void> {
    const res = await this.http.post(`${this.listUrl(listTitle)}/items(${id})`, this.config, {
      headers: { Accept: ACCEPT, "X-HTTP-Method": "DELETE", "IF-MATCH": etag },
    });
    if (res.status === 412) {
      throw new SpConflictError(`リスト「${listTitle}」の項目 ${id} は他の操作で更新されています。`);
    }
    if (!res.ok) await this.fail(res, `リスト「${listTitle}」の削除`, `${this.listUrl(listTitle)}/items(${id})`);
  }

  // -------------------------------------------------------------------------
  // プロビジョニング（ISpProvisioningClient）
  //   サイト所有者の権限で通る操作のみ。管理者権限は使わない。
  // -------------------------------------------------------------------------

  /**
   * JSON を POST して結果を返す共通処理。
   * Content-Type も OData v4 記法にする（v3 の `odata=verbose` は
   * OData-Version: 4.0 のもとでは通らない）。エンティティの型指定は
   * v3 の `__metadata` ではなく `@odata.type` を本文に入れる。
   */
  private async postJson(
    url: string,
    body: unknown,
    extraHeaders: Record<string, string>,
    what: string
  ): Promise<unknown> {
    const res = await this.http.post(url, this.config, {
      headers: {
        Accept: ACCEPT,
        "Content-Type": "application/json;odata.metadata=none",
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return this.fail(res, what, url);
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
    if (!res.ok) return this.fail(res, "リスト一覧の取得", `${this.webUrl}/_api/web/lists`);
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
        "@odata.type": "SP.List",
        Title: title,
        Description: description,
        BaseTemplate: 100,
        EnableVersioning: true,
      },
      {},
      `リスト「${title}」の作成`
    )) as { Id?: unknown; d?: { Id?: unknown } } | undefined;
    // v3(verbose) の応答は { d: {...} }、v4 は素の形で返る。両方に備える
    const id = created?.Id ?? created?.d?.Id;
    return { id: typeof id === "string" ? id : "" };
  }

  public async updateListSettings(title: string, description: string): Promise<void> {
    const res = await this.http.get(`${this.listUrl(title)}?$select=Id`, this.config, {
      headers: { Accept: ACCEPT },
    });
    if (!res.ok) await this.fail(res, `リスト「${title}」の設定取得`, this.listUrl(title));
    const raw = (await res.json()) as Record<string, unknown>;
    const etag = readEtag(raw);
    if (!etag) {
      // etag が取れないときは設定変更を諦める（IF-MATCH: * は使わない方針）
      return;
    }
    await this.postJson(
      this.listUrl(title),
      {
        "@odata.type": "SP.List",
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
    if (!res.ok) return this.fail(res, `リスト「${listTitle}」の列一覧の取得`, `${this.listUrl(listTitle)}/fields`);
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
          "@odata.type": "SP.XmlSchemaFieldCreationInformation",
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
    if (!res.ok) return this.fail(res, "サイトグループ一覧の取得", `${this.webUrl}/_api/web/sitegroups`);
    const body = (await res.json()) as ISpCollectionResponse;
    return (body.value ?? [])
      .map((g) => (g as { Title?: unknown }).Title)
      .filter((t): t is string => typeof t === "string");
  }

  public async createSiteGroup(title: string, description: string): Promise<void> {
    await this.postJson(
      `${this.webUrl}/_api/web/sitegroups`,
      { "@odata.type": "SP.Group", Title: title, Description: description },
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
    if (!res.ok) return this.fail(res, "所属グループの取得", `${this.webUrl}/_api/web/currentuser/groups`);
    const body = (await res.json()) as ISpCollectionResponse;
    return (body.value ?? [])
      .map((g) => (g as { Title?: unknown }).Title)
      .filter((t): t is string => typeof t === "string");
  }
}
