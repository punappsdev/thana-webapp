-- Denormalised search haystack for the product catalog.
-- Populated by lib/search-index.ts; backfill existing rows with `npm run search:reindex`.
-- Intentionally has no index: the column is matched with LIKE '%term%' (a BTREE
-- index cannot serve that) and a FULLTEXT index cannot tokenise Thai.
-- AlterTable
ALTER TABLE `Product` ADD COLUMN `searchText` TEXT NULL;
