import { BRANCH_CODES, type BranchCode } from "@/lib/branches";

/**
 * ตั้งค่า LINE Messaging API อ่านจาก environment ตรง ๆ แบบเดียวกับ lib/prisma.ts
 * และ lib/seo.ts — โปรเจกต์นี้ไม่มีชั้น env schema
 *
 * ต่างจาก DATABASE_URL ตรงที่ **ไม่ throw** เมื่อค่าหาย เพราะการแจ้งเตือนเป็นแค่
 * ส่วนเสริมของการรับคำขอ เครื่อง dev หรือ staging ที่ยังไม่มี token ต้องยังรับ
 * ใบเสนอราคาได้ตามปกติ ผู้เรียกจะได้ null แล้วข้ามการส่งไป
 */
export type LineConfig = {
  accessToken: string;
  /** Partial เพราะกลุ่มของบางสาขาอาจยังไม่ได้ตั้งค่า สาขาที่เหลือต้องยังส่งได้ */
  groupIds: Partial<Record<BranchCode, string>>;
};

const GROUP_ID_ENV_KEYS: Record<BranchCode, string> = {
  headquarters: "LINE_GROUP_ID_HEADQUARTERS",
  thalang: "LINE_GROUP_ID_THALANG",
};

/** ชื่อ env ของกลุ่มแต่ละสาขา ใช้ในข้อความ log ตอนตั้งค่าไม่ครบ */
export function lineGroupEnvKey(branch: BranchCode): string {
  return GROUP_ID_ENV_KEYS[branch];
}

export function getLineConfig(): LineConfig | null {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!accessToken) return null;

  const groupIds: Partial<Record<BranchCode, string>> = {};
  for (const branch of BRANCH_CODES) {
    const groupId = process.env[GROUP_ID_ENV_KEYS[branch]]?.trim();
    // กลุ่มของสาขาใดสาขาหนึ่งหายก็ยังส่งสาขาที่เหลือได้ ไม่ต้องล้มทั้งชุด
    if (groupId) groupIds[branch] = groupId;
  }
  if (Object.keys(groupIds).length === 0) return null;

  return { accessToken, groupIds };
}
