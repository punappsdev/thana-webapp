/**
 * Emits a JSON-LD structured-data block.
 *
 * The payload is always built server-side from our own database rows or message
 * catalogue, and `<` is escaped so a stray `</script>` inside authored content
 * cannot close the tag early.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
