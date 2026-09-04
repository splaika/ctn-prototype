// ============================================================================
// sharepointRepository.ts — CtnRepository の SharePoint リスト実装
// ----------------------------------------------------------------------------
// 設計の要点（ブリーフ 4〜6章）:
//   - 届は集約 JSON（CtnPayload）+ 昇格列を「同一書き込み」で更新する。
//     子配列を別リストに分けない: SharePoint にリスト横断トランザクションが
//     無いため、分けると1回の保存が非原子的になり採番・XML の整合が壊れる。
//   - 更新は実 etag の IF-MATCH。412 は再取得→再計算→リトライで解決する。
//   - 採番・職務分離・提出ゲートは必ず logic.ts の純粋関数を経由する。
//     この層でロジックを再実装しない（採番の単一ソースは logic.ts）。
//   - 日付は文字列のまま保持する（SharePoint 日付型は TZ でずれる）。
//
// 二層検証について: SPFx はクライアント実行のみのため、これらの強制は
// ブラウザ内のこの層で行われる。意図的に受け入れたトレードオフであり、
// 全書き込みをこの層に集約することで緩和している（README 参照）。
// ============================================================================
import {
  applyInheritance,
  canCompleteReview,
  canSubmit,
  computeFilingNumbers,
  devStatusAfterSubmit,
  finalizeSerials,
  normalizeGaiji,
  pickInheritanceSource,
} from "../shared/ctn/logic";
import { assertPermission, type CtnRole } from "../shared/ctn/permissions";
import { NOTIF_TYPE_SHORT, TODAY } from "../shared/ctn/refData";
import type {
  AuditEntry,
  Compound,
  Doctor,
  GaijiRecord,
  Institution,
  Irb,
  Notification,
  SiteStaff,
  Sponsor,
} from "../shared/ctn/types";
import type {
  CreateNotificationInput,
  CtnDb,
  CtnRepository,
} from "../shared/ctn/data/repository";
import { SpConflictError, type ISpRestClient, type SpListItem } from "./spClient";
import listSchema from "../../provision/ctn-lists.schema.json";

/** 一覧取得の上限。30ユーザー・数百件規模を想定（ブリーフ 4章） */
const TOP = 500;

/** リスト名（provision/ctn-lists.schema.json と対応） */
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
} as const;

const PAYLOAD_VERSION = "1";

/** 提出時の採番確定でリトライする回数（412 の解決） */
const SUBMIT_RETRIES = 3;

/**
 * 複数行テキスト（Note）の列。ここに集約JSONや長文が入るので長さを詰めない。
 * それ以外の1行テキストは 255 文字上限で、超えると SharePoint がエラーを返す
 * （切り捨ててはくれない）。スキーマから導いて取りこぼしを防ぐ。
 */
const NOTE_COLUMNS: ReadonlySet<string> = new Set(
  (listSchema.lists as { fields: { name: string; type: string }[] }[]).flatMap((l) =>
    l.fields.filter((f) => f.type === "Note").map((f) => f.name)
  )
);
const TEXT_MAX = 255;

/**
 * 1行テキスト列の値を上限に収める。
 * 医療機関名や備考のような自由入力が上限を超えると書き込み全体が失敗するため、
 * 書き込み直前に一律で通す（Note 列は対象外）。
 */
function clampFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = typeof v === "string" && !NOTE_COLUMNS.has(k) && v.length > TEXT_MAX ? v.slice(0, TEXT_MAX) : v;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 値の変換ヘルパ
//   SharePoint の数値 Id ⇔ ドメインの文字列 id はこの境界で完結させ、
//   UI へは漏らさない（ブリーフ 6章）。
// ---------------------------------------------------------------------------
const toId = (v: unknown): string => String(v ?? "");
const toNum = (v: unknown): number => (typeof v === "number" ? v : Number(v ?? 0));
const toStr = (v: unknown): string => (typeof v === "string" ? v : v === null || v === undefined ? "" : String(v));
const toOptStr = (v: unknown): string | undefined => {
  const s = toStr(v);
  return s === "" ? undefined : s;
};
const toBool = (v: unknown): boolean => v === true || v === "true" || v === 1;
/** ルックアップ列の値（数値 Id）→ ドメインの文字列 id */
const lookupId = (v: unknown): string => (v === null || v === undefined ? "" : String(v));
/**
 * ドメインの文字列 id → ルックアップ列に書く数値。
 * 空なら null を返す: SharePoint REST では null がルックアップの「クリア」で、
 * undefined だとフィールド自体が送られず既存値が残ってしまう。
 */
// eslint-disable-next-line @rushstack/no-new-null
const lookupWrite = (id: string | undefined): number | null => {
  if (!id) return null;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
};

export class SharePointCtnRepository implements CtnRepository {
  /** 更新に使う実 etag のキャッシュ（getState / 書き込み応答で更新） */
  private etags = new Map<string, string>();

  public constructor(
    private readonly sp: ISpRestClient,
    /** 監査ログの actor 表示名を引くための解決関数（pageContext 由来） */
    private readonly displayNameOf: (actorId: string) => string,
    /**
     * actor → ロールの解決。既定は最小権限。
     * Web パーツは「デモの操作ユーザーならその人のロール、それ以外は
     * サインインユーザーのサイトグループ由来のロール」を返す関数を渡す。
     * 画面側も同じ actor のロールで可否を出すため、両者は必ず一致する。
     */
    private readonly roleOf: (actorId: string) => CtnRole = () => "viewer"
  ) {}

  private etagKey(list: string, id: string): string {
    return `${list}#${id}`;
  }
  private rememberEtag(list: string, item: SpListItem): void {
    if (item.__etag) this.etags.set(this.etagKey(list, String(item.Id)), item.__etag);
  }
  /**
   * 更新に使う実 etag を得る。
   * キャッシュに無ければ当該項目を取り直す。作成（POST）の応答に odata.etag が
   * 含まれない環境があり、応答だけに頼ると直後の更新が必ず失敗するため。
   * IF-MATCH: * は使わない方針なので、取得できなければ明示的に失敗させる。
   */
  private async etagFor(list: string, id: string): Promise<string> {
    const key = this.etagKey(list, id);
    const cached = this.etags.get(key);
    if (cached) return cached;

    // 一覧取得の応答本文に odata.etag が入らない環境があるため（SPFx の
    // spHttpClient が Accept を上書きする）、項目単体の ETag ヘッダーを読む。
    const viaHeader = await this.sp.getItemEtag(list, Number(id));
    if (viaHeader) {
      this.etags.set(key, viaHeader);
      return viaHeader;
    }

    // 最後の手段として一覧取得の本文を見る（メタデータ指定が効く環境向け）
    const items = await this.sp.getItems(list, `$filter=Id eq ${Number(id)}`);
    if (items[0]) this.rememberEtag(list, items[0]);
    const e = this.etags.get(key);
    if (!e) {
      throw new Error(
        `${list} の項目 ${id} の更新情報（etag）を取得できませんでした。` +
          "画面を再読み込みしても直らない場合は管理者へ連絡してください。"
      );
    }
    return e;
  }

  /** 追加。テキスト長を整えてから送る */
  private async add(list: string, fields: Record<string, unknown>): Promise<SpListItem> {
    const created = await this.sp.addItem(list, clampFields(fields));
    this.rememberEtag(list, created);
    return created;
  }

  /** 更新（MERGE）。テキスト長を整え、実 etag を解決してから送る */
  private async merge(list: string, id: string, fields: Record<string, unknown>): Promise<void> {
    const next = await this.sp.updateItem(list, Number(id), clampFields(fields), await this.etagFor(list, id));
    const key = this.etagKey(list, id);
    // 応答が新しい etag を返したらそれを覚える（次の更新で取り直さずに済む）。
    // 返さなければキャッシュを捨てて、次回に取り直させる。
    if (next) this.etags.set(key, next);
    else this.etags.delete(key);
  }

  // -------------------------------------------------------------------------
  // 読み取り
  // -------------------------------------------------------------------------
  public async getState(): Promise<CtnDb> {
    const sel = (fields: string[]): string => `$select=${fields.join(",")}&$top=${TOP}`;

    const [
      compounds,
      notifications,
      institutions,
      doctors,
      siteStaff,
      irbs,
      sponsors,
      gaiji,
      audit,
    ] = await Promise.all([
      this.sp.getItems(LIST.compounds, sel(["Id", "CtnCompoundCode", "CtnTargetCategory", "CtnTrialKind", "CtnInitReceptNo", "CtnInitNoteDate", "CtnDevStatus", "CtnSponsorId", "CtnDrugName", "CtnCreatedAt"])),
      this.sp.getItems(LIST.notifications, sel(["Id", "CtnCompoundId", "CtnPayload", "CtnPayloadVersion"])),
      this.sp.getItems(LIST.institutions, sel(["Id", "CtnCode", "CtnName", "CtnAddress1", "CtnAddress2", "CtnTelNo", "CtnDepartments", "CtnActive"])),
      this.sp.getItems(LIST.doctors, sel(["Id", "CtnDoctorNo", "CtnNameOriginal", "CtnNameFiling", "CtnPronounce", "CtnMedSchoolNo", "CtnGraduationYear", "CtnHasGaiji", "CtnInstitutionId", "CtnActive"])),
      this.sp.getItems(LIST.siteStaff, sel(["Id", "CtnName", "CtnKana", "CtnStaffRole", "CtnInstitutionId", "CtnTelNo", "CtnMail", "CtnActive"])),
      this.sp.getItems(LIST.irbs, sel(["Id", "CtnIrbType", "CtnOwnerName", "CtnAddress1", "CtnAddress2", "CtnActive"])),
      this.sp.getItems(LIST.sponsors, sel(["Id", "CtnSponsorType", "CtnName", "CtnRepName", "CtnAddress1", "CtnAddress2", "CtnManufacturerCode", "CtnContactName", "CtnContactTitle", "CtnTelNo", "CtnFaxOrMail", "CtnOverseasInfo", "CtnActive"])),
      this.sp.getItems(LIST.gaiji, sel(["Id", "CtnDoctorId", "CtnNotificationId", "CtnTargetColumn", "CtnOriginalChar", "CtnCodePoint", "CtnReplacementChar", "CtnGaijiType", "CtnConfirmedBy", "CtnConfirmedOn"])),
      this.sp.getItems(LIST.audit, `$select=Id,CtnAt,CtnWho,CtnAction,CtnEntity,CtnEntityRef,CtnSummary&$top=${TOP}&$orderby=Id desc`),
    ]);

    compounds.forEach((i) => this.rememberEtag(LIST.compounds, i));
    notifications.forEach((i) => this.rememberEtag(LIST.notifications, i));
    institutions.forEach((i) => this.rememberEtag(LIST.institutions, i));
    doctors.forEach((i) => this.rememberEtag(LIST.doctors, i));
    siteStaff.forEach((i) => this.rememberEtag(LIST.siteStaff, i));
    irbs.forEach((i) => this.rememberEtag(LIST.irbs, i));
    sponsors.forEach((i) => this.rememberEtag(LIST.sponsors, i));

    return {
      compounds: compounds.map(readCompound),
      // 1行でも壊れた Payload があると全画面が開けなくなるのは割に合わないので、
      // 読めない行は飛ばして続行する（何を飛ばしたかはコンソールに出す）。
      notifications: notifications.reduce<Notification[]>((acc, item) => {
        try {
          acc.push(readNotification(item));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(`[CTN Suite] 治験届 ${item.Id} を読み込めませんでした。この届は一覧に出ません。`, e);
        }
        return acc;
      }, []),
      institutions: institutions.map(readInstitution),
      doctors: doctors.map(readDoctor),
      siteStaff: siteStaff.map(readSiteStaff),
      irbs: irbs.map(readIrb),
      sponsors: sponsors.map(readSponsor),
      gaiji: gaiji.map(readGaiji),
      audit: audit.map(readAudit),
    };
  }

  /** 届1件を最新状態で取り直す（採番の再計算・412 リトライで使う） */
  private async fetchNotification(id: string): Promise<Notification> {
    const items = await this.sp.getItems(
      LIST.notifications,
      `$select=Id,CtnCompoundId,CtnPayload,CtnPayloadVersion&$filter=Id eq ${Number(id)}`
    );
    const item = items[0];
    if (!item) throw new Error(`Not found: ${id}`);
    this.rememberEtag(LIST.notifications, item);
    return readNotification(item);
  }

  /** 同一シリーズの届を取り直す（採番に必要な範囲だけ） */
  private async fetchSeries(compoundId: string): Promise<Notification[]> {
    const items = await this.sp.getItems(
      LIST.notifications,
      `$select=Id,CtnCompoundId,CtnPayload,CtnPayloadVersion&$filter=CtnCompoundId eq ${Number(compoundId)}&$top=${TOP}`
    );
    items.forEach((i) => this.rememberEtag(LIST.notifications, i));
    return items.map(readNotification);
  }

  // -------------------------------------------------------------------------
  // 監査（追記専用）
  // -------------------------------------------------------------------------
  /**
   * 監査ログを追記する。
   * 追記の失敗で業務操作を失敗扱いにしない: 本体の書き込みは既に成功しており、
   * ここで投げるとユーザーには失敗に見えて再試行され、重複を生む。
   * 記録漏れは検知できるようコンソールへ出す。
   */
  private async pushAudit(a: Omit<AuditEntry, "id" | "at">): Promise<void> {
    try {
      await this.writeAudit(a);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[CTN Suite] 監査ログの追記に失敗しました（操作自体は完了しています）。", a, e);
    }
  }

  private async writeAudit(a: Omit<AuditEntry, "id" | "at">): Promise<void> {
    await this.add(LIST.audit, {
      Title: a.summary.slice(0, 255),
      CtnAt: nowIso(),
      CtnWho: a.who,
      CtnAction: a.action,
      CtnEntity: a.entity,
      CtnEntityRef: a.entityRef,
      CtnSummary: a.summary,
    });
  }
  public async addAudit(entry: Omit<AuditEntry, "id" | "at">, _actor: string): Promise<void> {
    // actor は entry.who に含まれる前提（mock 実装と同じ契約）
    await this.pushAudit(entry);
  }
  private actorName(actorId: string): string {
    return this.displayNameOf(actorId);
  }

  // -------------------------------------------------------------------------
  // マスタ CRUD（共通ヘルパ）
  // -------------------------------------------------------------------------
  private async createMaster<T extends { id: string }>(
    list: string,
    fields: Record<string, unknown>,
    read: (i: SpListItem) => T
  ): Promise<T> {
    const created = await this.add(list, fields);
    this.rememberEtag(list, created);
    // 追加応答は $select を効かせられないため、確実な形にするため読み直す
    const items = await this.sp.getItems(list, `$filter=Id eq ${created.Id}`);
    const item = items[0] ?? created;
    this.rememberEtag(list, item);
    return read(item);
  }

  private async updateMaster<T extends { id: string }>(
    list: string,
    rec: T,
    fields: Record<string, unknown>,
    read: (i: SpListItem) => T
  ): Promise<T> {
    await this.merge(list, rec.id, fields);
    const items = await this.sp.getItems(list, `$filter=Id eq ${Number(rec.id)}`);
    const item = items[0];
    if (!item) throw new Error(`Not found: ${rec.id}`);
    this.rememberEtag(list, item);
    return read(item);
  }

  private async setActive(list: string, id: string, active: boolean): Promise<void> {
    await this.merge(list, id, { CtnActive: active });
    const items = await this.sp.getItems(list, `$filter=Id eq ${Number(id)}`);
    if (items[0]) this.rememberEtag(list, items[0]);
  }

  // ---- 医療機関マスタ ----
  public async createInstitution(rec: Omit<Institution, "id">, actor: string): Promise<Institution> {
    const r = await this.createMaster(LIST.institutions, writeInstitution(rec), readInstitution);
    await this.pushAudit({ who: this.actorName(actor), action: "create", entity: "医療機関マスタ", entityRef: r.name, summary: `機関「${r.name}」を登録` });
    return r;
  }
  public async updateInstitution(rec: Institution, actor: string): Promise<Institution> {
    const r = await this.updateMaster(LIST.institutions, rec, writeInstitution(rec), readInstitution);
    await this.pushAudit({ who: this.actorName(actor), action: "update", entity: "医療機関マスタ", entityRef: r.name, summary: `機関「${r.name}」を更新` });
    return r;
  }
  public async setInstitutionActive(id: string, active: boolean, actor: string): Promise<void> {
    await this.setActive(LIST.institutions, id, active);
    await this.pushAudit({ who: this.actorName(actor), action: active ? "restore" : "delete", entity: "医療機関マスタ", entityRef: id, summary: `機関を${active ? "有効化" : "論理削除（無効化）"}` });
  }

  // ---- 医師マスタ ----
  public async createDoctor(rec: Omit<Doctor, "id">, actor: string): Promise<Doctor> {
    // 届出用表記が空なら外字正規化で補完（mock と同じ挙動）
    const filled = { ...rec, nameFiling: rec.nameFiling || normalizeGaiji(rec.nameOriginal) };
    const r = await this.createMaster(LIST.doctors, writeDoctor(filled), readDoctor);
    await this.pushAudit({ who: this.actorName(actor), action: "create", entity: "医師マスタ", entityRef: r.nameFiling, summary: `医師「${r.nameOriginal}」を登録${r.hasGaiji ? "（外字あり）" : ""}` });
    return r;
  }
  public async updateDoctor(rec: Doctor, actor: string): Promise<Doctor> {
    const r = await this.updateMaster(LIST.doctors, rec, writeDoctor(rec), readDoctor);
    await this.pushAudit({ who: this.actorName(actor), action: "update", entity: "医師マスタ", entityRef: r.nameFiling, summary: `医師「${r.nameOriginal}」を更新（改名は同一行更新）` });
    return r;
  }
  public async setDoctorActive(id: string, active: boolean, actor: string): Promise<void> {
    await this.setActive(LIST.doctors, id, active);
    await this.pushAudit({ who: this.actorName(actor), action: active ? "restore" : "delete", entity: "医師マスタ", entityRef: id, summary: `医師を${active ? "有効化" : "論理削除"}` });
  }

  // ---- IRBマスタ ----
  public async createIrb(rec: Omit<Irb, "id">, actor: string): Promise<Irb> {
    const r = await this.createMaster(LIST.irbs, writeIrb(rec), readIrb);
    await this.pushAudit({ who: this.actorName(actor), action: "create", entity: "IRBマスタ", entityRef: r.ownerName, summary: `IRB「${r.ownerName}」を登録` });
    return r;
  }
  public async updateIrb(rec: Irb, actor: string): Promise<Irb> {
    const r = await this.updateMaster(LIST.irbs, rec, writeIrb(rec), readIrb);
    await this.pushAudit({ who: this.actorName(actor), action: "update", entity: "IRBマスタ", entityRef: r.ownerName, summary: `IRB「${r.ownerName}」を更新` });
    return r;
  }
  public async setIrbActive(id: string, active: boolean, actor: string): Promise<void> {
    await this.setActive(LIST.irbs, id, active);
    await this.pushAudit({ who: this.actorName(actor), action: active ? "restore" : "delete", entity: "IRBマスタ", entityRef: id, summary: `IRBを${active ? "有効化" : "論理削除"}` });
  }

  // ---- 治験届出者マスタ ----
  public async createSponsor(rec: Omit<Sponsor, "id">, actor: string): Promise<Sponsor> {
    const r = await this.createMaster(LIST.sponsors, writeSponsor(rec), readSponsor);
    await this.pushAudit({ who: this.actorName(actor), action: "create", entity: "治験届出者", entityRef: r.name, summary: `届出者「${r.name}」を登録` });
    return r;
  }
  public async updateSponsor(rec: Sponsor, actor: string): Promise<Sponsor> {
    const r = await this.updateMaster(LIST.sponsors, rec, writeSponsor(rec), readSponsor);
    await this.pushAudit({ who: this.actorName(actor), action: "update", entity: "治験届出者", entityRef: r.name, summary: `届出者「${r.name}」を更新` });
    return r;
  }
  public async setSponsorActive(id: string, active: boolean, actor: string): Promise<void> {
    await this.setActive(LIST.sponsors, id, active);
    await this.pushAudit({ who: this.actorName(actor), action: active ? "restore" : "delete", entity: "治験届出者", entityRef: id, summary: `届出者を${active ? "有効化" : "論理削除"}` });
  }

  // ---- 現場担当（CRC等） ----
  public async createSiteStaff(rec: Omit<SiteStaff, "id">, actor: string): Promise<SiteStaff> {
    const r = await this.createMaster(LIST.siteStaff, writeSiteStaff(rec), readSiteStaff);
    await this.pushAudit({ who: this.actorName(actor), action: "create", entity: "現場担当", entityRef: r.name, summary: `${r.role}「${r.name}」を登録` });
    return r;
  }
  public async updateSiteStaff(rec: SiteStaff, actor: string): Promise<SiteStaff> {
    const r = await this.updateMaster(LIST.siteStaff, rec, writeSiteStaff(rec), readSiteStaff);
    await this.pushAudit({ who: this.actorName(actor), action: "update", entity: "現場担当", entityRef: r.name, summary: `${r.role}「${r.name}」を更新` });
    return r;
  }
  public async setSiteStaffActive(id: string, active: boolean, actor: string): Promise<void> {
    await this.setActive(LIST.siteStaff, id, active);
    await this.pushAudit({ who: this.actorName(actor), action: active ? "restore" : "delete", entity: "現場担当", entityRef: id, summary: `現場担当を${active ? "有効化" : "論理削除"}` });
  }

  // ---- シリーズ（治験成分） ----
  public async createCompound(rec: Omit<Compound, "id" | "createdAt">, actor: string): Promise<Compound> {
    const withDate = { ...rec, createdAt: TODAY };
    const r = await this.createMaster(LIST.compounds, writeCompound(withDate), readCompound);
    await this.pushAudit({ who: this.actorName(actor), action: "create", entity: "治験成分", entityRef: r.compoundCode, summary: `シリーズ「${r.compoundCode}」を作成` });
    return r;
  }

  // -------------------------------------------------------------------------
  // 治験届
  // -------------------------------------------------------------------------
  public async createNotification(input: CreateNotificationInput): Promise<Notification> {
    assertPermission(this.roleOf(input.createdBy), "createNotification");
    const series = await this.fetchSeries(input.compoundId);
    const compounds = await this.sp.getItems(
      LIST.compounds,
      `$filter=Id eq ${Number(input.compoundId)}`
    );
    const compoundItem = compounds[0];
    if (!compoundItem) throw new Error(`Not found: ${input.compoundId}`);
    const compound = readCompound(compoundItem);
    // ここで引いた記号を覚えておく（直後の保存で取り直さずに済む）
    this.compoundCodes.set(compound.id, compound.compoundCode);

    // 【根幹】採番は logic.ts が本体（mock と同一の関数）
    const { filingCount, changeCount } = computeFilingNumbers(series, input);

    let seq = 0;
    const newId = (): string => `${Date.now().toString(36)}${++seq}`;

    const base: Notification = {
      id: "", // SharePoint の Id が採れるまで空。書き込み後に確定する
      compoundId: input.compoundId,
      notifType: input.notifType,
      filingCount,
      changeCount,
      status: "draft",
      changeLocations: [],
      protocolNo: "",
      objectives: "",
      targetDisease: "",
      isGlobal: false,
      sponsorId: compound.sponsorId,
      studyDrugs: [],
      sites: [],
      attachments: [],
      references: [],
      inquiries: [],
      createdBy: input.createdBy,
      createdAt: TODAY,
    };

    const from = pickInheritanceSource(series, series, input, filingCount);
    if (from) applyInheritance(base, from, newId);

    const created = await this.add(LIST.notifications, writeNotification(base, compound.compoundCode));

    // 集約 JSON 内の id を SharePoint の Id に合わせて確定させる（2段目の書き込み）
    base.id = String(created.Id);
    let saved: Notification;
    try {
      saved = await this.writeNotificationItem(base, compound.compoundCode);
    } catch (e) {
      // 2段目が失敗すると中途半端な届が残り、再試行のたびに増えていく。
      // 追加した分を取り消してから投げ直す（取り消し自体の失敗は握る）。
      try {
        await this.sp.deleteItem(
          LIST.notifications,
          Number(created.Id),
          await this.etagFor(LIST.notifications, String(created.Id))
        );
      } catch {
        /* 取り消せなくても、元の失敗理由を優先して伝える */
      }
      throw e;
    }

    await this.pushAudit({
      who: this.actorName(input.createdBy),
      action: "create",
      entity: "治験届",
      entityRef: `${compound.compoundCode} ${NOTIF_TYPE_SHORT[input.notifType]}届 #${filingCount}`,
      summary: `${NOTIF_TYPE_SHORT[input.notifType]}届を起票（届出回数 ${filingCount}${changeCount ? `・変更回数 ${changeCount}` : ""}）`,
    });
    return saved;
  }

  /**
   * 集約 JSON と昇格列を「同一書き込み」で更新する（別々に更新しない）。
   * 書き込んだ内容がそのまま保存後の状態なので、確認のための再取得はしない
   * （1往復ぶんの待ちを削る）。etag は更新応答から引き継いでいる。
   */
  private async writeNotificationItem(n: Notification, compoundCode: string): Promise<Notification> {
    await this.merge(LIST.notifications, n.id, writeNotification(n, compoundCode));
    return structuredClone(n);
  }

  /**
   * 治験成分記号を引く。表示名（Title 列）の組み立てにしか使わず、値はほぼ
   * 変わらないのでキャッシュする。書き込みごとに1往復増えるのを避けるため。
   */
  private compoundCodes = new Map<string, string>();
  private async compoundCodeOf(compoundId: string): Promise<string> {
    const hit = this.compoundCodes.get(compoundId);
    if (hit !== undefined) return hit;
    const items = await this.sp.getItems(LIST.compounds, `$filter=Id eq ${Number(compoundId)}`);
    const code = items[0] ? toStr(items[0].CtnCompoundCode) : "";
    this.compoundCodes.set(compoundId, code);
    return code;
  }

  /**
   * 未採番（serialNo<=0）が1つも無ければシリーズの取り直しは不要。
   * 治験使用薬の順序番号はシリーズ内で採番するため他の届が必要になるが、
   * すべて採番済みなら参照しても結果は変わらない。1往復ぶん省ける。
   */
  private static needsSerialNumbering(n: Notification): boolean {
    if (n.studyDrugs.some((d) => d.serialNo <= 0)) return true;
    return n.sites.some(
      (s) => s.serialNo <= 0 || s.investigators.some((i) => i.serialNo <= 0)
    );
  }

  public async updateNotification(n: Notification, actor: string): Promise<Notification> {
    assertPermission(this.roleOf(actor), "editNotification");
    const saved = structuredClone(n);
    if (SharePointCtnRepository.needsSerialNumbering(saved)) {
      const series = await this.fetchSeries(saved.compoundId);
      finalizeSerials(saved, series.filter((x) => x.id !== saved.id));
    }
    const code = await this.compoundCodeOf(saved.compoundId);
    const result = await this.writeNotificationItem(saved, code);
    await this.pushAudit({
      who: this.actorName(actor),
      action: "update",
      entity: "治験届",
      entityRef: `${code} ${NOTIF_TYPE_SHORT[saved.notifType]}届 #${saved.filingCount}`,
      summary: "内容を保存",
    });
    return result;
  }

  public async deleteNotification(id: string, actor: string): Promise<void> {
    assertPermission(this.roleOf(actor), "deleteNotification");
    const n = await this.fetchNotification(id);
    if (n.status !== "draft") throw new Error("レビュー中・提出済の届は削除できません（作成中のみ削除可）。");
    const code = await this.compoundCodeOf(n.compoundId);
    await this.sp.deleteItem(LIST.notifications, Number(id), await this.etagFor(LIST.notifications, id));
    await this.pushAudit({
      who: this.actorName(actor),
      action: "delete",
      entity: "治験届",
      entityRef: `${code} ${NOTIF_TYPE_SHORT[n.notifType]}届`,
      summary: "起票中の届を削除",
    });
  }

  public async sendForReview(id: string, actor: string): Promise<void> {
    assertPermission(this.roleOf(actor), "sendForReview");
    const n = await this.fetchNotification(id);
    n.status = "review";
    // 差し戻しの記録は再送付で消す（起票中バナーを残さない）
    delete n.rejectedBy;
    delete n.rejectedAt;
    delete n.rejectionReason;
    const code = await this.compoundCodeOf(n.compoundId);
    await this.writeNotificationItem(n, code);
    await this.pushAudit({ who: this.actorName(actor), action: "update", entity: "治験届", entityRef: this.ref(n, code), summary: "社内レビューへ送付" });
  }

  public async rejectNotification(id: string, actor: string, reason: string): Promise<void> {
    assertPermission(this.roleOf(actor), "rejectNotification");
    const n = await this.fetchNotification(id);
    if (n.status !== "review") throw new Error("差し戻せるのはレビュー中の届のみです。");
    const note = reason.trim();
    if (!note) throw new Error("差し戻しには理由の入力が必要です。");
    n.status = "draft";
    n.rejectedBy = actor;
    n.rejectedAt = TODAY;
    n.rejectionReason = note;
    const code = await this.compoundCodeOf(n.compoundId);
    await this.writeNotificationItem(n, code);
    await this.pushAudit({ who: this.actorName(actor), action: "update", entity: "治験届", entityRef: this.ref(n, code), summary: `差し戻し：${note}` });
  }

  /**
   * レビュー完了・提出。順序番号の確定は「最新を再取得 → 再計算 → etag 付き書き込み →
   * 412 ならリトライ」で衝突を防ぐ（過去に採番衝突バグの前歴あり・ブリーフ 5章）。
   */
  public async submitNotification(id: string, actor: string): Promise<void> {
    assertPermission(this.roleOf(actor), "submitNotification");
    let lastConflict: unknown;
    for (let attempt = 0; attempt < SUBMIT_RETRIES; attempt++) {
      const n = await this.fetchNotification(id); // 最新を再取得
      const gate = canSubmit(n); // 提出ゲート：レビュー中のみ
      if (!gate.ok) throw new Error(gate.reason);
      const sod = canCompleteReview(n, actor); // 職務分離：起票者≠レビュー完了者
      if (!sod.ok) throw new Error(sod.reason);

      const series = await this.fetchSeries(n.compoundId);
      finalizeSerials(n, series.filter((x) => x.id !== n.id)); // 再計算
      n.status = "submitted";
      n.reviewedBy = actor;
      n.reviewedAt = TODAY;
      n.submittedAt = TODAY;
      n.noteDate = n.noteDate || TODAY;

      const code = await this.compoundCodeOf(n.compoundId);
      try {
        await this.writeNotificationItem(n, code); // 実 etag 付き書き込み
      } catch (e) {
        if (e instanceof SpConflictError) {
          lastConflict = e; // 他者が先に更新 → 再取得からやり直す
          continue;
        }
        throw e;
      }

      // 開発中止届の提出でシリーズ開発状態を更新
      const nextDevStatus = devStatusAfterSubmit(n.notifType);
      if (nextDevStatus !== null) {
        await this.merge(LIST.compounds, n.compoundId, { CtnDevStatus: nextDevStatus });
      }

      await this.pushAudit({
        who: this.actorName(actor),
        action: "submit",
        entity: "治験届",
        entityRef: this.ref(n, code),
        summary: `提出（順序番号確定${nextDevStatus !== null ? "・開発状態を開発中止へ" : ""}）`,
      });
      return;
    }
    throw new Error(
      `提出が競合により ${SUBMIT_RETRIES} 回失敗しました。他の担当者が同じ届を編集している可能性があります。` +
        `画面を再読み込みして操作し直してください。（${(lastConflict as Error)?.message ?? ""}）`
    );
  }

  public async markXmlGenerated(id: string, actor: string): Promise<void> {
    const n = await this.fetchNotification(id);
    n.xmlGeneratedAt = nowIso();
    const code = await this.compoundCodeOf(n.compoundId);
    await this.writeNotificationItem(n, code);
    await this.pushAudit({ who: this.actorName(actor), action: "generate-xml", entity: "治験届", entityRef: this.ref(n, code), summary: "CTN XMLを生成・XSD（デモサブセット）検証" });
  }

  public async addGaijiRecord(rec: Omit<GaijiRecord, "id">): Promise<void> {
    await this.add(LIST.gaiji, {
      Title: `${rec.originalChar} → ${rec.replacementChar}`,
      CtnDoctorId: lookupWrite(rec.doctorId),
      CtnNotificationId: lookupWrite(rec.notificationId),
      CtnTargetColumn: rec.targetColumn,
      CtnOriginalChar: rec.originalChar,
      CtnCodePoint: rec.codePoint,
      CtnReplacementChar: rec.replacementChar,
      CtnGaijiType: rec.gaijiType,
      CtnConfirmedBy: rec.confirmedBy,
      CtnConfirmedOn: rec.confirmedOn,
    });
    // 医師の外字フラグを立てる（mock と同じ付随更新）
    await this.merge(LIST.doctors, rec.doctorId, { CtnHasGaiji: true });
  }

  private ref(n: Notification, compoundCode: string): string {
    return `${compoundCode} ${NOTIF_TYPE_SHORT[n.notifType]}届 #${n.filingCount}`;
  }
}

// ---------------------------------------------------------------------------
// 行 ⇔ ドメイン の写像
//   届だけは集約 JSON（CtnPayload）が正で、昇格列は一覧・絞り込み用の投影。
// ---------------------------------------------------------------------------
function nowIso(): string {
  return `${TODAY}T${new Date().toTimeString().slice(0, 8)}`;
}

export function readNotification(i: SpListItem): Notification {
  const raw = toStr(i.CtnPayload);
  if (!raw) throw new Error(`治験届 ${i.Id} の CtnPayload が空です。データが壊れている可能性があります。`);
  let parsed: Notification;
  try {
    parsed = JSON.parse(raw) as Notification;
  } catch (e) {
    throw new Error(`治験届 ${i.Id} の CtnPayload を解釈できません: ${(e as Error).message}`);
  }
  // id と compoundId は SharePoint 側の値を正とする（Payload 内は保険）
  // 旧ステータス "approved"（承認を廃止する前のデータ）は "review" として読む。
  // 既存サイトのリストには承認済の届が残っているため、これが無いと画面が壊れる。
  const status = (parsed.status as string) === "approved" ? "review" : parsed.status;
  return { ...parsed, status, id: String(i.Id), compoundId: lookupId(i.CtnCompoundId) || parsed.compoundId };
}

export function writeNotification(n: Notification, compoundCode: string): Record<string, unknown> {
  const short = NOTIF_TYPE_SHORT[n.notifType];
  const numbers = `届${n.filingCount}${n.changeCount ? `/変${n.changeCount}` : ""}`;
  return {
    Title: `${compoundCode} ${numbers} ${short}届`.slice(0, 255),
    CtnCompoundId: lookupWrite(n.compoundId),
    CtnNotifType: n.notifType,
    CtnFilingCount: n.filingCount,
    CtnChangeCount: n.changeCount ?? null,
    CtnStatus: n.status,
    CtnProtocolNo: n.protocolNo,
    CtnNoteDate: n.noteDate ?? "",
    CtnCreatedByUser: n.createdBy,
    CtnReviewedByUser: n.reviewedBy ?? "",
    CtnPayload: JSON.stringify(n),
    CtnPayloadVersion: PAYLOAD_VERSION,
  };
}

function readCompound(i: SpListItem): Compound {
  return {
    id: toId(i.Id),
    compoundCode: toStr(i.CtnCompoundCode),
    targetCategory: toNum(i.CtnTargetCategory),
    trialKind: toStr(i.CtnTrialKind),
    initReceptNo: toStr(i.CtnInitReceptNo),
    initNoteDate: toStr(i.CtnInitNoteDate),
    devStatus: toNum(i.CtnDevStatus),
    sponsorId: lookupId(i.CtnSponsorId),
    drugName: toStr(i.CtnDrugName),
    createdAt: toStr(i.CtnCreatedAt),
  };
}
function writeCompound(c: Omit<Compound, "id">): Record<string, unknown> {
  return {
    Title: c.compoundCode.slice(0, 255),
    CtnCompoundCode: c.compoundCode,
    CtnTargetCategory: c.targetCategory,
    CtnTrialKind: c.trialKind,
    CtnInitReceptNo: c.initReceptNo,
    CtnInitNoteDate: c.initNoteDate,
    CtnDevStatus: c.devStatus,
    CtnSponsorId: lookupWrite(c.sponsorId),
    CtnDrugName: c.drugName,
    CtnCreatedAt: c.createdAt,
  };
}

function readSponsor(i: SpListItem): Sponsor {
  return {
    id: toId(i.Id),
    sponsorType: toStr(i.CtnSponsorType),
    name: toStr(i.CtnName),
    repName: toStr(i.CtnRepName),
    address1: toStr(i.CtnAddress1),
    address2: toStr(i.CtnAddress2),
    manufacturerCode: toStr(i.CtnManufacturerCode),
    contactName: toStr(i.CtnContactName),
    contactTitle: toStr(i.CtnContactTitle),
    telNo: toStr(i.CtnTelNo),
    faxOrMail: toStr(i.CtnFaxOrMail),
    overseasInfo: toOptStr(i.CtnOverseasInfo),
    active: toBool(i.CtnActive),
  };
}
function writeSponsor(s: Omit<Sponsor, "id">): Record<string, unknown> {
  return {
    Title: s.name.slice(0, 255),
    CtnSponsorType: s.sponsorType,
    CtnName: s.name,
    CtnRepName: s.repName,
    CtnAddress1: s.address1,
    CtnAddress2: s.address2,
    CtnManufacturerCode: s.manufacturerCode,
    CtnContactName: s.contactName,
    CtnContactTitle: s.contactTitle,
    CtnTelNo: s.telNo,
    CtnFaxOrMail: s.faxOrMail,
    CtnOverseasInfo: s.overseasInfo ?? "",
    CtnActive: s.active,
  };
}

function readInstitution(i: SpListItem): Institution {
  return {
    id: toId(i.Id),
    code: toStr(i.CtnCode),
    name: toStr(i.CtnName),
    address1: toStr(i.CtnAddress1),
    address2: toStr(i.CtnAddress2),
    telNo: toStr(i.CtnTelNo),
    // 実施診療科の候補は改行区切りの複数行テキスト。届の実施診療科の選択肢になる
    departments: toStr(i.CtnDepartments).split("\n").map((d) => d.trim()).filter(Boolean),
    active: toBool(i.CtnActive),
  };
}
function writeInstitution(x: Omit<Institution, "id">): Record<string, unknown> {
  return {
    Title: x.name.slice(0, 255),
    CtnCode: x.code,
    CtnName: x.name,
    CtnAddress1: x.address1,
    CtnAddress2: x.address2,
    CtnTelNo: x.telNo,
    CtnDepartments: (x.departments ?? []).join("\n"),
    CtnActive: x.active,
  };
}

function readDoctor(i: SpListItem): Doctor {
  return {
    id: toId(i.Id),
    doctorNo: toStr(i.CtnDoctorNo),
    nameOriginal: toStr(i.CtnNameOriginal),
    nameFiling: toStr(i.CtnNameFiling),
    pronounce: toStr(i.CtnPronounce),
    medSchoolNo: toStr(i.CtnMedSchoolNo),
    graduationYear: toStr(i.CtnGraduationYear),
    hasGaiji: toBool(i.CtnHasGaiji),
    institutionId: toOptStr(lookupId(i.CtnInstitutionId)),
    active: toBool(i.CtnActive),
  };
}
function writeDoctor(d: Omit<Doctor, "id">): Record<string, unknown> {
  return {
    Title: d.nameFiling.slice(0, 255),
    CtnDoctorNo: d.doctorNo,
    CtnNameOriginal: d.nameOriginal,
    CtnNameFiling: d.nameFiling,
    CtnPronounce: d.pronounce,
    CtnMedSchoolNo: d.medSchoolNo,
    CtnGraduationYear: d.graduationYear,
    CtnHasGaiji: d.hasGaiji,
    CtnInstitutionId: lookupWrite(d.institutionId),
    CtnActive: d.active,
  };
}

function readSiteStaff(i: SpListItem): SiteStaff {
  return {
    id: toId(i.Id),
    name: toStr(i.CtnName),
    kana: toStr(i.CtnKana),
    role: toStr(i.CtnStaffRole) as SiteStaff["role"],
    institutionId: lookupId(i.CtnInstitutionId),
    telNo: toStr(i.CtnTelNo),
    mail: toStr(i.CtnMail),
    active: toBool(i.CtnActive),
  };
}
function writeSiteStaff(s: Omit<SiteStaff, "id">): Record<string, unknown> {
  return {
    Title: s.name.slice(0, 255),
    CtnName: s.name,
    CtnKana: s.kana,
    CtnStaffRole: s.role,
    CtnInstitutionId: lookupWrite(s.institutionId),
    CtnTelNo: s.telNo,
    CtnMail: s.mail,
    CtnActive: s.active,
  };
}

function readIrb(i: SpListItem): Irb {
  return {
    id: toId(i.Id),
    irbType: toNum(i.CtnIrbType),
    ownerName: toStr(i.CtnOwnerName),
    address1: toStr(i.CtnAddress1),
    address2: toStr(i.CtnAddress2),
    active: toBool(i.CtnActive),
  };
}
function writeIrb(x: Omit<Irb, "id">): Record<string, unknown> {
  return {
    Title: x.ownerName.slice(0, 255),
    CtnIrbType: x.irbType,
    CtnOwnerName: x.ownerName,
    CtnAddress1: x.address1,
    CtnAddress2: x.address2,
    CtnActive: x.active,
  };
}

function readGaiji(i: SpListItem): GaijiRecord {
  return {
    id: toId(i.Id),
    doctorId: lookupId(i.CtnDoctorId),
    notificationId: toOptStr(lookupId(i.CtnNotificationId)),
    targetColumn: toStr(i.CtnTargetColumn),
    originalChar: toStr(i.CtnOriginalChar),
    codePoint: toStr(i.CtnCodePoint),
    replacementChar: toStr(i.CtnReplacementChar),
    gaijiType: toNum(i.CtnGaijiType),
    confirmedBy: toStr(i.CtnConfirmedBy),
    confirmedOn: toStr(i.CtnConfirmedOn),
  };
}

function readAudit(i: SpListItem): AuditEntry {
  return {
    id: toId(i.Id),
    at: toStr(i.CtnAt),
    who: toStr(i.CtnWho),
    action: toStr(i.CtnAction) as AuditEntry["action"],
    entity: toStr(i.CtnEntity),
    entityRef: toStr(i.CtnEntityRef),
    summary: toStr(i.CtnSummary),
  };
}
