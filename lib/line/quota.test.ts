import { describe, expect, it } from "vitest";
import { startOfThaiMonth, summarizeLineQuota } from "@/lib/line/quota";

describe("summarizeLineQuota — แพ็กเกจไม่จำกัดโควต้า", () => {
  it("ไม่คำนวณเปอร์เซ็นต์และไม่มีจำนวนคงเหลือ", () => {
    const summary = summarizeLineQuota({ type: "none", totalUsage: 12_345 });

    expect(summary.unlimited).toBe(true);
    expect(summary.limit).toBeNull();
    expect(summary.remaining).toBeNull();
    expect(summary.used).toBe(12_345);
    expect(summary.usedPercent).toBe(0);
    expect(summary.level).toBe("ok");
  });

  it("ถือว่าไม่จำกัดเมื่อ LINE บอก limited แต่ไม่ส่ง value มา", () => {
    const summary = summarizeLineQuota({ type: "limited", totalUsage: 40 });

    expect(summary.unlimited).toBe(true);
    expect(summary.used).toBe(40);
  });
});

describe("summarizeLineQuota — โควต้าปกติ", () => {
  it("คำนวณคงเหลือและเปอร์เซ็นต์ที่ใช้ไป", () => {
    const summary = summarizeLineQuota({ type: "limited", value: 500, totalUsage: 137 });

    expect(summary.unlimited).toBe(false);
    expect(summary.limit).toBe(500);
    expect(summary.remaining).toBe(363);
    expect(summary.usedPercent).toBe(27);
    expect(summary.level).toBe("ok");
  });

  it("ยังไม่ได้ส่งอะไรเลยได้ 0%", () => {
    const summary = summarizeLineQuota({ type: "limited", value: 500, totalUsage: 0 });

    expect(summary.usedPercent).toBe(0);
    expect(summary.remaining).toBe(500);
    expect(summary.level).toBe("ok");
  });
});

describe("summarizeLineQuota — ระดับความเร่งด่วน", () => {
  it("ต่ำกว่า 80% ยังปกติ", () => {
    expect(summarizeLineQuota({ type: "limited", value: 100, totalUsage: 79 }).level).toBe("ok");
  });

  it("ถึง 80% พอดีเริ่มเตือน", () => {
    expect(summarizeLineQuota({ type: "limited", value: 100, totalUsage: 80 }).level).toBe("warning");
  });

  it("ถึง 95% พอดีถือว่าวิกฤต", () => {
    expect(summarizeLineQuota({ type: "limited", value: 100, totalUsage: 95 }).level).toBe("critical");
  });

  it("โควต้าหมดพอดีถือว่าวิกฤตแม้ยังไม่ถึง 95%", () => {
    // 4 จาก 5 = 80% แต่ที่นี่ใช้ครบทั้ง 5 จึงต้องเป็น critical จากเงื่อนไข remaining === 0
    const summary = summarizeLineQuota({ type: "limited", value: 5, totalUsage: 5 });

    expect(summary.remaining).toBe(0);
    expect(summary.level).toBe("critical");
  });
});

describe("summarizeLineQuota — ค่าขอบ", () => {
  it("โควต้า 0 ไม่หารด้วยศูนย์", () => {
    const summary = summarizeLineQuota({ type: "limited", value: 0, totalUsage: 0 });

    expect(summary.usedPercent).toBe(100);
    expect(summary.remaining).toBe(0);
    expect(summary.level).toBe("critical");
  });

  it("ใช้เกินโควต้าแล้วคงเหลือไม่ติดลบ และเปอร์เซ็นต์ไม่เกิน 100", () => {
    const summary = summarizeLineQuota({ type: "limited", value: 500, totalUsage: 620 });

    expect(summary.remaining).toBe(0);
    expect(summary.usedPercent).toBe(100);
    expect(summary.level).toBe("critical");
  });

  it("ยอดใช้ติดลบที่ผิดปกติถูกดันขึ้นเป็น 0", () => {
    const summary = summarizeLineQuota({ type: "limited", value: 500, totalUsage: -3 });

    expect(summary.used).toBe(0);
    expect(summary.remaining).toBe(500);
  });
});

describe("startOfThaiMonth", () => {
  it("คืนเที่ยงคืนวันที่ 1 ตามเวลาไทย = 17:00 UTC ของวันสุดท้ายเดือนก่อน", () => {
    expect(startOfThaiMonth(new Date("2026-08-04T04:30:00.000Z")).toISOString()).toBe(
      "2026-07-31T17:00:00.000Z",
    );
  });

  it("เวลา UTC ที่ยังเป็นสิ้นเดือนเก่า แต่ไทยข้ามเดือนไปแล้ว นับเป็นเดือนใหม่", () => {
    // 31 ก.ค. 18:00 UTC = 1 ส.ค. 01:00 ตามเวลาไทย
    expect(startOfThaiMonth(new Date("2026-07-31T18:00:00.000Z")).toISOString()).toBe(
      "2026-07-31T17:00:00.000Z",
    );
  });

  it("ข้ามปีได้ถูกต้อง", () => {
    expect(startOfThaiMonth(new Date("2027-01-10T00:00:00.000Z")).toISOString()).toBe(
      "2026-12-31T17:00:00.000Z",
    );
  });
});
