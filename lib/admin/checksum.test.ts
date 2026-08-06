import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { computeChecksum, computeFileChecksum } from "@/lib/admin/checksum";

// สร้างไฟล์ชั่วคราวไว้ทดสอบเวอร์ชันที่อ่านจากดิสก์ (ที่ backfill script ใช้)
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "checksum-test-"));

afterAll(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

async function writeTemp(name: string, contents: Buffer): Promise<string> {
  const filePath = path.join(tempDir, name);
  await fs.writeFile(filePath, contents);
  return filePath;
}

describe("computeChecksum", () => {
  it("ให้ค่าเดิมเสมอสำหรับเนื้อหาเดียวกัน", () => {
    expect(computeChecksum(Buffer.from("thana"))).toBe(computeChecksum(Buffer.from("thana")));
  });

  it("เนื้อหาต่างกันได้ค่าต่างกัน", () => {
    expect(computeChecksum(Buffer.from("thana"))).not.toBe(computeChecksum(Buffer.from("thanaa")));
  });

  it("เป็น sha256 hex 64 ตัวอักษร", () => {
    expect(computeChecksum(Buffer.from(""))).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });
});

describe("computeFileChecksum", () => {
  it("ตรงกับค่าที่คำนวณจาก buffer ตัวเดียวกัน", async () => {
    const contents = Buffer.from("กระจกธนา");
    const filePath = await writeTemp("same.bin", contents);
    await expect(computeFileChecksum(filePath)).resolves.toBe(computeChecksum(contents));
  });

  it("ไฟล์ใหญ่กว่า stream chunk เดียวยังได้ค่าตรงกัน", async () => {
    const contents = Buffer.alloc(256 * 1024, 7);
    const filePath = await writeTemp("large.bin", contents);
    await expect(computeFileChecksum(filePath)).resolves.toBe(computeChecksum(contents));
  });

  it("ไฟล์ที่ไม่มีอยู่จริงต้อง reject ด้วย ENOENT", async () => {
    await expect(computeFileChecksum(path.join(tempDir, "missing.bin"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
