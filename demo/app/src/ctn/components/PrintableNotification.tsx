// ============================================================================
// 届書 印刷ビュー（PDF化のためのラスタライズ対象）
// ----------------------------------------------------------------------------
// html2canvas でこの DOM を画像化 → pdf-lib で PDF ページ化する。互換性のため
// スタイルはすべてインライン（プレーンな hex 色）。アプリのテーマ変数に依存しない。
// レイアウトは公式様式の完全再現ではなく「システム生成の届書サマリ」（第一版）。
// ============================================================================
import { forwardRef } from "react";
import type { CtnDb } from "../data/repository";
import type { Notification } from "../types";
import {
  DRUG_ROLE,
  SET,
  label,
  notifTypeName,
  fmtDate,
  APPLICABILITY_OPTIONS,
  SUBJ30_OPTIONS,
} from "../refData";

const C = {
  page: { width: "760px", background: "#ffffff", color: "#111111", padding: "32px 36px", fontFamily: '"Yu Gothic","Hiragino Sans","Noto Sans JP",sans-serif', fontSize: "12px", lineHeight: 1.6, boxSizing: "border-box" as const },
  h1: { fontSize: "18px", fontWeight: 700, textAlign: "center" as const, margin: "0 0 2px" },
  meta: { textAlign: "center" as const, color: "#555555", fontSize: "11px", margin: "0 0 18px" },
  sec: { margin: "0 0 14px", border: "1px solid #cccccc", borderRadius: "4px", overflow: "hidden" as const },
  secH: { background: "#eef2f6", padding: "6px 10px", fontWeight: 700, fontSize: "12.5px", borderBottom: "1px solid #cccccc" },
  row: { display: "flex", borderBottom: "1px solid #eeeeee" },
  k: { width: "220px", padding: "5px 10px", background: "#f7f9fb", color: "#333333", flex: "none" as const, borderRight: "1px solid #eeeeee" },
  v: { padding: "5px 10px", flex: 1, whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const },
  li: { padding: "6px 10px", borderBottom: "1px solid #eeeeee" },
  tag: { display: "inline-block", background: "#eaf3ff", color: "#12467a", borderRadius: "3px", padding: "0 6px", fontSize: "11px", marginRight: "6px" },
  attnH: { background: "#fff7e6", borderColor: "#f0c36d" },
};

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={C.row}>
      <div style={C.k}>{k}</div>
      <div style={C.v}>{v || "—"}</div>
    </div>
  );
}
const applic = (v?: number) => (v == null ? "—" : APPLICABILITY_OPTIONS.find((o) => o.value === v)?.label ?? String(v));

export const PrintableNotification = forwardRef<HTMLDivElement, { n: Notification; db: CtnDb }>(({ n, db }, ref) => {
  const compound = db.compounds.find((c) => c.id === n.compoundId);
  const sponsor = db.sponsors.find((s) => s.id === n.sponsorId);
  const main = n.studyDrugs.find((d) => d.drugRole === DRUG_ROLE.main);
  const others = n.studyDrugs.filter((d) => d.drugRole === DRUG_ROLE.other);

  return (
    <div ref={ref} style={C.page}>
      <h1 style={C.h1}>治験の計画等の届出</h1>
      <div style={C.meta}>
        {n.formVersion ?? "医薬品治験届 令和２年８月改正版"} ／ 届出年月日 {fmtDate(n.noteDate)} ／ {notifTypeName(n.notifType, "ja")}
      </div>

      {/* 治験届出者 */}
      <div style={C.sec}>
        <div style={C.secH}>治験届出者</div>
        <Row k="届出者の名称" v={sponsor?.name} />
        <Row k="代表者の氏名" v={sponsor?.repName} />
        <Row k="所在地" v={[sponsor?.address1, sponsor?.address2].filter(Boolean).join(" ")} />
        <Row k="業者コード" v={sponsor?.manufacturerCode} />
        <Row k="届出担当者" v={sponsor ? `${sponsor.contactName}（${sponsor.contactTitle}） ${sponsor.telNo} / ${sponsor.faxOrMail}` : ""} />
        {(n.foreignName || n.foreignNameFrgn) && (
          <Row k="海外依頼者・外国製造業者" v={`${n.foreignName ?? ""} ${n.foreignRepName ?? ""} ${[n.foreignAddress1, n.foreignAddress2].filter(Boolean).join(" ")}｜${n.foreignNameFrgn ?? ""} ${n.foreignRepNameFrgn ?? ""}`} />
        )}
      </div>

      {/* 治験届出共通事項 */}
      <div style={C.sec}>
        <div style={C.secH}>治験届出共通事項</div>
        <Row k="主たる被験薬の治験成分記号" v={compound?.compoundCode} />
        <Row k="対象区分" v={compound ? label(SET.targetCategory, compound.targetCategory) : ""} />
        <Row k="主たる被験薬の届出回数" v={n.notifType === "devDiscontinuation" ? "00（開発中止届）" : `第${n.filingCount}回`} />
        <Row k="主たる被験薬の初回届出年月日" v={fmtDate(compound?.initNoteDate)} />
        {n.receptNo && <Row k="当該届出受付番号" v={n.receptNo} />}
      </div>

      {/* 主たる被験薬に関する届出事項 */}
      <div style={C.sec}>
        <div style={C.secH}>主たる被験薬に関する届出事項</div>
        <Row k="届出分類" v={notifTypeName(n.notifType, "ja")} />
        {n.changeCount != null && <Row k="変更回数" v={`${n.changeCount}`} />}
        <Row k="届出区分" v={n.kubun != null ? label(SET.kubun, n.kubun) : ""} />
        <Row k="30日調査対応被験薬区分" v={n.subj30dayReview != null ? SUBJ30_OPTIONS.find((o) => o.value === n.subj30dayReview)?.label ?? String(n.subj30dayReview) : "—"} />
        {(n.notifType === "termination" || n.notifType === "devDiscontinuation") && <>
          <Row k="中止年月日" v={fmtDate(n.terminationDate)} />
          <Row k="中止理由" v={n.terminationReason} />
          {n.postTermination && <Row k="その後の対応状況" v={n.postTermination} />}
        </>}
      </div>

      {/* 治験計画の概要 */}
      {n.notifType !== "devDiscontinuation" && (
        <div style={C.sec}>
          <div style={C.secH}>治験計画の概要</div>
          <Row k="実施計画書識別記号" v={n.protocolNo} />
          <Row k="開発の相 / 試験の種類" v={`${n.phase != null ? label(SET.phase, n.phase) : "—"} / ${n.trialType != null ? label(SET.trialType, n.trialType) : "—"}`} />
          <Row k="目的" v={n.objectives} />
          <Row k="主たる被験薬の対象疾患" v={n.targetDisease} />
          <Row k="予定被験者数（被験薬 / 合計）" v={`${n.plannedSubjDrug ?? "—"} / ${n.plannedSubjTotal ?? "—"}`} />
          <Row k="実施期間" v={`${n.periodStart ?? "—"} 〜 ${n.periodEnd ?? "—"}`} />
          <Row k="国際共同治験" v={n.isGlobal ? `該当あり${n.globalContents ? "：" + n.globalContents : ""}` : "該当なし"} />
        </div>
      )}

      {/* 主たる被験薬 */}
      {main && (
        <div style={C.sec}>
          <div style={C.secH}>主たる被験薬</div>
          <Row k="治験薬名称" v={main.drugName} />
          <Row k="製造所（名称／業者コード）" v={`${main.plantName}／${main.plantCode}`} />
          <Row k="成分及び分量" v={main.ingredients} />
          <Row k="予定される効能又は効果 / 薬効分類番号" v={`${main.intendEffects}（${main.efficacyClassCode}）`} />
          <Row k="予定される用法及び用量" v={main.intendDosage} />
          <Row k="剤形コード / 投与経路コード" v={`${main.dosageFormCode ?? "—"} / ${main.adminRouteCode ?? "—"}`} />
        </div>
      )}

      {/* その他治験使用薬 */}
      {others.length > 0 && (
        <div style={C.sec}>
          <div style={C.secH}>その他治験使用薬（{others.length}件）</div>
          {others.map((d, i) => (
            <div key={d.id} style={C.li}>
              <div><span style={C.tag}>#{d.serialNo || i + 1}</span><b>{d.drugName || "（未入力）"}</b>　{d.combCategory != null ? label(SET.combCategory, d.combCategory) : ""}　{d.applicationStatus ?? ""}</div>
              {d.drugRemarks && <div style={{ color: "#555555", marginTop: "2px" }}>備考：{d.drugRemarks}</div>}
            </div>
          ))}
        </div>
      )}

      {/* その他の情報 */}
      {n.notifType !== "devDiscontinuation" && (
        <div style={C.sec}>
          <div style={C.secH}>その他の情報（該当性）</div>
          <Row k="カルタヘナ法 / 生物由来製品" v={`${applic(n.applicCartagena)} / ${applic(n.applicBiological)}`} />
          <Row k="コンパニオン診断薬 / コンビネーション製品" v={`${applic(n.applicCodx)} / ${applic(n.applicCombinationProd)}`} />
          <Row k="ゲノム検査 / マイクロドーズ" v={`${applic(n.applicGeneTest)} / ${applic(n.applicMicrodose)}`} />
          <Row k="臨床試験の位置付け（拡大治験）" v={applic(n.applicExpandedAccess)} />
          <Row k="併用する機械器具等" v={n.applicCombEquipment != null ? `${applic(n.applicCombEquipment)}${n.combEquipmentContents ? "：" + n.combEquipmentContents : ""}` : "—"} />
        </div>
      )}

      {/* 実施医療機関 */}
      {n.sites.length > 0 && (
        <div style={C.sec}>
          <div style={C.secH}>実施医療機関（{n.sites.length}件）</div>
          {n.sites.map((s, i) => {
            const inst = db.institutions.find((x) => x.id === s.institutionId);
            const chief = s.investigators.find((iv) => iv.doctorRole === 100000500);
            return (
              <div key={s.id} style={C.li}>
                <div><span style={C.tag}>#{s.serialNo || i + 1}</span><b>{inst?.name ?? "（未選択）"}</b>　{s.department}　予定被験者数 {s.plannedSubjects}</div>
                {chief && <div style={{ color: "#555555", marginTop: "2px" }}>治験責任医師：{chief.nameFiling}（{chief.pronounce}）</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* 届書添付資料（Packing List等） */}
      <div style={C.sec}>
        <div style={{ ...C.secH, ...C.attnH }}>届書添付資料</div>
        {n.attachments.length === 0 ? (
          <div style={C.li}>添付資料なし</div>
        ) : (
          n.attachments.map((a, i) => (
            <div key={a.id} style={C.li}>
              <span style={C.tag}>#{i + 1}</span>
              <span style={{ color: "#12467a" }}>[{label(SET.docType, a.docType)}]</span>　{a.docName || "（資料名未入力）"}
              {a.docType === 100001208 && <span style={{ color: "#a6651a", marginLeft: "6px" }}>※本PDFに実ファイルを同梱</span>}
            </div>
          ))
        )}
      </div>

      {n.remarks && (
        <div style={C.sec}>
          <div style={C.secH}>備考</div>
          <div style={C.li}>{n.remarks}</div>
        </div>
      )}
      {n.footnote && (
        <div style={C.sec}>
          <div style={C.secH}>脚注</div>
          <div style={C.li}>{n.footnote}</div>
        </div>
      )}
    </div>
  );
});
PrintableNotification.displayName = "PrintableNotification";
