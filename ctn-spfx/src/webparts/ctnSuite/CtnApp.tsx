// ============================================================================
// CtnApp.tsx — demo/app の App.tsx を SPFx 向けに適応させた版（手編集可）
// ----------------------------------------------------------------------------
// src/shared/ は sync-from-demo.mjs が生成する逐語コピーだが、App.tsx だけは
// SPFx 固有の差分（操作ユーザーの取得元・ラッパー要素・localStorage キー）が
// あるため、ここで適応版を保持する。
//
// demo/app/src/App.tsx との差分は以下の4点のみ。それ以外は逐語で揃える:
//   1. 操作ユーザー … demoMode=false では pageContext のユーザーを使い、
//                      ユーザー切替ドロップダウンを描画しない
//   2. ラッパー     … .ctnApp（スコープ化CSSの土台）で全体を包む
//   3. body クラス  … document.body を書き換えない（ページを汚さない）。
//                      lang による分岐は .ctnApp 側のクラスで行う
//   4. リポジトリ    … Web パーツが setRepository() で注入済みのものを使う
//
// demo 側 App.tsx が変わると sync-from-demo.mjs がハッシュ差分で警告する。
// その際は本ファイルへの反映要否を確認すること。
// ============================================================================
import * as React from "react";
import { useEffect, useMemo, useState } from "react";

import { LangContext, makeT } from "../../shared/i18n";
import type { Lang, Notification } from "../../shared/ctn/types";
import { getRepository } from "../../shared/ctn/data/repository";
import type { CtnDb } from "../../shared/ctn/data/repository";
import { deriveAlerts } from "../../shared/ctn/derive";
import { USERS, userById, roleLabel, TARGET_CATEGORY, DEV_STATUS, type DemoUser } from "../../shared/ctn/refData";
import { Sidebar, type ViewKey } from "../../shared/ctn/components/Sidebar";
import { Dashboard } from "../../shared/ctn/components/Dashboard";
import { NotificationsView } from "../../shared/ctn/components/NotificationList";
import { NotificationDetail } from "../../shared/ctn/components/NotificationDetail";
import { CreateWizard, type CreatePayload } from "../../shared/ctn/components/CreateWizard";
import { MasterView } from "../../shared/ctn/components/MasterView";
import { ImportView, type ParsedImport } from "../../shared/ctn/components/ImportView";
import { SettingsView } from "../../shared/ctn/components/SettingsView";
import { AuditView } from "../../shared/ctn/components/AuditView";
import { XmlPreview } from "../../shared/ctn/components/XmlPreview";
import { DEFAULT_RULES, setRules, type RuleSettings } from "../../shared/ctn/rules";

// 配色バリエーション。"indigo" は現行デザイン（palette クラスを付けない）
const PALETTES = [
  { key: "indigo", en: "Indigo (current)", ja: "インディゴ（現行）", swatch: "#6d5efc" },
  { key: "ocean", en: "Ocean", ja: "オーシャン", swatch: "#2563eb" },
  { key: "teal", en: "Teal", ja: "ティール", swatch: "#0d9488" },
] as const;
type PaletteKey = (typeof PALETTES)[number]["key"];

const TITLES: Record<ViewKey, [string, string]> = {
  dashboard: ["Dashboard", "ダッシュボード"],
  notifications: ["Notifications", "治験届一覧"],
  import: ["Import", "データ取り込み"],
  masters: ["Masters", "マスタ管理"],
  settings: ["Rule settings", "ロジカルチェック設定"],
  audit: ["Audit log", "監査ログ"],
};

export interface ICtnAppProps {
  /** true でユーザー切替ドロップダウンを出す（職務分離のデモ用） */
  demoMode: boolean;
  /** demoMode=false のときの操作ユーザー（pageContext 由来） */
  currentUser: DemoUser;
  /** ページのカルチャが ja 系なら "ja" */
  initialLang: Lang;
}

/** localStorage 例外を握りつぶす小ヘルパ（SharePoint でも動くが念のため） */
function readLocal(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}
function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export default function CtnApp({ demoMode, currentUser, initialLang }: ICtnAppProps): React.ReactElement {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [view, setView] = useState<ViewKey>("dashboard");
  const [db, setDb] = useState<CtnDb | null>(null);
  // demoMode のときだけ切替可能。非 demoMode では pageContext のユーザーで固定
  const [demoUserId, setDemoUserId] = useState<string>("u-a");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wizard, setWizard] = useState(false);
  const [xmlFor, setXmlFor] = useState<Notification | null>(null);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
  // 初回読み込みの失敗。トーストは3秒で消えるため、原因を画面に残す用途で持つ
  const [bootError, setBootError] = useState<string>("");
  const [rules, setRulesState] = useState<RuleSettings>(() => ({ ...DEFAULT_RULES }));
  const [palette, setPalette] = useState<PaletteKey>(() => {
    const v = readLocal("ctn.palette");
    return PALETTES.some((p) => p.key === v) ? (v as PaletteKey) : "indigo";
  });
  const [mode, setMode] = useState<"light" | "dark">(() =>
    readLocal("ctn.mode") === "dark" ? "dark" : "light"
  );
  const [collapsed, setCollapsed] = useState<boolean>(() => readLocal("ctn.sidebar") === "collapsed");

  const t = useMemo(() => makeT(lang), [lang]);
  const repo = getRepository();

  // 職務分離の判定に使う操作ユーザー。demoMode ではドロップダウンの選択、
  // それ以外は SharePoint のサインインユーザー。
  const user: DemoUser = demoMode ? userById(demoUserId) ?? currentUser : currentUser;
  const userId = user.id;

  // demo/app 版は document.body に "ja" を付けるが、SharePoint ページを
  // 汚さないためラッパー要素側のクラスで表現する（下の className を参照）。

  useEffect(() => writeLocal("ctn.mode", mode), [mode]);
  useEffect(() => writeLocal("ctn.palette", palette), [palette]);
  useEffect(() => writeLocal("ctn.sidebar", collapsed ? "collapsed" : "expanded"), [collapsed]);

  const flash = (msg: string, err = false): void => {
    setToast({ msg, err });
    window.setTimeout(() => setToast(null), 3000);
  };

  const reload = async (): Promise<void> => {
    setDb(await repo.getState());
    setBootError("");
  };
  useEffect(() => {
    // demo/app 版は `void reload()` だが、SharePoint リスト接続時は初回読み込みが
    // 権限・リスト未作成で失敗しうる。失敗を握り潰すと db が null のままになり
    // 「読み込み中…」で永久に止まるため、原因を画面に出して再試行させる。
    reload().catch((e) => setBootError((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNotif = (id: string): void => setSelectedId(id);
  const backToList = (): void => setSelectedId(null);

  /**
   * 新規届の作成を開く。
   * ウィザードは「治験届出者が選択済み」を作成の条件にしているため、届出者が
   * 1件も無いと作成ボタンが押せない行き止まりになる（SharePoint リストを
   * 作った直後がこの状態）。理由を出してマスタ管理へ誘導する。
   */
  const openWizard = (): void => {
    const hasSponsor = (db?.sponsors ?? []).some((s) => s.active);
    if (!hasSponsor) {
      flash(
        t(
          "Register a sponsor first (Masters → Sponsor).",
          "先に治験届出者を登録してください（マスタ管理 → 治験届出者）。届出者が無いと届を作成できません。"
        ),
        true
      );
      setView("masters");
      return;
    }
    setWizard(true);
  };

  const applyRules = (r: RuleSettings): void => {
    setRules(r); // モジュールのシングルトンへ反映（computeDeadline / deriveAlerts が参照）
    setRulesState(r); // 再描画してアラート等を再計算
    flash(t("Rule settings applied", "設定を反映しました"));
  };

  // 既存ファイル（XML）→ ドラフトとして取り込む
  const handleImport = async (p: ParsedImport): Promise<void> => {
    try {
      let compoundId = db?.compounds.find((c) => c.compoundCode === p.compoundCode)?.id;
      if (!compoundId) {
        const c = await repo.createCompound(
          {
            compoundCode: p.compoundCode,
            targetCategory: TARGET_CATEGORY.drug,
            trialKind: "医薬品",
            initReceptNo: "",
            initNoteDate: "",
            devStatus: DEV_STATUS.active,
            sponsorId: db?.sponsors[0]?.id ?? "",
            drugName: p.compoundCode,
          },
          userId
        );
        compoundId = c.id;
      }
      const n = await repo.createNotification({ compoundId, notifType: p.notifType, createdBy: userId });
      await repo.updateNotification(
        {
          ...n,
          protocolNo: p.protocolNo ?? n.protocolNo,
          objectives: p.objectives ?? n.objectives,
          targetDisease: p.targetDisease ?? n.targetDisease,
          remarks: p.remarks ?? n.remarks,
        },
        userId
      );
      await reload();
      setSelectedId(n.id);
      setView("notifications");
      flash(t("Imported as a draft — complete the details.", "ドラフトとして取り込みました。詳細を補完してください。"));
    } catch (e) {
      flash((e as Error).message, true);
    }
  };

  // ---- ワークフローハンドラ ----
  const handleCreate = async (p: CreatePayload): Promise<void> => {
    try {
      let compoundId = p.compoundId;
      if (p.newCompound) {
        const c = await repo.createCompound(p.newCompound, userId);
        compoundId = c.id;
      }
      if (!compoundId) return;
      const n = await repo.createNotification({
        compoundId,
        notifType: p.notifType,
        targetFilingCount: p.targetFilingCount,
        createdBy: userId,
      });
      await reload();
      setWizard(false);
      setSelectedId(n.id);
      flash(t("Filing created — edit the differences.", "届を作成しました。差分を編集してください。"));
    } catch (e) {
      // 作成に失敗したらウィザードを開いたままにして、理由を見せる
      flash((e as Error).message, true);
    }
  };

  const handleSave = async (n: Notification): Promise<Notification> => {
    try {
      const saved = await repo.updateNotification(n, userId);
      await reload();
      flash(t("Saved", "保存しました"));
      return saved; // サーバー確定後の順序番号を detail の draft へ反映する
    } catch (e) {
      // 失敗を黙って飲み込むと「保存ボタンが反応しない」ように見える。
      // トーストで理由を出したうえで再スローし、詳細側の未保存フラグを
      // 立てたまま残す（setDirty(false) へ進ませない＝再試行できる）。
      flash((e as Error).message, true);
      throw e;
    }
  };
  const handleSendReview = async (id: string): Promise<void> => {
    try {
      await repo.sendForReview(id, userId);
      await reload();
      flash(t("Sent for review", "社内レビューへ送付しました"));
    } catch (e) {
      flash((e as Error).message, true);
    }
  };
  const handleApprove = async (id: string): Promise<void> => {
    try {
      await repo.approveNotification(id, userId);
      await reload();
      flash(t("Approved", "承認しました"));
    } catch (e) {
      flash((e as Error).message, true);
    }
  };
  const handleSubmit = async (id: string): Promise<void> => {
    try {
      await repo.submitNotification(id, userId);
      await reload();
      flash(t("Submitted", "提出しました（順序番号を確定）"));
    } catch (e) {
      flash((e as Error).message, true);
    }
  };
  const handleDelete = async (id: string): Promise<void> => {
    try {
      await repo.deleteNotification(id, userId);
      await reload();
      setSelectedId(null);
      flash(t("Deleted", "削除しました"));
    } catch (e) {
      flash((e as Error).message, true);
    }
  };
  const handleXmlGenerated = async (n: Notification): Promise<void> => {
    try {
      await repo.markXmlGenerated(n.id, userId);
      await reload();
      setXmlFor(null);
      flash(t("XML generated & validated", "XMLを生成・検証しました"));
    } catch (e) {
      flash((e as Error).message, true);
    }
  };

  // .ctnApp はスコープ化CSSの土台。元の body 相当のスタイルがここに載る。
  const wrapperClass = `ctnApp${lang === "ja" ? " ja" : ""}`;

  // 読み込みに失敗したときは「読み込み中」のまま止めず、原因と再試行を出す
  if (!db && bootError)
    return (
      <div className={wrapperClass}>
        <div className="boot">
          <div className="boot-card" style={{ maxWidth: 640, textAlign: "left" }}>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>
              {t("Failed to load data", "データを読み込めませんでした")}
            </h2>
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: "var(--red-bg)",
                fontSize: 13,
                lineHeight: 1.7,
                marginBottom: 14,
                wordBreak: "break-all",
              }}
            >
              {bootError}
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
              {t(
                "Check that the lists exist and that you have access.",
                "次を確認してください：SharePoint リストが作成済みか／このサイトへのアクセス権があるか。" +
                  "リストが未作成の場合は、Web パーツのデータソースを「デモデータ（mock）」に戻すと表示できます。"
              )}
            </p>
            <button
              className="btn btn-p"
              onClick={() => {
                setBootError("");
                reload().catch((e) => setBootError((e as Error).message));
              }}
            >
              {t("Retry", "再試行する")}
            </button>
          </div>
        </div>
      </div>
    );

  if (!db)
    return (
      <div className={wrapperClass}>
        <div className="boot">
          <div className="boot-card">
            <div className="sk-note">{t("Loading…", "読み込み中…")}</div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div className="sk-row" key={i}>
                <span className="sk" />
                <span className="sk" />
                <span className="sk" />
                <span className="sk" />
                <span className="sk" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  const alerts = deriveAlerts(db);
  const selected = selectedId ? db.notifications.find((n) => n.id === selectedId) ?? null : null;

  return (
    <div className={wrapperClass}>
      <LangContext.Provider value={{ lang, setLang: (l) => setLang(l as Lang), t }}>
        <div
          className={`app${lang === "ja" ? " ja" : ""} theme-modern${
            palette === "indigo" ? "" : ` palette-${palette}`
          } mode-${mode}${collapsed ? " collapsed" : ""}`}
        >
          <Sidebar
            view={selected ? "notifications" : view}
            onNavigate={(v) => {
              setSelectedId(null);
              setView(v);
            }}
            user={user}
            badges={{ dashboard: alerts.length }}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          />
          <div className="main">
            <header className="top">
              <h1>{selected ? t("Filing detail", "治験届 詳細") : t(...TITLES[view])}</h1>
              <div className="sp" />
              {/* ユーザー切替は職務分離のデモ用。実運用ではサインインユーザーで固定 */}
              {demoMode ? (
                <div className="user-switch">
                  <span className="us-label">{t("Acting as", "操作ユーザー")}</span>
                  <select className="sel" value={demoUserId} onChange={(e) => setDemoUserId(e.target.value)}>
                    {USERS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}（{t(roleLabel[u.role][0], roleLabel[u.role][1])}）
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <button
                className="icon-btn mode-toggle"
                onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
                title={mode === "dark" ? t("Switch to light mode", "ライトモードに切替") : t("Switch to dark mode", "ダークモードに切替")}
                aria-label={mode === "dark" ? t("Switch to light mode", "ライトモードに切替") : t("Switch to dark mode", "ダークモードに切替")}
              >
                {mode === "dark" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="4.2" />
                    <path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                  </svg>
                )}
              </button>
              {/* 配色バリエーション切替（構造・タイポは現行のまま、アクセント色のみ差し替え） */}
              <div className="palette-switch" role="group" aria-label={t("Color palette", "配色")}>
                {PALETTES.map((p) => (
                  <button
                    key={p.key}
                    className={`pal-dot${palette === p.key ? " on" : ""}`}
                    style={{ background: p.swatch }}
                    onClick={() => setPalette(p.key)}
                    title={t(p.en, p.ja)}
                    aria-label={t(p.en, p.ja)}
                    aria-pressed={palette === p.key}
                  />
                ))}
              </div>
              <div className="lang">
                <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
                  EN
                </button>
                <button className={lang === "ja" ? "on" : ""} onClick={() => setLang("ja")}>
                  JA
                </button>
              </div>
              <button className="btn btn-p" onClick={openWizard}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {t("New filing", "新規届作成")}
              </button>
            </header>

            <div className="scroll">
              {selected ? (
                <NotificationDetail
                  key={selected.id}
                  notification={selected}
                  db={db}
                  user={user}
                  onBack={backToList}
                  onSave={handleSave}
                  onSendReview={handleSendReview}
                  onApprove={handleApprove}
                  onSubmit={handleSubmit}
                  onDelete={handleDelete}
                  onGenerateXml={(n) => setXmlFor(n)}
                />
              ) : view === "dashboard" ? (
                <Dashboard db={db} onOpen={openNotif} onNavigate={(v) => setView(v)} />
              ) : view === "notifications" ? (
                <NotificationsView db={db} onOpen={openNotif} />
              ) : view === "import" ? (
                <ImportView onImport={handleImport} />
              ) : view === "masters" ? (
                <MasterView db={db} repo={repo} actorId={userId} reload={reload} flash={flash} />
              ) : view === "settings" ? (
                <SettingsView rules={rules} onSave={applyRules} user={user} />
              ) : (
                <AuditView db={db} />
              )}
            </div>
          </div>

          {/* オーバーレイは .app の内側に置く（theme-modern の変数を継承させるため） */}
          {wizard && <CreateWizard db={db} onClose={() => setWizard(false)} onSubmit={handleCreate} />}
          {xmlFor && (
            <XmlPreview notification={xmlFor} db={db} onClose={() => setXmlFor(null)} onGenerated={handleXmlGenerated} />
          )}

          <div className={`toast${toast ? " on" : ""}${toast?.err ? " toast-err" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              {toast?.err ? (
                <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              ) : (
                <path d="M20 6 9 17l-5-5" />
              )}
            </svg>
            <span>{toast?.msg}</span>
          </div>
        </div>
      </LangContext.Provider>
    </div>
  );
}
