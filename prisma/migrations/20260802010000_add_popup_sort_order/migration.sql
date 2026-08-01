-- Lets an admin decide which popup wins when several are published and inside
-- their date window at the same time. Lower number shows first; existing rows
-- all start at 0 and keep falling back to "most recently edited".

-- AlterTable
ALTER TABLE `PromotionPopup` ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `PromotionPopup_sortOrder_idx` ON `PromotionPopup`(`sortOrder`);
