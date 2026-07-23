import Link from "next/link";
import { ArrowRight, Award, Coins, FolderTree, LayoutGrid, Newspaper, Palette, Ruler, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATALOG_RESOURCES, catalogGroupLabels, catalogGroupOrder, catalogMeta } from "@/lib/admin/catalog-config";
import { getCatalogCounts } from "@/lib/admin/catalog-data";

const icons: Record<string, LucideIcon> = { LayoutGrid, FolderTree, Newspaper, Award, Ruler, Coins, SlidersHorizontal, Palette };

export default async function CatalogHubPage() {
  const counts = await getCatalogCounts();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline-lg font-semibold">ข้อมูลสินค้า</h1>
        <p className="font-body-sm text-muted-foreground">คลังข้อมูลกลางที่สินค้าและบทความนำไปใช้ เลือกหัวข้อที่ต้องการจัดการ</p>
      </div>
      {catalogGroupOrder.map((group) => {
        const resources = CATALOG_RESOURCES.filter((resource) => catalogMeta[resource].group === group);
        return (
          <section key={group} className="space-y-3">
            <h2 className="font-headline-sm font-semibold text-on-surface-variant">{catalogGroupLabels[group]}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {resources.map((resource) => {
                const meta = catalogMeta[resource];
                const Icon = icons[meta.icon] ?? LayoutGrid;
                return (
                  <Link key={resource} href={`/admin/catalog/${resource}`}>
                    <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-blue-md">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-2 font-headline-sm">
                          <span className="flex items-center gap-2">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></span>
                            {meta.plainLabel}
                          </span>
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="font-body-sm text-muted-foreground">{meta.description}</p>
                        <p className="font-label-sm text-muted-foreground/80">{meta.example}</p>
                        <Badge variant="secondary">{counts[resource]} รายการ</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
