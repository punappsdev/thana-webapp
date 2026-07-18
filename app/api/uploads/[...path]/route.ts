import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

  // Resolve the safe path
  const relativePath = path.join(...filePathArray);
  const absolutePath = path.resolve(uploadDir, relativePath);

  // Prevent Directory Traversal Vulnerability
  const resolvedUploadDir = path.resolve(uploadDir);
  if (!absolutePath.startsWith(resolvedUploadDir)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(absolutePath)) {
    return new NextResponse("File Not Found", { status: 404 });
  }

  const stat = fs.statSync(absolutePath);
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

  const fileBuffer = fs.readFileSync(absolutePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": stat.size.toString(),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
