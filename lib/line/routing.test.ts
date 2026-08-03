import { describe, expect, it } from "vitest";
import { resolveSaleGroup, type RoutingInput, type RoutingItem } from "@/lib/line/routing";

/** กระจกที่โรงงานรับทำตามปกติ */
function glass(overrides: Partial<RoutingItem> = {}): RoutingItem {
  return {
    categorySlug: "glass",
    subCategorySlug: "clear-float",
    productNameTh: "กระจกใสโฟลต",
    ...overrides,
  };
}

function hardware(): RoutingItem {
  return {
    categorySlug: "installation-hardware",
    subCategorySlug: "handles",
    productNameTh: "มือจับกระจกสแตนเลส เกรด 304",
  };
}

/** จัดส่งไปพังงา = นอกพื้นที่ที่สำนักงานใหญ่ดูแล */
function delivery(overrides: Partial<RoutingInput> = {}): RoutingInput {
  return {
    needDelivery: true,
    contactBranch: "headquarters",
    deliveryProvince: "phang-nga",
    deliveryDistrict: "ตะกั่วทุ่ง",
    items: [glass()],
    ...overrides,
  };
}

describe("resolveSaleGroup — ข้อ 1 รับสินค้าเองที่สาขา", () => {
  it("ส่งเข้ากลุ่มของสาขาที่ลูกค้าเลือก", () => {
    for (const branch of ["headquarters", "thalang"] as const) {
      const decision = resolveSaleGroup(
        delivery({ needDelivery: false, contactBranch: branch, deliveryProvince: null, deliveryDistrict: null }),
      );
      expect(decision.group).toBe(branch);
      expect(decision.reason).toContain("รับสินค้าเอง");
    }
  });

  it("ไม่ส่งเข้าโรงงานแม้สินค้าจะเป็นกระจกเข้าเกณฑ์ทั้งใบ — ข้อ 1 มาก่อน", () => {
    expect(
      resolveSaleGroup(
        delivery({
          needDelivery: false,
          contactBranch: "thalang",
          deliveryProvince: null,
          deliveryDistrict: null,
          items: [glass(), glass({ subCategorySlug: "tempered", productNameTh: "กระจกเทมเปอร์" })],
        }),
      ).group,
    ).toBe("thalang");
  });

  it("ใช้สำนักงานใหญ่เมื่อค่าสาขาในฐานข้อมูลอ่านไม่ออก", () => {
    expect(
      resolveSaleGroup(delivery({ needDelivery: false, contactBranch: "สาขาที่ปิดไปแล้ว" })).group,
    ).toBe("headquarters");
  });
});

describe("resolveSaleGroup — ข้อ 2 จัดส่งในพื้นที่สำนักงานใหญ่", () => {
  // ชื่ออำเภอถูกเก็บเป็นภาษาที่ลูกค้าใช้ตอนกรอก จึงต้องรับได้ทั้งสองภาษา
  it.each([
    ["เมืองภูเก็ต"],
    ["Mueang Phuket"],
    ["กะทู้"],
    ["Kathu"],
  ])("ส่งเข้าสำนักงานใหญ่เมื่อจัดส่งไป %s", (district) => {
    const decision = resolveSaleGroup(
      delivery({ deliveryProvince: "phuket", deliveryDistrict: district }),
    );
    expect(decision.group).toBe("headquarters");
    expect(decision.reason).toContain("ภูเก็ต");
  });

  it("ชนะกฎกระจกโรงงาน แม้ทั้งใบจะเป็นกระจกเข้าเกณฑ์", () => {
    expect(
      resolveSaleGroup(
        delivery({
          deliveryProvince: "phuket",
          deliveryDistrict: "กะทู้",
          items: [glass(), glass({ subCategorySlug: "mirror", productNameTh: "กระจกเงาเคลือบเงิน" })],
        }),
      ).group,
    ).toBe("headquarters");
  });

  it("ไม่นับอำเภอชื่อเดียวกันในจังหวัดอื่น", () => {
    // "เมืองภูเก็ต" ไม่มีอยู่ในพังงา จึงหาไม่เจอและตกไปกฎถัดไป
    expect(
      resolveSaleGroup(
        delivery({ deliveryProvince: "phang-nga", deliveryDistrict: "เมืองภูเก็ต", items: [hardware()] }),
      ).group,
    ).toBe("thalang");
  });
});

describe("resolveSaleGroup — ข้อ 3 กระจกเกณฑ์โรงงานทั้งใบ", () => {
  it("ส่งเข้าโรงงานเมื่อเป็นกระจกเข้าเกณฑ์ล้วนและอยู่นอกพื้นที่ข้อ 2", () => {
    const decision = resolveSaleGroup(
      delivery({
        items: [
          glass(),
          glass({ subCategorySlug: "tempered", productNameTh: "กระจกเทมเปอร์นิรภัย" }),
          glass({ subCategorySlug: "laminated", productNameTh: "กระจกลามิเนต" }),
        ],
      }),
    );
    expect(decision.group).toBe("factory");
    expect(decision.reason).toContain("กระจก");
  });

  it("นับ อ.ถลาง จ.ภูเก็ต เป็นนอกพื้นที่ข้อ 2 ด้วย", () => {
    expect(
      resolveSaleGroup(delivery({ deliveryProvince: "phuket", deliveryDistrict: "ถลาง" })).group,
    ).toBe("factory");
  });

  it("ไม่ส่งโรงงานเมื่อมีกระจกตกแต่งปนอยู่", () => {
    expect(
      resolveSaleGroup(
        delivery({
          items: [glass(), glass({ subCategorySlug: "decorate-glass", productNameTh: "กระจกตกแต่งลายพิเศษ" })],
        }),
      ).group,
    ).toBe("thalang");
  });

  it("กระจกพ่นทรายอยู่ในหมวดกระจกตกแต่งแต่ยังส่งโรงงาน", () => {
    expect(
      resolveSaleGroup(
        delivery({
          items: [glass({ subCategorySlug: "decorate-glass", productNameTh: "กระจกพ่นทราย" })],
        }),
      ).group,
    ).toBe("factory");
  });

  it("กระจกพ่นทรายรวมกับกระจกเข้าเกณฑ์ตัวอื่นก็ยังส่งโรงงาน", () => {
    expect(
      resolveSaleGroup(
        delivery({
          items: [glass(), glass({ subCategorySlug: "decorate-glass", productNameTh: "กระจกพ่นทราย" })],
        }),
      ).group,
    ).toBe("factory");
  });

  it("เทียบชื่อแบบขึ้นต้น จึงครอบรุ่นย่อยของกระจกพ่นทราย", () => {
    expect(
      resolveSaleGroup(
        delivery({
          items: [glass({ subCategorySlug: "decorate-glass", productNameTh: "กระจกพ่นทราย 6 มม. ลายหมอก" })],
        }),
      ).group,
    ).toBe("factory");
  });

  it("กระจกลายดอกพิกุลเศรษฐีไม่ส่งโรงงานแม้จะอยู่ในหมวดกระจก", () => {
    expect(
      resolveSaleGroup(
        delivery({
          items: [glass({ subCategorySlug: "patterned", productNameTh: "กระจกลายดอกพิกุลเศรษฐี" })],
        }),
      ).group,
    ).toBe("thalang");
  });

  it("กระจกลายดอกพิกุลเศรษฐีปนกับกระจกเข้าเกณฑ์ ทำให้ทั้งใบตกไปถลาง", () => {
    expect(
      resolveSaleGroup(
        delivery({
          items: [glass(), glass({ subCategorySlug: "patterned", productNameTh: "กระจกลายดอกพิกุลเศรษฐี" })],
        }),
      ).group,
    ).toBe("thalang");
  });
});

describe("resolveSaleGroup — ข้อ 4 และเคสมุม", () => {
  it("กระจกปนสินค้าหมวดอื่นให้ส่งถลาง", () => {
    const decision = resolveSaleGroup(delivery({ items: [glass(), hardware()] }));
    expect(decision.group).toBe("thalang");
    expect(decision.reason).toContain("นอก");
  });

  it("สินค้าที่ถูกลบออกจากแคตตาล็อกแล้วอ่านหมวดไม่ได้ จึงไม่นับเป็นกระจกโรงงาน", () => {
    expect(
      resolveSaleGroup(
        delivery({ items: [{ categorySlug: null, subCategorySlug: null, productNameTh: null }] }),
      ).group,
    ).toBe("thalang");
  });

  it("ชื่ออำเภอที่ไม่รู้จักไม่ทำให้พัง แต่ตกไปกฎถัดไป", () => {
    expect(
      resolveSaleGroup(
        delivery({ deliveryProvince: "phuket", deliveryDistrict: "อำเภอที่ไม่มีจริง", items: [hardware()] }),
      ).group,
    ).toBe("thalang");
  });

  it("ที่อยู่จัดส่งที่ยังว่างอยู่ก็ยังตัดสินได้", () => {
    expect(
      resolveSaleGroup(
        delivery({ deliveryProvince: null, deliveryDistrict: null, items: [hardware()] }),
      ).group,
    ).toBe("thalang");
  });

  it("ตะกร้าว่างไม่ถูกนับว่าเป็นกระจกโรงงานทั้งใบ", () => {
    expect(resolveSaleGroup(delivery({ items: [] })).group).toBe("thalang");
  });
});
