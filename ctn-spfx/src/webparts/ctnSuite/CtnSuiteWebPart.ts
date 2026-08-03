// ============================================================================
// CtnSuiteWebPart.ts — CTN Suite の SPFx ホスト
// ----------------------------------------------------------------------------
// 役割は3つだけ。ドメインロジックは一切持たない（shared/ctn の logic.ts 等が正）。
//   1. データソース（mock / sharepoint）を選び CtnRepository を注入する
//   2. スコープ化CSSを Web パーツ内に注入する
//   3. 操作ユーザーを pageContext から解決して CtnApp へ渡す
// ============================================================================
import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneChoiceGroup,
  PropertyPaneSlider,
  PropertyPaneToggle,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";

import { SPHttpClient } from "@microsoft/sp-http";

import * as strings from "CtnSuiteWebPartStrings";
import CtnApp, { type ICtnAppProps } from "./CtnApp";
import SetupView, { type ISetupViewProps } from "./SetupView";
import { checkProvisioning } from "../../data/listProvisioner";
import { CTN_HOST_CSS } from "./hostStyles";
import { CTN_SCOPED_CSS } from "../../shared/styles.generated";
import { setRepository } from "../../shared/ctn/data/repository";
import { MockCtnRepository } from "../../shared/ctn/data/mockRepository";
import { SharePointCtnRepository } from "../../data/sharepointRepository";
import { SpRestClient } from "../../data/spClient";
import { resolveRole, type CtnRole } from "../../data/roleResolver";
import type { Lang } from "../../shared/ctn/types";
import { userById, type DemoUser } from "../../shared/ctn/refData";

export type CtnDataSource = "mock" | "sharepoint";

export interface ICtnSuiteWebPartProps {
  /** 既定は mock。リスト未作成のサイトでも白画面にならないようにするため */
  dataSource: CtnDataSource;
  /** true でユーザー切替ドロップダウンを表示（職務分離のデモ用） */
  demoMode: boolean;
  /** Web パーツの表示高（px） */
  heightPx: number;
}

/** 生成CSSを一度だけ document.head へ入れる（Web パーツ複数配置でも1回） */
const STYLE_ELEMENT_ID = "ctn-suite-scoped-styles";

export default class CtnSuiteWebPart extends BaseClientSideWebPart<ICtnSuiteWebPartProps> {
  /** サインインユーザーのロール。sharepoint モードではグループから解決する */
  private _role: CtnRole = "viewer";
  /** sharepoint モードで使う REST クライアント（セットアップ画面にも渡す） */
  private _sp: SpRestClient | undefined;
  /** 未作成のリスト。空でなければセットアップ画面を出す */
  private _missingLists: string[] = [];

  protected async onInit(): Promise<void> {
    this._injectStyles();
    await this._initRepository();
  }

  /**
   * .ctnApp スコープへ変換済みのCSSと、SharePoint ホスト用の上書きを注入する。
   * 生成CSS → 上書き の順（同詳細度は後勝ち）。
   */
  private _injectStyles(): void {
    if (document.getElementById(STYLE_ELEMENT_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    style.textContent = CTN_SCOPED_CSS + "\n" + CTN_HOST_CSS;
    document.head.appendChild(style);
  }

  /**
   * CtnRepository を注入する。コンポーネントは getRepository() 経由でのみ
   * データへ触れる（この設計を崩さないこと — ブリーフ 6章）。
   */
  private async _initRepository(): Promise<void> {
    this._missingLists = [];
    if (this.properties.dataSource !== "sharepoint") {
      // mock はデモデータの砂場。デモ利用者（切替ドロップダウン）はそのロールで
      // 動かし、表に無いサインインユーザーは全操作を許して試せるようにする。
      // 実データに触れないため、ここを緩めても実害はない。
      this._role = "regulatory";
      setRepository(new MockCtnRepository((id) => userById(id)?.role ?? "regulatory"));
      return;
    }

    const sp = new SpRestClient(
      this.context.spHttpClient,
      SPHttpClient.configurations.v1,
      this.context.pageContext.web.absoluteUrl
    );
    this._sp = sp;

    // リストが未作成なら、データ取得を試みる前にセットアップ画面へ回す。
    // 取得に失敗した場合（権限不足など）は判定を諦めてアプリ側のエラー表示に委ねる。
    try {
      this._missingLists = (await checkProvisioning(sp)).missing;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[CTN Suite] リストの有無を確認できませんでした。", e);
    }

    // ロールは SharePoint のサイトグループ所属から決まる（セットアップが作る4グループ）。
    // 取得に失敗しても最小権限の viewer で起動し、白画面にはしない。
    try {
      this._role = resolveRole(await sp.getCurrentUserGroupNames());
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[CTN Suite] 所属グループを取得できませんでした。閲覧のみで起動します。", e);
      this._role = "viewer";
    }

    const me = this.context.pageContext.user;
    setRepository(
      new SharePointCtnRepository(
        sp,
        (actorId) =>
          // 監査ログの表示名。現在の操作者は pageContext から、それ以外は
          // ログイン名をそのまま残す（他ユーザーの表示名解決は行わない）。
          actorId === me.loginName ? me.displayName || me.loginName : actorId,
        // デモの操作ユーザーに切り替えているならその人のロール、そうでなければ
        // サインインユーザーのサイトグループ由来のロール。画面側も同じ actor の
        // ロールで可否を判断するため、押せるのに失敗するボタンは出ない。
        (actorId) => userById(actorId)?.role ?? this._role
      )
    );
  }

  /** pageContext のサインインユーザーを DemoUser 形へ写像する */
  private _currentUser(): DemoUser {
    const u = this.context.pageContext.user;
    const name = u.displayName || u.loginName;
    const initials = name
      // 半角空白に加え U+3000（全角スペース）。日本語の表示名は姓名が全角空白
      // で区切られることが多く、素の \s ではこれを拾えない。
      .split(/[\s\u3000]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
    return {
      // 職務分離（起票者≠承認者）の判定キー。ログイン名で一意にする。
      id: u.loginName,
      name,
      initials: initials || "??",
      // ロールは SharePoint のサイトグループ所属から解決済み（_initRepository）。
      // mock モードはグループを引かず regulatory（砂場のため全操作可）。
      role: this._role,
      dept: "",
    };
  }

  public render(): void {
    const cultureName = this.context.pageContext.cultureInfo.currentUICultureName || "";
    const initialLang: Lang = cultureName.toLowerCase().indexOf("ja") === 0 ? "ja" : "en";

    this.domElement.style.setProperty("--ctn-host-height", `${this.properties.heightPx || 820}px`);

    // リストが揃っていなければ初期セットアップ画面を出す。
    // ここで作成まで済ませられるので、テナント管理者や PnP.PowerShell は不要。
    const needsSetup = !!this._sp && this._missingLists.length > 0;

    const element: React.ReactElement<ISetupViewProps | ICtnAppProps> = needsSetup
      ? React.createElement(SetupView, {
          sp: this._sp as SpRestClient,
          missing: this._missingLists,
          onDone: () => {
            this._missingLists = [];
            this.render();
          },
        })
      : React.createElement(CtnApp, {
          demoMode: !!this.properties.demoMode,
          currentUser: this._currentUser(),
          initialLang,
        });

    // SPFx 1.21.1 は React 17。createRoot ではなく ReactDom.render を使う。
    // 描画は1箇所に集約する（onDispose の unmount と対で管理するため）。
    ReactDom.render(element, this.domElement);
  }

  /**
   * データソースを切り替えたときに、その場で反映させる。
   * SPFx はプロパティ変更で onInit を再実行しない（render だけが呼ばれる）ため、
   * これが無いと mock ↔ sharepoint の切替がページ再読み込みまで効かない。
   */
  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: unknown, newValue: unknown): void {
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
    if (propertyPath !== "dataSource" || oldValue === newValue) return;

    this._initRepository()
      .then(() => this.render())
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error("[CTN Suite] データソースの切替に失敗しました。", e);
      });
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneChoiceGroup("dataSource", {
                  label: strings.DataSourceFieldLabel,
                  options: [
                    { key: "mock", text: strings.DataSourceMock },
                    { key: "sharepoint", text: strings.DataSourceSharePoint },
                  ],
                }),
                PropertyPaneToggle("demoMode", {
                  label: strings.DemoModeFieldLabel,
                  onText: strings.DemoModeOn,
                  offText: strings.DemoModeOff,
                }),
                PropertyPaneSlider("heightPx", {
                  label: strings.HeightFieldLabel,
                  min: 480,
                  max: 1600,
                  step: 20,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
