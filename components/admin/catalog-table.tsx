"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Plus } from "lucide-react";
import { CatalogEditor } from "@/components/admin/catalog-editor";
import { DeleteCatalogButton } from "@/components/admin/delete-catalog-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogLabels, type CatalogResource } from "@/lib/admin/catalog-config";

type Row = Record<string, unknown>;
type Option = { id: number; nameTh: string };

function joinText(row: Row, ...keys: string[]) {
  return keys.map((key) => row[key]).filter((v) => v !== null && v !== undefined && v !== "").join(" / ");
}

function referenceCount(row: Row) {
  const c = row._count;
  return c && typeof c === "object" ? Object.values(c as Record<string, number>).reduce((sum, v) => sum + v, 0) : 0;
}

function parentName(resource: CatalogResource, row: Row): string | null {
  if (resource === "subcategories") return (row.category as { nameTh?: string } | null)?.nameTh ?? null;
  if (resource === "attribute-values") return (row.attribute as { nameTh?: string } | null)?.nameTh ?? null;
  return null;
}

export function CatalogTable({ resource, rows, categories, attributes }: { resource: CatalogResource; rows: Row[]; categories: Option[]; attributes: Option[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | undefined>(undefined);
  const showParent = resource === "subcategories" || resource === "attribute-values";

  const openAdd = () => { setEditRow(undefined); setOpen(true); };
  const openEdit = (row: Row) => { setEditRow(row); setOpen(true); };
  const handleSaved = () => { setOpen(false); router.refresh(); };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd}><Plus className="size-4" />เพิ่มใหม่</Button>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                {showParent ? <TableHead>อยู่ภายใต้</TableHead> : null}
                <TableHead>ใช้งานอยู่</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showParent ? 4 : 3} className="py-16 text-center font-body-sm text-muted-foreground">ยังไม่มีข้อมูล กด “เพิ่มใหม่” เพื่อสร้างรายการแรก</TableCell>
                </TableRow>
              ) : rows.map((row) => {
                const count = referenceCount(row);
                const name = joinText(row, "nameTh", "valueTh", "name") || `${catalogLabels[resource]} #${String(row.id)}`;
                const secondary = joinText(row, "nameEn", "valueEn");
                return (
                  <TableRow key={String(row.id)}>
                    <TableCell>
                      <p className="font-label-md font-semibold">{name}</p>
                      {secondary ? <p className="font-body-sm text-muted-foreground">{secondary}</p> : null}
                    </TableCell>
                    {showParent ? <TableCell>{parentName(resource, row) ? <Badge variant="outline">{parentName(resource, row)}</Badge> : <span className="font-body-sm text-muted-foreground">—</span>}</TableCell> : null}
                    <TableCell className="font-body-sm">{count > 0 ? `ใช้ใน ${count} รายการ` : <span className="text-muted-foreground">ยังไม่ถูกใช้งาน</span>}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label="แก้ไข"><Edit3 className="size-4" /></Button>
                        <DeleteCatalogButton resource={resource} id={Number(row.id)} label={name} referenced={count > 0} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-lg">
          <SheetHeader className="border-b px-5 py-4 pr-14">
            <SheetTitle>{editRow ? `แก้ไข${catalogLabels[resource]}` : `เพิ่ม${catalogLabels[resource]}`}</SheetTitle>
            <SheetDescription>กรอกข้อมูลด้านล่างแล้วกดบันทึก</SheetDescription>
          </SheetHeader>
          <CatalogEditor key={String(editRow?.id ?? "new")} resource={resource} edit={editRow} categories={categories} attributes={attributes} onSaved={handleSaved} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
