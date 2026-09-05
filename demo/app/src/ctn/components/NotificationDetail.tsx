import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "../../i18n";
import { columnOf, requiredFor, shouldShow, isRequired } from "../schema";
import { ofHint, oflWith } from "../officialLabels";
import { xsdLabel, xsdNo, xsdTitle } from "../xsdLabels";
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
  ADR_REPORT_DEFAULT,
  ADR_REPORT_OPTIONS,
  APPROVAL_STATUS_OPTIONS,
  BIOLOGICAL_OPTIONS,
  CARTAGENA_OPTIONS,
  COMPOUND_CODE_MAX,
  EFFICACY_CLASS_DIGITS,
  ID_TYPE_OPTIONS,
  MANUFACTURER_CODE_DIGITS,
  REF_TYPE_OPTIONS,
  TRIAL_POSITION_OPTIONS,
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
import { Section, Field, FormBlock, StatusPill, TypeBadge, Btn, Icon, UnconfirmedBadge, Modal } from "./common";
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

  // ---- 届出区分は変更箇所から自動で決まる ----
  // 変更箇所を選び直したら届出区分もその場で追従する。以前は「推奨に戻す」
  // ボタンを押させていたが（R-03「いつ押すのか分からない」）、押す判断そのものを
  // 無くした。届出区分は既定で参照表示にし、入力欄としては出さない。
  //
  // 手引きの届出区分は変更箇所の選択だけでは決めきれない場合がある
  // （基本通知の記の1.(6)①エ・②ウ 等）。そのため明示的な上書きだけ残し、
  // 上書き中はその旨をバッジで出す。既存データが推奨と違う値を持っていた場合は
  // 勝手に書き換えないよう、最初から上書き中として扱う。
  const sugValue = kubunSug?.value;
  const [kubunManual, setKubunManual] = useState(
    () => notification.kubun != null && recommendKubun(notification).value !== notification.kubun
  );
  useEffect(() => {
    if (!editable || kubunManual || sugValue == null) return;
    if (draft.kubun !== sugValue) set((n) => (n.kubun = sugValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sugValue, editable, kubunManual, draft.kubun]);

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
  // 届書では主たる被験薬の明細は「主たる被験薬に関する届出事項」、それ以外は
  // 独立したブロックに出る。画面もタブを分ける
  const mainDrug = draft.studyDrugs.find((d) => d.drugRole === DRUG_ROLE.main);
  const otherDrugs = draft.studyDrugs.filter((d) => d.drugRole !== DRUG_ROLE.main);

  // 詳細画面のタブ。1つのタブ＝届書の連続した番号の範囲にしてあるので、
  // 左から順に進めば届書の上から順に入力していくことになる（＝届書PDFの並び）。
  // no はタブのボタンにも出し、並びが届書と同じであることを画面から分かるようにする。
  const isDevDisc = draft.notifType === "devDiscontinuation";
  const detailTabs: { key: string; no: string; label: [string, string]; show: boolean }[] = [
    { key: "basic", no: "1–2.1", label: ["Filing items", "届出事項"], show: true },
    { key: "maindrug", no: "2.2–2.5", label: ["Main drug", "主たる被験薬"], show: !isDevDisc },
    { key: "plan", no: "2.6–2.8", label: ["Plan summary", "治験計画の概要"], show: !isDevDisc },
    { key: "notes", no: "2.9–2.12", label: ["Remarks / notifier", "備考・添付・届出者"], show: true },
    { key: "drugs", no: "3", label: ["Other drugs", "その他治験使用薬"], show: !isDevDisc },
    { key: "sites", no: "4", label: ["Institutions", "実施医療機関"], show: !isDevDisc },
    { key: "refs", no: "5", label: ["References", "参照・照会"], show: !isDevDisc || draft.inquiries.length > 0 },
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

      {/* ===== セクションタブ =====
          スクロールしても常に見えるようにしている（届書の順に並べると縦に長く、
          隣のブロックへ移りたくなるため）。番号は届書での範囲。 */}
      <div className="detail-tabsbar">
        <div className="detail-tabs">
          {visibleTabs.map((tb) => (
            <button key={tb.key} type="button" className={`dtab${activeTab === tb.key ? " on" : ""}`} onClick={() => setTab(tb.key)}>
              <span className="dtab-no">{tb.no}</span>
              {t(tb.label[0], tb.label[1])}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 共通事項・届出事項タブ =====
          ブロックの区切り・順序・名前は公式XSD（届書の並び）に合わせている。
          FormBlock が届書の見出し番号と階層を出すので、入力欄が届書のどこに
          出るかが画面から追える（クライアント要望 2026-09）。 */}
      {activeTab === "basic" && (<>
      {/* 届書の1行目。入れ物ではなく単独の欄なので番号は付かない */}
      <Section title={t("Form version", "様式等のバージョン情報")} sub={t("Printed on the first line of the form.", "届書の1行目に出力されます。")}>
        <div className="fblock-b one">
          <Field label={ofl("様式等のバージョン情報")}><input className="tin" value={draft.formVersion ?? "医薬品治験届 令和２年８月改正版"} disabled={!editable} onChange={(e) => set((n) => (n.formVersion = e.target.value))} /></Field>
        </div>
      </Section>

      <Section title={xsdTitle("COMMONINFOCLINTRIALPLANNOTE")} sub={t("Common items — inherited from the series where possible", "共通事項。シリーズ（治験成分記号）から継承できるものは参照表示。")}>
        <div className="fblock-b">
          <Field label={ofl("治験成分記号")} mark="always" hint={t(`Alphanumerics, up to ${COMPOUND_CODE_MAX} characters (Guide 5.1(1))`, `手引き：アルファベット及び数字で計${COMPOUND_CODE_MAX}桁以内・半角`)}><input className="tin" value={compound.compoundCode} disabled /></Field>
          <Field label={ofl("治験の種類")}><input className="tin" value={compound.trialKind ?? ""} disabled /></Field>
          <Field label={ofl("初回届出受付番号")}><input className="tin" value={compound.initReceptNo ?? ""} disabled /></Field>
          <Field label={ofl("初回届出年月日")}><input className="tin" value={compound.initNoteDate ?? ""} disabled /></Field>
          <Field label={ofl("届出回数")} mark="auto"><input className="tin" value={`${draft.filingCount}`} disabled /></Field>
          {show("cr_receptno") && (
            <Field label={ofl("当該届出受付番号")} mark={mk("cr_receptno")}>
              <input className="tin" value={draft.receptNo ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.receptNo = e.target.value))} placeholder={draft.notifType === "plan" ? "（計画届は空欄）" : "例：R6薬第1234号"} />
              {draft.notifType === "plan" && <div className="field-hint">{t("Guide 5.1(6): submit blank on the plan notification.", "手引き 5.1(6)：治験計画届は空欄で届出します。")}</div>}
            </Field>
          )}
          {show("cr_receptdate") && (
            <Field label={ofl("当該届出年月日")} mark={mk("cr_receptdate")}>
              <input type="date" className="tin" value={draft.receptDate ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.receptDate = e.target.value))} />
            </Field>
          )}
        </div>
      </Section>

      <Section title={xsdTitle("INFONOTE")} sub={t("Items of this filing itself. The drug details of the main investigational drug are on the Study drugs tab.", "この届そのものの事項。主たる被験薬の薬の明細は「治験使用薬」タブにあります。")}>
        {/* 届出事項の頭。XSD の並びのうち、届出区分の前に「何を変えたのか」を
            置いている（区分と提出期限がそこから決まるため） */}
        <div className="fblock-b">
          <Field label={ofl("届出年月日")} mark="auto"><input className="tin" value={draft.noteDate ?? ""} disabled /></Field>
          <Field label={ofl("届出分類")} mark="always"><input className="tin" value={notifTypeName(draft.notifType, lang)} disabled /></Field>
          {draft.notifType === "change" && <Field label={ofl("変更回数")} mark="auto"><input className="tin" value={`${draft.changeCount ?? "—"}`} disabled /></Field>}
        </div>

        {/* 変更内容。届書には出ないが、届出区分と提出期限をここから決めるので
            届出区分の直前に置く（以前は下の運用項目にまとめていて因果が見えなかった） */}
        {draft.notifType === "change" && (
          <div className="fblock">
            <div className="fblock-h"><span className="fblock-name">{t("What is being changed (drives the category and the deadline)", "変更内容（届出区分・提出期限を決めます）")}</span></div>
            <div className="fblock-path">{t("Not printed on the form.", "届書には出力されません。")}</div>
            <div className="fblock-b one">
              <Field label={ofl("変更箇所")} mark="always" wide
                hint={t("Pick every place that changes. The submission category below follows the heaviest one.", "変更する箇所をすべて選んでください。下の届出区分は、選んだうちで最も重い区分に自動で追従します。")}>
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
              <Field label={ofl("変更年月日")} hint={ofHint("変更年月日")} mark="always"><input type="date" className="tin" value={draft.changeDate ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.changeDate = e.target.value))} /></Field>
              <Field label={ofl("変更理由")} hint={ofHint("変更理由")} mark="always" wide><textarea className="ta" value={draft.changeReason ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.changeReason = e.target.value))} /></Field>
            </div>
          </div>
        )}

        <div className="fblock-b">
          {/* 届出区分は自動。上書きは手引きで判断が必要な例外のときだけ */}
          <Field label={ofl("届出区分")} mark="always"
            unconfirmed={kubunManual}
            unconfirmedNote={kubunManual ? "自動判定を手動で上書きしています。手引きの届出区分は変更箇所の選択だけでは決めきれない場合があるため（基本通知の記の1.(6)①エ・②ウ 等）、上書きできるようにしています。" : undefined}>
            {kubunManual ? (
              <div className="inline">
                <select className="sel" value={draft.kubun ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.kubun = e.target.value === "" ? undefined : Number(e.target.value)))}>
                  <option value="">—</option>
                  {options(SET.kubun).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {editable && <Btn small onClick={() => { setKubunManual(false); if (sugValue != null) set((n) => (n.kubun = sugValue)); }}>{t("Back to automatic", "自動に戻す")}</Btn>}
              </div>
            ) : (
              <div className="inline">
                <input className="tin" value={draft.kubun == null ? "—" : label(SET.kubun, draft.kubun)} disabled />
                {editable && <Btn small onClick={() => setKubunManual(true)}>{t("Override", "手動で上書き")}</Btn>}
              </div>
            )}
            {kubunSug && !kubunManual && (
              <div className="field-hint">
                {t(`Automatic: ${kubunSug.reasonEn}`, `自動判定：${kubunSug.reasonJa}`)}
              </div>
            )}
            {kubunSug && kubunManual && draft.kubun !== kubunSug.value && (
              <div className="field-hint">
                {t(`Automatic would be ${label(SET.kubun, kubunSug.value)}: ${kubunSug.reasonEn}`, `自動判定なら「${label(SET.kubun, kubunSug.value)}」：${kubunSug.reasonJa}`)}
              </div>
            )}
          </Field>
          {show("cr_subj30dayreview") && (
            <Field label={ofl("30日調査対応被験薬区分")} mark={mk("cr_subj30dayreview")}
              hint={t("Guide 5.2(5): only when the 30-day review applies. Blank for microdose studies, or when the drug has already been given to humans (state it in Remarks).", "手引き 5.2(5)：30日調査の対象となる場合のみ入力します。マイクロドーズ臨床試験、既に人に投与済みの場合は空欄とし、備考にその旨を入力します。")}>
              <select className="sel" value={draft.subj30dayReview ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.subj30dayReview = e.target.value ? Number(e.target.value) : undefined))}>
                <option value="">—</option>
                {SUBJ30_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          )}
        </div>

        {/* 届書に出ない運用項目。届書項目と混ざらないよう別のかたまりにする。
            中身が無いときは枠も出さない（中止届・終了届では両方とも出ない） */}
        {(show("cr_plannedstartdate") || draft.status === "submitted") && (
        <div className="fblock">
          <div className="fblock-h"><span className="fblock-name">{t("Operational items (not printed on the form)", "運用項目（届書には出力されません）")}</span></div>
          <div className="fblock-path">{t("Used to compute the deadline and the submission category.", "提出期限・届出区分の判定に使う入力です。")}</div>
          <div className="fblock-b">
            {show("cr_plannedstartdate") && (
              <Field label={ofl("治験開始予定日")} hint={ofHint("治験開始予定日")} mark={mk("cr_plannedstartdate")}>
                <input type="date" className="tin" value={draft.plannedStartDate ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.plannedStartDate = e.target.value))} />
              </Field>
            )}
            {/* GW受付番号は提出後に PMDA の受付完了メールから記録する項目。
                作成中はまだ存在しないので、提出済みになってから出す */}
            {draft.status === "submitted" && (
              <Field label={ofl("GW受付番号")} hint={ofHint("GW受付番号")} mark={mk("cr_gwreceptno")}><input className="tin" value={draft.gwReceptNo ?? ""} disabled={!mayEdit.ok} onChange={(e) => set((n) => (n.gwReceptNo = e.target.value))} /></Field>
            )}
          </div>
        </div>
        )}

        {(draft.notifType === "termination" || draft.notifType === "devDiscontinuation") && (
          <FormBlock el="INFOPREMATURETERMINATION">
            <Field label={ofl("中止年月日")} mark="always"><input type="date" className="tin" value={draft.terminationDate ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.terminationDate = e.target.value))} /></Field>
            <Field label={ofl("中止理由")} mark="always" wide><input className="tin" value={draft.terminationReason ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.terminationReason = e.target.value))} /></Field>
            {draft.notifType === "termination" && <Field label={ofl("その後の対応状況")} mark="always" wide><input className="tin" value={draft.postTermination ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.postTermination = e.target.value))} /></Field>}
          </FormBlock>
        )}

      </Section>
      </>)}

      {/* ===== 主たる被験薬タブ（届書 2.2〜2.5）=====
          届書では「主たる被験薬に関する届出事項」の中の薬の明細にあたる。
          このブロックの他の欄（届出区分・中止情報など）は「届出事項」タブ。 */}
      {activeTab === "maindrug" && (
        <Section title={xsdTitle("INFONOTE")}
          sub={t("Drug details of the main investigational drug (2.2–2.5). The other items of this block are on the first tab.", "主たる被験薬の薬の明細（2.2〜2.5）です。このブロックの他の欄（届出区分・中止情報など）は「届出事項」タブにあります。")}
          right={editable && !mainDrug ? <Btn kind="p" small onClick={addStudyDrug}>{Icon.plus} {t("Add", "主たる被験薬を追加")}</Btn> : undefined}>
          {!mainDrug && <div className="rt-empty">{t("No main investigational drug yet.", "主たる被験薬がありません。追加してください。")}</div>}
          {mainDrug && (
            <StudyDrugCard key={mainDrug.id} drug={mainDrug} editable={editable} onField={(fn) => setDrug(mainDrug.id, fn)} onRemove={() => rmStudyDrug(mainDrug.id)} codes={db.codes} />
          )}
        </Section>
      )}

      {/* ===== 治験計画の概要タブ =====
          並び順は公式XSD の SUMMARYPROTOCOL のとおり。以前は入力しやすさだけで
          並べていたため、届書のどこを入力しているのか対応が取れなかった。 */}
      {activeTab === "plan" && (<>
        <Section title={xsdTitle("SUMMARYPROTOCOL")} sub={t("Order follows the official form.", "並び順は届書（公式XSD）と同じです。")}>
          <div className="fblock-b">
            {show("cr_protocolno") && <Field label={ofl("実施計画書識別記号")} mark={mk("cr_protocolno")}><input className="tin" value={draft.protocolNo} disabled={!editable} onChange={(e) => set((n) => (n.protocolNo = e.target.value))} /></Field>}
            {show("cr_phase") && <Field label={ofl("開発の相")} mark={mk("cr_phase")}><select className="sel" value={draft.phase ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.phase = Number(e.target.value)))}><option value="">—</option>{options(SET.phase).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {show("cr_trialtype") && <Field label={ofl("試験の種類")} mark={mk("cr_trialtype")}><select className="sel" value={draft.trialType ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.trialType = Number(e.target.value)))}><option value="">—</option>{options(SET.trialType).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {show("cr_objectives") && <Field label={ofl("目的")} mark={mk("cr_objectives")} wide><textarea className="ta" value={draft.objectives} disabled={!editable} onChange={(e) => set((n) => (n.objectives = e.target.value))} /></Field>}
          </div>

          <FormBlock el="INFOPLANNUMSUBJ">
            {show("cr_plannedsubjdrug") && <Field label={ofl("予定被験者数（被験薬）")} mark={mk("cr_plannedsubjdrug")}><input type="number" className="tin" value={draft.plannedSubjDrug ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.plannedSubjDrug = Number(e.target.value)))} /></Field>}
            {show("cr_plannedsubjtotal") && <Field label={ofl("予定被験者数（合計）")} mark={mk("cr_plannedsubjtotal")}><input type="number" className="tin" value={draft.plannedSubjTotal ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.plannedSubjTotal = Number(e.target.value)))} /></Field>}
          </FormBlock>

          {show("cr_targetdisease") && (
            <div className="fblock-b" style={{ marginTop: "18px" }}>
              <Field label={ofl("主たる被験薬の対象疾患")} mark={mk("cr_targetdisease")} wide><input className="tin" value={draft.targetDisease} disabled={!editable} onChange={(e) => set((n) => (n.targetDisease = e.target.value))} /></Field>
            </div>
          )}

          {/* 主たる被験薬の用法及び用量。値は主たる被験薬に持たせているが、
              届書ではここ（治験計画の概要）に出るので入力もここに置く */}
          <FormBlock el="INFODOSAGEADMIN" cols="1"
            note={mainDrug ? undefined : t("Add the main investigational drug first.", "先に「主たる被験薬」タブで主たる被験薬を追加してください。")}>
            {mainDrug && (
              <Field label={ofl("用法及び用量")} mark="always"
                hint={t("Guide 5.2(12)7): the dosage and administration actually used, in detail.", "手引き 5.2(12)7）：用いられる用法及び用量を詳細に入力します。")} wide>
                <textarea className="ta" value={mainDrug.dosageAdmin ?? ""} disabled={!editable} onChange={(e) => setDrug(mainDrug.id, (d) => (d.dosageAdmin = e.target.value))} />
              </Field>
            )}
          </FormBlock>

          <FormBlock el="WHOLEDURATIONCLINTRIAL"
            note={t("Guide 5.2(12)8): earliest planned contract date across sites to the latest planned end-of-observation date.", "手引き 5.2(12)8）：実施医療機関ごとの予定契約締結日のうち最も早い日から、観察終了予定日のうち最も遅い日まで。")}>
            {show("cr_periodstart") && <Field label={ofl("実施期間（開始）")} mark={mk("cr_periodstart")}><input className="tin" value={draft.periodStart ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.periodStart = e.target.value))} placeholder="YYYY-MM-DD" /></Field>}
            {show("cr_periodend") && <Field label={ofl("実施期間（終了）")} mark={mk("cr_periodend")}><input className="tin" value={draft.periodEnd ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.periodEnd = e.target.value))} placeholder="YYYY-MM-DD" /></Field>}
          </FormBlock>

          {show("cr_reasononerous") && (
            <div className="fblock-b" style={{ marginTop: "18px" }}>
              <Field label={ofl("有償の理由等")} hint={t("Guide 5.2(12)9): blank when free of charge — trials are free of charge in principle.", "手引き 5.2(12)9）：無償の場合は空欄。治験は原則無償で、有償で譲渡する場合にその理由を記載します。")} mark={mk("cr_reasononerous")} wide><textarea className="ta" value={draft.reasonOnerous ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.reasonOnerous = e.target.value))} placeholder={t("Only for onerous (paid) trials", "有償治験の場合のみ")} /></Field>
            </div>
          )}

          <FormBlock el="CHARGEOUTPERSONCLINTRIAL" cols="1"
            note={t("Guide 5.2(12)10): submit blank.", "手引き 5.2(12)10）：空欄とすること。")}>
            {show("cr_chargeoutperson") && <Field label={ofl("費用負担者氏名")} mark={mk("cr_chargeoutperson")}><input className="tin" value={draft.chargeOutPersonName ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.chargeOutPersonName = e.target.value))} /></Field>}
            {show("cr_validityreasons") && <Field label={ofl("費用負担の妥当性の理由")} mark={mk("cr_validityreasons")} wide><textarea className="ta" value={draft.validityReasons ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.validityReasons = e.target.value))} /></Field>}
          </FormBlock>

          <FormBlock el="INFOCOORDINVESTIGATOR"
            note={t("Guide 5.2(12)11): only when coordination of trial details is entrusted. This demo takes a single entry.", "手引き 5.2(12)11）：治験の細目について調整する業務を委嘱する場合に入力します（本デモは単数入力）。")}>
            {show("cr_coordname") && <Field label={ofl("治験調整医師 氏名")} mark={mk("cr_coordname")} unconfirmed unconfirmedNote="届書はこの枠を繰り返せますが、本デモは単数入力です（複数ある場合の入力・出力は未対応）。項目の記載方法は手引きと一致しています。"><input className="tin" value={draft.coordName ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.coordName = e.target.value))} /></Field>}
            {show("cr_coordinstitution") && <Field label={ofl("医療機関名")} mark={mk("cr_coordinstitution")} unconfirmed unconfirmedNote="届書はこの枠を繰り返せますが、本デモは単数入力です（複数ある場合の入力・出力は未対応）。項目の記載方法は手引きと一致しています。"><input className="tin" value={draft.coordInstitution ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.coordInstitution = e.target.value))} /></Field>}
            {show("cr_coordaffiliation") && <Field label={ofl("所属")} mark={mk("cr_coordaffiliation")} unconfirmed unconfirmedNote="届書はこの枠を繰り返せますが、本デモは単数入力です（複数ある場合の入力・出力は未対応）。項目の記載方法は手引きと一致しています。"><input className="tin" value={draft.coordAffiliation ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.coordAffiliation = e.target.value))} /></Field>}
          </FormBlock>

          <FormBlock el="INFOCRO"
            note={t("Guide 5.2(12)12): only when the work is (partly) outsourced. This demo takes a single entry.", "手引き 5.2(12)12）：治験の依頼及び管理に係る業務の全部又は一部を委託する場合に入力します（本デモは単数入力）。")}>
            {show("cr_croname") && <Field label={ofl("CRO 名称")} mark={mk("cr_croname")} unconfirmed unconfirmedNote="届書はこの枠を繰り返せますが、本デモは単数入力です（複数ある場合の入力・出力は未対応）。項目の記載方法は手引きと一致しています。"><input className="tin" value={draft.croName ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.croName = e.target.value))} /></Field>}
            {show("cr_croaddress1") && <Field label={ofl("CRO 所在地1")} mark={mk("cr_croaddress1")} unconfirmed unconfirmedNote="届書はこの枠を繰り返せますが、本デモは単数入力です（複数ある場合の入力・出力は未対応）。項目の記載方法は手引きと一致しています。"><input className="tin" value={draft.croAddress1 ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.croAddress1 = e.target.value))} /></Field>}
            {show("cr_croaddress2") && <Field label={ofl("CRO 所在地2")} mark={mk("cr_croaddress2")} unconfirmed unconfirmedNote="届書はこの枠を繰り返せますが、本デモは単数入力です（複数ある場合の入力・出力は未対応）。項目の記載方法は手引きと一致しています。"><input className="tin" value={draft.croAddress2 ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.croAddress2 = e.target.value))} /></Field>}
            {show("cr_croservice") && <Field label={ofl("CRO 受託業務の範囲")} mark={mk("cr_croservice")} unconfirmed unconfirmedNote="届書はこの枠を繰り返せますが、本デモは単数入力です（複数ある場合の入力・出力は未対応）。項目の記載方法は手引きと一致しています。" wide><textarea className="ta" value={draft.croService ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.croService = e.target.value))} /></Field>}
          </FormBlock>
        </Section>

        {/* ===== 主たる被験薬のその他の情報 =====
            届書ではこのブロックの中に「◯◯を用いる治験」ごとの小ブロックがあり、
            その中の欄名は「該当の有無」または「該当の有無等」になっている。
            どの治験のことかはブロックの見出しが示す（届書と同じ形）。 */}
        <Section title={xsdTitle("INFOOTHERS_PRIMARY")} sub={t("Applicability per topic — the block heading is the topic, as on the form.", "何についての該当性かはブロック見出しが示します（届書と同じ形）。")}>
          <FormBlock el="INFOCLINTRIALWITHDRUGCARTAGENA">
            {show("cr_cartagena") && <Field label={ofl("カルタヘナ法 該当有無")} mark={mk("cr_cartagena")}><select className="sel" value={draft.applicCartagena ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicCartagena = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{CARTAGENA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {draft.applicCartagena != null && draft.applicCartagena > 0 && <Field label={ofl("カルタヘナ法 詳細")} mark={mk("cr_cartagenadetail")} hint={t("Guide 5.2(13)1): approval status of the Type 1 use regulation, and whether the Type 2 containment measures are confirmed, plus the planned work level — per site when there are several.", "手引き 5.2(13)1）：第一種使用規程の承認取得状況、第二種使用等拡散防止措置確認の有無、予定される作業レベル（施設が複数ある場合は施設ごと）。")} wide><textarea className="ta" value={draft.applicCartagenaDetail ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicCartagenaDetail = e.target.value))} /></Field>}
          </FormBlock>

          {/* 届書に詳述の欄が無いのは、手引きの4区分が詳述を兼ねているため */}
          <FormBlock el="INFOCLINTRIALWITHBIOLOGICALPROD" cols="1">
            {show("cr_biological") && <Field label={ofl("生物由来製品 該当有無")} mark={mk("cr_biological")} hint={t("Guide 5.2(13)2): pick the category; there is no separate detail column.", "手引き 5.2(13)2）：見込み／指定済み、生物由来／特定生物由来の区分を選びます（詳述欄はありません）。")}><select className="sel" value={draft.applicBiological ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicBiological = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{BIOLOGICAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
          </FormBlock>

          <FormBlock el="INFORESEARCHFORCODX" cols="1">
            {show("cr_applicodx") && <Field label={ofl("コンパニオン診断薬等の開発")} mark={mk("cr_applicodx")}><select className="sel" value={draft.applicCodx ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicCodx = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
          </FormBlock>

          <FormBlock el="INFOCLINTRIALFORCOMBINATIONPROD" cols="1">
            {show("cr_combinationprod") && <Field label={ofl("コンビネーション製品に関する治験")} mark={mk("cr_combinationprod")}><select className="sel" value={draft.applicCombinationProd ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicCombinationProd = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
          </FormBlock>

          {show("cr_othercommentsprimary") && (
            <div className="fblock-b one" style={{ marginTop: "18px" }}>
              <Field label={ofl("その他コメント（主たる被験薬）")} mark={mk("cr_othercommentsprimary")} wide><textarea className="ta" value={draft.otherCommentsPrimary ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.otherCommentsPrimary = e.target.value))} /></Field>
            </div>
          )}
        </Section>

        {/* ===== 当該届出に関するその他の情報 ===== */}
        <Section title={xsdTitle("INFOOTHERS_PROTOCOL")} sub={t("Applicability per topic — the block heading is the topic, as on the form.", "何についての該当性かはブロック見出しが示します（届書と同じ形）。")}>
          <FormBlock el="INFOEXPANDEDACCESSPROG" cols="1">
            {show("cr_expandedaccess") && <Field label={ofl("臨床試験の位置付け（拡大治験）")} mark={mk("cr_expandedaccess")}
              hint={draft.applicExpandedAccess === 2
                ? t("Guide 5.2(14)6): when choosing 拡大治験, enter “拡大治験、主たる治験の受付番号○○-○○○○” in Other below.", "手引き 5.2(14)6）：「拡大治験」を選ぶ場合は、下の「その他」に『拡大治験、主たる治験の受付番号○○-○○○○』と入力します。")
                : t("Guide 5.2(14)1): 主たる治験 / 拡大治験 / 該当なし.", "手引き 5.2(14)1）：主たる治験・拡大治験・該当なし のいずれかを選びます。")}>
              <select className="sel" value={draft.applicExpandedAccess ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicExpandedAccess = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{TRIAL_POSITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            </Field>}
          </FormBlock>

          <FormBlock el="INFOGLOBALCLINTRIAL">
            {show("cr_isglobal") && <Field label={ofl("国際共同治験")} mark={mk("cr_isglobal")}><select className="sel" value={draft.isGlobal ? "1" : "0"} disabled={!editable} onChange={(e) => set((n) => (n.isGlobal = e.target.value === "1"))}>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={String(o.value)}>{o.label}</option>)}</select></Field>}
            {draft.isGlobal && show("cr_globalcontents") && <Field label={ofl("国際共同治験の内容")} mark={mk("cr_globalcontents")} wide><textarea className="ta" value={draft.globalContents ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.globalContents = e.target.value))} placeholder={t("Participating countries, total planned subjects, domestic share, etc.", "参加国・全体予定被験者数・本邦割合 等")} /></Field>}
          </FormBlock>

          <FormBlock el="INFOCLINTRIALINCLUDINGGENETEST" cols="1">
            {show("cr_genetest") && <Field label={ofl("ゲノム検査等を含む治験")} mark={mk("cr_genetest")}><select className="sel" value={draft.applicGeneTest ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicGeneTest = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
          </FormBlock>

          <FormBlock el="INFOPRODUSINGMDCLINTRIAL" cols="1">
            {show("cr_microdose") && <Field label={ofl("マイクロドーズ臨床試験")} mark={mk("cr_microdose")}><select className="sel" value={draft.applicMicrodose ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicMicrodose = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
          </FormBlock>

          <FormBlock el="INFOCOMBEQUIPMENT">
            {show("cr_combequipment") && <Field label={ofl("併用する機械器具等の記載")} mark={mk("cr_combequipment")}><select className="sel" value={draft.applicCombEquipment ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.applicCombEquipment = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>}
            {draft.applicCombEquipment === 1 && show("cr_combequipmentcontents") && <Field label={ofl("併用する機械器具等 内容")} mark={mk("cr_combequipmentcontents")} hint={t("Guide 5.2(14)5): class, generic name, class classification, whatever else identifies the device, and the quantity.", "手引き 5.2(14)5）：治験機器の類別・一般的名称・クラス分類・特定に必要な事項・数量を入力します。")} wide><textarea className="ta" value={draft.combEquipmentContents ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.combEquipmentContents = e.target.value))} /></Field>}
          </FormBlock>

          {show("cr_othercommentsprotocol") && (
            <div className="fblock-b one" style={{ marginTop: "18px" }}>
              <Field label={ofl("その他コメント（治験計画書）")} mark={mk("cr_othercommentsprotocol")} wide><textarea className="ta" value={draft.otherCommentsProtocol ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.otherCommentsProtocol = e.target.value))} /></Field>
            </div>
          )}
        </Section>
      </>)}

      {/* ===== 備考・添付・届出者タブ（届書 2.9〜2.12）===== */}
      {activeTab === "notes" && (<>
      <Section title={xsdTitle("INFONOTE")}
        sub={t("The tail of the main-drug block: remarks, attached documents, the notifier and the foreign sponsor.", "「主たる被験薬に関する届出事項」の末尾（備考・届書添付資料・治験届出者・海外依頼者）です。")}>
        {show("cr_remarks") && (
          <FormBlock el="REMARKS" cols="1">
            <Field label={ofl("備考（通信欄）")} mark={mk("cr_remarks")} wide><textarea className="ta" value={draft.remarks ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.remarks = e.target.value))} placeholder={draft.notifType === "devDiscontinuation" ? "開発中止届では実質必須（中止の経緯・以降の対応等）" : ""} /></Field>
          </FormBlock>
        )}

        {/* 届書添付資料（2.10）。届書では備考（2.9）と治験届出者（2.11）の間。
            中の「資料名情報」（2.10.1）が実際の資料の並び。 */}
        {draft.notifType !== "devDiscontinuation" && (
          <FormBlock el="DOCATTACHEDNOTE" cols="1"
            note={t("Guide 5.2(16): only the document name is printed on the form (type and status are operational). Files live in SharePoint (demo uses pseudo paths).", "手引き 5.2(16)：届書に出るのは資料名だけです（資料種別・状態は運用項目）。実体はSharePoint（デモは擬似パス）。")}>
            <FormBlock el="INFONAMEDOCUMENTS"
              right={editable ? <Btn small onClick={() => set((n) => n.attachments.push({ id: `att-${Math.random().toString(36).slice(2, 7)}`, docType: options(SET.docType)[0].value, docName: "", spReference: "", hasBookmarks: false, hasText: false, attachStatus: ATTACH_STATUS.checking }))}>{Icon.plus} {t("Add", "追加")}</Btn> : undefined}>
              {draft.attachments.length === 0 ? <div className="rt-empty">{t("No attachments.", "添付資料はありません。")}</div> : (
                <div className="row-table">
                  <div className="rt-head rt-att"><span>{ofl("資料種別")}</span><span>{ofl("資料名")}</span><span>{ofl("添付状態")}</span><span /></div>
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
            </FormBlock>
            {/* 届書添付資料の備考。手引き 5.2(16) が初回ヒト投与時の記載を求めている欄 */}
            <Field label={ofl("届書添付資料の備考")}
              hint={t("Guide 5.2(16): for a first-in-human drug, state that the final non-clinical safety report is submitted — or why it is not.", "手引き 5.2(16)：初めてヒトに投与する薬物では、非臨床安全性試験の最終報告書を提出する旨（提出しない場合はその理由）を記載します。")} wide>
              <textarea className="ta" value={draft.attachmentRemark ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.attachmentRemark = e.target.value))} />
            </Field>
          </FormBlock>
        )}

        {/* 治験届出者に関する情報（届出者はマスタから選ぶので他は参照表示） */}
        <FormBlock el="INFOPERSONFILLNOTE"
          note={t("Selected from the master; the printed values come from it.", "マスタから選択します。届書に出るのは選択した届出者の登録内容です。")}>
          <Field label={ofl("届出者の名称")} mark="always"><select className="sel" value={draft.sponsorId} disabled={!editable} onChange={(e) => set((n) => (n.sponsorId = e.target.value))}>{activeSponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          {sponsor && <Field label={ofl("治験届出者の種別")}><input className="tin" value={sponsor.sponsorType ?? ""} disabled /></Field>}
          {sponsor && <Field label={ofl("届出者の代表者氏名")}><input className="tin" value={sponsor.repName} disabled /></Field>}
          {sponsor && <Field label={ofl("届出者所在地1")}><input className="tin" value={sponsor.address1} disabled /></Field>}
          {sponsor && <Field label={ofl("届出者所在地2")}><input className="tin" value={sponsor.address2} disabled /></Field>}
          {sponsor && <Field label={ofl("届出者業者コード")} hint={t(`Guide 5.2(17): ${MANUFACTURER_CODE_DIGITS} half-width digits.`, `手引き 5.2(17)：業者コードは${MANUFACTURER_CODE_DIGITS}桁。`)}><input className="tin" value={sponsor.manufacturerCode} disabled /></Field>}
        </FormBlock>

        {sponsor && (
          <FormBlock el="INFOPERSONASSIGNNOTE">
            <Field label={ofl("担当者の氏名")}><input className="tin" value={sponsor.contactName} disabled /></Field>
            <Field label={ofl("担当者の所属")}><input className="tin" value={sponsor.contactTitle} disabled /></Field>
            <Field label={ofl("担当者電話番号")}><input className="tin" value={sponsor.telNo} disabled /></Field>
            <Field label={ofl("担当者FAX番号又はメールアドレス")}><input className="tin" value={sponsor.faxOrMail} disabled /></Field>
          </FormBlock>
        )}

        {/* 海外依頼者、外国製造業者（該当時のみ・本デモは単数入力） */}
        <FormBlock el="INFOFOREIGNMANUFACTURER"
          note={t("Guide 5.2(18): name and address in Japanese and in the foreign language. 海外依頼者 applies when the notifier is an in-country caretaker; 外国製造業者 applies when the main drug is imported. List the 海外依頼者 first when there are several.", "手引き 5.2(18)：氏名・住所を邦文及び英文で入力します。「海外依頼者」は届出者が治験国内管理人である場合、「外国製造業者」は主たる被験薬を海外から輸入する場合。複数ある場合は海外依頼者を一番上に記載します（本デモは単数入力）。")}>
          <Field label={ofl("海外依頼者 名称（邦文）")}><input className="tin" value={draft.foreignName ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignName = e.target.value))} /></Field>
          <Field label={ofl("海外依頼者 氏名（邦文）")}><input className="tin" value={draft.foreignRepName ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignRepName = e.target.value))} /></Field>
          <Field label={ofl("海外依頼者 所在地1（邦文）")}><input className="tin" value={draft.foreignAddress1 ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignAddress1 = e.target.value))} /></Field>
          <Field label={ofl("海外依頼者 所在地2（邦文）")}><input className="tin" value={draft.foreignAddress2 ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignAddress2 = e.target.value))} /></Field>
          <Field label={ofl("海外依頼者 名称（外国文）")}><input className="tin" value={draft.foreignNameFrgn ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignNameFrgn = e.target.value))} /></Field>
          <Field label={ofl("海外依頼者 氏名（外国文）")}><input className="tin" value={draft.foreignRepNameFrgn ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignRepNameFrgn = e.target.value))} /></Field>
          <Field label={ofl("海外依頼者 所在地1（外国文）")}><input className="tin" value={draft.foreignAddress1Frgn ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignAddress1Frgn = e.target.value))} /></Field>
          <Field label={ofl("海外依頼者 所在地2（外国文）")}><input className="tin" value={draft.foreignAddress2Frgn ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.foreignAddress2Frgn = e.target.value))} /></Field>
        </FormBlock>

      </Section>

      </>)}

      {/* ===== その他治験使用薬タブ（届書 3）=====
          主たる被験薬は届書 2 の中なので別タブ（主たる被験薬）にしてある。 */}
      {activeTab === "drugs" && (
        <Section title={xsdTitle("INFOCOMBINATION")}
          sub={t("Study drugs other than the main investigational drug. Expand a row for all fields.", "主たる被験薬以外の治験使用薬です。行を展開すると全項目を入力できます。")}
          right={editable ? <Btn kind="p" small onClick={addStudyDrug}>{Icon.plus} {t("Add drug", "薬を追加")}</Btn> : undefined}>
          {otherDrugs.length === 0 && <div className="rt-empty">{t("None. Add a control drug or a concomitant drug when the trial uses one.", "ありません。対照薬・併用薬などがある場合に追加してください。")}</div>}
          {otherDrugs.map((d) => (
            <StudyDrugCard key={d.id} drug={d} editable={editable} onField={(fn) => setDrug(d.id, fn)} onRemove={() => rmStudyDrug(d.id)} codes={db.codes} />
          ))}
        </Section>
      )}

      {/* ===== 実施医療機関タブ（医師ロスター・数量） ===== */}
      {activeTab === "sites" && (
        <Section title={xsdTitle("INFOMEDICALINSTITUT")} sub={t("Doctors are edited as a roster; the server generates event rows with movement type.", "医師はロスター操作で編集。保存時に異動区分つきのイベント行が生成されます。")} right={editable ? <Btn kind="p" small onClick={addSite}>{Icon.plus} {t("Add site", "施設を追加")}</Btn> : undefined}>
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
          {/* 脚注は施設ごとではなく実施医療機関情報の末尾に1つ出る */}
          {show("cr_footnote") && (
            <div className="fblock-b one">
              <Field label={ofl("脚注")} hint={t("Guide 5.4(10): items common to every site, e.g. the allocation quantity per set. Some GCP systems cap this at 512 full-width / 1024 half-width characters.", "手引き 5.4(10)：1組当たりの割付数量など、すべての実施医療機関に共通の事項を入力します。GCP業務支援システムによっては全角512／半角1024文字の制限があります。")} mark={mk("cr_footnote")} wide><textarea className="ta" value={draft.footnote ?? ""} disabled={!editable} onChange={(e) => set((n) => (n.footnote = e.target.value))} /></Field>
            </div>
          )}
        </Section>
      )}

      {/* ===== 参照・添付・照会タブ ===== */}
      {activeTab === "refs" && (<>

      {draft.notifType !== "devDiscontinuation" && (
        <Section title={xsdTitle("INFOREFCLINTRIALPLANNOTER")} sub={t("Other CTN filings referenced by this one. Column names are the official item names.", "この届が参照する治験届出情報。列名は届書の項目名です。")} right={editable ? <Btn small onClick={addReference}>{Icon.plus} {t("Add", "追加")}</Btn> : undefined}>
          {draft.references.length === 0 ? <div className="rt-empty">{t("No references.", "参照はありません。")}</div> : (
            <div className="row-table">
              <div className="rt-head rt-ref"><span>{ofl("医薬品等の別（参照）")}</span><span>{ofl("参照成分記号")}</span><span>{ofl("届出回数（参照）")}</span><span>{ofl("参照の区分")}</span><span>{ofl("参照の詳細")}</span><span /></div>
              {draft.references.map((r) => (
                <div key={r.id} className="rt-row rt-ref">
                  <span><select className="sel sel-sm" value={r.refCategory} disabled={!editable} onChange={(e) => setRef(r.id, (x) => (x.refCategory = e.target.value))}>{options(SET.targetCategory).map((o) => <option key={o.value} value={o.label}>{o.label}</option>)}</select></span>
                  <span><input className="tin tin-sm" value={r.refCode} disabled={!editable} onChange={(e) => setRef(r.id, (x) => (x.refCode = e.target.value))} /></span>
                  <span><input className="tin tin-sm" value={r.refCount} disabled={!editable} onChange={(e) => setRef(r.id, (x) => (x.refCount = e.target.value))} /></span>
                  {/* 手引き 5.5：参照の区分は「1」又は「2」を半角数字で入力する */}
                  <span><select className="sel sel-sm" value={r.refType} disabled={!editable} onChange={(e) => setRef(r.id, (x) => (x.refType = e.target.value))}><option value="">—</option>{REF_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select></span>
                  <span><input className="tin tin-sm" value={r.refContents} disabled={!editable} onChange={(e) => setRef(r.id, (x) => (x.refContents = e.target.value))} /></span>
                  <span>{editable && <button className="icon-btn danger" onClick={() => rmReference(r.id)}>{Icon.trash}</button>}</span>
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
  // 剤形コードは42件あり、手引きの表も「経口投与する製剤」などの見出しで
  // 区切られている。同じまとまりで出さないと目的のコードを探せない。
  const groups = [...new Set(list.map((c) => c.group ?? ""))];
  const grouped = groups.length > 1 || groups[0] !== "";
  return (
    <select className="sel" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      <option value="">—</option>
      {grouped
        ? groups.map((g) => (
            <optgroup key={g} label={g || t("(uncategorised)", "（分類なし）")}>
              {list.filter((c) => (c.group ?? "") === g).map((c) => <option key={c.id} value={c.code}>{c.code} {c.name}</option>)}
            </optgroup>
          ))
        : list.map((c) => <option key={c.id} value={c.code}>{c.code} {c.name}</option>)}
    </select>
  );
}

function StudyDrugCard({ drug, editable, onField, onRemove, codes }: { drug: StudyDrug; editable: boolean; onField: (fn: (d: StudyDrug) => void) => void; onRemove: () => void; codes: CodeItem[] }) {
  const { t } = useLang();
  const ofl = oflWith(t);
  const [open, setOpen] = useState(false);
  const isMain = drug.drugRole === DRUG_ROLE.main;
  // 主たる被験薬とその他治験使用薬は届書での出力先がまったく別のブロックになる。
  // 画面は同じ部品を使い回すので、ラベルのキーとブロックの要素名をここで切り替える。
  //   主 … 主たる被験薬に関する届出事項（INFONOTE 配下）
  //   従 … 治験使用薬…（主たる被験薬を除く。）の届出事項（COMB_INFONOTE 配下）
  const dk = (key: string) => (isMain ? key : `${key}（薬別）`);
  const gb = (mainEl: string, combEl: string) => (isMain ? mainEl : combEl);
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
          {/* 主従の切り替えは届書の項目ではなく、出力先ブロックを決める入力。
              出力先そのものは一覧側の見出し（2 / 3）が示すのでここには書かない */}
          <div className="fblock" style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>
            <div className="fblock-b">
              <Field label={ofl("主従区分")} hint={ofHint("主従区分")} mark="always"><select className="sel" value={drug.drugRole} disabled={!editable} onChange={(e) => onField((d) => (d.drugRole = Number(e.target.value)))}>{options(SET.drugRole).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              {isMain && <Field label={t("Name (management only)", "治験薬名称（管理用）")} hint={t("The main drug is identified on the form by its compound code; this name is for the screen.", "主たる被験薬は届書では治験成分記号で特定します。この名称は画面上の管理用です。")} mark="always"><input className="tin" value={drug.drugName} disabled={!editable} onChange={(e) => onField((d) => (d.drugName = e.target.value))} /></Field>}
            </div>
          </div>

          {/* ---- その他治験使用薬だけの項目（記号・名称等／区分／承認状況） ---- */}
          {!isMain && (<>
            <div className="fblock-b">
              <Field label={ofl("医薬品等の別（薬別）")} mark="conditional"><select className="sel" value={drug.productCategory ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.productCategory = e.target.value ? Number(e.target.value) : undefined))}><option value="">—</option>{options(SET.targetCategory).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              <Field label={ofl("国内における承認状況")} mark="conditional"
                hint={t("Guide 5.3(4): 未承認 when the active ingredient is not approved in Japan (including an overseas-approved reference biologic), 適応外 when approved but used off-label.", "手引き 5.3(4)：有効成分が国内未承認なら「未承認」（海外承認の先行バイオ医薬品を対照薬に用いる場合も未承認）、国内既承認だが適応外の使用なら「適応外」。")}>
                <select className="sel" value={drug.applicationStatus ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.applicationStatus = e.target.value || undefined))}>
                  <option value="">—</option>
                  {APPROVAL_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>

            <FormBlock el="INFOCOMBINATIONID">
              <Field label={ofl("治験薬名称（薬別）")} mark="always"><input className="tin" value={drug.drugName} disabled={!editable} onChange={(e) => onField((d) => (d.drugName = e.target.value))} /></Field>
              <Field label={ofl("記号・名称等の種類")} mark="conditional"
                hint={t("Guide 5.3(2): 被験薬 → compound code; other study drugs → generic name (JAN, else INN); devices/products → identification code.", "手引き 5.3(2)：被験薬は治験成分記号、被験薬以外の治験使用薬は一般的名称（JAN、無ければINN）、機器・製品相当は治験識別記号。")}>
                <select className="sel" value={drug.idType ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.idType = e.target.value || undefined))}>
                  <option value="">—</option>
                  {ID_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              {/* 「その他」を選んだときだけ詳述を入力する（手引き 5.3(2)） */}
              {drug.idType === "その他" && <Field label={ofl("記号・名称等の種類 詳述")} mark="conditional"><input className="tin" value={drug.idTypeDetail ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.idTypeDetail = e.target.value))} /></Field>}
            </FormBlock>

            <FormBlock el="INFOCOMBINATIONCATEGORY">
              <Field label={ofl("区別")} mark="conditional"
                hint={t("Guide 5.3(3): when several apply, pick in the order 被験薬 > 対照薬 > 併用薬 > レスキュー薬 > その他. Devices/products map onto the drug categories.", "手引き 5.3(3)：該当が複数ある場合は 被験薬＞対照薬＞併用薬＞レスキュー薬＞その他 の順で選びます。機器・製品相当は対応する薬の区分を選びます。")}><select className="sel" value={drug.combCategory ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.combCategory = e.target.value ? Number(e.target.value) : undefined))}><option value="">—</option>{options(SET.combCategory).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              {drug.combCategory === COMB.other && <Field label={ofl("区別の詳述")}><input className="tin" value={drug.combCategoryOther ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.combCategoryOther = e.target.value))} /></Field>}
            </FormBlock>

            <FormBlock el="COMB_INFONOTE"
              note={t("Guide 5.3(5): follow the main drug's method. For study drugs that are not the investigational drug, filling only 成分及び分量情報 and leaving the rest blank is acceptable.", "手引き 5.3(5)：主たる被験薬の記載方法に倣います。被験薬以外の治験使用薬は「成分及び分量情報」のみを記載し、その他を空欄とすることでも差し支えありません。")}>
              <Field label={ofl("30日調査対応被験薬区分（薬別）")}
                hint={t("Guide 5.3(5): follow the main investigational drug. Same 30-day category even when the route differs.", "手引き 5.3(5)：主たる被験薬の記載方法に倣います。投与経路が異なる場合も同じ区分とするようPMDAの指示例があります。")}><select className="sel" value={drug.drugSubj30dayReview ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugSubj30dayReview = e.target.value ? Number(e.target.value) : undefined))}><option value="">—</option>{SUBJ30_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              <Field label={ofl("副作用報告の有無")} mark="conditional"
                hint={t("Guide 5.3(5): enter 有.", "手引き 5.3(5)：「有」を入力すること。")}>
                <select className="sel" value={drug.adrReport ?? ADR_REPORT_DEFAULT} disabled={!editable} onChange={(e) => onField((d) => (d.adrReport = e.target.value))}>
                  {ADR_REPORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label={ofl("その他備考（薬別）")} wide><textarea className="ta" value={drug.drugRemarks ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugRemarks = e.target.value))} placeholder={t("e.g. imported product note", "例：海外輸入品の記載 等")} /></Field>
            </FormBlock>
          </>)}

          {/* ---- 製造所又は営業所（治験薬提供者） ---- */}
          <FormBlock el={gb("INFONAMEADDRESSMANUFACTPLANT", "COMB_INFONAMEADDRESSMANUFACTPLANT")}
            note={t("This demo takes a single entry.", "本デモは単数入力です（届書は繰り返し可）。")}>
            <Field label={ofl(dk("製造所名称"))} mark="always" unconfirmed unconfirmedNote="届書はこの枠を繰り返せますが、本デモは単数入力です（複数ある場合の入力・出力は未対応）。項目の記載方法は手引きと一致しています。"
              hint={t("Guide 5.2(7): the plant when manufactured, the office when imported.", "手引き 5.2(7)：製造の場合は製造所、輸入の場合は営業所の名称。")}>
              <input className="tin" value={drug.plantName} disabled={!editable} onChange={(e) => onField((d) => (d.plantName = e.target.value))} />
            </Field>
            <Field label={ofl(dk("製造所業者コード"))} mark="always"
              hint={t(`Guide 5.2(7): ${MANUFACTURER_CODE_DIGITS} half-width digits. No code: last 3 digits “999” when licensed, otherwise “999999999”.`, `手引き 5.2(7)：半角数字${MANUFACTURER_CODE_DIGITS}桁。コードが付されていない場所で製造する場合は、薬機法上の許可があれば下3桁を「999」、許可が無ければ「999999999」。`)}>
              <input className="tin" value={drug.plantCode} disabled={!editable} onChange={(e) => onField((d) => (d.plantCode = e.target.value))} />
            </Field>
            <Field label={ofl(dk("製造所所在地1"))} mark="always"><input className="tin" value={drug.plantAddress1} disabled={!editable} onChange={(e) => onField((d) => (d.plantAddress1 = e.target.value))} /></Field>
            <Field label={ofl(dk("製造所所在地2"))} mark="always"
              hint={t("Guide 5.2(7) case note: use this when address 1 exceeds the character limit, or for a building name.", "手引き 5.2(7) 事例：所在地1の文字数制限を超える場合やビル名等はこちらに入力します。")}>
              <input className="tin" value={drug.plantAddress2} disabled={!editable} onChange={(e) => onField((d) => (d.plantAddress2 = e.target.value))} />
            </Field>
          </FormBlock>

          {/* ---- 成分及び分量情報（＋剤形コード情報） ---- */}
          <FormBlock el={gb("INFOINGREDIENTQUANTITY", "COMB_INFOINGREDIENTQUANTITY")} cols="1">
            <Field label={ofl(dk("成分及び分量"))} mark="always"
              hint={t("Guide 5.2(8): generic name (JAN or INN; the compound code when no generic name yet), and the content of the active ingredient per dosage unit.", "手引き 5.2(8)：成分名は一般名（JAN又はINN。未定なら治験成分記号）、分量は剤形当たりの有効成分の含量が分かるように入力します。")} wide><textarea className="ta" value={drug.ingredients} disabled={!editable} onChange={(e) => onField((d) => (d.ingredients = e.target.value))} /></Field>
          </FormBlock>
          <FormBlock el={gb("INFODOSAGEFORMCODE", "COMB_INFODOSAGEFORMCODE")} cols="1"
            note={t("Guide 5.2(8): the first 2 alphanumerics of the 4-digit JP code, half-width.", "手引き 5.2(8)：日本薬局方が定める剤形コード（4桁）のうち頭の英数字2桁を半角で入力します。")}>
            <Field label={ofl(dk("剤形コード"))}>
              <CodePicker kind="dosageForm" codes={codes} value={drug.dosageFormCode ?? ""} disabled={!editable}
                onChange={(v) => onField((d) => (d.dosageFormCode = v))} />
            </Field>
          </FormBlock>

          {/* ---- 製造方法（入れ物要素の無い単独の欄） ---- */}
          <div className="fblock-b one" style={{ marginTop: "18px" }}>
            <Field label={ofl(dk("製造方法"))} hint={t("Guide 5.2(9): make clear whether the drug substance is chemically synthesised / extracted / cultured / recombinant; state the dosage form; state manufacture vs import (for import, the country, manufacturer and the brand name there).", "手引き 5.2(9)：原薬は化学合成・抽出・培養・遺伝子組換え等の区別、製剤は剤形を明確に。製造／輸入の別を入力し、輸入の場合は原薬か製剤か、輸入先の国名・製造業者名・輸入先での販売名も入力します。")} wide><textarea className="ta" value={drug.manufactMethod ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.manufactMethod = e.target.value))} /></Field>
          </div>

          {/* ---- 予定される効能又は効果情報 ---- */}
          <FormBlock el={gb("INFOINTENDINDICATIONSEFFECTS", "COMB_INFOINTENDINDICATIONSEFFECTS")} cols="1">
            <Field label={ofl(dk("予定される効能効果"))} mark="always" wide><textarea className="ta" value={drug.intendEffects} disabled={!editable} onChange={(e) => onField((d) => (d.intendEffects = e.target.value))} /></Field>
            <Field label={ofl(dk("薬効分類番号"))} mark="always"
              hint={t(`Guide 5.2(10): ${EFFICACY_CLASS_DIGITS} half-width digits. When it spans two or more, the main one will do.`, `手引き 5.2(10)：半角数字${EFFICACY_CLASS_DIGITS}桁。2つ以上に跨る場合は主たる薬効分類番号で差し支えありません。`)}>
              <CodePicker kind="therapeuticClass" codes={codes} value={drug.efficacyClassCode ?? ""} disabled={!editable}
                onChange={(v) => onField((d) => (d.efficacyClassCode = v))} />
            </Field>
          </FormBlock>

          {/* ---- 予定される用法及び用量情報（＋投与経路コード情報） ---- */}
          <FormBlock el={gb("INFOINTENDDOSAGEADMIN", "COMB_INFOINTENDDOSAGEADMIN")} cols="1">
            <Field label={ofl(dk("予定される用法用量"))} mark="always" wide><textarea className="ta" value={drug.intendDosage} disabled={!editable} onChange={(e) => onField((d) => (d.intendDosage = e.target.value))} /></Field>
          </FormBlock>
          {/* 投与経路コードは届書では「投与経路コード情報」の中。同じ値が
              治験計画の概要側の投与経路コード情報にも出力される */}
          <FormBlock el={gb("INFOADMINROUTECODE", "COMB_INFOADMINROUTECODE")}
            under={gb("INFOINTENDDOSAGEADMIN", "COMB_INFOINTENDDOSAGEADMIN")} cols="1"
            note={t("Guide 5.2(11): 2 half-width digits.", "手引き 5.2(11)：投与経路コード情報（2桁）は半角数字で入力します。")}>
            <Field label={ofl(dk("投与経路コード"))}>
              <CodePicker kind="adminRoute" codes={codes} value={drug.adminRouteCode ?? ""} disabled={!editable}
                onChange={(v) => onField((d) => (d.adminRouteCode = v))} />
            </Field>
          </FormBlock>

          {/* ---- 治験計画の概要（薬ごとの用法及び用量／対象疾患）----
              主たる被験薬の用法及び用量は届書では「治験計画の概要」に出るので、
              入力もそちらのタブに置いてある（ここには出さない） ---- */}
          {!isMain && (
          <FormBlock el={gb("INFODOSAGEADMIN", "COMB_INFODOSAGEADMIN")} cols="1">
            {!isMain && <Field label={ofl("対象疾患（薬別）")}
              hint={t("Guide 5.2(12)6): the specific disease name. Say so when healthy volunteers are the subjects.", "手引き 5.2(12)6）：具体的な疾患名を入力します。健康人を対象とする場合はその旨を入力します。")}><input className="tin" value={drug.drugTargetDisease ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugTargetDisease = e.target.value))} /></Field>}
            <Field label={ofl(dk("用法及び用量"))} mark="always"
              hint={t("Guide 5.2(12)7): the dosage and administration actually used, in detail.", "手引き 5.2(12)7）：用いられる用法及び用量を詳細に入力します。")} wide><textarea className="ta" value={drug.dosageAdmin ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.dosageAdmin = e.target.value))} /></Field>
          </FormBlock>
          )}

          {/* ---- その他の情報（薬別のみ。主たる被験薬は「治験計画の概要」タブ側） ---- */}
          {!isMain && (<>
            <FormBlock el="COMB_INFOCLINTRIALWITHDRUGCARTAGENA">
              <Field label={ofl("カルタヘナ法 該当有無（薬別）")}><select className="sel" value={drug.drugApplicCartagena ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugApplicCartagena = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              {drug.drugApplicCartagena === 1 && <Field label={ofl("カルタヘナ法 詳細（薬別）")} wide><textarea className="ta" value={drug.drugApplicCartagenaDetail ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugApplicCartagenaDetail = e.target.value))} /></Field>}
            </FormBlock>
            <FormBlock el="COMB_INFOCLINTRIALWITHBIOLOGICALPROD" cols="1">
              <Field label={ofl("生物由来製品 該当有無（薬別）")}><select className="sel" value={drug.drugApplicBiological ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugApplicBiological = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
            </FormBlock>
            <FormBlock el="COMB_INFORESEARCHFORCODX" cols="1">
              <Field label={ofl("コンパニオン診断薬等の開発（薬別）")}><select className="sel" value={drug.drugApplicCodx ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugApplicCodx = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
            </FormBlock>
            <FormBlock el="COMB_INFOCLINTRIALFORCOMBINATIONPROD" cols="1">
              <Field label={ofl("コンビネーション製品に関する治験（薬別）")}><select className="sel" value={drug.drugApplicCombinationProd ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugApplicCombinationProd = e.target.value === "" ? undefined : Number(e.target.value)))}><option value="">—</option>{APPLICABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
            </FormBlock>
            <div className="fblock-b one" style={{ marginTop: "18px" }}>
              <Field label={ofl("その他コメント（薬別）")} hint={ofHint("その他コメント（薬別）")} wide><textarea className="ta" value={drug.drugOtherComments ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.drugOtherComments = e.target.value))} /></Field>
            </div>

            {/* ---- 海外依頼者、外国製造業者（薬別・該当時のみ・本デモは単数） ---- */}
            <FormBlock el="COMB_INFOFOREIGNMANUFACTURER"
              note={t("Only when applicable. This demo takes a single entry.", "該当する場合のみ入力します（本デモは単数入力）。")}>
              <Field label={ofl("海外依頼者 名称（邦文・薬別）")}><input className="tin" value={drug.foreignName ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignName = e.target.value))} /></Field>
              <Field label={ofl("海外依頼者 氏名（邦文・薬別）")}><input className="tin" value={drug.foreignRepName ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignRepName = e.target.value))} /></Field>
              <Field label={ofl("海外依頼者 所在地1（邦文・薬別）")}><input className="tin" value={drug.foreignAddress1 ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignAddress1 = e.target.value))} /></Field>
              <Field label={ofl("海外依頼者 所在地2（邦文・薬別）")}><input className="tin" value={drug.foreignAddress2 ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignAddress2 = e.target.value))} /></Field>
              <Field label={ofl("海外依頼者 名称（外国文・薬別）")}><input className="tin" value={drug.foreignNameFrgn ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignNameFrgn = e.target.value))} /></Field>
              <Field label={ofl("海外依頼者 氏名（外国文・薬別）")}><input className="tin" value={drug.foreignRepNameFrgn ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignRepNameFrgn = e.target.value))} /></Field>
              <Field label={ofl("海外依頼者 所在地1（外国文・薬別）")}><input className="tin" value={drug.foreignAddress1Frgn ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignAddress1Frgn = e.target.value))} /></Field>
              <Field label={ofl("海外依頼者 所在地2（外国文・薬別）")}><input className="tin" value={drug.foreignAddress2Frgn ?? ""} disabled={!editable} onChange={(e) => onField((d) => (d.foreignAddress2Frgn = e.target.value))} /></Field>
            </FormBlock>
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
      {/* 実施医療機関ごとの事項。ブロックの区切りは届書（公式XSD）と同じ */}
      <div className="sitecard-b">
        <FormBlock el="INFOEACHMEDICALINSTITUT"
          note={t("Name / address / tel come from the institution master.", "名称・所在地・電話番号は医療機関マスタの登録内容が出力されます。")}>
          <Field label={ofl("実施診療科")} mark="always">
            {/* 医療機関マスタの診療科から選ぶ（表記ブレ防止・R-19）。候補に無い科は直接入力もできる */}
            <input className="tin tin-sm" list={`depts-${site.id}`} value={site.department} disabled={!editable}
              onChange={(e) => onField((s) => (s.department = e.target.value))} />
            <datalist id={`depts-${site.id}`}>
              {(activeInstitutions.find((i) => i.id === site.institutionId)?.departments ?? []).map((d) => <option key={d} value={d} />)}
            </datalist>
          </Field>
          <Field label={ofl("予定被験者数")} mark="always"
            hint={t("Guide 5.4(5): per site, including both the drug arm and the control arm.", "手引き 5.4(5)：実施医療機関ごとの予定被験者数（被験薬群及び対照薬群を含む）。")}><input type="number" className="tin tin-sm" value={site.plannedSubjects} disabled={!editable} onChange={(e) => onField((s) => (s.plannedSubjects = Number(e.target.value)))} /></Field>
          {terminal && <Field label={ofl("実施医療機関被験者数")} mark="always"
            hint={t("Guide 5.4(6): blank on the plan notification; filled on the completion / discontinuation notification.", "手引き 5.4(6)：治験計画届では空欄。終了届・中止届で入力します。")}><input type="number" className="tin tin-sm" value={site.enrolledSubjects ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.enrolledSubjects = Number(e.target.value)))} /></Field>}
          <Field label={ofl("その他")}
            hint={t("Guide 5.4(9): anything to note about this particular site.", "手引き 5.4(9)：各実施医療機関に関する特記事項があれば入力します。")}><input className="tin tin-sm" value={site.others ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.others = e.target.value))} /></Field>
        </FormBlock>

        <FormBlock el="INFOSMOINMEDINST"
          note={t("Only when an SMO is used. This demo takes a single entry.", "SMOありの場合のみ入力します（本デモは単数入力）。")}>
          <Field label={ofl("SMO名称")}><input className="tin tin-sm" value={site.smoName ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.smoName = e.target.value))} /></Field>
          <Field label={ofl("SMO委託業務範囲")}><input className="tin tin-sm" value={site.smoService ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.smoService = e.target.value))} /></Field>
          <Field label={ofl("SMO住所1")}><input className="tin tin-sm" value={site.smoAddress1 ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.smoAddress1 = e.target.value))} /></Field>
          <Field label={ofl("SMO住所2")}><input className="tin tin-sm" value={site.smoAddress2 ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.smoAddress2 = e.target.value))} /></Field>
        </FormBlock>

        <FormBlock el="INFOIRB"
          note={t("Guide 5.4(8): entering “院内IRB” is enough for an IRB set up by the head of this site alone (no name/address needed). For a jointly established IRB, give its name and the address of its secretariat.", "手引き 5.4(8)：当該実施医療機関の長が単独で設置した治験審査委員会なら「院内IRB」と入力すれば設置者の名称・所在地は不要。共同設置の場合は委員会の名称と事務局の所在地を入力します。")}>
          <Field label={ofl("IRB")} mark="always"><select className="sel sel-sm" value={site.irbId} disabled={!editable} onChange={(e) => onField((s) => (s.irbId = e.target.value))}><option value="">{t("Select IRB…", "IRBを選択…")}</option>{activeIrbs.map((i) => <option key={i.id} value={i.id}>{i.ownerName}</option>)}</select></Field>
        </FormBlock>

        {/* 届書に出ない運用項目 */}
        <div className="fblock">
          <div className="fblock-h"><span className="fblock-name">{t("Operational items (not printed on the form)", "運用項目（届書には出力されません）")}</span></div>
          <div className="fblock-b">
            <Field label={ofl("CRC")} hint={ofHint("CRC")}><select className="sel sel-sm" value={site.crcStaffId ?? ""} disabled={!editable} onChange={(e) => onField((s) => (s.crcStaffId = e.target.value || undefined))}><option value="">—</option>{activeStaff.filter((st) => st.institutionId === site.institutionId).map((st) => <option key={st.id} value={st.id}>{st.name}（{st.role}）</option>)}</select></Field>
          </div>
        </div>
      </div>
      {/* 医師ロスター。届書では治験責任医師と治験分担医師が別のブロックになる */}
      <div className="roster">
        <div className="fblock" style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>
          <div className="fblock-h">
            <span className="fblock-no">{`${xsdNo("INFOINVESTIGATOR")} / ${xsdNo("INFOSUBINVESTIGATOR")}`}</span>
            <span className="fblock-name">{`${xsdLabel("INFOINVESTIGATOR")}・${xsdLabel("INFOSUBINVESTIGATOR")}`}</span>
            <span className="fblock-rep">繰り返し</span>
          </div>
          <div className="fblock-path">{t("Roster on screen; the form splits it into the two blocks above.", "画面ではロスターで扱い、届書では責任医師・分担医師の2ブロックに分かれて出力されます。")} <span className="muted small">（{inst?.name}）</span></div>
        </div>
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
          <div className="fblock" style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>
            <div className="fblock-h">
              <span className="fblock-no">{xsdNo("INFOQUANTITIESINVESTPRODUCT")}</span>
              <span className="fblock-name">{xsdLabel("INFOQUANTITIESINVESTPRODUCT")}</span>
              <span className="fblock-rep">繰り返し</span>
              {terminal && <UnconfirmedBadge label={t("supply→abrogation required", "交付〜廃棄が必須")} />}
            </div>
            <div className="fblock-path">{t("Guide 5.4(4): planned supply quantity per type (dosage form, content). For a set-based double-blind design you may enter the number of sets and put the breakdown in the footnote.", "手引き 5.4(4)：予定交付（入手）数量を種類（剤形・含量）別に入力します。組単位で割付する二重盲検では組数を入力し、1組当たりの内訳を脚注に示せます。")}</div>
          </div>
          <table className="qty-tbl">
            <thead><tr><th>{ofl("治験使用薬の名称")}</th><th>{ofl("予定交付（入手）数量")}</th>{terminal && <><th>{ofl("交付数量")}</th><th>{ofl("使用数量")}</th><th>{ofl("回収数量")}</th><th>{ofl("廃棄数量")}</th></>}</tr></thead>
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
