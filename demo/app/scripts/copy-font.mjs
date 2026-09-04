// ============================================================================
// 届書PDF用フォント（IPA明朝）を public/fonts へ配置する
// ----------------------------------------------------------------------------
// 8MB のバイナリを Git に2つ持ちたくないので、正は ctn-spfx/assets/ipam.ttf の
// 1つだけにして、デモアプリ側へは開発・ビルド前にコピーする。
// SPFx 側は同じファイルを ClientSideAssets へアップロードして使う。
// ============================================================================
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../../../ctn-spfx/assets/ipam.ttf");
const dest = resolve(here, "../public/fonts/ipam.ttf");

if (!existsSync(src)) {
  console.error(`フォントが見つかりません: ${src}`);
  console.error("IPA明朝（ipam.ttf）を ctn-spfx/assets/ へ置いてください。");
  process.exit(1);
}
if (existsSync(dest)) process.exit(0);
mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log(`届書PDF用フォントを配置しました: ${dest}`);
