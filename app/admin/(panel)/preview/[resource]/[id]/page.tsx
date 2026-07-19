import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { contentConfigs, isContentResource } from "@/lib/admin/content-config";
import { getContentRecord } from "@/lib/admin/content-data";
import { sanitizeRichHtml } from "@/lib/admin/security";

export default async function AdminContentPreview({ params, searchParams }: { params: Promise<{ resource: string; id: string }>; searchParams: Promise<{ locale?: string }> }) {
  const { resource, id } = await params;
  const { locale = "th" } = await searchParams;
  if (!isContentResource(resource) || !/^\d+$/.test(id) || !["th", "en"].includes(locale)) notFound();
  const record = await getContentRecord(resource, Number(id));
  if (!record) notFound();
  const config = contentConfigs[resource];
  const title = locale === "en" ? record.titleEn : record.titleTh;
  const excerpt = locale === "en" ? record.excerptEn : record.excerptTh;
  const body = locale === "en" ? record.bodyEn : record.bodyTh;

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><Badge variant="secondary">Preview · {record.published ? "เผยแพร่" : "ฉบับร่าง"}</Badge><h1 className="mt-3 font-headline-lg font-semibold">{config.singular}</h1></div><div className="flex gap-2"><Button asChild variant="outline"><Link href={`/admin/content/${resource}/${id}`}><ArrowLeft className="size-4" />กลับไปแก้ไข</Link></Button><Button asChild variant="outline"><Link href={`?locale=${locale === "th" ? "en" : "th"}`}><Languages className="size-4" />{locale === "th" ? "English" : "ภาษาไทย"}</Link></Button></div></div>
    <Card><CardContent className="p-6 md:p-10">
      {record.coverImage ? <div className="relative mb-8 aspect-video overflow-hidden rounded-lg border bg-muted"><Image src={record.coverImage} alt={title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 960px" /></div> : null}
      <h2 className="font-display-md font-semibold text-primary">{title || "ยังไม่มีชื่อในภาษานี้"}</h2>
      {excerpt ? <p className="mt-5 border-l-4 border-primary pl-4 font-body-lg text-muted-foreground">{excerpt}</p> : null}
      {config.bodyKind === "rich" ? <div className="mt-8 space-y-4 font-body-md [&_h2]:font-headline-md [&_h3]:font-headline-sm [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(body) }} /> : <p className="mt-8 whitespace-pre-line font-body-md text-muted-foreground">{body || "ยังไม่มีคำอธิบายในภาษานี้"}</p>}
    </CardContent></Card>
  </div>;
}
