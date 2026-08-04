import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { resolveUploadPath } from "@/lib/admin/security";
import { fileETag, openFile, parseRangeHeader } from "@/lib/file-stream";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  const filePathArray = params.path;
  const uploadDir = process.env.UPLOAD_DIR;

  if (!uploadDir) {
    return new NextResponse("UPLOAD_DIR environment variable is not set", {
      status: 500,
    });
  }

  const relativePath = path.join(...filePathArray);
  // BOQs are bearer-token downloads only; never expose the private quote
  // attachment directory through the generic public media route.
  const normalizedRelativePath = relativePath.replaceAll("\\", "/").toLowerCase();
  if (normalizedRelativePath === "quote-boq" || normalizedRelativePath.startsWith("quote-boq/")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  let absolutePath: string;
  try {
    absolutePath = resolveUploadPath(uploadDir, relativePath);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // เปิดไฟล์ให้เสร็จก่อนเริ่มประกอบ response เพื่อให้ทุกความล้มเหลวยังตอบเป็นสถานะได้
  const file = await openFile(absolutePath);
  if (!file) {
    return new NextResponse("File Not Found", { status: 404 });
  }

  // Determine file Content-Type
  const ext = path.extname(absolutePath).toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  else if (ext === ".png") contentType = "image/png";
  else if (ext === ".webp") contentType = "image/webp";
  else if (ext === ".gif") contentType = "image/gif";
  else if (ext === ".svg") contentType = "image/svg+xml";
  else if (ext === ".pdf") contentType = "application/pdf";

  const isGeneratedName = /^[0-9a-f]{8}-[0-9a-f-]{27,}\.[a-z0-9]+$/i.test(path.basename(absolutePath));
  const etag = fileETag(file.size, file.mtimeMs);
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Content-Type": contentType,
    ETag: etag,
    "Last-Modified": file.mtime.toUTCString(),
    "Cache-Control": isGeneratedName ? "public, max-age=31536000, immutable" : "public, max-age=3600",
  });

  if (request.nextUrl.searchParams.get("download") === "1") {
    const filename = path.basename(absolutePath).replace(/[\u0000-\u001f\u007f"\\]/g, "_");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  }

  // ไฟล์ที่ไม่ได้ตั้ง immutable (ชื่อไม่ใช่ UUID) จะถูกขอซ้ำทุกชั่วโมง การตอบ 304
  // ตัดการส่งตัวไฟล์ออกไปทั้งก้อนเมื่อเบราว์เซอร์มีสำเนาที่ตรงกันอยู่แล้ว
  if (request.headers.get("if-none-match") === etag) {
    await file.close();
    return new NextResponse(null, { status: 304, headers });
  }

  // เปิด PDF แคตตาล็อกทีละหน้าได้โดยไม่ต้องดึงทั้ง 25 MB และดาวน์โหลดที่หลุดกลางคันโหลดต่อได้
  const range = parseRangeHeader(request.headers.get("range"), file.size);
  if (range === "unsatisfiable") {
    await file.close();
    headers.set("Content-Range", `bytes */${file.size}`);
    return new NextResponse(null, { status: 416, headers });
  }

  if (range) {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${file.size}`);
    headers.set("Content-Length", String(range.end - range.start + 1));
    return new NextResponse(file.stream(range), { status: 206, headers });
  }

  headers.set("Content-Length", String(file.size));
  return new NextResponse(file.stream(), { headers });
}
