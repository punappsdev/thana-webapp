import "dotenv/config";
import { getPrisma } from "../lib/prisma";
import { reindexProducts } from "../lib/search-index";

/**
 * Rebuilds Product.searchText for the whole catalog.
 * Run after the searchText migration, and any time the indexed fields in
 * lib/search.ts change shape.
 */
async function main() {
  const started = Date.now();
  const count = await reindexProducts();
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`สร้างดัชนีค้นหาใหม่สำเร็จ ${count} รายการ (${seconds} วินาที)`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
