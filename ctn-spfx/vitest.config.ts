import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // src/ のテストだけを対象にする。lib/ は gulp のコンパイル出力で、
    // 放置すると同じテストが二重に走る（かつ古い版が残り続ける）。
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/**", "lib/**", "dist/**", "temp/**"],
  },
});
