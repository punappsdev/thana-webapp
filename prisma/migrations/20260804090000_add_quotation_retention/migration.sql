-- AlterTable
ALTER TABLE `QuotationRequest` ADD COLUMN `anonymizedAt` DATETIME(3) NULL,
    ADD COLUMN `retainUntil` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `QuotationRequest_anonymizedAt_createdAt_idx` ON `QuotationRequest`(`anonymizedAt`, `createdAt`);
