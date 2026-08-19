import { describe, expect, it } from "vitest";
import {
  LINE_MESSAGE_LIMITS,
  buildQuotationAltText,
  buildQuotationMessages,
  type QuotationNotification,
  type QuotationNotificationItem,
} from "@/lib/line/message";

function item(overrides: Partial<QuotationNotificationItem> = {}): QuotationNotificationItem {
  return {
    productNameTh: "กระจกเทมเปอร์",
    optionsTh: "ความหนา: 6 มม. · สี: ใส",
    customFieldsTh: null,
    sku: "TG-6-CL",
    qty: 2,
    ...overrides,
  };
}

/** คำขอขั้นต่ำสุดที่ฟอร์มยอมรับ: ไม่มีอีเมล ไม่ออกใบกำกับ ไม่ต้องการจัดส่ง */
function minimalRequest(overrides: Partial<QuotationNotification> = {}): QuotationNotification {
  return {
    code: "QT-20260803-0042",
    contactBranch: "thalang",
    saleGroup: "thalang",
    routingReason: "จัดส่งนอก อ.เมืองภูเก็ต / อ.กะทู้",
    firstName: "สมชาย",
    lastName: "ใจดี",
    phone: "0812345678",
    customerType: "homeowner",
    email: null,
    lineId: "@somchai",
    locale: "th",
    createdAt: new Date("2026-08-03T09:30:00.000Z"),
    needTaxInvoice: false,
    companyName: null,
    taxId: null,
    addressLine: null,
    subDistrict: null,
    district: null,
    province: null,
    postalCode: null,
    needDelivery: false,
    deliveryAddressLine: null,
    deliverySubDistrict: null,
    deliveryDistrict: null,
    deliveryProvince: null,
    deliveryPostalCode: null,
    items: [item()],
    ...overrides,
  };
}

/** คำขอที่กรอกครบทุกช่อง — ใบกำกับภาษีในนามบริษัท และจัดส่งนอกภูเก็ต */
function fullRequest(overrides: Partial<QuotationNotification> = {}): QuotationNotification {
  return minimalRequest({
    email: "somchai@example.com",
    customerType: "corporate",
    needTaxInvoice: true,
    companyName: "บริษัท ตัวอย่าง จำกัด",
    taxId: "0105551234567",
    addressLine: "99/1 หมู่ 4",
    subDistrict: "ฉลอง",
    district: "เมือง",
    province: "phuket",
    postalCode: "83130",
    needDelivery: true,
    // เลือกจัดส่งแล้วฟอร์มไม่ถามสาขา คอลัมน์นี้จึงเป็น null ในฐานข้อมูล
    contactBranch: null,
    deliveryAddressLine: "12 ถนนเพชรเกษม",
    deliverySubDistrict: "โคกกลอย",
    deliveryDistrict: "ตะกั่วทุ่ง",
    deliveryProvince: "phang-nga",
    deliveryPostalCode: "82140",
    ...overrides,
  });
}

/** ข้อความทุกก้อนที่ปรากฏในการ์ด ใช้ยืนยันว่าข้อมูลถูกส่งไปครบ */
function allText(messages: ReturnType<typeof buildQuotationMessages>): string {
  return JSON.stringify(messages);
}

function jsonByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

describe("buildQuotationMessages", () => {
  it("ใส่ข้อมูลของคำขอที่กรอกครบไว้ในการ์ดทุกฟิลด์", () => {
    const text = allText(buildQuotationMessages(fullRequest()));

    for (const expected of [
      "QT-20260803-0042",
      "สาขาถลาง",
      "สมชาย ใจดี",
      "ลูกค้ากลุ่มบริษัท",
      "0812345678",
      "somchai@example.com",
      "@somchai",
      "บริษัท ตัวอย่าง จำกัด",
      "0105551234567",
      "99/1 หมู่ 4",
      "ฉลอง",
      "เมือง",
      "ภูเก็ต",
      "83130",
      "12 ถนนเพชรเกษม",
      "โคกกลอย",
      "ตะกั่วทุ่ง",
      "พังงา",
      "82140",
      "กระจกเทมเปอร์",
      "ความหนา: 6 มม. · สี: ใส",
      "TG-6-CL",
    ]) {
      expect(text).toContain(expected);
    }
  });

  it("บอกกลุ่มปลายทางพร้อมเหตุผลที่ระบบเลือกไว้", () => {
    const text = allText(
      buildQuotationMessages(
        fullRequest({ saleGroup: "factory", routingReason: "สินค้าทั้งใบเป็นกระจกที่โรงงานรับทำ" }),
      ),
    );
    expect(text).toContain("กลุ่มที่รับเรื่อง: สาขาโรงงาน");
    expect(text).toContain("สินค้าทั้งใบเป็นกระจกที่โรงงานรับทำ");
  });

  it("บอกวิธีรับสินค้าแทนสาขาที่ติดต่อ เพราะคำขอแบบจัดส่งลูกค้าไม่ได้เลือกสาขา", () => {
    expect(allText(buildQuotationMessages(fullRequest()))).toContain("จัดส่งไปยังที่อยู่หน้างาน");

    const pickup = allText(
      buildQuotationMessages(minimalRequest({ needDelivery: false, contactBranch: "thalang" })),
    );
    expect(pickup).toContain("รับสินค้าเองที่สาขาถลาง");
  });

  it("เตือนค่าจัดส่งเมื่อจังหวัดปลายทางไม่ใช่ภูเก็ต", () => {
    expect(allText(buildQuotationMessages(fullRequest()))).toContain("จัดส่งนอกจังหวัดภูเก็ต");
    expect(
      allText(buildQuotationMessages(fullRequest({ deliveryProvince: "phuket" }))),
    ).not.toContain("จัดส่งนอกจังหวัดภูเก็ต");
  });

  it("ตัดแถวที่ลูกค้าไม่ได้กรอกทิ้ง ไม่ปล่อยให้มีค่าว่างหรือ null โผล่ในการ์ด", () => {
    const text = allText(buildQuotationMessages(minimalRequest({ lineId: null })));

    expect(text).not.toContain("null");
    expect(text).not.toContain("อีเมล");
    expect(text).not.toContain("LINE ID");
    // ระบุให้ชัดว่าไม่ต้องการ ดีกว่าเงียบไปเฉย ๆ แล้วทีมงานเดาเอง
    expect(text).toContain("ใบกำกับภาษี");
    expect(text).toContain("ไม่ต้องการ");
  });

  it("แสดงยอดรวมจำนวนรายการและจำนวนชิ้น", () => {
    const messages = buildQuotationMessages(
      minimalRequest({ items: [item({ qty: 2 }), item({ qty: 5 }), item({ qty: 1 })] }),
    );
    expect(allText(messages)).toContain("รายการสินค้า (3 รายการ · รวม 8 ชิ้น)");
  });

  it("ส่งรายการครบทุกบรรทัดแม้จะเต็มเพดาน 100 รายการ โดยแบ่งการ์ดแทนการตัดทิ้ง", () => {
    const items = Array.from({ length: 100 }, (_, index) =>
      item({
        // ชื่อและตัวเลือกยาวสุด ๆ ตามที่ schema ยอมให้เก็บ เพื่อบีบให้ต้องแบ่งหลายใบ
        productNameTh: `${index + 1} ${"กระจกนิรภัยเทมเปอร์ลามิเนตสองชั้น".repeat(6)}`,
        optionsTh: "ความหนา: 12 มม. · สี: ชาเข้ม · การเจียร: ขอบมน · ลบมุม: 4 มุม",
        sku: `TG-LONG-SKU-${index + 1}`,
        qty: index + 1,
      }),
    );
    const messages = buildQuotationMessages(minimalRequest({ items }));
    const text = allText(messages);

    // ทุกรายการต้องถึงกลุ่ม ไม่มีคำว่า "และอีก N รายการ"
    for (const line of items) expect(text).toContain(line.sku!);
    expect(text).not.toContain("และอีก");

    for (const message of messages) {
      expect(jsonByteLength(message)).toBeLessThanOrEqual(
        LINE_MESSAGE_LIMITS.MESSAGE_JSON_LIMIT,
      );
      if (message.contents.type === "carousel") {
        expect(message.contents.contents.length).toBeLessThanOrEqual(
          LINE_MESSAGE_LIMITS.MAX_BUBBLES_PER_CAROUSEL,
        );
      }
    }
  });

  it("แสดงขนาดที่ลูกค้ากรอกเองแยกจากตัวเลือกที่เลือกจากรายการ", () => {
    const text = allText(
      buildQuotationMessages(
        minimalRequest({
          items: [
            item({
              optionsTh: "ความหนา: 6 มม. · สี: ใส",
              customFieldsTh: "กว้าง: 1200 มม. · สูง: 2400 มม.",
            }),
          ],
        }),
      ),
    );

    expect(text).toContain("ความหนา: 6 มม. · สี: ใส");
    expect(text).toContain("กว้าง: 1200 มม. · สูง: 2400 มม.");
  });

  it("ไม่ทิ้งบรรทัดว่างไว้เมื่อสินค้าไม่ใช่แบบสั่งตัด", () => {
    const text = allText(buildQuotationMessages(minimalRequest({ items: [item()] })));
    expect(text).not.toContain("null");
  });

  /**
   * เพดานที่ต้องคุมคือ "หนึ่งรายการต้องอยู่ในหนึ่งการ์ดได้" (splitIntoBubbles บังคับ
   * ให้แต่ละใบมีอย่างน้อยหนึ่งรายการ) ค่าที่ลูกค้ากรอกจึงถูกจำกัดที่ VarChar(255)
   * เทสต์นี้ยืนยันว่าแม้ทุกรายการยาวเต็มเพดานทุกช่อง ข้อความก็ยังไม่ชนของจริง
   */
  it("ยังไม่ชนเพดานของ LINE เมื่อทุกรายการมีขนาดกรอกเองยาวเต็ม 255 ตัวอักษร", () => {
    const messages = buildQuotationMessages(
      minimalRequest({
        items: Array.from({ length: 100 }, (_, index) =>
          item({
            productNameTh: `${index + 1} ${"กระจกนิรภัยเทมเปอร์ลามิเนตสองชั้น".repeat(6)}`,
            optionsTh: "ความหนา: 12 มม. · สี: ชาเข้ม · การเจียร: ขอบมน · ลบมุม: 4 มุม",
            customFieldsTh: "ก".repeat(255),
            sku: `CUT-${index + 1}`,
          }),
        ),
      }),
    );

    for (const message of messages) {
      expect(jsonByteLength(message)).toBeLessThanOrEqual(
        LINE_MESSAGE_LIMITS.MESSAGE_JSON_LIMIT,
      );
      if (message.contents.type === "carousel") {
        expect(message.contents.contents.length).toBeLessThanOrEqual(
          LINE_MESSAGE_LIMITS.MAX_BUBBLES_PER_CAROUSEL,
        );
      }
    }
  });

  it("ใช้การ์ดใบเดียวเมื่อรายการไม่เยอะ", () => {
    const messages = buildQuotationMessages(minimalRequest());
    expect(messages).toHaveLength(1);
    expect(messages[0].contents.type).toBe("bubble");
  });

  it("ไม่ใส่ลิงก์ดาวน์โหลดเมื่อคำขอไม่มี BOQ", () => {
    const text = allText(buildQuotationMessages(minimalRequest()));
    expect(text).not.toContain("quotation-attachments");
    expect(text).not.toContain("ดาวน์โหลด BOQ");
  });

  it("ใส่ปุ่มลิงก์ดาวน์โหลด BOQ เมื่อมี URL ของไฟล์", () => {
    const url = "https://www.thana-glass.com/api/quotation-attachments/" + "a".repeat(64);
    const text = allText(buildQuotationMessages(minimalRequest({ boqDownloadUrl: url })));
    expect(text).toContain(url);
    expect(text).toContain("ดาวน์โหลด BOQ");
  });

  it("คงเพดานขนาดและการแบ่งชุดของ LINE เมื่อมีลิงก์ BOQ", () => {
    const messages = buildQuotationMessages(
      minimalRequest({
        boqDownloadUrl: "https://www.thana-glass.com/api/quotation-attachments/" + "b".repeat(64),
        items: Array.from({ length: 100 }, (_, index) =>
          item({
            productNameTh: `${index + 1} ${"กระจกนิรภัยเทมเปอร์ลามิเนต".repeat(8)}`,
            sku: `BOQ-LIMIT-${index + 1}`,
          }),
        ),
      }),
    );

    for (const message of messages) {
      expect(jsonByteLength(message)).toBeLessThanOrEqual(
        LINE_MESSAGE_LIMITS.MESSAGE_JSON_LIMIT,
      );
      if (message.contents.type === "carousel") {
        expect(message.contents.contents.length).toBeLessThanOrEqual(
          LINE_MESSAGE_LIMITS.MAX_BUBBLES_PER_CAROUSEL,
        );
      }
    }
  });

  it("วัดขนาด JSON เป็นไบต์ UTF-8 เพื่อให้ข้อความภาษาไทยไม่เกิน 50,000 ไบต์", () => {
    const messages = buildQuotationMessages(
      minimalRequest({
        items: Array.from({ length: 100 }, (_, index) =>
          item({
            productNameTh: `${index + 1} ${"กระจกนิรภัยเทมเปอร์ลามิเนตสองชั้น".repeat(10)}`,
            optionsTh: "ความหนา: 12 มม. · สี: ชาเข้ม · การเจียร: ขอบมน · ลบมุม: 4 มุม",
            sku: `TH-UTF8-${index + 1}`,
          }),
        ),
      }),
    );

    expect(messages.length).toBeGreaterThan(1);
    for (const message of messages) {
      expect(jsonByteLength(message)).toBeLessThanOrEqual(
        LINE_MESSAGE_LIMITS.MESSAGE_JSON_LIMIT,
      );
    }
  });

  it("ยังส่งได้แม้ contactBranch ในฐานข้อมูลเป็นค่าที่ไม่รู้จัก", () => {
    const text = allText(buildQuotationMessages(minimalRequest({ contactBranch: "ปิดไปแล้ว" })));
    expect(text).toContain("สาขาสำนักงานใหญ่");
  });

  it("ไม่พูดถึงสาขาเลยเมื่อคำขอเป็นแบบจัดส่ง ซึ่ง contactBranch เป็น null", () => {
    const text = allText(buildQuotationMessages(fullRequest()));
    expect(text).toContain("จัดส่งไปยังที่อยู่หน้างาน");
    expect(text).not.toContain("รับสินค้าเองที่");
  });
});

describe("buildQuotationAltText", () => {
  it("สรุปคำขอไว้ในบรรทัดเดียวสำหรับ preview ในลิสต์แชท", () => {
    expect(buildQuotationAltText(fullRequest())).toBe(
      "คำขอใบเสนอราคาใหม่ · QT-20260803-0042 · สาขาถลาง · สมชาย ใจดี · 1 รายการ",
    );
  });

  it("ไม่ยาวเกินเพดาน 400 ตัวอักษรของ LINE", () => {
    const altText = buildQuotationAltText(
      fullRequest({ firstName: "ก".repeat(400), lastName: "ข".repeat(400) }),
    );
    expect(altText.length).toBeLessThanOrEqual(LINE_MESSAGE_LIMITS.ALT_TEXT_LIMIT);
  });
});
