import fs from "node:fs/promises";
import { Readable } from "node:stream";

export type ByteRange = { start: number; end: number };

/**
 * ไฟล์ที่เปิดค้างไว้แล้ว พร้อมข้อมูล stat ที่อ่านมาจาก file descriptor เดียวกัน
 *
 * ต้องเรียก `stream()` หรือ `close()` อย่างใดอย่างหนึ่งเสมอ ไม่งั้น fd จะรั่ว
 */
export type OpenFile = {
  size: number;
  mtime: Date;
  mtimeMs: number;
  /** สร้าง response body — ปิด fd ให้เองทั้งตอนส่งจบและตอนลูกค้ายกเลิกกลางคัน */
  stream: (range?: ByteRange) => ReadableStream<Uint8Array>;
  /** ใช้เมื่อตัดสินใจไม่ส่งตัวไฟล์ เช่นตอบ 304 หรือ 416 */
  close: () => Promise<void>;
};

/**
 * เปิดไฟล์เพื่อส่งออกแบบ stream แทนการอ่านทั้งก้อนเข้าหน่วยความจำ
 *
 * `fs.readFile` จะกิน RAM เท่าขนาดไฟล์ต่อหนึ่งคำขอ ซึ่งบน VPS เล็กที่มีคนโหลด PDF
 * แคตตาล็อก 25 MB พร้อมกันหลายคนจะพุ่งเร็วมาก การ stream ปล่อยทีละ chunk จึงใช้
 * หน่วยความจำคงที่ไม่ว่าไฟล์จะใหญ่แค่ไหน
 *
 * ที่ต้องเปิด fd ให้เสร็จก่อนคืนค่า แทนที่จะเรียก createReadStream(path) ตอนสร้าง
 * response คือเพื่อให้ความล้มเหลวเกิด "ก่อน" ส่ง header ออกไป — ถ้าเปิดไฟล์พลาดหลัง
 * ตอบ 200 ไปแล้ว ลูกค้าจะได้ body ขาด ๆ พร้อม Content-Length ที่ไม่มีวันครบ แทนที่จะ
 * ได้ 404 ที่อ่านรู้เรื่อง ซึ่งเกิดได้จริงเมื่อ cron ของ retention หรือ sweep-uploads
 * ลบไฟล์พอดีระหว่างที่มีคนกำลังโหลด
 *
 * ผลพลอยได้คือ stat มาจาก fd เดียวกับที่อ่าน Content-Length และ ETag จึงบรรยาย
 * ไบต์ชุดที่ถูกส่งออกไปจริงเสมอ ต่อให้ไฟล์ถูกเขียนทับระหว่างนั้น
 *
 * Next รองรับการคืน Web ReadableStream ตรง ๆ จาก route handler
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md
 * หัวข้อ Streaming) แต่ createReadStream ให้ Node stream มา จึงต้องแปลงก่อน
 *
 * ไฟล์นี้ไม่ประกาศ "server-only" เพราะ vitest resolve แพ็กเกจนั้นไม่ได้ (Next เป็นคน
 * alias ให้ตอน build เท่านั้น) การ import node:fs ก็กันไม่ให้ไปโผล่ฝั่ง client อยู่แล้ว
 */
export async function openFile(absolutePath: string): Promise<OpenFile | null> {
  let handle;
  try {
    handle = await fs.open(absolutePath, "r");
  } catch {
    return null;
  }

  try {
    const stat = await handle.stat();
    // เปิดไดเรกทอรีด้วยโหมด "r" สำเร็จบน Linux แต่อ่านไม่ได้ จึงต้องกันตรงนี้
    if (!stat.isFile()) {
      await handle.close();
      return null;
    }

    return {
      size: stat.size,
      mtime: stat.mtime,
      mtimeMs: stat.mtimeMs,
      // FileHandle.createReadStream ปิด fd ให้เองทั้งตอน stream จบและตอนถูก destroy
      // ส่วน Readable.toWeb จะ destroy ต้นทางเมื่อฝั่งรับ cancel — ลูกค้าที่กดหยุด
      // ดาวน์โหลดกลางคันจึงไม่ทิ้ง fd ค้างไว้
      stream: (range) =>
        Readable.toWeb(handle.createReadStream(range)) as ReadableStream<Uint8Array>,
      close: () => handle.close(),
    };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

/**
 * อ่านเฮดเดอร์ Range ของ HTTP รองรับสามรูปแบบที่เบราว์เซอร์ใช้จริง:
 * `bytes=0-1023`, `bytes=1024-` และ `bytes=-512` (ท้ายไฟล์)
 *
 * คืน `null` เมื่อไม่มีเฮดเดอร์หรืออ่านไม่ออก (ให้ส่งไฟล์เต็ม) และคืน
 * `"unsatisfiable"` เมื่อช่วงที่ขอไม่มีอยู่จริง ซึ่งต้องตอบ 416 ตามสเปก
 *
 * ไม่รองรับ multipart range (`bytes=0-99,200-299`) โดยตั้งใจ — เบราว์เซอร์แทบไม่ส่ง
 * และการตอบไฟล์เต็มเป็นพฤติกรรมที่ถูกต้องเสมอ
 */
export function parseRangeHeader(
  header: string | null,
  size: number,
): ByteRange | null | "unsatisfiable" {
  if (!header) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return null;

  if (rawStart === "") {
    const suffixLength = Number(rawEnd);
    if (suffixLength === 0) return "unsatisfiable";
    return { start: Math.max(0, size - suffixLength), end: size - 1 };
  }

  const start = Number(rawStart);
  if (start >= size) return "unsatisfiable";

  const end = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
  if (end < start) return "unsatisfiable";

  return { start, end };
}

/** ตัวระบุเวอร์ชันไฟล์แบบ weak — ขนาดกับเวลาแก้ไขพอแยกไฟล์คนละเวอร์ชันได้แล้ว */
export function fileETag(size: number, mtimeMs: number): string {
  return `W/"${size.toString(16)}-${Math.floor(mtimeMs).toString(16)}"`;
}
