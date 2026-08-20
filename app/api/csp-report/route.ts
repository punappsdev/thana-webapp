import { NextResponse } from "next/server";

/**
 * Endpoint รับรายงาน CSP (report-only) จากเบราว์เซอร์
 *
 * ระหว่างช่วงที่ CSP ยังเป็น report-only เบราว์เซอร์จะ POST รายงาน violation
 * มาให้ endpoint นี้ (กำหนดไว้ใน next.config.ts → report-uri) เพื่อให้เห็นว่า
 * policy อันไหนจะพังถ้าสลับเป็น enforce ไฟล์นี้ log ลง server console เท่านั้น
 * ไม่เก็บลง DB ไม่ตอบอะไรกลับ — จงใจปล่อยสาธารณะโดยไม่ต้อง auth เพราะ report
 * มาจากเบราว์เซอร์ของผู้เข้าชมทั่วไป ไม่ใช่ข้อมูลลับ
 *
 * เมื่อพร้อมสลับเป็น enforce แล้ว ควรต่อ collector จริง (เช่น datadog/self-host)
 * และลบ endpoint นี้ทิ้ง
 */
export async function POST(request: Request) {
  try {
    const report = await request.json();
    const blocked = report?.["csp-report"] ?? report;
    console.warn(
      "[csp-report] blocked-uri=%s violated-directive=%s document-uri=%s",
      blocked?.["blocked-uri"] ?? "-",
      blocked?.["violated-directive"] ?? "-",
      blocked?.["document-uri"] ?? "-",
    );
  } catch {
    // body อ่านไม่ออกหรือไม่ใช่ JSON — ไม่มีอะไรต้องทำ ปล่อยผ่าน
  }
  return new NextResponse(null, { status: 204 });
}
