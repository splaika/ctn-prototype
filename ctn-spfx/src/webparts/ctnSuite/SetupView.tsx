// ============================================================================
// SetupView.tsx — 初期セットアップ画面
// ----------------------------------------------------------------------------
// dataSource=sharepoint でリストがまだ無いときに、CtnApp の代わりに出す。
// ボタン1つでリスト・列・グループを作る（サイト所有者の権限で完結する）。
//
// これがあるおかげで PnP.PowerShell と Entra ID アプリ登録が不要になり、
// テナント管理者への依頼はアプリカタログ登録の1件だけになる。
// ============================================================================
import * as React from "react";
import { useState } from "react";

import {
  provisionCtnLists,
  type IProvisionProgress,
  type IProvisionResult,
} from "../../data/listProvisioner";
import type { ISpProvisioningClient } from "../../data/spClient";

export interface ISetupViewProps {
  sp: ISpProvisioningClient;
  /** 未作成のリスト名 */
  missing: string[];
  /** セットアップ完了後に呼ぶ（Web パーツを再描画してアプリを起動する） */
  onDone: () => void;
}

type Phase = "idle" | "running" | "done" | "error";

export default function SetupView({ sp, missing, onDone }: ISetupViewProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<IProvisionProgress | undefined>(undefined);
  const [result, setResult] = useState<IProvisionResult | undefined>(undefined);
  const [error, setError] = useState<string>("");

  const run = async (): Promise<void> => {
    setPhase("running");
    setError("");
    try {
      const r = await provisionCtnLists(sp, (p) => setProgress(p));
      setResult(r);
      setPhase("done");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  };

  /** onClick から呼ぶ同期ラッパ。想定外の拒否も画面に出す */
  const start = (): void => {
    run().catch((e) => {
      setError((e as Error).message);
      setPhase("error");
    });
  };

  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="ctnApp ja">
      <div className="boot">
        <div className="boot-card" style={{ maxWidth: 720, textAlign: "left" }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>初期セットアップ</h2>

          {phase === "idle" && (
            <>
              <p style={{ marginBottom: 12, lineHeight: 1.7 }}>
                データの保存先となる SharePoint リストがまだ作成されていません。
                下のボタンを押すと、このサイト内にリストとロール用グループを作成します。
              </p>
              <p style={{ marginBottom: 12, lineHeight: 1.7, fontSize: 13, opacity: 0.8 }}>
                作成対象はこのサイトの中だけです。管理者権限は必要ありません。
                既に存在するリスト・列・グループは作り直さないため、
                何度実行しても安全です。
              </p>
              <p style={{ marginBottom: 16, fontSize: 13 }}>
                未作成のリスト: {missing.length} 個（{missing.join(", ")}）
              </p>
              <button className="btn btn-p" onClick={start}>
                リストを作成する
              </button>
            </>
          )}

          {phase === "running" && (
            <>
              <p style={{ marginBottom: 12 }}>作成中です。ページを閉じないでください。</p>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: "var(--line)",
                  overflow: "hidden",
                  marginBottom: 10,
                }}
              >
                <div style={{ width: `${pct}%`, height: "100%", background: "var(--blue)" }} />
              </div>
              <p style={{ fontSize: 13, opacity: 0.8 }}>
                {progress ? `${progress.done} / ${progress.total} — ${progress.step}` : "準備中…"}
              </p>
            </>
          )}

          {phase === "done" && result && (
            <>
              <p style={{ marginBottom: 12 }}>セットアップが完了しました。</p>
              <ul style={{ marginBottom: 16, paddingLeft: 20, lineHeight: 1.8, fontSize: 13 }}>
                <li>
                  リスト: {result.listsCreated.length} 個作成 / {result.listsExisting.length} 個は既存
                </li>
                <li>
                  列: {result.fieldsCreated} 個作成 / {result.fieldsExisting} 個は既存
                </li>
                <li>
                  グループ: {result.groupsCreated.length} 個作成 / {result.groupsExisting.length} 個は既存
                </li>
              </ul>

              {result.failures.length > 0 && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    borderRadius: 8,
                    background: "var(--amber-bg)",
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  <b>一部が作成できませんでした（{result.failures.length} 件）。</b>
                  <br />
                  もう一度「リストを作成する」を実行すると、不足分だけ再試行します。
                  解消しない場合は以下を管理者へ伝えてください。
                  <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                    {result.failures.slice(0, 8).map((f) => (
                      <li key={f.where}>
                        {f.where}: {f.message}
                      </li>
                    ))}
                  </ul>
                  {result.failures.length > 8 && <div>ほか {result.failures.length - 8} 件</div>}
                </div>
              )}

              <p style={{ marginBottom: 16, fontSize: 13, lineHeight: 1.7 }}>
                続いて、作成された4つのロール用グループへ担当者を追加してください。
                <b>承認者は起票者と別の人にする必要があります</b>
                （同一人物だと職務分離チェックで承認が拒否されます）。
              </p>
              <button className="btn btn-p" onClick={onDone}>
                アプリを開く
              </button>
            </>
          )}

          {phase === "error" && (
            <>
              <p style={{ marginBottom: 12 }}>セットアップに失敗しました。</p>
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 8,
                  background: "var(--red-bg)",
                  fontSize: 13,
                  lineHeight: 1.7,
                  wordBreak: "break-all",
                }}
              >
                {error}
              </div>
              <p style={{ marginBottom: 16, fontSize: 13, lineHeight: 1.7 }}>
                リストを作成する権限が無い場合にも発生します。
                このサイトの所有者権限があるかご確認ください。
              </p>
              <button className="btn btn-p" onClick={start}>
                再試行する
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
