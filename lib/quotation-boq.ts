import "server-only";

import { fileTypeFromBuffer } from "file-type";
import { randomBytes, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { resolveUploadPath } from "@/lib/admin/security";

export const MAX_BOQ_FILE_SIZE = 10 * 1024 * 1024;

const BOQ_TYPES = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;

export type BoqFileErrorCode =
  | "boqFileInvalidType"
  | "boqFileTooLarge"
  | "boqFileUnreadable";

export class BoqFileError extends Error {
  constructor(
    public readonly code: BoqFileErrorCode,
    cause?: unknown,
  ) {
    super(code, { cause });
    this.name = "BoqFileError";
  }
}

export type StoredBoqAttachment = {
  storagePath: string;
  /** Kept in memory only so a failed DB transaction can remove the file. */
  absolutePath: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloadToken: string;
};

/** A FormData upload without trusting the browser-provided MIME type. */
export function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    value !== null &&
    typeof value !== "string" &&
    typeof value.size === "number" &&
    typeof value.arrayBuffer === "function"
  );
}

/**
 * Stores one BOQ file under a private, generated-name directory. The final
 * rename is atomic and the original name is used only for display metadata.
 */
export async function storeBoqFile(file: File): Promise<StoredBoqAttachment> {
  if (!Number.isSafeInteger(file.size) || file.size <= 0) {
    throw new BoqFileError("boqFileInvalidType");
  }
  if (file.size > MAX_BOQ_FILE_SIZE) {
    throw new BoqFileError("boqFileTooLarge");
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(await file.arrayBuffer());
  } catch (error) {
    throw new BoqFileError("boqFileUnreadable", error);
  }

  if (bytes.length === 0) {
    throw new BoqFileError("boqFileInvalidType");
  }
  if (bytes.length > MAX_BOQ_FILE_SIZE) {
    throw new BoqFileError("boqFileTooLarge");
  }

  let detected;
  try {
    detected = await fileTypeFromBuffer(bytes);
  } catch (error) {
    throw new BoqFileError("boqFileUnreadable", error);
  }

  const detectedMimeType = detected?.mime;
  const extension =
    detectedMimeType === BOQ_TYPES.pdf
      ? "pdf"
      : detectedMimeType === BOQ_TYPES.xlsx
        ? "xlsx"
        : null;
  if (!extension) {
    throw new BoqFileError("boqFileInvalidType");
  }
  const mimeType = extension === "pdf" ? BOQ_TYPES.pdf : BOQ_TYPES.xlsx;

  const uploadDir = process.env.UPLOAD_DIR;
  if (!uploadDir) {
    throw new BoqFileError("boqFileUnreadable");
  }

  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const storageName = `${randomUUID()}.${extension}`;
  const storagePath = `quote-boq/${year}/${month}/${storageName}`;
  const absolutePath = resolveUploadPath(uploadDir, storagePath);
  const directory = path.dirname(absolutePath);
  const temporaryPath = `${absolutePath}.${randomUUID()}.tmp`;

  try {
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    await fs.writeFile(temporaryPath, bytes, { flag: "wx", mode: 0o600 });
    await fs.rename(temporaryPath, absolutePath);
  } catch (error) {
    await removeFileQuietly(temporaryPath);
    throw new BoqFileError("boqFileUnreadable", error);
  }

  return {
    storagePath,
    absolutePath,
    originalName: sanitizeDisplayFilename(file.name, extension),
    mimeType,
    size: bytes.length,
    downloadToken: randomBytes(32).toString("hex"),
  };
}

/**
 * Keeps path syntax and control characters out of the filename shown in the
 * admin/LINE download. It never touches the uploaded bytes or storage name.
 */
export function sanitizeDisplayFilename(filename: string, extension: "pdf" | "xlsx"): string {
  const basename = filename.split(/[\\/]/).pop() ?? "";
  let safe = basename
    .normalize("NFKC")
    .replace(/[\p{Cc}\p{Cf}\p{Bidi_Control}]/gu, "")
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  // The final extension comes from magic-byte detection, never from the
  // browser-provided filename. Remove the submitted extension before adding
  // the authoritative one, while preserving dots in the safe base name.
  safe = safe.replace(/\.[^.]*$/, "").trim();
  const suffix = `.${extension}`;
  const maxBaseLength = 255 - suffix.length;
  safe = Array.from(safe).slice(0, maxBaseLength).join("").trim();
  return `${safe || "boq"}${suffix}`;
}

export async function removeStoredBoqFile(absolutePath: string): Promise<void> {
  await fs.unlink(absolutePath);
}

async function removeFileQuietly(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // The temp file may not have been created, or rename may already have
    // consumed it. The original error is the useful one for the caller.
  }
}
