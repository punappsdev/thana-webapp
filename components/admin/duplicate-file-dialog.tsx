"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type LibraryAsset = {
  id: string;
  url: string;
  originalName: string;
  kind: "IMAGE" | "PDF";
  size: number;
  createdAt?: string;
};

/** Why we stopped: the filename already exists, or the bytes already exist. */
export type DuplicateReason = "name" | "content";

export type DuplicatePrompt = {
  reason: DuplicateReason;
  file: File;
  candidates: LibraryAsset[];
  /** Files still queued behind this one — drives the "do this for the rest" option. */
  remaining: number;
};

export type DuplicateChoice =
  | { action: "reuse"; url: string }
  | { action: "upload" }
  | { action: "skip" };

export function formatFileSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Asks the admin what to do when the file they are uploading already lives in the
 * media library. Reusing the existing file is the recommended answer — every
 * "upload anyway" is another copy of the same bytes on disk.
 */
export function DuplicateFileDialog({
  prompt,
  onResolve,
}: {
  prompt: DuplicatePrompt | null;
  onResolve: (choice: DuplicateChoice, applyToRest: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(prompt)} onOpenChange={(open) => { if (!open && prompt) onResolve({ action: "skip" }, false); }}>
      <DialogContent className="sm:max-w-lg">
        {prompt ? (
          // Keyed so each file in a batch starts from a clean selection.
          <DuplicateBody key={`${prompt.reason}-${prompt.file.name}-${prompt.remaining}`} prompt={prompt} onResolve={onResolve} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DuplicateBody({ prompt, onResolve }: { prompt: DuplicatePrompt; onResolve: (choice: DuplicateChoice, applyToRest: boolean) => void }) {
  const [selectedId, setSelectedId] = useState(prompt.candidates[0]?.id ?? "");
  const [applyToRest, setApplyToRest] = useState(false);
  const preview = useObjectUrl(prompt.file);

  const selected = prompt.candidates.find((asset) => asset.id === selectedId) ?? prompt.candidates[0];

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {prompt.reason === "content" ? "ไฟล์นี้มีอยู่ในคลังไฟล์แล้ว" : "มีไฟล์ชื่อนี้ในคลังไฟล์อยู่แล้ว"}
        </DialogTitle>
        <DialogDescription>
          {prompt.reason === "content"
            ? "เนื้อหาไฟล์ตรงกับไฟล์ที่เคยอัปโหลดไว้ทุกประการ — เลือกใช้ไฟล์เดิมจะช่วยประหยัดพื้นที่เก็บข้อมูล"
            : "ตรวจพบไฟล์ชื่อเดียวกันในคลัง (เนื้อหาอาจไม่เหมือนกัน) — ถ้าเป็นไฟล์เดียวกัน ให้ใช้ไฟล์เดิมจะช่วยประหยัดพื้นที่เก็บข้อมูล"}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="font-label-sm text-muted-foreground">ไฟล์ที่กำลังจะอัปโหลด</p>
          <div className="rounded-lg border bg-muted/20 p-2">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-muted">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="size-full object-contain" />
              ) : (
                <FileText className="size-8 text-muted-foreground" />
              )}
            </div>
            <p className="mt-2 truncate font-body-sm font-medium" title={prompt.file.name}>{prompt.file.name}</p>
            <p className="font-label-sm text-muted-foreground">{formatFileSize(prompt.file.size)}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="font-label-sm text-muted-foreground">
            {prompt.candidates.length > 1 ? `ไฟล์ในคลัง (${prompt.candidates.length} ไฟล์)` : "ไฟล์ที่มีอยู่ในคลัง"}
          </p>
          <div className={cn("space-y-2", prompt.candidates.length > 1 && "max-h-64 overflow-y-auto pr-1")}>
            {prompt.candidates.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedId(asset.id)}
                className={cn(
                  "relative w-full rounded-lg border p-2 text-left transition",
                  asset.id === selected?.id ? "border-primary shadow-blue-sm" : "hover:border-input",
                )}
              >
                {prompt.candidates.length > 1 && asset.id === selected?.id ? (
                  <span className="absolute right-3 top-3 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : null}
                <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-muted">
                  {asset.kind === "IMAGE" ? (
                    <Image src={asset.url} alt={asset.originalName} fill sizes="220px" className="object-contain" unoptimized />
                  ) : (
                    <FileText className="size-8 text-primary" />
                  )}
                </div>
                <p className="mt-2 truncate font-body-sm font-medium" title={asset.originalName}>{asset.originalName}</p>
                <p className="font-label-sm text-muted-foreground">
                  {formatFileSize(asset.size)}
                  {asset.createdAt ? ` · ${new Date(asset.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {prompt.remaining > 0 ? (
        <Label className="flex items-center gap-2 font-label-sm font-normal text-muted-foreground">
          <Checkbox checked={applyToRest} onCheckedChange={(checked) => setApplyToRest(checked === true)} />
          ใช้ตัวเลือกนี้กับไฟล์ที่เหลืออีก {prompt.remaining} ไฟล์
        </Label>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => onResolve({ action: "skip" }, applyToRest)}>
          ข้ามไฟล์นี้
        </Button>
        <Button type="button" variant="outline" onClick={() => onResolve({ action: "upload" }, applyToRest)}>
          อัปโหลดเป็นไฟล์ใหม่
        </Button>
        <Button
          type="button"
          disabled={!selected}
          onClick={() => selected && onResolve({ action: "reuse", url: selected.url }, applyToRest)}
        >
          ใช้ไฟล์เดิม
        </Button>
      </DialogFooter>
    </>
  );
}

/** Object URL for an image preview, revoked as soon as the dialog body goes away. */
function useObjectUrl(file: File): string | null {
  const url = useMemo(() => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}
