import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isValidLineSignature } from "@/lib/line/signature";

const SECRET = "channel-secret-for-tests";

function sign(body: string, secret = SECRET): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

describe("isValidLineSignature", () => {
  const body = JSON.stringify({ events: [{ type: "join", source: { groupId: "C123" } }] });

  it("ยอมรับลายเซ็นที่เซ็นด้วย channel secret เดียวกัน", () => {
    expect(isValidLineSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("ปฏิเสธเมื่อ body ถูกแก้หลังเซ็น", () => {
    expect(isValidLineSignature(`${body} `, sign(body), SECRET)).toBe(false);
  });

  it("ปฏิเสธลายเซ็นที่มาจาก secret อื่น", () => {
    expect(isValidLineSignature(body, sign(body, "another-secret"), SECRET)).toBe(false);
  });

  it("ปฏิเสธเมื่อไม่มี header หรือไม่มี secret", () => {
    expect(isValidLineSignature(body, null, SECRET)).toBe(false);
    expect(isValidLineSignature(body, undefined, SECRET)).toBe(false);
    expect(isValidLineSignature(body, "", SECRET)).toBe(false);
    expect(isValidLineSignature(body, sign(body), "")).toBe(false);
  });

  it("ไม่โยน error เมื่อความยาวลายเซ็นไม่เท่ากับ digest", () => {
    // timingSafeEqual โยน RangeError ถ้าความยาวต่างกัน ต้องถูกกันไว้ก่อน
    expect(() => isValidLineSignature(body, "c2hvcnQ=", SECRET)).not.toThrow();
    expect(isValidLineSignature(body, "c2hvcnQ=", SECRET)).toBe(false);
    expect(isValidLineSignature(body, "ไม่ใช่ base64 เลย", SECRET)).toBe(false);
  });
});
