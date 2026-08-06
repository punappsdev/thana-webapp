"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DuplicateFileDialog,
  type DuplicateChoice,
  type DuplicatePrompt,
  type LibraryAsset,
} from "@/components/admin/duplicate-file-dialog";

export type UploadOutcome = {
  /** URLs to use, in input order — newly uploaded files and reused library files alike. */
  urls: string[];
  uploaded: number;
  reused: number;
  skipped: number;
  failed: number;
};

const EMPTY_OUTCOME: UploadOutcome = { urls: [], uploaded: 0, reused: 0, skipped: 0, failed: 0 };

/**
 * The one upload path for the whole admin panel. Before a file is stored it is
 * checked against the media library twice — by exact filename (before the bytes
 * are even sent) and by checksum (server-side, after optimization) — and the
 * admin is asked whether to reuse the existing file instead of adding another
 * copy. Callers get back the URLs to use, however they were obtained.
 *
 * Size limits stay with the caller: each upload surface has its own wording.
 */
export function useMediaUpload() {
  const [pending, setPending] = useState(false);
  const [prompt, setPrompt] = useState<DuplicatePrompt | null>(null);
  const resolverRef = useRef<((choice: DuplicateChoice) => void) | null>(null);
  // Set when the admin ticks "apply to the rest", so a batch asks only once.
  const stickyActionRef = useRef<DuplicateChoice["action"] | null>(null);

  const ask = useCallback((next: DuplicatePrompt) => {
    const sticky = stickyActionRef.current;
    if (sticky) {
      return Promise.resolve<DuplicateChoice>(
        sticky === "reuse" ? { action: "reuse", url: next.candidates[0].url } : { action: sticky },
      );
    }
    return new Promise<DuplicateChoice>((resolve) => {
      resolverRef.current = resolve;
      setPrompt(next);
    });
  }, []);

  const resolvePrompt = useCallback((choice: DuplicateChoice, applyToRest: boolean) => {
    if (applyToRest) stickyActionRef.current = choice.action;
    setPrompt(null);
    const resolver = resolverRef.current;
    resolverRef.current = null;
    resolver?.(choice);
  }, []);

  const uploadFiles = useCallback(async (files: File[]): Promise<UploadOutcome> => {
    if (!files.length) return EMPTY_OUTCOME;
    setPending(true);
    stickyActionRef.current = null;
    const outcome: UploadOutcome = { urls: [], uploaded: 0, reused: 0, skipped: 0, failed: 0 };
    try {
      for (const [index, file] of files.entries()) {
        const remaining = files.length - index - 1;

        // Pre-flight on the filename: catches a re-upload without moving any bytes,
        // and works for assets uploaded before checksums existed.
        let force = false;
        const sameName = await findByName(file.name);
        if (sameName.length) {
          const choice = await ask({ reason: "name", file, candidates: sameName, remaining });
          if (choice.action === "skip") {
            outcome.skipped += 1;
            continue;
          }
          if (choice.action === "reuse") {
            outcome.urls.push(choice.url);
            outcome.reused += 1;
            continue;
          }
          // They already chose "upload anyway" for this file — don't ask twice.
          force = true;
        }

        let result = await postFile(file, force);
        if (result.status === "duplicate") {
          const choice = await ask({ reason: "content", file, candidates: [result.asset], remaining });
          if (choice.action === "skip") {
            outcome.skipped += 1;
            continue;
          }
          if (choice.action === "reuse") {
            outcome.urls.push(choice.url);
            outcome.reused += 1;
            continue;
          }
          result = await postFile(file, true);
        }

        if (result.status === "ok") {
          outcome.urls.push(result.asset.url);
          outcome.uploaded += 1;
        } else {
          outcome.failed += 1;
          toast.error(result.status === "error" ? `${file.name}: ${result.message}` : `${file.name}: อัปโหลดไม่สำเร็จ`);
        }
      }
    } finally {
      stickyActionRef.current = null;
      setPending(false);
    }
    return outcome;
  }, [ask]);

  return {
    pending,
    uploadFiles,
    duplicateDialog: <DuplicateFileDialog prompt={prompt} onResolve={resolvePrompt} />,
  };
}

/** Assets already in the library carrying this exact filename (best-effort). */
async function findByName(name: string): Promise<LibraryAsset[]> {
  try {
    const response = await fetch(`/api/admin/media?name=${encodeURIComponent(name)}`);
    if (!response.ok) return [];
    const json = (await response.json()) as { items?: LibraryAsset[] };
    return json.items ?? [];
  } catch {
    return [];
  }
}

type PostResult =
  | { status: "ok"; asset: LibraryAsset }
  | { status: "duplicate"; asset: LibraryAsset }
  | { status: "error"; message: string };

async function postFile(file: File, force: boolean): Promise<PostResult> {
  try {
    const body = new FormData();
    body.set("file", file);
    if (force) body.set("force", "1");
    const response = await fetch("/api/admin/media", { method: "POST", body });
    const data = await response.json().catch(() => ({}));
    if (response.status === 409 && data.reason === "content" && data.asset) {
      return { status: "duplicate", asset: data.asset as LibraryAsset };
    }
    if (!response.ok) return { status: "error", message: data.message || "อัปโหลดไม่สำเร็จ" };
    return { status: "ok", asset: data.asset as LibraryAsset };
  } catch {
    return { status: "error", message: "อัปโหลดไม่สำเร็จ กรุณาลองใหม่" };
  }
}
