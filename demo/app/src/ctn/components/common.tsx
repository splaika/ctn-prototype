import { Children, type ReactNode } from "react";
import { useLang } from "../../i18n";
import { xsdEntry } from "../xsdLabels";
import { isUnconfirmed } from "../schema";
import { statusName, STATUS_CLASS, notifTypeName, NOTIF_TYPE_SHORT } from "../refData";
import type { NotifTypeKey, StatusKey } from "../types";

// ---- ステータスピル ----
export function StatusPill({ status }: { status: StatusKey }) {
  const { lang } = useLang();
  return <span className={`stpill ${STATUS_CLASS[status]}`}>{statusName(status, lang)}</span>;
}

// ---- 届出種別バッジ ----
export function TypeBadge({ type, full }: { type: NotifTypeKey; full?: boolean }) {
  const { lang } = useLang();
  return <span className={`tybadge ty-${type}`}>{full ? notifTypeName(type, lang) : NOTIF_TYPE_SHORT[type]}</span>;
}

// ---- KPIタイル ----
export function Kpi({ label, value, meta, tone, onClick }: { label: string; value: ReactNode; meta?: string; tone?: "blue" | "amber" | "red" | "green"; onClick?: () => void }) {
  return (
    <div className={`kpi${tone ? ` kpi-${tone}` : ""}${onClick ? " kpi-click" : ""}`} onClick={onClick}>
      <div className="l">{label}</div>
      <div className="v">{value}</div>
      {meta && <div className="m">{meta}</div>}
    </div>
  );
}

// ---- 「要確認」バッジ（設計上の未確定箇所） ----
export function UnconfirmedBadge({ label }: { label?: string }) {
  return (
    <span className="unconf" title="設計上の未確定箇所（本番仕様は手引きと突合が必要）">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
      {label ?? "要確認"}
    </span>
  );
}

// ---- 必須マーク（◎/○/△） ----
export function ReqMark({ mark }: { mark: "always" | "conditional" | "optional" | "na" | "auto" }) {
  if (mark === "na") return null;
  const map: Record<string, [string, string]> = {
    always: ["req-a", "◎"],
    conditional: ["req-c", "○"],
    optional: ["req-o", "△"],
    auto: ["req-auto", "自動"],
  };
  const [cls, sym] = map[mark];
  return <span className={`reqmark ${cls}`}>{sym}</span>;
}

// ---- セクションカード ----
export function Section({ title, sub, right, children, tableSchema, colSchema }: { title: string; sub?: string; right?: ReactNode; children: ReactNode; tableSchema?: string; colSchema?: string }) {
  const unconf = tableSchema && colSchema && isUnconfirmed(tableSchema, colSchema);
  return (
    <div className="sect">
      <div className="sect-h">
        <div>
          <h3>{title}{unconf && <> <UnconfirmedBadge /></>}</h3>
          {sub && <div className="sect-sub">{sub}</div>}
        </div>
        {right}
      </div>
      <div className="sect-b">{children}</div>
    </div>
  );
}

// ---- 届書のブロック ----
/**
 * 入力画面のかたまりを届書の見出しに一致させる。
 *
 * クライアントからの要望（2026-09）:
 *   「できる限り PDF 出力のイメージがつきやすいブロック構造にしてほしい」
 *
 * 届書PDF は項目を上から順に並べた形（＝XSDのツリーをそのまま印字したもの）
 * なので、入力画面も同じ区切り・同じ順序・同じ名前で区切れば、どの欄が届書の
 * どこに出るかが目で追える。ブロック名・階層・見出し番号は XSD から引くので
 * 手で書かない（xsdLabels.ts）。
 *
 * el に入れ物要素名を渡すと見出し番号が付く。cols="1" は1列にする（長文欄用）。
 */
export function FormBlock({
  el, under, note, right, cols = "2", children,
}: {
  el: string;
  /** 同名要素がXSD上の複数箇所にある場合の親要素名 */
  under?: string;
  note?: string;
  right?: ReactNode;
  cols?: "1" | "2";
  /** 省略可。届書にはあるが入力を別タブに置いた欄の案内だけを出す場合に使う */
  children?: ReactNode;
}) {
  const e = xsdEntry(el, under);
  const parents = (e?.path ?? []).slice(0, -1);
  // 届出種別によって中身が全部隠れるブロックがある（例：終了届のゲノム検査等）。
  // 見出しだけが残ると「入力できない空の枠」に見えるので、その場合は出さない。
  // note だけを持つブロック（入力が別タブにある欄の案内）は残す。
  const empty = children !== undefined && Children.toArray(children).length === 0;
  if (empty && !note) return null;
  return (
    <div className="fblock">
      <div className="fblock-h">
        {e?.no && <span className="fblock-no">{e.no}</span>}
        <span className="fblock-name">{e?.label ?? el}</span>
        {e?.repeat && <span className="fblock-rep">繰り返し</span>}
        <div style={{ flex: 1 }} />
        {right}
      </div>
      {parents.length > 0 && <div className="fblock-path">届書：{parents.join(" › ")}</div>}
      {note && <div className="fblock-note">{note}</div>}
      {children && <div className={`fblock-b${cols === "1" ? " one" : ""}`}>{children}</div>}
    </div>
  );
}

// ---- フォーム項目 ----
export function Field({ label, required, mark, unconfirmed, hint, children, wide }: { label: string; required?: boolean; mark?: "always" | "conditional" | "optional" | "na" | "auto"; unconfirmed?: boolean; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`field${wide ? " field-wide" : ""}`}>
      <label>
        {mark && <ReqMark mark={mark} />}
        {label}
        {required && <span className="req-star">*</span>}
        {unconfirmed && <> <UnconfirmedBadge /></>}
      </label>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

// ---- モーダル ----
export function Modal({ title, sub, onClose, children, footer, size = "md" }: { title: string; sub?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  return (
    <div className="modal-scrim on" onClick={onClose}>
      <div className={`modal modal-${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <h3>{title}</h3>
            {sub && <div className="modal-sub">{sub}</div>}
          </div>
          <button className="modal-x" onClick={onClose} aria-label="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Btn({ kind = "g", onClick, children, disabled, small, title, type }: { kind?: "p" | "g" | "danger" | "ghost"; onClick?: () => void; children: ReactNode; disabled?: boolean; small?: boolean; title?: string; type?: "button" | "submit" }) {
  return (
    <button type={type ?? "button"} className={`btn btn-${kind}${small ? " btn-sm" : ""}`} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

// ---- アイコン（共通） ----
export const Icon = {
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}><path d="M12 5v14M5 12h14" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}><path d="M20 6 9 17l-5-5" /></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M18 6 6 18M6 6l12 12" /></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>,
  restore: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" /></svg>,
  doc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
};
