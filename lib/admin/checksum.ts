import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";

/**
 * Identity of an upload for duplicate detection: the sha256 of the bytes we
 * actually store on disk (images are already re-encoded to WebP by then).
 * Hashing the stored bytes rather than the original upload is what lets the
 * whole existing library be backfilled by reading files straight off disk.
 *
 * No `import "server-only"` here on purpose — scripts/ and vitest import this.
 */
export function computeChecksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/** Same digest as {@link computeChecksum}, streamed so a 25 MB PDF never lands in memory. */
export async function computeFileChecksum(absolutePath: string): Promise<string> {
  const hash = crypto.createHash("sha256");
  await pipeline(createReadStream(absolutePath), hash);
  return hash.digest("hex");
}
