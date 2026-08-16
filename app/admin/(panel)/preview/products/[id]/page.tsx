import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProductEditorRecord } from "@/lib/admin/product-data";
import { sanitizeRichHtml } from "@/lib/admin/security";
import { isDraftSku } from "@/lib/admin/validation";

const richContentClassName = "whitespace-pre-line font-body-md text-muted-foreground [&_h2]:font-headline-md [&_h2]:font-semibold [&_h2]:text-primary [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:font-headline-sm [&_h3]:font-semibold [&_h3]:text-primary [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_hr]:my-4 [&_hr]:border-t [&_hr]:border-border [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic [&_u]:underline [&_s]:line-through [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg";

export default async function ProductPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { id } = await params;
  const { locale = "th" } = await searchParams;
  if (!/^\d+$/.test(id) || !["th", "en"].includes(locale)) notFound();

  const product = await getProductEditorRecord(Number(id));
  if (!product) notFound();

  const name = locale === "en" ? product.nameEn : product.nameTh;
  const description = locale === "en" ? product.descriptionEn : product.descriptionTh;
  const usageGuide = locale === "en" ? product.usageGuideEn : product.usageGuideTh;
  // Re-sanitize legacy values at the rendering boundary before using innerHTML.
  const descriptionHtml = sanitizeRichHtml(description || "");
  const usageGuideHtml = sanitizeRichHtml(usageGuide || "");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <Badge variant="secondary">Preview · {product.published ? "เผยแพร่" : "ฉบับร่าง"}</Badge>
          <h1 className="mt-3 font-headline-lg font-semibold">ตัวอย่างสินค้า</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/admin/products/${product.id}`}>
            <ArrowLeft className="size-4" />
            กลับไปแก้ไข
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-8 p-6 md:grid-cols-2 md:p-10">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            {product.coverImage ? (
              <Image src={product.coverImage} alt={name} fill className="object-cover" sizes="50vw" />
            ) : (
              <Package className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>

          <div>
            <p className="font-label-md text-primary">{isDraftSku(product.sku) ? "" : product.sku}</p>
            <h2 className="mt-2 font-display-md font-semibold">{name}</h2>

            {descriptionHtml.trim() ? (
              <section aria-labelledby="preview-description-heading" className="mt-6">
                <h3 id="preview-description-heading" className="font-headline-sm font-semibold text-primary">
                  คำอธิบาย
                </h3>
                <div className={`mt-3 ${richContentClassName}`} dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
              </section>
            ) : null}

            {usageGuideHtml.trim() ? (
              <section aria-labelledby="preview-usage-heading" className="mt-6">
                <h3 id="preview-usage-heading" className="font-headline-sm font-semibold text-primary">
                  วิธีใช้งาน
                </h3>
                <div className={`mt-3 ${richContentClassName}`} dangerouslySetInnerHTML={{ __html: usageGuideHtml }} />
              </section>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              {product.variants.map((variant, index) => {
                const combination = variant.attributeValueIds
                  .map((valueId) => (locale === "en" ? product.valueLabels[valueId]?.en : product.valueLabels[valueId]?.th) || `#${valueId}`)
                  .join(" / ");
                return (
                  <Badge key={`${variant.sku}-${variant.attributeValueIds.join("-")}`} variant={variant.isDefault ? "default" : "outline"}>
                    {combination || variant.sku || `Variant ${index + 1}`}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
