import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { NextRequest, NextResponse } from "next/server";
import type { MediaKind } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { countMediaReferences, unlinkMediaAsset } from "@/lib/admin/media";
import { resolveUploadPath, validateUploadMetadata } from "@/lib/admin/security";
import { getPrisma } from "@/lib/prisma";

const extensionByMime: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

export async function POST(request: NextRequest) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); }
  const uploadDir = process.env.UPLOAD_DIR;
  if (!uploadDir) return NextResponse.json({ message: "UPLOAD_DIR is not configured" }, { status: 500 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ message: "กรุณาเลือกไฟล์" }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) return NextResponse.json({ message: "ไม่สามารถตรวจสอบชนิดไฟล์ได้" }, { status: 400 });
  const validation = validateUploadMetadata(detected.mime, buffer.length);
  if (!validation.ok) return NextResponse.json({ message: validation.message }, { status: 400 });

  const now = new Date();
  const relativeDir = path.join("media", String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
  const fileName = `${crypto.randomUUID()}.${extensionByMime[detected.mime]}`;
  const relativePath = path.join(relativeDir, fileName);
  const absolutePath = resolveUploadPath(uploadDir, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer, { flag: "wx" });
  const url = `/api/uploads/${relativePath.split(path.sep).map(encodeURIComponent).join("/")}`;
  try {
    const asset = await getPrisma().mediaAsset.create({ data: { path: relativePath, url, originalName: file.name.slice(0, 255), mimeType: detected.mime, kind: validation.kind, size: buffer.length, uploadedById: admin.id } });
    await recordActivity({ adminId: admin.id, action: "UPLOAD", entityType: "MediaAsset", entityId: asset.id, label: file.name, metadata: { mimeType: detected.mime, size: buffer.length } });
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    await fs.unlink(absolutePath).catch(() => undefined);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); }
  const { searchParams } = new URL(request.url);
  const kindParam = searchParams.get("kind");
  const query = searchParams.get("query")?.trim() || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const take = 24;
  const kinds: MediaKind[] = kindParam === "image" ? ["IMAGE"] : kindParam === "pdf" ? ["PDF"] : ["IMAGE", "PDF"];
  const where = {
    kind: { in: kinds },
    ...(query ? { OR: [{ originalName: { contains: query } }, { url: { contains: query } }] } : {}),
  };
  const [items, total] = await Promise.all([
    getPrisma().mediaAsset.findMany({ where, skip: (page - 1) * take, take, orderBy: { createdAt: "desc" }, select: { id: true, url: true, originalName: true, kind: true, size: true } }),
    getPrisma().mediaAsset.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, totalPages: Math.max(1, Math.ceil(total / take)) });
}

export async function DELETE(request: NextRequest) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); }
  const body = await request.json().catch(() => ({})) as { id?: string };
  if (!body.id) return NextResponse.json({ message: "Invalid media id" }, { status: 400 });
  const asset = await getPrisma().mediaAsset.findUnique({ where: { id: body.id } });
  if (!asset) return NextResponse.json({ message: "ไม่พบไฟล์" }, { status: 404 });
  if (await countMediaReferences(asset.url)) return NextResponse.json({ message: "ไฟล์นี้กำลังถูกใช้งาน จึงไม่สามารถลบได้" }, { status: 409 });
  await unlinkMediaAsset(asset);
  await recordActivity({ adminId: admin.id, action: "DELETE", entityType: "MediaAsset", entityId: asset.id, label: asset.originalName });
  return NextResponse.json({ success: true });
}
