import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "../../i18n";
import { columnOf, requiredFor, shouldShow, isRequired } from "../schema";
import { ofHint, oflWith } from "../officialLabels";
import { generateSubmissionPackage, downloadBlob, type SubmissionPackage } from "../output";
import type { XmlContext } from "../xml";
import {
  is30DayReview,
  computeDeadline,
  changeTiming,
  TIMING_LABEL,
  recommendKubun,
  canCompleteReview,
  canSubmit,
} from "../logic";
import {
  CHANGE_TYPE,
  DOCTOR_ROLE,
  DRUG_ROLE,
  KUBUN,
  SET,
  ATTACH_STATUS,
  COMB,
  SUBJ30_OPTIONS,
  APPLICABILITY_OPTIONS,
  daysUntil,
  fmtDate,
  label,
  options,
  notifTypeName,
  NOTIF_TYPE_SHORT,
  userById,
  type DemoUser,
  statusName,
  STATUS_ORDER,
  CODE_KIND_LABEL,
} from "../refData";
import { Section, Field, StatusPill, TypeBadge, Btn, Icon, UnconfirmedBadge, Modal } from "./common";
import { requirePermission } from "../permissions";
import type { CtnDb } from "../data/repository";
import type { CodeItem, CodeKind, Investigator, Notification, ReferenceNote, Site, SiteDrugQty, StudyDrug } from "../types";

type Cb = (n: Notification) => Promise<Notification | void> | Notification | void;

export function NotificationDetail({
  notification,
  db,
  user,
  onBack,
  onSave,
  onSendReview,
  onReject,
  onSubmit,
  onDelete,
  onGenerateXml,
}: {
  notification: Notification;
  db: CtnDb;
  user: DemoUser;
  onBack: () => void;
  onSave: Cb;
  onSendReview: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onSubmit: (id: string) => void;
  onDelete: (id: string) => void;
  onGenerateXml: (n: Notification) => void;
}) {
  const { t, lang } = useLang();
  const [draft, setDraft] = useState<Notification>(() => structuredClone(notification));
  const [dirty, setDirty] = useState(false);
  /** 詳細画面のルート。追加した施設カードを探すのに使う（画面外を巻き込まない） */
  const detailRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<string>("basic");
  const compound = db.compounds.find((c) => c.id === draft.compoundId)!;

  // ---- ロール別の可否（permissions.ts が単一ソース）----
  // ボタンは隠さず、権限が無いときは理由をツールチップに出して無効化する。
  // 「誰が何をできるか」を画面から読み取れるようにするため。
  const mayEdit = requirePermission(user.role, "editNotification");
  const maySendReview = requirePermission(user.role, "sendForReview");
  const mayReject = requirePermission(user.role, "rejectNotification");
  const maySubmit = requirePermission(user.role, "submitNotification");
  const mayDelete = requirePermission(user.role, "deleteNotification");

  const editable = (draft.status === "draft" || draft.status === "review") && mayEdit.ok;

  // ---- 提出パッケージ出力（PDF＋XML） ----
  // 届書PDF は formTree/pdfForm が pdf-lib で直接描画する（DOM のラスタライズは廃止）
  const [exporting, setExporting] = useState(false);
  const [pkg, setPkg] = useState<SubmissionPackage | null>(null);
  const [exportErr, setExportErr] = useState<string | null>(null);
  const baseName = `${compound.compoundCode}_第${draft.filingCount}回${draft.changeCount != null ? `_変更${draft.changeCount}` : ""}`;
  const runExport = async () => {
    setExporting(true);
    setExportErr(null);
    try {
      const ctx: XmlContext = {
        compound,
        sponsor: db.sponsors.find((s) => s.id === draft.sponsorId)!,
        institutions: new Map(db.institutions.map((i) => [i.id, i])),
        irbs: new Map(db.irbs.map((i) => [i.id, i])),
      };
      const result = await generateSubmissionPackage(draft, ctx);
      setPkg(result);
    } catch (e) {
      setExportErr(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  const upd = (fn: (n: Notification) => void) =>
    setDraft((d) => {
      const c = structuredClone(d);
      fn(c);
      return c;
    });
  const set = (fn: (n: Notification) => void) => {
    upd(fn);
    setDirty(true);
  };

  // 入力欄のラベルは公式様式の項目名に合わせ、ヒントで届書の出力先を示す
  // （クライアント指摘 R-02/R-07：どの届出項目を指しているのか分からない）
  const ofl = oflWith(t);

  // schema 駆動の必須・表示
  const mk = (col: string) => requiredFor(columnOf("cr_notification", col), draft.notifType);
  const show = (col: string) => shouldShow(mk(col));
  const req = (col: string) => isRequired(mk(col));

  const is30 = is30DayReview(draft);
  const deadline = computeDeadline(draft);
  const du = daysUntil(deadline);
  const kubunSug = useMemo(() => recommendKubun(draft), [draft]);

  // 届出区分は変更箇所から機械的に決まる。以前は「推奨を適用」ボタンを押させて
  // いたが、いつ押すのか分からないという指摘（R-03）を受けて自動で入れる。
  // 手で変えたい場合はそのまま上書きでき、推奨と違えば画面にそう出る。
  const sugValue = kubunSug?.value;
  useEffect(() => {
    if (!editable || sugValue == null) return;
    if (draft.kubun == null) set((n) => (n.kubun = sugValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sugValue, editable, draft.kubun]);

  const activeDoctors = db.doctors.filter((d) => d.active);
  const activeInstitutions = db.institutions.filter((i) => i.active);
  const activeIrbs = db.irbs.filter((i) => i.active);
  const activeStaff = db.siteStaff.filter((s) => s.active);

  // 職務分離：起票者は自分の届をレビュー完了（＝提出）できない
  const jobSepBlocked = draft.createdBy === user.id;

  // ---- 差し戻し（review → draft）----
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // サーバーのワークフロー遷移（レビュー送付・承認・提出・XML生成）で親から新しい
  // notification が来たら draft を同期する。未保存編集の黙殺を避けるため、mount key は
  // App 側で id のみに固定し、遷移の検知はここで status / xmlGeneratedAt を見て行う。
  useEffect(() => {
    setDraft(structuredClone(notification));
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification.status, notification.xmlGeneratedAt]);

  const save = async () => {
    // 保存後にサーバーが確定した順序番号などを draft へ反映（XMLプレビューの SERIALNO 整合）
    const saved = await onSave(draft);
    if (saved) setDraft(structuredClone(saved));
    setDirty(false);
  };

  // ---------- 治験使用薬 ----------
  const addStudyDrug = () =>
    set((n) => {
      const hasMain = n.studyDrugs.some((d) => d.drugRole === DRUG_ROLE.main);
      const nd: StudyDrug = {
        id: `sd-${Math.random().toString(36).slice(2, 8)}`,
        drugRole: hasMain ? DRUG_ROLE.other : DRUG_ROLE.main,
        serialNo: 0,
        drugName: "",
        plantName: "",
        plantAddress1: "",
        plantAddress2: "",
        plantCode: "",
        ingredients: "",
        intendEffects: "",
        efficacyClassCode: "",
        intendDosage: "",
        combCategory: hasMain ? COMB.control : undefined,
      };
      n.studyDrugs.push(nd);
    });
  const rmStudyDrug = (id: string) =>
    set((n) => {
      const removed = n.studyDrugs.find((d) => d.id === id);
      n.studyDrugs = n.studyDrugs.filter((d) => d.id !== id);
      for (const s of n.sites) s.quantities = s.quantities.filter((q) => q.studyDrugId !== id);
      // 「1届1行の主たる被験薬」を維持：主たる被験薬を削除したら残りの先頭を主へ昇格
      if (removed?.drugRole === DRUG_ROLE.main && n.studyDrugs.length > 0 && !n.studyDrugs.some((d) => d.drugRole === DRUG_ROLE.main)) {
        n.studyDrugs[0].drugRole = DRUG_ROLE.main;
        n.studyDrugs[0].combCategory = undefined;
      }
    });

  // ---------- 実施医療機関 ----------
  // 追加した施設カードまで自動で送る。フォームが縦に長く、追加しても画面が
  // 動かないと「押しても何も起きない」ように見えるため。
  // 追加は末尾に積まれるので、描画後に最後の .sitecard を見る。
  const [siteAdds, setSiteAdds] = useState(0);
  useEffect(() => {
    if (siteAdds === 0) return;
    const cards = detailRef.current?.querySelectorAll(".sitecard");
    cards?.[cards.length - 1]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [siteAdds]);

  const addSite = () => {
    addSiteRow();
    setSiteAdds((v) => v + 1);
  };
  const addSiteRow = () =>
    set((n) => {
      // 追加直後はブランク（施設・IRB 未選択）。ユーザーが明示的に選ぶ。
      const nsite: Site = {
        id: `site-${Math.random().toString(36).slice(2, 8)}`,
        institutionId: "",
        serialNo: 0, // サーバー（finalizeSerials）が SERIALNO1 を確定

        department: "",
        plannedSubjects: 0,
        irbId: "",
        investigators: [],
        quantities: n.studyDrugs.map((d) => ({ studyDrugId: d.id, serialNo: d.serialNo, qtyPlanned: 0 })),
      };
      n.sites.push(nsite);
    });
  const rmSite = (id: string) => set((n) => (n.sites = n.sites.filter((s) => s.id !== id)));

  // ---------- 医師ロスター ----------
  const addInvestigator = (siteId: string, doctorId: string, role: number) =>
    set((n) => {
      const site = n.sites.find((s) => s.id === siteId);
      const doc = db.doctors.find((d) => d.id === doctorId);
      if (!site || !doc) return;
      const changeType = n.notifType === "change" ? CHANGE_TYPE.add : CHANGE_TYPE.register;
      const inv: Investigator = {
        id: `inv-${Math.random().toString(36).slice(2, 8)}`,
        doctorId,
        doctorRole: role,
        serialNo: 0,
        changeType,
        nameOriginal: doc.nameOriginal,
        nameFiling: doc.nameFiling,
        pronounce: doc.pronounce,
        medSchoolNo: doc.medSchoolNo,
        graduationYear: doc.graduationYear,
        ...(n.notifType === "change" ? { changeDate: "", changeReason: "分担医師の追加" } : {}),
      };
      site.investigators.push(inv);
    });
  const removeInvestigator = (siteId: string, invId: string) =>
    set((n) => {
      const site = n.sites.find((s) => s.id === siteId);
      if (!site) return;
      const inv = site.investigators.find((i) => i.id === invId);
      if (!inv) return;
      if (n.notifType === "change" && inv.changeType !== CHANGE_TYPE.add) {
        // 変更届：削除はイベント行（DELETE）として記録（物理削除しない）
        inv.changeType = CHANGE_TYPE.remove;
        inv.changeReason = "分担医師の削除";
      } else {
        // 計画届 or 追加したばかりの行は物理的に取り消し
        site.investigators = site.investigators.filter((i) => i.id !== invId);
      }
    });

  // ---------- 数量 ----------
  const setQty = (siteId: string, studyDrugId: string, field: keyof SiteDrugQty, value: number) =>
    set((n) => {
      const site = n.sites.find((s) => s.id === siteId);
      if (!site) return;
      let q = site.quantities.find((x) => x.studyDrugId === studyDrugId);
      if (!q) {
        q = { studyDrugId, serialNo: 0, qtyPlanned: 0 };
        site.quantities.push(q);
      }
      (q[field] as number) = value;
    });

  // 治験使用薬の任意フィールド更新
  const setDrug = (id: string, fn: (d: StudyDrug) => void) =>
    set((n) => {
      const d = n.studyDrugs.find((x) => x.id === id);
      if (d) fn(d);
    });

  // 参照治験届出
  const addReference = () =>
    set((n) =>
      n.references.push({ id: `ref-${Math.random().toString(36).slice(2, 8)}`, serialNo: n.references.length + 1, refCategory: "医薬品", refCode: "", refCount: "", refType: "", refContents: "" })
    );
  const setRef = (id: string, fn: (r: ReferenceNote) => void) =>
    set((n) => {
      const r = n.references.find((x) => x.id === id);
      if (r) fn(r);
    });
  const rmReference = (id: string) => set((n) => (n.references = n.references.filter((r) => r.id !== id)));

  const terminal = draft.notifType === "termination" || draft.notifType === "completion";
  const activeSponsors = db.sponsors.filter((s) => s.active);
  const sponsor = db.sponsors.find((s) => s.id === draft.sponsorId);

  // 詳細画面のセクションをかたまり（タブ）に分けて横並びのボタンで切替
  const isDevDisc = draft.notifType === "devDiscontinuation";
  const detailTabs: { key: string; label: [string, string]; show: boolean }[] = [
    { key: "basic", label: ["Basics", "基本情報"], show: true },
    { key: "plan", label: ["Plan summary", "治験計画概要"], show: !isDevDisc },
    { key: "drugs", label: ["Study drugs", "治験使用薬"], show: !isDevDisc },
    { key: "sites", label: ["Institutions", "実施医療機関"], show: !isDevDisc },
    { key: "refs", label: ["Attachments / refs", "届書添付資料・参照・照会"], show: !isDevDisc || draft.inquiries.length > 0 },
  ];
  const visibleTabs = detailTabs.filter((tb) => tb.show);
  const activeTab = visibleTabs.some((tb) => tb.key === tab) ? tab : visibleTabs[0].key;

  return (
    <div className="detail" ref={detailRef}>
      {/* ===== ヘッダー ===== */}
      <div className="detail-top">
        <button className="back" onClick={onBack}>← {t("Back", "一覧へ")}</button>
        <div className="detail-title">
          <div className="dt-code">{compound.compoundCode}</div>
          <TypeBadge type={draft.notifType} full />
          <span className="dt-count">第{draft.filingCount}回{draft.changeCount != null ? `・変更${draft.changeCount}回` : ""}</span>
          <StatusPill status={draft.status} />
        </div>
      </div>

      {/* ===== ワークフロー進捗 ===== */}
      <div className="wf">
        {/* 段数・順序・表示名はすべて refData の STATUS_ORDER / STATUS_LABEL が単一ソース */}
        {STATUS_ORDER.map((s, i) => {
          const cur = STATUS_ORDER.indexOf(draft.status);
          const state = i < cur ? "done" : i === cur ? "cur" : "todo";
          // 表示名は refData の STATUS_LABEL が単一ソース（ここで別に持つとズレる）
          return (
            <div key={s} className={`wf-step ${state}`}>
              <span className="wf-dot">{i < cur ? "✓" : i + 1}</span>
              <span className="wf-name">{statusName(s, lang)}</span>
            </div>
          );
        })}
      </div>

      {jobSepBlocked && draft.status === "review" && (
        <div className="banner banner-amber">⚠ {t("Job separation: you drafted this filing and cannot complete its review. Switch to another reviewer (top-right).", "職務分離：あなたはこの届の起票者のため、自分でレビュー完了（提出）はできません。右上でユーザーをレビュー担当に切り替えてください。")}</div>
      )}

      {/* 差し戻された届。レビュー送付でこの記録は消える */}
      {draft.status === "draft" && draft.rejectionReason && (
        <div className="banner banner-red">
          ⚠ <b>{t("Sent back", "差し戻し")}</b>
          {draft.rejectedBy && <>（{userById(draft.rejectedBy)?.name ?? draft.rejectedBy}{draft.rejectedAt ? `・${fmtDate(draft.rejectedAt)}` : ""}）</>}
          ： {draft.rejectionReason}
        </div>
      )}

      {/* 閲覧のみの利用者に、なぜ操作できないかを最初に伝える */}
      {!mayEdit.ok && <div className="banner banner-blue">{mayEdit.reason}</div>}

      {/* ===== 提出期限バナー ===== */}
      {(draft.notifType === "plan" || draft.notifType === "change") && deadline && (
        <div className={`banner deadline ${du != null && du < 0 ? "banner-red" : du != null && du <= 7 ? "banner-red" : du != null && du <= 14 ? "banner-amber" : "banner-blue"}`}>
          <b>{t("Submission deadline", "提出期限")}: {fmtDate(deadline)}</b>
          <span>{
            draft.notifType === "change"
              ? (() => { const tm = changeTiming(draft.changeLocations); return tm ? t(`Timing: ${TIMING_LABEL[tm][0]}`, `提出時期: ${TIMING_LABEL[tm][1]}（変更予定日基準）`) : t("select change locations", "変更箇所を選択してください"); })()
              : is30 ? t("first plan · 30-day review (start −30d)", "初回計画届・30日調査対象（開始予定日−30日）") : t("N-th plan (start −14d)", "N回届（開始予定日−14日）")
          }</span>
          {du != null && <span className="banner-days">{du < 0 ? t(`${-du}d overdue`, `${-du}日超過`) : t(`${du} days left`, `残り${du}日`)}</span>}
        </div>
      )}

      {/* ===== セクションタブ（横並びショートカット） ===== */}
      <div className="detail-tabs">
        {visibleTabs.map((tb) => (
          <button key={tb.key} type="button" className={`dtab${activeTab === tb.key ? " on" : ""}`} onClick={() => setTab(tb.key)}>
            {t(tb.label[0], tb.label[1])}
          </button>
        ))}
      </div>

      {/* ===== 基本情報タブ（基本情報 + 治験届出者 + 備考） ===== */}
      {activeTab === "basic" && (<>
      <Section title={t("Basic information", "基本情報")} sub={t("Common items — inherited from the series where possible", "共通事項（可能な限りシリーズから継承）")}>
        <div className="form-grid">
          <Field label={t("Notification type", "届出種別")} mark="always"><input className="tin" value={notifTypeName(draft.notifType, lang)} disabled /></Field>
          <Field label={t("Filing count (auto)", "届出回数（自動）")} mark="auto"><input className="tin" value={`#${draft.filingCount}`} disabled /></Field>
          {draft.notifType === "change" && <Field label={t("Change count (auto)", "変更回数（自動）")} mark="auto"><input className="tin" value={`${draft.changeCount ?? "—"}`} disabled /></Field>}
          {show("cr_receptno") && (
            <Field label={ofl("当該届出受付番号")} hint={ofHint("当該届出受付番号")} mark={mk("cr_receptno")}>
              <input className="tin" value={draft.receptNo ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.receptNo = e.target.value))} placeholder={draft.notifType === "plan" ? "（計画届は空欄）" : "例：R6薬第1234号"} />
            </Field>
          )}
          {show("cr_receptdate") && (
            <Field label={ofl("当該届出年月日")} hint={ofHint("当該届出年月日")} mark={mk("cr_receptdate")}>
              <input type="date" className="tin" value={draft.receptDate ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.receptDate = e.target.value))} />
            </Field>
          )}
          {show("cr_plannedstartdate") && (
            <Field label={ofl("治験開始予定日")} hint={ofHint("治験開始予定日")} mark={mk("cr_plannedstartdate")} unconfirmed>
              <input type="date" className="tin" value={draft.plannedStartDate ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.plannedStartDate = e.target.value))} />
            </Field>
          )}
          {show("cr_subj30dayreview") && (
            <Field label={ofl("30日調査対応被験薬区分")} hint={ofHint("30日調査対応被験薬区分")} mark={mk("cr_subj30dayreview")} unconfirmed>
              <select className="sel" value={draft.subj30dayReview ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.subj30dayReview = e.target.value ? Number(e.target.value) : undefined))}>
                <option value="">—</option>
                {SUBJ30_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          )}
          <Field label={ofl("届出区分")} hint={ofHint("届出区分")} mark="always">
            <div className="inline">
              <select className="sel" value={draft.kubun ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.kubun = e.target.value === "" ? undefined : Number(e.target.value)))}>
                <option value="">—</option>
                {options(SET.kubun).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {/* 推奨と違う値が入っているときだけ戻す手段を出す。以前は常時「推奨を適用」
                  ボタンがあり、いつ押すのか分からないという指摘を受けた（R-03） */}
              {editable && kubunSug && draft.kubun !== kubunSug.value && (
                <Btn small onClick={() => set((n) => (n.kubun = kubunSug.value))}>{t("Reset to recommended", "推奨に戻す")}</Btn>
              )}
            </div>
            {kubunSug && (
              <div className="field-hint">
                {draft.kubun === kubunSug.value
                  ? t(`Set automatically from the change locations: ${kubunSug.reasonEn}`, `変更箇所から自動で判定：${kubunSug.reasonJa}`)
                  : t(`Changed manually. Recommended is ${label(SET.kubun, kubunSug.value)}: ${kubunSug.reasonEn}`, `手動で変更されています。推奨は「${label(SET.kubun, kubunSug.value)}」：${kubunSug.reasonJa}`)}
              </div>
            )}
          </Field>
        </div>

        {draft.notifType === "change" && (
          <Field label={t("Change locations (drives kubun & submission timing)", "変更箇所（届出区分・提出時期の判定に使用）")} mark="always" wide>
            <div className="chips">
              {options(SET.changeLocations).map((o) => {
                const on = draft.changeLocations.includes(o.value);
                return (
                  <button key={o.value} type="button" className={`chip${on ? " on" : ""}`} disabled={!editable} onClick={() => set((n) => (n.changeLocations = on ? n.changeLocations.filter((x) => x !== o.value) : [...n.changeLocations, o.value]))}>
                    {o.label}
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        {draft.notifType === "change" && (
          <div className="form-grid">
            <Field label={t("Change date", "変更年月日")} mark="always" hint={t("Reference date for submission timing", "提出時期の起点（変更予定日）")}><input type="date" className="tin" value={draft.changeDate ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.changeDate = e.target.value))} /></Field>
            <Field label={t("Reason for change", "変更理由")} mark="always" wide><textarea className="ta" value={draft.changeReason ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.changeReason = e.target.value))} /></Field>
          </div>
        )}

        {(draft.notifType === "termination" || draft.notifType === "devDiscontinuation") && (
          <div className="form-grid">
            <Field label={ofl("中止年月日")} hint={ofHint("中止年月日")} mark="always"><input type="date" className="tin" value={draft.terminationDate ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.terminationDate = e.target.value))} /></Field>
            <Field label={ofl("中止理由")} hint={ofHint("中止理由")} mark="always" wide><input className="tin" value={draft.terminationReason ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.terminationReason = e.target.value))} /></Field>
            {draft.notifType === "termination" && <Field label={ofl("その後の対応状況")} hint={ofHint("その後の対応状況")} mark="always" wide><input className="tin" value={draft.postTermination ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.postTermination = e.target.value))} /></Field>}
          </div>
        )}
      </Section>

      {/* ===== 治験届出者 ===== */}
      <Section title={t("Sponsor / notifier", "治験届出者")} sub={t("Selected from the master; contact details shown for reference.", "マスタから選択。連絡先等は参照表示。")}>
        <div className="form-grid">
          <Field label={t("Sponsor", "治験届出者")} mark="always"><select className="sel" value={draft.sponsorId} disabled={!editable} onChange={(e) => set((n) => (n.sponsorId = e.target.value))}>{activeSponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          {sponsor && <Field label={t("Contact", "届出担当者")}><input className="tin" value={`${sponsor.contactName}（${sponsor.contactTitle}）`} disabled /></Field>}
          {sponsor && <Field label={t("Manufacturer code", "業者コード")}><input className="tin" value={sponsor.manufacturerCode} disabled /></Field>}
          {sponsor && <Field label={t("Tel / contact", "電話・連絡先")}><input className="tin" value={`${sponsor.telNo} / ${sponsor.faxOrMail}`} disabled /></Field>}
          <Field label={t("Form version", "様式等のバージョン情報")}><input className="tin" value={draft.formVersion ?? "医薬品治験届 令和２年８月改正版"} disabled={!editable} onChange={(e) => set((n) => (n.formVersion = e.target.value))} /></Field>
        </div>

        {/* ===== 海外依頼者・外国製造業者（INFOFOREIGNMANUFACTURER・該当時のみ・本デモは単数） ===== */}
        <div className="form-sub">{t("Foreign sponsor / manufacturer — only when applicable", "海外依頼者・外国製造業者（該当時のみ）")}</div>
        <div className="form-grid">
          <Field label={t("Name (JP)", "名称（邦文）")}><input className="tin" value={draft.foreignName ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignName = e.target.value))} /></Field>
          <Field label={t("Representative (JP)", "代表者氏名（邦文）")}><input className="tin" value={draft.foreignRepName ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignRepName = e.target.value))} /></Field>
          <Field label={t("Address 1 (JP)", "所在地1（邦文）")}><input className="tin" value={draft.foreignAddress1 ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignAddress1 = e.target.value))} /></Field>
          <Field label={t("Address 2 (JP)", "所在地2（邦文）")}><input className="tin" value={draft.foreignAddress2 ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignAddress2 = e.target.value))} /></Field>
          <Field label={t("Name (foreign)", "名称（外国文）")}><input className="tin" value={draft.foreignNameFrgn ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignNameFrgn = e.target.value))} /></Field>
          <Field label={t("Representative (foreign)", "代表者氏名（外国文）")}><input className="tin" value={draft.foreignRepNameFrgn ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignRepNameFrgn = e.target.value))} /></Field>
          <Field label={t("Address 1 (foreign)", "所在地1（外国文）")}><input className="tin" value={draft.foreignAddress1Frgn ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignAddress1Frgn = e.target.value))} /></Field>
          <Field label={t("Address 2 (foreign)", "所在地2（外国文）")}><input className="tin" value={draft.foreignAddress2Frgn ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignAddress2Frgn = e.target.value))} /></Field>
        </div>
      </Section>

      {/* 備考（基本情報タブ内。開発中止届では必須◎） */}
      {show("cr_remarks") && (
        <Section title={t("Remarks", "備考")}>
          <Field label={ofl("備考（通信欄）")} hint={ofHint("備考（通信欄）")} mark={mk("cr_remarks")} wide><textarea className="ta" value={draft.remarks ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.remarks = e.target.value))} placeholder={draft.notifType === "devDiscontinuation" ? "開発中止届では実質必須（中止の経緯・以降の対応等）" : ""} /></Field>
        </Section>
      )}
      </>)}

      {/* ===== 治験計画概要タブ ===== */}
      {activeTab === "plan" && (
        <Section title={t("Trial plan summary", "治験計画概要")}>
          <div className="form-grid">
            {show("cr_protocolno") && <Field label={ofl("実施計画書識別記号")} hint={ofHint("実施計画書識別記号")} mark={mk("cr_protocolno")}><input className="tin" value={draft.protocolNo} disabled={!editable} onChange={(e) => set((n) => (n.protocolNo = e.target.value))} /></Field>}
            {show("cr_phase") && <Field label={ofl("開発の相")} hint={ofHint("開発の相")} mark={mk("cr_phase")}><select className="sel" value={draft.phase ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.phase = Number(e.target.value)))}><option value="">—</option>{options(SET.phase).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {show("cr_trialtype") && <Field label={ofl("試験の種類")} hint={ofHint("試験の種類")} mark={mk("cr_trialtype")}><select className="sel" value={draft.trialType ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.trialType = Number(e.target.value)))}><option value="">—</option>{options(SET.trialType).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {show("cr_plannedsubjdrug") && <Field label={ofl("予定被験者数（被験薬）")} hint={ofHint("予定被験者数（被験薬）")} mark={mk("cr_plannedsubjdrug")}><input type="number" className="tin" value={draft.plannedSubjDrug ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.plannedSubjDrug = Number(e.target.value)))} /></Field>}
            {show("cr_plannedsubjtotal") && <Field label={ofl("予定被験者数（合計）")} hint={ofHint("予定被験者数（合計）")} mark={mk("cr_plannedsubjtotal")}><input type="number" className="tin" value={draft.plannedSubjTotal ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.plannedSubjTotal = Number(e.target.value)))} /></Field>}
            {show("cr_periodstart") && <Field label={ofl("実施期間（開始）")} hint={ofHint("実施期間（開始）")} mark={mk("cr_periodstart")}><input className="tin" value={draft.periodStart ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.periodStart = e.target.value))} placeholder="YYYY-MM-DD" /></Field>}
            {show("cr_periodend") && <Field label={ofl("実施期間（終了）")} hint={ofHint("実施期間（終了）")} mark={mk("cr_periodend")}><input className="tin" value={draft.periodEnd ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.periodEnd = e.target.value))} placeholder="YYYY-MM-DD" /></Field>}
            {show("cr_isglobal") && <Field label={ofl("国際共同治験")} hint={ofHint("国際共同治験")} mark={mk("cr_isglobal")}><select className="sel" value={draft.isGlobal ? "1" : "0"} disabled={!editable} onChange={(e) => set((n) => (n.isGlobal = e.target.value === "1"))}>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={String(o.value)}>{o.label}</option>)}</select></Field>}
          </div>
          {show("cr_objectives") && <Field label={ofl("目的")} hint={ofHint("目的")} mark={mk("cr_objectives")} wide><textarea className="ta" value={draft.objectives} disabled={!editable} onChange={(e) => set((n) => (n.objectives = e.target.value))} /></Field>}
          {show("cr_targetdisease") && <Field label={ofl("主たる被験薬の対象疾患")} hint={ofHint("主たる被験薬の対象疾患")} mark={mk("cr_targetdisease")} wide><input className="tin" value={draft.targetDisease} disabled={!editable} onChange={(e) => set((n) => (n.targetDisease = e.target.value))} /></Field>}
          {draft.isGlobal && show("cr_globalcontents") && <Field label={ofl("国際共同治験の内容")} hint={ofHint("国際共同治験の内容")} mark={mk("cr_globalcontents")} wide><textarea className="ta" value={draft.globalContents ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.globalContents = e.target.value))} placeholder={t("Participating countries, total planned subjects, domestic share, etc.", "参加国・全体予定被験者数・本邦割合 等")} /></Field>}
          {show("cr_reasononerous") && <Field label={ofl("有償の理由等")} hint={ofHint("有償の理由等")} mark={mk("cr_reasononerous")} unconfirmed wide><textarea className="ta" value={draft.reasonOnerous ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.reasonOnerous = e.target.value))} placeholder={t("Only for onerous (paid) trials", "有償治験の場合のみ")} /></Field>}

          {/* ===== 手引き4.3 条件付き項目（該当時のみ） ===== */}
          <div className="form-sub">{t("Conditional items (Guide §4.3 — only when applicable)", "条件付き項目（手引き4.3・該当時のみ）")}</div>
          <div className="form-grid">
            {show("cr_biological") && <Field label={ofl("生物由来製品 該当有無")} hint={ofHint("生物由来製品 該当有無")} mark={mk("cr_biological")} unconfirmed><select className="sel" value={draft.applicBiological ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicBiological = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {show("cr_cartagena") && <Field label={ofl("カルタヘナ法 該当有無")} hint={ofHint("カルタヘナ法 該当有無")} mark={mk("cr_cartagena")} unconfirmed><select className="sel" value={draft.applicCartagena ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicCartagena = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {show("cr_expandedaccess") && <Field label={ofl("臨床試験の位置付け（拡大治験）")} hint={ofHint("臨床試験の位置付け（拡大治験）")} mark={mk("cr_expandedaccess")} unconfirmed><select className="sel" value={draft.applicExpandedAccess ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicExpandedAccess = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
          </div>
          {draft.applicBiological === 1 && <Field label={t("Biological — detail", "生物由来製品 詳細")} mark={mk("cr_biologicaldetail")} wide><textarea className="ta" value={draft.applicBiologicalDetail ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicBiologicalDetail = e.target.value))} /></Field>}
          {draft.applicCartagena === 1 && <Field label={ofl("カルタヘナ法 詳細")} hint={ofHint("カルタヘナ法 詳細")} mark={mk("cr_cartagenadetail")} wide><textarea className="ta" value={draft.applicCartagenaDetail ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicCartagenaDetail = e.target.value))} /></Field>}
          {draft.applicExpandedAccess === 1 && <Field label={t("Trial positioning — detail", "臨床試験の位置付け 詳細")} mark={mk("cr_expandedaccessdetail")} wide><textarea className="ta" value={draft.applicExpandedAccessDetail ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicExpandedAccessDetail = e.target.value))} /></Field>}

          {/* ===== その他の情報（該当性トグル・XSD v3.0.0「その他の情報」「当該届出に関するその他の情報」） ===== */}
          <div className="form-sub">{t("Other information — applicability (XSD v3.0.0)", "その他の情報（該当性・XSD v3.0.0）")}</div>
          <div className="form-grid">
            {show("cr_applicodx") && <Field label={ofl("コンパニオン診断薬等の開発")} hint={ofHint("コンパニオン診断薬等の開発")} mark={mk("cr_applicodx")}><select className="sel" value={draft.applicCodx ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicCodx = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {show("cr_combinationprod") && <Field label={t("Combination product", "コンビネーション製品に関する治験")} mark={mk("cr_combinationprod")}><select className="sel" value={draft.applicCombinationProd ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicCombinationProd = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {show("cr_genetest") && <Field label={ofl("ゲノム検査等を含む治験")} hint={ofHint("ゲノム検査等を含む治験")} mark={mk("cr_genetest")}><select className="sel" value={draft.applicGeneTest ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicGeneTest = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {show("cr_microdose") && <Field label={t("Microdose study", "マイクロドーズ臨床試験")} mark={mk("cr_microdose")}><select className="sel" value={draft.applicMicrodose ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicMicrodose = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {show("cr_combequipment") && <Field label={ofl("併用する機械器具等の記載")} hint={ofHint("併用する機械器具等の記載")} mark={mk("cr_combequipment")}><select className="sel" value={draft.applicCombEquipment ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicCombEquipment = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
          </div>
          {draft.applicCombEquipment === 1 && show("cr_combequipmentcontents") && <Field label={ofl("併用する機械器具等 内容")} hint={ofHint("併用する機械器具等 内容")} mark={mk("cr_combequipmentcontents")} wide><textarea className="ta" value={draft.combEquipmentContents ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.combEquipmentContents = e.target.value))} /></Field>}
          <div className="form-grid">
            {show("cr_chargeoutperson") && <Field label={ofl("費用負担者氏名")} hint={ofHint("費用負担者氏名")} mark={mk("cr_chargeoutperson")}><input className="tin" value={draft.chargeOutPersonName ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.chargeOutPersonName = e.target.value))} placeholder={t("Only when applicable", "該当する場合のみ")} /></Field>}
          </div>
          {show("cr_validityreasons") && <Field label={ofl("費用負担の妥当性の理由")} hint={ofHint("費用負担の妥当性の理由")} mark={mk("cr_validityreasons")} wide><textarea className="ta" value={draft.validityReasons ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.validityReasons = e.target.value))} /></Field>}
          {show("cr_othercommentsprimary") && <Field label={ofl("その他コメント（主たる被験薬）")} hint={ofHint("その他コメント（主たる被験薬）")} mark={mk("cr_othercommentsprimary")} wide><textarea className="ta" value={draft.otherCommentsPrimary ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.otherCommentsPrimary = e.target.value))} /></Field>}
          {show("cr_othercommentsprotocol") && <Field label={ofl("その他コメント（治験計画書）")} hint={ofHint("その他コメント（治験計画書）")} mark={mk("cr_othercommentsprotocol")} wide><textarea className="ta" value={draft.otherCommentsProtocol ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.otherCommentsProtocol = e.target.value))} /></Field>}

          {/* ===== CRO（開発業務受託機関）・要確認：繰り返しは単数入力で代表 ===== */}
          <div className="form-sub">{t("CRO (contract research org.) — single entry in this demo", "開発業務受託機関（CRO）・本デモは単数入力")}</div>
          <div className="form-grid">
            {show("cr_croname") && <Field label={ofl("CRO 名称")} hint={ofHint("CRO 名称")} mark={mk("cr_croname")} unconfirmed><input className="tin" value={draft.croName ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.croName = e.target.value))} /></Field>}
            {show("cr_croaddress1") && <Field label={ofl("CRO 所在地1")} hint={ofHint("CRO 所在地1")} mark={mk("cr_croaddress1")} unconfirmed><input className="tin" value={draft.croAddress1 ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.croAddress1 = e.target.value))} /></Field>}
            {show("cr_croaddress2") && <Field label={ofl("CRO 所在地2")} hint={ofHint("CRO 所在地2")} mark={mk("cr_croaddress2")} unconfirmed><input className="tin" value={draft.croAddress2 ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.croAddress2 = e.target.value))} /></Field>}
          </div>
          {show("cr_croservice") && <Field label={ofl("CRO 受託業務の範囲")} hint={ofHint("CRO 受託業務の範囲")} mark={mk("cr_croservice")} unconfirmed wide><textarea className="ta" value={draft.croService ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.croService = e.target.value))} /></Field>}

          {/* ===== 治験調整医師・調整委員会・要確認：繰り返しは単数入力で代表 ===== */}
          <div className="form-sub">{t("Coordinating investigator / committee — single entry in this demo", "治験調整医師・調整委員会・本デモは単数入力")}</div>
          <div className="form-grid">
            {show("cr_coordname") && <Field label={ofl("治験調整医師 氏名")} hint={ofHint("治験調整医師 氏名")} mark={mk("cr_coordname")} unconfirmed><input className="tin" value={draft.coordName ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.coordName = e.target.value))} /></Field>}
            {show("cr_coordaffiliation") && <Field label={ofl("所属")} hint={ofHint("所属")} mark={mk("cr_coordaffiliation")} unconfirmed><input className="tin" value={draft.coordAffiliation ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.coordAffiliation = e.target.value))} /></Field>}
            {show("cr_coordinstitution") && <Field label={ofl("医療機関名")} hint={ofHint("医療機関名")} mark={mk("cr_coordinstitution")} unconfirmed><input className="tin" value={draft.coordInstitution ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.coordInstitution = e.target.value))} /></Field>}
          </div>

          <div className="form-grid">
            <Field label={ofl("GW受付番号")} mark={mk("cr_gwreceptno")} hint={ofHint("GW受付番号")}><input className="tin" value={draft.gwReceptNo ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.gwReceptNo = e.target.value))} /></Field>
          </div>
          {show("cr_footnote") && <Field label={ofl("脚注")} hint={ofHint("脚注")} mark={mk("cr_footnote")} unconfirmed wide><textarea className="ta" value={draft.footnote ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.footnote = e.target.value))} /></Field>}
        </Section>
      )}

      {/* ===== 治験使用薬タブ ===== */}
      {activeTab === "drugs" && (
        <Section title={t("Study drugs", "治験使用薬")} sub={t("Serial no. is assigned automatically on save (matching-key type: constant across the series, plan → completion). Expand a row for all fields.", "順序番号は保存時に自動採番されます（突合キー型：シリーズ内で不変・欠番可・再付番なし）。行を展開すると全項目を入力できます。")} right={editable ? <Btn kind="p" small onClick={addStudyDrug}>{Icon.plus} {t("Add drug", "薬を追加")}</Btn> : undefined}>
          {draft.studyDrugs.length === 0 && <div className="rt-empty">{t("No study drugs. Add the main investigational drug first.", "治験使用薬がありません。まず主たる被験薬を追加してください。")}</div>}
          {draft.studyDrugs.map((d) => (
            <StudyDrugCard key={d.id} drug={d} editable={editable} onField={(fn) => setDrug(d.id, fn)} onRemove={() => rmStudyDrug(d.id)} codes={db.codes} />
          ))}
        </Section>
      )}

      {/* ===== 実施医療機関タブ（医師ロスター・数量） ===== */}
      {activeTab === "sites" && (
        <Section title={t("Medical institutions", "実施医療機関")} sub={t("Doctors are edited as a roster; the server generates event rows with movement type.", "医師はロスター操作で編集。保存時に異動区分つきのイベント行が生成されます。")} right={editable ? <Btn kind="p" small onClick={addSite}>{Icon.plus} {t("Add site", "施設を追加")}</Btn> : undefined}>
          {draft.sites.length === 0 && <div className="rt-empty">{t("No sites yet.", "実施医療機関がありません。")}</div>}
          {draft.sites.map((s) => (
            <SiteCard key={s.id} site={s} draft={draft} db={db} editable={editable} terminal={terminal}
              onField={(fn) => set((n) => { const site = n.sites.find((x) => x.id === s.id)!; fn(site); })}
              onAddInv={(docId, role) => addInvestigator(s.id, docId, role)}
              onRemoveInv={(invId) => removeInvestigator(s.id, invId)}
              onQty={(drugId, field, val) => setQty(s.id, drugId, field, val)}
              onRemoveSite={() => rmSite(s.id)}
              activeDoctors={activeDoctors} activeInstitutions={activeInstitutions} activeIrbs={activeIrbs} activeStaff={activeStaff}
            />
          ))}
        </Section>
      )}

      {/* ===== 参照・添付・照会タブ ===== */}
      {activeTab === "refs" && (<>

      {draft.notifType !== "devDiscontinuation" && (
        <Section title={t("Referenced notifications", "参照治験届出")} sub={t("Other CTN filings referenced by this one.", "この届が参照する治験届出情報。")} right={editable ? <Btn small onClick={addReference}>{Icon.plus} {t("Add", "追加")}</Btn> : undefined}>
          {draft.references.length === 0 ? <div className="rt-empty">{t("No references.", "参照はありません。")}</div> : (
            <div className="row-table">
              <div className="rt-head rt-ref"><span>{t("Category", "医薬品等の別")}</span><span>{t("Code", "成分記号/識別記号")}</span><span>{t("Count", "届出回数")}</span><span>{t("Type", "参照の区分")}</span><span>{t("Detail", "参照の詳細")}</span><span /></div>
              {draft.references.map((r) => (
                <div key={r.id} className="rt-row rt-ref">
                  <span><select className="sel sel-sm" value={r.refCategory} disabled={!editable} onChange={(e) => setRef(r.id, (x) => (x.refCategory = e.target.value))}>{options(SET.targetCategory).map((o) => <option key={o.value} value={o.label}>{o.label}</option>)}</select></span>
                  <span><input className="tin tin-sm" value={r.refCode} disabled={!editable} onChange={(e) => setRef(r.id, (x) => (x.refCode = e.target.value))} /></span>
                  <span><input className="tin tin-sm" value={r.refCount} disabled={!editable} onChange={(e) => setRef(r.id, (x) => (x.refCount = e.target.value))} /></span>
                  <span><input className="tin tin-sm" value={r.refType} disabled={!editable} onChange={(e) => setRef(r.id, (x) => (x.refType = e.target.value))} /></span>
                  <span><input className="tin tin-sm" value={r.refContents} disabled={!editable} onChange={(e) => setRef(r.id, (x) => (x.refContents = e.target.value))} /></span>
                  <span>{editable && <button className="icon-btn danger" onClick={() => rmReference(r.id)}>{Icon.trash}</button>}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ===== 添付資料 ===== */}
      {draft.notifType !== "devDiscontinuation" && (
        <Section title={t("Attachments", "添付資料")} sub={t("Actual files live in SharePoint (demo uses pseudo paths).", "実体はSharePoint（デモは擬似パス）。")}
          right={editable ? <Btn small onClick={() => set((n) => n.attachments.push({ id: `att-${Math.random().toString(36).slice(2, 7)}`, docType: options(SET.docType)[0].value, docName: "", spReference: "", hasBookmarks: false, hasText: false, attachStatus: ATTACH_STATUS.checking }))}>{Icon.plus} {t("Add", "追加")}</Btn> : undefined}>
          {draft.attachments.length === 0 ? <div className="rt-empty">{t("No attachments.", "添付資料はありません。")}</div> : (
            <div className="row-table">
              <div className="rt-head rt-att"><span>{t("Type", "資料種別")}</span><span>{t("Name", "資料名")}</span><span>{t("Status", "状態")}</span><span /></div>
              {draft.attachments.map((a) => (
                <div key={a.id} className="rt-row rt-att">
                  <span><select className="sel sel-sm" value={a.docType} disabled={!editable} onChange={(e) => set((n) => { const x = n.attachments.find((y) => y.id === a.id)!; x.docType = Number(e.target.value); })}>{options(SET.docType).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></span>
                  <span><input className="tin tin-sm" value={a.docName} disabled={!editable} onChange={(e) => set((n) => { const x = n.attachments.find((y) => y.id === a.id)!; x.docName = e.target.value; })} placeholder="ファイル名" /></span>
                  <span><span className={`att-chip att-${a.attachStatus}`}>{label(SET.attachStatus, a.attachStatus)}</span></span>
                  <span>{editable && <button className="icon-btn danger" onClick={() => set((n) => (n.attachments = n.attachments.filter((y) => y.id !== a.id)))}>{Icon.trash}</button>}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ===== PMDA照会（提出後） ===== */}
      {draft.inquiries.length > 0 && (
        <Section title={t("PMDA inquiries", "PMDA照会対応")} tableSchema="cr_inquiry" colSchema="cr_inquirycontent">
          <div className="row-table">
            {draft.inquiries.map((q) => (
              <div key={q.id} className="inq-row">
                <div className="inq-date">{fmtDate(q.inquiryDate)}</div>
                <div className="inq-body"><b>{q.inquiryContent}</b><div className="muted small">{t("Response due", "回答期限")}: {fmtDate(q.responseDeadline)} {q.responseDate ? `／ ${t("answered", "回答済")} ${fmtDate(q.responseDate)}` : ""}</div></div>
                <div className={`inq-flag ${q.responseDate ? "done" : "open"}`}>{q.responseDate ? t("Answered", "回答済") : t("Open", "未回答")}</div>
              </div>
            ))}
          </div>
        </Section>
      )}
      </>)}

      <div className="detail-foot">
        <span className="muted small">
          {t("Created by", "起票")}: {userById(draft.createdBy)?.name ?? draft.createdBy}（{fmtDate(draft.createdAt)}）
          {draft.reviewedBy && ` ／ ${t("reviewed by", "レビュー完了")}: ${userById(draft.reviewedBy)?.name}`}
          {draft.submittedAt && ` ／ ${t("submitted", "提出")}: ${fmtDate(draft.submittedAt)}`}
          {draft.xmlGeneratedAt && ` ／ XML: ${draft.xmlGeneratedAt.replace("T", " ")}`}
        </span>
      </div>

      {exportErr && <div className="banner banner-red">⚠ {t("Export failed", "出力に失敗しました")}: {exportErr}</div>}

      {rejectOpen && (
        <Modal
          title={t("Send back for revision", "差し戻し")}
          sub={t("The filing returns to Draft. The reason is shown to the drafter and recorded in the audit log.", "届は「作成中」に戻ります。理由は起票者に表示され、監査ログにも残ります。")}
          size="sm"
          onClose={() => setRejectOpen(false)}
          footer={
            <>
              <Btn small onClick={() => setRejectOpen(false)}>{t("Cancel", "キャンセル")}</Btn>
              <Btn
                kind="danger"
                small
                disabled={!rejectReason.trim()}
                title={!rejectReason.trim() ? "理由を入力してください" : ""}
                onClick={() => { onReject(draft.id, rejectReason.trim()); setRejectOpen(false); }}
              >
                {t("Send back", "差し戻す")}
              </Btn>
            </>
          }
        >
          <Field label={t("Reason", "差し戻しの理由")} mark="always" wide>
            <textarea className="tin" rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </Field>
        </Modal>
      )}

      {pkg && (
        <Modal
          title={t("Submission package", "提出パッケージ出力")}
          sub={t("Client demo: PDF from print view + XML. The form PDF bundles the packing list.", "デモのクライアント生成（印刷ビュー→PDF＋XML）。届書PDFにPacking Listを同梱。")}
          size="md"
          onClose={() => setPkg(null)}
          footer={<Btn onClick={() => setPkg(null)}>{t("Close", "閉じる")}</Btn>}
        >
          <div className="form-grid">
            <Field label={t("Notification PDF", "届書PDF")}>
              <div className="inline">
                <span className="muted small">{pkg.pageCount}{t(" pages", "頁")}{pkg.packingListsIncluded > 0 ? t(` · packing list ×${pkg.packingListsIncluded}`, ` ・Packing List ${pkg.packingListsIncluded}件同梱`) : ""}</span>
                <Btn kind="p" small onClick={() => downloadBlob(pkg.pdfBytes, `${baseName}.pdf`, "application/pdf")}>{Icon.doc} {t("Download PDF", "PDFをDL")}</Btn>
              </div>
            </Field>
            <Field label={t("CTN XML", "CTN XML")}>
              <div className="inline">
                <span className="muted small">{(pkg.xml.match(/<[A-Z]/g) ?? []).length}{t(" elements", "要素")}</span>
                <Btn small onClick={() => downloadBlob(pkg.xml, `${baseName}.xml`, "application/xml")}>{Icon.doc} {t("Download XML", "XMLをDL")}</Btn>
              </div>
            </Field>
          </div>
          <div className="form-sub">{t("XML preview", "XMLプレビュー")}</div>
          <pre style={{ maxHeight: "260px", overflow: "auto", background: "var(--row)", border: "1px solid var(--border2)", borderRadius: "8px", padding: "10px", fontSize: "11px", whiteSpace: "pre-wrap" }}>{pkg.xml}</pre>
        </Modal>
      )}

      {/* ===== 操作バー（画面下部に固定） =====
          フォームが縦に長く、入力中は画面が下へ進んでいる。上部に置くと
          保存のたびに戻る必要があるため、常に手元に見える下部へ固定する。 */}
      <div className="detail-footer">
        <div className="detail-actions">
          {editable && <Btn kind="p" small onClick={save} disabled={!dirty}>{Icon.check} {t("Save", "保存")}</Btn>}
          {draft.status === "draft" && (
            <Btn small onClick={() => onSendReview(draft.id)} disabled={dirty || !maySendReview.ok} title={!maySendReview.ok ? maySendReview.reason : dirty ? "先に保存してください" : ""}>{t("Send for review", "レビュー送付")}</Btn>
          )}
          {draft.status === "review" && (
            <Btn small onClick={() => { setRejectReason(""); setRejectOpen(true); }} disabled={dirty || !mayReject.ok} title={!mayReject.ok ? mayReject.reason : dirty ? "先に保存してください" : ""}>{t("Send back", "差し戻し")}</Btn>
          )}
          {draft.status === "review" && (
            <Btn kind="p" small onClick={() => onSubmit(draft.id)} disabled={dirty || jobSepBlocked || !maySubmit.ok} title={!maySubmit.ok ? maySubmit.reason : dirty ? "先に保存してください" : jobSepBlocked ? "職務分離：起票者は自分の届をレビュー完了できません" : ""}>{t("Complete review & submit", "レビュー完了・提出")}</Btn>
          )}
          {/* XML プレビューと提出パッケージ出力は読み取りのため制限しない */}
          <Btn small onClick={() => onGenerateXml(draft)}>{Icon.doc} XML{t(" preview", "プレビュー")}</Btn>
          <Btn kind="p" small onClick={runExport} disabled={exporting}>{Icon.doc} {exporting ? t("Generating…", "生成中…") : t("Export PDF+XML", "提出パッケージ出力")}</Btn>
          {draft.status === "draft" && (
            <Btn kind="danger" small onClick={() => onDelete(draft.id)} disabled={!mayDelete.ok} title={!mayDelete.ok ? mayDelete.reason : ""}>{Icon.trash}</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 治験使用薬カード（展開すると全項目）
// ---------------------------------------------------------------------------
/**
 * 外部標準のコード表から選ぶ。コード表は日本薬局方等が正で、手引きの範囲外のため
 * マスタとして登録する運用にした（推測値を持たない）。未登録なら登録先を案内する。
 */
function CodePicker({ kind, codes, value, disabled, onChange }: { kind: CodeKind; codes: CodeItem[]; value: string; disabled?: boolean; onChange: (v: string) => void }) {
  const { t } = useLang();
  const list = codes.filter((c) => c.kind === kind && (c.active || c.code === value));
  if (list.length === 0) {
    return (
      <>
        <input className="tin" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
        <div className="field-hint">{t(`No ${CODE_KIND_LABEL[kind]} registered. Register it under Masters › Code tables.`, `${CODE_KIND_LABEL[kind]}がマスタ未登録です。マスタ管理 › コード表 から登録すると選択式になります。`)}</div>
      </>
    );
  }
  return (
    <select className="sel" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      <option value="">—</option>
      {list.map((c) => <option key={c.id} value={c.code}>{c.code} {c.name}</option>)}
    </select>
  );
}

function StudyDrugCard({ drug, editable, onField, onRemove, codes }: { drug: StudyDrug; editable: boolean; onField: (fn: (d: StudyDrug) => void) => void; onRemove: () => void; codes: CodeItem[] }) {
  const { t } = useLang();
  const ofl = oflWith(t);
  const [open, setOpen] = useState(false);
  const isMain = drug.drugRole === DRUG_ROLE.main;
  // 主たる被験薬とその他治験使用薬は届書での出力先が違う。同じ部品を使い回す
  // ため、ここでパスを切り替える（クライアント指摘 R-02：どこに出るか不明）
  const dk = (key: string) => (isMain ? key : `${key}（薬別）`);
  return (
    <div className="drugcard">
      <div className="drugcard-h" onClick={() => setOpen((o) => !o)}>
        <button className={`tog2${open ? " open" : ""}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="m9 18 6-6-6-6" /></svg></button>
        <span className={`role-chip ${isMain ? "resp" : "sub"}`}>{label(SET.drugRole, drug.drugRole)}</span>
        <span className="drug-serial">{drug.serialNo > 0 ? `#${drug.serialNo}` : <em className="muted">{t("auto", "採番前")}</em>}</span>
        <b className="drug-name">{drug.drugName || <em className="muted">{t("(unnamed drug)", "（未入力）")}</em>}</b>
        <div style={{ flex: 1 }} />
        {editable && <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); onRemove(); }}>{Icon.trash}</button>}
      </div>
      {open && (
        <div className="drugcard-b">
          <div className="form-grid">
            <Field label={t("Role", "主従区分")} mark="always"><select className="sel" value={drug.drugRole} disabled={!editable} onChange={(e) => onField((d) => (d.drugRole = Number(e.target.value)))}>{options(SET.drugRole).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
            <Field label={t("Drug name", "治験薬名称")} mark="always"><input className="tin" value={drug.drugName} disabled={!editable} onChange={(e) => onField((d) => (d.drugName = e.target.value))} /></Field>
            {!isMain && <Field label={t("Product category", "医薬品/医療機器/再生医療等製品の別")} mark="conditional"><select className="sel" value={drug.productCategory ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.productCategory = e.target.value ? Number(e.target.value) : undefined))}><option value="">—</option>{options(SET.targetCategory).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {!isMain && <Field label={t("ID type", "記号・名称等の種類")} mark="conditional" unconfirmed><input className="tin" value={drug.idType ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.idType = e.target.value))} /></Field>}
            {!isMain && <Field label={t("ID type — other detail", "記号・名称等の種類「その他」詳述")}><input className="tin" value={drug.idTypeDetail ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.idTypeDetail = e.target.value))} /></Field>}
            {!isMain && <Field label={t("Category", "区別（被験薬/対照薬等）")} mark="conditional" unconfirmed><select className="sel" value={drug.combCategory ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.combCategory = e.target.value ? Number(e.target.value) : undefined))}><option value="">—</option>{options(SET.combCategory).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {!isMain && drug.combCategory === COMB.other && <Field label={t("Category — other detail", "区別「その他」詳述")}><input className="tin" value={drug.combCategoryOther ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.combCategoryOther = e.target.value))} /></Field>}
            {!isMain && <Field label={t("Approval status (domestic)", "国内における承認状況")} mark="conditional" unconfirmed><input className="tin" value={drug.applicationStatus ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.applicationStatus = e.target.value))} /></Field>}
            {!isMain && <Field label={t("30-day review (drug)", "30日調査対応被験薬区分（薬別）")} unconfirmed><select className="sel" value={drug.drugSubj30dayReview ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugSubj30dayReview = e.target.value ? Number(e.target.value) : undefined))}><option value="">—</option>{SUBJ30_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {!isMain && <Field label={ofl("対象疾患（薬別）")} hint={ofHint("対象疾患（薬別）")}><input className="tin" value={drug.drugTargetDisease ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugTargetDisease = e.target.value))} /></Field>}
            {!isMain && <Field label={t("ADR report", "副作用報告の有無")} mark="conditional" unconfirmed><select className="sel" value={drug.adrReport ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.adrReport = e.target.value))}><option value="">—</option><option value="有">{t("Yes", "有")}</option><option value="無">{t("No", "無")}</option></select></Field>}
            <Field label={ofl(dk("製造所名称"))} hint={ofHint(dk("製造所名称"))} mark="always" unconfirmed><input className="tin" value={drug.plantName} disabled={!editable} onChange={(e) => onField((d) => (d.plantName = e.target.value))} /></Field>
            <Field label={t("Manufacturer code", "製造所業者コード")} mark="always"><input className="tin" value={drug.plantCode} disabled={!editable} onChange={(e) => onField((d) => (d.plantCode = e.target.value))} /></Field>
            <Field label={ofl("製造所所在地1")} hint={ofHint("製造所所在地1")} mark="always"><input className="tin" value={drug.plantAddress1} disabled={!editable} onChange={(e) => onField((d) => (d.plantAddress1 = e.target.value))} /></Field>
            <Field label={ofl("製造所所在地2")} hint={ofHint("製造所所在地2")} mark="always"><input className="tin" value={drug.plantAddress2} disabled={!editable} onChange={(e) => onField((d) => (d.plantAddress2 = e.target.value))} /></Field>
            <Field label={ofl(dk("薬効分類番号"))} hint={ofHint(dk("薬効分類番号"))} mark="always">
              <CodePicker kind="therapeuticClass" codes={codes} value={drug.efficacyClassCode ?? ""} disabled={!editable}
                onChange={(v) => onField((d) => (d.efficacyClassCode = v))} />
            </Field>
            <Field label={ofl(dk("剤形コード"))} hint={ofHint(dk("剤形コード"))}>
              <CodePicker kind="dosageForm" codes={codes} value={drug.dosageFormCode ?? ""} disabled={!editable}
                onChange={(v) => onField((d) => (d.dosageFormCode = v))} />
            </Field>
            <Field label={ofl(dk("投与経路コード"))} hint={ofHint(dk("投与経路コード"))}>
              <CodePicker kind="adminRoute" codes={codes} value={drug.adminRouteCode ?? ""} disabled={!editable}
                onChange={(v) => onField((d) => (d.adminRouteCode = v))} />
            </Field>
          </div>
          <Field label={ofl(dk("成分及び分量"))} hint={ofHint(dk("成分及び分量"))} mark="always" wide><textarea className="ta" value={drug.ingredients} disabled={!editable} onChange={(e) => onField((d) => (d.ingredients = e.target.value))} /></Field>
          <Field label={ofl(dk("製造方法"))} hint={ofHint(dk("製造方法"))} wide><textarea className="ta" value={drug.manufactMethod ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.manufactMethod = e.target.value))} /></Field>
          <Field label={ofl(dk("予定される効能効果"))} hint={ofHint(dk("予定される効能効果"))} mark="always" wide><textarea className="ta" value={drug.intendEffects} disabled={!editable} onChange={(e) => onField((d) => (d.intendEffects = e.target.value))} /></Field>
          <Field label={ofl(dk("予定される用法用量"))} hint={ofHint(dk("予定される用法用量"))} mark="always" wide><textarea className="ta" value={drug.intendDosage} disabled={!editable} onChange={(e) => onField((d) => (d.intendDosage = e.target.value))} /></Field>
          <Field label={ofl(dk("用法及び用量"))} hint={ofHint(dk("用法及び用量"))} mark="always" unconfirmed wide><textarea className="ta" value={drug.dosageAdmin ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.dosageAdmin = e.target.value))} /></Field>
          {!isMain && (<>
            <div className="form-sub">{t("Other information (per drug)", "その他の情報（薬別）")}</div>
            <div className="form-grid">
              <Field label={ofl(dk("カルタヘナ法 該当有無"))} hint={ofHint(dk("カルタヘナ法 該当有無"))}><select className="sel" value={drug.drugApplicCartagena ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugApplicCartagena = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              <Field label={ofl(dk("生物由来製品 該当有無"))} hint={ofHint(dk("生物由来製品 該当有無"))}><select className="sel" value={drug.drugApplicBiological ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugApplicBiological = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              <Field label={ofl(dk("コンパニオン診断薬等の開発"))} hint={ofHint(dk("コンパニオン診断薬等の開発"))}><select className="sel" value={drug.drugApplicCodx ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugApplicCodx = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              <Field label={ofl(dk("コンビネーション製品に関する治験"))} hint={ofHint(dk("コンビネーション製品に関する治験"))}><select className="sel" value={drug.drugApplicCombinationProd ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugApplicCombinationProd = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
            </div>
            <Field label={ofl("その他備考（薬別）")} hint={ofHint("その他備考（薬別）")} wide><textarea className="ta" value={drug.drugRemarks ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugRemarks = e.target.value))} placeholder={t("e.g. imported product note", "例：海外輸入品の記載 等")} /></Field>
            <div className="form-sub">{t("Foreign sponsor / manufacturer (per drug) — only when applicable", "海外依頼者・外国製造業者（薬別・該当時のみ）")}</div>
            <div className="form-grid">
              <Field label={t("Name (JP)", "名称（邦文）")}><input className="tin" value={drug.foreignName ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignName = e.target.value))} /></Field>
              <Field label={t("Representative (JP)", "代表者氏名（邦文）")}><input className="tin" value={drug.foreignRepName ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignRepName = e.target.value))} /></Field>
              <Field label={t("Address 1 (JP)", "所在地1（邦文）")}><input className="tin" value={drug.foreignAddress1 ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignAddress1 = e.target.value))} /></Field>
              <Field label={t("Address 2 (JP)", "所在地2（邦文）")}><input className="tin" value={drug.foreignAddress2 ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignAddress2 = e.target.value))} /></Field>
              <Field label={t("Name (foreign)", "名称（外国文）")}><input className="tin" value={drug.foreignNameFrgn ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignNameFrgn = e.target.value))} /></Field>
              <Field label={t("Representative (foreign)", "代表者氏名（外国文）")}><input className="tin" value={drug.foreignRepNameFrgn ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignRepNameFrgn = e.target.value))} /></Field>
              <Field label={t("Address 1 (foreign)", "所在地1（外国文）")}><input className="tin" value={drug.foreignAddress1Frgn ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignAddress1Frgn = e.target.value))} /></Field>
              <Field label={t("Address 2 (foreign)", "所在地2（外国文）")}><input className="tin" value={drug.foreignAddress2Frgn ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignAddress2Frgn = e.target.value))} /></Field>
            </div>
          </>)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 施設カード（医師ロスター＋数量マトリクス）
// ---------------------------------------------------------------------------
function SiteCard({
  site, draft, db, editable, terminal, onField, onAddInv, onRemoveInv, onQty, onRemoveSite,
  activeDoctors, activeInstitutions, activeIrbs, activeStaff,
}: {
  site: Site; draft: Notification; db: CtnDb; editable: boolean; terminal: boolean;
  onField: (fn: (s: Site) => void) => void;
  onAddInv: (doctorId: string, role: number) => void;
  onRemoveInv: (invId: string) => void;
  onQty: (studyDrugId: string, field: keyof SiteDrugQty, val: number) => void;
  onRemoveSite: () => void;
  activeDoctors: typeof db.doctors; activeInstitutions: typeof db.institutions; activeIrbs: typeof db.irbs; activeStaff: typeof db.siteStaff;
}) {
  const { t } = useLang();
  const ofl = oflWith(t);
  const [pickDoc, setPickDoc] = useState("");
  const [pickRole, setPickRole] = useState(String(DOCTOR_ROLE.sub));
  const inst = db.institutions.find((i) => i.id === site.institutionId);
  const changeTypeBadge = (ct: number) => {
    const cls = ct === CHANGE_TYPE.add ? "add" : ct === CHANGE_TYPE.remove ? "remove" : ct === CHANGE_TYPE.register ? "register" : "cont";
    return <span className={`mv mv-${cls}`}>{label(SET.changeType, ct)}</span>;
  };
  const rosterDoctorIds = new Set(site.investigators.map((i) => i.doctorId));

  return (
    <div className="sitecard">
      <div className="sitecard-h">
        <div className="site-serial">{t("Site", "施設")} {site.serialNo > 0 ? `#${site.serialNo}` : t("(new)", "（採番前）")}</div>
        <select className="sel sel-sm" value={site.institutionId} disabled={!editable} onChange={(e) => onField((s) => (s.institutionId = e.target.value))}>
          <option value="">{t("Select institution…", "医療機関を選択…")}</option>
          {activeInstitutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        {editable && <button className="icon-btn danger" onClick={onRemoveSite} title="施設を削除">{Icon.trash}</button>}
      </div>
      <div className="site-grid">
        <Field label={ofl("実施診療科")} hint={ofHint("実施診療科")} mark="always">
          {/* 医療機関マスタの診療科から選ぶ（表記ブレ防止・R-19）。候補に無い科は直接入力もできる */}
          <input className="tin tin-sm" list={`depts-${site.id}`} value={site.department} disabled={!editable}
            onChange={(e) => onField((s) => (s.department = e.target.value))} />
          <datalist id={`depts-${site.id}`}>
            {(activeInstitutions.find((i) => i.id === site.institutionId)?.departments ?? []).map((d) => <option key={d} value={d} />)}
          </datalist>
        </Field>
        <Field label={ofl("予定被験者数")} hint={ofHint("予定被験者数")} mark="always"><input type="number" className="tin tin-sm" value={site.plannedSubjects} disabled={!editable} onChange={(e) => onField((s) => (s.plannedSubjects = Number(e.target.value)))} /></Field>
        <Field label={ofl("IRB")} hint={ofHint("IRB")} mark="always"><select className="sel sel-sm" value={site.irbId} disabled={!editable} onChange={(e) => onField((s) => (s.irbId = e.target.value))}><option value="">{t("Select IRB…", "IRBを選択…")}</option>{activeIrbs.map((i) => <option key={i.id} value={i.id}>{i.ownerName}</option>)}</select></Field>
        <Field label={t("CRC", "CRC")}><select className="sel sel-sm" value={site.crcStaffId ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.crcStaffId = e.target.value || undefined))}><option value="">—</option>{activeStaff.filter((st) => st.institutionId === site.institutionId).map((st) => <option key={st.id} value={st.id}>{st.name}（{st.role}）</option>)}</select></Field>
        {terminal && <Field label={ofl("実施医療機関被験者数")} hint={ofHint("実施医療機関被験者数")} mark="always"><input type="number" className="tin tin-sm" value={site.enrolledSubjects ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.enrolledSubjects = Number(e.target.value)))} /></Field>}
        <Field label={ofl("SMO名称")} hint={ofHint("SMO名称")}><input className="tin tin-sm" value={site.smoName ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.smoName = e.target.value))} placeholder={t("If SMO is used", "SMOありの場合")} /></Field>
        <Field label={ofl("SMO住所1")} hint={ofHint("SMO住所1")}><input className="tin tin-sm" value={site.smoAddress1 ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.smoAddress1 = e.target.value))} /></Field>
        <Field label={ofl("SMO住所2")} hint={ofHint("SMO住所2")}><input className="tin tin-sm" value={site.smoAddress2 ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.smoAddress2 = e.target.value))} /></Field>
        <Field label={ofl("SMO委託業務範囲")} hint={ofHint("SMO委託業務範囲")}><input className="tin tin-sm" value={site.smoService ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.smoService = e.target.value))} /></Field>
        <Field label={ofl("その他")} hint={ofHint("その他")} unconfirmed><input className="tin tin-sm" value={site.others ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.others = e.target.value))} /></Field>
      </div>

      {/* 医師ロスター */}
      <div className="roster">
        <div className="roster-h">{t("Investigator roster", "分担医師ロスター")} <span className="muted small">（{inst?.name}）</span></div>
        {site.investigators.map((inv) => (
          <div key={inv.id} className={`roster-row${inv.changeType === CHANGE_TYPE.remove ? " removed" : ""}`}>
            <span className={`role-chip ${inv.doctorRole === DOCTOR_ROLE.responsible ? "resp" : "sub"}`}>{label(SET.doctorRole, inv.doctorRole)}</span>
            <span className="rname">{inv.nameFiling}<small className="muted"> {inv.pronounce}</small>{inv.nameOriginal !== inv.nameFiling && <small className="gaiji-note"> 原表記:{inv.nameOriginal}</small>}</span>
            <span className="rserial">{inv.serialNo > 0 ? `#${inv.serialNo}` : ""}</span>
            {draft.notifType === "change" && changeTypeBadge(inv.changeType)}
            {editable && inv.changeType !== CHANGE_TYPE.remove && <button className="icon-btn danger sm" onClick={() => onRemoveInv(inv.id)} title="ロスターから抜く">{Icon.x}</button>}
          </div>
        ))}
        {editable && (
          <div className="roster-add">
            <select className="sel sel-sm" value={pickDoc} onChange={(e) => setPickDoc(e.target.value)}>
              <option value="">{t("Select doctor…", "医師を選択…")}</option>
              {activeDoctors.filter((d) => !rosterDoctorIds.has(d.id)).map((d) => <option key={d.id} value={d.id}>{d.nameFiling}（{d.doctorNo}）{d.hasGaiji ? " ⚠外字" : ""}</option>)}
            </select>
            <select className="sel sel-sm" value={pickRole} onChange={(e) => setPickRole(e.target.value)}>
              {options(SET.doctorRole).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Btn small disabled={!pickDoc} onClick={() => { if (pickDoc) { onAddInv(pickDoc, Number(pickRole)); setPickDoc(""); } }}>{Icon.plus} {t("Add to roster", "ロスターに追加")}</Btn>
          </div>
        )}
      </div>

      {/* 数量マトリクス */}
      {draft.studyDrugs.length > 0 && (
        <div className="qty">
          <div className="qty-h">{t("Drug quantities (this site)", "施設別治験薬数量")}{terminal && <UnconfirmedBadge label={t("supply→abrogation required", "交付〜廃棄が必須")} />}</div>
          <table className="qty-tbl">
            <thead><tr><th>{t("Drug", "治験薬")}</th><th>{t("Planned", "予定交付")}</th>{terminal && <><th>{t("Supplied", "交付")}</th><th>{t("Used", "使用")}</th><th>{t("Withdrawn", "回収")}</th><th>{t("Abrogated", "廃棄")}</th></>}</tr></thead>
            <tbody>
              {draft.studyDrugs.map((d) => {
                const q = site.quantities.find((x) => x.studyDrugId === d.id);
                return (
                  <tr key={d.id}>
                    <td>{d.drugName || <em className="muted">（未入力）</em>} {d.serialNo > 0 && <small className="muted">#{d.serialNo}</small>}</td>
                    <td><input type="number" className="tin tin-xs" value={q?.qtyPlanned ?? 0} disabled={!editable} onChange={(e) => onQty(d.id, "qtyPlanned", Number(e.target.value))} /></td>
                    {terminal && <>
                      <td><input type="number" className="tin tin-xs" value={q?.qtySupplied ?? ""} disabled={!editable} onChange={(e) => onQty(d.id, "qtySupplied", Number(e.target.value))} /></td>
                      <td><input type="number" className="tin tin-xs" value={q?.qtyUsed ?? ""} disabled={!editable} onChange={(e) => onQty(d.id, "qtyUsed", Number(e.target.value))} /></td>
                      <td><input type="number" className="tin tin-xs" value={q?.qtyWithdrawn ?? ""} disabled={!editable} onChange={(e) => onQty(d.id, "qtyWithdrawn", Number(e.target.value))} /></td>
                      <td><input type="number" className="tin tin-xs" value={q?.qtyAbrogated ?? ""} disabled={!editable} onChange={(e) => onQty(d.id, "qtyAbrogated", Number(e.target.value))} /></td>
                    </>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
