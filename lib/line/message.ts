import { branchLabelTh, saleGroupLabelTh, type SaleGroupCode } from "@/lib/branches";
import { isOutsidePhuket, provinceName } from "@/lib/provinces";

/**
 * ประกอบ Flex Message ของคำขอใบเสนอราคาเพื่อส่งเข้ากลุ่ม LINE ของสาขา
 *
 * หลักการ: **ส่งข้อมูลของคำขอครบทุกฟิลด์และทุกรายการ** ทีม Sale ต้องอ่านจบใน
 * ไลน์โดยไม่ต้องเปิดหลังบ้าน ไม่มีการตัดเหลือ "และอีก N รายการ" — เมื่อรายการยาว
 * เกินเพดานของ LINE จะ **แบ่งเป็นการ์ดใบถัดไป** แทนการย่อ (ดู splitIntoBubbles)
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ล้วน (ไม่แตะ env ไม่แตะ network ไม่แตะ Prisma)
 * จึงเทสต์ได้ตรง ๆ ตามคู่ auth.ts / auth-policy.ts ของโปรเจกต์นี้
 */

// ---------------------------------------------------------------------------
// ชนิดข้อมูลของ Flex Message เท่าที่การ์ดใบนี้ใช้
// เขียนเองแทนการลง @line/bot-sdk เพราะต้องการแค่ payload JSON ชุดเดียว
// ---------------------------------------------------------------------------

type FlexText = {
  type: "text";
  text: string;
  size?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  weight?: "regular" | "bold";
  wrap?: boolean;
  align?: "start" | "center" | "end";
  flex?: number;
  margin?: FlexSpacing;
};

type FlexSpacing = "none" | "xs" | "sm" | "md" | "lg" | "xl";

type FlexSeparator = { type: "separator"; margin?: FlexSpacing; color?: string };

type FlexButton = {
  type: "button";
  action: { type: "uri"; label: string; uri: string };
  style?: "primary" | "secondary" | "link";
  color?: string;
  margin?: FlexSpacing;
};

type FlexBox = {
  type: "box";
  layout: "vertical" | "horizontal";
  contents: FlexComponent[];
  spacing?: FlexSpacing;
  margin?: FlexSpacing;
  paddingAll?: string;
  backgroundColor?: string;
  cornerRadius?: string;
  flex?: number;
};

type FlexComponent = FlexBox | FlexText | FlexSeparator | FlexButton;

type FlexBubble = {
  type: "bubble";
  size?: "nano" | "micro" | "kilo" | "mega" | "giga";
  header?: FlexBox;
  body?: FlexBox;
};

type FlexContainer = FlexBubble | { type: "carousel"; contents: FlexBubble[] };

export type FlexMessage = { type: "flex"; altText: string; contents: FlexContainer };

// ---------------------------------------------------------------------------
// ข้อมูลนำเข้า — โครงเดียวกับแถว QuotationRequest + items ที่ getQuotationDetail คืนมา
// ประกาศเองแทนการ import type จาก lib/admin/quotation-data.ts เพราะไฟล์นั้นเป็น
// server-only การดึงเข้ามาจะลาก server-only เข้าไฟล์เทสต์ไปด้วย
// ---------------------------------------------------------------------------

export type QuotationNotificationItem = {
  productNameTh: string;
  optionsTh: string | null;
  sku: string | null;
  qty: number;
};

export type QuotationNotification = {
  code: string;
  /** สาขาที่ลูกค้าเลือกไปรับสินค้าเอง null เมื่อเลือกจัดส่ง */
  contactBranch: string | null;
  /** กลุ่มที่ระบบเลือกให้รับเรื่องใบนี้ พร้อมเหตุผล — มาจาก lib/line/routing.ts */
  saleGroup: SaleGroupCode;
  routingReason: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  lineId: string | null;
  locale: string;
  createdAt: Date;
  needTaxInvoice: boolean;
  companyName: string | null;
  taxId: string | null;
  addressLine: string | null;
  subDistrict: string | null;
  district: string | null;
  province: string | null;
  postalCode: string | null;
  needDelivery: boolean;
  deliveryAddressLine: string | null;
  deliverySubDistrict: string | null;
  deliveryDistrict: string | null;
  deliveryProvince: string | null;
  deliveryPostalCode: string | null;
  /** Absolute URL is added by the server-only LINE notifier when a BOQ exists. */
  boqDownloadUrl?: string | null;
  items: QuotationNotificationItem[];
};

// ---------------------------------------------------------------------------
// เพดานของ LINE (ค่าจริงจากเอกสาร Messaging API) กับงบที่เราตั้งให้ต่ำกว่าไว้
// ---------------------------------------------------------------------------

/** JSON ของ Flex หนึ่งข้อความห้ามเกิน 50 KB */
const MESSAGE_JSON_LIMIT = 50_000;
/** carousel หนึ่งใบใส่ได้ไม่เกิน 12 bubble */
const MAX_BUBBLES_PER_CAROUSEL = 12;
/** altText ยาวได้ไม่เกิน 400 ตัวอักษร */
const ALT_TEXT_LIMIT = 400;

/** งบต่อ bubble เผื่อไว้ต่ำกว่าเพดานมาก เพราะ 1 bubble ก็ต้องไม่ทำให้ทั้งข้อความบวม */
const BUBBLE_JSON_BUDGET = 9_000;
/** งบต่อข้อความ เผื่อ overhead ของ altText และ envelope */
const MESSAGE_JSON_BUDGET = 40_000;

const COLOR_PRIMARY = "#002C7D";
const COLOR_TEXT = "#1A1B22";
const COLOR_MUTED = "#434653";
const COLOR_LINE = "#E2E2EB";
const COLOR_ALERT = "#BA1A1A";
/** ตัวหนังสือบนพื้น primary ของหัวการ์ด — primary-container / inverse-primary จาก DESIGN.md */
const COLOR_ON_PRIMARY = "#FFFFFF";
const COLOR_ON_PRIMARY_MUTED = "#B4C5FF";
const COLOR_ON_PRIMARY_SOFT = "#DBE1FF";

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
});

// ---------------------------------------------------------------------------
// ตัวช่วยประกอบ component
// ---------------------------------------------------------------------------

function sectionTitle(text: string): FlexText {
  return { type: "text", text, size: "xs", weight: "bold", color: COLOR_PRIMARY };
}

/** แถว "ป้าย: ค่า" — คืน null เมื่อไม่มีค่า ผู้เรียกกรองทิ้งทีเดียว */
function detailRow(label: string, value: string | null | undefined): FlexBox | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  return {
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    contents: [
      { type: "text", text: label, size: "sm", color: COLOR_MUTED, flex: 3, wrap: true },
      { type: "text", text: trimmed, size: "sm", color: COLOR_TEXT, flex: 7, wrap: true },
    ],
  };
}

function compact(rows: (FlexComponent | null)[]): FlexComponent[] {
  return rows.filter((row): row is FlexComponent => row !== null);
}

/** ประกอบที่อยู่หลายบรรทัดให้เป็นข้อความเดียว ตัดส่วนที่ลูกค้าไม่ได้กรอกออก */
function formatAddress(parts: (string | null)[]): string | null {
  const filled = parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part));
  return filled.length > 0 ? filled.join(" ") : null;
}

/** คำขอแบบจัดส่งไม่มีสาขาให้พูดถึง (`contactBranch` เป็น null) จึงบอกวิธีรับสินค้าแทน */
function fulfillmentLabel(input: QuotationNotification): string {
  return input.needDelivery
    ? "จัดส่งไปยังที่อยู่หน้างาน"
    : `รับสินค้าเองที่${branchLabelTh(input.contactBranch)}`;
}

function itemComponent(item: QuotationNotificationItem, index: number): FlexBox {
  const details = compact([
    { type: "text", text: item.productNameTh, size: "sm", weight: "bold", color: COLOR_TEXT, wrap: true },
    item.optionsTh
      ? ({ type: "text", text: item.optionsTh, size: "xs", color: COLOR_MUTED, wrap: true } satisfies FlexText)
      : null,
    item.sku
      ? ({ type: "text", text: `รหัส ${item.sku}`, size: "xs", color: COLOR_MUTED, wrap: true } satisfies FlexText)
      : null,
  ]);

  return {
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    margin: "md",
    contents: [
      { type: "text", text: `${index}.`, size: "sm", color: COLOR_MUTED, flex: 0 },
      { type: "box", layout: "vertical", spacing: "none", flex: 1, contents: details },
      { type: "text", text: `× ${item.qty}`, size: "sm", weight: "bold", color: COLOR_TEXT, flex: 0, align: "end" },
    ],
  };
}

function header(input: QuotationNotification, continuedLabel: string | null): FlexBox {
  return {
    type: "box",
    layout: "vertical",
    spacing: "xs",
    paddingAll: "16px",
    backgroundColor: COLOR_PRIMARY,
    contents: compact([
      {
        type: "text",
        text: continuedLabel ? `คำขอใบเสนอราคาใหม่ (${continuedLabel})` : "คำขอใบเสนอราคาใหม่",
        size: "xs",
        color: COLOR_ON_PRIMARY_MUTED,
      },
      { type: "text", text: input.code, size: "lg", weight: "bold", color: COLOR_ON_PRIMARY, wrap: true },
      {
        type: "text",
        text: `กลุ่มที่รับเรื่อง: ${saleGroupLabelTh(input.saleGroup)}`,
        size: "sm",
        color: COLOR_ON_PRIMARY_SOFT,
        wrap: true,
      },
      // บอกเหตุผลไว้ในการ์ดเลย เพื่อให้ทีมขายรู้ทันทีว่าทำไมใบนี้ถึงมาเข้ากลุ่มตัวเอง
      {
        type: "text",
        text: input.routingReason,
        size: "xs",
        color: COLOR_ON_PRIMARY_MUTED,
        wrap: true,
      },
    ]),
  };
}

/** กล่องข้อมูลลูกค้า ใบกำกับภาษี และการจัดส่ง — อยู่บน bubble ใบแรกเท่านั้น */
function summaryComponents(input: QuotationNotification): FlexComponent[] {
  const contact = compact([
    detailRow("ส่งเมื่อ", dateFormatter.format(input.createdAt)),
    detailRow("วิธีรับสินค้า", fulfillmentLabel(input)),
    detailRow("ชื่อ-นามสกุล", `${input.firstName} ${input.lastName}`.trim()),
    detailRow("โทรศัพท์", input.phone),
    detailRow("อีเมล", input.email),
    detailRow("LINE ID", input.lineId),
    detailRow("ภาษาที่ลูกค้าใช้", input.locale === "en" ? "English" : "ไทย"),
  ]);

  const taxInvoice = input.needTaxInvoice
    ? compact([
        detailRow("ชื่อบริษัท", input.companyName),
        detailRow("เลขประจำตัวผู้เสียภาษี", input.taxId),
        detailRow(
          "ที่อยู่",
          formatAddress([
            input.addressLine,
            input.subDistrict,
            input.district,
            provinceName(input.province, "th"),
            input.postalCode,
          ]),
        ),
      ])
    : [detailRow("ใบกำกับภาษี", "ไม่ต้องการ")].filter((row): row is FlexBox => row !== null);

  const delivery = input.needDelivery
    ? compact([
        detailRow(
          "ที่อยู่จัดส่ง",
          formatAddress([
            input.deliveryAddressLine,
            input.deliverySubDistrict,
            input.deliveryDistrict,
            provinceName(input.deliveryProvince, "th"),
            input.deliveryPostalCode,
          ]),
        ),
        // เตือนเรื่องค่าส่งด้วยข้อความเดียวกับหน้า /admin/quotations/[id]
        isOutsidePhuket(input.deliveryProvince)
          ? ({
              type: "text",
              text: "จัดส่งนอกจังหวัดภูเก็ต — มีค่าบริการจัดส่ง ยกเว้นกระจกเทมเปอร์และกระจกลามิเนต",
              size: "xs",
              color: COLOR_ALERT,
              wrap: true,
              margin: "sm",
            } satisfies FlexText)
          : null,
      ])
    : [detailRow("จัดส่ง", fulfillmentLabel(input))].filter((row): row is FlexBox => row !== null);

  return [
    sectionTitle("ข้อมูลผู้ติดต่อ"),
    { type: "box", layout: "vertical", spacing: "sm", margin: "sm", contents: contact },
    { type: "separator", margin: "lg", color: COLOR_LINE },
    { ...sectionTitle("ใบกำกับภาษีในนามบริษัท"), margin: "lg" },
    { type: "box", layout: "vertical", spacing: "sm", margin: "sm", contents: taxInvoice },
    { type: "separator", margin: "lg", color: COLOR_LINE },
    { ...sectionTitle("การจัดส่ง"), margin: "lg" },
    { type: "box", layout: "vertical", spacing: "sm", margin: "sm", contents: delivery },
  ];
}

function boqAttachmentComponents(input: QuotationNotification): FlexComponent[] {
  if (!input.boqDownloadUrl) return [];

  return [
    { type: "separator", margin: "lg", color: COLOR_LINE },
    {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      margin: "lg",
      contents: [
        sectionTitle("เอกสาร BOQ"),
        {
          type: "button",
          action: { type: "uri", label: "ดาวน์โหลด BOQ", uri: input.boqDownloadUrl },
          style: "primary",
          color: COLOR_PRIMARY,
        },
      ],
    },
  ];
}

function itemsHeading(input: QuotationNotification): FlexComponent[] {
  const totalQty = input.items.reduce((sum, item) => sum + item.qty, 0);
  return [
    { type: "separator", margin: "lg", color: COLOR_LINE },
    { ...sectionTitle(`รายการสินค้า (${input.items.length} รายการ · รวม ${totalQty} ชิ้น)`), margin: "lg" },
  ];
}

// ---------------------------------------------------------------------------
// การแบ่งการ์ด
// ---------------------------------------------------------------------------

function bubbleFrom(input: QuotationNotification, contents: FlexComponent[], continuedLabel: string | null): FlexBubble {
  return {
    type: "bubble",
    size: "giga",
    header: header(input, continuedLabel),
    body: { type: "box", layout: "vertical", spacing: "none", paddingAll: "16px", contents },
  };
}

function jsonSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

/**
 * ใส่รายการลง bubble ทีละชิ้น เปิดใบใหม่เมื่อ JSON ของใบปัจจุบันใกล้ชนงบ
 * วัดจากขนาดจริงแทนการเดาจำนวนรายการ เพราะชื่อสินค้ากับตัวเลือกยาวไม่เท่ากัน
 * ทุกรายการต้องถูกส่งเสมอ — ตรงนี้คือการแบ่งหน้า ไม่ใช่การตัดทิ้ง
 */
function splitIntoBubbles(input: QuotationNotification): FlexBubble[] {
  const bubbles: FlexBubble[] = [];
  let contents: FlexComponent[] = [
    ...summaryComponents(input),
    ...boqAttachmentComponents(input),
    ...itemsHeading(input),
  ];
  let itemsOnBubble = 0;

  for (const [index, item] of input.items.entries()) {
    const component = itemComponent(item, index + 1);
    const next = [...contents, component];

    // ต้องมีอย่างน้อยหนึ่งรายการต่อใบ ไม่งั้นสินค้าชื่อยาวมากจะวนไม่รู้จบ
    if (itemsOnBubble > 0 && jsonSize(next) > BUBBLE_JSON_BUDGET) {
      bubbles.push(bubbleFrom(input, contents, bubbles.length === 0 ? null : `ต่อ ${bubbles.length + 1}`));
      contents = [{ ...sectionTitle("รายการสินค้า (ต่อ)"), margin: "none" }, component];
      itemsOnBubble = 1;
      continue;
    }

    contents = next;
    itemsOnBubble += 1;
  }

  bubbles.push(bubbleFrom(input, contents, bubbles.length === 0 ? null : `ต่อ ${bubbles.length + 1}`));
  return bubbles;
}

export function buildQuotationAltText(input: QuotationNotification): string {
  const parts = [
    "คำขอใบเสนอราคาใหม่",
    input.code,
    saleGroupLabelTh(input.saleGroup),
    `${input.firstName} ${input.lastName}`.trim(),
    `${input.items.length} รายการ`,
  ];
  return parts.join(" · ").slice(0, ALT_TEXT_LIMIT);
}

/**
 * คืน "อาเรย์ของข้อความ" ไม่ใช่ข้อความเดียว เพราะคำขอที่มีรายการเยอะอาจต้องใช้
 * หลาย carousel ผู้เรียก (notify-quotation.ts) จะทยอย push ให้ครบทุกข้อความ
 */
export function buildQuotationMessages(input: QuotationNotification): FlexMessage[] {
  const altText = buildQuotationAltText(input);
  const bubbles = splitIntoBubbles(input);
  const messages: FlexMessage[] = [];

  let batch: FlexBubble[] = [];
  const flush = () => {
    if (batch.length === 0) return;
    const contents: FlexContainer =
      batch.length === 1 ? batch[0] : { type: "carousel", contents: batch };
    messages.push({ type: "flex", altText, contents });
    batch = [];
  };

  for (const bubble of bubbles) {
    const candidate = [...batch, bubble];
    const tooManyBubbles = candidate.length > MAX_BUBBLES_PER_CAROUSEL;
    const tooLarge = jsonSize({ type: "carousel", contents: candidate }) > MESSAGE_JSON_BUDGET;
    if (batch.length > 0 && (tooManyBubbles || tooLarge)) flush();
    batch.push(bubble);
  }
  flush();

  return messages;
}

/** เปิดให้เทสต์ยืนยันว่าไม่มีข้อความไหนชนเพดานจริงของ LINE */
export const LINE_MESSAGE_LIMITS = {
  MESSAGE_JSON_LIMIT,
  MAX_BUBBLES_PER_CAROUSEL,
  ALT_TEXT_LIMIT,
} as const;
