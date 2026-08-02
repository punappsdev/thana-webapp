"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ImageOff, Save } from "lucide-react";
import { toast } from "sonner";
import { savePopupAction } from "@/app/admin/(panel)/popups/actions";
import { MediaField } from "@/components/admin/media-field";
import { useNoResetSubmit } from "@/lib/use-no-reset-submit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PromotionPopup } from "@/generated/prisma/client";
import { type ActionResult } from "@/lib/admin/validation";

const initialState: ActionResult = { success: false, message: "" };
const formatDateTime = (date: Date | null) => date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

const frequencyOptions = [
  { value: "ONCE_PER_DAY", label: "ครั้งเดียวต่อวัน", hint: "ผู้เข้าชมคนเดิมเห็นวันละครั้ง (แนะนำ)" },
  { value: "ONCE_PER_SESSION", label: "ครั้งเดียวต่อการเข้าเว็บ", hint: "เห็นครั้งเดียวจนกว่าจะปิดเบราว์เซอร์" },
  { value: "ALWAYS", label: "ทุกครั้งที่เข้าหน้าแรก", hint: "เด้งซ้ำทุกครั้ง — ใช้เมื่อจำเป็นจริง ๆ" },
];

export function PopupForm({ record }: { record: PromotionPopup | null }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(savePopupAction, initialState);
  const handleSubmit = useNoResetSubmit(action);
  const dirtyRef = useRef(false);
  // Controlled so the preview card beside the form tracks the chosen file.
  const [imageUrl, setImageUrl] = useState(record?.imageUrl ?? "");
  const [frequency, setFrequency] = useState<string>(record?.frequency ?? "ONCE_PER_DAY");

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirtyRef.current) event.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    if (state.success) {
      dirtyRef.current = false;
      toast.success(state.message);
      router.push("/admin/popups");
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
      {/* Priority is chosen from the list page ("ตั้งให้แสดง"), not typed here —
          carried along so editing a popup never resets that choice. */}
      <input type="hidden" name="sortOrder" value={record?.sortOrder ?? 0} />
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-headline-lg font-semibold">{record ? "แก้ไข Popup โปรโมชั่น" : "เพิ่ม Popup โปรโมชั่น"}</h1>
            {record ? <Badge variant={isPublished ? "default" : "secondary"}>{isPublished ? "เผยแพร่อยู่" : "ฉบับร่าง"}</Badge> : null}
          </div>
          <p className="font-body-sm text-muted-foreground mt-1">
            รูปโปรโมชั่นที่เด้งขึ้นมาเมื่อผู้เข้าชมเปิดหน้าแรก แสดงได้ทีละหนึ่งรายการ — เลือกว่าจะให้อันไหนขึ้นได้ที่หน้ารายการ Popup
            {isPublished ? "" : " บันทึกร่างได้ทันทีแม้กรอกยังไม่ครบ กรอกให้ครบก่อนกดเผยแพร่"}
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">รูปและลิงก์</CardTitle>
              <CardDescription className="font-body-sm">Popup แสดงเป็นรูปภาพล้วน ข้อความโปรโมชั่นทั้งหมดควรอยู่ในรูป</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-label-md">ชื่อรายการ (สำหรับแอดมิน)</Label>
                <Input id="name" name="name" defaultValue={record?.name ?? ""} placeholder="เช่น โปรโมชั่นกระจกนิรภัย สิงหาคม 2569" className="font-body-sm" />
                <p className="font-body-sm text-muted-foreground">ใช้ในหน้ารายการเท่านั้น ไม่แสดงต่อผู้เข้าชม</p>
                {fieldError("name") ? <p className="font-body-sm text-destructive">{fieldError("name")}</p> : null}
              </div>

              <div className="space-y-2">
                <MediaField
                  name="imageUrl"
                  label="รูป Popup"
                  accept="image"
                  value={imageUrl}
                  onChange={(url) => { setImageUrl(url); markDirty(); }}
                  description="แนะนำสัดส่วนแนวนอน 16:9 (เช่น 1200 x 675 หรือ 1600 x 900 px)"
                />
                {fieldError("imageUrl") ? <p className="font-body-sm text-destructive">{fieldError("imageUrl")}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkUrl" className="font-label-md">ลิงก์เมื่อคลิกรูป</Label>
                <Input id="linkUrl" name="linkUrl" defaultValue={record?.linkUrl ?? ""} placeholder="/promotions หรือ https://..." className="font-body-sm" />
                <p className="font-body-sm text-muted-foreground">เว้นว่างหากไม่ต้องการให้คลิกรูปได้</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="altTh" className="font-label-md">คำอธิบายรูป (ไทย)</Label>
                  <Input id="altTh" name="altTh" defaultValue={record?.altTh ?? ""} className="font-body-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="altEn" className="font-label-md">Image description (English)</Label>
                  <Input id="altEn" name="altEn" defaultValue={record?.altEn ?? ""} className="font-body-sm" />
                </div>
              </div>
              <p className="font-body-sm text-muted-foreground">คำอธิบายรูปใช้กับโปรแกรมอ่านหน้าจอและตอนที่รูปโหลดไม่ขึ้น</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">ช่วงเวลาและความถี่</CardTitle>
              <CardDescription className="font-body-sm">กำหนดว่าจะให้เด้งช่วงไหน และเด้งซ้ำบ่อยแค่ไหน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="font-label-md">เริ่มแสดง</Label>
                  <Input id="startDate" name="startDate" type="datetime-local" defaultValue={formatDateTime(record?.startDate ?? null)} className="font-body-sm" />
                  <p className="font-body-sm text-muted-foreground">เว้นว่าง = เริ่มทันทีที่เผยแพร่</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="font-label-md">หยุดแสดง</Label>
                  <Input id="endDate" name="endDate" type="datetime-local" defaultValue={formatDateTime(record?.endDate ?? null)} className="font-body-sm" />
                  <p className="font-body-sm text-muted-foreground">เว้นว่าง = แสดงจนกว่าจะยกเลิกเผยแพร่</p>
                  {fieldError("endDate") ? <p className="font-body-sm text-destructive">{fieldError("endDate")}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-label-md">ความถี่การแสดง</Label>
                {/* Controlled so the hint below describes the current choice —
                    the hint cannot live inside SelectItem because Radix echoes
                    an item's whole content into the trigger. */}
                <Select name="frequency" value={frequency} onValueChange={(value) => { setFrequency(value); markDirty(); }}>
                  <SelectTrigger className="font-body-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="font-body-sm text-muted-foreground">
                  {frequencyOptions.find((option) => option.value === frequency)?.hint}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="font-headline-sm">ตัวอย่าง</CardTitle>
            <CardDescription className="font-body-sm">สัดส่วนโดยประมาณที่ผู้เข้าชมจะเห็น</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mx-auto w-full overflow-hidden rounded-lg border bg-muted/30">
              {imageUrl ? (
                <Image src={imageUrl} alt="" width={640} height={360} className="h-auto w-full" unoptimized />
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageOff className="size-6" />
                  <p className="font-body-sm">ยังไม่ได้เลือกรูป</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
