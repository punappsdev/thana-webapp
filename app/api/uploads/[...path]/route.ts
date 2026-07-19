import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "path";
import { resolveUploadPath } from "@/lib/admin/security";

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
  let absolutePath: string;
  try {
    absolutePath = resolveUploadPath(uploadDir, relativePath);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let stat;
  try {
    stat = await fs.stat(absolutePath);
  } catch {
    return new NextResponse("File Not Found", { status: 404 });
  }
  if (!stat.isFile()) {
    return new NextResponse("Not a file", { status: 400 });
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

  const fileBuffer = await fs.readFile(absolutePath);
  const isGeneratedName = /^[0-9a-f]{8}-[0-9a-f-]{27,}\.[a-z0-9]+$/i.test(path.basename(absolutePath));

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": stat.size.toString(),
      "Cache-Control": isGeneratedName ? "public, max-age=31536000, immutable" : "public, max-age=3600",
    },
  });
}
