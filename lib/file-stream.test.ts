import { describe, expect, it } from "vitest";
import { fileETag, parseRangeHeader } from "@/lib/file-stream";

const SIZE = 1000;

describe("parseRangeHeader — ส่งไฟล์เต็ม", () => {
  it("ไม่มีเฮดเดอร์", () => {
    expect(parseRangeHeader(null, SIZE)).toBeNull();
  });

  it("หน่วยที่ไม่ใช่ bytes หรือรูปแบบที่อ่านไม่ออก", () => {
    expect(parseRangeHeader("items=0-10", SIZE)).toBeNull();
    expect(parseRangeHeader("bytes=abc", SIZE)).toBeNull();
    expect(parseRangeHeader("bytes=-", SIZE)).toBeNull();
  });

  it("multipart range ที่ไม่รองรับ ตอบไฟล์เต็มแทนการพัง", () => {
    expect(parseRangeHeader("bytes=0-99,200-299", SIZE)).toBeNull();
  });
});

describe("parseRangeHeader — ช่วงที่ใช้ได้", () => {
  it("ช่วงที่ระบุครบทั้งต้นและท้าย", () => {
    expect(parseRangeHeader("bytes=0-1023", SIZE)).toEqual({ start: 0, end: 999 });
    expect(parseRangeHeader("bytes=100-199", SIZE)).toEqual({ start: 100, end: 199 });
  });

  it("เปิดปลาย ให้ส่งจนจบไฟล์", () => {
    expect(parseRangeHeader("bytes=500-", SIZE)).toEqual({ start: 500, end: 999 });
  });

  it("นับจากท้ายไฟล์", () => {
    expect(parseRangeHeader("bytes=-200", SIZE)).toEqual({ start: 800, end: 999 });
  });

  it("ขอท้ายไฟล์ยาวกว่าตัวไฟล์ ได้ทั้งไฟล์", () => {
    expect(parseRangeHeader("bytes=-5000", SIZE)).toEqual({ start: 0, end: 999 });
  });

  it("ตัดช่องว่างรอบเฮดเดอร์", () => {
    expect(parseRangeHeader("  bytes=0-9  ", SIZE)).toEqual({ start: 0, end: 9 });
  });
});

describe("parseRangeHeader — ช่วงที่ไม่มีอยู่จริง", () => {
  it("เริ่มเลยขนาดไฟล์", () => {
    expect(parseRangeHeader("bytes=1000-1200", SIZE)).toBe("unsatisfiable");
  });

  it("ท้ายอยู่ก่อนต้น", () => {
    expect(parseRangeHeader("bytes=500-100", SIZE)).toBe("unsatisfiable");
  });

  it("ขอศูนย์ไบต์จากท้ายไฟล์", () => {
    expect(parseRangeHeader("bytes=-0", SIZE)).toBe("unsatisfiable");
  });
});

describe("fileETag", () => {
  it("เปลี่ยนเมื่อขนาดหรือเวลาแก้ไขเปลี่ยน", () => {
    const base = fileETag(1000, 1_700_000_000_000);
    expect(fileETag(1000, 1_700_000_000_000)).toBe(base);
    expect(fileETag(1001, 1_700_000_000_000)).not.toBe(base);
    expect(fileETag(1000, 1_700_000_001_000)).not.toBe(base);
  });

  it("เป็น weak validator ตามรูปแบบของ HTTP", () => {
    expect(fileETag(16, 256)).toBe('W/"10-100"');
  });
});
