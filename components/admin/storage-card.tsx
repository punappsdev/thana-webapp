import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatBytes,
  getStorageUsage,
  storageLevel,
  type StorageLevel,
  type StorageUsage,
} from "@/lib/admin/storage-usage";
import { QUOTATION_RETENTION_YEARS } from "@/lib/admin/retention";

const numberFormatter = new Intl.NumberFormat("th-TH");
const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });

const LEVEL_BADGE: Record<StorageLevel, { label: string; variant: "default" | "outline" | "destructive" }> = {
  ok: { label: "พื้นที่เพียงพอ", variant: "default" },
  warning: { label: "พื้นที่เริ่มน้อย", variant: "outline" },
  critical: { label: "พื้นที่เหลือน้อยมาก", variant: "destructive" },
};

/** สีแถบเปลี่ยนตอนวิกฤตเท่านั้น ด้วยเหตุผลเดียวกับ LineQuotaCard — ชุดสีไม่มี token สีเตือน */
const LEVEL_BAR: Record<StorageLevel, string> = {
  ok: "",
  warning: "",
  critical: "[&_[data-slot=progress-indicator]]:bg-destructive",
};

/**
 * การ์ดพื้นที่จัดเก็บไฟล์ในหน้าตั้งค่าเว็บไซต์
 *
 * มีไว้ให้เห็นว่าดิสก์ของเซิร์ฟเวอร์ใกล้เต็มก่อนที่การอัปโหลดจะเริ่มล้มเหลว เพราะเมื่อ
 * เขียนไฟล์ไม่ได้ ลูกค้าจะเห็นแค่ข้อความผิดพลาดทั่วไปโดยไม่มีใครรู้ว่าสาเหตุคือดิสก์เต็ม
 */
export async function StorageCard() {
  const usage = await getStorageUsage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>พื้นที่จัดเก็บไฟล์</CardTitle>
        <CardDescription>
          พื้นที่ของไดรฟ์ที่เก็บไฟล์อัปโหลดทั้งหมด ทั้งรูปภาพในเว็บไซต์และไฟล์ BOQ ที่ลูกค้าแนบมากับคำขอใบเสนอราคา
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {usage.volume ? (
          <VolumeFigures volume={usage.volume} />
        ) : (
          <div className="space-y-2">
            <Badge variant="destructive">อ่านพื้นที่ไม่สำเร็จ</Badge>
            <p className="flex items-start gap-2.5 rounded-md border border-destructive/20 bg-destructive/5 p-3 font-body-sm break-words">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              ระบบอ่านพื้นที่ว่างของไดรฟ์ไม่ได้ ตรวจสอบว่าตั้งค่า UPLOAD_DIR ไว้ถูกต้องและโฟลเดอร์ยังเข้าถึงได้
            </p>
          </div>
        )}

        <FileStats usage={usage} />
      </CardContent>
    </Card>
  );
}

function VolumeFigures({ volume }: { volume: NonNullable<StorageUsage["volume"]> }) {
  const level = storageLevel(volume.usedPercent);
  const badge = LEVEL_BADGE[level];
  const usedBytes = volume.totalBytes - volume.freeBytes;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-display-md font-semibold text-primary">
          {formatBytes(usedBytes)}
          <span className="font-label-md text-muted-foreground">
            {" / "}
            {formatBytes(volume.totalBytes)}
          </span>
        </p>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      <Progress
        value={volume.usedPercent}
        className={LEVEL_BAR[level]}
        aria-label={`ใช้พื้นที่ไปแล้ว ${volume.usedPercent}%`}
      />

      <p className="font-body-sm text-muted-foreground">
        ใช้ไปแล้ว {volume.usedPercent}% คงเหลือ {formatBytes(volume.freeBytes)}
      </p>
    </div>
  );
}

function FileStats({ usage }: { usage: StorageUsage }) {
  const rows = [
    {
      label: "รูปภาพและเอกสารในเว็บไซต์",
      value: `${numberFormatter.format(usage.mediaCount)} ไฟล์ · ${formatBytes(usage.mediaBytes)}`,
    },
    {
      label: "ไฟล์ BOQ จากลูกค้า",
      value: `${numberFormatter.format(usage.boqCount)} ไฟล์ · ${formatBytes(usage.boqBytes)}`,
    },
    {
      label: "คำขอเก่าที่สุดที่ยังเก็บข้อมูลลูกค้า",
      value: usage.oldestQuotationAt
        ? dateFormatter.format(usage.oldestQuotationAt)
        : "ไม่มีข้อมูล",
    },
  ];

  return (
    <div className="space-y-3 border-t pt-4">
      <p className="font-label-md">ไฟล์ที่ระบบบันทึกไว้</p>
      <dl className="grid gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="space-y-0.5">
            <dt className="font-label-sm text-muted-foreground">{row.label}</dt>
            <dd className="font-body-sm break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="font-body-sm text-muted-foreground">
        ตัวเลขชุดนี้นับจากฐานข้อมูล จึงน้อยกว่าพื้นที่ที่ใช้จริงได้ถ้ามีไฟล์ตกค้างบนดิสก์
        ระบบลบข้อมูลส่วนบุคคลของคำขอที่เก่ากว่า {QUOTATION_RETENTION_YEARS} ปีโดยอัตโนมัติ
        และลบไปแล้ว {numberFormatter.format(usage.anonymizedCount)} ใบ
      </p>
    </div>
  );
}
