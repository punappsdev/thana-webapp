"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { saveBannerAction } from "@/app/admin/(panel)/banners/actions";
import { FormTabPanel } from "@/components/admin/form-tab-panel";
import { MediaField } from "@/components/admin/media-field";
import { useNoResetSubmit } from "@/components/admin/use-no-reset-submit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Banner, BannerType } from "@/generated/prisma/client";
import type { PromotionOption } from "@/lib/admin/banner-data";
import { type ActionResult } from "@/lib/admin/validation";

const initialState: ActionResult = { success: false, message: "" };
const formatDateTime = (date: Date | null) => date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

export function BannerForm({ type, record, promotions }: { type: BannerType; record: Banner | null; promotions: PromotionOption[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveBannerAction, initialState);
  const handleSubmit = useNoResetSubmit(action);
  const dirtyRef = useRef(false);
  const isPromotion = type === "PROMOTION";
  const kindLabel = isPromotion ? "แบนเนอร์โปรโมชั่น" : "แบนเนอร์หน้าแรก";

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirtyRef.current) event.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    if (state.success) {
      dirtyRef.current = false;
      toast.success(state.message);
      router.push("/admin/banners");
      router.refresh();
    } else if (state.message) toast.error(state.message);
  }, [state, router]);

  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];
  const markDirty = () => { dirtyRef.current = true; };
  const isPublished = record?.published ?? false;

  return (
    <form onSubmit={handleSubmit} onChange={markDirty} className="space-y-6">
      <input type="hidden" name="id" value={record?.id || ""} />
      <input type="hidden" name="updatedAt" value={record?.updatedAt.toISOString() || ""} />
      <input type="hidden" name="type" value={type} />
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-headline-lg font-semibold">{record ? `แก้ไข${kindLabel}` : `เพิ่ม${kindLabel}`}</h1>
            {record ? <Badge variant={isPublished ? "default" : "secondary"}>{isPublished ? "เผยแพร่อยู่" : "ฉบับร่าง"}</Badge> : null}
          </div>
          <p className="font-body-sm text-muted-foreground mt-1">
            {isPromotion ? "เชื่อมกับโปรโมชั่นเพื่อให้คลิกแบนเนอร์ไปยังหน้ารายละเอียดได้ แสดงบนสไลด์หน้าข่าว/โปรโมชั่น" : "แสดงบนแบนเนอร์หน้าแรก กรอกหัวข้อสองภาษาให้ครบก่อนเผยแพร่"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPublished ? (
            <>
              <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}><Save className="size-4" />ยกเลิกเผยแพร่ (เปลี่ยนเป็นร่าง)</Button>
              <Button type="submit" name="intent" value="publish" disabled={pending}><Save className="size-4" />บันทึกการแก้ไข</Button>
            </>
          ) : (
            <>
              <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}><Save className="size-4" />บันทึกร่าง</Button>
              <Button type="submit" name="intent" value="publish" disabled={pending}><ExternalLink className="size-4" />เผยแพร่</Button>
            </>
          )}
        </div>
      </div>

      {state.conflict ? <p className="rounded-md border border-destructive bg-error-container p-3 font-body-sm text-on-error-container">{state.message}</p> : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader><CardTitle className="font-headline-sm">เนื้อหาสองภาษา</CardTitle><CardDescription className="font-body-sm">สลับแท็บเพื่อกรอกภาษาไทยและอังกฤษ</CardDescription></CardHeader>
          <CardContent>
            <Tabs defaultValue="th">
              <TabsList><TabsTrigger value="th" className="font-label-md">ไทย</TabsTrigger><TabsTrigger value="en" className="font-label-md">English</TabsTrigger></TabsList>
              <FormTabPanel value="th" className="mt-5 space-y-5">
                <div className="space-y-2"><Label htmlFor="subtitleTh" className="font-label-md">แท็ก / ป้ายกำกับ (ไทย)</Label><Input id="subtitleTh" name="subtitleTh" defaultValue={record?.subtitleTh ?? ""} className="font-body-sm" /><p className="font-body-sm text-muted-foreground">ข้อความสั้น ๆ แสดงเป็นป้ายเหนือหัวข้อ</p></div>
                <div className="space-y-2"><Label htmlFor="titleTh" className="font-label-md">หัวข้อภาษาไทย</Label><Input id="titleTh" name="titleTh" defaultValue={record?.titleTh ?? ""} className="font-body-sm" />{fieldError("titleTh") ? <p className="font-body-sm text-destructive">{fieldError("titleTh")}</p> : null}</div>
                <div className="space-y-2"><Label htmlFor="descriptionTh" className="font-label-md">คำอธิบายภาษาไทย</Label><Textarea id="descriptionTh" name="descriptionTh" defaultValue={record?.descriptionTh ?? ""} rows={4} className="font-body-sm" /></div>
                <div className="space-y-2"><Label htmlFor="buttonTextTh" className="font-label-md">ข้อความบนปุ่ม (ไทย)</Label><Input id="buttonTextTh" name="buttonTextTh" defaultValue={record?.buttonTextTh ?? ""} className="font-body-sm" /><p className="font-body-sm text-muted-foreground">แสดงเมื่อมีลิงก์ปุ่ม (ค่าเริ่มต้น: “อ่านเพิ่มเติม”)</p></div>
              </FormTabPanel>
              <FormTabPanel value="en" className="mt-5 space-y-5">
                <div className="space-y-2"><Label htmlFor="subtitleEn" className="font-label-md">Tag / label (English)</Label><Input id="subtitleEn" name="subtitleEn" defaultValue={record?.subtitleEn ?? ""} className="font-body-sm" /></div>
                <div className="space-y-2"><Label htmlFor="titleEn" className="font-label-md">English title</Label><Input id="titleEn" name="titleEn" defaultValue={record?.titleEn ?? ""} className="font-body-sm" />{fieldError("titleEn") ? <p className="font-body-sm text-destructive">{fieldError("titleEn")}</p> : null}</div>
                <div className="space-y-2"><Label htmlFor="descriptionEn" className="font-label-md">English description</Label><Textarea id="descriptionEn" name="descriptionEn" defaultValue={record?.descriptionEn ?? ""} rows={4} className="font-body-sm" /></div>
                <div className="space-y-2"><Label htmlFor="buttonTextEn" className="font-label-md">Button text (English)</Label><Input id="buttonTextEn" name="buttonTextEn" defaultValue={record?.buttonTextEn ?? ""} className="font-body-sm" /></div>
              </FormTabPanel>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="font-headline-sm">การตั้งค่า</CardTitle></CardHeader><CardContent className="space-y-5">
            <div className="space-y-2">
              <MediaField name="imageUrl" label="รูปแบนเนอร์ (พื้นหลัง)" accept="image" defaultValue={record?.imageUrl} />
              {fieldError("imageUrl") ? <p className="font-body-sm text-destructive">{fieldError("imageUrl")}</p> : null}
            </div>

            {isPromotion ? (
              <>
                <div className="space-y-2">
                  <Label className="font-label-md">โปรโมชั่นที่เชื่อมโยง</Label>
                  <Select name="promotionId" defaultValue={record?.promotionId ? String(record.promotionId) : "none"}>
                    <SelectTrigger className="font-body-sm"><SelectValue placeholder="เลือกโปรโมชั่น" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ยังไม่เชื่อมโยง</SelectItem>
                      {promotions.map((promo) => <SelectItem key={promo.id} value={String(promo.id)}>{promo.titleTh} / {promo.titleEn}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="font-body-sm text-muted-foreground">คลิกแบนเนอร์แล้วไปหน้ารายละเอียดของโปรโมชั่นนี้</p>
                  {fieldError("promotionId") ? <p className="font-body-sm text-destructive">{fieldError("promotionId")}</p> : null}
                </div>
                <div className="space-y-2"><Label htmlFor="startDate" className="font-label-md">วันเริ่มต้น</Label><Input id="startDate" name="startDate" type="datetime-local" defaultValue={formatDateTime(record?.startDate ?? null)} className="font-body-sm" /></div>
                <div className="space-y-2"><Label htmlFor="endDate" className="font-label-md">วันสิ้นสุด (นับถอยหลัง)</Label><Input id="endDate" name="endDate" type="datetime-local" defaultValue={formatDateTime(record?.endDate ?? null)} className="font-body-sm" /><p className="font-body-sm text-muted-foreground">แสดงตัวนับถอยหลังบนแบนเนอร์เมื่อระบุ</p></div>
              </>
            ) : (
              <div className="space-y-2"><Label htmlFor="linkUrl" className="font-label-md">ลิงก์ปุ่ม (URL)</Label><Input id="linkUrl" name="linkUrl" defaultValue={record?.linkUrl ?? ""} placeholder="/products หรือ https://..." className="font-body-sm" /><p className="font-body-sm text-muted-foreground">เว้นว่างหากไม่ต้องการปุ่มลิงก์บนแบนเนอร์</p></div>
            )}

            <div className="space-y-2"><Label htmlFor="sortOrder" className="font-label-md">ลำดับการแสดง</Label><Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={record?.sortOrder ?? 0} className="font-body-sm" /><p className="font-body-sm text-muted-foreground">ตัวเลขน้อยแสดงก่อน</p></div>
          </CardContent></Card>
        </div>
      </div>
    </form>
  );
}
