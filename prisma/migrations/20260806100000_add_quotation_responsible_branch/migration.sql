-- AlterTable
ALTER TABLE `QuotationRequest` ADD COLUMN `responsibleBranch` VARCHAR(32) NULL;

-- CreateIndex
CREATE INDEX `QuotationRequest_responsibleBranch_createdAt_idx` ON `QuotationRequest`(`responsibleBranch`, `createdAt`);
