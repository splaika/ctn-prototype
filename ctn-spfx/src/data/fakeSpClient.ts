// ============================================================================
// fakeSpClient.ts — ISpRestClient のインメモリ実装（テスト用）
// ----------------------------------------------------------------------------
// SharePoint の振る舞いのうち、リポジトリの正しさに効く部分だけを模す:
//   - 数値 Id の自動採番
//   - 更新のたびに etag が進む（"1" → "2" …）
//   - IF-MATCH 不一致で 412 相当（SpConflictError）
//   - $filter=Id eq N / $filter=<Lookup>Id eq N / $top / $orderby=Id desc
// ============================================================================
import { SpConflictError, type ISpRestClient, type SpListItem } from "./spClient";

interface StoredItem {
  fields: Record<string, unknown>;
  version: number;
}

export class FakeSpClient implements ISpRestClient {
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
    return { ...stored.fields, Id: id, __etag: `"${stored.version}"` };
  }

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
    return items;
  }

  public async addItem(listTitle: string, fields: Record<string, unknown>): Promise<SpListItem> {
    const item = this.seed(listTitle, fields);
    this.calls.push({ op: "add", list: listTitle, id: item.Id });
    return item;
  }

  public async updateItem(
    listTitle: string,
    id: number,
    fields: Record<string, unknown>,
    etag: string
  ): Promise<void> {
    this.calls.push({ op: "update", list: listTitle, id });
    const stored = this.listOf(listTitle).get(id);
    if (!stored) throw new Error(`FakeSpClient: ${listTitle}#${id} がありません`);

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
  }

  public async deleteItem(listTitle: string, id: number, etag: string): Promise<void> {
    this.calls.push({ op: "delete", list: listTitle, id });
    const stored = this.listOf(listTitle).get(id);
    if (!stored) throw new Error(`FakeSpClient: ${listTitle}#${id} がありません`);
    if (etag !== `"${stored.version}"`) throw new SpConflictError("FakeSpClient: etag 不一致");
    this.listOf(listTitle).delete(id);
  }

  public async getCurrentUserGroupNames(): Promise<string[]> {
    return this.groupNames;
  }
}
