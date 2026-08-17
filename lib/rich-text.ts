import { sanitizeRichHtml } from "@/lib/admin/security";

/**
 * Convert sanitized editor HTML to plain text for metadata, JSON-LD and text
 * excerpts. Sanitizing first is belt-and-suspenders: legacy rows may predate
 * rich-text persistence, and every downstream consumer here wants text only.
 */
export function richTextToPlainText(value: string | null | undefined): string {
  return decodeHtmlEntities(
    (value ? sanitizeRichHtml(value) : "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|h2|h3|li|blockquote)>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeHtmlEntities(value: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  };
  return value.replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/gi, (entity) => entities[entity.toLowerCase()] ?? entity);
}
