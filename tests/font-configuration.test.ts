import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workspace = process.cwd();
const fontModulePath = join(workspace, "lib", "fonts.ts");

describe("shared Next.js font configuration", () => {
  it("loads Prompt and Noto Sans Thai from one shared module", () => {
    expect(existsSync(fontModulePath)).toBe(true);

    const fontModule = readFileSync(fontModulePath, "utf8");
    const publicLayout = readFileSync(join(workspace, "app", "[locale]", "layout.tsx"), "utf8");
    const adminLayout = readFileSync(join(workspace, "app", "admin", "layout.tsx"), "utf8");

    expect(fontModule).toContain('from "next/font/google"');
    expect(fontModule).toContain('variable: "--font-prompt"');
    expect(fontModule).toContain('weight: ["300", "400", "500", "600", "700"]');
    expect(fontModule).toContain('variable: "--font-noto-sans-thai"');

    for (const layout of [publicLayout, adminLayout]) {
      expect(layout).toContain('import { notoSansThai, prompt } from "@/lib/fonts"');
      expect(layout).not.toContain('from "next/font/google"');
    }
  });
});
