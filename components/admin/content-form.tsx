"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, Save } from "lucide-react";
import { toast } from "sonner";
import { saveContentAction } from "@/app/admin/(panel)/content/actions";
import { FormTabPanel } from "@/components/admin/form-tab-panel";
import { MediaField } from "@/components/admin/media-field";
import { useNoResetSubmit } from "@/components/admin/use-no-reset-submit";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ContentConfig } from "@/lib/admin/content-config";
import type { ContentRecord } from "@/lib/admin/content-data";
import { slugifyAdminTitle, type ActionResult } from "@/lib/admin/validation";

const initialState: ActionResult = { success: false, message: "" };
const formatDateTime = (date: Date | null) => date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

export function ContentForm({ config, record, categories }: { config: ContentConfig; record: ContentRecord | null; categories: { id: number; nameTh: string; nameEn: string }[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveContentAction, initialState);
  const handleSubmit = useNoResetSubmit(action);
  const dirtyRef = useRef(false);
  const [titleEn, setTitleEn] = useState(record?.titleEn || "");
  const [slug, setSlug] = useState(record?.slug || "");

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirtyRef.current) event.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    if (state.success) {
      dirtyRef.current = false;
      toast.success(state.message);
      router.push(`/admin/content/${config.resource}`);
      router.refresh();
    } else if (state.message) toast.error(state.message);
  }, [state, config.resource, router]);

  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];
  const markDirty = () => { dirtyRef.current = true; };
  const bodyField = (locale: "Th" | "En") => config.bodyKind === "rich"
    ? <RichTextEditor name={`body${locale}`} initialValue={locale === "Th" ? record?.bodyTh || "" : record?.bodyEn || ""} onDirty={markDirty} />
    : <Textarea name={`body${locale}`} defaultValue={locale === "Th" ? record?.bodyTh : record?.bodyEn} rows={8} className="font-body-sm" />;

  const isPublished = record?.published ?? false;

  return (
    <form onSubmit={handleSubmit} onChange={markDirty} className="space-y-6">
      <input type="hidden" name="resource" value={config.resource} />
      <input type="hidden" name="id" value={record?.id || ""} />
      <input type="hidden" name="updatedAt" value={record?.updatedAt.toISOString() || ""} />
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-headline-lg font-semibold">{record ? `แก้ไข${config.singular}` : `เพิ่ม${config.singular}`}</h1>
            {record ? <Badge variant={isPublished ? "default" : "secondary"}>{isPublished ? "เผยแพร่อยู่" : "ฉบับร่าง"}</Badge> : null}
          </div>
          <p className="font-body-sm text-muted-foreground mt-1">
            {isPublished ? "แก้ไขข้อมูลแล้วกดบันทึก หรือกด 'ยกเลิกเผยแพร่' เพื่อเปลี่ยนกลับเป็นฉบับร่าง" : "บันทึกร่างได้ทันที และกรอกข้อมูลสองภาษาให้ครบก่อนเผยแพร่"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {record ? <Button asChild type="button" variant="outline"><Link href={`/admin/preview/${config.resource}/${record.id}?locale=th`} target="_blank"><Eye className="size-4" />Preview</Link></Button> : null}
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
                <div className="space-y-2"><Label htmlFor="titleTh" className="font-label-md">ชื่อภาษาไทย</Label><Input id="titleTh" name="titleTh" defaultValue={record?.titleTh} className="font-body-sm" />{fieldError("titleTh") ? <p className="font-body-sm text-destructive">{fieldError("titleTh")}</p> : null}</div>
                {config.hasExcerpt ? <div className="space-y-2"><Label htmlFor="excerptTh" className="font-label-md">คำโปรยภาษาไทย</Label><Textarea id="excerptTh" name="excerptTh" defaultValue={record?.excerptTh} rows={3} className="font-body-sm" /></div> : null}
                <div className="space-y-2"><Label className="font-label-md">{config.bodyKind === "rich" ? "เนื้อหาภาษาไทย" : "คำอธิบายภาษาไทย"}</Label>{bodyField("Th")}{fieldError("contentTh") ? <p className="font-body-sm text-destructive">{fieldError("contentTh")}</p> : null}</div>
              </FormTabPanel>
              <FormTabPanel value="en" className="mt-5 space-y-5">
                <div className="space-y-2"><Label htmlFor="titleEn" className="font-label-md">English title</Label><Input id="titleEn" name="titleEn" value={titleEn} onChange={(event) => { setTitleEn(event.target.value); markDirty(); }} onBlur={() => { if (!slug) setSlug(slugifyAdminTitle(titleEn)); }} className="font-body-sm" />{fieldError("titleEn") ? <p className="font-body-sm text-destructive">{fieldError("titleEn")}</p> : null}</div>
                {config.hasExcerpt ? <div className="space-y-2"><Label htmlFor="excerptEn" className="font-label-md">English excerpt</Label><Textarea id="excerptEn" name="excerptEn" defaultValue={record?.excerptEn} rows={3} className="font-body-sm" /></div> : null}
                <div className="space-y-2"><Label className="font-label-md">{config.bodyKind === "rich" ? "English content" : "English description"}</Label>{bodyField("En")}{fieldError("contentEn") ? <p className="font-body-sm text-destructive">{fieldError("contentEn")}</p> : null}</div>
              </FormTabPanel>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="font-headline-sm">การตั้งค่า</CardTitle></CardHeader><CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="slug" className="font-label-md">ชื่อในลิงก์ (URL)</Label>
              <Input id="slug" name="slug" value={slug} onChange={(event) => { setSlug(event.target.value); markDirty(); }} className="font-body-sm" />
              <p className="font-body-sm text-muted-foreground mt-1.5">
                ใช้กำหนดที่อยู่หน้าเว็บของเนื้อหานี้ (ภาษาอังกฤษ ตัวเลข และเครื่องหมายขีดกลางเท่านั้น เช่น news-title-01)
              </p>
              {fieldError("slug") ? <p className="font-body-sm text-destructive">{fieldError("slug")}</p> : null}
            </div>
            <MediaField name="coverImage" label="รูปปก" accept="image" defaultValue={record?.coverImage} />
            {config.categoryKind ? <div className="space-y-2"><Label className="font-label-md">หมวดหมู่</Label><Select name="categoryId" defaultValue={record?.categoryId ? String(record.categoryId) : "none"}><SelectTrigger className="font-body-sm"><SelectValue placeholder="ไม่ระบุหมวดหมู่" /></SelectTrigger><SelectContent><SelectItem value="none">ไม่ระบุหมวดหมู่</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.nameTh} / {category.nameEn}</SelectItem>)}</SelectContent></Select></div> : null}
            {config.hasPromotionDates ? <><div className="space-y-2"><Label htmlFor="startDate" className="font-label-md">วันเริ่มต้น</Label><Input id="startDate" name="startDate" type="datetime-local" defaultValue={formatDateTime(record?.startDate || null)} className="font-body-sm" /></div><div className="space-y-2"><Label htmlFor="endDate" className="font-label-md">วันสิ้นสุด</Label><Input id="endDate" name="endDate" type="datetime-local" defaultValue={formatDateTime(record?.endDate || null)} className="font-body-sm" /></div></> : null}
          </CardContent></Card>
        </div>
      </div>
    </form>
  );
}
