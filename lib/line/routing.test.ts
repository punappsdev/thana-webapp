import { describe, expect, it } from "vitest";
import { findDistrict } from "@/lib/districts";
import {
  resolveSaleGroup,
  type RoutingConfig,
  type RoutingInput,
  type RoutingItem,
} from "@/lib/line/routing";

/**
 * id สมมติที่แทนค่าจริงในฐานข้อมูล — เทสต์สนใจแค่ว่ากฎอ่าน config ถูกต้องหรือไม่
 * ไม่ได้ผูกกับหมวดหรือสินค้าตัวใดตัวหนึ่ง
 */
const GLASS_CATEGORY = 1;
const HARDWARE_CATEGORY = 2;
const CLEAR_FLOAT_SUB = 10;
const DECORATE_GLASS_SUB = 11;
const PATTERNED_SUB = 12;
/** สินค้าที่โรงงานรับทำเสมอ แม้อยู่ในหมวดย่อยที่ยกเว้น (เดิมคือกระจกพ่นทราย) */
const ALWAYS_FACTORY_PRODUCT = 100;
/** สินค้าที่โรงงานไม่รับทำเสมอ (เดิมคือกระจกลายดอกพิกุลเศรษฐี) */
const NEVER_FACTORY_PRODUCT = 101;

/** ค่าตั้งต้นที่ migration เติมไว้ให้ = กฎชุดเดิมก่อนย้ายค่ามาไว้ในฐานข้อมูล */
const config: RoutingConfig = {
  hqDistrictCodes: ["8301", "8302"], // อ.เมืองภูเก็ต, อ.กะทู้
  factoryCategoryIds: [GLASS_CATEGORY],
  factoryExcludedSubCategoryIds: [DECORATE_GLASS_SUB],
  factoryIncludedProductIds: [ALWAYS_FACTORY_PRODUCT],
  factoryExcludedProductIds: [NEVER_FACTORY_PRODUCT],
};

/** กระจกที่โรงงานรับทำตามปกติ */
function glass(overrides: Partial<RoutingItem> = {}): RoutingItem {
  return {
    productId: 1,
    categoryId: GLASS_CATEGORY,
    subCategoryId: CLEAR_FLOAT_SUB,
    ...overrides,
  };
}

function hardware(): RoutingItem {
  return { productId: 2, categoryId: HARDWARE_CATEGORY, subCategoryId: 20 };
}

/** จัดส่งไปพังงา = นอกพื้นที่ที่สำนักงานใหญ่ดูแล */
function delivery(overrides: Partial<RoutingInput> = {}): RoutingInput {
  return {
    needDelivery: true,
    // คำขอแบบจัดส่งไม่มีสาขาที่ลูกค้าเลือก กฎข้อ 2-4 ต้องตัดสินได้โดยไม่ใช้ค่านี้
    contactBranch: null,
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
        config,
      );
      expect(decision.group).toBe(branch);
      expect(decision.reason).toContain("รับสินค้าเอง");
    }
  });

  it("ไม่ส่งเข้าโรงงานแม้สินค้าจะเข้าเกณฑ์ทั้งใบ — ข้อ 1 มาก่อน", () => {
    expect(
      resolveSaleGroup(
        delivery({
          needDelivery: false,
          contactBranch: "thalang",
          deliveryProvince: null,
          deliveryDistrict: null,
          items: [glass(), glass({ productId: 3, subCategoryId: 13 })],
        }),
        config,
      ).group,
    ).toBe("thalang");
  });

  it("ใช้สำนักงานใหญ่เมื่อค่าสาขาในฐานข้อมูลอ่านไม่ออก", () => {
    expect(
      resolveSaleGroup(delivery({ needDelivery: false, contactBranch: "สาขาที่ปิดไปแล้ว" }), config).group,
    ).toBe("headquarters");
  });

  it("ใช้สำนักงานใหญ่เมื่อไม่มีค่าสาขาเลย — ไม่ควรเกิดจากฟอร์ม แต่ต้องไม่พัง", () => {
    expect(
      resolveSaleGroup(delivery({ needDelivery: false, contactBranch: null }), config).group,
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
      config,
    );
    expect(decision.group).toBe("headquarters");
    expect(decision.reason).toContain("ภูเก็ต");
  });

  it("ชนะกฎสินค้าโรงงาน แม้ทั้งใบจะเข้าเกณฑ์", () => {
    expect(
      resolveSaleGroup(
        delivery({
          deliveryProvince: "phuket",
          deliveryDistrict: "กะทู้",
          items: [glass(), glass({ productId: 3, subCategoryId: 14 })],
        }),
        config,
      ).group,
    ).toBe("headquarters");
  });

  it("ไม่นับอำเภอชื่อเดียวกันในจังหวัดอื่น", () => {
    // "เมืองภูเก็ต" ไม่มีอยู่ในพังงา จึงหาไม่เจอและตกไปกฎถัดไป
    expect(
      resolveSaleGroup(
        delivery({ deliveryProvince: "phang-nga", deliveryDistrict: "เมืองภูเก็ต", items: [hardware()] }),
        config,
      ).group,
    ).toBe("thalang");
  });

  it("ตั้งอำเภอนอกภูเก็ตให้สำนักงานใหญ่ดูแลได้ ไม่ผูกกับจังหวัดใดจังหวัดหนึ่ง", () => {
    const takuaThung = findDistrict("phang-nga", "ตะกั่วทุ่ง");
    expect(takuaThung).not.toBeNull();

    const decision = resolveSaleGroup(delivery({ items: [hardware()] }), {
      ...config,
      hqDistrictCodes: [takuaThung!.code],
    });
    expect(decision.group).toBe("headquarters");
    expect(decision.reason).toContain("พังงา");
  });

  it("ไม่มีอำเภอไหนถูกกำหนดไว้ ทุกใบก็ข้ามข้อ 2 ไป", () => {
    expect(
      resolveSaleGroup(
        delivery({ deliveryProvince: "phuket", deliveryDistrict: "เมืองภูเก็ต", items: [hardware()] }),
        { ...config, hqDistrictCodes: [] },
      ).group,
    ).toBe("thalang");
  });
});

describe("resolveSaleGroup — ข้อ 3 สินค้าเกณฑ์โรงงานทั้งใบ", () => {
  it("ส่งเข้าโรงงานเมื่อเข้าเกณฑ์ล้วนและอยู่นอกพื้นที่ข้อ 2", () => {
    const decision = resolveSaleGroup(
      delivery({
        items: [
          glass(),
          glass({ productId: 3, subCategoryId: 13 }),
          glass({ productId: 4, subCategoryId: 14 }),
        ],
      }),
      config,
    );
    expect(decision.group).toBe("factory");
    expect(decision.reason).toContain("โรงงาน");
  });

  it("นับ อ.ถลาง จ.ภูเก็ต เป็นนอกพื้นที่ข้อ 2 ด้วย", () => {
    expect(
      resolveSaleGroup(delivery({ deliveryProvince: "phuket", deliveryDistrict: "ถลาง" }), config).group,
    ).toBe("factory");
  });

  it("ไม่ส่งโรงงานเมื่อมีสินค้าจากหมวดย่อยที่ยกเว้นปนอยู่", () => {
    expect(
      resolveSaleGroup(
        delivery({ items: [glass(), glass({ productId: 3, subCategoryId: DECORATE_GLASS_SUB })] }),
        config,
      ).group,
    ).toBe("thalang");
  });

  it("สินค้าที่ตั้งว่ารับเสมออยู่ในหมวดย่อยที่ยกเว้นแต่ยังส่งโรงงาน", () => {
    expect(
      resolveSaleGroup(
        delivery({
          items: [glass({ productId: ALWAYS_FACTORY_PRODUCT, subCategoryId: DECORATE_GLASS_SUB })],
        }),
        config,
      ).group,
    ).toBe("factory");
  });

  it("สินค้าที่ตั้งว่ารับเสมอรวมกับสินค้าเข้าเกณฑ์ตัวอื่นก็ยังส่งโรงงาน", () => {
    expect(
      resolveSaleGroup(
        delivery({
          items: [
            glass(),
            glass({ productId: ALWAYS_FACTORY_PRODUCT, subCategoryId: DECORATE_GLASS_SUB }),
          ],
        }),
        config,
      ).group,
    ).toBe("factory");
  });

  it("สินค้าที่ตั้งว่าไม่รับทำไม่ส่งโรงงานแม้จะอยู่ในหมวดที่โรงงานรับ", () => {
    expect(
      resolveSaleGroup(
        delivery({
          items: [glass({ productId: NEVER_FACTORY_PRODUCT, subCategoryId: PATTERNED_SUB })],
        }),
        config,
      ).group,
    ).toBe("thalang");
  });

  it("สินค้าที่ตั้งว่าไม่รับทำปนกับสินค้าเข้าเกณฑ์ ทำให้ทั้งใบตกไปถลาง", () => {
    expect(
      resolveSaleGroup(
        delivery({
          items: [glass(), glass({ productId: NEVER_FACTORY_PRODUCT, subCategoryId: PATTERNED_SUB })],
        }),
        config,
      ).group,
    ).toBe("thalang");
  });

  it("ตั้งสินค้าตัวเดียวกันไว้ทั้งสองรายการ ให้ 'ไม่รับทำ' ชนะ", () => {
    // หน้าหลังบ้านกันไว้ไม่ให้ตั้งชนกันอยู่แล้ว แต่ค่าที่ขัดกันต้องไม่ทำให้ผลลัพธ์เดาไม่ได้
    expect(
      resolveSaleGroup(delivery({ items: [glass({ productId: ALWAYS_FACTORY_PRODUCT })] }), {
        ...config,
        factoryExcludedProductIds: [ALWAYS_FACTORY_PRODUCT],
      }).group,
    ).toBe("thalang");
  });

  it("ไม่ได้ตั้งหมวดที่โรงงานรับทำไว้เลย ก็ไม่มีใบไหนเข้ากลุ่มโรงงาน", () => {
    expect(
      resolveSaleGroup(delivery({ items: [glass(), glass({ productId: 3 })] }), {
        ...config,
        factoryCategoryIds: [],
      }).group,
    ).toBe("thalang");
  });
});

describe("resolveSaleGroup — ข้อ 4 และเคสมุม", () => {
  it("สินค้าเข้าเกณฑ์ปนสินค้าหมวดอื่นให้ส่งถลาง", () => {
    const decision = resolveSaleGroup(delivery({ items: [glass(), hardware()] }), config);
    expect(decision.group).toBe("thalang");
    expect(decision.reason).toContain("นอก");
  });

  it("สินค้าที่ถูกลบออกจากแคตตาล็อกแล้วอ่านหมวดไม่ได้ จึงไม่นับเป็นสินค้าโรงงาน", () => {
    expect(
      resolveSaleGroup(
        delivery({ items: [{ productId: null, categoryId: null, subCategoryId: null }] }),
        config,
      ).group,
    ).toBe("thalang");
  });

  it("สินค้าที่ยังไม่ได้ผูกหมวดย่อยยังนับเป็นสินค้าโรงงานได้", () => {
    expect(
      resolveSaleGroup(delivery({ items: [glass({ subCategoryId: null })] }), config).group,
    ).toBe("factory");
  });

  it("ชื่ออำเภอที่ไม่รู้จักไม่ทำให้พัง แต่ตกไปกฎถัดไป", () => {
    expect(
      resolveSaleGroup(
        delivery({ deliveryProvince: "phuket", deliveryDistrict: "อำเภอที่ไม่มีจริง", items: [hardware()] }),
        config,
      ).group,
    ).toBe("thalang");
  });

  it("ที่อยู่จัดส่งที่ยังว่างอยู่ก็ยังตัดสินได้", () => {
    expect(
      resolveSaleGroup(
        delivery({ deliveryProvince: null, deliveryDistrict: null, items: [hardware()] }),
        config,
      ).group,
    ).toBe("thalang");
  });

  it("ตะกร้าว่างไม่ถูกนับว่าเป็นสินค้าโรงงานทั้งใบ", () => {
    expect(resolveSaleGroup(delivery({ items: [] }), config).group).toBe("thalang");
  });
});
