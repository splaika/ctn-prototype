// ============================================================================
// fakeSpClient.ts — ISpRestClient のインメモリ実装（テスト用）
// ----------------------------------------------------------------------------
// SharePoint の振る舞いのうち、リポジトリの正しさに効く部分だけを模す:
//   - 数値 Id の自動採番
//   - 更新のたびに etag が進む（"1" → "2" …）
//   - IF-MATCH 不一致で 412 相当（SpConflictError）
//   - $filter=Id eq N / $filter=<Lookup>Id eq N / $top / $orderby=Id desc
// ============================================================================
import listSchema from "../../provision/ctn-lists.schema.json";
import {
  SpConflictError,
  type ISpProvisioningClient,
  type ISpRestClient,
  type SpListItem,
} from "./spClient";

/**
 * 1行テキスト列の上限。SharePoint は超過を切り捨てず拒否するため、フェイクでも
 * 同じように失敗させる（これが無いと「長さを詰める」修正の検証力が無くなる）。
 */
const TEXT_MAX = 255;
const NOTE_COLUMNS: ReadonlySet<string> = new Set(
  (listSchema.lists as { fields: { name: string; type: string }[] }[]).flatMap((l) =>
    l.fields.filter((f) => f.type === "Note").map((f) => f.name)
  )
);

function assertFieldLengths(listTitle: string, fields: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === "string" && !NOTE_COLUMNS.has(k) && v.length > TEXT_MAX) {
      throw new Error(
        `FakeSpClient: ${listTitle}.${k} が上限 ${TEXT_MAX} 文字を超えています（${v.length} 文字）。` +
          "SharePoint は 1 行テキスト列の超過を拒否します。"
      );
    }
  }
}

interface StoredItem {
  fields: Record<string, unknown>;
  version: number;
}

export class FakeSpClient implements ISpRestClient, ISpProvisioningClient {
  private lists = new Map<string, Map<number, StoredItem>>();
  private nextId = new Map<string, number>();
  /** テストで所属グループを差し替える */
  public groupNames: string[] = [];
  /** 呼び出し記録（監査追記や書き込み回数の検証に使う） */
  public calls: { op: string; list: string; id?: number }[] = [];
  /**
   * 次の updateItem を1回だけ強制的に競合させる（412 リトライの検証用）。
   * 実際に他ユーザーが割り込んだ状況を模す。
   */
  public failNextUpdateWithConflict = 0;

  private listOf(name: string): Map<number, StoredItem> {
    let l = this.lists.get(name);
    if (!l) {
      l = new Map();
      this.lists.set(name, l);
    }
    return l;
  }

  /** テストの前準備でアイテムを直接置く */
  public seed(listTitle: string, fields: Record<string, unknown>): SpListItem {
    const id = (this.nextId.get(listTitle) ?? 0) + 1;
    this.nextId.set(listTitle, id);
    this.listOf(listTitle).set(id, { fields: { ...fields }, version: 1 });
    return this.toItem(id, this.listOf(listTitle).get(id)!);
  }

  /** 現在の生の格納値を覗く（アサーション用） */
  public raw(listTitle: string, id: number): Record<string, unknown> | undefined {
    return this.listOf(listTitle).get(id)?.fields;
  }
  public count(listTitle: string): number {
    return this.listOf(listTitle).size;
  }

  private toItem(id: number, stored: StoredItem): SpListItem {
    if (this.bodyNeverHasEtag) return { ...stored.fields, Id: id };
    return { ...stored.fields, Id: id, __etag: `"${stored.version}"` };
  }

  /**
   * true で、$select 付きの一覧取得の応答から etag を落とす。
   * 応答の形は環境やメタデータ指定で変わるため、最悪条件でもリポジトリが
   * etag を取り直せることを担保する。
   */
  public getItemsOmitsEtagWhenSelecting = false;
  /** 指定リストの更新（MERGE）を必ず失敗させる（巻き戻しの検証用） */
  public failUpdatesOnList: string | undefined = undefined;

  public async getItems(listTitle: string, query?: string): Promise<SpListItem[]> {
    this.calls.push({ op: "get", list: listTitle });
    let items = [...this.listOf(listTitle).entries()].map(([id, s]) => this.toItem(id, s));

    const filter = /\$filter=([^&]+)/.exec(query ?? "");
    if (filter) {
      const expr = decodeURIComponent(filter[1]);
      const m = /^(\w+)\s+eq\s+(\d+)$/.exec(expr.trim());
      if (!m) throw new Error(`FakeSpClient: 未対応の $filter です: ${expr}`);
      const [, field, value] = m;
      const wanted = Number(value);
      items = items.filter((i) => Number(field === "Id" ? i.Id : i[field]) === wanted);
    }

    if (/\$orderby=Id desc/.test(query ?? "")) items.reverse();

    const top = /\$top=(\d+)/.exec(query ?? "");
    if (top) items = items.slice(0, Number(top[1]));

    if (this.getItemsOmitsEtagWhenSelecting && /\$select=/.test(query ?? "")) {
      items = items.map((i) => {
        const { __etag, ...rest } = i;
        void __etag;
        return rest as SpListItem;
      });
    }
    return items;
  }

  /**
   * true で、追加（POST）の応答から etag を落とす。
   * 実テナントでこの挙動を踏み、作成直後の更新が必ず失敗した（項目の etag が
   * 未取得エラー）。リポジトリが etag を取り直せることを担保するためのフラグ。
   */
  public addItemOmitsEtag = false;

  public async addItem(listTitle: string, fields: Record<string, unknown>): Promise<SpListItem> {
    assertFieldLengths(listTitle, fields);
    const item = this.seed(listTitle, fields);
    this.calls.push({ op: "add", list: listTitle, id: item.Id });
    if (this.addItemOmitsEtag) {
      const { __etag, ...withoutEtag } = item;
      void __etag;
      return withoutEtag as SpListItem;
    }
    return item;
  }

  /**
   * 更新は本物と同じく、更新後の etag を返す（ETag レスポンスヘッダー相当）。
   * これを返さないとリポジトリが毎回 etag を取り直し、往復削減の検証にならない。
   */
  public async updateItem(
    listTitle: string,
    id: number,
    fields: Record<string, unknown>,
    etag: string
  ): Promise<string | undefined> {
    this.calls.push({ op: "update", list: listTitle, id });
    const stored = this.listOf(listTitle).get(id);
    if (!stored) throw new Error(`FakeSpClient: ${listTitle}#${id} がありません`);

    if (this.failUpdatesOnList === listTitle) {
      throw new Error(`FakeSpClient: 意図的な更新失敗 (${listTitle}#${id})`);
    }
    assertFieldLengths(listTitle, fields);

    if (this.failNextUpdateWithConflict > 0) {
      this.failNextUpdateWithConflict--;
      // 他者が先に書いた状況を作る（etag が進む）
      stored.version++;
      throw new SpConflictError(`FakeSpClient: 意図的な競合 (${listTitle}#${id})`);
    }
    if (etag !== `"${stored.version}"`) {
      throw new SpConflictError(
        `FakeSpClient: etag 不一致 ${listTitle}#${id} 期待 "${stored.version}" 実際 ${etag}`
      );
    }
    stored.fields = { ...stored.fields, ...fields };
    stored.version++;
    return `"${stored.version}"`;
  }

  public async deleteItem(listTitle: string, id: number, etag: string): Promise<void> {
    this.calls.push({ op: "delete", list: listTitle, id });
    const stored = this.listOf(listTitle).get(id);
    if (!stored) throw new Error(`FakeSpClient: ${listTitle}#${id} がありません`);
    if (etag !== `"${stored.version}"`) throw new SpConflictError("FakeSpClient: etag 不一致");
    this.listOf(listTitle).delete(id);
  }

  /**
   * true で、応答本文からは etag を一切返さない（追加・一覧の両方）。
   * 実テナントで起きた条件。SPFx の spHttpClient が Accept を上書きするため
   * odata.etag が本文に入らず、ETag ヘッダー経由でしか取得できない。
   */
  public bodyNeverHasEtag = false;

  public async getItemEtag(listTitle: string, id: number): Promise<string | undefined> {
    this.calls.push({ op: "getItemEtag", list: listTitle, id });
    const stored = this.listOf(listTitle).get(id);
    // ETag ヘッダー相当。項目があれば必ず返る
    return stored ? `"${stored.version}"` : undefined;
  }

  public async getCurrentUserGroupNames(): Promise<string[]> {
    return this.groupNames;
  }

  // -------------------------------------------------------------------------
  // プロビジョニング（ISpProvisioningClient）
  // -------------------------------------------------------------------------
  /** 明示的に作成されたリストのタイトル → 疑似 GUID */
  private createdLists = new Map<string, string>();
  /** リストタイトル → 列の内部名 */
  private fields = new Map<string, Set<string>>();
  /** 作られた列の Field XML（アサーション用） */
  public fieldXml: { list: string; xml: string; addToDefaultView: boolean }[] = [];
  private siteGroups = new Set<string>();
  /** 指定した列名の作成を失敗させる（部分失敗の検証用） */
  public failFieldsMatching: RegExp | undefined = undefined;

  /** テストの前準備でリストが既に在る状態を作る */
  public seedList(title: string, fieldNames: string[] = []): void {
    if (!this.createdLists.has(title)) {
      this.createdLists.set(title, `guid-${this.createdLists.size + 1}`);
    }
    this.fields.set(title, new Set(fieldNames));
  }

  public async getLists(): Promise<{ title: string; id: string }[]> {
    return [...this.createdLists.entries()].map(([title, id]) => ({ title, id }));
  }

  public async createList(title: string, _description: string): Promise<{ id: string }> {
    if (this.createdLists.has(title)) throw new Error(`FakeSpClient: リスト ${title} は既にあります`);
    const id = `guid-${this.createdLists.size + 1}`;
    this.createdLists.set(title, id);
    this.fields.set(title, new Set(["Title", "ID"]));
    this.calls.push({ op: "createList", list: title });
    return { id };
  }

  public async updateListSettings(title: string, _description: string): Promise<void> {
    if (!this.createdLists.has(title)) throw new Error(`FakeSpClient: リスト ${title} がありません`);
    this.calls.push({ op: "updateListSettings", list: title });
  }

  public async getFieldInternalNames(listTitle: string): Promise<string[]> {
    return [...(this.fields.get(listTitle) ?? new Set<string>())];
  }

  public async createFieldAsXml(
    listTitle: string,
    schemaXml: string,
    addToDefaultView: boolean
  ): Promise<void> {
    const name = /Name="([^"]+)"/.exec(schemaXml)?.[1] ?? "";
    if (this.failFieldsMatching && this.failFieldsMatching.test(name)) {
      throw new Error(`FakeSpClient: 意図的な列作成失敗 (${name})`);
    }
    const set = this.fields.get(listTitle);
    if (!set) throw new Error(`FakeSpClient: リスト ${listTitle} がありません`);
    set.add(name);
    this.fieldXml.push({ list: listTitle, xml: schemaXml, addToDefaultView });
    this.calls.push({ op: "createField", list: listTitle });
  }

  public async getSiteGroupNames(): Promise<string[]> {
    return [...this.siteGroups];
  }

  public async createSiteGroup(title: string, _description: string): Promise<void> {
    if (this.siteGroups.has(title)) throw new Error(`FakeSpClient: グループ ${title} は既にあります`);
    this.siteGroups.add(title);
    this.calls.push({ op: "createGroup", list: title });
  }
}
