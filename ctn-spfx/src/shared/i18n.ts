// ===========================================================================
// AUTO-GENERATED — 手編集禁止
// scripts/sync-from-demo.mjs が demo/app/src から生成。再同期で上書きされます。
// 変更は単一ソース demo/app/src/i18n.ts 側で行ってください。
// ===========================================================================
import { createContext, useContext } from "react";
import type { Lang } from "./ctn/types";

export interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** pick language-appropriate string */
  t: (en: string, ja: string) => string;
}

export const LangContext = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  t: (en) => en,
});

export const useLang = (): LangCtx => useContext(LangContext);

export const makeT =
  (lang: Lang) =>
  (en: string, ja: string): string =>
    lang === "ja" ? ja : en;
