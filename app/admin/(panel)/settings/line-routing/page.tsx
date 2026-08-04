import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LineRoutingForm } from "@/components/admin/line-routing-form";
import { Button } from "@/components/ui/button";
import { getLineRoutingOptions, getLineRoutingSettings } from "@/lib/admin/line-routing-data";

export default async function LineRoutingSettingsPage() {
  const [settings, options] = await Promise.all([
    getLineRoutingSettings(),
    getLineRoutingOptions(),
  ]);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/admin/settings">
          <ArrowLeft className="size-4" />
          กลับไปหน้าตั้งค่าเว็บไซต์
        </Link>
      </Button>

      <LineRoutingForm settings={settings} options={options} />
    </div>
  );
}
