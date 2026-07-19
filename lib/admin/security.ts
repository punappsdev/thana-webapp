import crypto from "node:crypto";
import path from "node:path";
import sanitizeHtml from "sanitize-html";
import argon2 from "argon2";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_DURATION_MS } from "@/lib/admin/constants";

export { ADMIN_SESSION_COOKIE, ADMIN_SESSION_DURATION_MS };

export type MediaKind = "IMAGE" | "PDF";

export function createOpaqueToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function validateAdminPassword(
  password: string,
): { ok: true } | { ok: false; message: string } {
  if (password.length < 12) {
    return { ok: false, message: "รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร" };
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return { ok: false, message: "รหัสผ่านต้องมีตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ ตัวเลข และสัญลักษณ์" };
  }
  return { ok: true };
}

export function hashAdminPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
}

export function verifyAdminPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export function sanitizeRichHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [
      "p",
      "br",
      "h2",
      "h3",
      "strong",
      "em",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
  });
}

export function validateUploadMetadata(
  mimeType: string,
  size: number,
): { ok: true; kind: MediaKind } | { ok: false; message: string } {
  const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (imageTypes.has(mimeType)) {
    if (size > 10 * 1024 * 1024) {
      return { ok: false, message: "ไฟล์รูปภาพต้องมีขนาดไม่เกิน 10 MB" };
    }
    return { ok: true, kind: "IMAGE" };
  }

  if (mimeType === "application/pdf") {
    if (size > 25 * 1024 * 1024) {
      return { ok: false, message: "ไฟล์ PDF ต้องมีขนาดไม่เกิน 25 MB" };
    }
    return { ok: true, kind: "PDF" };
  }

  return { ok: false, message: "รองรับเฉพาะ JPG, PNG, WebP และ PDF" };
}

export function resolveUploadPath(uploadDir: string, relativePath: string): string {
  const pathApi = /^[A-Za-z]:[\\/]/.test(uploadDir) ? path.win32 : path;
  const root = pathApi.resolve(uploadDir);
  const target = pathApi.resolve(root, relativePath);
  const relative = pathApi.relative(root, target);

  if (!relative || relative === ".") return target;
  if (relative.startsWith("..") || pathApi.isAbsolute(relative)) {
    throw new Error("Unsafe upload path");
  }
  return target;
}
