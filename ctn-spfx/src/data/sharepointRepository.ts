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
  canApprove,
  canSubmit,
  computeFilingNumbers,
  devStatusAfterSubmit,
  finalizeSerials,
  normalizeGaiji,
  pickInheritanceSource,
} from "../shared/ctn/logic";
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
    private readonly displayNameOf: (actorId: string) => string
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
    let e = this.etags.get(key);
    if (!e) {
      const items = await this.sp.getItems(list, `$filter=Id eq ${Number(id)}`);
      if (items[0]) {
        this.rememberEtag(list, items[0]);
        e = this.etags.get(key);
      }
    }
    if (!e) {
      throw new Error(
        `${list} の項目 ${id} を取得できませんでした（etag 不明）。削除された可能性があります。画面を再読み込みしてください。`
      );
    }
    return e;
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
      this.sp.getItems(LIST.institutions, sel(["Id", "CtnCode", "CtnName", "CtnAddress1", "CtnAddress2", "CtnTelNo", "CtnActive"])),
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
      notifications: notifications.map(readNotification),
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
  private async pushAudit(a: Omit<AuditEntry, "id" | "at">): Promise<void> {
    await this.sp.addItem(LIST.audit, {
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
    const created = await this.sp.addItem(list, fields);
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
    await this.sp.updateItem(list, Number(rec.id), fields, await this.etagFor(list, rec.id));
    const items = await this.sp.getItems(list, `$filter=Id eq ${Number(rec.id)}`);
    const item = items[0];
    if (!item) throw new Error(`Not found: ${rec.id}`);
    this.rememberEtag(list, item);
    return read(item);
  }

  private async setActive(list: string, id: string, active: boolean): Promise<void> {
    await this.sp.updateItem(list, Number(id), { CtnActive: active }, await this.etagFor(list, id));
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
    const series = await this.fetchSeries(input.compoundId);
    const compounds = await this.sp.getItems(
      LIST.compounds,
      `$filter=Id eq ${Number(input.compoundId)}`
    );
    const compoundItem = compounds[0];
    if (!compoundItem) throw new Error(`Not found: ${input.compoundId}`);
    const compound = readCompound(compoundItem);

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

    const created = await this.sp.addItem(
      LIST.notifications,
      writeNotification(base, compound.compoundCode)
    );
    this.rememberEtag(LIST.notifications, created);

    // 集約 JSON 内の id を SharePoint の Id に合わせて確定させる
    base.id = String(created.Id);
    const saved = await this.writeNotificationItem(base, compound.compoundCode);

    await this.pushAudit({
      who: this.actorName(input.createdBy),
      action: "create",
      entity: "治験届",
      entityRef: `${compound.compoundCode} ${NOTIF_TYPE_SHORT[input.notifType]}届 #${filingCount}`,
      summary: `${NOTIF_TYPE_SHORT[input.notifType]}届を起票（届出回数 ${filingCount}${changeCount ? `・変更回数 ${changeCount}` : ""}）`,
    });
    return saved;
  }

  /** 集約 JSON と昇格列を「同一書き込み」で更新する（別々に更新しない） */
  private async writeNotificationItem(n: Notification, compoundCode: string): Promise<Notification> {
    await this.sp.updateItem(
      LIST.notifications,
      Number(n.id),
      writeNotification(n, compoundCode),
      await this.etagFor(LIST.notifications, n.id)
    );
    return this.fetchNotification(n.id);
  }

  private async compoundCodeOf(compoundId: string): Promise<string> {
    const items = await this.sp.getItems(LIST.compounds, `$filter=Id eq ${Number(compoundId)}`);
    return items[0] ? toStr(items[0].CtnCompoundCode) : "";
  }

  public async updateNotification(n: Notification, actor: string): Promise<Notification> {
    const series = await this.fetchSeries(n.compoundId);
    const saved = structuredClone(n);
    finalizeSerials(saved, series.filter((x) => x.id !== saved.id));
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
    const n = await this.fetchNotification(id);
    if (n.status !== "draft") throw new Error("提出済・承認済の届は削除できません（起票中のみ削除可）。");
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
    const n = await this.fetchNotification(id);
    n.status = "review";
    const code = await this.compoundCodeOf(n.compoundId);
    await this.writeNotificationItem(n, code);
    await this.pushAudit({ who: this.actorName(actor), action: "update", entity: "治験届", entityRef: this.ref(n, code), summary: "社内レビューへ送付" });
  }

  public async approveNotification(id: string, approverUserId: string): Promise<void> {
    const n = await this.fetchNotification(id);
    const check = canApprove(n, approverUserId); // 職務分離：起票者≠承認者
    if (!check.ok) throw new Error(check.reason);
    n.status = "approved";
    n.approvedBy = approverUserId;
    n.approvedAt = TODAY;
    const code = await this.compoundCodeOf(n.compoundId);
    await this.writeNotificationItem(n, code);
    await this.pushAudit({ who: this.actorName(approverUserId), action: "approve", entity: "治験届", entityRef: this.ref(n, code), summary: "承認（職務分離チェック通過）" });
  }

  /**
   * 提出。順序番号の確定は「最新を再取得 → 再計算 → etag 付き書き込み →
   * 412 ならリトライ」で衝突を防ぐ（過去に採番衝突バグの前歴あり・ブリーフ 5章）。
   */
  public async submitNotification(id: string, actor: string): Promise<void> {
    let lastConflict: unknown;
    for (let attempt = 0; attempt < SUBMIT_RETRIES; attempt++) {
      const n = await this.fetchNotification(id); // 最新を再取得
      const gate = canSubmit(n); // 提出ゲート：承認済のみ
      if (!gate.ok) throw new Error(gate.reason);

      const series = await this.fetchSeries(n.compoundId);
      finalizeSerials(n, series.filter((x) => x.id !== n.id)); // 再計算
      n.status = "submitted";
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
        const items = await this.sp.getItems(LIST.compounds, `$filter=Id eq ${Number(n.compoundId)}`);
        const item = items[0];
        if (item) {
          this.rememberEtag(LIST.compounds, item);
          await this.sp.updateItem(
            LIST.compounds,
            Number(n.compoundId),
            { CtnDevStatus: nextDevStatus },
            await this.etagFor(LIST.compounds, n.compoundId)
          );
        }
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
    await this.sp.addItem(LIST.gaiji, {
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
    const items = await this.sp.getItems(LIST.doctors, `$filter=Id eq ${Number(rec.doctorId)}`);
    const doc = items[0];
    if (doc) {
      this.rememberEtag(LIST.doctors, doc);
      await this.sp.updateItem(
        LIST.doctors,
        Number(rec.doctorId),
        { CtnHasGaiji: true },
        await this.etagFor(LIST.doctors, rec.doctorId)
      );
    }
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
  return { ...parsed, id: String(i.Id), compoundId: lookupId(i.CtnCompoundId) || parsed.compoundId };
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
    CtnApprovedByUser: n.approvedBy ?? "",
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
