"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { CatalogReferenceGroup } from "@/lib/admin/catalog-data";
import type { CatalogResource } from "@/lib/admin/catalog-config";

export function CatalogReferencesDialog({ resource, id, label, count }: { resource: CatalogResource; id: number; label: string; count: number }) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<CatalogReferenceGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/admin/catalog/${resource}/${id}/references`);
      const json = await response.json().catch(() => ({}));
      if (response.ok) setGroups((json.groups as CatalogReferenceGroup[]) ?? []);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [resource, id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (open) void load(); }, [open, load]);

  if (count <= 0) return <span className="text-muted-foreground">ยังไม่ถูกใช้งาน</span>;

  const totalShown = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="h-auto gap-1 p-0 font-body-sm">
          ใช้ใน {count} รายการ
          <ArrowUpRight className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>รายการที่ใช้งาน “{label}”</DialogTitle>
          <DialogDescription>ลิงก์ไปยังรายการที่ผูกอยู่ เพื่อเข้าไปแก้ไขหรือถอดความผูกก่อนลบ</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <p className="py-12 text-center font-body-sm text-muted-foreground">โหลดข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง</p>
        ) : totalShown === 0 ? (
          <p className="py-12 text-center font-body-sm text-muted-foreground">ไม่มีรายการที่ใช้งาน</p>
        ) : (
          <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
            {groups.map((group) => (
              <section key={group.key}>
                <div className="mb-1.5 flex items-center gap-2">
                  <h4 className="font-label-md font-semibold">{group.label}</h4>
                  <Badge variant="secondary">{group.items.length}</Badge>
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-muted"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-body-sm">{item.nameTh}</p>
                        {item.nameEn ? <p className="truncate font-body-sm text-muted-foreground">{item.nameEn}</p> : null}
                        {item.hint ? <p className="truncate font-body-sm text-muted-foreground">{item.hint}</p> : null}
                      </div>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
                {group.truncated ? <p className="mt-1 font-body-sm text-muted-foreground">แสดงเฉพาะ 100 รายการแรก</p> : null}
              </section>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
