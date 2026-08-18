import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";
import { routing } from "@/i18n/routing";

export const revalidate = 3600; // Revalidate every hour

function sitemapEntry(
  path: string,
  options: {
    lastModified?: Date;
    changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    priority?: number;
  } = {}
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl("th", path),
    lastModified: options.lastModified ?? new Date(),
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    alternates: {
      languages: {
        th: absoluteUrl("th", path),
        en: absoluteUrl("en", path),
        "x-default": absoluteUrl(routing.defaultLocale, path),
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    sitemapEntry("/", { changeFrequency: "daily", priority: 1.0 }),
    sitemapEntry("/products", { changeFrequency: "daily", priority: 0.9 }),
    sitemapEntry("/portfolio", { changeFrequency: "weekly", priority: 0.8 }),
    sitemapEntry("/articles", { changeFrequency: "daily", priority: 0.8 }),
    sitemapEntry("/news", { changeFrequency: "weekly", priority: 0.7 }),
    sitemapEntry("/contact", { changeFrequency: "monthly", priority: 0.7 }),
    sitemapEntry("/about", { changeFrequency: "monthly", priority: 0.6 }),
    sitemapEntry("/quote", { changeFrequency: "monthly", priority: 0.6 }),
  ];

  try {
    const [
      categories,
      products,
      articles,
      articleCategories,
      newsList,
      promotions,
    ] = await Promise.all([
      prisma.category.findMany({
        where: { published: true },
        select: {
          slug: true,
          updatedAt: true,
          subCategories: {
            where: { published: true },
            select: { slug: true, updatedAt: true },
          },
        },
      }),
      prisma.product.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.article.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.articleCategory.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.news.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.promotion.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const categoryEntries: MetadataRoute.Sitemap = [];
    for (const cat of categories) {
      categoryEntries.push(
        sitemapEntry(`/products?category=${encodeURIComponent(cat.slug)}`, {
          lastModified: cat.updatedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        })
      );
      for (const sub of cat.subCategories) {
        categoryEntries.push(
          sitemapEntry(
            `/products?category=${encodeURIComponent(cat.slug)}&sub=${encodeURIComponent(sub.slug)}`,
            {
              lastModified: sub.updatedAt,
              changeFrequency: "weekly",
              priority: 0.6,
            }
          )
        );
      }
    }

    const productEntries: MetadataRoute.Sitemap = products.map((product) =>
      sitemapEntry(`/products/${encodeURIComponent(product.slug)}`, {
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    );

    const articleCategoryEntries: MetadataRoute.Sitemap = articleCategories.map((category) =>
      sitemapEntry(`/articles?category=${encodeURIComponent(category.slug)}`, {
        lastModified: category.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    );

    const articleEntries: MetadataRoute.Sitemap = articles.map((article) =>
      sitemapEntry(`/articles/${encodeURIComponent(article.slug)}`, {
        lastModified: article.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    );

    const newsEntries: MetadataRoute.Sitemap = newsList.map((item) =>
      sitemapEntry(`/news/${encodeURIComponent(item.slug)}`, {
        lastModified: item.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    );

    const promotionEntries: MetadataRoute.Sitemap = promotions.map((promo) =>
      sitemapEntry(`/promotions/${encodeURIComponent(promo.slug)}`, {
        lastModified: promo.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    );

    return [
      ...staticPages,
      ...categoryEntries,
      ...productEntries,
      ...articleCategoryEntries,
      ...articleEntries,
      ...newsEntries,
      ...promotionEntries,
    ];
  } catch (error) {
    console.error("[Sitemap Generation Error]", error);
    return staticPages;
  }
}
