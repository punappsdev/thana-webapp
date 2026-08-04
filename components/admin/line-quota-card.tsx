import { TriangleAlert } from "lucide-react";
import { RefreshLineQuotaButton } from "@/components/admin/refresh-line-quota-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLineSendStats, type LineSendStats } from "@/lib/admin/line-usage";
import { fetchLineMessageQuota } from "@/lib/line/client";
import { getLineAccessToken } from "@/lib/line/config";
import { summarizeLineQuota, type LineQuotaLevel } from "@/lib/line/quota";

const numberFormatter = new Intl.NumberFormat("th-TH");
const dateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
});

const LEVEL_BADGE: Record<LineQuotaLevel, { label: string; variant: "default" | "outline" | "destructive" }> = {
  ok: { label: "โควต้าปกติ", variant: "default" },
  warning: { label: "ใกล้เต็มโควต้า", variant: "outline" },
  critical: { label: "โควต้าเหลือน้อย", variant: "destructive" },
};

/**
 * แถบความคืบหน้าเปลี่ยนเป็นสี error ตอนวิกฤต ให้เห็นจากหางตาโดยไม่ต้องอ่านตัวเลข
 * ระดับ warning ยังใช้สีปกติเพราะชุดสีในโปรเจกต์ไม่มี token สีเตือนที่ใช้นอก toast ได้
 * (ดู --warning-* ใน globals.css ที่ผูกกับ [data-sonner-toaster]) Badge เป็นตัวบอกแทน
 */
const LEVEL_BAR: Record<LineQuotaLevel, string> = {
  ok: "",
  warning: "",
  critical: "[&_[data-slot=progress-indicator]]:bg-destructive",
};

/**
 * การ์ดโควต้าข้อความ LINE ในหน้าตั้งค่าเว็บไซต์
 *
 * เป็น async server component เพราะต้องยิง LINE API ตอน render — หน้าเรียกใช้ผ่าน
 * <Suspense> เพื่อไม่ให้ LINE ที่ช้าหรือ timeout ไปหน่วงการ์ดอื่นในหน้าเดียวกัน
 */
export async function LineQuotaCard() {
  const accessToken = getLineAccessToken();
  const [quota, stats] = await Promise.all([
    accessToken ? fetchLineMessageQuota(accessToken) : null,
    getLineSendStats(),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>โควต้าข้อความ LINE</CardTitle>
        <CardDescription>
          โควต้าข้อความรายเดือนของ LINE Official Account ที่ใช้แจ้งเตือนใบเสนอราคาเข้ากลุ่มทีมขาย โดย LINE จะรีเซ็ตให้ทุกต้นเดือน
        </CardDescription>
        <CardAction>
          <RefreshLineQuotaButton />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        {!accessToken ? (
          <div className="space-y-2">
            <Badge variant="secondary">ยังไม่ได้ตั้งค่า</Badge>
            <p className="font-body-sm text-muted-foreground">
              ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN ระบบจึงอ่านโควต้าไม่ได้และยังไม่ส่งแจ้งเตือนเข้ากลุ่มไลน์
            </p>
          </div>
        ) : quota && !quota.ok ? (
          <div className="space-y-2">
            <Badge variant="destructive">อ่านโควต้าไม่สำเร็จ</Badge>
            <p className="flex items-start gap-2.5 rounded-md border border-destructive/20 bg-destructive/5 p-3 font-body-sm break-words">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              {quota.error}
            </p>
          </div>
        ) : quota && quota.ok ? (
          <QuotaFigures raw={quota.quota} />
        ) : null}

        <SendStats stats={stats} />
      </CardContent>
    </Card>
  );
}

function QuotaFigures({ raw }: { raw: Parameters<typeof summarizeLineQuota>[0] }) {
  const summary = summarizeLineQuota(raw);

  if (summary.unlimited) {
    return (
      <div className="space-y-2">
        <Badge>ไม่จำกัดโควต้า</Badge>
        <p className="font-display-md font-semibold text-primary">
          {numberFormatter.format(summary.used)}
        </p>
        <p className="font-body-sm text-muted-foreground">
          ข้อความที่ส่งไปแล้วในเดือนนี้ แพ็กเกจปัจจุบันไม่จำกัดจำนวนข้อความ
        </p>
      </div>
    );
  }

  const badge = LEVEL_BADGE[summary.level];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-display-md font-semibold text-primary">
          {numberFormatter.format(summary.used)}
          <span className="font-label-md text-muted-foreground">
            {" / "}
            {numberFormatter.format(summary.limit ?? 0)} ข้อความ
          </span>
        </p>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      <Progress
        value={summary.usedPercent}
        className={LEVEL_BAR[summary.level]}
        aria-label={`ใช้โควต้าไปแล้ว ${summary.usedPercent}%`}
      />

      <p className="font-body-sm text-muted-foreground">
        ใช้ไปแล้ว {summary.usedPercent}% คงเหลือ {numberFormatter.format(summary.remaining ?? 0)} ข้อความ
      </p>
    </div>
  );
}

function SendStats({ stats }: { stats: LineSendStats }) {
  const rows = [
    { label: "แจ้งเตือนสำเร็จ", value: `${numberFormatter.format(stats.sentThisMonth)} ใบ` },
    { label: "แจ้งเตือนไม่สำเร็จ", value: `${numberFormatter.format(stats.failedThisMonth)} ใบ` },
    {
      label: "ส่งล่าสุด",
      value: stats.lastSentAt ? dateTimeFormatter.format(stats.lastSentAt) : "ยังไม่เคยส่ง",
    },
  ];

  return (
    <div className="space-y-3 border-t pt-4">
      <p className="font-label-md">ใบเสนอราคาที่ระบบแจ้งเตือนเดือนนี้</p>
      <dl className="grid gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="space-y-0.5">
            <dt className="font-label-sm text-muted-foreground">{row.label}</dt>
            <dd className="font-body-sm break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="font-body-sm text-muted-foreground">
        ตัวเลขชุดนี้นับเป็นจำนวนใบเสนอราคา ไม่ใช่จำนวนข้อความ หนึ่งใบส่งได้หลายข้อความ จึงไม่เท่ากับยอดที่ LINE รายงานด้านบน
      </p>
    </div>
  );
}
