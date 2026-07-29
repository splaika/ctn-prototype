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

export class SpRestClient implements ISpRestClient {
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
