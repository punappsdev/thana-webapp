-- DropIndex
DROP INDEX `Product_published_featured_idx` ON `Product`;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `featuredOrder` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `Product_published_featured_featuredOrder_idx` ON `Product`(`published`, `featured`, `featuredOrder`);
