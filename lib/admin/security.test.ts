import { describe, expect, it } from "vitest";
import {
  createOpaqueToken,
  hashAdminPassword,
  hashSessionToken,
  validateAdminPassword,
  verifyAdminPassword,
  resolveUploadPath,
  sanitizeRichHtml,
  validateUploadMetadata,
} from "@/lib/admin/security";

describe("admin security helpers", () => {
  it("creates distinct opaque tokens and stable hashes", () => {
    const first = createOpaqueToken();
    const second = createOpaqueToken();

    expect(first).not.toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(first)).toBe(hashSessionToken(first));
    expect(hashSessionToken(first)).not.toBe(hashSessionToken(second));
  });

  it("enforces a strong administrator password and verifies Argon2 hashes", async () => {
    expect(validateAdminPassword("short").ok).toBe(false);
    expect(validateAdminPassword("alllowercase123").ok).toBe(false);
    expect(validateAdminPassword("StrongPassword123!")).toEqual({ ok: true });

    const hash = await hashAdminPassword("StrongPassword123!");
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(verifyAdminPassword(hash, "StrongPassword123!")).resolves.toBe(true);
    await expect(verifyAdminPassword(hash, "WrongPassword123!")).resolves.toBe(false);
  });

  it("removes scripts, event handlers, and unsafe links from rich HTML", () => {
    const dirty = '<h2 onclick="evil()">Title</h2><script>alert(1)</script><a href="javascript:evil()">bad</a><p><strong>safe</strong></p>';
    const clean = sanitizeRichHtml(dirty);

    expect(clean).toContain("<h2>Title</h2>");
    expect(clean).toContain("<strong>safe</strong>");
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("javascript:");
  });

  it("allows only approved media types and limits", () => {
    expect(validateUploadMetadata("image/jpeg", 10 * 1024 * 1024)).toEqual({ ok: true, kind: "IMAGE" });
    expect(validateUploadMetadata("application/pdf", 25 * 1024 * 1024)).toEqual({ ok: true, kind: "PDF" });
    expect(validateUploadMetadata("image/svg+xml", 100)).toEqual({ ok: false, message: "รองรับเฉพาะ JPG, PNG, WebP และ PDF" });
    expect(validateUploadMetadata("image/webp", 10 * 1024 * 1024 + 1).ok).toBe(false);
  });

  it("keeps resolved uploads inside the configured directory", () => {
    expect(resolveUploadPath("C:\\uploads", "products/a.webp")).toBe("C:\\uploads\\products\\a.webp");
    expect(() => resolveUploadPath("C:\\uploads", "../secret.txt")).toThrow("Unsafe upload path");
    expect(() => resolveUploadPath("C:\\uploads", "C:\\uploads-evil\\secret.txt")).toThrow("Unsafe upload path");
  });
});
